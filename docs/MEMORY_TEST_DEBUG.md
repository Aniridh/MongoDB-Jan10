# Memory Test Debug Guide

## Integration Flow Verification

If the memory test fails (Historian doesn't reference past decisions), check these points:

### 1. Vector Search Flow

**Route → Vector Search:**
```typescript
// app/api/analyze/route.ts (lines 103-108)
const textToEmbed = `${artifactContent}\n\n${toolReport}`;
initialEmbedding = await embedText(textToEmbed);
similarDecisions = await findSimilarDecisions(initialEmbedding);
```

**Vector Search Implementation:**
```typescript
// lib/vector-search.ts
- Searches using $vectorSearch with embedding from artifact+report
- Returns SimilarDecision[] with score property
- limit default: 5
- numCandidates: Math.max(limit * 10, 100)
```

**Check if similarDecisions found:**
- If `similarDecisions.length === 0`, vector search found nothing
- If `similarDecisions.length > 0` but no reference, issue is in prompt injection

### 2. Similar Decisions Passed to Historian

**Route → runAgents:**
```typescript
// app/api/analyze/route.ts (line 115)
orchestrationResult = await runAgents(artifact, report, similarDecisions);
```

**runAgents → callAgent (Historian):**
```typescript
// lib/agents/orchestrator.ts (lines 139-163)
export async function runAgents(
  artifact: Artifact,
  report: Report,
  similarDecisions: SimilarDecision[]  // ← Passed directly
): Promise<OrchestrationResult> {
  const inputs: AgentInputs = {
    artifact,
    report,
    similarDecisions,  // ← Stored in inputs
  };
  // ... later ...
  const historianOutput = await callAgent("historian", inputs);  // ← Passed to Historian
}
```

**callAgent → Historian Prompt:**
```typescript
// lib/agents/orchestrator.ts (lines 75-80)
case "historian":
  const similarDecisions = inputs.similarDecisions.map((d) => ({
    summary: d.summary,
    rationale: d.rationale,
  }));
  systemPrompt = getHistorianAgentPrompt(similarDecisions);
```

### 3. Historian Prompt Injection

**Prompt Generation:**
```typescript
// lib/agents/prompts.ts (lines 50-72)
export function getHistorianAgentPrompt(similarDecisions: Array<{ summary: string; rationale: string }>): string {
  const hasSimilarDecisions = similarDecisions.length > 0;
  const similarDecisionsText = hasSimilarDecisions
    ? similarDecisions.map((d, i) => `\n${i + 1}. Summary: ${d.summary}\n   Rationale: ${d.rationale}`).join("\n")
    : "";

  // ... prompt includes:
  ${hasSimilarDecisions ? `Similar past decisions to consider:${similarDecisionsText}` : "IMPORTANT: No similar past decisions exist..."}
}
```

**Key Points:**
- If `similarDecisions.length > 0`, prompt includes past decisions
- Format: `\n1. Summary: ...\n   Rationale: ...`
- Historian is explicitly told to "reference and learn from similar past decisions"

### 4. What to Check if Test Fails

**If Historian doesn't reference past decisions:**

1. **Check vector search results:**
   - Log `similarDecisions.length` after `findSimilarDecisions()` call
   - If 0: Vector search threshold too strict OR embeddings too different
   - If > 0: Check similarity scores - may need threshold adjustment

2. **Check embedding consistency:**
   - Run 1: Stores `initialEmbedding` (artifact+report) in `decisions.embedding`
   - Run 2: Searches with `initialEmbedding` (artifact+report)
   - Verify: Both use same semantic space (artifact+report)
   - ✅ FIXED: Previously stored rationale embedding, now stores artifact+report embedding

3. **Check Historian prompt:**
   - Extract actual prompt sent to LLM (add logging)
   - Verify `similarDecisionsText` is included when `hasSimilarDecisions === true`
   - Check format: Should show "Similar past decisions to consider: \n1. Summary: ..."

4. **Check LLM response:**
   - Verify `decisionRationale` contains mentions of "prior", "previous", "similar", "past decision"
   - If not: Prompt may need stronger language OR LLM ignoring instructions

### 5. Debug Code to Add

Add to `app/api/analyze/route.ts` after line 108:

```typescript
console.log("Vector search results:", {
  count: similarDecisions.length,
  decisions: similarDecisions.map(d => ({
    id: d._id,
    summary: d.summary?.substring(0, 100),
    score: d.score
  }))
});
```

Add to `lib/agents/orchestrator.ts` after line 79:

```typescript
if (role === "historian") {
  console.log("Historian similarDecisions:", {
    count: similarDecisions.length,
    decisions: similarDecisions.map(d => ({
      summary: d.summary?.substring(0, 100),
      rationale: d.rationale?.substring(0, 100)
    }))
  });
  console.log("Historian prompt includes similar decisions:", systemPrompt.includes("Similar past decisions"));
}
```

### 6. Expected Behavior

**Run 1:**
- `similarDecisions.length === 0` (DB empty)
- Historian prompt says: "IMPORTANT: No similar past decisions exist..."
- Decision stored with `embedding: initialEmbedding` (artifact+report)

**Run 2:**
- `similarDecisions.length >= 1` (finds Run 1 decision)
- Historian prompt includes: "Similar past decisions to consider: \n1. Summary: ..."
- Decision rationale should mention: "prior", "previous", "similar issue", "past decision", etc.

### 7. If Test Still Fails

Send this information:

1. **Historian prompt text** (from console log after line 79 in orchestrator.ts)
2. **similarDecisions injection** - Show the array passed to `getHistorianAgentPrompt()`
3. **Vector search results** - Show `similarDecisions` array from route.ts line 108
4. **Similarity scores** - Show `d.score` values from vector search
5. **Actual LLM response** - Show `historianOutput` before parsing
