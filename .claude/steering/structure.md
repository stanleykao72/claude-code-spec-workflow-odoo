# Project Structure: Claude Code Spec Workflow

## Directory Organization

### Source Code (`src/`)
```
src/
├── index.ts              # Main barrel export
├── cli.ts               # CLI entry point
├── setup.ts             # Core setup orchestration
├── commands.ts          # Slash command definitions
├── templates.ts         # Document templates
├── steering.ts          # Steering document management
├── task-generator.ts    # Task command generation
├── utils.ts            # Shared utilities
├── git.ts              # Git integration
├── claude-md.ts        # CLAUDE.md content
├── scripts.ts          # Script generation (deprecated)
└── dashboard/          # Unified dashboard subsystem
    ├── cli.ts          # Dashboard CLI entry
    ├── multi-server.ts # Main server (handles all projects)
    ├── watcher.ts      # File system monitoring
    ├── parser.ts       # Spec file parsing
    ├── logger.ts       # Logging utilities
    ├── project-discovery.ts # Auto-discovers projects
    └── public/         # Static web assets
        └── index.html  # Main dashboard interface
```

### Generated Structure (`.claude/`)
```
.claude/
├── steering/           # Persistent project context
│   ├── product.md     # Product vision
│   ├── tech.md        # Technical standards
│   └── structure.md   # Project conventions
├── specs/             # Feature specifications
│   └── {feature}/     # Per-feature directory
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── commands/          # Slash commands
│   ├── spec-*.md      # Workflow commands
│   └── {feature}/     # Task commands
│       └── task-*.md
├── templates/         # Document templates
├── scripts/           # Generation scripts
└── spec-config.json   # Configuration
```

## Naming Conventions

### Files
- **TypeScript**: Kebab-case (e.g., `spec-parser.ts`)
- **Markdown**: Kebab-case with clear purpose (e.g., `requirements-template.md`)
- **Configuration**: Standard names (e.g., `package.json`, `tsconfig.json`)
- **Generated**: Feature-based naming (e.g., `user-auth-task-1.md`)

### Code
- **Classes**: PascalCase (e.g., `SpecWorkflowSetup`)
- **Interfaces**: PascalCase with `I` prefix optional (e.g., `SteeringDocuments`)
- **Functions**: camelCase (e.g., `parseTasksFromMarkdown`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Variables**: camelCase

### Exports
- Named exports preferred over default exports
- Barrel exports from index.ts
- Re-export related items together
- Public API clearly defined

## Import Patterns

### Standard Order
1. Node.js built-ins
2. External dependencies  
3. Internal modules
4. Types/interfaces
5. Constants

### Example
```typescript
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { SpecParser } from './parser';
import type { Task } from './types';
```

## Module Boundaries

### Core Modules
- `setup.ts`: Orchestrates entire setup process
- `commands.ts`: Defines all slash commands
- `templates.ts`: Contains all document templates
- `steering.ts`: Manages steering documents

### Dashboard Subsystem (Unified)
- Self-contained in `dashboard/` directory
- Single unified dashboard handles all scenarios
- Multi-project dashboard (`multi-server.ts`) is the ONLY active implementation
- Automatically discovers and monitors all projects with `.claude` directories
- WebSocket support for real-time updates across all projects

### Shared Utilities
- `utils.ts`: Generic helper functions
- `git.ts`: Git-specific operations
- No business logic in utilities
- Pure functions preferred

## Testing Structure

```
tests/
├── setup.test.ts       # Setup orchestration tests
├── commands.test.ts    # Command generation tests
├── templates.test.ts   # Template generation tests
├── steering.test.ts    # Steering document tests
├── utils.test.ts      # Utility function tests
└── dashboard/         # Dashboard-specific tests
```

### Test Conventions
- Test files match source files
- `describe` blocks for logical grouping
- Clear test names explaining behavior
- Arrange-Act-Assert pattern

## Configuration Files

### Root Level
- `package.json`: Package metadata and scripts
- `tsconfig.json`: TypeScript configuration
- `jest.config.js`: Test configuration
- `.eslintrc.js`: Linting rules
- `.prettierrc`: Formatting rules
- `.gitignore`: Version control exclusions
- `.npmignore`: Package exclusions

### Generated Config
- `.claude/spec-config.json`: Workflow configuration
- Version and metadata tracking
- No user-specific settings

## Build Outputs

### Distribution (`dist/`)
- Mirrors source structure
- Includes source maps
- CommonJS format
- Dashboard static files copied

### Package Contents
- Compiled JavaScript only
- README and LICENSE
- CHANGELOG for history
- No source TypeScript

## Best Practices

### File Size
- Keep files under 300 lines
- Extract complex logic to separate modules
- One primary export per file
- Group related functionality

### Dependencies
- Minimize external dependencies
- Pin versions for stability
- Regular security updates
- Document why each is needed

### Documentation
- JSDoc for public APIs
- Inline comments for complex logic
- README in key directories
- Examples in documentation