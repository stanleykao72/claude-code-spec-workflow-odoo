# Claude Code Spec Workflow

> **⚠️ IMPORTANT NOTICE:** Development focus has shifted to the **MCP (Model Context Protocol) version** of this workflow system. The MCP version provides enhanced features, real-time dashboard, and broader AI tool compatibility.
> 
> **🚀 [View the new Spec Workflow MCP →](https://github.com/Pimzino/spec-workflow-mcp)**
>
> This Claude Code-specific version remains available for existing users but will receive limited updates.

[![npm version](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow.svg?cacheSeconds=300)](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automated workflows for Claude Code with intelligent task execution.**

Transform your development with structured workflows: **Requirements → Design → Tasks → Implementation** for new features, plus streamlined **Report → Analyze → Fix → Verify** for bug fixes.

## ☕ Support This Project

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 📦 Installation

1. Install the workflow globally
```bash
 `npm i -g @pimzino/claude-code-spec-workflow`
```
2. Run the setup command in your project directory
```bash
claude-code-spec-workflow
```
**Thats it, you are ready to go!**
---

## ✨ What You Get

- **📁 Complete .claude/ structure** - All files and directories
- **📝 10 slash commands** - 5 spec workflow + 5 bug fix workflow
- **🎯 Intelligent task execution** - Automated implementation
- **🤖 4 specialized agents** - Enhanced automation
- **📊 Real-time dashboard** - Monitor progress visually
- **🔧 Auto-generated commands** - One command per task
- **📋 Document templates** - Professional spec documents
- **⚙️ Project steering** - Persistent context and standards
- **⚡ Smart optimization** - Intelligent context sharing and caching

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

| Command | Purpose |
|---------|---------|
| `/spec-steering-setup` | Create project context documents |
| `/spec-create <name>` | Complete spec workflow |
| `/spec-execute <task-id>` | Manual task execution |
| `/<name>-task-<id>` | Auto-generated task commands |
| `/spec-status` | Show progress |
| `/spec-list` | List all specs |

</details>

<details>
<summary><strong>🐛 Bug Fix Commands</strong></summary>

| Command | Purpose |
|---------|---------|
| `/bug-create <name>` | Document bug with structured format |
| `/bug-analyze` | Investigate root cause |
| `/bug-fix` | Implement targeted solution |
| `/bug-verify` | Verify resolution |
| `/bug-status` | Show bug fix progress |

</details>

---

## 🎯 Key Features

### 🤖 **Intelligent Task Execution**
- **Streamlined** task implementation
- **Context-aware** execution with full specification context
- **Agent-based** implementation with spec-task-executor

### 🧠 **Specialized Agents** (Optional)
4 AI agents for enhanced automation:

**Core Workflow:** `spec-task-executor`, `spec-requirements-validator`, `spec-design-validator`, `spec-task-validator`


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
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard
```
- Live progress tracking
- WebSocket updates
- Git integration
- Modern UI with Tailwind CSS

---

## 🗂️ Project Structure

```
your-project/
├── .claude/
│   ├── commands/           # 14 slash commands + auto-generated
│   ├── steering/          # product.md, tech.md, structure.md
│   ├── templates/         # Document templates
│   ├── specs/            # Generated specifications
│   ├── bugs/             # Bug fix workflows
│   └── agents/           # AI agents (enabled by default)
```

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
npm install -g @pimzino/claude-code-spec-workflow

# Verify installation
claude-code-spec-workflow --version
```

### **Setup Options**
```bash
# Basic setup
claude-code-spec-workflow

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
npm install -g @pimzino/claude-code-spec-workflow

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
npm install -g @pimzino/claude-code-spec-workflow

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

## 🔗 Links

- **[Full Documentation](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**
- **[Report Issues](https://github.com/pimzino/claude-code-spec-workflow/issues)**

---

## 📄 License & Credits

**MIT License** - [LICENSE](LICENSE)

**Made with ❤️ by [Pimzino](https://github.com/pimzino)**

**Special Thanks:**
- @pimzino - Initial setup
- @boundless-oss - Steering documents
- @mquinnv - Dashboard feature

**Powered by:** [Claude Code](https://docs.anthropic.com/claude-code) • [Mermaid](https://mermaid.js.org/) • [TypeScript](https://www.typescriptlang.org/)