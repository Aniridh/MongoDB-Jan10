# Frontend Integration Contract

## Endpoint: `POST /api/analyze`

### Request Body
```typescript
{
  artifactContent: string;
}
```

### Response Shape (simplified)
```typescript
{
  toolReport: string;
  agentMessages: Array<{
    agentRole: "analysis" | "review" | "tradeoff" | "historian";
    message: string;
    createdAt: string;
  }>;
  decisions: Array<{
    _id: string;
    summary: string;
    rationale: string;
    createdAt: string;
  }>;
}
```

---

## UI Panel Mapping

**Tool Output panel** → `toolReport`

**Agent Dialogue panel** → `agentMessages`

**Decision History panel** → `decisions` (sorted by `createdAt` descending)
