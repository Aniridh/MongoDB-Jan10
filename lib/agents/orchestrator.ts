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

  // Detect if using Gemini native API (vs OpenAI-compatible service)
  const isGeminiNative = apiBaseUrl.includes("generativelanguage.googleapis.com") || model.toLowerCase().startsWith("gemini");

  let response: Response;
  let data: any;

  if (isGeminiNative) {
    // Gemini native API structure
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const url = `${apiBaseUrl}/models/${model}:generateContent?key=${apiKey}`;
    
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    data = await response.json();
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error("Invalid response from Gemini API: missing candidates array");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error("Invalid response from Gemini API: missing content parts");
    }

    const content = candidate.content.parts[0].text;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new Error("No content in Gemini API response or content is empty");
    }

    if (content.length > 10000) {
      throw new Error(`Gemini response too long (${content.length} chars). Maximum allowed: 10000`);
    }

    // let parsed: any;
    // try {
    //   parsed = JSON.parse(content);
    // } catch (error) {
    //   throw new Error(`Failed to parse Gemini response as JSON: ${error}. Raw content: ${content.substring(0, 200)}`);
    // }

    // if (!parsed || typeof parsed !== "object") {
    //   throw new Error("Gemini response parsed to non-object value");
    // }

    // return parsed;
    return content.trim();

  } else {
    // OpenAI-compatible API structure (for OpenAI, Anthropic via proxy, or OpenAI-compatible Gemini services)
    response = await fetch(`${apiBaseUrl}/chat/completions`, {
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
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    data = await response.json();
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error("Invalid response from LLM API: missing choices array");
    }

    const content = data.choices[0].message?.content;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new Error("No content in LLM API response or content is empty");
    }

    if (content.length > 10000) {
      throw new Error(`LLM response too long (${content.length} chars). Maximum allowed: 10000`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${error}. Raw content: ${content.substring(0, 200)}`);
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("LLM response parsed to non-object value");
    }

    return parsed;
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
  // const historianOutput = await callAgent("historian", inputs);

  // if (!historianOutput || typeof historianOutput !== "object") {
  //   throw new Error("Historian agent returned invalid output: not an object");
  // }
  let historianOutput = await callAgent("historian", inputs);

// If the agent returns plain text, wrap it
if (typeof historianOutput === "string") {
  historianOutput = {
    decisionSummary: historianOutput.trim(),
    decisionRationale: historianOutput.trim(),
  };
}


  const decisionSummary = historianOutput.decisionSummary;
  const decisionRationale = historianOutput.decisionRationale;

  if (!decisionSummary || typeof decisionSummary !== "string" || decisionSummary.trim().length === 0) {
    throw new Error("Historian agent output must contain decisionSummary as a non-empty string");
  }

  if (!decisionRationale || typeof decisionRationale !== "string" || decisionRationale.trim().length === 0) {
    throw new Error("Historian agent output must contain decisionRationale as a non-empty string");
  }

  return {
    analysis: analysisOutput,
    review: reviewOutput,
    tradeoff: tradeoffOutput,
    historian: {
      decisionSummary: decisionSummary.trim(),
      decisionRationale: decisionRationale.trim(),
    },
  };
}
