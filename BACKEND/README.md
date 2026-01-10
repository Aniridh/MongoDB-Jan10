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

## Environment Setup

### Required Environment Variables

All 6 environment variables must be set in **both**:
- **Local development:** `.env.local` (copy from `.env.example` and fill in your values)
- **Deployment/hackathon:** Platform environment variable settings (Vercel, Railway, etc.)

See `.env.example` at the repo root for a template with all required variables (Gemini API examples included):

- `MONGODB_URI` - MongoDB Atlas connection string
- `MONGODB_DB_NAME` - Database name (set to "visibl" in example)
- `LLM_API_KEY` - Gemini API key (Google AI Studio API key)
- `LLM_API_BASE_URL` - Gemini API base URL (e.g., https://generativelanguage.googleapis.com/v1beta or OpenAI-compatible service URL)
- `LLM_MODEL` - Gemini model name (e.g., gemini-pro, gemini-1.5-pro)
- `VOYAGE_API_KEY` - Voyage AI API key for embeddings

**Important:**
- `.env.local` is ignored by git (see `.gitignore`)
- Never commit real API keys or secrets
- The API contract must not change (see contract with frontend below)

### Verification

Run `./scripts/verify-env.sh` to check all environment variables are set correctly.

---

## Contract with Frontend

See `/FRONTEND_CONTRACT.md` for API contract details.

**Endpoint:** `POST /api/analyze`  
**Body:** `{ artifactContent: string }`  
**Response:** See `FRONTEND_CONTRACT.md` for full shape

---

## API Stability

**⚠️ BACKEND FREEZE NOTE:**

The `/api/analyze` request and response shapes are **FROZEN** for the hackathon.

- Frontend integration depends on this stability
- Only bug fixes are allowed - no breaking contract changes
- Do not modify request/response shapes without frontend team approval
- See `API_CONTRACT.md` and `FRONTEND_CONTRACT.md` for exact contract specifications

**This API contract is stable and will not change during development.**
