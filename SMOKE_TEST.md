# Smoke Test Guide

## Quick Test

Run the smoke test to verify the `/api/analyze` endpoint is working correctly.

### Prerequisites

1. **Server must be running:**
   ```bash
   npm run dev
   # or
   next dev
   ```

2. **All environment variables set** (see `ENV_INDEX_CHECK.md`)

3. **MongoDB Atlas vector index configured** (see `ENV_INDEX_CHECK.md`)

---

## Test Options

### Option 1: Node.js Script (Recommended)

```bash
npx tsx scripts/smoke-test.ts
```

Or with custom API URL:
```bash
API_URL=http://localhost:3000 npx tsx scripts/smoke-test.ts
```

### Option 2: Bash Script

```bash
./scripts/smoke-test.sh
```

Or with custom API URL:
```bash
API_URL=http://localhost:3000 ./scripts/smoke-test.sh
```

### Option 3: Manual curl

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "artifactContent": "module counter(input clk, input reset, output reg [3:0] count);\n  always @(posedge clk or posedge reset) begin\n    if (reset) count <= 4'\''b0000;\n    else count <= count + 1;\n  end\nendmodule"
  }'
```

---

## Expected Response

```json
{
  "toolReport": "...",
  "agentMessages": [
    {
      "agentRole": "analysis",
      "message": "...",
      "createdAt": "..."
    },
    {
      "agentRole": "review",
      "message": "...",
      "createdAt": "..."
    },
    {
      "agentRole": "tradeoff",
      "message": "...",
      "createdAt": "..."
    },
    {
      "agentRole": "historian",
      "message": "...",
      "createdAt": "..."
    }
  ],
  "decisions": [
    {
      "summary": "...",
      "rationale": "...",
      "embedding": [0.123, 0.456, ...],
      "agentRolesInvolved": ["analysis", "review", "tradeoff", "historian"],
      "createdAt": "..."
    }
  ]
}
```

---

## Validation Checklist

### Response Structure

- ✅ `toolReport`: non-empty realistic text
- ✅ `agentMessages`: length 4
- ✅ `agentMessages` roles: `analysis`, `review`, `tradeoff`, `historian`
- ✅ `decisions`: length ≥ 1
- ✅ Each decision has:
  - ✅ `summary`: string
  - ✅ `rationale`: string
  - ✅ `embedding`: long number array (length > 100)
  - ✅ `agentRolesInvolved`: `["analysis", "review", "tradeoff", "historian"]`
  - ✅ `createdAt`: ISO timestamp string

### MongoDB Collections

After running the test, verify in MongoDB:

- ✅ `artifacts`: 1 document
- ✅ `reports`: 1 document
- ✅ `agent_messages`: 4 documents
- ✅ `decisions`: 1 document

To verify MongoDB collections automatically:
```bash
npx tsx scripts/verify-mongodb.ts
```

---

## Troubleshooting

### Server not running
```bash
Error: fetch failed / ECONNREFUSED
```
**Fix:** Start the server with `npm run dev`

### Environment variables missing
```bash
Error: VOYAGE_API_KEY environment variable is not set
```
**Fix:** Set all required environment variables (see `ENV_INDEX_CHECK.md`)

### Vector search index missing
```bash
Error: Vector search index error
```
**Fix:** Create the `vector_index` in MongoDB Atlas (see `ENV_INDEX_CHECK.md`)

### Agent orchestration failed
```bash
Error: Agent orchestration failed
```
**Fix:** Check `LLM_API_KEY`, `LLM_API_BASE_URL`, and `LLM_MODEL` are set correctly
