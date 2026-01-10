#!/bin/bash

# Lightweight environment verification script
# Runs without requiring dependencies - just checks env vars

echo "🔍 Environment Variables Verification"
echo "====================================="
echo ""

ERRORS=0

# Check required environment variables
check_var() {
  local var_name=$1
  local value="${!var_name}"
  
  if [ -z "$value" ]; then
    echo "❌ $var_name: MISSING"
    ERRORS=$((ERRORS + 1))
  else
    # Mask sensitive values but show they exist
    if [[ "$var_name" == *"KEY"* ]] || [[ "$var_name" == *"URI"* ]]; then
      local masked="${value:0:8}***${value: -4}"
      echo "✅ $var_name: OK ($masked)"
    else
      echo "✅ $var_name: OK ($value)"
    fi
  fi
}

check_var "MONGODB_URI"
check_var "MONGODB_DB_NAME"
check_var "LLM_API_KEY"
check_var "LLM_API_BASE_URL"
check_var "LLM_MODEL"
check_var "VOYAGE_API_KEY"

echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ All required environment variables are set"
  echo ""
  echo "Next steps:"
  echo "1. Verify MongoDB Atlas vector index exists (see ENV_INDEX_CHECK.md)"
  echo "2. Start the server: npm run dev"
  echo "3. Run smoke test: npx tsx scripts/smoke-test.ts (or curl)"
  exit 0
else
  echo "❌ Found $ERRORS missing environment variable(s)"
  echo ""
  echo "Please set missing variables in your hackathon environment:"
  echo "  - Production/deployed: Set in hosting platform (Vercel, Railway, etc.)"
  echo "  - Local: Create .env.local file with all variables"
  exit 1
fi
