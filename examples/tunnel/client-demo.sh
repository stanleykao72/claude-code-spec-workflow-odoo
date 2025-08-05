#!/bin/bash
# Client demo example - professional presentation setup

echo "🎯 Client Demo Dashboard"
echo "======================="
echo ""
echo "Preparing professional dashboard for client presentation..."
echo ""

# Generate a professional password
DEMO_DATE=$(date +%Y%m%d)
PASSWORD="Demo${DEMO_DATE}"

echo "Dashboard Password: $PASSWORD"
echo ""
echo "Starting dashboard..."
echo ""

# Start dashboard with client-friendly settings
# Using npx with --yes flag to avoid prompts
npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard \
  --tunnel \
  --tunnel-password "$PASSWORD" \
  --port 3000

# Professional demo tips:
# 1. Test the tunnel URL before the meeting
# 2. Share URL and password via secure channel
# 3. Have backup plan (screenshots) if tunnel fails
# 4. Keep dashboard updated during discussion
# 5. Stop tunnel immediately after demo