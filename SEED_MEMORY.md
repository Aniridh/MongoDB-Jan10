# Seed Memory Guide

## Purpose

Seed the "shared brain" (vector search memory) with similar artifacts so the Historian agent can reference previous decisions.

## How It Works

1. **Run 1**: Submit a buggy artifact (e.g., missing tests, janky logic)
2. **Wait**: MongoDB vector index updates (3 seconds)
3. **Run 2**: Submit the same artifact with minor changes (variable rename, added comment, minor logic adjustment)
4. **Verify**: Second run's Historian rationale should mention previous decisions

---

## Quick Test

### Option 1: Detailed Seed Script (Recommended)

```bash
npx tsx scripts/seed-memory.ts
```

This will:
- Run both artifacts automatically
- Wait for indexing
- Analyze the historian rationale
- Verify MongoDB collections
- Check if vector search is working

### Option 2: Quick Seed Script

```bash
npx tsx scripts/quick-seed.ts
```

Minimal output, faster execution.

### Option 3: Manual Testing

```bash
# Run 1: Buggy artifact
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "artifactContent": "function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}"
  }'

# Wait 3-5 seconds, then...

# Run 2: Modified artifact
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "artifactContent": "function calculateTotal(items) {\n  let total = 0;\n  if (!items || items.length === 0) return 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price * (items[i].quantity || 1);\n  }\n  return total;\n}"
  }'
```

---

## Expected Results

### MongoDB Collections

After seeding, verify in MongoDB:

- ✅ `decisions`: **≥ 2 documents**
  - Run 1 creates decision #1
  - Run 2 creates decision #2

### Response from Run 2

The historian rationale in Run 2 should include phrases like:

- ✅ "This is similar to a previous decision where..."
- ✅ "Based on a similar past decision..."
- ✅ "Similar to an earlier decision..."
- ✅ "In a previous similar case..."

Or explicitly reference the previous decision's summary/rationale.

---

## Troubleshooting

### Historian doesn't mention previous decisions

**Possible causes:**

1. **Vector index not configured correctly**
   - Check: `ENV_INDEX_CHECK.md`
   - Verify: Index exists, dimensions match, field path is `embedding`

2. **Not enough time for indexing**
   - Free tier MongoDB Atlas may take longer to index
   - Solution: Increase wait time in script (change 3000ms to 5000ms)

3. **Embeddings too different**
   - If artifacts are very different, vector search won't find them similar
   - Solution: Use more similar artifacts (same function, just minor changes)

4. **No similar decisions found**
   - Vector search returned empty results
   - Check: API logs should show if `similarDecisions` array is empty

### How to Debug

1. **Check vector search is finding results:**
   ```bash
   # Add logging in app/api/analyze/route.ts after line 108:
   console.log("Similar decisions found:", similarDecisions.length);
   ```

2. **Verify first decision was saved:**
   ```bash
   npx tsx scripts/verify-mongodb.ts
   ```

3. **Check embedding dimensions:**
   ```bash
   npx tsx scripts/verify-setup.ts
   ```

4. **Test with more similar artifacts:**
   - Try using the exact same artifact twice (should definitely match)
   - Then try with minor variable name changes

---

## Success Criteria

✅ **Working correctly when:**
- `decisions` collection has ≥ 2 documents
- Run 2's historian rationale mentions "previous", "similar", "past", "earlier", or "prior"
- Vector search found at least 1 similar decision

❌ **Needs fixing when:**
- `decisions` collection has < 2 documents
- Historian rationale never mentions previous decisions (even after multiple runs)
- Vector search always returns empty results

---

## Example Artifacts for Seeding

### JavaScript Function

**Run 1 (Buggy):**
```javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
```

**Run 2 (Fixed):**
```javascript
function calculateTotal(items) {
  let total = 0;
  if (!items || items.length === 0) return 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * (items[i].quantity || 1);
  }
  return total;
}
```

### React Component

**Run 1 (Buggy):**
```jsx
function UserCard({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Run 2 (Fixed):**
```jsx
function UserCard({ user }) {
  if (!user) return null;
  return (
    <div className="user-card">
      <h1>{user.name || "Unknown"}</h1>
      <p>{user.email || "No email"}</p>
    </div>
  );
}
```

### API Route

**Run 1 (Buggy):**
```typescript
export async function GET(request: Request) {
  const data = await fetch("https://api.example.com/data");
  return Response.json(data);
}
```

**Run 2 (Fixed):**
```typescript
export async function GET(request: Request) {
  try {
    const data = await fetch("https://api.example.com/data");
    if (!data.ok) throw new Error("Failed to fetch");
    return Response.json(await data.json());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```
