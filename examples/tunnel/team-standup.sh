#!/bin/bash
# Team standup example - share progress during daily meetings

echo "🚀 Team Standup Dashboard Sharing"
echo "================================"
echo ""
echo "Starting dashboard for team standup..."
echo "Share the URL in your team chat or during video call"
echo ""

# Start with a simple password that's easy to share verbally
# Using npx with --yes flag to avoid prompts
npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard \
  --tunnel \
  --tunnel-password "standup" \
  --open

# Usage during standup:
# 1. Start this script before standup begins
# 2. Share the tunnel URL in team chat
# 3. Share password: "standup"
# 4. Team can follow along as you discuss progress
# 5. Stop after meeting with Ctrl+C