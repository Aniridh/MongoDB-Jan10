# Hackathon Setup Guide

**Quick-start guide to get the backend running in any fresh environment.**

This is the single, high-level "start here" guide for hackathon setup. For detailed troubleshooting, see `REALITY_CHECK.md`. For vector index details, see `docs/VECTOR_INDEX.md`.

---

## Environment Variables

**All 6 environment variables must be set:**

1. `MONGODB_URI` - MongoDB Atlas connection string
2. `MONGODB_DB_NAME` - Database name (set to `visibl`)
3. `LLM_API_KEY` - Gemini API key (Google AI Studio API key)
4. `LLM_API_BASE_URL` - Gemini API base URL (e.g., `https://generativelanguage.googleapis.com/v1beta` or OpenAI-compatible service URL)
5. `LLM_MODEL` - Gemini model name (e.g., `gemini-pro`, `gemini-1.5-pro`)
6. `VOYAGE_API_KEY` - Voyage AI API key for embeddings

### Setting Environment Variables

**Locally:**
- Copy `.env.example` to `.env.local` at the repo root
- Fill in all 6 variables with your actual API keys and values
- `.env.local` is ignored by git (never commit secrets)

**In deployment / hackathon platform:**
- Set all 6 variables in your platform's environment configuration:
  - **Vercel:** Settings → Environment Variables
  - **Railway:** Variables tab
  - **Other platforms:** Check platform documentation for environment variable settings

**⚠️ Important:** These are the only 6 environment variables. Do not add or rename variables.

---

## MongoDB Atlas Vector Index

**Critical:** A vector search index must exist before the backend can retrieve similar decisions from memory.

### Index Requirements

- **Index Name:** `vector_index`
- **Collection:** `decisions`
- **Field Path:** `embedding` (must match exactly)
- **Index Type:** Vector Search
- **Dimensions:** `1024` (matches `voyage-large-2` embedding model output)

### Creating the Index

**Via MongoDB Atlas UI:**
1. Navigate to your cluster → **Search** → **Vector Search**
2. Click **Create Index**
3. Select collection: `decisions`
4. Index name: `vector_index`
5. Configuration:
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

**Verification:**
- Go to **Search** → **Vector Search** tab in Atlas UI
- Verify `vector_index` exists on `decisions` collection
- Check field path is exactly `embedding`
- Verify dimensions match (1024)

**📖 Full details:** See `docs/VECTOR_INDEX.md` for complete vector index documentation, troubleshooting, and MongoDB shell creation commands.

---

## Verification Steps (Minimal Dependencies)

These steps require no Node.js dependencies installed—just bash scripts and curl.

### Step 1: Verify Environment Variables

```bash
./scripts/verify-env.sh
```

**Expected:** All 6 env vars show as `OK`; script exits with status 0.

**❌ If any variable is missing:** Set them in your environment (`.env.local` locally, or platform environment settings for deployment).

### Step 2: Start the Server

```bash
npm run dev
```

Or if using Next.js directly:
```bash
next dev
```

**Expected:** Server starts on `http://localhost:3000` (or the configured port) without errors.

**❌ If server won't start:**
- Ensure dependencies are installed: `npm install`
- Check environment variables: `./scripts/verify-env.sh`
- Verify MongoDB connection string is valid
- Check server logs for specific error messages

### Step 3: Run HTTP Smoke Test

```bash
./scripts/http-smoke-test.sh
```

Or with custom API URL:
```bash
API_URL=http://localhost:3000 ./scripts/http-smoke-test.sh
```

**Expected:**
- HTTP 200 response
- `toolReport` field present and non-empty
- `agentMessages` array non-empty (ideally length 4)
- `decisions` array non-empty (length >= 1)
- Each decision has `summary`, `rationale`, and `_id` fields

**❌ If smoke test fails:**
- Check server logs for error messages
- Verify all env vars set correctly (rerun `./scripts/verify-env.sh`)
- Verify MongoDB connection works
- Verify LLM API credentials are valid
- Verify vector index exists (see MongoDB Atlas Vector Index section above)

---

## Optional Full Test (Requires Node Dependencies)

If you have Node.js dependencies installed (`npm install` completed), you can run more comprehensive tests:

### Install Dependencies

```bash
npm install
```

### Run TypeScript Smoke Test

```bash
npx tsx scripts/smoke-test.ts
```

This provides more detailed validation of the response structure.

### Run Memory Seeding Test

```bash
npx tsx scripts/seed-memory.ts
```

This will:
- Call `/api/analyze` multiple times with related artifacts
- Populate the `decisions` collection for vector search
- Wait for MongoDB vector index to update
- Verify that the Historian agent references previous decisions in its rationale

**Expected:** Rationale in second run mentions "previous", "similar", "past", "earlier", or "prior" decisions.

**📖 Full details:** See `SEED_MEMORY.md` for complete memory seeding documentation.

---

## Quick Checklist

Run these in order before demoing or continuing development:

- [ ] Set all 6 environment variables
  - Local: Create `.env.local` with all 6 vars
  - Deployment: Set in platform environment settings
- [ ] Verify `vector_index` exists on `decisions.embedding` in MongoDB Atlas
  - Index name: `vector_index`
  - Field path: `embedding`
  - Dimensions: `1024`
- [ ] Run `./scripts/verify-env.sh` — should pass (all 6 vars present, exit status 0)
- [ ] Start server (`npm run dev`) — should start without errors
- [ ] Run `./scripts/http-smoke-test.sh` — should pass (HTTP 200, all fields present)
- [ ] Run memory seeding once (optional but recommended):
  - Either: `npx tsx scripts/seed-memory.ts`
  - Or: Two manual curl requests with 5-second wait between

**✅ If all checked:** Backend is ready. No more "quick tweaks" needed.

---

## Common Issues

### Environment variables not set
**Fix:** Set in hosting platform environment variables (Vercel → Settings → Environment Variables, Railway → Variables tab, etc.) or create `.env.local` for local development.

### Vector search returns no results
**Fix:**
- Verify index exists in Atlas (see MongoDB Atlas Vector Index section)
- Check index dimensions match embedding dimensions (1024 for voyage-large-2)
- Verify field path is exactly `embedding` (not `decision.embedding` or `data.embedding`)
- Wait longer for indexing (5-10 seconds on free tier after document insertion)

### Server won't start
**Fix:**
- Check dependencies installed: `npm install`
- Check environment variables: `./scripts/verify-env.sh`
- Check MongoDB connection string is valid
- Review server logs for specific error messages

### Smoke test fails with 500 error
**Fix:**
- Check server logs for error messages
- Verify all env vars set correctly (rerun `./scripts/verify-env.sh`)
- Verify MongoDB connection works
- Verify LLM API credentials are valid

---

## Reference Documentation

- **Detailed verification:** `REALITY_CHECK.md` - Pre-demo verification checklist
- **Vector index details:** `docs/VECTOR_INDEX.md` - Complete vector index setup and troubleshooting
- **Memory seeding:** `SEED_MEMORY.md` - How to seed the shared memory for vector search
- **Backend structure:** `BACKEND/README.md` - Backend code organization
- **API contract:** `API_CONTRACT.md` and `FRONTEND_CONTRACT.md` - API specification

---

## Quick Commands Summary

```bash
# 1. Check env vars (no deps needed)
./scripts/verify-env.sh

# 2. Start server
npm run dev

# 3. Smoke test (HTTP - no deps needed)
./scripts/http-smoke-test.sh

# 4. Full tests (requires npm install)
npm install
npx tsx scripts/smoke-test.ts
npx tsx scripts/seed-memory.ts
```