# Claude Code Spec Workflow

[![npm version](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow.svg?cacheSeconds=3600)](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Automated spec-driven workflow for Claude Code. Transform feature ideas into complete implementations through **Requirements → Design → Tasks → Implementation**.

## 🚀 Quick Start

Install and run in any project directory:

```bash
npx @pimzino/claude-code-spec-workflow
```

That's it! The workflow will be automatically set up in your project.

## 📦 Installation Options

### NPX (Recommended)
```bash
# Run once in your project directory
npx @pimzino/claude-code-spec-workflow

# Test the setup
npx @pimzino/claude-code-spec-workflow test
```

### Global Installation
```bash
# Install globally
npm install -g @pimzino/claude-code-spec-workflow

# Use anywhere
claude-spec-setup
```

### Local Installation
```bash
# Install as dev dependency
npm install --save-dev @pimzino/claude-code-spec-workflow

# Run via package.json script
npx claude-spec-setup
```

## 🎯 What It Does

The setup automatically creates:
- **📁 .claude/ directory structure** with all necessary files
- **📝 8 slash commands** for the complete workflow (including steering setup!)
- **🎯 Steering documents** for persistent project context (NEW!)
- **🤖 Auto-generated task commands** for each spec
- **📋 Document templates** for consistent formatting
- **⚙️ Configuration files** for workflow automation
- **🔧 Command generation scripts** for dynamic task commands
- **📖 CLAUDE.md** with comprehensive workflow instructions

## 🔄 Workflow Overview

### 0. **Steering Setup** (`/spec-steering-setup`) - NEW!
- Creates persistent project context documents
- Analyzes your codebase and gathers project information
- Generates product.md, tech.md, and structure.md
- Ensures all specs align with your project's vision and standards

### 1. **Requirements Phase** (`/spec-requirements`)
- Generates user stories and acceptance criteria
- Uses EARS format (WHEN/IF/THEN statements)
- Aligns with product vision from steering documents
- Ensures comprehensive requirement coverage

### 2. **Design Phase** (`/spec-design`)
- Creates technical architecture and design
- Follows technical standards from steering documents
- Includes Mermaid diagrams for visualization
- Plans components, interfaces, and data models

### 3. **Tasks Phase** (`/spec-tasks`)
- Breaks design into atomic coding tasks
- Respects project structure conventions
- References specific requirements
- Focuses on test-driven development

### 4. **Implementation Phase** (`/spec-execute`)
- Executes tasks systematically
- Follows all steering document guidelines
- Validates against requirements
- Ensures quality and consistency

## 🛠️ Usage

After setup, use these commands in Claude Code:

```bash
# Set up steering documents (recommended first step!)
/spec-steering-setup

# Create a new feature spec
/spec-create user-authentication "Secure login system"

# Generate requirements document
/spec-requirements

# Create design document
/spec-design

# Generate implementation tasks
/spec-tasks

# Execute specific tasks (two ways):
/spec-execute 1                    # Traditional way
/user-authentication-task-1       # New auto-generated command

# Execute subtasks
/user-authentication-task-2.1     # Auto-generated for subtasks

# Check status
/spec-status

# List all specs
/spec-list
```

### 🆕 Auto-Generated Task Commands

The workflow now automatically creates individual commands for each task:
- **Easier execution**: `/user-auth-task-1` instead of `/spec-execute 1 user-authentication`
- **Better organization**: Commands grouped by spec in `.claude/commands/{spec-name}/`
- **Auto-completion**: Claude Code can suggest spec-specific commands
- **Clear purpose**: Each command shows exactly what task it executes

### 📊 Real-Time Dashboard

Monitor your specs and tasks with a beautiful web dashboard:

```bash
# Start the dashboard
npx claude-spec-dashboard

# Start on custom port
npx claude-spec-dashboard --port 8080

# Auto-open in browser
npx claude-spec-dashboard --open
```

**Dashboard Features:**
- **Real-time updates** - See changes as they happen
- **Steering documents status** - Visual indicators for product.md, tech.md, and structure.md
- **Progress tracking** - Visual progress bars for each spec
- **Task breakdown** - Expandable task lists with status
- **Code reuse visibility** - See leverage references at a glance
- **Git integration** - Shows current branch with GitHub links
- **Modern UI** - Built with Tailwind CSS and petite-vue
- **Lightweight** - No heavy frameworks, just fast tools
- **WebSocket powered** - Instant updates when files change

## 📊 Command Line Options

```bash
# Setup in current directory
npx @pimzino/claude-code-spec-workflow

# Setup in specific directory
npx @pimzino/claude-code-spec-workflow --project /path/to/project

# Force overwrite existing files
npx @pimzino/claude-code-spec-workflow --force

# Skip confirmation prompts
npx @pimzino/claude-code-spec-workflow --yes

# Test the setup
npx @pimzino/claude-code-spec-workflow test
```

## 🎯 Steering Documents (NEW!)

Steering documents provide persistent project context that guides all spec development:

### **Product Document** (`product.md`)
- Product vision and purpose
- Target users and their needs
- Key features and objectives
- Success metrics

### **Technology Document** (`tech.md`)
- Technology stack and frameworks
- Development tools and practices
- Technical constraints and requirements
- Third-party integrations

### **Structure Document** (`structure.md`)
- File organization patterns
- Naming conventions
- Import patterns
- Code organization principles

Run `/spec-steering-setup` to create these documents. Claude will analyze your project and help you define these standards.

## 🎨 Features

### ✅ **Zero Configuration**
- Works out of the box with any project
- Auto-detects project type (Node.js, Python, Java, etc.)
- Validates Claude Code installation

### ✅ **Interactive Setup**
- Beautiful CLI with progress indicators
- Confirmation prompts for safety
- Helpful error messages and guidance

### ✅ **Smart File Management**
- Preserves existing `CLAUDE.md` content
- Creates comprehensive directory structure
- Includes all necessary templates and configs

### ✅ **Professional Quality**
- TypeScript implementation
- Comprehensive error handling
- Follows npm best practices

### ✅ **Steering Document Integration**
- Persistent project context across all specs
- Automatic alignment with project standards
- Consistent code generation
- Reduced need for repetitive explanations

## 🏗️ Project Structure After Setup

```
your-project/
├── .claude/
│   ├── commands/
│   │   ├── spec-create.md
│   │   ├── spec-requirements.md
│   │   ├── spec-design.md
│   │   ├── spec-tasks.md
│   │   ├── spec-execute.md
│   │   ├── spec-status.md
│   │   ├── spec-list.md
│   │   ├── spec-steering-setup.md    # NEW!
│   │   └── {spec-name}/              # Auto-generated
│   │       ├── task-1.md
│   │       ├── task-2.md
│   │       └── task-2.1.md
│   ├── steering/                     # NEW!
│   │   ├── product.md               # Product vision & goals
│   │   ├── tech.md                  # Technical standards
│   │   └── structure.md             # Project conventions
│   ├── scripts/
│   │   ├── generate-commands.bat     # Windows script
│   │   ├── generate-commands.sh      # macOS/Linux script
│   │   ├── generate-commands-launcher.sh  # OS detection launcher
│   │   └── README.md                 # Script documentation
│   ├── templates/
│   │   ├── requirements-template.md
│   │   ├── design-template.md
│   │   └── tasks-template.md
│   ├── specs/
│   │   └── (your specs will be created here)
│   └── spec-config.json
└── CLAUDE.md (created/updated)
```

## 🧪 Testing

The package includes a built-in test command:

```bash
# Test setup in temporary directory
npx @pimzino/claude-code-spec-workflow test
```

## 📋 Requirements

- **Node.js** 16.0.0 or higher
- **Claude Code** installed and configured
- Any project directory

## 🔧 Troubleshooting

### Common Issues

**❓ Command not found after NPX**
```bash
# Make sure you're using the correct package name
npx @pimzino/claude-code-spec-workflow
```

**❓ Setup fails with permission errors**
```bash
# Try with different directory permissions
npx @pimzino/claude-code-spec-workflow --project ~/my-project
```

**❓ Claude Code not detected**
```bash
# Install Claude Code first
npm install -g @anthropic-ai/claude-code
```

### Debug Information

```bash
# Show verbose output
DEBUG=* npx @pimzino/claude-code-spec-workflow

# Check package version
npx @pimzino/claude-code-spec-workflow --version
```

## 🌟 Examples

### Basic Usage
```bash
cd my-awesome-project
npx @pimzino/claude-code-spec-workflow
claude
# Type: /spec-create user-dashboard "User profile management"
```

### Advanced Usage
```bash
# Setup multiple projects
for dir in project1 project2 project3; do
  npx @pimzino/claude-code-spec-workflow --project $dir --yes
done
```

## 📚 Documentation

- **[Full Documentation](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](https://github.com/pimzino/claude-code-spec-workflow/blob/main/LICENSE) for details.

## 🏷️ Changelog

See [CHANGELOG.md](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CHANGELOG.md) for version history.

---

**Transform your development workflow with automated spec-driven development!** 🚀

Made with ❤️ by [Pimzino](https://github.com/pimzino)

## Special Thanks
@pimzino - for the initial setup
@boundless-oss - Adding steering documents

## Acknowledgments

- [Claude Code](https://docs.anthropic.com/claude-code)
- [Kiro](https://kiro.dev/)
- [Easy Approach to Requirements Syntax](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax)
- [Mermaid](https://mermaid.js.org/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Jest](https://jestjs.io/)
