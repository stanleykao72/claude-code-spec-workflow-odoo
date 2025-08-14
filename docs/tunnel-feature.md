# Dashboard Tunnel Feature Documentation

## Overview

The Dashboard Tunnel feature allows developers to securely share their local Claude Code Spec Workflow dashboard with external stakeholders (managers, clients, team members) through temporary HTTPS URLs. This enables real-time project visibility without requiring technical setup on the viewer's end.

## Quick Start

```bash
# Start dashboard with tunnel
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel

# The output will look like:
# ✓ Dashboard running at http://localhost:3000
# ✓ Tunnel created via Cloudflare
# 
# ╔════════════════════════════════════════════╗
# ║ 🔗 Tunnel Active                           ║
# ║                                            ║
# ║ Share this URL:                            ║
# ║ https://abc123.trycloudflare.com          ║
# ║                                            ║
# ║ Provider: Cloudflare                       ║
# ║                                            ║
# ║ Press Ctrl+C to stop                       ║
# ╚════════════════════════════════════════════╝
```

## Features

### 🔒 Security Features

- **HTTPS Encryption**: All tunnel traffic is encrypted end-to-end
- **Read-Only Access**: External viewers cannot modify any project data
- **Password Protection**: Optional password authentication for access control
- **Automatic Expiration**: Tunnels close when you stop the dashboard
- **No Data Storage**: No project data is stored on tunnel providers

### 👥 Sharing Capabilities

- **Instant Access**: Share URL immediately with stakeholders
- **No Setup Required**: Viewers need only a web browser
- **Real-Time Updates**: External viewers see live spec progress
- **Multiple Viewers**: Support for concurrent external viewers
- **Cross-Platform**: Works on any device with a modern browser

### 📊 Management Features

- **Usage Analytics**: Track visitor count and access times
- **Provider Flexibility**: Automatic fallback between providers
- **Status Display**: See tunnel status in dashboard UI
- **Easy Termination**: Stop tunnel via CLI or dashboard

## Command Line Options

### Basic Usage

```bash
# Start with tunnel using default settings
claude-spec-dashboard --tunnel
```

### Password Protection

```bash
# Set a password for tunnel access
claude-spec-dashboard --tunnel --tunnel-password "mySecret123"
```

### Provider Selection

```bash
# Use specific tunnel provider (cloudflare or ngrok)
claude-spec-dashboard --tunnel --tunnel-provider cloudflare
claude-spec-dashboard --tunnel --tunnel-provider ngrok
```

### Full Configuration

```bash
# All options combined
claude-spec-dashboard \
  --tunnel \
  --tunnel-password "securePass123" \
  --tunnel-provider cloudflare \
  --port 8080 \
  --open
```

## Tunnel Providers

### Cloudflare (Default)

- **No account required** for basic usage
- Uses Cloudflare's free tunnel service via `cloudflared` CLI
- Reliable and fast global network
- Automatic HTTPS certificates
- No time limits on tunnels
- Requires `cloudflared` CLI: `brew install cloudflared`

### ngrok

- **Uses native Node.js bindings** via `@ngrok/ngrok` package
- **Automatically reads auth token** from ngrok configuration
- Sign up at [ngrok.com](https://ngrok.com) for free account
- Set auth token: `ngrok config add-authtoken YOUR_TOKEN`
- More configuration options available
- Better for advanced use cases
- No separate CLI installation needed

### Provider Fallback

The system automatically tries alternate providers if one fails:
1. Tries the specified provider (or Cloudflare by default)
2. Falls back to ngrok if Cloudflare fails
3. Falls back to Cloudflare if ngrok fails
4. Shows clear error if all providers fail

## Security Considerations

### Read-Only Enforcement

All external access is strictly read-only:
- HTTP POST/PUT/DELETE requests are blocked
- WebSocket messages are filtered for read-only
- UI elements for editing are hidden
- No file system access is possible

### Password Protection

When using `--tunnel-password`:
- Viewers must enter password before accessing dashboard
- Password is never stored on disk
- Rate limiting prevents brute force attempts (5 attempts/minute)
- Session management for authenticated users

### Best Practices

1. **Use passwords** for sensitive projects
2. **Share URLs privately** - don't post publicly
3. **Monitor access** - check usage analytics regularly
4. **Stop when done** - close tunnels after sharing sessions
5. **Update regularly** - keep package updated for security fixes

## Troubleshooting

### Common Issues

#### "Permission denied" when running examples
```bash
# This happens when npx can't execute the binary
# Solution: Use npx with --yes flag and @latest
npx --yes -p @pimzino/claude-code-spec-workflow@latest claude-spec-dashboard --tunnel

# Alternative: Install globally first
npm install -g @pimzino/claude-code-spec-workflow
claude-spec-dashboard --tunnel
```

#### "No tunnel provider available"
```bash
# Solution 1: Make sure providers are installed
npm install -g cloudflared  # For Cloudflare
npm install -g ngrok        # For ngrok

# Solution 2: Try alternate provider
claude-spec-dashboard --tunnel --tunnel-provider ngrok
```

#### "ngrok authentication required"
```bash
# Sign up for free account at ngrok.com
# Then set your auth token:
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### "Connection refused" or "Tunnel unreachable"
```bash
# Check if dashboard is running
curl http://localhost:3000  # Should return HTML

# Check firewall settings
# Ensure outbound HTTPS (443) is allowed

# Try alternate port
claude-spec-dashboard --port 8080 --tunnel
```

#### "Password not working"
- Passwords are case-sensitive
- Check for extra spaces when copying
- Try setting a simpler password for testing
- Clear browser cache/cookies if issues persist

### Debug Mode

```bash
# Enable debug logging
DEBUG=claude-spec:* claude-spec-dashboard --tunnel

# This shows:
# - Provider selection process
# - Tunnel creation steps
# - Connection attempts
# - Error details
```

## Usage Analytics

The dashboard tracks basic usage metrics:

- **Visitor Count**: Total number of unique visitors
- **Access Times**: When dashboard was accessed
- **Active Viewers**: Current number of connected users
- **Session Duration**: How long viewers stayed

View analytics in the dashboard UI tunnel status panel.

## Examples

### Sharing with Manager

```bash
# Start dashboard with password for manager review
claude-spec-dashboard --tunnel --tunnel-password "ReviewMeeting2024"

# Share the URL and password via secure channel (Slack DM, email)
# Manager can view real-time progress during standup
```

### Client Demo

```bash
# Start dashboard without password for demo
claude-spec-dashboard --tunnel --open

# Share URL in video call
# Walk through specs while client watches live updates
```

### Team Collaboration

```bash
# Long-running tunnel for distributed team
claude-spec-dashboard --tunnel --tunnel-provider ngrok

# Share URL in team channel
# Team members check progress throughout the day
```

## Technical Details

### Architecture

1. **Local Dashboard** runs on your machine
2. **Tunnel Provider** creates secure reverse proxy
3. **HTTPS URL** provides external access point
4. **Read-Only Proxy** filters all incoming requests
5. **WebSocket Filter** ensures real-time updates remain read-only

### Performance

- Tunnel adds ~50-200ms latency depending on location
- WebSocket connections maintain real-time feel
- Supports 10+ concurrent viewers comfortably
- Dashboard remains responsive under tunnel load

### Requirements

- Active internet connection
- Outbound HTTPS (port 443) allowed
- Modern browser for viewers (Chrome, Firefox, Safari, Edge)
- Node.js 16+ for running dashboard

## Advanced Configuration

### Environment Variables

```bash
# Force specific provider
TUNNEL_PROVIDER=ngrok claude-spec-dashboard --tunnel

# Set default password
TUNNEL_PASSWORD=myDefault claude-spec-dashboard --tunnel

# Custom ngrok region
NGROK_REGION=eu claude-spec-dashboard --tunnel --tunnel-provider ngrok
```

### Programmatic Usage

```javascript
import { startDashboard } from '@pimzino/claude-code-spec-workflow';

const server = await startDashboard({
  port: 3000,
  tunnel: {
    enabled: true,
    password: 'secret123',
    provider: 'cloudflare'
  }
});

console.log(`Tunnel URL: ${server.tunnelUrl}`);
```

## FAQ

**Q: Is my code visible through the tunnel?**
A: No, only the dashboard UI is accessible. No source code or file system access is provided.

**Q: How long do tunnels stay active?**
A: Tunnels remain active as long as your dashboard is running. They close immediately when you stop the dashboard.

**Q: Can viewers see my other projects?**
A: No, only the current project's specs are visible through the dashboard.

**Q: Is there a cost for tunnel usage?**
A: Both Cloudflare and ngrok offer free tiers sufficient for development use. No payment required for basic features.

**Q: Can I use my own domain?**
A: This requires ngrok paid plans or Cloudflare Tunnel configuration. Not supported in the free tier.

## Support

For issues or questions:
1. Check this documentation first
2. Run in debug mode for detailed errors
3. Report issues at [GitHub Issues](https://github.com/pimzino/claude-code-spec-workflow/issues)
4. Include debug output and error messages

---

*The tunnel feature enables secure, temporary sharing of your development progress with stakeholders who need visibility without technical access.*