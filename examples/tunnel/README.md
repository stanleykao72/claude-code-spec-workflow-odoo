# Tunnel Feature Examples

This directory contains example scripts demonstrating various use cases for the dashboard tunnel feature.

## Development vs Production

### During Development
If you're testing the tunnel feature during development, use:
```bash
./dev-tunnel.sh
```

Or run directly from the project root:
```bash
npm run dev:dashboard -- --tunnel
npm run dev:dashboard -- --tunnel --tunnel-password "test123"
```

### For End Users
The other example scripts automatically detect if they're running from the development directory and will use the appropriate method.

## Examples Overview

### 🚀 basic-tunnel.sh
Simple tunnel without authentication - good for quick demos or internal sharing.

```bash
./basic-tunnel.sh
```

### 🔒 password-tunnel.sh
Password-protected tunnel - recommended for most use cases.

```bash
./password-tunnel.sh
```

### ⚙️ advanced-tunnel.sh
Full configuration example showing all available options.

```bash
./advanced-tunnel.sh
```

### 👥 team-standup.sh
Optimized for daily standup meetings with easy-to-share credentials.

```bash
./team-standup.sh
```

### 💼 client-demo.sh
Professional setup for client presentations with auto-generated passwords.

```bash
./client-demo.sh
```

## Quick Start

1. Make scripts executable:
```bash
chmod +x *.sh
```

2. Run the appropriate script for your use case:
```bash
./password-tunnel.sh
```

3. Share the displayed URL and password (if set) with viewers

4. Press `Ctrl+C` to stop the dashboard and close the tunnel

## Security Notes

- Always use password protection for sensitive projects
- Share credentials through secure channels (not public chat)
- Stop tunnels when sharing session ends
- Monitor access through the dashboard UI

## Troubleshooting

If tunnels fail to start:

1. Check internet connection
2. Verify firewall allows outbound HTTPS (port 443)
3. Try alternate provider: `--tunnel-provider ngrok`
4. Run with debug mode: `DEBUG=claude-spec:* ./script.sh`

See the full [tunnel documentation](../../docs/tunnel-feature.md) for detailed information.