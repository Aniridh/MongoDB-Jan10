# Frontend Integration Contract

## Endpoint: `POST /api/analyze`

### Body
```typescript
{
  "artifactContent": "string"
}
```

### Response
```typescript
{
  toolReport: string;
  agentMessages: {
    agentRole: "analysis" | "review" | "tradeoff" | "historian";
    message: string;
  }[];
  decisions: {
    _id: string;
    summary: string;
    rationale: string;
    createdAt: string;
  }[];
}
```

---

## Mapping to UI Panels

**Tool Output panel** → `toolReport`

**Agent Dialogue** → `agentMessages` (in the order returned)

**Decision History** → `decisions` sorted newest first

---

## API Stability

**Do not change this API. I'll keep it stable. You just render it.**
