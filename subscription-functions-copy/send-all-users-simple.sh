#!/bin/bash

# Simplest way: Use the existing endpoint with timestamp=0 query parameter
# This will query for all users who subscribed since epoch (1970), which is everyone

echo "🚀 Sending all users to Retention.com suppression list"
echo ""

BASE_URL="https://magic.unaffiliated.co"
SECRET="${RETENTION_BATCH_SECRET:-}"

# Use timestamp=0 to get all users (epoch start = January 1, 1970)
if [ -z "$SECRET" ]; then
  URL="${BASE_URL}/api/retention-batch-suppression?timestamp=0"
  echo "⚠️  No RETENTION_BATCH_SECRET set, calling without auth..."
else
  URL="${BASE_URL}/api/retention-batch-suppression?secret=${SECRET}&timestamp=0"
  echo "🔐 Using secret for authentication..."
fi

echo "📡 Calling: ${URL}"
echo ""

curl -X GET "${URL}" \
  -H "Content-Type: application/json" \
  -v

echo ""
echo "✅ Done!"
