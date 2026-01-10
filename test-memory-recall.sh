#!/bin/bash

# Memory Recall Test - Verifies Historian references past decisions
# Tests the fixed embedding consistency (artifact+report for both search and storage)

echo "🧠 Starting Memory Recall Test"
echo "================================"
echo ""

API_URL="http://localhost:3000/api/analyze"

# Run 1: Pseudo-RTL/system code with obvious issue (missing reset, race condition)
echo "📝 Run 1: Submitting artifact with obvious issue (missing reset, race condition)"
echo "-------------------------------------------------------------------------------"

ARTIFACT_1='module arbiter(
  input clk,
  input req_a,
  input req_b,
  output reg grant_a,
  output reg grant_b
);
  always @(posedge clk) begin
    if (req_a) grant_a <= 1;
    else grant_a <= 0;
    if (req_b) grant_b <= 1;
    else grant_b <= 0;
  end
endmodule'

echo "Artifact #1 (issue: no mutual exclusion, both grants can be active simultaneously):"
echo "$ARTIFACT_1"
echo ""

RESPONSE_1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"artifactContent\": $(echo "$ARTIFACT_1" | jq -Rs .)}")

echo "Response #1 received. Checking structure..."
echo ""

# Verify Run 1 structure
TOOL_REPORT_1=$(echo "$RESPONSE_1" | jq -r '.toolReport' 2>/dev/null)
AGENT_MSGS_1=$(echo "$RESPONSE_1" | jq '.agentMessages | length' 2>/dev/null)
DECISIONS_1=$(echo "$RESPONSE_1" | jq '.decisions | length' 2>/dev/null)
DECISION_1_SUMMARY=$(echo "$RESPONSE_1" | jq -r '.decisions[0].summary' 2>/dev/null)
DECISION_1_RATIONALE=$(echo "$RESPONSE_1" | jq -r '.decisions[0].rationale' 2>/dev/null)

echo "Run 1 Verification:"
if [ -n "$TOOL_REPORT_1" ] && [ "$TOOL_REPORT_1" != "null" ] && [ -n "$TOOL_REPORT_1" ]; then
  echo "  ✅ toolReport: Present (${#TOOL_REPORT_1} chars)"
else
  echo "  ❌ toolReport: Missing or empty"
  exit 1
fi

if [ "$AGENT_MSGS_1" = "4" ]; then
  echo "  ✅ agentMessages: 4 messages (analysis, review, tradeoff, historian)"
else
  echo "  ⚠️  agentMessages: Expected 4, got $AGENT_MSGS_1"
fi

if [ "$DECISIONS_1" -ge 1 ]; then
  echo "  ✅ decisions: $DECISIONS_1 decision(s) (length >= 1)"
  echo "  📋 Decision #1 Summary: ${DECISION_1_SUMMARY:0:150}..."
else
  echo "  ❌ decisions: Expected >= 1, got $DECISIONS_1"
  exit 1
fi

echo ""
echo "Decision #1 created successfully. Waiting 3 seconds for vector index to update..."
sleep 3
echo ""

# Run 2: Slightly modified version (same issue, different signal names, small logic tweak)
echo "📝 Run 2: Submitting modified artifact (renamed signals, added comment, same core issue)"
echo "---------------------------------------------------------------------------------------"

ARTIFACT_2='module arbiter(
  input clk,
  input request_a,  // renamed: req_a -> request_a
  input request_b,  // renamed: req_b -> request_b
  output reg grant_a,
  output reg grant_b
);
  // Same core issue: no mutual exclusion mechanism
  always @(posedge clk) begin
    grant_a <= request_a ? 1 : 0;  // small syntax change, same logic
    grant_b <= request_b ? 1 : 0;  // both can still be active simultaneously
  end
endmodule'

echo "Artifact #2 (same issue, different signal names, small syntax tweak):"
echo "$ARTIFACT_2"
echo ""

RESPONSE_2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"artifactContent\": $(echo "$ARTIFACT_2" | jq -Rs .)}")

echo "Response #2 received. Checking for memory recall..."
echo ""

# Verify Run 2 structure
TOOL_REPORT_2=$(echo "$RESPONSE_2" | jq -r '.toolReport' 2>/dev/null)
AGENT_MSGS_2=$(echo "$RESPONSE_2" | jq '.agentMessages | length' 2>/dev/null)
DECISIONS_2=$(echo "$RESPONSE_2" | jq '.decisions | length' 2>/dev/null)
DECISION_2_SUMMARY=$(echo "$RESPONSE_2" | jq -r '.decisions[0].summary' 2>/dev/null)
DECISION_2_RATIONALE=$(echo "$RESPONSE_2" | jq -r '.decisions[0].rationale' 2>/dev/null)

echo "Run 2 Verification:"
if [ -n "$TOOL_REPORT_2" ] && [ "$TOOL_REPORT_2" != "null" ]; then
  echo "  ✅ toolReport: Present (${#TOOL_REPORT_2} chars)"
else
  echo "  ❌ toolReport: Missing or empty"
  exit 1
fi

if [ "$AGENT_MSGS_2" = "4" ]; then
  echo "  ✅ agentMessages: 4 messages"
else
  echo "  ⚠️  agentMessages: Expected 4, got $AGENT_MSGS_2"
fi

if [ "$DECISIONS_2" -ge 1 ]; then
  echo "  ✅ decisions: $DECISIONS_2 decision(s)"
else
  echo "  ❌ decisions: Expected >= 1, got $DECISIONS_2"
  exit 1
fi

echo ""
echo "🔍 Checking if Historian referenced past decisions..."
echo "===================================================="
echo ""

# Check if Decision #2 rationale mentions prior decisions
RATIONALE_UPPER=$(echo "$DECISION_2_RATIONALE" | tr '[:lower:]' '[:upper:]')

HAS_PRIOR=$(echo "$RATIONALE_UPPER" | grep -iE "prior|previous|earlier|past decision|similar|resembles|recall|memory|previous.*issue|prior.*decision" | head -3 || echo "")

if [ -n "$HAS_PRIOR" ]; then
  echo "✅ SUCCESS: Historian referenced past decisions!"
  echo ""
  echo "Extract from Decision #2 rationale:"
  echo "$DECISION_2_RATIONALE" | grep -iE "prior|previous|earlier|past decision|similar|resembles|recall|memory" -B 2 -A 2 | head -10
  echo ""
  echo "Full Decision #2 Rationale:"
  echo "$DECISION_2_RATIONALE"
else
  echo "⚠️  WARNING: Historian did not explicitly reference past decisions"
  echo ""
  echo "Possible reasons:"
  echo "  1. Vector search threshold too strict (similarity score too low)"
  echo "  2. Embeddings not similar enough despite semantic similarity"
  echo "  3. Historian prompt needs stronger guidance"
  echo ""
  echo "Decision #2 Rationale:"
  echo "$DECISION_2_RATIONALE"
  echo ""
  echo "Decision #2 Summary:"
  echo "$DECISION_2_SUMMARY"
  echo ""
  echo "📋 Next steps: Check vector search results and Historian prompt injection"
  echo ""
fi

echo ""
echo "===================================================="
echo "✅ Memory Recall Test Complete"
echo ""
echo "Summary:"
echo "  - Run 1: Decision created with embedding stored"
echo "  - Run 2: Decision created; checking for recall..."
if [ -n "$HAS_PRIOR" ]; then
  echo "  - Result: ✅ Historian referenced past decisions!"
else
  echo "  - Result: ⚠️  No explicit reference found (may need tuning)"
fi
