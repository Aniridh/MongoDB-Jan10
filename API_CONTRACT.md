# API Contract for Frontend

**DO NOT MODIFY THIS CONTRACT WITHOUT BACKEND APPROVAL**

---

## Endpoint

**POST** `/api/analyze`

---

## Request

### Headers
```
Content-Type: application/json
```

### Body
```typescript
{
  artifactContent: string;
}
```

### Example
```json
{
  "artifactContent": "function calculateTotal(items) { ... }"
}
```

---

## Response

### Success: 200 OK

```typescript
{
  toolReport: string;
  agentMessages: {
    agentRole: "analysis" | "review" | "tradeoff" | "historian";
    message: string;
    createdAt: string;
  }[];
  decisions: {
    _id: string;
    summary: string;
    rationale: string;
    createdAt: string;
  }[];
}
```

### Error: 400 Bad Request

```typescript
{
  error: string;
}
```

### Error: 500 Internal Server Error

```typescript
{
  error: string;
}
```

---

## Response Field Mapping

| Field | Panel | Usage |
|-------|-------|-------|
| `toolReport` | Tool Output panel | Display tool analysis report |
| `agentMessages` | Agent Dialogue panel | Display messages in order: analysis → review → tradeoff → historian |
| `decisions` | Decision History panel | Display decisions sorted newest first (by `createdAt` desc) |

---

## Agent Message Order

Agent messages are returned in execution order:
1. `analysis`
2. `review`
3. `tradeoff`
4. `historian`

**DO NOT** reorder or filter these messages. Display them in the order received.

---

## Decision History Sorting

Sort `decisions` array by `createdAt` descending (newest first).

Use `_id` for unique keys in lists/UI components.

---

## Example Response

```json
{
  "toolReport": "Tool Report\n===========\n\nIssues Found:\n1. Missing input validation\n2. No error handling\n\nSuggestions:\n1. Add unit tests for core functionality\n2. Replace console.log with proper logging",
  "agentMessages": [
    {
      "agentRole": "analysis",
      "message": "{\n  \"keyInsights\": [\"...\"],\n  \"patterns\": [\"...\"]\n}",
      "createdAt": "2026-01-10T12:00:00.000Z"
    },
    {
      "agentRole": "review",
      "message": "{\n  \"challenges\": [\"...\"],\n  \"gaps\": [\"...\"]\n}",
      "createdAt": "2026-01-10T12:00:01.000Z"
    },
    {
      "agentRole": "tradeoff",
      "message": "{\n  \"tensions\": [\"...\"],\n  \"tradeoffs\": [\"...\"]\n}",
      "createdAt": "2026-01-10T12:00:02.000Z"
    },
    {
      "agentRole": "historian",
      "message": "{\n  \"decisionSummary\": \"...\",\n  \"decisionRationale\": \"...\"\n}",
      "createdAt": "2026-01-10T12:00:03.000Z"
    }
  ],
  "decisions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "summary": "This is similar to a previous decision where we...",
      "rationale": "Based on the analysis, review, and tradeoff evaluations, and considering similar past decisions...",
      "createdAt": "2026-01-10T12:00:04.000Z"
    }
  ]
}
```

---

## TypeScript Types (for reference)

```typescript
interface AnalyzeRequest {
  artifactContent: string;
}

interface AnalyzeResponse {
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

interface AnalyzeError {
  error: string;
}
```

---

## Important Notes

1. **DO NOT** modify the request/response structure without backend approval
2. **DO NOT** add additional fields or "improvements" to this contract
3. **DO** handle errors gracefully (400, 500 status codes)
4. **DO** display messages in the order received
5. **DO** sort decisions by `createdAt` descending
6. **DO** use `_id` as unique key for decision lists

---

## Integration Steps

1. Send `artifactContent` from Editor to `/api/analyze`
2. Display `toolReport` in Tool Output panel
3. Display `agentMessages` in Agent Dialogue panel (in order)
4. Display `decisions` in Decision History panel (newest first)

---

**End of Contract**
