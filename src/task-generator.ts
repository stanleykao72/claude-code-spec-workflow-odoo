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
 * Handles the exact format from the template:
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
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Match task lines: "- [ ] 1. Task description" or "- [ ] 2.1 Subtask description"
    const taskMatch = trimmedLine.match(/^-\s*\[\s*\]\s*([0-9]+(?:\.[0-9]+)*)\s*\.?\s*(.+)$/);
    
    if (taskMatch) {
      // If we have a previous task, save it
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Start new task
      const taskId = taskMatch[1];
      const taskDescription = taskMatch[2];
      
      currentTask = {
        id: taskId,
        description: taskDescription
      };
    } 
    // Check for _Requirements: lines (only if we're in a task)
    else if (currentTask && trimmedLine.match(/^-\s*_Requirements:\s*(.+)$/)) {
      const requirementsMatch = trimmedLine.match(/^-\s*_Requirements:\s*(.+)$/);
      if (requirementsMatch) {
        currentTask.requirements = requirementsMatch[1].trim().replace(/_$/, '');
      }
    }
    // Check for _Leverage: lines (only if we're in a task)
    else if (currentTask && trimmedLine.match(/^-\s*_Leverage:\s*(.+)$/)) {
      const leverageMatch = trimmedLine.match(/^-\s*_Leverage:\s*(.+)$/);
      if (leverageMatch) {
        currentTask.leverage = leverageMatch[1].trim().replace(/_$/, '');
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
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
This command executes a specific task from the ${specName} specification.

**Automatic Execution**: This command will automatically execute:
\`\`\`
/spec-execute ${task.id} ${specName}
\`\`\`

**Context Loading**:
Before executing the task, you MUST load all relevant context:
1. **Specification Documents**:
   - Load \`.claude/specs/${specName}/requirements.md\` for feature requirements
   - Load \`.claude/specs/${specName}/design.md\` for technical design
   - Load \`.claude/specs/${specName}/tasks.md\` for the complete task list
2. **Steering Documents** (if available):
   - Load \`.claude/steering/product.md\` for product vision context
   - Load \`.claude/steering/tech.md\` for technical standards
   - Load \`.claude/steering/structure.md\` for project conventions

**Process**:
1. Load all context documents listed above
2. Execute task ${task.id}: "${task.description}"
3. **Prioritize code reuse**: Use existing components and utilities identified above
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
1. **Update tasks.md**: Change task ${task.id} status from \`- [ ]\` to \`- [x]\`
2. **Confirm to user**: State clearly "Task ${task.id} has been marked as complete"
3. **Stop execution**: Do not proceed to next task automatically
4. **Wait for instruction**: Let user decide next steps

## Next Steps
After task completion, you can:
- Review the implementation
- Run tests if applicable
- Execute the next task using /${specName}-task-[next-id]
- Check overall progress with /spec-status ${specName}
`;

  await fs.writeFile(commandFile, content, 'utf8');
}