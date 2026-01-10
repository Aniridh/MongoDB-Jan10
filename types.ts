export type AgentRole = 'analysis' | 'review' | 'tradeoff' | 'historian';

export interface AgentMessage {
  agentRole: AgentRole;
  message: string;
  createdAt: string;
}

export interface Decision {
  summary: string;
  rationale: string;
  createdAt: string;
}

export interface AnalyzeResponse {
  toolReport: string;
  agentMessages: AgentMessage[];
  decisions: Decision[];
}

export interface AnalyzeRequest {
  artifactContent: string;
}

