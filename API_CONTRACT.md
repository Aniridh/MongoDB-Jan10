# API Contract for Frontend Integration

## Endpoint: `POST /api/analyze`

### Request

**Method:** `POST`  
**Content-Type:** `application/json`

**Body:**
```typescript
{
  artifactContent: string;
}
```

**Example:**
```json
{
  "artifactContent": "module counter(input clk, input reset, output reg [3:0] count);\n  always @(posedge clk or posedge reset) begin\n    if (reset) count <= 4'b0000;\n    else count <= count + 1;\n  end\nendmodule"
}
```

### Response

**Success (200 OK):**
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

**Error (400/500):**
```typescript
{
  error: string;
}
```

---

## Frontend UI Mapping

### Tool Output Panel → `toolReport`
- Display as: Plain text or formatted code report
- Shows tool analysis results and suggestions

### Agent Dialogue Panel → `agentMessages`
- Display as: List/chat interface showing agent conversations
- Each message includes:
  - `agentRole`: Which agent (analysis, review, tradeoff, historian)
  - `message`: JSON-stringified agent output (parse for display)
  - `createdAt`: Timestamp for ordering
- **Display order:** Sequential (as returned in array)
- **Note:** Messages are JSON strings - parse before rendering

### Decision History Panel → `decisions`
- Display as: List of decision cards/summaries
- Each decision includes:
  - `_id`: Unique identifier for tracking
  - `summary`: Short decision summary (2-3 sentences)
  - `rationale`: Full reasoning explanation
  - `createdAt`: Timestamp
- **Display order:** Sort by `createdAt` descending (newest first)
- **Recommendation:** Show summary in collapsed view, rationale in expanded detail

---

## Example Response

```json
{
  "toolReport": "Analysis found 3 potential issues: missing reset logic, potential race condition in state machine, and no test coverage...",
  "agentMessages": [
    {
      "agentRole": "analysis",
      "message": "{\"insights\": [\"...\"], \"decisionPoints\": [...]}",
      "createdAt": "2026-01-10T12:00:00.000Z"
    },
    {
      "agentRole": "review",
      "message": "{\"validation\": \"...\", \"gaps\": [...]}",
      "createdAt": "2026-01-10T12:00:01.000Z"
    },
    {
      "agentRole": "tradeoff",
      "message": "{\"tradeoffs\": [\"...\"], \"alternatives\": [...]}",
      "createdAt": "2026-01-10T12:00:02.000Z"
    },
    {
      "agentRole": "historian",
      "message": "{\"decisionSummary\": \"...\", \"decisionRationale\": \"...\"}",
      "createdAt": "2026-01-10T12:00:03.000Z"
    }
  ],
  "decisions": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "summary": "Implement reset functionality to ensure counter starts from known state. Add comprehensive test coverage for edge cases.",
      "rationale": "This decision addresses the critical gap identified in the counter module where no reset mechanism exists. Similar to a prior decision where we handled sequential logic without reset, we recommend adding synchronous reset with active-high polarity. The tradeoff analysis suggests this approach balances simplicity with reliability...",
      "createdAt": "2026-01-10T12:00:04.000Z"
    }
  ]
}
```

---

## Notes for Frontend

1. **Agent Messages:** The `message` field contains JSON strings. Parse with `JSON.parse()` before rendering structured content.

2. **Decision Sorting:** Always sort `decisions` array by `createdAt` in descending order to show newest decisions first.

3. **Error Handling:** Check for `error` field in response. Display user-friendly error messages.

4. **Loading States:** This endpoint may take 5-15 seconds depending on LLM response times. Show appropriate loading indicators.

5. **Agent Roles:** Display agent role badges/icons:
   - `analysis`: 🔍 Analysis Agent
   - `review`: ✓ Review Agent  
   - `tradeoff`: ⚖️ Tradeoff Agent
   - `historian`: 📚 Historian Agent
