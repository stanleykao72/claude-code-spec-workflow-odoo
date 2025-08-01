# Claude Code Spec Workflow

[![npm version](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow.svg?cacheSeconds=300)](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automated workflows for Claude Code with intelligent orchestration.**

Transform your development with structured workflows: **Requirements → Design → Tasks → Implementation** for new features, plus streamlined **Report → Analyze → Fix → Verify** for bug fixes.

## ☕ Support This Project

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 🚀 Quick Start

```bash
# Install and setup in any project
npx @pimzino/claude-code-spec-workflow

# Start using workflows in Claude Code
/spec-create user-dashboard "User profile management"
/spec-orchestrate user-dashboard  # 🎯 NEW! Automated execution
```

---

## 📦 Installation

| Method | Command | Use Case |
|--------|---------|----------|
| **NPX (Recommended)** | `npx @pimzino/claude-code-spec-workflow` | One-time setup |
| **Global** | `npm i -g @pimzino/claude-code-spec-workflow` | Multiple projects |
| **Local** | `npm i -D @pimzino/claude-code-spec-workflow` | Single project |

---

## ✨ What You Get

- **📁 Complete .claude/ structure** - All files and directories
- **📝 14 slash commands** - 9 spec workflow + 5 bug fix workflow  
- **🎯 Intelligent orchestrator** - Automated task execution
- **🤖 15 specialized agents** - Enhanced automation (optional)
- **📊 Real-time dashboard** - Monitor progress visually
- **🔧 Auto-generated commands** - One command per task
- **📋 Document templates** - Professional spec documents
- **⚙️ Project steering** - Persistent context and standards

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
# Automated (recommended)
/spec-orchestrate feature-name

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
| `/spec-orchestrate <name>` | Automated execution |
| `/spec-execute <task-id>` | Manual task execution |
| `/<name>-task-<id>` | Auto-generated task commands |
| `/spec-status` | Show progress |
| `/spec-list` | List all specs |
| `/spec-completion-review` | Final validation |

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

### 🤖 **Intelligent Orchestrator** (NEW!)
- **Fully automated** task execution
- **Session resumable** - handles Claude Code limits  
- **Error recovery** - smart debugging and retry
- **Continuous execution** - no manual intervention needed

### 🧠 **Specialized Agents** (Optional)
15 AI agents for enhanced automation:

**Core Workflow:** `spec-task-executor`, `spec-requirements-validator`, `spec-design-validator`, `spec-task-validator`

**Quality Assurance:** `spec-task-implementation-reviewer`, `spec-integration-tester`, `spec-completion-reviewer`, `spec-duplication-detector`

**Analysis:** `spec-dependency-analyzer`, `spec-test-generator`, `spec-performance-analyzer`, `spec-breaking-change-detector`

**Documentation:** `spec-documentation-generator`, `steering-document-updater`

**Bug Fixes:** `bug-root-cause-analyzer`

> **Note:** Agents are optional - everything works with built-in fallbacks.

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
│   ├── agents/           # AI agents (optional)
│   └── spec-config.json  # Configuration
```

---

## 🚦 When To Use What

| Scenario | Recommended Approach |
|----------|---------------------|
| **New feature, well-defined** | `/spec-orchestrate` (automated) |
| **Complex/experimental feature** | `/spec-execute` (manual control) |
| **Bug in existing code** | Bug workflow (`/bug-create` → `/bug-verify`) |
| **Learning the codebase** | Manual execution with individual commands |
| **Production deployment** | Full spec workflow with completion review |

---

## ⚙️ Setup Options

```bash
# Basic setup
npx @pimzino/claude-code-spec-workflow

# Advanced options  
npx @pimzino/claude-code-spec-workflow --project /path --force --yes
```

**During setup you choose:**
- ✅ **Enable agents?** Enhanced automation vs simpler setup
- ✅ **Project analysis** Auto-detection of frameworks and patterns

---

## 📚 Examples

<details>
<summary><strong>Basic Workflow Example</strong></summary>

```bash
# 1. Setup (one time)
cd my-project
npx @pimzino/claude-code-spec-workflow

# 2. Create steering documents (recommended)
claude
/spec-steering-setup

# 3. Create feature spec
/spec-create user-authentication "Secure login system"

# 4. Automated execution
/spec-orchestrate user-authentication

# 5. Monitor progress  
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

## 🛟 Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

**❓ "Command not found"**
```bash
npx @pimzino/claude-code-spec-workflow  # Use full package name
```

**❓ "Claude Code not detected"**  
```bash
npm install -g @anthropic-ai/claude-code
```

**❓ "Permission errors"**
```bash
npx @pimzino/claude-code-spec-workflow --project ~/my-project
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