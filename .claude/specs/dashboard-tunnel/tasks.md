# Implementation Plan: Dashboard Tunnel Feature

## Task Overview
Implement secure tunnel functionality for the Claude Code Spec Workflow dashboard, enabling developers to share read-only access with external stakeholders through temporary HTTPS URLs.

## Steering Document Compliance
Tasks follow structure.md conventions with new tunnel module in `src/dashboard/tunnel/`. Implementation uses established TypeScript patterns from tech.md and maintains dashboard separation of concerns.

## Tasks

- [x] 1. Set up tunnel module structure and core interfaces
  - Create `src/dashboard/tunnel/` directory structure
  - Define TypeScript interfaces for TunnelProvider, TunnelManager, TunnelInstance
  - Set up configuration types and defaults
  - _Leverage: src/dashboard/server.ts, src/utils.ts_
  - _Requirements: 1.1, 5.1_

- [x] 2. Implement base TunnelManager class
  - Create TunnelManager with provider registry
  - Implement provider selection logic with fallback
  - Add tunnel lifecycle management (start/stop)
  - Write unit tests for manager logic
  - _Leverage: src/dashboard/server.ts event patterns_
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [x] 3. Create Cloudflare tunnel provider
  - [x] 3.1 Implement CloudflareProvider class
    - Use cloudflared CLI wrapper or API
    - Handle authentication and configuration
    - Implement health checks and error handling
    - _Leverage: src/utils.ts exec patterns_
    - _Requirements: 5.1, 5.3_
  
  - [x] 3.2 Add Cloudflare provider tests
    - Mock cloudflared responses
    - Test error scenarios and fallback
    - Verify URL generation
    - _Leverage: existing test patterns in tests/_
    - _Requirements: 5.2_

- [x] 4. Create ngrok tunnel provider
  - [x] 4.1 Implement NgrokProvider class
    - Use ngrok npm package or CLI
    - Handle auth token configuration
    - Implement connection management
    - _Leverage: src/utils.ts exec patterns_
    - _Requirements: 5.1, 5.4_
  
  - [x] 4.2 Add ngrok provider tests
    - Mock ngrok API responses
    - Test authentication flows
    - Verify tunnel creation
    - _Leverage: existing test patterns in tests/_
    - _Requirements: 5.2_

- [x] 5. Implement read-only access control
  - [x] 5.1 Create AccessController middleware
    - Block non-GET HTTP requests
    - Filter WebSocket messages for read-only
    - Add request origin validation
    - _Leverage: src/dashboard/server.ts middleware patterns_
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.2 Modify dashboard UI for read-only mode
    - Disable interactive elements when tunneled
    - Add visual indicators for read-only access
    - Update WebSocket message handling
    - _Leverage: src/dashboard/public/index.html, petite-vue patterns_
    - _Requirements: 2.3, 2.4_

- [x] 6. Add password authentication
  - [x] 6.1 Implement password middleware
    - Create password validation endpoint
    - Add rate limiting for attempts
    - Store passwords in memory only
    - _Leverage: Fastify auth patterns_
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 6.2 Create password prompt UI
    - Add login form for tunnel access
    - Handle authentication errors gracefully
    - Implement session management
    - _Leverage: src/dashboard/public/ UI patterns_
    - _Requirements: 4.2, 4.4_

- [x] 7. Implement usage analytics
  - Create UsageTracker class
  - Track visitor count, access times, user agents
  - Implement privacy-preserving IP hashing
  - Add metrics display in dashboard
  - _Leverage: src/dashboard/parser.ts data patterns_
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 8. Add CLI support for tunnel features
  - [x] 8.1 Extend CLI with tunnel flags
    - Add --tunnel flag to dashboard command
    - Add --tunnel-password option
    - Add --tunnel-provider selection
    - _Leverage: src/dashboard/cli.ts, Commander patterns_
    - _Requirements: 1.1, 4.1_
  
  - [x] 8.2 Implement CLI output formatting
    - Display tunnel URL prominently
    - Show connection status and metrics
    - Add copy-to-clipboard support
    - _Leverage: src/cli.ts output patterns, chalk_
    - _Requirements: 1.2, 1.4_

- [x] 9. Integrate tunnel status into dashboard UI
  - [x] 9.1 Create tunnel status component
    - Display active tunnel URL and provider
    - Show real-time viewer count
    - Add stop tunnel button
    - _Leverage: src/dashboard/public/index.html components_
    - _Requirements: 1.4, 3.1_
  
  - [x] 9.2 Add WebSocket updates for tunnel events
    - Broadcast tunnel start/stop events
    - Update viewer count in real-time
    - Show connection status changes
    - _Leverage: src/dashboard/watcher.ts WebSocket patterns_
    - _Requirements: 1.4, 6.2_

- [ ] 10. Add error handling and recovery
  - Implement provider failover logic
  - Add reconnection for dropped tunnels
  - Create user-friendly error messages
  - Add troubleshooting guidance
  - _Leverage: src/utils.ts error patterns_
  - _Requirements: 1.3, 3.3, 5.2_

- [ ] 11. Write integration tests
  - Test end-to-end tunnel creation
  - Verify read-only access enforcement
  - Test password authentication flow
  - Validate analytics collection
  - _Leverage: tests/ integration patterns_
  - _Requirements: All_

- [ ] 12. Create documentation and examples
  - Write tunnel feature documentation
  - Add examples to README
  - Create troubleshooting guide
  - Update CHANGELOG.md
  - _Leverage: Existing docs structure_
  - _Requirements: 5.4_

## Status

✅ APPROVED - Ready to proceed to implementation