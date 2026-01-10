/**
 * Multi-agent orchestration logic
 */

import { Artifact, Report, Decision } from "../types";
import {
  getAnalysisAgentPrompt,
  getReviewAgentPrompt,
  getTradeoffAgentPrompt,
  getHistorianAgentPrompt,
} from "./prompts";
import { SimilarDecision } from "../vector-search";

export interface AgentInputs {
  artifact: Artifact;
  report: Report;
  similarDecisions: SimilarDecision[];
  analysisOutput?: any;
  reviewOutput?: any;
  tradeoffOutput?: any;
}

export interface AgentOutput {
  role: "analysis" | "review" | "tradeoff" | "historian";
  output: any;
}

export interface OrchestrationResult {
  analysis: any;
  review: any;
  tradeoff: any;
  historian: {
    decisionSummary: string;
    decisionRationale: string;
  };
}

/**
 * Call a single agent with the given role and inputs
 */
async function callAgent(role: "analysis" | "review" | "tradeoff" | "historian", inputs: AgentInputs): Promise<any> {
  const apiKey = process.env.LLM_API_KEY;
  const apiBaseUrl = process.env.LLM_API_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is not set");
  }
  if (!apiBaseUrl) {
    throw new Error("LLM_API_BASE_URL environment variable is not set");
  }
  if (!model) {
    throw new Error("LLM_MODEL environment variable is not set");
  }

  let systemPrompt: string;
  let userPrompt: string;

  switch (role) {
    case "analysis":
      systemPrompt = getAnalysisAgentPrompt();
      userPrompt = `Analyze the following artifact and report:\n\nArtifact:\n${inputs.artifact.content}\n\nReport:\n${inputs.report.rawReport}`;
      break;

    case "review":
      systemPrompt = getReviewAgentPrompt();
      userPrompt = `Review the following analysis output:\n\n${JSON.stringify(inputs.analysisOutput, null, 2)}`;
      break;

    case "tradeoff":
      systemPrompt = getTradeoffAgentPrompt();
      userPrompt = `Evaluate trade-offs based on the following:\n\nAnalysis:\n${JSON.stringify(inputs.analysisOutput, null, 2)}\n\nReview:\n${JSON.stringify(inputs.reviewOutput, null, 2)}`;
      break;

    case "historian":
      const similarDecisions = inputs.similarDecisions.map((d) => ({
        summary: d.summary,
        rationale: d.rationale,
      }));
      systemPrompt = getHistorianAgentPrompt(similarDecisions);
      userPrompt = `Synthesize the following outputs into a final decision:\n\nAnalysis:\n${JSON.stringify(inputs.analysisOutput, null, 2)}\n\nReview:\n${JSON.stringify(inputs.reviewOutput, null, 2)}\n\nTradeoff:\n${JSON.stringify(inputs.tradeoffOutput, null, 2)}`;
      break;
  }

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error("Invalid response from LLM API");
  }

  const content = data.choices[0].message?.content;
  if (!content) {
    throw new Error("No content in LLM API response");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse LLM response as JSON: ${error}`);
  }
}

/**
 * Run all agents in sequence: Analysis -> Review -> Tradeoff -> Historian
 */
export async function runAgents(
  artifact: Artifact,
  report: Report,
  similarDecisions: SimilarDecision[]
): Promise<OrchestrationResult> {
  const inputs: AgentInputs = {
    artifact,
    report,
    similarDecisions,
  };

  // 1. Analysis Agent
  const analysisOutput = await callAgent("analysis", inputs);
  inputs.analysisOutput = analysisOutput;

  // 2. Review Agent
  const reviewOutput = await callAgent("review", inputs);
  inputs.reviewOutput = reviewOutput;

  // 3. Tradeoff Agent
  const tradeoffOutput = await callAgent("tradeoff", inputs);
  inputs.tradeoffOutput = tradeoffOutput;

  // 4. Historian Agent
  const historianOutput = await callAgent("historian", inputs);

  if (!historianOutput.decisionSummary || !historianOutput.decisionRationale) {
    throw new Error("Historian agent output must contain decisionSummary and decisionRationale");
  }

  return {
    analysis: analysisOutput,
    review: reviewOutput,
    tradeoff: tradeoffOutput,
    historian: {
      decisionSummary: historianOutput.decisionSummary,
      decisionRationale: historianOutput.decisionRationale,
    },
  };
}
