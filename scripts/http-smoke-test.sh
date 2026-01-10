#!/bin/bash

# HTTP-based smoke test (no dependencies required)
# Just needs server running and curl available

API_URL="${API_URL:-http://localhost:3000}"

echo "🚀 HTTP Smoke Test"
echo "API URL: $API_URL"
echo ""

TEST_PAYLOAD='{"artifactContent":"function test() { return 1; }"}'

echo "📤 Sending POST request to /api/analyze..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/analyze" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ FAILED: HTTP $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

# Check if jq is available, otherwise use basic checks
if command -v jq &> /dev/null; then
  TOOL_REPORT=$(echo "$BODY" | jq -r '.toolReport // empty')
  AGENT_MSGS_LEN=$(echo "$BODY" | jq '.agentMessages | length // 0')
  DECISIONS_LEN=$(echo "$BODY" | jq '.decisions | length // 0')
  
  echo "✅ HTTP 200 OK"
  echo ""
  
  if [ -z "$TOOL_REPORT" ] || [ "$TOOL_REPORT" == "null" ]; then
    echo "❌ toolReport: missing or empty"
    exit 1
  else
    echo "✅ toolReport: present (${#TOOL_REPORT} chars)"
  fi
  
  if [ "$AGENT_MSGS_LEN" -ge "1" ]; then
    echo "✅ agentMessages: length >= 1 (got $AGENT_MSGS_LEN)"
    if [ "$AGENT_MSGS_LEN" -ge "4" ]; then
      echo "   (Expected 4 for full agent sequence, got $AGENT_MSGS_LEN)"
    fi
  else
    echo "❌ agentMessages: expected >= 1, got $AGENT_MSGS_LEN"
    exit 1
  fi
  
  if [ "$DECISIONS_LEN" -ge "1" ]; then
    echo "✅ decisions: length >= 1 (got $DECISIONS_LEN)"
    
    SUMMARY=$(echo "$BODY" | jq -r '.decisions[0].summary // empty')
    RATIONALE=$(echo "$BODY" | jq -r '.decisions[0].rationale // empty')
    ID=$(echo "$BODY" | jq -r '.decisions[0]._id // empty')
    
    if [ -z "$SUMMARY" ] || [ "$SUMMARY" == "null" ]; then
      echo "❌ decision.summary: missing"
      exit 1
    else
      echo "✅ decision.summary: present"
    fi
    
    if [ -z "$RATIONALE" ] || [ "$RATIONALE" == "null" ]; then
      echo "❌ decision.rationale: missing"
      exit 1
    else
      echo "✅ decision.rationale: present"
    fi
    
    if [ -z "$ID" ] || [ "$ID" == "null" ]; then
      echo "❌ decision._id: missing"
      exit 1
    else
      echo "✅ decision._id: present"
    fi
  else
    echo "❌ decisions: expected >= 1, got $DECISIONS_LEN"
    exit 1
  fi
else
  # Basic check without jq - check for key substrings in raw response
  echo "✅ HTTP 200 OK"
  echo "⚠️  jq not available - checking raw response for key fields..."
  
  if echo "$BODY" | grep -q '"toolReport"'; then
    echo "✅ toolReport: found in response"
  else
    echo "❌ toolReport: missing from response"
    exit 1
  fi
  
  if echo "$BODY" | grep -q '"agentMessages"'; then
    echo "✅ agentMessages: found in response"
  else
    echo "❌ agentMessages: missing from response"
    exit 1
  fi
  
  if echo "$BODY" | grep -q '"decisions"'; then
    echo "✅ decisions: found in response"
  else
    echo "❌ decisions: missing from response"
    exit 1
  fi
  
  echo ""
  echo "💡 Install jq for full validation: brew install jq (macOS) or apt-get install jq (Linux)"
fi

echo ""
echo "✅ Smoke test passed!"
