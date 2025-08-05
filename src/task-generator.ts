/**
 * Task command generation utilities
 * Parses tasks.md files and generates individual command files
 */

import * as path from 'path';
import { getCachedFileContent, cachedFileExists } from './file-cache';

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
    console.log('Warning: No tasks found. Tasks must follow this exact format:');
    console.log('  - [ ] 1. Task description');
    console.log('  - [ ] 2.1 Subtask description');
    console.log('    - Additional details');
    console.log('    - _Requirements: 1.1, 2.2_');
    console.log('    - _Leverage: path/to/file.ts_');
    console.log('');
    console.log('Content preview:');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
  }
  
  return tasks;
}

/**
 * Load steering context content
 */
function loadSteeringContext(projectPath: string): string {
  const steeringDir = path.join(projectPath, '.claude', 'steering');

  if (!cachedFileExists(steeringDir)) {
    return '## Steering Documents Context\n\nNo steering documents found.';
  }

  const steeringFiles = [
    { name: 'product.md', title: 'Product Context' },
    { name: 'tech.md', title: 'Technology Context' },
    { name: 'structure.md', title: 'Structure Context' }
  ];

  const sections: string[] = [];
  let hasContent = false;

  for (const file of steeringFiles) {
    const filePath = path.join(steeringDir, file.name);

    if (cachedFileExists(filePath)) {
      const content = getCachedFileContent(filePath);
      if (content && content.trim()) {
        sections.push(`### ${file.title}\n${content.trim()}`);
        hasContent = true;
      }
    }
  }

  if (!hasContent) {
    return '## Steering Documents Context\n\nNo steering documents found or all are empty.';
  }

  return `## Steering Documents Context (Pre-loaded)\n\n${sections.join('\n\n---\n\n')}\n\n**Note**: Steering documents have been pre-loaded. Do not use get-content to fetch them again.`;
}

/**
 * Load spec context content (requirements and design only)
 */
function loadSpecContext(specName: string, projectPath: string): string {
  const specDir = path.join(projectPath, '.claude', 'specs', specName);

  if (!cachedFileExists(specDir)) {
    return `## Specification Context\n\nNo specification found for: ${specName}`;
  }

  // Only load requirements and design, not tasks
  const specFiles = [
    { name: 'requirements.md', title: 'Requirements' },
    { name: 'design.md', title: 'Design' }
  ];

  const sections: string[] = [];
  let hasContent = false;

  for (const file of specFiles) {
    const filePath = path.join(specDir, file.name);

    if (cachedFileExists(filePath)) {
      const content = getCachedFileContent(filePath);
      if (content && content.trim()) {
        sections.push(`### ${file.title}\n${content.trim()}`);
        hasContent = true;
      }
    }
  }

  if (!hasContent) {
    return `## Specification Context\n\nNo specification documents found for: ${specName}`;
  }

  return `## Specification Context (Pre-loaded): ${specName}\n\n${sections.join('\n\n---\n\n')}\n\n**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.`;
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
  const pathModule = await import('path');

  const commandFile = pathModule.join(commandsDir, `task-${task.id}.md`);

  // Determine project path from commandsDir (commandsDir is typically .claude/commands/{specName})
  const projectPath = pathModule.resolve(commandsDir, '../../..');

  // Load actual content
  const steeringContext = loadSteeringContext(projectPath);
  const specContext = loadSpecContext(specName, projectPath);
  
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
/Task:${task.id}-${specName}
\`\`\`

## Instructions

Execute with @spec-task-executor agent the following task: "${task.description}"

\`\`\`
Use the @spec-task-executor agent to implement task ${task.id}: "${task.description}" for the ${specName} specification and include all the below context.

# Steering Context
${steeringContext}

# Specification Context
${specContext}

## Task Details
- Task ID: ${task.id}
- Description: ${task.description}${task.leverage ? `
- Leverage: ${task.leverage}` : ''}${task.requirements ? `
- Requirements: ${task.requirements}` : ''}

## Instructions
- Implement ONLY task ${task.id}: "${task.description}"
- Follow all project conventions and leverage existing code
- Mark the task as complete using: claude-code-spec-workflow get-tasks ${specName} ${task.id} --mode complete
- Provide a completion summary
\`\`\`

## Task Completion
When the task is complete, mark it as done:
\`\`\`bash
claude-code-spec-workflow get-tasks ${specName} ${task.id} --mode complete
\`\`\`

## Next Steps
After task completion, you can:
- Execute the next task using /${specName}-task-[next-id]
- Check overall progress with /spec-status ${specName}
`;

  await fs.writeFile(commandFile, content, 'utf8');
}