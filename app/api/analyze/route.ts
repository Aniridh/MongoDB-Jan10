import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createFakeReport } from "@/lib/fakeReport";
import { embedText, findSimilarDecisions, runAgents } from "@/lib/agentB";
import type {
  Artifact,
  Report,
  AgentMessage,
  Decision,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artifactContent } = body;

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

    const db = await getDb();

    // 2. Save or update artifact
    const artifactsCollection = db.collection<Artifact>("artifacts");
    
    const existingArtifact = await artifactsCollection.findOne({
      content: artifactContent,
    });

    const now = new Date();
    let artifactId: string;

    if (existingArtifact) {
      // Update existing artifact
      // MongoDB returns _id as ObjectId, convert to string
      artifactId = (existingArtifact._id as any).toString();
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
    }

    // 3. Generate fake tool report
    const toolReport = createFakeReport(artifactContent);

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
    let embedding: number[];
    let similarDecisions: Array<{ decision: any; similarity: number }> = [];
    let agentResults: Array<{
      agentRole: "analysis" | "review" | "tradeoff" | "historian";
      message: string;
    }> = [];

    try {
      // Generate embedding from artifact content + tool report
      const textToEmbed = `${artifactContent}\n\n${toolReport}`;
      embedding = await embedText(textToEmbed);

      // Find similar decisions
      similarDecisions = await findSimilarDecisions(embedding);

      // Run agents
      agentResults = await runAgents(artifactContent, toolReport, similarDecisions);
    } catch (error) {
      // If Agent B utilities are not implemented yet, use empty defaults
      console.error("Agent B utilities not available:", error);
      embedding = [];
      similarDecisions = [];
      agentResults = [];
    }

    // 6. Persist agent messages
    const agentMessagesCollection = db.collection<AgentMessage>("agent_messages");
    const agentMessages: AgentMessage[] = [];

    for (const result of agentResults) {
      const agentMessage: Omit<AgentMessage, "_id"> = {
        artifactId,
        reportId,
        agentRole: result.agentRole,
        message: result.message,
        createdAt: now,
      };
      const msgResult = await agentMessagesCollection.insertOne(agentMessage);
      agentMessages.push({
        _id: msgResult.insertedId.toString(),
        ...agentMessage,
      });
    }

    // 7. Persist new decision
    const decisionsCollection = db.collection<Decision>("decisions");
    const agentRolesInvolved = agentResults.map((r) => r.agentRole);
    
    const decisionSummary = agentResults.length > 0
      ? agentResults.map((r) => `${r.agentRole}: ${r.message.slice(0, 100)}`).join(" | ")
      : "No agent analysis available";
    
    const decisionRationale = agentResults.length > 0
      ? agentResults.map((r) => r.message).join("\n\n")
      : "Waiting for agent implementation";

    const newDecision: Omit<Decision, "_id"> = {
      artifactId,
      summary: decisionSummary,
      rationale: decisionRationale,
      embedding,
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
      decisions: [{
        summary: decision.summary,
        rationale: decision.rationale,
        agentRolesInvolved: decision.agentRolesInvolved,
        createdAt: decision.createdAt.toISOString(),
      }],
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
