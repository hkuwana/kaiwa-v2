#!/bin/bash
# Test PR #4 API endpoints via curl
# This script tests the learning path generation APIs

set -e  # Exit on error

echo "🚀 PR #4 API Testing Suite"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "📡 Checking if dev server is running..."
if curl -sk https://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is running${NC}"
else
    echo -e "${RED}❌ Dev server is not running${NC}"
    echo ""
    echo "Please start the dev server first:"
    echo "  pnpm dev"
    echo ""
    exit 1
fi

echo ""
echo "============================================================"
echo "🧪 TEST 1: Create path from user preferences"
echo "============================================================"
echo ""

# Test 1: Create path from preferences
RESPONSE1=$(curl -sk -X POST https://localhost:5173/api/learning-paths/from-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "targetLanguageId": "ja",
      "currentLanguageLevel": "A2",
      "practicalLevel": "intermediate beginner",
      "learningGoal": "Connection",
      "specificGoals": ["Have meaningful conversations"],
      "challengePreference": "moderate",
      "correctionStyle": "gentle"
    },
    "presetName": "Test Course",
    "presetDescription": "A test learning path",
    "duration": 7
  }')

echo "📤 Response:"
echo "$RESPONSE1" | jq '.'

# Check if successful
if echo "$RESPONSE1" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ TEST 1 PASSED${NC}"
    PATH_ID_1=$(echo "$RESPONSE1" | jq -r '.data.pathId')
    echo "📝 Created path ID: $PATH_ID_1"
else
    echo -e "${RED}❌ TEST 1 FAILED${NC}"
    TEST1_PASSED=false
fi

echo ""
echo "============================================================"
echo "🧪 TEST 2: Create path from creator brief"
echo "============================================================"
echo ""

# Test 2: Create path from creator brief
RESPONSE2=$(curl -sk -X POST https://localhost:5173/api/learning-paths/from-brief \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Create a 7-day intensive course for preparing to meet your Japanese partner'\''s parents. Focus on formal greetings, gift-giving etiquette, and keigo.",
    "targetLanguage": "ja",
    "duration": 7,
    "difficultyRange": {
      "start": "A2",
      "end": "B1"
    },
    "primarySkill": "conversation",
    "metadata": {
      "category": "relationships",
      "tags": ["family", "formal", "culture"]
    }
  }')

echo "📤 Response:"
echo "$RESPONSE2" | jq '.'

# Check if successful
if echo "$RESPONSE2" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ TEST 2 PASSED${NC}"
    PATH_ID_2=$(echo "$RESPONSE2" | jq -r '.data.pathId')
    echo "📝 Created path ID: $PATH_ID_2"
else
    echo -e "${RED}❌ TEST 2 FAILED${NC}"
    TEST2_PASSED=false
fi

echo ""
echo "============================================================"
echo "🧪 TEST 3: Retrieve created path"
echo "============================================================"
echo ""

if [ ! -z "$PATH_ID_1" ]; then
    RESPONSE3=$(curl -sk https://localhost:5173/api/learning-paths/$PATH_ID_1)

    echo "📤 Response:"
    echo "$RESPONSE3" | jq '{
      success: .success,
      id: .data.id,
      title: .data.title,
      totalDays: (.data.schedule | length),
      status: .data.status
    }'

    if echo "$RESPONSE3" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ TEST 3 PASSED${NC}"
    else
        echo -e "${RED}❌ TEST 3 FAILED${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  TEST 3 SKIPPED (no path created in TEST 1)${NC}"
fi

echo ""
echo "============================================================"
echo "🧪 TEST 4: Check queue statistics"
echo "============================================================"
echo ""

RESPONSE4=$(curl -sk https://localhost:5173/api/dev/learning-paths/queue/stats)

echo "📤 Response:"
echo "$RESPONSE4" | jq '.'

if echo "$RESPONSE4" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ TEST 4 PASSED${NC}"

    PENDING=$(echo "$RESPONSE4" | jq -r '.stats.pending')
    TOTAL=$(echo "$RESPONSE4" | jq -r '.stats.total')

    echo ""
    echo "📊 Queue Statistics:"
    echo "  - Pending: $PENDING"
    echo "  - Total: $TOTAL"
    echo "  - Expected: ~14 jobs (7 per path)"
else
    echo -e "${RED}❌ TEST 4 FAILED${NC}"
fi

echo ""
echo "============================================================"
echo "📊 TEST SUMMARY"
echo "============================================================"

ALL_PASSED=true

if echo "$RESPONSE1" | jq -e '.success == true' > /dev/null; then
    echo -e "Test 1 (Preferences):   ${GREEN}✅ PASS${NC}"
else
    echo -e "Test 1 (Preferences):   ${RED}❌ FAIL${NC}"
    ALL_PASSED=false
fi

if echo "$RESPONSE2" | jq -e '.success == true' > /dev/null; then
    echo -e "Test 2 (Creator Brief): ${GREEN}✅ PASS${NC}"
else
    echo -e "Test 2 (Creator Brief): ${RED}❌ FAIL${NC}"
    ALL_PASSED=false
fi

if [ ! -z "$PATH_ID_1" ] && echo "$RESPONSE3" | jq -e '.success == true' > /dev/null; then
    echo -e "Test 3 (Retrieve Path): ${GREEN}✅ PASS${NC}"
elif [ -z "$PATH_ID_1" ]; then
    echo -e "Test 3 (Retrieve Path): ${YELLOW}⏭️  SKIP${NC}"
else
    echo -e "Test 3 (Retrieve Path): ${RED}❌ FAIL${NC}"
    ALL_PASSED=false
fi

if echo "$RESPONSE4" | jq -e '.success == true' > /dev/null; then
    echo -e "Test 4 (Queue Stats):   ${GREEN}✅ PASS${NC}"
else
    echo -e "Test 4 (Queue Stats):   ${RED}❌ FAIL${NC}"
    ALL_PASSED=false
fi

echo ""
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "📝 Created paths:"
    [ ! -z "$PATH_ID_1" ] && echo "  - From preferences: $PATH_ID_1"
    [ ! -z "$PATH_ID_2" ] && echo "  - From creator brief: $PATH_ID_2"
    echo ""
    echo "💡 Next steps:"
    echo "  - View paths in Supabase dashboard"
    echo "  - Check scenario_generation_queue table"
    echo "  - Proceed to PR #5"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo ""
    echo "💡 Check the error messages above for details"
    exit 1
fi
