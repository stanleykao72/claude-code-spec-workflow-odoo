# Claude Code Spec Workflow - Odoo ERP Edition

**Language / 語言:**
🇺🇸 English | [🇹🇼 繁體中文](README-zh-TW.md)

> **🎉 ODOO ERP CUSTOMIZATION VERSION:** This is an enhanced version of the original Claude Code Spec Workflow, specifically adapted for Odoo ERP customization development. It includes all original features plus comprehensive Odoo-specific tools and workflows.
> 
> **📚 [Original Project by Pimzino →](https://github.com/Pimzino/claude-code-spec-workflow)**
> 
> **🚀 [View the new MCP version →](https://github.com/Pimzino/spec-workflow-mcp)**

[![npm version](https://badge.fury.io/js/@stanleykao72%2Fclaude-code-spec-workflow-odoo.svg?cacheSeconds=300)](https://badge.fury.io/js/@stanleykao72%2Fclaude-code-spec-workflow-odoo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automated workflows for Claude Code with Odoo ERP customization development support.**

Transform your development with structured workflows: **Requirements → Design → Tasks → Implementation** for new features, plus streamlined **Report → Analyze → Fix → Verify** for bug fixes.

## ☕ Support This Project

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 📦 Installation

1. Install the Odoo edition workflow globally
```bash
npm i -g @stanleykao72/claude-code-spec-workflow-odoo
```
2. Run the setup command in your project directory
```bash
# Install the Claude Code workflow with Odoo integration
claude-code-spec-workflow-odoo setup
# or using npx
npx @stanleykao72/claude-code-spec-workflow-odoo setup
```

3. For Odoo projects, also run the specialized Odoo environment setup
```bash
claude-code-spec-workflow-odoo odoo-setup
# or using npx
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup
```

**That's it, you are ready to go!**

### 🎯 For Odoo ERP Development

If you're working on Odoo projects, you get additional powerful features:

- **📊 Version Detection** - Automatic detection of Odoo 14.0-18.0 installations
- **🏗️ Module Management** - Create, validate, and manage custom modules  
- **🔄 Environment Support** - Local, Docker, remote, and Odoo.sh environments
- **🧪 Testing Integration** - pytest-odoo framework with coverage reporting
- **🔗 Model Analysis** - Inheritance chain analysis and validation
- **⚙️ Command Lifecycle** - Automatic cleanup and archiving of expired commands

**Next steps for Odoo development:**
```bash
# Detect your Odoo version
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-detect

# Generate steering documents for your Odoo project
claude  # Then use: /odoo-steering

# Start creating Odoo-specific specifications
claude  # Then use: /odoo-spec-create module-name "Module description"
```
---

## ✨ What You Get - Core Features + Odoo ERP Integration

### 🚀 Core Workflow Features
- **📁 Complete .claude/ structure** - All files and directories
- **📝 10 slash commands** - 5 spec workflow + 5 bug fix workflow
- **🎯 Intelligent task execution** - Automated implementation
- **🤖 4 specialized agents** - Enhanced automation
- **📊 Real-time dashboard** - Monitor progress visually
- **🔧 Auto-generated commands** - One command per task
- **📋 Document templates** - Professional spec documents
- **⚙️ Project steering** - Persistent context and standards
- **⚡ Smart optimization** - Intelligent context sharing and caching

### 🎯 Odoo ERP Exclusive Features
- **📊 Multi-version support** - Odoo 14.0 through 18.0 compatibility
- **🏗️ Advanced module management** - Create, validate, scaffold custom modules
- **🔄 Multi-environment deployment** - Local, Docker, remote, and Odoo.sh
- **🧪 pytest-odoo integration** - Comprehensive testing with coverage
- **🔗 Model inheritance analysis** - Deep ORM relationship mapping
- **⚙️ Smart command lifecycle** - Automatic cleanup and archiving
- **📋 Odoo-specific templates** - ERP-focused document generation with auto-copy to `.odoo-dev/templates/`

#### 🎯 Odoo Template Auto-Copy Feature (v1.6.11+)

After running `odoo-setup`, the system automatically copies 5 Odoo-specific templates to `.odoo-dev/templates/` directory:

- **`odoo-requirements-template.md`** - Odoo requirements document template
- **`odoo-design-template.md`** - Odoo design document template  
- **`odoo-tasks-template.md`** - Odoo tasks document template
- **`odoo-product-template.md`** - Odoo product document template
- **`odoo-cleanup-policy.yaml`** - Odoo cleanup policy configuration

**Commands correctly reference templates:**
- `/odoo-spec-create` - Uses templates from `.odoo-dev/templates/`
- `/odoo-feature-create` - Uses templates from `.odoo-dev/templates/`
- `/odoo-steering` - Uses templates from `.odoo-dev/templates/`
- `get-template-context odoo` - Lists all Odoo templates from correct directory

---

## 🔄 Workflows Overview

### 📊 **Spec Workflow** (New Features)

**Complete automation in one command:**

```bash
/spec-create feature-name "Description"
```

**What happens:**
1. **Requirements** → User stories + acceptance criteria
2. **Design** → Technical architecture + diagrams
3. **Tasks** → Atomic, agent-friendly breakdown
4. **Commands** → Auto-generated task commands (optional)

**Execute tasks:**
```bash
# Manual control
/spec-execute 1 feature-name
/feature-name-task-1        # Auto-generated
```

### 🐛 **Bug Fix Workflow** (Quick Fixes)

```bash
/bug-create issue-name "Description"  # Document the bug
/bug-analyze                          # Find root cause
/bug-fix                             # Implement solution
/bug-verify                          # Confirm resolution
```

### 🎯 **Steering Setup** (Project Context)

```bash
/spec-steering-setup  # Creates product.md, tech.md, structure.md
```

---

## 🛠️ Commands Reference

<details>
<summary><strong>📊 Spec Workflow Commands</strong></summary>

#### General Commands
| Command | Purpose |
|---------|---------|
| `/spec-steering-setup` | Create project context documents |
| `/spec-create <name>` | Complete spec workflow |
| `/spec-execute <task-id>` | Manual task execution |
| `/<name>-task-<id>` | Auto-generated task commands |
| `/spec-status` | Show progress |
| `/spec-list` | List all specs |

#### Odoo ERP Commands
| Command | Purpose |
|---------|---------|
| `/odoo-steering` | Create Odoo-specific steering documents |
| `/odoo-spec-create <name>` | Create Odoo module specifications |
| `/odoo-spec-execute <task-id> <spec>` | Execute Odoo module tasks |
| `/odoo-spec-status [module] [type] [spec]` | Show Odoo module spec status |
| `/odoo-spec-list` | List all Odoo module specifications |
| `/odoo-feature-create <name>` | Create Odoo feature specifications |
| `/odoo-module-test <name>` | Test Odoo modules |

</details>

<details>
<summary><strong>🐛 Bug Fix Commands</strong></summary>

#### General Commands
| Command | Purpose |
|---------|---------|
| `/bug-create <name>` | Document bug with structured format |
| `/bug-analyze` | Investigate root cause |
| `/bug-fix` | Implement targeted solution |
| `/bug-verify` | Verify resolution |
| `/bug-status` | Show bug fix progress |

#### Odoo ERP Bug Commands
| Command | Purpose |
|---------|---------|
| `/odoo-bug-create <name>` | Create Odoo module bug reports |
| `/odoo-bug-analyze` | Analyze Odoo module bug root causes |
| `/odoo-bug-fix <name>` | Fix Odoo-specific module bugs |
| `/odoo-bug-verify <name>` | Verify Odoo module bug fixes |
| `/odoo-bug-status` | Show Odoo module bug status |

</details>

---

## 🎯 Key Features

### 🤖 **Intelligent Task Execution**
- **Streamlined** task implementation
- **Context-aware** execution with full specification context
- **Agent-based** implementation with spec-task-executor

### 🧠 **Specialized Agents** (Optional)
8 AI agents for enhanced automation:

**Core Workflow Agents:** `spec-task-executor`, `spec-requirements-validator`, `spec-design-validator`, `spec-task-validator`

**Odoo ERP Agents:** `odoo-spec-task-executor`, `odoo-spec-requirements-validator`, `odoo-spec-design-validator`, `odoo-spec-task-validator`


> **Note:** Agents are optional - everything works with built-in fallbacks.

### ⚡ **Complete Context Optimization** (NEW!)
- **Universal context sharing** - Steering, specification, AND template documents optimized
- **60-80% token reduction** - Eliminates redundant document fetching across all document types
- **Triple optimization commands** - `get-steering-context`, `get-spec-context`, and `get-template-context`
- **Smart document handling** - Bug documents use direct reading (no redundancy), templates use bulk loading (high redundancy)
- **Improved performance** - Faster agent execution with cached context across all workflows
- **Automatic fallback** - Maintains reliability with individual `get-content` when optimization unavailable
- **Session-based caching** - Intelligent file change detection and cache invalidation

### 📊 **Real-Time Dashboard**
```bash
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard
```
- Live progress tracking
- WebSocket updates
- Git integration
- Modern UI with Tailwind CSS

---

### 🔗 Dashboard Tunnel (NEW!)

Share your dashboard securely with external stakeholders through temporary HTTPS URLs:

```bash
# Start dashboard with tunnel
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel

# With password protection
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel --tunnel-password mySecret123

# Choose specific provider
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel --tunnel-provider cloudflare
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
npx @stanleykao72/claude-code-spec-workflow-odoo

# Setup in specific directory
npx @stanleykao72/claude-code-spec-workflow-odoo --project /path/to/project

# Force overwrite existing files
npx @stanleykao72/claude-code-spec-workflow-odoo --force

# Skip confirmation prompts
npx @stanleykao72/claude-code-spec-workflow-odoo --yes

# Test the setup
npx @stanleykao72/claude-code-spec-workflow-odoo test
```

### Dashboard Commands
```bash
# Basic dashboard
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard

# Dashboard with tunnel (share externally)
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard --tunnel

# Full tunnel configuration
npx -p @stanleykao72/claude-code-spec-workflow-odoo claude-spec-dashboard \
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
- **Full TypeScript implementation** with strict type checking
- **Frontend converted to TypeScript** for enhanced dashboard development
- **95%+ type coverage** with no implicit any types
- **Modern build pipeline** with esbuild bundling and source maps
- Comprehensive error handling
- Follows npm best practices

### ✅ **Steering Document Integration**
- Persistent project context across all specs
- Automatic alignment with project standards
- Consistent code generation
- Reduced need for repetitive explanations

### ✅ **TypeScript Dashboard Frontend**
- **Type-safe frontend code** with comprehensive interfaces
- **Real-time WebSocket communication** with typed message handling
- **Petite-vue integration** with custom type definitions
- **Build pipeline** supporting development and production bundles
- **Strict null checking** and modern TypeScript patterns
- **JSDoc documentation** for all exported functions

## 🏗️ Project Structure After Setup

### General Claude Code Projects
```
your-project/
├── .claude/
│   ├── commands/           # 14 slash commands + auto-generated
│   ├── steering/          # product.md, tech.md, structure.md
│   ├── templates/         # General document templates
│   ├── specs/            # Generated specifications
│   ├── bugs/             # Bug fix workflows
│   └── agents/           # AI agents (enabled by default)
```

### Odoo ERP Projects (Additional Structure)
```
your-odoo-project/
├── .claude/              # General Claude Code structure (same as above)
└── .odoo-dev/           # Odoo-specific structure
    ├── templates/       # 🆕 Odoo-specific templates (v1.6.11+ auto-copied)
    │   ├── odoo-requirements-template.md
    │   ├── odoo-design-template.md
    │   ├── odoo-tasks-template.md
    │   ├── odoo-product-template.md
    │   └── odoo-cleanup-policy.yaml
    ├── steering/        # Odoo guidance documents
    └── config.json      # Odoo configuration file
```

## 🧪 Testing

The package includes a built-in test command:

```bash
# Test setup in temporary directory
npx @stanleykao72/claude-code-spec-workflow-odoo test
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
npx @stanleykao72/claude-code-spec-workflow-odoo
```

**❓ Setup fails with permission errors**
```bash
# Try with different directory permissions
npx @stanleykao72/claude-code-spec-workflow-odoo --project ~/my-project
```

**❓ Claude Code not detected**
```bash
# Install Claude Code first
npm install -g @anthropic-ai/claude-code
```

### Debug Information

```bash
# Show verbose output
DEBUG=* npx @stanleykao72/claude-code-spec-workflow-odoo

# Check package version
npx @stanleykao72/claude-code-spec-workflow-odoo --version
```

## 🔧 Odoo-Specific Features

### **Odoo ERP Development Support**
- **Project Detection** - Automatic detection of Odoo modules and versions
- **Module Management** - Create, validate, and manage custom modules
- **Version Compatibility** - Support for Odoo 14.0-18.0
- **Testing Integration** - pytest-odoo framework support
- **Model Analysis** - Inheritance chain analysis and validation
- **Multi-Environment Support** - Local, Docker, remote, and Odoo.sh

### **🐛 Odoo Module Bug Reporting Workflow**

#### **1. Create Bug Report**
```bash
/odoo-bug-fix [module-name]-[issue-description] "Detailed description"
```
**Example:**
```bash
/odoo-bug-fix inventory-stock-error "Inventory module calculation error"
```

#### **2. Complete Bug Fix Workflow**
```bash
# Step 1: Log the error (including module info)
/odoo-bug-fix inventory-calculation-bug "Inventory calculation shows negative values under specific conditions"

# Step 2: Analyze root cause
/bug-analyze

# Step 3: Implement solution
/bug-fix

# Step 4: Verify fix
/bug-verify
```

#### **3. Alternative General Bug Workflow**
```bash
# Create bug report (specify module)
/bug-create [module-name]-bug-name "Issue description found in [module-name] module"

# Example
/bug-create sale-order-bug "Sales order module calculation error when processing discounts"
```

#### **4. Odoo-Specific Bug Information**
When using `/odoo-bug-fix`, the system automatically:
- ✅ Detects related Odoo module structure
- ✅ Analyzes module dependencies
- ✅ Checks Odoo version compatibility
- ✅ Provides module-specific testing suggestions

**Recommended naming convention:**
- `[module-name]-[error-type]-[short-description]`
- Examples: `inventory-calculation-negative`, `sale-discount-error`, `account-payment-timeout`

### **Complete Odoo Command Reference**

#### **Setup and Environment Commands**
```bash
# Specialized Odoo setup
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup

# Environment detection and management
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-detect
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-version
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-env
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-modules
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-cmd
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-cleanup
```

#### **Specification Commands**
```bash
# Steering and project setup
/odoo-steering                                   # Generate Odoo steering documents

# Feature specification workflow
/odoo-spec-create module-name "Module description"
/odoo-feature-create module-feature-name "Feature description for Odoo module"
/odoo-module-test module-name "Test description for module"

# Module specification management (v1.6.13+)
/odoo-spec-list                              # List all module specifications
/odoo-spec-status [module] [type] [spec]     # Show detailed status  
/odoo-spec-execute <task-id> <spec> [module] # Execute specification tasks
```

#### **Bug Fix Commands**
```bash
# Complete Odoo bug workflow
/odoo-bug-create module-bug-name "Bug description"    # Create bug report
/odoo-bug-analyze                                      # Analyze root cause
/odoo-bug-fix module-issue-name "Bug description"     # Fix bug with ERP context
/odoo-bug-verify module-bug-name                      # Verify fix with integration testing
/odoo-bug-status                                       # Show bug status

# Examples
/odoo-spec-create inventory-enhancement "Custom inventory management features"
/odoo-module-test inventory_custom "Run tests for custom inventory module"
/odoo-bug-fix sale-discount-error "Sales module discount calculation bug"
/odoo-feature-create hr-attendance-tracking "Employee attendance tracking system"

# NEW: Module-aware workflow examples
/odoo-spec-list                                    # See all module specs
/odoo-spec-status inventory_custom                 # Check specific module
/odoo-spec-status inventory_custom features        # Check module features
/odoo-spec-execute 1 inventory-tracking           # Execute task 1
/odoo-spec-execute 2 stock-enhancement inventory_custom  # Execute with module context

# Additional examples
/odoo-spec-create pos-loyalty-program "Point of sale loyalty program integration"
/odoo-bug-fix account-payment-timeout "Accounting module payment processing timeout"
/odoo-module-test website_custom "Test custom website module functionality"
```

## 🌟 Examples

### Basic Usage
```bash
cd my-awesome-project
npx @stanleykao72/claude-code-spec-workflow-odoo
claude
# Type: /spec-create user-dashboard "User profile management"
```

### Advanced Usage
```bash
# Setup multiple projects
for dir in project1 project2 project3; do
  npx @stanleykao72/claude-code-spec-workflow-odoo --project $dir --yes
done

# Odoo-specific project setup
cd odoo-custom-modules
npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup
claude
# Type: /odoo-spec-create inventory-management "Custom inventory workflows"
```

## 🔧 TypeScript Development

### Frontend Dashboard Development

The dashboard frontend is fully implemented in TypeScript for enhanced type safety and developer experience:

#### Type Definitions
```typescript
// Core dashboard types
interface Project {
  path: string;
  name: string;
  level: number;
  hasActiveSession: boolean;
  specs: Spec[];
  bugs: Bug[];
  steeringStatus?: SteeringStatus;
}

// WebSocket message types with discriminated unions
type WebSocketMessage = 
  | { type: 'initial'; data: InitialData }
  | { type: 'update'; data: UpdateData }
  | { type: 'error'; data: ErrorData }
  | { type: 'tunnel-status'; data: TunnelStatusData };
```

#### Build Commands
```bash
# TypeScript compilation and bundling
npm run build:frontend:dev   # Build frontend for development
npm run build:frontend:prod  # Build frontend for production (minified)
npm run watch:frontend       # Watch mode with auto-rebuild
npm run typecheck:frontend   # Type checking only (no output)
npm run typecheck           # Check both backend and frontend types

# Development workflow  
npm run dev:dashboard       # Start dashboard with hot reload (frontend + backend)
npm run dev:dashboard:backend-only  # Start only backend (for frontend debugging)

# Full build process
npm run build              # Complete build: TypeScript + frontend + static files
npm run lint               # Lint TypeScript files with auto-fix
npm run format             # Format code with Prettier
```

#### Type Safety Features
- **Strict TypeScript configuration** with null checks
- **Runtime type validation** with type guards
- **WebSocket message typing** for real-time updates  
- **State management types** for reactive UI components
- **Error handling types** with Result<T> pattern
- **Petite-vue integration** with custom type definitions

#### Type Usage Examples

```typescript
// Import dashboard types
import type { Project, WebSocketMessage, AppState } from './dashboard.types';

// Type-safe project handling
function selectProject(project: Project): void {
  console.log(`Selected: ${project.name} (${project.specs.length} specs)`);
  
  // Safe property access with optional chaining
  const steeringCount = project.steeringStatus?.totalDocs ?? 0;
  if (steeringCount > 0) {
    console.log(`Steering docs: ${steeringCount}`);
  }
}

// WebSocket message handling with discriminated unions
function handleMessage(message: WebSocketMessage): void {
  switch (message.type) {
    case 'initial':
      // TypeScript knows data is InitialData
      console.log(`Loaded ${message.data.projects.length} projects`);
      break;
    case 'update':
      // TypeScript knows data is UpdateData
      console.log(`Updated project: ${message.data.projectPath}`);
      break;
    case 'error':
      // TypeScript knows data is ErrorData
      console.error(`Error: ${message.data.message}`);
      break;
  }
}

// Type guards for runtime validation
function isValidProject(obj: unknown): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    'name' in obj &&
    'specs' in obj &&
    Array.isArray((obj as Project).specs)
  );
}

// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function parseProjectData(data: unknown): Result<Project> {
  if (isValidProject(data)) {
    return { success: true, data };
  }
  return { success: false, error: new Error('Invalid project data') };
}
```

#### Development Guidelines
- **JSDoc documentation** on all exported functions
- **95%+ type coverage** maintained (no implicit any types)
- **Modern TypeScript patterns** (optional chaining, nullish coalescing)
- **Type guards preferred** over type assertions
- **Interfaces for object shapes**, union types for discriminated unions
- **Result<T> pattern** for error handling
- **Runtime validation** with type guards for external data

## 📚 Documentation

- **[Full Documentation](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Tunnel Feature Guide](./docs/tunnel-feature.md)** - Comprehensive tunnel documentation
- **[Tunnel Examples](./examples/tunnel/)** - Ready-to-use tunnel scripts
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**
- **[TypeScript API Reference](./docs/typescript-api.md)** - Generated from JSDoc comments

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](https://github.com/pimzino/claude-code-spec-workflow/blob/main/LICENSE) for details.

## 🏷️ Changelog

See [CHANGELOG.md](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CHANGELOG.md) for version history.

---

## 🚦 When To Use What

| Scenario | Recommended Approach |
|----------|---------------------|
| **New feature, well-defined** | `/spec-execute` or individual task commands |
| **Complex/experimental feature** | `/spec-execute` (manual control) |
| **Bug in existing code** | Bug workflow (`/bug-create` → `/bug-verify`) |
| **Learning the codebase** | Manual execution with individual commands |
| **Production deployment** | Full spec workflow with completion review |

---

## 🚀 Installation & Setup

### **Installation**
```bash
# Install globally (recommended)
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# Verify installation
claude-code-spec-workflow --version
```

### **Setup Options**
```bash
# Basic setup
claude-code-spec-workflow

# Odoo-specific setup
claude-code-spec-workflow odoo-setup

# Advanced options
claude-code-spec-workflow --project /path --force --yes
```

**During setup you choose:**
- ✅ **Enable agents?** Enhanced automation vs simpler setup
- ✅ **Project analysis** Auto-detection of frameworks and patterns

---

## 📚 Examples
**Recommendation: Use Claude Opus 4 to generate the spec documentation '/spec-create', then use Claude Sonnet 4 for the implementation i.e. '/spec-execute' or '/{spec-name}-task-<id>'.**
<details>
<summary><strong>Basic Workflow Example</strong></summary>

```bash
# 1. Install globally (one time)
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# 2. Setup project (one time)
cd my-project
claude-code-spec-workflow

# 3. Create steering documents (recommended)
claude
/spec-steering-setup

# 4. Create feature spec
/spec-create user-authentication "Secure login system"

# 5. Execute tasks
/spec-execute 1 user-authentication

# 6. Monitor progress
/spec-status user-authentication
```

</details>

<details>
<summary><strong>Bug Fix Example</strong></summary>

```bash
/bug-create login-timeout "Users logged out too quickly"
/bug-analyze
/bug-fix
/bug-verify
```

</details>

---

## ⚡ Context Optimization Commands

The package includes optimized commands for efficient document loading across all document types:

### **get-steering-context**
Load all steering documents at once for context sharing:
```bash
claude-code-spec-workflow get-steering-context
```
**Output**: Formatted markdown with all steering documents (product.md, tech.md, structure.md)

### **get-spec-context**
Load all specification documents at once for context sharing:
```bash
claude-code-spec-workflow get-spec-context feature-name
```
**Output**: Formatted markdown with all spec documents (requirements.md, design.md, tasks.md)

### **get-template-context**
Load templates by category for context sharing:
```bash
# Load all templates
claude-code-spec-workflow get-template-context

# Load specific template category
claude-code-spec-workflow get-template-context spec    # Spec templates
claude-code-spec-workflow get-template-context bug     # Bug templates
claude-code-spec-workflow get-template-context steering # Steering templates
claude-code-spec-workflow get-template-context odoo    # Odoo templates (from .odoo-dev/templates/)
```
**Output**: Formatted markdown with requested templates

### **Smart Document Handling**
- **High-redundancy documents** (steering, specs, templates): Use optimized bulk loading
- **Low-redundancy documents** (bug reports): Use direct file reading for simplicity
- **Selective delegation**: Main agents load full context, but pass only relevant portions to sub-agents
- **Individual files**: Continue using `get-content` for edge cases

### **Benefits**
- **60-80% token reduction** compared to individual file loading
- **Faster execution** with cached context across all workflows
- **Automatic fallback** to individual `get-content` when needed
- **Session-based caching** with intelligent file change detection

### **Hierarchical Context Management**
The system implements a sophisticated **hierarchical context management strategy** for maximum efficiency:

**Main Agents** (Commands like `/spec-execute`, `/spec-create`):
- **Load ALL context once** at the beginning using optimized commands
- **Store complete context** for task coordination and decision-making
- **Distribute selective context** to sub-agents without requiring reloads

**Sub-Agents** (Agents like `spec-task-executor`):
- **Priority 1**: Use provided context from task instructions (steering, specification, task details)
- **Priority 2**: Fallback to loading context only if not provided above
- **Never redundantly load** context when it's already been provided by main agents

**Context Distribution Pattern**:
```
Main Agent loads: Steering + Full Spec + Task Details
↓ Delegates to Sub-Agent with:
├── Complete Steering Context
├── Selective Spec Context (Requirements + Design only)
├── Specific Task Details
└── Clear instruction: "Do NOT reload context"
```

This approach **eliminates redundant loading** while ensuring each agent has exactly the context it needs.

---

## 🛟 Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

**❓ "Command not found"**
```bash
# Install globally first
npm install -g @stanleykao72/claude-code-spec-workflow-odoo

# Then use the command
claude-code-spec-workflow
```

**❓ "Claude Code not detected"**
```bash
npm install -g @anthropic-ai/claude-code
```

**❓ "Permission errors"**
```bash
claude-code-spec-workflow --project ~/my-project
```

</details>

---

## 📋 Requirements

- **Node.js** 16.0.0+
- **Claude Code** installed
- Any project directory

---

## 🔧 Odoo File Placement Configuration

When working with Odoo projects, specification files are organized using a **module-level structure** rather than a centralized documentation approach. This design aligns with Odoo's modular architecture and enables better module isolation.

### 📁 File Structure Overview

**For Odoo Projects:**
```
your-odoo-project/
├── custom_addons/
│   └── inventory_custom/
│       ├── .spec/                    # Module-specific specifications
│       │   ├── features/
│       │   │   └── stock-tracking/
│       │   │       ├── request.md
│       │   │       ├── requirements.md
│       │   │       ├── design.md
│       │   │       └── tasks.md
│       │   ├── bugs/
│       │   │   └── negative-stock/
│       │   │       ├── report.md
│       │   │       ├── analysis.md
│       │   │       ├── fix.md
│       │   │       └── verification.md
│       │   └── testing/
│       │       ├── testing-plan.md
│       │       ├── test-cases.md
│       │       └── test-implementation.md
│       ├── models/
│       ├── views/
│       └── __manifest__.py
└── .odoo-dev/
    ├── steering/                     # Project-level guidance
    │   ├── business-rules.md
    │   ├── technical-stack.md
    │   └── module-standards.md
    └── templates/                    # Odoo-specific templates
        ├── odoo-requirements-template.md
        ├── odoo-design-template.md
        ├── odoo-tasks-template.md
        ├── odoo-product-template.md
        └── odoo-cleanup-policy.yaml
```

### 🎯 Why Module-Level Structure?

1. **Module Isolation**: Each module maintains its own specifications, making it easier to manage large Odoo projects with multiple custom modules
2. **Version Control**: Module-specific specifications can be versioned and managed alongside the module code
3. **Team Collaboration**: Different teams can work on different modules without conflicts
4. **Deployment Flexibility**: Modules can be deployed independently with their specifications
5. **Odoo Best Practices**: Aligns with Odoo's modular architecture and development patterns

### 📋 CLAUDE.md Configuration

If you want to customize how Claude Code handles Odoo specifications in your project, add this section to your project's `.claude/CLAUDE.md` file:

```markdown
## Odoo Development Guidelines

### File Organization
- **Module Specifications**: Store all specification files within each module's `.spec/` directory
- **Feature Specifications**: `[module-path]/.spec/features/[feature-name]/`
- **Bug Fix Workflows**: `[module-path]/.spec/bugs/[bug-name]/`  
- **Module Testing**: `[module-path]/.spec/testing/`
- **Project Steering**: `.odoo-dev/steering/` (project-level guidance documents)

### Specification Structure
- **Features**: request.md → requirements.md → design.md → tasks.md
- **Bug Fixes**: report.md → analysis.md → fix.md → verification.md
- **Testing**: testing-plan.md → test-cases.md → test-implementation.md

### Development Workflow
1. Use `/odoo-steering` to create project-level guidance documents
2. Use `/odoo-spec-create module-name "description"` for new features
3. Use `/odoo-bug-fix module-issue "description"` for bug fixes
4. Use `/odoo-spec-execute task-id spec-name` for implementation
5. Use `/odoo-spec-status` and `/odoo-spec-list` for progress tracking

### Module Context
- All Odoo commands automatically detect module structure and dependencies
- Specifications include Odoo version compatibility and inheritance analysis
- Integration with pytest-odoo testing framework
- Multi-company and localization considerations built-in
```

### 🚀 Getting Started with Odoo File Structure

1. **Initialize Odoo Environment:**
   ```bash
   npx @stanleykao72/claude-code-spec-workflow-odoo odoo-setup
   ```

2. **Create Project Steering Documents:**
   ```bash
   claude
   /odoo-steering
   ```

3. **Start Module Development:**
   ```bash
   # Creates specifications in module-path/.spec/
   /odoo-spec-create inventory-enhancement "Custom inventory features"
   ```

4. **Track Progress:**
   ```bash
   /odoo-spec-list                    # All modules overview
   /odoo-spec-status inventory_custom # Specific module status
   ```

This module-level approach ensures that your Odoo specifications are organized, maintainable, and aligned with Odoo's development best practices.

---

## 🔗 Links

- **[Full Documentation](https://github.com/stanleykao72/claude-code-spec-workflow-odoo#readme)**
- **[Original Project](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**
- **[Report Issues](https://github.com/stanleykao72/claude-code-spec-workflow-odoo/issues)**

---

## 📄 License & Credits

**MIT License** - [LICENSE](LICENSE)

**Made with ❤️ by [Pimzino](https://github.com/pimzino)**

**Special Thanks:**
- @pimzino - Initial setup
- @boundless-oss - Steering documents
- @mquinnv - Dashboard feature

**Powered by:** [Claude Code](https://docs.anthropic.com/claude-code) • [Mermaid](https://mermaid.js.org/) • [TypeScript](https://www.typescriptlang.org/)