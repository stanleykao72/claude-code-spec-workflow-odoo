#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SpecWorkflowSetup } from './setup';
import { detectProjectType, validateClaudeCode } from './utils';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';
import { getFileContent } from './get-content';
import { getSteeringContext } from './get-steering-context';
import { getSpecContext } from './get-spec-context';
import { getTemplateContext } from './get-template-context';
import { getTasks } from './get-tasks';
import { autoUpdate } from './auto-update';
import { readFileSync, promises as fs } from 'fs';
import * as path from 'path';
import { join } from 'path';

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

// Debug logging for WSL issues
if (process.env.DEBUG_CLI) {
  console.log('process.argv:', process.argv);
  console.log('process.execPath:', process.execPath);
  console.log('__filename:', __filename);
}

program
  .name('claude-spec-setup')
  .description('Set up Claude Code Spec Workflow with automated orchestration in your project')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  npx @pimzino/claude-code-spec-workflow@latest           # Run setup (default)
  npx @pimzino/claude-code-spec-workflow@latest setup     # Run setup explicitly
  npx @pimzino/claude-code-spec-workflow@latest test      # Test setup in temp directory
  claude-code-spec-workflow get-content <file>  # Read file content
  claude-code-spec-workflow get-steering-context # Get formatted steering documents
  claude-code-spec-workflow get-spec-context <spec> # Get formatted spec documents
  claude-code-spec-workflow get-template-context [type] # Get formatted templates
  claude-code-spec-workflow get-tasks <spec>   # Get tasks from spec

For help with a specific command:
  npx @pimzino/claude-code-spec-workflow@latest <command> --help
`);

// Setup command
program
  .command('setup')
  .description('Set up Claude Code Spec Workflow in your project')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-f, --force', 'Force overwrite existing files')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-update', 'Skip automatic update check')
  .action(async (options) => {
    console.log(chalk.cyan.bold('Claude Code Spec Workflow Setup'));
    console.log(chalk.gray('Automated spec-driven development with intelligent task execution'));
    console.log();

    // Check for updates and auto-update if available (unless disabled)
    if (options.update !== false) {
      await autoUpdate();
    }

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

      // Check for existing .claude directory and installation completeness
      let setup = new SpecWorkflowSetup(projectPath);
      const claudeExists = await setup.claudeDirectoryExists();
      let isComplete = false;

      if (claudeExists) {
        // Check if installation is complete (agents are now mandatory)
        isComplete = await setup.isInstallationComplete();
      }

      // Handle incomplete installations - auto-complete without prompts
      if (claudeExists && !isComplete) {
        console.log(chalk.yellow('Incomplete installation detected - completing automatically...'));
        console.log(chalk.gray('Some required files or directories are missing from your .claude installation.'));
        console.log(chalk.green('Your spec documents (requirements.md, design.md, tasks.md) will not be modified'));
        console.log();
        // For incomplete installations, we'll proceed with fresh setup to add missing files
        // The setup process will only create missing files/directories
      }

      if (claudeExists && isComplete) {
        console.log(chalk.cyan('Existing installation detected - updating automatically...'));
        console.log(chalk.green('Your spec documents (requirements.md, design.md, tasks.md) will not be modified'));
        console.log();
        console.log(chalk.yellow('🔄 Update Process:'));
        console.log(chalk.gray('- Complete .claude directory will be backed up automatically'));
        console.log(chalk.gray('- Fresh installation will be created with latest versions'));
        console.log(chalk.gray('- Your specs and task commands will be restored from backup'));
        console.log(chalk.green('✓ Your spec documents (requirements.md, design.md, tasks.md) will be preserved'));
        console.log();
      }

      // Setup for new installations - agents are now mandatory
      if (!claudeExists || !isComplete) {
        console.log();
        console.log(chalk.cyan('This will create:'));
        console.log(chalk.gray('  .claude/ directory structure'));
        console.log(chalk.gray('  14 slash commands (9 spec workflow + 5 bug fix workflow)'));
        console.log(chalk.gray('  Auto-generated task commands for existing specs'));
        console.log(chalk.gray('  Intelligent orchestrator for automated execution'));
        console.log(chalk.gray('  Document templates'));
        console.log(chalk.gray('  NPX-based task command generation'));
        console.log(chalk.gray('  Complete workflow instructions embedded in each command'));
        console.log(chalk.gray('  Claude Code sub-agents (mandatory)'));
        console.log();

        // Create setup instance (agents are now mandatory)
        setup = new SpecWorkflowSetup(process.cwd());
      }

      // Run setup or update
      if (claudeExists && isComplete) {
        // This is an update scenario (complete installation being updated)
        const updateSpinner = ora('Starting fresh installation update...').start();

        const { SpecWorkflowUpdater } = await import('./update');
        const updater = new SpecWorkflowUpdater(projectPath);

        // Agents are now mandatory for all installations
        
        try {
          await updater.updateWithFreshInstall(); // Agents are now mandatory
        } catch (error) {
          updateSpinner.fail('Fresh installation update failed');
          console.error(chalk.red('Fresh installation update failed. Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
        
        // Clean up old backups (keep 5 most recent)
        await updater.cleanupOldBackups(5);

        updateSpinner.succeed('Update complete!');
      } else {
        // This is a fresh setup or completing an incomplete installation
        const isCompletion = claudeExists && !isComplete;
        const setupSpinner = ora(isCompletion ? 'Completing installation...' : 'Setting up spec workflow...').start();
        await setup.runSetup();
        setupSpinner.succeed(isCompletion ? 'Installation completed!' : 'Setup complete!');
      }

      // Success message
      console.log();
      if (claudeExists && isComplete) {
        console.log(chalk.green.bold('Spec Workflow updated successfully!'));
        console.log(chalk.gray('A backup of your previous installation was created automatically.'));
      } else if (claudeExists && !isComplete) {
        console.log(chalk.green.bold('Spec Workflow installation completed successfully!'));
        console.log(chalk.gray('Missing files and directories have been added to your existing installation.'));
      } else {
        console.log(chalk.green.bold('Spec Workflow installed successfully!'));
      }
      console.log();
      // Show restart message if it was an update or installation completion
      if ((claudeExists && isComplete) || (claudeExists && !isComplete)) {
        console.log(chalk.yellow.bold('RESTART REQUIRED:'));
        console.log(chalk.gray('You must restart Claude Code for updated commands to be visible'));
        console.log(chalk.white('- Run "claude --continue" to continue this conversation'));
        console.log(chalk.white('- Or run "claude" to start a fresh session'));
        console.log();
      }

      console.log(chalk.yellow('Next steps:'));
      console.log(chalk.gray('1. Run: claude'));
      console.log(chalk.gray('2. For new features: /spec-create feature-name "description"'));
      console.log(chalk.gray('3. For bug fixes: /bug-create bug-name "description"'));
      console.log();
      console.log(chalk.blue('For help, see the README'));
      console.log(chalk.blue('To update later: npm install -g @pimzino/claude-code-spec-workflow'));

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

// Add get-steering-context command
program
  .command('get-steering-context')
  .description('Load and format all steering documents for context passing')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (options) => {
    await getSteeringContext(options.project);
  });

// Add get-spec-context command
program
  .command('get-spec-context')
  .description('Load and format all specification documents for context passing')
  .argument('<spec-name>', 'Name of the specification')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (specName, options) => {
    await getSpecContext(specName, options.project);
  });

// Add get-template-context command
program
  .command('get-template-context')
  .description('Load and format templates for context passing')
  .argument('[template-type]', 'Template type: spec, steering, bug, or all (default: all)')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (templateType, options) => {
    await getTemplateContext(templateType, options.project);
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

// Check if we should add 'setup' as default command
const args = process.argv.slice(2);
if (args.length === 0 || (args.length > 0 && !args[0].startsWith('-') && !program.commands.some(cmd => cmd.name() === args[0]))) {
  // No command provided or first arg is not a known command and not a flag
  // Insert 'setup' as the command
  process.argv.splice(2, 0, 'setup');
}

// Parse arguments normally - let Commander.js handle everything
program.parse();