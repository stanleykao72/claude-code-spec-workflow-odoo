# Spec Orchestrate Command

Resume or start automated execution of all tasks in a specification.

## Usage
```
/spec-orchestrate {spec-name}
```

## Resumable Orchestration
This command is **fully resumable** - it automatically detects completed tasks from tasks.md and continues from where you left off. Perfect for handling Claude Code session limits.

## Your Role
You are a **stateless orchestration coordinator**. You delegate all work to specialized agents and coordinate execution. You determine current state by reading tasks.md completion status.

## Instructions

### 1. Load Context & Analyze State
**Silently load** (no verbose output):
- .claude/specs/{spec-name}/tasks.md → Parse [x] completed vs [ ] pending tasks
- .claude/specs/{spec-name}/requirements.md, design.md → Context for agents
- .claude/steering/ documents → Project conventions

### 2. Show Current Status
Display brief status and plan:
```
📋 {spec-name} Status: {completed}/{total} tasks complete
⏳ Pending: Task {next-id}, Task {next-id+1}...
▶️ Next: Task {next-id} - {description}
Continue orchestration? [y/N]
```

### 3. Execute Tasks Continuously
Execute each pending task and **automatically continue** to the next:

**For each uncompleted task ([ ] checkbox):**

**Step 1 - Announce:**
`🔄 Task {id}: {description}`

**Step 2 - Delegate to Agent:**
Use spec-task-executor agent (primary method):
```
Use the spec-task-executor agent to implement task {task-id} for {spec-name}.

Context: Load .claude/specs/{spec-name}/ and .claude/steering/
Task: {task-id} - {description}
Requirements: {requirements-ref}
Leverage: {leverage-info}

Mark complete in tasks.md when done.
```

**Step 3 - Fallback (if agent unavailable):**
`/{spec-name}-task-{task-id}`

**Step 4 - Report completion:**
`✅ Task {id} complete`

**Step 5 - Continue automatically:**
**CRITICAL**: Immediately proceed to next pending task without waiting for user input. Only pause for errors or when all tasks complete.

### 4. Error Handling
If task fails:
```
⚠️ Task {id} failed: {brief-error}
Options: 1) Retry 2) Skip 3) Stop
```

Use spec-error-resolver agent for complex issues.

### 5. Completion
When no pending tasks remain:
```
🎉 {spec-name} complete: {total}/{total} tasks ✅
Run /spec-completion-review {spec-name} for final validation
```

## Session Recovery
The orchestrator is **completely stateless**:
- **State source**: tasks.md completion checkboxes [x] vs [ ]
- **Resume point**: First uncompleted task found
- **No memory needed**: Each execution starts fresh by reading current state
- **Session-safe**: Works perfectly across Claude Code session limits

Example recovery scenario:
1. Session 1: Complete tasks 1-3, session limit hit
2. Session 2: Run `/spec-orchestrate spec-name` → automatically starts from task 4
3. Session 3: Run same command → continues from wherever tasks.md shows [ ]

## Execution Modes
The orchestrator runs in **fully automated mode** by default. If you need manual control over individual tasks, use /spec-execute instead.

## Key Rules
- **Read tasks.md first** - always determine current state from completion checkboxes
- **Execute continuously** - automatically proceed to next task after each completion
- **No user input required** - only pause for errors or completion (not for progress updates)
- **Delegate everything** - never implement code yourself
- **Minimal output** - focus on coordination not verbose reporting
- **Auto-resume** - seamlessly continue from any interruption point
- **Update state** - ensure each completed task is marked [x] in tasks.md

## Agent Dependencies
1. **spec-task-executor** (primary) - implements individual tasks
2. **spec-error-resolver** (fallback) - handles failures  
3. **Individual task commands** (fallback) - when agents unavailable

The orchestrator provides **bulletproof resumability** and **continuous execution** by treating tasks.md as the single source of truth for execution state.

## Execution Flow
The orchestrator runs in a continuous loop:
1. Load and parse current state from tasks.md
2. Find next pending task
3. Execute task via agent delegation
4. Report completion briefly
5. **Immediately continue** to next task (no user input needed)
6. Only pause for errors or when all tasks complete