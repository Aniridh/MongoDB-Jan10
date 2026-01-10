# Reality Check: Pre-Demo Verification

**Run this in your actual hackathon environment before demoing to judges.**

---

## ✅ Step 1: Environment Variables Verification

**All 6 environment variables must be set in BOTH:**
- **Local development:** `.env.local` (copy from `.env.example`)
- **Deployment/hackathon:** Platform environment variable settings (Vercel, Railway, etc.)

### Required Environment Variables

The exact variable names (do not change these):

1. `MONGODB_URI` - MongoDB Atlas connection string
2. `MONGODB_DB_NAME` - Database name (set to "visibl")
3. `LLM_API_KEY` - Gemini API key (Google AI Studio API key)
4. `LLM_API_BASE_URL` - Gemini API base URL (e.g., https://generativelanguage.googleapis.com/v1beta)
5. `LLM_MODEL` - Gemini model name (e.g., gemini-pro, gemini-1.5-pro)
6. `VOYAGE_API_KEY` - Voyage AI API key for embeddings

### Quick Check (No Dependencies Required)

**First step: Run this script to validate all env vars are set:**
```bash
./scripts/verify-env.sh
```

### Manual Check

Verify these environment variables are set in your **actual demo environment**:

```bash
echo $MONGODB_URI        # Should show MongoDB connection string
echo $MONGODB_DB_NAME    # Should show "visibl" or your db name
echo $LLM_API_KEY        # Should show API key (masked)
echo $LLM_API_BASE_URL   # Should show base URL
echo $LLM_MODEL          # Should show model name
echo $VOYAGE_API_KEY     # Should show Voyage API key (masked)
```

**✅ PASS if:** All 6 variables are set  
**❌ FAIL if:** Any variable is missing → Set them in your hosting platform (Vercel, Railway, etc.) or create `.env.local` from `.env.example` for local development

---

## ✅ Step 2: MongoDB Atlas Vector Index Verification

**See `docs/VECTOR_INDEX.md` for detailed Vector Search index requirements.**

### Quick Checklist

**Index Name:** `vector_index`  
**Collection:** `decisions`  
**Field Path:** `embedding`  
**Index Type:** Vector Search  
**Dimensions:** Must match Voyage model output (1024 for `voyage-large-2`)

### In MongoDB Atlas UI:

1. **Go to:** Search → Vector Search
2. **Verify:** Index named `vector_index` exists on `decisions` collection
3. **Check:**
   - Field path: `embedding` (must match exactly)
   - Dimensions: **1024** (or verify dynamically using `scripts/verify-setup.ts` if present)
   - Index type: Vector Search

**✅ PASS if:** Index exists with correct field path (`embedding`) and matching dimensions  
**❌ FAIL if:** Index missing, wrong field path, or dimension mismatch → See `docs/VECTOR_INDEX.md` for creation steps

---

## ✅ Step 3: Smoke Test (Requires Server Running)

### Prerequisites
- Server must be running: `npm run dev` (or deployed URL)
- All environment variables set
- MongoDB vector index configured

### Option A: HTTP Test (No Dependencies Required)

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"artifactContent":"function test() { return 1; }"}' \
  | jq '.'
```

**Expected Response:**
```json
{
  "toolReport": "...",
  "agentMessages": [
    {"agentRole": "analysis", "message": "...", "createdAt": "..."},
    {"agentRole": "review", "message": "...", "createdAt": "..."},
    {"agentRole": "tradeoff", "message": "...", "createdAt": "..."},
    {"agentRole": "historian", "message": "...", "createdAt": "..."}
  ],
  "decisions": [
    {
      "_id": "...",
      "summary": "...",
      "rationale": "...",
      "createdAt": "..."
    }
  ]
}
```

### Option B: Script Test (Requires Dependencies Installed)

```bash
# Install dependencies first (if needed)
npm install

# Then run smoke test
npx tsx scripts/smoke-test.ts
```

### Validation Checklist

- ✅ **HTTP Status:** 200 OK
- ✅ **toolReport:** Non-empty string
- ✅ **agentMessages.length:** Exactly 4
- ✅ **agentMessages roles:** ["analysis", "review", "tradeoff", "historian"] (all present)
- ✅ **decisions.length:** >= 1
- ✅ **decision.summary:** Non-empty string
- ✅ **decision.rationale:** Non-empty string
- ✅ **decision._id:** Present (string)

**✅ PASS if:** All checks pass  
**❌ FAIL if:** Any check fails → Debug error messages, check logs

---

## ✅ Step 4: Memory Seeding Test (Vector Search Verification)

### Prerequisites
- Server running
- Smoke test passed
- MongoDB vector index exists

### Option A: HTTP Test (Manual)

```bash
# Run 1: Buggy artifact
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "artifactContent": "function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}"
  }' > /tmp/run1.json

# Wait 3-5 seconds for indexing
sleep 5

# Run 2: Modified artifact
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "artifactContent": "function calculateTotal(items) {\n  let total = 0;\n  if (!items || items.length === 0) return 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price * (items[i].quantity || 1);\n  }\n  return total;\n}"
  }' > /tmp/run2.json

# Check Run 2 rationale for previous decision mention
cat /tmp/run2.json | jq -r '.decisions[0].rationale' | grep -iE "previous|similar|past|earlier|prior" && echo "✅ Vector search working!" || echo "❌ Vector search not working"
```

### Option B: Script Test (Requires Dependencies)

```bash
npx tsx scripts/seed-memory.ts
```

### Validation Checklist

- ✅ **MongoDB decisions collection:** >= 2 documents
- ✅ **Run 2 rationale:** Contains phrases like:
  - "previous"
  - "similar"
  - "past"
  - "earlier"
  - "prior"
  - "this is similar"
  - "similar to a previous"

**✅ PASS if:** Decisions >= 2 AND rationale mentions previous decisions  
**❌ FAIL if:** Not passing → Check vector index exists, dimensions match, indexing complete

---

## 🚨 Common Issues & Fixes

### Issue: Environment variables not set
**Fix:** Set in hosting platform environment variables (Vercel → Settings → Environment Variables)

### Issue: Vector search returns no results
**Fix:** 
- Verify index exists in Atlas (see `docs/VECTOR_INDEX.md`)
- Check index dimensions match embedding dimensions (1024 for voyage-large-2)
- Verify field path is exactly `embedding`
- Wait longer for indexing (5-10 seconds on free tier)

### Issue: Server won't start
**Fix:**
- Check dependencies installed: `npm install`
- Check environment variables: `./scripts/verify-env.sh`
- Check MongoDB connection string is valid

### Issue: Smoke test fails with 500 error
**Fix:**
- Check server logs for error messages
- Verify all env vars set correctly
- Verify MongoDB connection works
- Verify LLM API credentials valid

---

## ✅ Quick Checklist

**Run these in order before demoing to judges:**

- [ ] Set all 6 environment variables (see Step 1 for exact names)
  - Local: Copy `.env.example` to `.env.local` and fill in your Gemini API key and other values
  - Deployment: Set in hosting platform environment settings
- [ ] Run `./scripts/verify-env.sh` - should pass (all 6 vars present)
- [ ] Verify MongoDB vector index exists with correct dimensions (Step 2)
- [ ] Start server: `npm run dev` (or deploy)
- [ ] Run `./scripts/http-smoke-test.sh` - should pass (200 response, all fields present)
- [ ] Memory seeding works: Run 2 similar artifacts, check rationale mentions "previous" or "similar"
- [ ] Server runs without errors
- [ ] No console errors in logs

**If all checked:** ✅ **Backend is locked. No more "quick tweaks."**

---

## Quick Commands Summary

```bash
# 1. Check env vars (no deps needed)
./scripts/verify-env.sh

# 2. Start server
npm run dev

# 3. Smoke test (HTTP - no deps needed)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"artifactContent":"test"}' | jq '.'

# 4. Memory seeding (HTTP - no deps needed)
# Run two curl commands with 5 second wait between

# OR if dependencies installed:
npm install
npx tsx scripts/smoke-test.ts
npx tsx scripts/seed-memory.ts
```
