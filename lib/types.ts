export interface Artifact {
  _id?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  _id?: string;
  artifactId: string;
  rawReport: string;
  createdAt: Date;
}

export interface AgentMessage {
  _id?: string;
  artifactId: string;
  reportId: string;
  agentRole: "analysis" | "review" | "tradeoff" | "historian";
  message: string;
  createdAt: Date;
}

export interface Decision {
  _id?: string;
  artifactId: string;
  summary: string;
  rationale: string;
  embedding: number[];
  agentRolesInvolved: string[];
  createdAt: Date;
}
