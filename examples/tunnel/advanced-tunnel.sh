#!/bin/bash
# Advanced tunnel configuration with all options

# Configuration
PORT=8080
PASSWORD="SecureDemo123"
PROVIDER="cloudflare"  # or "ngrok"

echo "Advanced tunnel configuration example"
echo "=================================="
echo "Port: $PORT"
echo "Provider: $PROVIDER"
echo "Password: $PASSWORD"
echo ""

# Start dashboard with full configuration
# Using npx with --yes flag to avoid prompts
npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard \
  --port $PORT \
  --tunnel \
  --tunnel-provider $PROVIDER \
  --tunnel-password "$PASSWORD" \
  --open

# Additional options:
# --open              Opens dashboard in default browser
# --tunnel-provider   Choose between 'cloudflare' or 'ngrok'
# --port             Custom port (default: 3000)

# For ngrok users:
# 1. Sign up at https://ngrok.com
# 2. Run: ngrok config add-authtoken YOUR_TOKEN
# 3. Use --tunnel-provider ngrok