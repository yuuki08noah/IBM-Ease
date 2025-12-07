#!/bin/bash
HOST="http://localhost:3000"

echo "1. Checking Public APIs..."
curl -s "$HOST/api/community/posts" | head -c 200
echo -e "\n"

echo "2. Attempting Post without Auth (Should Fail)..."
# We expect 401 or 500 depending on how requireUser throws
curl -s -X POST "$HOST/api/community/posts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Fail","body":"Should not work"}'
echo -e "\n"

echo "Note: Full auth verification requires browser or setting session cookie manually."
echo "Skipping manual session injection for script simplicity, relying on browser test"
