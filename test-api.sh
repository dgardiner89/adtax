#!/bin/bash

# AdTax API Local Testing Script
# Make sure your dev server is running: npm run dev

BASE_URL="http://localhost:3000"
SESSION_ID="test-session-$(date +%s)"

echo "🧪 Testing AdTax API locally"
echo "Base URL: $BASE_URL"
echo "Session ID: $SESSION_ID"
echo ""

# Test 1: Get config (should return null initially)
echo "1️⃣  Testing GET /api/config (should return null)..."
curl -s -H "x-session-id: $SESSION_ID" \
  "$BASE_URL/api/config" | jq '.'
echo ""

# Test 2: Seed config
echo "2️⃣  Seeding config..."
SEED_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer seed-me" \
  -H "x-session-id: $SESSION_ID" \
  "$BASE_URL/api/seed")
echo "$SEED_RESPONSE" | jq '.'
echo ""

# Test 3: Get config (should now return the seeded config)
echo "3️⃣  Testing GET /api/config (should return seeded config)..."
curl -s -H "x-session-id: $SESSION_ID" \
  "$BASE_URL/api/config" | jq '.value.variables[0:2]' # Show first 2 variables
echo ""

# Test 4: Generate filename
echo "4️⃣  Testing POST /api/names/generate..."
GENERATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-session-id: $SESSION_ID" \
  -d '{
    "variableValues": {
      "1": "1080x1080",
      "2": "Creator",
      "3": "Cold",
      "4": ["Hero"],
      "5": "Problem",
      "6": "Learn More",
      "7": "Minimalist",
      "8": "Summer Campaign"
    }
  }' \
  "$BASE_URL/api/names/generate")
echo "$GENERATE_RESPONSE" | jq '.'
echo ""

# Test 5: Test CORS (OPTIONS request)
echo "5️⃣  Testing CORS (OPTIONS request)..."
curl -s -X OPTIONS \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-session-id" \
  "$BASE_URL/api/config" -v 2>&1 | grep -i "access-control"
echo ""

echo "✅ Testing complete!"
echo ""
echo "To test with a different session ID, set SESSION_ID env var:"
echo "SESSION_ID=my-session ./test-api.sh"

