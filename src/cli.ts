#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SpecWorkflowSetup } from './setup';
import { detectProjectType, validateClaudeCode } from './utils';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';
import { getFileContent } from './get-content';
import { getAgentsEnabled } from './using-agents';
import { getTasks } from './get-tasks';
import { readFileSync } from 'fs';
import * as path from 'path';

// Read version from package.json
// Use require.resolve to find package.json in both dev and production
let packageJson: { version: string };
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
} catch {
  // Fallback for edge cases
  packageJson = { version: '1.3.0' };
}

const program = new Command();

program
  .name('claude-spec-setup')
  .description('Set up Claude Code Spec Workflow with automated orchestration in your project')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  npx @pimzino/claude-code-spec-workflow@latest           # Run setup (default)
  npx @pimzino/claude-code-spec-workflow@latest setup     # Run setup explicitly
  npx @pimzino/claude-code-spec-workflow@latest test      # Test setup in temp directory
  npx @pimzino/claude-code-spec-workflow@latest get-content <file>  # Read file content
  npx @pimzino/claude-code-spec-workflow@latest using-agents       # Check if agents enabled
  npx @pimzino/claude-code-spec-workflow@latest get-tasks <spec>   # Get tasks from spec

For help with a specific command:
  npx @pimzino/claude-code-spec-workflow@latest <command> --help
`);

// Setup command (default command when no subcommand is provided)
program
  .command('setup', { isDefault: true })
  .description('Set up Claude Code Spec Workflow in your project')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-f, --force', 'Force overwrite existing files')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    console.log(chalk.cyan.bold('Claude Code Spec Workflow Setup'));
    console.log(chalk.gray('Automated spec-driven development with intelligent orchestration'));
    console.log();

    const projectPath = options.project;
    const spinner = ora('Analyzing project...').start();

    try {
      // Detect project type
      const projectTypes = await detectProjectType(projectPath);
      spinner.succeed(`Project analyzed: ${projectPath}`);

      if (projectTypes.length > 0) {
        console.log(chalk.blue(`Detected project type(s): ${projectTypes.join(', ')}`));
      }

      // Check Claude Code availability
      const claudeAvailable = await validateClaudeCode();
      if (claudeAvailable) {
        console.log(chalk.green('Claude Code is available'));
      } else {
        console.log(chalk.yellow('WARNING: Claude Code not found. Please install Claude Code first.'));
        console.log(chalk.gray('   Visit: https://docs.anthropic.com/claude-code'));
      }

      // Check for existing .claude directory
      let setup = new SpecWorkflowSetup(projectPath);
      const claudeExists = await setup.claudeDirectoryExists();

      if (claudeExists && !options.force) {
        if (!options.yes) {
          console.log(chalk.cyan('Existing installation detected'));
          console.log(chalk.green('Your spec documents (requirements.md, design.md, tasks.md) will not be modified'));
          console.log();

          // Ask what to update
          const updateChoices = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'updateItems',
              message: 'What would you like to update?',
              choices: [
                { name: 'Commands (slash commands)', value: 'commands', checked: true },
                { name: 'Templates', value: 'templates', checked: true },
                { name: 'Agents', value: 'agents', checked: true },
                { name: 'Task commands (regenerate for existing specs)', value: 'taskCommands', checked: true }
              ],
              validate: (answer) => {
                if (answer.length < 1) {
                  return 'You must choose at least one item to update.';
                }
                return true;
              }
            }
          ]);

          console.log();
          console.log(chalk.yellow('WARNING: This will overwrite existing files'));
          console.log(chalk.gray('- Commands and templates will be replaced with latest versions'));
          console.log(chalk.gray('- Selected task commands will be regenerated'));
          console.log(chalk.green('Your spec documents (requirements.md, design.md, tasks.md) will not be modified'));
          console.log();

          const { confirmUpdate } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmUpdate',
              message: 'Continue with update?',
              default: true
            }
          ]);

          if (!confirmUpdate) {
            console.log(chalk.yellow('Update cancelled.'));
            process.exit(0);
          }

          // Store update choices for later use
          setup._updateChoices = updateChoices;
        } else {
          // Auto-select all items if --yes flag is used
          setup._updateChoices = {
            updateItems: ['commands', 'templates', 'agents', 'taskCommands']
          };
        }
      }

      // Confirm setup
      if (!options.yes) {
        console.log();
        console.log(chalk.cyan('This will create:'));
        console.log(chalk.gray('  .claude/ directory structure'));
        console.log(chalk.gray('  14 slash commands (9 spec workflow + 5 bug fix workflow)'));
        console.log(chalk.gray('  Auto-generated task commands'));
        console.log(chalk.gray('  Intelligent orchestrator for automated execution'));
        console.log(chalk.gray('  Document templates'));
        console.log(chalk.gray('  NPX-based task command generation'));
        console.log(chalk.gray('  Configuration files'));
        console.log(chalk.gray('  Complete workflow instructions embedded in each command'));
        console.log();

        const { useAgents } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useAgents',
            message: 'Enable Claude Code sub-agents for enhanced task execution?',
            default: true
          }
        ]);

        // Create setup instance with agent preference, preserving update choices
        const updateChoices = setup._updateChoices;
        setup = new SpecWorkflowSetup(process.cwd(), useAgents);
        setup._updateChoices = updateChoices;
      }

      // Run setup or update
      if (claudeExists && setup._updateChoices) {
        // This is an update scenario
        const updateSpinner = ora('Updating installation...').start();
        
        const { SpecWorkflowUpdater } = await import('./update');
        const updater = new SpecWorkflowUpdater(projectPath);

        if (setup._updateChoices.updateItems.includes('commands')) {
          await updater.updateCommands();
        }

        if (setup._updateChoices.updateItems.includes('templates')) {
          await updater.updateTemplates();
        }

        if (setup._updateChoices.updateItems.includes('agents')) {
          await updater.updateAgents();
        }

        if (setup._updateChoices.updateItems.includes('taskCommands')) {
          await updater.regenerateTaskCommands();
        }

        updateSpinner.succeed('Update complete!');
      } else {
        // This is a fresh setup
        const setupSpinner = ora('Setting up spec workflow...').start();
        await setup.runSetup();
        setupSpinner.succeed('Setup complete!');
      }

      // Success message
      console.log();
      if (claudeExists && setup._updateChoices) {
        console.log(chalk.green.bold('Spec Workflow updated successfully!'));
      } else {
        console.log(chalk.green.bold('Spec Workflow installed successfully!'));
      }
      console.log();
      console.log(chalk.cyan('Available commands:'));
      console.log(chalk.white.bold('Spec Workflow (for new features):'));
      console.log(chalk.gray('  /spec-create <feature-name>  - Create a new spec'));
      console.log(chalk.gray('  /spec-orchestrate <spec>     - NEW! Automated execution'));
      console.log(chalk.gray('  /spec-execute <task-id>      - Execute tasks manually'));
      console.log(chalk.gray('  /{spec-name}-task-{id}       - Auto-generated task commands'));
      console.log(chalk.gray('  /spec-status                 - Show status'));
      console.log(chalk.gray('  /spec-completion-review      - Final review when all tasks complete'));
      console.log(chalk.gray('  /spec-list                   - List all specs'));
      console.log();
      
      // Show agents section if enabled
      if (setup && setup['createAgents']) {
        console.log(chalk.white.bold('Sub-Agents (automatic):'));
        console.log(chalk.gray('  spec-task-executor                - Specialized task implementation agent'));
        console.log(chalk.gray('  spec-requirements-validator       - Requirements quality validation agent'));
        console.log(chalk.gray('  spec-design-validator             - Design quality validation agent'));
        console.log(chalk.gray('  spec-task-validator               - Task atomicity validation agent'));
        console.log(chalk.gray('  spec-task-implementation-reviewer - Post-implementation review agent'));
        console.log(chalk.gray('  spec-integration-tester           - Integration testing and validation agent'));
        console.log(chalk.gray('  spec-completion-reviewer          - End-to-end feature completion agent'));
        console.log(chalk.gray('  bug-root-cause-analyzer           - Enhanced bug analysis with git history'));
        console.log(chalk.gray('  steering-document-updater         - Analyzes codebase and suggests doc updates'));
        console.log(chalk.gray('  spec-dependency-analyzer          - Optimizes task execution order'));
        console.log(chalk.gray('  spec-test-generator               - Generates tests from requirements'));
        console.log(chalk.gray('  spec-documentation-generator      - Maintains project documentation'));
        console.log(chalk.gray('  spec-performance-analyzer         - Analyzes performance implications'));
        console.log(chalk.gray('  spec-duplication-detector         - Identifies code reuse opportunities'));
        console.log(chalk.gray('  spec-breaking-change-detector     - Detects API compatibility issues'));
        console.log();
      }
      
      console.log(chalk.white.bold('Bug Fix Workflow (for bug fixes):'));
      console.log(chalk.gray('  /bug-create <bug-name>       - Start bug fix'));
      console.log(chalk.gray('  /bug-analyze                 - Analyze root cause'));
      console.log(chalk.gray('  /bug-fix                     - Implement fix'));
      console.log(chalk.gray('  /bug-verify                  - Verify fix'));
      console.log(chalk.gray('  /bug-status                  - Show bug status'));
      console.log();
      // Show restart message if commands were updated
      if (claudeExists && setup._updateChoices && 
          (setup._updateChoices.updateItems.includes('commands') || 
           setup._updateChoices.updateItems.includes('taskCommands'))) {
        console.log(chalk.yellow.bold('RESTART REQUIRED:'));
        console.log(chalk.gray('You must restart Claude Code for updated commands to be visible'));
        console.log(chalk.white('- Run "claude --continue" to continue this conversation'));
        console.log(chalk.white('- Or run "claude" to start a fresh session'));
        console.log();
      }

      console.log(chalk.yellow('Next steps:'));
      console.log(chalk.gray('1. Run: claude'));
      console.log(chalk.gray('2. For new features: /spec-create my-feature'));
      console.log(chalk.gray('3. For bug fixes: /bug-create my-bug'));
      console.log();
      console.log(chalk.blue('For help, see the README or run /spec-list'));
      console.log(chalk.blue('To update later: npx @pimzino/claude-code-spec-workflow@latest'));

    } catch (error) {
      spinner.fail('Setup failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add test command
program
  .command('test')
  .description('Test the setup in a temporary directory')
  .action(async () => {
    console.log(chalk.cyan('Testing setup...'));

    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs/promises');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-spec-test-'));

    try {
      const setup = new SpecWorkflowSetup(tempDir);
      await setup.runSetup();

      console.log(chalk.green('Test completed successfully!'));
      console.log(chalk.gray(`Test directory: ${path.resolve(tempDir)}`));
      console.log(chalk.blue('You can inspect the generated files in the test directory.'));

    } catch (error) {
      console.error(chalk.red('Test failed:'), error);
      process.exit(1);
    }
  });

// Add generate-task-commands command
program
  .command('generate-task-commands')
  .description('Generate individual task commands for a spec')
  .argument('<spec-name>', 'Name of the spec to generate commands for')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (specName, options) => {
    console.log(chalk.cyan('Generating task commands...'));
    
    const path = await import('path');
    const fs = await import('fs/promises');
    
    const projectPath = options.project;
    const specDir = path.join(projectPath, '.claude', 'specs', specName);
    const tasksFile = path.join(specDir, 'tasks.md');
    const commandsSpecDir = path.join(projectPath, '.claude', 'commands', specName);
    
    const spinner = ora(`Generating commands for spec: ${specName}`).start();
    
    try {
      // Check if tasks.md exists
      try {
        await fs.access(tasksFile);
      } catch {
        spinner.fail(`tasks.md not found at ${tasksFile}`);
        process.exit(1);
      }
      
      // Read tasks.md
      const tasksContent = await fs.readFile(tasksFile, 'utf8');
      
      // Create spec commands directory
      await fs.mkdir(commandsSpecDir, { recursive: true });
      
      // Parse tasks and generate commands
      const tasks = parseTasksFromMarkdown(tasksContent);
      
      let taskCount = 0;
      for (const task of tasks) {
        await generateTaskCommand(commandsSpecDir, specName, task);
        taskCount++;
      }
      
      spinner.succeed(`Generated ${taskCount} task commands for spec: ${specName}`);
      
      console.log();
      console.log(chalk.green('Generated commands:'));
      for (const task of tasks) {
        console.log(chalk.gray(`  /${specName}-task-${task.id} - ${task.description}`));
      }
      
      console.log();
      console.log(chalk.yellow.bold('RESTART REQUIRED: You must restart Claude Code for the new commands to be visible'));
      console.log();
      console.log(chalk.cyan.bold('Instructions for the agent:'));
      console.log(chalk.gray('Tell the user they must exit Claude Code and restart it using:'));
      console.log(chalk.white('- Run "claude --continue" to continue this conversation with new commands'));
      console.log(chalk.white('- Or run "claude" to start a fresh session'));
      console.log(chalk.gray('The restart is absolutely necessary for the new task commands to appear.'));
      console.log();
      console.log(chalk.blue('After restart, you can use commands like:'));
      if (tasks.length > 0) {
        console.log(chalk.gray(`  /${specName}-task-${tasks[0].id}`));
        if (tasks.length > 1) {
          console.log(chalk.gray(`  /${specName}-task-${tasks[1].id}`));
        }
        console.log(chalk.gray('  etc.'));
      }
      
    } catch (error) {
      spinner.fail('Command generation failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add get-content command
program
  .command('get-content')
  .description('Read and print the contents of a file')
  .argument('<file-path>', 'Full path to the file to read')
  .action(async (filePath) => {
    await getFileContent(filePath);
  });

// Add using-agents command
program
  .command('using-agents')
  .description('Check if agents are enabled in spec-config.json')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (options) => {
    await getAgentsEnabled(options.project);
  });


// Add get-tasks command
program
  .command('get-tasks')
  .description('Get tasks from a specification')
  .argument('<spec-name>', 'Name of the spec to get tasks from')
  .argument('[task-id]', 'Specific task ID to retrieve')
  .option('-m, --mode <mode>', 'Mode: all, single, next-pending, or complete', 'all')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (specName, taskId, options) => {
    let mode = options.mode as 'all' | 'single' | 'next-pending' | 'complete';
    
    // Auto-detect mode if taskId is provided and mode is default
    if (taskId && mode === 'all') {
      mode = 'single';
    }
    
    if (!['all', 'single', 'next-pending', 'complete'].includes(mode)) {
      console.error(chalk.red('Error: Invalid mode. Use: all, single, next-pending, or complete'));
      process.exit(1);
    }
    await getTasks(specName, taskId, mode, options.project);
  });

// Add error handling for unknown commands
program.on('command:*', () => {
  const availableCommands = program.commands.map(cmd => cmd.name()).filter(name => name !== 'help');
  console.error(chalk.red(`Error: Unknown command '${program.args[0]}'`));
  console.log();
  console.log(chalk.cyan('Available commands:'));
  availableCommands.forEach(cmd => {
    const command = program.commands.find(c => c.name() === cmd);
    if (command) {
      console.log(chalk.gray(`  ${cmd} - ${command.description()}`));
    }
  });
  console.log();
  console.log(chalk.yellow('For help with a specific command, run:'));
  console.log(chalk.gray('  npx @pimzino/claude-code-spec-workflow@latest <command> --help'));
  process.exit(1);
});

// Parse arguments normally - let Commander.js handle everything
program.parse();