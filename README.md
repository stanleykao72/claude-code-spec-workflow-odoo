# Claude Code Spec Workflow

[![npm version](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow.svg?cacheSeconds=300)](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Automated workflows for Claude Code. Features **spec-driven development** for new features (**Requirements → Design → Tasks → Implementation**) and **streamlined bug fix workflow** for quick issue resolution (**Report → Analyze → Fix → Verify**).

## ☕ Support This Project

If you support my work and enjoy this project, please help contribute to keeping me awake and releasing updates by buying me a coffee! ❤️

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

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

- The setup automatically creates:
- **📁 .claude/ directory structure** with all necessary files
- **📝 10 slash commands** (5 spec workflow + 5 bug fix workflow)
- **🎯 Steering documents** for persistent project context
- **🤖 Auto-generated task commands** for each spec
- **📋 Document templates** for both workflows
- **⚙️ Configuration files** for workflow automation
- **🔧 NPX-based task command generation** for dynamic task commands
- **📖 Complete workflow instructions** embedded in each command

## 🔄 Workflow Overview

### 📊 Spec Driven Development Workflow

#### Steering Setup (`/spec-steering-setup`)
##### Only relevant to run first if running in a current project, otherwise start from `/spec-create`
- Creates persistent project context documents
- Analyzes your codebase and gathers project information
- Generates product.md, tech.md, and structure.md
- Ensures all specs align with your project's vision and standards

#### Complete Workflow (`/spec-create`)
The `/spec-create` command handles the entire spec workflow in one seamless process:

1. **Requirements Phase**
   - Generates user stories and acceptance criteria
   - Uses EARS format (WHEN/IF/THEN statements)
   - Aligns with product vision from steering documents
   - Automatically validated before user review

2. **Design Phase**
   - Creates technical architecture and design
   - Follows technical standards from steering documents
   - Includes Mermaid diagrams for visualization
   - Validates against requirements coverage

3. **Tasks Phase**
   - Breaks design into atomic coding tasks
   - Ensures all requirements and design components are covered
   - References specific requirements for traceability
   - Validates task atomicity for agent execution

4. **Task Generation** (Optional)
   - Generates individual task commands for granular execution
   - Each task becomes its own executable command

#### Implementation Phase (`/spec-execute`)
- Executes tasks systematically
- Follows all steering document guidelines
- Validates against requirements
- Ensures quality and consistency

### 🐛 Bug Fix Workflow (for bug fixes)

#### 1. **Report Phase** (`/bug-create`)
- Documents the bug with structured format
- Captures expected vs actual behavior
- Records reproduction steps and environment
- Assesses impact and severity

#### 2. **Analysis Phase** (`/bug-analyze`)
- Investigates root cause systematically
- Maps affected code locations
- Plans fix strategy and approach
- Considers alternative solutions

#### 3. **Fix Phase** (`/bug-fix`)
- Implements targeted, minimal fix
- Follows project coding standards
- Adds appropriate tests
- Preserves existing functionality

#### 4. **Verification Phase** (`/bug-verify`)
- Verifies bug is resolved
- Tests for regressions
- Confirms code quality
- Documents resolution

## 🛠️ Usage

After setup, use these commands in Claude Code:

### 📊 Spec Workflow Commands (for new features)

```bash
# Set up steering documents (recommended first step!)
/spec-steering-setup

# Create a new feature spec (handles complete workflow)
/spec-create user-authentication "Secure login system"

# Execute specific tasks (two ways):
/spec-execute 1                    # Traditional way
/user-authentication-task-1       # Auto-generated command (after task generation)

# Execute subtasks
/user-authentication-task-2.1     # Auto-generated for subtasks

# Check status
/spec-status

# List all specs
/spec-list
```

### 🐛 Bug Fix Workflow Commands (for bug fixes)

```bash
# Start a new bug fix
/bug-create login-timeout "Users getting logged out too quickly"

# Analyze the bug
/bug-analyze

# Implement the fix
/bug-fix

# Verify the fix works
/bug-verify

# Check bug status
/bug-status
```

### ⚖️ When to Use Which Workflow?

**Use Spec Workflow for:**
- New features or major functionality
- Complex changes requiring design planning
- Features that need detailed requirements gathering
- Long-term development projects

**Use Bug Fix Workflow for:**
- Fixing existing functionality
- Small, targeted changes
- Quick issue resolution
- Troubleshooting and debugging

### 🆕 Auto-Generated Task Commands

During `/spec-create` you will be asked if you want task commands generated. If
you answer **yes**, Claude Code automatically runs
`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands <spec-name>`
to create commands for each approved task. You can also run this command
yourself later.

Benefits of task commands:
- **Easier execution**: `/user-auth-task-1` instead of `/spec-execute 1 user-authentication`
- **Better organization**: Commands grouped by spec in `.claude/commands/{spec-name}/`
- **Auto-completion**: Claude Code can suggest spec-specific commands
- **Clear purpose**: Each command shows exactly what task it executes

### 📊 Real-Time Dashboard

Monitor your specs and tasks with a beautiful web dashboard:

```bash
# Start the dashboard
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard

# Start on custom port
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --port 8080

# Auto-open in browser
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --open

# Alternative: If you have the package installed globally
npm install -g @pimzino/claude-code-spec-workflow
claude-spec-dashboard
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

### 🔗 Dashboard Tunnel (NEW!)

Share your dashboard securely with external stakeholders through temporary HTTPS URLs:

```bash
# Start dashboard with tunnel
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel

# With password protection
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel --tunnel-password mySecret123

# Choose specific provider
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel --tunnel-provider cloudflare
```

**Tunnel Features:**
- **🔒 Secure HTTPS URLs** - Share dashboard with managers, clients, or remote team members
- **👁️ Read-Only Access** - External viewers cannot modify any project data
- **🔑 Optional Password** - Protect access with password authentication
- **🌐 Multiple Providers** - Automatic fallback between Cloudflare and ngrok
- **📊 Usage Analytics** - Track who accessed your dashboard and when
- **⏰ Auto-Expiration** - Tunnels close when you stop the dashboard
- **🚀 Zero Configuration** - Works out of the box with built-in providers

## 📊 Command Line Options

### Setup Commands
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

### Dashboard Commands
```bash
# Basic dashboard
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard

# Dashboard with tunnel (share externally)
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel

# Full tunnel configuration
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard \
  --tunnel \
  --tunnel-password mySecret123 \
  --tunnel-provider cloudflare \
  --port 3000 \
  --open
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
- Complete workflow instructions in each command file
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
│   │   ├── spec-create.md            # Complete workflow
│   │   ├── spec-execute.md
│   │   ├── spec-status.md
│   │   ├── spec-list.md
│   │   ├── spec-steering-setup.md
│   │   └── {spec-name}/              # Auto-generated
│   │       ├── task-1.md
│   │       ├── task-2.md
│   │       └── task-2.1.md
│   ├── steering/                     # NEW!
│   │   ├── product.md               # Product vision & goals
│   │   ├── tech.md                  # Technical standards
│   │   └── structure.md             # Project conventions
│   ├── templates/
│   │   ├── requirements-template.md
│   │   ├── design-template.md
│   │   └── tasks-template.md
│   ├── specs/
│   │   └── (your specs will be created here)
│   └── spec-config.json
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
- **[Tunnel Feature Guide](./docs/tunnel-feature.md)** - Comprehensive tunnel documentation
- **[Tunnel Examples](./examples/tunnel/)** - Ready-to-use tunnel scripts
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
@mquinnv - spec workflow dashboard feature

## Acknowledgments

- [Claude Code](https://docs.anthropic.com/claude-code)
- [Kiro](https://kiro.dev/)
- [Easy Approach to Requirements Syntax](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax)
- [Mermaid](https://mermaid.js.org/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Jest](https://jestjs.io/)
