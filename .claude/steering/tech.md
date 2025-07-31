# Technology Standards: Claude Code Spec Workflow

## Technology Stack

### Core Technologies
- **Language**: TypeScript 5.2+ (strict mode enabled)
- **Runtime**: Node.js 16.0.0+ (LTS versions preferred)
- **Module System**: CommonJS for maximum compatibility
- **Build Target**: ES2020

### CLI Framework
- **Commander.js**: Command parsing and CLI structure
- **Inquirer**: Interactive prompts for user input
- **Chalk 4.x**: Terminal styling (CommonJS compatible)
- **Ora 5.x**: Loading spinners (CommonJS compatible)

### Web Dashboard
- **Server**: Fastify 4.x with WebSocket support
- **Frontend**: petite-vue (6kb) for reactivity
- **Styling**: Tailwind CSS via CDN
- **File Watching**: Chokidar for real-time updates
- **Port Management**: Dynamic port allocation with fallbacks

### Development Tools
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier with consistent config
- **Type Checking**: TypeScript compiler in strict mode
- **Package Management**: npm/pnpm

## Technical Constraints

### Compatibility Requirements
- Must work with all Claude Code installations
- Cross-platform support (Windows, macOS, Linux)
- No external service dependencies
- Offline-capable (except for CDN resources)

### Performance Requirements
- Dashboard response time < 100ms for file updates
- WebSocket reconnection within 5 seconds
- Minimal CPU usage during file watching
- Small package size (< 10MB installed)

### Security Considerations
- No external data transmission
- Local file system access only
- No authentication required (internal development tool)
- Safe file operations with proper error handling
- Future: Tunnel feature for secure sharing with management

## Development Practices

### Code Style
- TypeScript strict mode always enabled
- Explicit types (avoid `any`)
- Functional programming preferred where appropriate
- Async/await over callbacks
- Early returns for cleaner code

### Error Handling
- Graceful degradation for non-critical features
- User-friendly error messages
- Proper cleanup on failure
- Exit codes for CLI operations

### Testing Strategy
- Unit tests for core logic
- Integration tests for CLI commands
- Mock file system operations
- Minimum 80% code coverage goal

### Logging
- Minimal console output by default
- Debug mode via environment variable
- Structured logging in dashboard
- No sensitive data in logs

## Architecture Patterns

### Separation of Concerns
- CLI logic separate from business logic
- Dashboard server isolated from spec logic
- Templates as separate modules
- Shared utilities in dedicated module

### File Organization
- Feature-based organization (dashboard/, templates/)
- Barrel exports from index.ts
- Types/interfaces in source files
- No circular dependencies

### State Management
- Stateless CLI operations
- WebSocket for real-time state sync
- File system as source of truth
- No in-memory caching of specs

## Integration Points

### Claude Code Integration
- Slash commands in `.claude/commands/`
- CLAUDE.md for workflow instructions
- Respects Claude Code's file structure
- No modification of Claude Code itself

### Version Control
- Git-friendly file structure
- All specs in trackable markdown
- No binary files generated
- Meaningful file names for diffs

### Third-Party Services
- CDN for Tailwind CSS (fallback considered)
- npm registry for distribution
- No other external dependencies

## Release Strategy

### Versioning
- Semantic versioning (MAJOR.MINOR.PATCH)
- Breaking changes in major versions only
- Backward compatibility within major versions
- Deprecation warnings before removal

### Distribution
- Primary: npm package (@pimzino/claude-code-spec-workflow)
- Installation: npx, global, or local
- No standalone binaries
- Source maps included

### Quality Gates
- All tests passing
- Type checking clean
- Linting errors resolved
- Manual testing of key workflows
- CHANGELOG.md updated