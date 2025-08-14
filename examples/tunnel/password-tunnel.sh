#!/bin/bash
# Password-protected tunnel example - secure sharing with authentication

# Set a password for tunnel access
PASSWORD="TeamReview2024"

echo "Starting dashboard with password-protected tunnel..."
echo "Password: $PASSWORD"
echo ""
echo "Share both the URL and password with authorized viewers"
echo ""

# Detect if we're in the development directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

if [ -f "$PROJECT_ROOT/package.json" ] && grep -q "@pimzino/claude-code-spec-workflow" "$PROJECT_ROOT/package.json"; then
  echo "Running from local development version..."
  echo ""
  cd "$PROJECT_ROOT"
  npm run dev:dashboard -- --tunnel --tunnel-password "$PASSWORD"
else
  echo "Running from npm package..."
  echo ""
  npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard \
    --tunnel \
    --tunnel-password "$PASSWORD"
fi

# Viewers will:
# 1. Navigate to the tunnel URL
# 2. See a password prompt
# 3. Enter the password to access dashboard
# 4. Have read-only access to view specs and progress