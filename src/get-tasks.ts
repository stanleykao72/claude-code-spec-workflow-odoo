#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync } from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface TaskInfo {
  id: string;
  description: string;
  leverage?: string;
  requirements?: string;
  completed: boolean;
  details?: string[];
}

/**
 * Parse tasks from a tasks.md markdown file, including both completed and pending tasks
 * Handles various formats agents might produce:
 * - [ ] 1. Task description (pending)
 * - [x] 2. Task description (completed)
 * - [ ] 2.1 Subtask description  
 *   - Details
 *   - _Requirements: 1.1, 2.2_
 *   - _Leverage: existing component X_
 */
export function parseAllTasksFromMarkdown(content: string): TaskInfo[] {
  const tasks: TaskInfo[] = [];
  const lines = content.split('\n');
  
  let currentTask: TaskInfo | null = null;
  let isCollectingTaskContent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Match task lines with flexible format for both pending and completed:
    // Supports: "- [ ] 1. Task", "- [x] 1. Task", "- [] 1 Task", etc.
    // Also handles various spacing and punctuation
    const taskMatch = trimmedLine.match(/^-\s*\[\s*([x\s]*)\s*\]\s*([0-9]+(?:\.[0-9]+)*)\s*\.?\s*(.+)$/);
    
    if (taskMatch) {
      // If we have a previous task, save it
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      // Determine if task is completed
      const checkboxContent = taskMatch[1].trim();
      const isCompleted = checkboxContent.toLowerCase() === 'x';
      const taskId = taskMatch[2];
      const taskDescription = taskMatch[3].trim();
      
      currentTask = {
        id: taskId,
        description: taskDescription,
        completed: isCompleted,
        details: []
      };
      isCollectingTaskContent = true;
    } 
    // If we're in a task, look for metadata anywhere in the task block
    else if (currentTask && isCollectingTaskContent) {
      // Check if this line starts a new task section (to stop collecting)
      if (trimmedLine.match(/^-\s*\[\s*[x\s]*\s*\]\s*[0-9]/)) {
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
      
      // Collect all detail lines (indented content that's not metadata)
      if (trimmedLine && 
          !requirementsMatch && 
          !leverageMatch && 
          (line.startsWith('  ') || line.startsWith('\t')) &&
          !trimmedLine.startsWith('_') &&
          currentTask.details) {
        currentTask.details.push(trimmedLine);
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
  
  return tasks;
}

/**
 * Get tasks from a specification's tasks.md file
 */
export async function getTasks(
  specName: string,
  taskId?: string,
  mode: 'all' | 'single' | 'next-pending' | 'complete' = 'all',
  projectPath?: string
): Promise<void> {
  try {
    // Use provided project path or current working directory
    const workingDir = projectPath || process.cwd();
    
    // Path to tasks.md
    const tasksPath = path.join(workingDir, '.claude', 'specs', specName, 'tasks.md');
    
    // Check if tasks file exists
    if (!existsSync(tasksPath)) {
      console.error(chalk.red(`Error: tasks.md not found at ${tasksPath}`));
      process.exit(1);
    }
    
    // Read and parse tasks file
    const tasksContent = readFileSync(tasksPath, 'utf-8');
    const tasks = parseAllTasksFromMarkdown(tasksContent);
    
    if (tasks.length === 0) {
      console.log('No tasks found');
      return;
    }
    
    // Handle different modes
    switch (mode) {
      case 'all':
        // Return all tasks as JSON
        console.log(JSON.stringify(tasks, null, 2));
        break;
        
      case 'single': {
        if (!taskId) {
          console.error(chalk.red('Error: Task ID required for single task mode'));
          process.exit(1);
        }
        const singleTask = tasks.find(t => t.id === taskId);
        if (singleTask) {
          console.log(JSON.stringify(singleTask, null, 2));
        } else {
          console.error(chalk.red(`Error: Task ${taskId} not found`));
          process.exit(1);
        }
        break;
      }
        
      case 'next-pending': {
        // Find the first pending task
        const nextTask = tasks.find(t => !t.completed);
        if (nextTask) {
          console.log(JSON.stringify(nextTask, null, 2));
        } else {
          console.log('No pending tasks found');
        }
        break;
      }
        
      case 'complete': {
        if (!taskId) {
          console.error(chalk.red('Error: Task ID required for complete task mode'));
          process.exit(1);
        }
        const taskToComplete = tasks.find(t => t.id === taskId);
        if (!taskToComplete) {
          console.error(chalk.red(`Error: Task ${taskId} not found`));
          process.exit(1);
        }
        if (taskToComplete.completed) {
          console.log(chalk.yellow(`Task ${taskId} is already completed`));
          return;
        }
        
        // Update the tasks.md file to mark task as complete
        const updatedContent = tasksContent.replace(
          new RegExp(`^(\\s*-\\s*\\[)\\s*(\\]\\s*${taskId.replace(/\./g, '\\.')}\\s*\\.?\\s*.+)$`, 'm'),
          '$1x$2'
        );
        
        if (updatedContent === tasksContent) {
          console.error(chalk.red(`Error: Could not find task ${taskId} to mark as complete`));
          process.exit(1);
        }
        
        writeFileSync(tasksPath, updatedContent, 'utf-8');
        console.log(chalk.green(`✓ Task ${taskId} marked as complete`));
        break;
      }
        
      default:
        console.error(chalk.red(`Error: Unknown mode ${mode}`));
        process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('Error reading tasks:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(chalk.red('Error: Please provide a spec name'));
    console.log(chalk.gray('Usage: get-tasks <spec-name> [task-id] [--mode all|single|next-pending|complete] [--project /path/to/project]'));
    console.log(chalk.gray('Examples:'));
    console.log(chalk.gray('  get-tasks user-auth                    # Get all tasks'));
    console.log(chalk.gray('  get-tasks user-auth 1.2                # Get specific task'));
    console.log(chalk.gray('  get-tasks user-auth --mode next-pending # Get next pending task'));
    console.log(chalk.gray('  get-tasks user-auth 1.2 --mode complete # Mark task 1.2 as complete'));
    process.exit(1);
  }
  
  const specName = args[0];
  let taskId: string | undefined;
  let mode: 'all' | 'single' | 'next-pending' | 'complete' = 'all';
  let projectPath: string | undefined;
  
  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--mode') {
      const modeValue = args[i + 1];
      if (modeValue && ['all', 'single', 'next-pending', 'complete'].includes(modeValue)) {
        mode = modeValue as 'all' | 'single' | 'next-pending' | 'complete';
        i++; // Skip next arg since we consumed it
      } else {
        console.error(chalk.red('Error: Invalid mode. Use: all, single, next-pending, or complete'));
        process.exit(1);
      }
    } else if (arg === '--project') {
      projectPath = args[i + 1];
      if (!projectPath) {
        console.error(chalk.red('Error: Project path required after --project'));
        process.exit(1);
      }
      i++; // Skip next arg since we consumed it
    } else if (!arg.startsWith('--')) {
      // This must be a task ID
      taskId = arg;
    }
  }
  
  // If task ID is provided, assume single mode unless explicitly set
  if (taskId && mode === 'all') {
    mode = 'single';
  }
  
  // If complete mode is used, task ID is required
  if (mode === 'complete' && !taskId) {
    console.error(chalk.red('Error: Task ID required for complete mode'));
    process.exit(1);
  }
  
  getTasks(specName, taskId, mode, projectPath);
}