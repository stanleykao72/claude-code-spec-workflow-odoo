#!/bin/bash
# Development tunnel example - for testing during development

echo "🔧 Development Mode - Dashboard Tunnel"
echo "====================================="
echo ""
echo "Starting dashboard with tunnel from local development..."
echo ""

# Go to project root (two directories up from examples/tunnel/)
cd "$(dirname "$0")/../.."

# Run the development dashboard with tunnel
npm run dev:dashboard -- --tunnel

# For password-protected tunnel during development:
# npm run dev:dashboard -- --tunnel --tunnel-password "dev123"

# For specific provider during development:
# npm run dev:dashboard -- --tunnel --tunnel-provider ngrok