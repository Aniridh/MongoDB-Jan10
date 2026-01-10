#!/bin/bash

# Smoke test for /api/analyze endpoint

API_URL="${API_URL:-http://localhost:3000}"

echo "🚀 Running smoke test for /api/analyze endpoint"
echo "API URL: $API_URL"
echo ""

TEST_PAYLOAD='{
  "artifactContent": "module counter(input clk, input reset, output reg [3:0] count);\n  always @(posedge clk or posedge reset) begin\n    if (reset) count <= 4'\''b0000;\n    else count <= count + 1;\n  end\nendmodule"
}'

echo "📤 Sending POST request to /api/analyze..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/analyze" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Request failed with status $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

echo "✅ Request successful"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Validate response structure
echo "🔍 Validating response structure..."
echo ""

ERRORS=0

# Check toolReport
if echo "$BODY" | jq -e '.toolReport' > /dev/null 2>&1; then
  TOOL_REPORT=$(echo "$BODY" | jq -r '.toolReport')
  if [ -z "$TOOL_REPORT" ] || [ "$TOOL_REPORT" == "null" ]; then
    echo "❌ toolReport is missing or empty"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ toolReport: present and non-empty"
  fi
else
  echo "❌ toolReport field missing"
  ERRORS=$((ERRORS + 1))
fi

# Check agentMessages
AGENT_MSGS_LENGTH=$(echo "$BODY" | jq '.agentMessages | length' 2>/dev/null || echo "0")
if [ "$AGENT_MSGS_LENGTH" == "4" ]; then
  echo "✅ agentMessages: length is 4"
  
  # Check roles
  ROLES=$(echo "$BODY" | jq -r '.agentMessages[].agentRole' 2>/dev/null | sort | uniq | jq -R -s -c 'split("\n") | map(select(. != "")) | sort' 2>/dev/null)
  EXPECTED_ROLES='["analysis","historian","review","tradeoff"]'
  if [ "$ROLES" == "$EXPECTED_ROLES" ]; then
    echo "✅ agentMessages: all 4 roles present (analysis, review, tradeoff, historian)"
  else
    echo "❌ agentMessages: missing roles. Expected: $EXPECTED_ROLES, Got: $ROLES"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ agentMessages: expected length 4, got $AGENT_MSGS_LENGTH"
  ERRORS=$((ERRORS + 1))
fi

# Check decisions
DECISIONS_LENGTH=$(echo "$BODY" | jq '.decisions | length' 2>/dev/null || echo "0")
if [ "$DECISIONS_LENGTH" -ge "1" ]; then
  echo "✅ decisions: length >= 1 (got $DECISIONS_LENGTH)"
  
  # Check decision structure
  DECISION=$(echo "$BODY" | jq '.decisions[0]' 2>/dev/null)
  
  if echo "$DECISION" | jq -e '.summary' > /dev/null 2>&1; then
    echo "✅ decision.summary: present"
  else
    echo "❌ decision.summary: missing"
    ERRORS=$((ERRORS + 1))
  fi
  
  if echo "$DECISION" | jq -e '.rationale' > /dev/null 2>&1; then
    echo "✅ decision.rationale: present"
  else
    echo "❌ decision.rationale: missing"
    ERRORS=$((ERRORS + 1))
  fi
  
  EMBEDDING_LENGTH=$(echo "$DECISION" | jq '.embedding | length' 2>/dev/null || echo "0")
  if [ "$EMBEDDING_LENGTH" -gt "100" ]; then
    echo "✅ decision.embedding: present as long array (length: $EMBEDDING_LENGTH)"
  else
    echo "❌ decision.embedding: missing or too short (length: $EMBEDDING_LENGTH)"
    ERRORS=$((ERRORS + 1))
  fi
  
  AGENT_ROLES=$(echo "$DECISION" | jq -r '.agentRolesInvolved' 2>/dev/null | jq 'sort' 2>/dev/null)
  EXPECTED_AGENT_ROLES='["analysis","historian","review","tradeoff"]'
  if [ "$AGENT_ROLES" == "$EXPECTED_AGENT_ROLES" ]; then
    echo "✅ decision.agentRolesInvolved: correct (analysis, review, tradeoff, historian)"
  else
    echo "❌ decision.agentRolesInvolved: incorrect. Expected: $EXPECTED_AGENT_ROLES, Got: $AGENT_ROLES"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "❌ decisions: expected length >= 1, got $DECISIONS_LENGTH"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All validations passed!"
  echo ""
  echo "📊 Next step: Verify MongoDB collections have:"
  echo "   - artifacts: 1 document"
  echo "   - reports: 1 document"
  echo "   - agent_messages: 4 documents"
  echo "   - decisions: 1 document"
  exit 0
else
  echo "❌ Found $ERRORS validation error(s)"
  exit 1
fi
