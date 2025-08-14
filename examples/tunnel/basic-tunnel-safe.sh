#!/bin/bash
# Basic tunnel example with error handling

set -e  # Exit on error

echo "Starting dashboard with public tunnel..."
echo "This will create a public URL anyone can access (read-only)"
echo ""

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Run the dashboard command
if npx -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard --tunnel; then
    echo "Dashboard stopped successfully."
else
    echo "Error: Dashboard failed to start. Exit code: $?"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Ensure you have Node.js 16+ installed"
    echo "2. Check network connectivity"
    echo "3. Try running with npm instead: npm exec -p @pimzino/claude-code-spec-workflow@latest -- claude-spec-dashboard --tunnel"
    exit 1
fi