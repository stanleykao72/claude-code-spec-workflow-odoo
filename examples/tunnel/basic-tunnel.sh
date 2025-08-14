#!/bin/bash
# Basic tunnel example - share dashboard with no authentication

echo "Starting dashboard with public tunnel..."
echo "This will create a public URL anyone can access (read-only)"
echo ""

# Detect if we're in the development directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

if [ -f "$PROJECT_ROOT/package.json" ] && grep -q "@pimzino/claude-code-spec-workflow" "$PROJECT_ROOT/package.json"; then
  echo "Running from local development version..."
  echo ""
  cd "$PROJECT_ROOT"
  npm run dev:dashboard -- --tunnel
else
  echo "Running from npm package..."
  echo ""
  npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard --tunnel
fi

# The dashboard will display:
# - Local URL: http://localhost:3000
# - Tunnel URL: https://[random].trycloudflare.com
# - Share the tunnel URL with stakeholders
# - Press Ctrl+C to stop and close the tunnel