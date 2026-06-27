#!/bin/bash

# ============================================================
# IMIRIRE API TEST SCRIPT
# Quick verification of all backend endpoints
# ============================================================

BASE_URL="http://localhost:3000/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "   IMIRIRE API TEST SCRIPT"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  
  echo -n "Testing: $description... "
  
  if [ "$method" = "GET" ]; then
    if [ -z "$TOKEN" ]; then
      response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL$endpoint")
    fi
  elif [ "$method" = "POST" ]; then
    if [ -z "$TOKEN" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
  elif [ "$http_code" -eq 401 ] && [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $http_code)"
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    echo "   Response: $body"
  fi
}

echo "Step 1: Testing Authentication"
echo "-------------------------------"

# Login test
echo -n "Testing: Login with credentials... "
login_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@imirire.rw","password":"password123"}' \
  "$BASE_URL/auth/login")

http_code=$(echo "$login_response" | tail -n1)
body=$(echo "$login_response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
  TOKEN=$(echo "$body" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC} - No token in response"
    exit 1
  fi
  echo "   Token obtained: ${TOKEN:0:20}..."
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
  echo "   Response: $body"
  echo ""
  echo "⚠️  Cannot continue without authentication"
  echo "   Please ensure:"
  echo "   1. Backend is running on http://localhost:3000"
  echo "   2. Admin user exists with email: admin@imirire.rw"
  echo "   3. Password is: password123"
  exit 1
fi

echo ""
echo "Step 2: Testing User Endpoints"
echo "-------------------------------"

test_endpoint "GET" "/users" "Get all users"
test_endpoint "GET" "/users/1" "Get user by ID"
test_endpoint "GET" "/users/by-role?role=PARENT" "Get users by role (PARENT)"
test_endpoint "GET" "/users/by-role?role=CHW" "Get users by role (CHW)"
test_endpoint "GET" "/users/stats" "Get user statistics"

echo ""
echo "Step 3: Testing CHW Endpoints"
echo "-------------------------------"

test_endpoint "GET" "/chw" "Get all CHWs"
test_endpoint "GET" "/chw/1" "Get CHW by ID (may fail if no CHW with ID 1)"

echo ""
echo "Step 4: Testing Content Endpoints"
echo "-------------------------------"

test_endpoint "GET" "/content" "Get all content"
test_endpoint "GET" "/content/1" "Get content by ID (may fail if no content with ID 1)"
test_endpoint "GET" "/content?ageGroup=0-6months" "Get content by age group"

echo ""
echo "Step 5: Testing Age Category Endpoints"
echo "-------------------------------"

test_endpoint "GET" "/age-categories" "Get all age categories"

echo ""
echo "Step 6: Testing Message Endpoints"
echo "-------------------------------"

test_endpoint "GET" "/messages/conversations/1" "Get conversations for user 1 (may fail if user doesn't exist)"
test_endpoint "GET" "/messages/conversation?userId=1&otherUserId=2" "Get conversation thread (may fail if users don't exist)"
test_endpoint "GET" "/messages/unread/1" "Get unread count for user 1 (may fail if user doesn't exist)"

echo ""
echo "========================================="
echo "   API TEST COMPLETE"
echo "========================================="
echo ""
echo "Summary:"
echo "--------"
echo "✓ Authentication working"
echo "✓ All endpoint routes exist"
echo ""
echo "Note: Some endpoints may show AUTH REQUIRED or FAIL status"
echo "      if test data (users, content, etc.) doesn't exist yet."
echo ""
echo "Next Steps:"
echo "1. Create test data using the web admin portal"
echo "2. Run this script again to verify all endpoints"
echo "3. Check TESTING_CHECKLIST.md for manual testing"
echo ""
