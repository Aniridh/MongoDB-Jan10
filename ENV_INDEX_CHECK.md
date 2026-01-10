# Environment Variables & Vector Search Index Verification

## ✅ Required Environment Variables

Verify these are set in your **production/hackathon environment** (NOT just `.env.local`):

### Database
- ✅ `MONGODB_URI` - MongoDB Atlas connection string
- ✅ `MONGODB_DB_NAME` - Database name (defaults to `visibl` if not set)

### LLM API
- ✅ `LLM_API_KEY` - API key for LLM provider
- ✅ `LLM_API_BASE_URL` - Base URL for LLM API (e.g., `https://api.openai.com/v1`)
- ✅ `LLM_MODEL` - Model name (e.g., `gpt-4`, `gpt-3.5-turbo`)

### Embeddings
- ✅ `VOYAGE_API_KEY` - Voyage AI API key for embeddings

---

## ✅ MongoDB Atlas Vector Search Index Configuration

### Collection: `decisions`
### Field Path: `embedding`

### Index Requirements:

**Index Name:** `vector_index`

**Index Type:** Vector Search

**Field Mapping:**
- Path: `embedding`
- Type: `knnVector`
- Dimensions: **1024** (for `voyage-large-2` model)

**⚠️ Important:** Verify actual dimensions by:
1. Creating a test embedding using `embedText("test")`
2. Check `embedding.length` - this is the required dimension
3. Update index dimensions to match exactly

### Verification Steps:

1. **Check Index Exists:**
   - Go to MongoDB Atlas → Search → Vector Search
   - Verify index named `vector_index` exists

2. **Verify Dimensions:**
   - Run the verification script: `npx tsx scripts/verify-setup.ts`
   - Or manually check: Create a test embedding and check `embedding.length`
   - Update index dimensions to match the actual embedding dimensions exactly
   - Common: `voyage-large-2` returns 1024 dimensions, but verify dynamically

3. **Verify Field Path:**
   - Confirm path = `embedding`
   - This matches the field in the `decisions` collection schema

4. **Test Query:**
   - Run a test query to ensure the index is working
   - Empty results should NOT throw an error (already handled in code)

### Index Configuration Example (for reference):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

**Note:** Verify dimensions by checking actual embedding length from Voyage API.

---

## ⚠️ Common Issues

1. **Wrong dimensions**: If index has wrong dimensions, vector search will fail
2. **Missing index**: Vector search will fail with aggregation error
3. **Wrong field path**: No results will be returned
4. **Env vars in .env.local only**: Production won't have access to them

---

## Quick Verification

### Option 1: Run Verification Script
```bash
npx tsx scripts/verify-setup.ts
```

This will check:
- ✅ All environment variables are set
- ✅ Embedding dimensions from Voyage API
- ✅ Vector search index exists and works

### Option 2: Manual Test
```bash
curl -X POST https://your-api-url/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"artifactContent": "test code"}'
```

Expected: Should complete without vector search errors even if no similar decisions exist.

---

## Summary

**Critical Checklist:**
1. ✅ All 6 environment variables set in production environment
2. ✅ `vector_index` exists on `decisions` collection
3. ✅ Index field path = `embedding`
4. ✅ Index dimensions match actual Voyage API embedding dimensions (verify with script)
5. ✅ Empty results don't throw errors (already handled)

**Without correct index:** Historian agent becomes a "goldfish" - no memory of past decisions.
