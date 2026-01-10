# Backend Code Organization

**⚠️ BACKEND ONLY - Do NOT modify these files**

## Backend Structure

All backend code lives in two locations (Next.js conventions):

### 1. API Routes
- **Location:** `/app/api/analyze/route.ts`
- **Owner:** Agent A (API) + Agent B (AI orchestration)
- **Purpose:** HTTP endpoint handler

### 2. Backend Library Code
- **Location:** `/lib/**`
- **Owner:** Agent B (AI/Embeddings/Agents) + Agent A (DB/Reports)
- **Purpose:** Core backend logic

---

## Backend Files (Do NOT Modify)

### Agent B - AI & Agent Orchestration
- `/lib/agentB.ts` - Agent B contract exports
- `/lib/embeddings.ts` - Voyage AI embeddings
- `/lib/vector-search.ts` - Atlas Vector Search
- `/lib/agents/prompts.ts` - Agent system prompts
- `/lib/agents/orchestrator.ts` - Multi-agent orchestration

### Agent A - API & Database
- `/lib/db.ts` - MongoDB connection
- `/lib/types.ts` - TypeScript type definitions
- `/lib/fakeReport.ts` - Tool report generator

### API Route
- `/app/api/analyze/route.ts` - Main API endpoint

---

## Backend Test Scripts
- `/test-seed-sequence.sh` - Seed memory test
- `/scripts/**` - Backend verification scripts

---

## Rules for Frontend Engineers

✅ **ALLOWED:**
- `/app/(frontend)/**` - All frontend code
- `/components/**` - React components
- `/pages/**` - Next.js pages (if using pages router)
- `/ui/**` - UI components
- CSS and styling files

❌ **FORBIDDEN:**
- `/app/api/**` - API routes (backend only)
- `/lib/**` - Backend library code
- Any MongoDB connection code
- Any LLM/agent code
- Any embedding/vector search code

---

## Environment Variables Required (Backend)

These are set in `.env.local` (not tracked in git):

- `VOYAGE_API_KEY` - Voyage AI embeddings
- `LLM_API_KEY` - LLM API key
- `LLM_API_BASE_URL` - LLM API base URL
- `LLM_MODEL` - LLM model name
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name (default: "visibl")

---

## Contract with Frontend

See `/FRONTEND_CONTRACT.md` for API contract details.

**Endpoint:** `POST /api/analyze`  
**Body:** `{ artifactContent: string }`  
**Response:** See `FRONTEND_CONTRACT.md` for full shape
