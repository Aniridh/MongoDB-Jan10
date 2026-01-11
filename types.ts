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

export interface ContractFindingsStats {
  total: number;
  bySeverity: {
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    missing: number;
    ambiguous: number;
    risk: number;
  };
  autoFixable: number;
}

export interface AnalyzeResponse {
  toolReport: string;
  agentMessages: AgentMessage[];
  decisions: Decision[];
  findings?: {
    statistics: ContractFindingsStats;
    raw?: any; // ContractAnalysisResult for export
  };
}

export interface AnalyzeRequest {
  artifactContent: string;
}

