#!/bin/bash

# Seed Memory Test Sequence for Agent B
# This script runs two sequential analyzes to seed the database
# so the Historian can reference past decisions

echo "🧪 Starting Seed Memory Test Sequence"
echo "======================================"
echo ""

# Configuration
API_URL="http://localhost:3000/api/analyze"

# Analyze #1: Buggy artifact (missing reset, no tests, racey logic)
echo "📝 Analyze #1: Buggy artifact (missing reset, racey logic)"
echo "----------------------------------------------------------"

ARTIFACT_1='module counter(input clk, output reg [3:0] count);
  always @(posedge clk) begin
    count <= count + 1;
  end
endmodule'

RESPONSE_1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"artifactContent\": $(echo "$ARTIFACT_1" | jq -Rs .)}")

echo "Response #1:"
echo "$RESPONSE_1" | jq '.' 2>/dev/null || echo "$RESPONSE_1"
echo ""

# Extract decision summary from first run
DECISION_1_SUMMARY=$(echo "$RESPONSE_1" | jq -r '.decisions[0].summary' 2>/dev/null)
if [ -n "$DECISION_1_SUMMARY" ] && [ "$DECISION_1_SUMMARY" != "null" ]; then
  echo "✅ Decision #1 created: ${DECISION_1_SUMMARY:0:100}..."
else
  echo "❌ Failed to create Decision #1"
  exit 1
fi

echo ""
echo "Waiting 2 seconds before next request..."
sleep 2
echo ""

# Analyze #2: Slightly modified version (small tweak, still related)
echo "📝 Analyze #2: Modified version (added reset, still related)"
echo "-------------------------------------------------------------"

ARTIFACT_2='module counter(input clk, input reset, output reg [3:0] count);
  always @(posedge clk or posedge reset) begin
    if (reset) count <= 4'\''b0000;
    else count <= count + 1;
  end
endmodule'

RESPONSE_2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"artifactContent\": $(echo "$ARTIFACT_2" | jq -Rs .)}")

echo "Response #2:"
echo "$RESPONSE_2" | jq '.' 2>/dev/null || echo "$RESPONSE_2"
echo ""

# Extract decision rationale from second run
DECISION_2_RATIONALE=$(echo "$RESPONSE_2" | jq -r '.decisions[0].rationale' 2>/dev/null)
if [ -n "$DECISION_2_RATIONALE" ] && [ "$DECISION_2_RATIONALE" != "null" ]; then
  echo "✅ Decision #2 created"
  echo ""
  echo "📊 Checking if Decision #2 references Decision #1..."
  echo "---------------------------------------------------"
  if echo "$DECISION_2_RATIONALE" | grep -qiE "prior|previous|earlier|similar|resembles|past decision"; then
    echo "✅ SUCCESS: Decision #2 rationale references past decisions!"
    echo ""
    echo "Extract from rationale:"
    echo "$DECISION_2_RATIONALE" | grep -iE "prior|previous|earlier|similar|resembles|past decision" -A 2 -B 2 | head -10
  else
    echo "⚠️  Decision #2 rationale does not explicitly reference past decisions"
    echo "This might mean:"
    echo "  - Vector search found no similar decisions (DB empty or embeddings too different)"
    echo "  - Historian didn't format reference as expected"
    echo ""
    echo "Rationale preview: ${DECISION_2_RATIONALE:0:200}..."
  fi
else
  echo "❌ Failed to create Decision #2"
  exit 1
fi

echo ""
echo "======================================"
echo "✅ Seed Memory Test Sequence Complete"
echo ""
echo "Expected MongoDB state:"
echo "  - artifacts collection: >= 2 documents"
echo "  - reports collection: >= 2 documents"
echo "  - agent_messages collection: >= 8 documents (4 per run)"
echo "  - decisions collection: >= 2 documents with embeddings"
