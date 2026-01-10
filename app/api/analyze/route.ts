import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createFakeReport } from "@/lib/fakeReport";
import {
  embedText,
  findSimilarDecisions,
  runAgents,
  type SimilarDecision,
  type OrchestrationResult,
} from "@/lib/agentB";
import type {
  Artifact,
  Report,
  AgentMessage,
  Decision,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { artifactContent } = body;

    // 1. Validate artifactContent
    if (!artifactContent || typeof artifactContent !== "string") {
      return NextResponse.json(
        { error: "artifactContent is required and must be a string" },
        { status: 400 }
      );
    }

    if (artifactContent.trim().length === 0) {
      return NextResponse.json(
        { error: "artifactContent cannot be empty" },
        { status: 400 }
      );
    }

    // Parse VISIBL_GOAL and VISIBL_FOLLOWUP from artifact content
    let goal: string | null = null;
    let followup: string | null = null;
    let cleanArtifactContent = artifactContent;

    // Extract VISIBL_GOAL
    const goalMatch = artifactContent.match(/\[VISIBL_GOAL=([^\]]+)\]/);
    if (goalMatch) {
      goal = goalMatch[1];
      cleanArtifactContent = cleanArtifactContent.replace(/\[VISIBL_GOAL=[^\]]+\]\n?/, '');
    }

    // Extract VISIBL_FOLLOWUP
    const followupMatch = artifactContent.match(/\[VISIBL_FOLLOWUP=([^\]]+)\]/);
    if (followupMatch) {
      followup = followupMatch[1];
      cleanArtifactContent = cleanArtifactContent.replace(/\[VISIBL_FOLLOWUP=[^\]]+\]\n?/, '');
    }

    // Use clean content for storage and processing
    artifactContent = cleanArtifactContent.trim();

    if (artifactContent.length === 0) {
      return NextResponse.json(
        { error: "artifactContent cannot be empty after parsing" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 2. Save or update artifact
    const artifactsCollection = db.collection<Artifact>("artifacts");
    
    const existingArtifact = await artifactsCollection.findOne({
      content: artifactContent,
    });

    const now = new Date();
    let artifactId: string;
    let artifactCreatedAt: Date;

    if (existingArtifact) {
      // Update existing artifact
      artifactId = (existingArtifact._id as any).toString();
      artifactCreatedAt = existingArtifact.createdAt;
      await artifactsCollection.updateOne(
        { _id: existingArtifact._id },
        { $set: { updatedAt: now } }
      );
    } else {
      // Create new artifact
      const newArtifact: Omit<Artifact, "_id"> = {
        content: artifactContent,
        createdAt: now,
        updatedAt: now,
      };
      const result = await artifactsCollection.insertOne(newArtifact);
      artifactId = result.insertedId.toString();
      artifactCreatedAt = now;
    }

    // 3. Generate fake tool report (goal-aware)
    const toolReport = createFakeReport(artifactContent, goal);

    // 4. Save report
    const reportsCollection = db.collection<Report>("reports");
    const newReport: Omit<Report, "_id"> = {
      artifactId,
      rawReport: toolReport,
      createdAt: now,
    };
    const reportResult = await reportsCollection.insertOne(newReport);
    const reportId = reportResult.insertedId.toString();

    // 5. Call Agent B's utilities
    const artifact: Artifact = {
      content: artifactContent,
      createdAt: artifactCreatedAt,
      updatedAt: now,
    };

    const report: Report = {
      artifactId,
      rawReport: toolReport,
      createdAt: now,
    };

    let similarDecisions: SimilarDecision[] = [];
    let orchestrationResult: OrchestrationResult | null = null;
    let initialEmbedding: number[] = [];

    try {
      // Generate initial embedding from artifact content + tool report for vector search
      const textToEmbed = `${artifactContent}\n\n${toolReport}`;
      initialEmbedding = await embedText(textToEmbed);

      // Find similar decisions (handle empty results gracefully)
      try {
        similarDecisions = await findSimilarDecisions(initialEmbedding);
      } catch (error) {
        // Vector search may fail if no index exists or no results - continue with empty array
        similarDecisions = [];
      }

      // Run agents (goal-aware)
      orchestrationResult = await runAgents(artifact, report, similarDecisions, goal, followup);
    } catch (error) {
      console.error("Agent B utilities error:", error);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Agent orchestration failed",
        },
        { status: 500 }
      );
    }

    if (!orchestrationResult) {
      return NextResponse.json(
        { error: "Agent orchestration returned no result" },
        { status: 500 }
      );
    }

    // 6. Persist agent messages in execution order
    const agentMessagesCollection = db.collection<AgentMessage>("agent_messages");
    const agentMessages: AgentMessage[] = [];

    const agentOutputs = [
      { role: "analysis" as const, output: orchestrationResult.analysis },
      { role: "review" as const, output: orchestrationResult.review },
      { role: "tradeoff" as const, output: orchestrationResult.tradeoff },
      { role: "historian" as const, output: orchestrationResult.historian },
    ];

    for (const agentOutput of agentOutputs) {
      // Store plain text directly (agents now return strings instead of JSON objects)
      let messageText: string;
      if (typeof agentOutput.output === "string") {
        messageText = agentOutput.output;
      } else if (agentOutput.output && typeof agentOutput.output === "object") {
        // For historian, it's still an object with decisionSummary and decisionRationale
        messageText = JSON.stringify(agentOutput.output, null, 2);
      } else {
        messageText = String(agentOutput.output);
      }

      const agentMessage: Omit<AgentMessage, "_id"> = {
        artifactId,
        reportId,
        agentRole: agentOutput.role,
        message: messageText,
        createdAt: now,
      };
      const msgResult = await agentMessagesCollection.insertOne(agentMessage);
      agentMessages.push({
        _id: msgResult.insertedId.toString(),
        ...agentMessage,
      });
    }

    // 7. Persist decision with embedding from artifact+report (same as search query)
    const decisionSummary = orchestrationResult.historian.decisionSummary;
    const decisionRationale = orchestrationResult.historian.decisionRationale;

    // Use the same embedding we searched with (artifact+report) for consistency
    // This ensures similar artifacts find similar past decisions
    if (initialEmbedding.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate embedding for decision storage" },
        { status: 500 }
      );
    }

    const decisionsCollection = db.collection<Decision>("decisions");
    const agentRolesInvolved = ["analysis", "review", "tradeoff", "historian"];

    const newDecision: Omit<Decision, "_id"> = {
      artifactId,
      summary: decisionSummary,
      rationale: decisionRationale,
      embedding: initialEmbedding,
      agentRolesInvolved,
      createdAt: now,
    };

    const decisionResult = await decisionsCollection.insertOne(newDecision);
    const decision: Decision = {
      _id: decisionResult.insertedId.toString(),
      ...newDecision,
    };

    // 8. Return structured JSON
    return NextResponse.json({
      toolReport,
      agentMessages: agentMessages.map((msg) => ({
        agentRole: msg.agentRole,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      })),
      decisions: [
        {
          _id: decision._id!,
          summary: decision.summary,
          rationale: decision.rationale,
          createdAt: decision.createdAt.toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
