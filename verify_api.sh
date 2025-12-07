#!/bin/bash
HOST="http://localhost:3000"

echo "1. Getting Tags..."
curl -s "$HOST/api/community/tags" | head -c 200
echo -e "\n"

echo "2. Listing Posts..."
curl -s "$HOST/api/community/posts" | head -c 200
echo -e "\n"

echo "3. Creating Post..."
RESP=$(curl -s -X POST "$HOST/api/community/posts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","body":"This is a test","authorId":"u4","tags":["test"]}')
echo $RESP
ID=$(echo $RESP | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created ID: $ID"

if [ -z "$ID" ]; then
  echo "Failed to create post"
  exit 1
fi

echo "4. Getting Post Details..."
curl -s "$HOST/api/community/posts/$ID" | head -c 200
echo -e "\n"

echo "5. Adding Comment..."
curl -s -X POST "$HOST/api/community/posts/$ID/comments" \
  -H "Content-Type: application/json" \
  -d '{"body":"Test comment","authorId":"u4"}'
echo -e "\n"

echo "6. Voting..."
curl -s -X POST "$HOST/api/community/vote" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"post\",\"id\":\"$ID\",\"increment\":true}"
echo -e "\n"

echo "Done."
