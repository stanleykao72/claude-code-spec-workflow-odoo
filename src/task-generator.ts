/**
 * Task command generation utilities
 * Parses tasks.md files and generates individual command files
 */

export interface ParsedTask {
  id: string;
  description: string;
  leverage?: string;
  requirements?: string;
}

/**
 * Parse tasks from a tasks.md markdown file
 * Handles various formats agents might produce:
 * - [ ] 1. Task description
 * - [ ] 2.1 Subtask description  
 *   - Details
 *   - _Requirements: 1.1, 2.2_
 *   - _Leverage: existing component X_
 */
export function parseTasksFromMarkdown(content: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = content.split('\n');
  
  let currentTask: ParsedTask | null = null;
  let isCollectingTaskContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Match task lines with flexible format:
    // Supports: "- [ ] 1. Task", "- [] 1 Task", "- [ ] 1.1. Task", etc.
    // Also handles various spacing and punctuation
    const taskMatch = trimmedLine.match(/^-\s*\[\s*\]\s*([0-9]+(?:\.[0-9]+)*)\s*\.?\s*(.+)$/);
    
    if (taskMatch) {
      // If we have a previous task, save it
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Start new task
      const taskId = taskMatch[1];
      const taskDescription = taskMatch[2].trim();
      
      currentTask = {
        id: taskId,
        description: taskDescription
      };
      isCollectingTaskContent = true;
    } 
    // If we're in a task, look for metadata anywhere in the task block
    else if (currentTask && isCollectingTaskContent) {
      // Check if this line starts a new task section (to stop collecting)
      if (trimmedLine.match(/^-\s*\[\s*\]\s*[0-9]/)) {
        // This is the start of a new task, process it in the next iteration
        i--;
        isCollectingTaskContent = false;
        continue;
      }
      
      // Check for _Requirements: anywhere in the line
      const requirementsMatch = line.match(/_Requirements:\s*(.+?)(?:_|$)/);
      if (requirementsMatch) {
        currentTask.requirements = requirementsMatch[1].trim();
      }
      
      // Check for _Leverage: anywhere in the line
      const leverageMatch = line.match(/_Leverage:\s*(.+?)(?:_|$)/);
      if (leverageMatch) {
        currentTask.leverage = leverageMatch[1].trim();
      }
      
      // Stop collecting if we hit an empty line followed by non-indented content
      if (trimmedLine === '' && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine.length > 0 && nextLine[0] !== ' ' && nextLine[0] !== '\t' && !nextLine.startsWith('  -')) {
          isCollectingTaskContent = false;
        }
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  // Log parsing results for debugging
  console.log(`Parsed ${tasks.length} tasks from markdown`);
  if (tasks.length === 0 && content.trim().length > 0) {
    console.log('Warning: No tasks found. Content preview:');
    console.log(content.substring(0, 500) + '...');
  }
  
  return tasks;
}

/**
 * Generate a command file for a specific task
 */
export async function generateTaskCommand(
  commandsDir: string, 
  specName: string, 
  task: ParsedTask
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const commandFile = path.join(commandsDir, `task-${task.id}.md`);
  
  let content = `# ${specName} - Task ${task.id}

Execute task ${task.id} for the ${specName} specification.

## Task Description
${task.description}

`;

  // Add Code Reuse section if leverage info exists
  if (task.leverage) {
    content += `## Code Reuse
**Leverage existing code**: ${task.leverage}

`;
  }

  // Add Requirements section if requirements exist
  if (task.requirements) {
    content += `## Requirements Reference
**Requirements**: ${task.requirements}

`;
  }

  content += `## Usage
\`\`\`
/${specName}-task-${task.id}
\`\`\`

## Instructions

**Agent-Based Execution (Recommended)**: First check if agents are enabled by running:

\`\`\`bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
\`\`\`

If this returns \`true\`, use the \`spec-task-executor\` agent for optimal task implementation:

\`\`\`
Use the spec-task-executor agent to implement task ${task.id}: "${task.description}" for the ${specName} specification.

The agent should:
1. Load all specification context from .claude/specs/${specName}/
2. Load steering documents from .claude/steering/ (if available)
3. Implement ONLY task ${task.id}: "${task.description}"
4. Follow all project conventions and leverage existing code
5. Mark the task as complete in tasks.md
6. Provide a completion summary

Context files to load using get-content script:

**Load task-specific context:**
\`\`\`bash
# Get specific task details with all information
npx @pimzino/claude-code-spec-workflow@latest get-tasks ${specName} ${task.id} --mode single

# Load context documents
# Windows:
npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\specs\\${specName}\\requirements.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\specs\\${specName}\\design.md"

# macOS/Linux:
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/specs/${specName}/requirements.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/specs/${specName}/design.md"

# Steering documents (if they exist):
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/product.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/tech.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/structure.md"
\`\`\`

Task details:
- ID: ${task.id}
- Description: ${task.description}${task.leverage ? `
- Leverage: ${task.leverage}` : ''}${task.requirements ? `
- Requirements: ${task.requirements}` : ''}
\`\`\`

**Fallback Execution**: If the agent is not available, you can execute:
\`\`\`
/spec-execute ${task.id} ${specName}
\`\`\`

**Context Loading**:
Before executing the task, you MUST load all relevant context using the get-content script:

**1. Specification Documents:**
\`\`\`bash
# Requirements document:
# Windows: npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\specs\\${specName}\\requirements.md"
# macOS/Linux: npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/specs/${specName}/requirements.md"

# Design document:
# Windows: npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\specs\\${specName}\\design.md"
# macOS/Linux: npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/specs/${specName}/design.md"

# Task details:
npx @pimzino/claude-code-spec-workflow@latest get-tasks ${specName} ${task.id} --mode single
\`\`\`

**2. Steering Documents (if available):**
\`\`\`bash
# Windows examples:
npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\steering\\product.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\steering\\tech.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "C:\\path\\to\\project\\.claude\\steering\\structure.md"

# macOS/Linux examples:
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/product.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/tech.md"
npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/structure.md"
\`\`\`

**Process**:
1. Load all context documents listed above
2. Execute task ${task.id}: "${task.description}"
3. **Prioritize code reuse**: Use existing components and utilities${task.leverage ? ` identified above` : ''}
4. Follow all implementation guidelines from the main /spec-execute command
5. **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
6. **CRITICAL**: Mark the task as complete in tasks.md by changing [ ] to [x]
7. Confirm task completion to user
8. Stop and wait for user review

**Important Rules**:
- Execute ONLY this specific task
- **Leverage existing code** whenever possible to avoid rebuilding functionality
- **Follow project conventions** from steering documents
- Mark task as complete by changing [ ] to [x] in tasks.md
- Stop after completion and wait for user approval
- Do not automatically proceed to the next task
- Validate implementation against referenced requirements

## Task Completion Protocol
When completing this task:
1. **Mark task complete**: Use the get-tasks script to mark completion:
   \`\`\`bash
   npx @pimzino/claude-code-spec-workflow@latest get-tasks ${specName} ${task.id} --mode complete
   \`\`\`
2. **Confirm to user**: State clearly "Task ${task.id} has been marked as complete"
3. **Stop execution**: Do not proceed to next task automatically
4. **Wait for instruction**: Let user decide next steps

## Post-Implementation Review (if agents enabled)
First check if agents are enabled:
\`\`\`bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
\`\`\`

If this returns \`true\`, use the \`spec-task-implementation-reviewer\` agent:

\`\`\`
Use the spec-task-implementation-reviewer agent to review the implementation of task ${task.id} for the ${specName} specification.

The agent should:
1. Load all specification documents from .claude/specs/${specName}/
2. Load steering documents from .claude/steering/ (if available)
3. Review the implementation for correctness and compliance
4. Provide structured feedback on the implementation quality
5. Identify any issues that need to be addressed

Context files to review:
- .claude/specs/${specName}/requirements.md
- .claude/specs/${specName}/design.md
- .claude/specs/${specName}/tasks.md
- Implementation changes for task ${task.id}
\`\`\`

## Code Duplication Analysis (if agents enabled)
First check if agents are enabled:
\`\`\`bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
\`\`\`

If this returns \`true\`, use the \`spec-duplication-detector\` agent:

\`\`\`
Use the spec-duplication-detector agent to analyze code duplication for task ${task.id} of the ${specName} specification.

The agent should:
1. Scan the newly implemented code
2. Identify any duplicated patterns
3. Suggest refactoring opportunities
4. Recommend existing utilities to reuse
5. Help maintain DRY principles

This ensures code quality and maintainability.
\`\`\`

## Integration Testing (if agents enabled)
First check if agents are enabled:
\`\`\`bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
\`\`\`

If this returns \`true\`, use the \`spec-integration-tester\` agent:

\`\`\`
Use the spec-integration-tester agent to test the implementation of task ${task.id} for the ${specName} specification.

The agent should:
1. Load all specification documents and understand the changes made
2. Run relevant test suites for the implemented functionality
3. Validate integration points and API contracts
4. Check for regressions using git history analysis
5. Provide comprehensive test feedback

Test context:
- Changes made in task ${task.id}
- Related test suites to execute
- Integration points to validate
- Git history for regression analysis
\`\`\`

## Next Steps
After task completion, you can:
- Review the implementation (automated if spec-task-implementation-reviewer agent is available)
- Run integration tests (automated if spec-integration-tester agent is available)
- Address any issues identified in reviews or tests
- Execute the next task using /${specName}-task-[next-id]
- Check overall progress with /spec-status ${specName}
- If all tasks complete, run /spec-completion-review ${specName}
`;

  await fs.writeFile(commandFile, content, 'utf8');
}