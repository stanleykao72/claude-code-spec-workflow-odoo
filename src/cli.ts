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
import { OdooStructureGenerator } from './odoo/structure-generator';
import { OdooVersionDetector } from './odoo/version-detector';
import { SteeringDocumentGenerator } from './odoo/steering-generator';
import { OdooVersionManager } from './odoo/version-manager';
import { OdooEnvironmentManager } from './odoo/environment-manager';
import { OdooModuleManager } from './odoo/module-manager';
import { OdooCommandExecutor } from './odoo/command-executor';
import { CommandLifecycleManager } from './odoo/command-lifecycle';
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
  .description('Set up Claude Code Spec Workflow with automated orchestration in your project (with Odoo ERP support)')
  .version(packageJson.version)
  .addHelpText('after', `
Examples:
  npx @pimzino/claude-code-spec-workflow@latest           # Run setup (default)
  npx @pimzino/claude-code-spec-workflow@latest setup     # Run setup explicitly
  npx @pimzino/claude-code-spec-workflow@latest odoo-setup    # Setup Odoo development environment
  npx @pimzino/claude-code-spec-workflow@latest odoo-detect  # Detect Odoo version and modules
  npx @pimzino/claude-code-spec-workflow@latest odoo-version # Manage Odoo versions and migration
  npx @pimzino/claude-code-spec-workflow@latest odoo-env     # Manage development environments
  npx @pimzino/claude-code-spec-workflow@latest odoo-modules # Manage Odoo modules
  npx @pimzino/claude-code-spec-workflow@latest odoo-cmd     # Execute Odoo commands
  npx @pimzino/claude-code-spec-workflow@latest odoo-cleanup # Manage command lifecycle
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
      
      // Detect if this is an Odoo project
      const odooDetector = new OdooVersionDetector();
      const odooVersion = await odooDetector.detectInstalledVersion();
      
      spinner.succeed(`Project analyzed: ${projectPath}`);

      if (projectTypes.length > 0) {
        console.log(chalk.blue(`Detected project type(s): ${projectTypes.join(', ')}`));
      }
      
      if (odooVersion) {
        console.log(chalk.green(`🎯 Odoo project detected: Version ${odooVersion}`));
        console.log(chalk.gray('  提示：您可以使用 odoo-setup 命令設定 Odoo 開發環境'));
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

// Odoo-specific commands
program
  .command('odoo-setup')
  .description('Set up Odoo development environment with spec workflow')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (options) => {
    console.log(chalk.cyan.bold('🔧 Odoo 開發環境設定'));
    console.log(chalk.gray('設定 Odoo 客製化開發的規格化工作流程'));
    console.log();

    try {
      const generator = new OdooStructureGenerator();
      const config = await generator.setupOdooProject();
      
      console.log();
      console.log(chalk.green('✓ Odoo 開發環境設定完成！'));
      console.log();
      console.log(chalk.cyan('下一步：'));
      console.log(chalk.gray('1. 執行 /odoo-steering 建立專案指導文件'));
      console.log(chalk.gray('2. 開始使用 /spec-create 建立功能規格'));
      console.log(chalk.gray('3. 開始使用 /bug-create 建立問題修復規格'));
      
    } catch (error) {
      console.error(chalk.red('Odoo 環境設定失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('odoo-detect')
  .description('Detect installed Odoo version and environment compatibility')
  .action(async () => {
    console.log(chalk.cyan.bold('🔍 Odoo 版本檢測'));
    console.log(chalk.cyan('━'.repeat(20)));

    try {
      const detector = new OdooVersionDetector();
      
      // 檢測已安裝版本
      const version = await detector.detectInstalledVersion();
      
      if (version) {
        // 執行完整相容性檢查
        await detector.performCompatibilityCheck(version);
        
        // 顯示升級建議
        const recommendations = detector.getUpgradeRecommendations(version);
        if (recommendations.length > 0) {
          console.log(chalk.cyan('\\n💡 建議'));
          console.log(chalk.cyan('━'.repeat(8)));
          recommendations.forEach(rec => console.log(chalk.gray(`  ${rec}`)));
        }
      } else {
        console.log(chalk.yellow('⚠️ 未偵測到 Odoo 安裝'));
        console.log(chalk.gray('建議:'));
        console.log(chalk.gray('  - 安裝 Odoo 16.0 LTS（穩定企業版）'));
        console.log(chalk.gray('  - 或安裝 Odoo 18.0（最新功能）'));
      }
      
    } catch (error) {
      console.error(chalk.red('版本檢測失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('odoo-steering')
  .description('Generate Odoo-specific steering documents (business rules, tech stack, module standards)')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (options) => {
    console.log(chalk.cyan.bold('📋 Odoo 專案指導文件生成'));
    console.log(chalk.gray('建立商業規則、技術堆疊和模組標準文件'));
    console.log();

    try {
      // 需要先載入 Odoo 配置
      const structureGenerator = new OdooStructureGenerator();
      const config = await structureGenerator.loadOdooConfig();
      
      if (!config) {
        console.log(chalk.yellow('⚠️ 未找到 Odoo 配置，請先執行 odoo-setup'));
        console.log(chalk.gray('建議: npx claude-code-spec-workflow odoo-setup'));
        return;
      }
      
      const generator = new SteeringDocumentGenerator(config);
      await generator.generateAllSteeringDocuments();
      
      console.log();
      console.log(chalk.green('✓ Steering Documents 生成完成！'));
      console.log();
      console.log(chalk.yellow('檔案已建立至:'));
      console.log(chalk.gray('  - .odoo-dev/steering/business-rules.md'));
      console.log(chalk.gray('  - .odoo-dev/steering/technical-stack.md'));
      console.log(chalk.gray('  - .odoo-dev/steering/module-standards.md'));
      
    } catch (error) {
      console.error(chalk.red('Steering documents 生成失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo spec list command
program
  .command('odoo-spec-list')
  .description('List all specifications across Odoo modules')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (options) => {
    console.log(chalk.cyan.bold('📋 Odoo 模組規格清單'));
    console.log(chalk.gray('列出所有 Odoo 模組的規格、功能、錯誤修復和測試'));
    console.log();

    try {
      // 檢查是否為 Odoo 專案
      const structureGenerator = new OdooStructureGenerator();
      const config = await structureGenerator.loadOdooConfig();
      
      if (!config) {
        console.log(chalk.yellow('⚠️ 未找到 Odoo 配置，請先執行 odoo-setup'));
        console.log(chalk.gray('建議: npx claude-code-spec-workflow-odoo odoo-setup'));
        return;
      }

      // 執行模組規格掃描
      const moduleManager = new OdooModuleManager(config);
      await moduleManager.scanModuleSpecs();
      
      console.log();
      console.log(chalk.green('✓ 模組規格掃描完成！'));
      console.log(chalk.gray('使用 /odoo-spec-list 命令查看詳細清單'));
      
    } catch (error) {
      console.error(chalk.red('模組規格清單失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo spec status command
program
  .command('odoo-spec-status')
  .description('Show detailed status of Odoo module specifications')
  .argument('[module-name]', 'Specific module to check')
  .argument('[spec-type]', 'Type of spec (features, bugs, testing)')
  .argument('[spec-name]', 'Specific specification name')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (moduleName, specType, specName, options) => {
    console.log(chalk.cyan.bold('📊 Odoo 模組規格狀態'));
    console.log(chalk.gray('顯示模組規格的詳細進度和狀態'));
    console.log();

    try {
      // 檢查是否為 Odoo 專案
      const structureGenerator = new OdooStructureGenerator();
      const config = await structureGenerator.loadOdooConfig();
      
      if (!config) {
        console.log(chalk.yellow('⚠️ 未找到 Odoo 配置，請先執行 odoo-setup'));
        console.log(chalk.gray('建議: npx claude-code-spec-workflow-odoo odoo-setup'));
        return;
      }

      // 執行狀態檢查
      const moduleManager = new OdooModuleManager(config);
      await moduleManager.showSpecStatus(moduleName, specType, specName);
      
      console.log();
      console.log(chalk.gray('使用 /odoo-spec-status 命令查看詳細狀態'));
      
    } catch (error) {
      console.error(chalk.red('模組規格狀態檢查失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo spec execute command
program
  .command('odoo-spec-execute')
  .description('Execute Odoo module specification tasks')
  .argument('<task-id>', 'Task number to execute')
  .argument('<spec-name>', 'Name of the specification')
  .argument('[module-name]', 'Specific module name if spec name is ambiguous')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (taskId, specName, moduleName, options) => {
    console.log(chalk.cyan.bold('🚀 Odoo 模組規格任務執行'));
    console.log(chalk.gray(`執行任務 ${taskId}: ${specName}${moduleName ? ` (模組: ${moduleName})` : ''}`));
    console.log();

    try {
      // 檢查是否為 Odoo 專案
      const structureGenerator = new OdooStructureGenerator();
      const config = await structureGenerator.loadOdooConfig();
      
      if (!config) {
        console.log(chalk.yellow('⚠️ 未找到 Odoo 配置，請先執行 odoo-setup'));
        console.log(chalk.gray('建議: npx claude-code-spec-workflow-odoo odoo-setup'));
        return;
      }

      // 執行任務
      const moduleManager = new OdooModuleManager(config);
      await moduleManager.executeSpecTask(parseInt(taskId), specName, moduleName);
      
      console.log();
      console.log(chalk.green('✓ 任務執行完成！'));
      console.log(chalk.gray('使用 /odoo-spec-status 檢查進度'));
      
    } catch (error) {
      console.error(chalk.red('模組規格任務執行失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo version management command
program
  .command('odoo-version')
  .description('Manage Odoo version and migration')
  .option('-c, --check', 'Check available upgrades')
  .option('-u, --upgrade <version>', 'Upgrade to specific version')
  .option('-p, --plan <version>', 'Generate migration plan')
  .option('-h, --history', 'Show upgrade history')
  .action(async (options) => {
    try {
      const configPath = '.odoo-dev/config.json';
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const versionManager = new OdooVersionManager(config);

      if (options.check) {
        console.log(chalk.blue('🔍 檢查可用的 Odoo 版本升級...'));
        const upgrades = await versionManager.checkAvailableUpgrades();
        if (upgrades.length > 0) {
          console.log(chalk.green('可升級版本:'));
          upgrades.forEach(version => console.log(`  - ${version}`));
        } else {
          console.log(chalk.green('✅ 已使用最新版本'));
        }
      } else if (options.upgrade) {
        console.log(chalk.blue(`🔄 升級至 Odoo ${options.upgrade}...`));
        await versionManager.executeUpgrade(options.upgrade, { testMode: true });
      } else if (options.plan) {
        console.log(chalk.blue(`📋 生成遷移計劃 (目標: ${options.plan})...`));
        const plan = await versionManager.generateMigrationPlan(options.plan);
        console.log(chalk.cyan('\n遷移計劃:'));
        console.log(`從 ${plan.fromVersion} 升級至 ${plan.toVersion}`);
        console.log(`預估時間: ${plan.estimatedTime}`);
        console.log(`模組數量: ${plan.modules.length}`);
        console.log(`相容性問題: ${plan.compatibilityIssues.length}`);
      } else if (options.history) {
        const history = await versionManager.getUpgradeHistory();
        if (history.length > 0) {
          console.log(chalk.cyan('\n📋 升級歷史:'));
          history.forEach(h => {
            const statusIcon = h.status === 'completed' ? '✅' : h.status === 'failed' ? '❌' : '🔄';
            console.log(`${statusIcon} ${h.fromVersion} → ${h.toVersion} (${new Date(h.date).toLocaleDateString()})`);
          });
        } else {
          console.log(chalk.yellow('沒有升級歷史記錄'));
        }
      } else {
        const info = await versionManager.getCurrentVersion();
        console.log(chalk.cyan('\n📊 目前版本資訊:'));
        console.log(`Odoo 版本: ${info.version}`);
        console.log(`Python 版本: ${info.pythonVersion}`);
        console.log(`環境類型: ${info.environment}`);
        console.log(`最後更新: ${new Date(info.lastUpdated).toLocaleDateString()}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ 版本管理操作失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo environment management command
program
  .command('odoo-env')
  .description('Manage Odoo development environments')
  .option('-l, --list', 'List all environments')
  .option('-c, --create', 'Create new environment interactively')
  .option('-s, --switch <name>', 'Switch to environment')
  .option('-r, --remove <name>', 'Remove environment')
  .option('-x, --execute <command>', 'Execute command in active environment')
  .action(async (options) => {
    try {
      const envManager = new OdooEnvironmentManager();

      if (options.list) {
        await envManager.listEnvironments();
      } else if (options.create) {
        await envManager.createEnvironmentInteractive();
      } else if (options.switch) {
        await envManager.switchEnvironment(options.switch);
      } else if (options.remove) {
        await envManager.removeEnvironment(options.remove);
      } else if (options.execute) {
        const parts = options.execute.split(' ');
        const commandType = parts[0];
        if (['start', 'stop', 'restart', 'upgrade', 'test'].includes(commandType)) {
          await envManager.executeCommand(commandType as any);
        } else {
          console.error(chalk.red('不支援的命令類型'));
        }
      } else {
        await envManager.listEnvironments();
      }
    } catch (error) {
      console.error(chalk.red('❌ 環境管理操作失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo module management command
program
  .command('odoo-modules')
  .description('Manage Odoo modules')
  .option('-s, --scan', 'Scan for modules')
  .option('-c, --check', 'Check dependency issues')
  .option('-u, --upgrade <module> <version>', 'Upgrade module version')
  .option('-t, --stats', 'Show module statistics')
  .option('-g, --graph', 'Generate dependency graph')
  .action(async (options) => {
    try {
      const configPath = '.odoo-dev/config.json';
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const moduleManager = new OdooModuleManager(config);

      if (options.scan) {
        const modules = await moduleManager.scanModules();
        console.log(chalk.green(`✅ 發現 ${modules.length} 個模組`));
        modules.forEach(m => console.log(`  - ${m.name} (${m.manifest.version || '未知版本'})`));
      } else if (options.check) {
        await moduleManager.checkDependencyIssues();
      } else if (options.upgrade) {
        console.error(chalk.red('升級模組需要指定模組名稱和版本'));
        console.log(chalk.gray('用法: --upgrade <module> <version>'));
      } else if (options.stats) {
        const stats = await moduleManager.getModuleStats();
        console.log(chalk.cyan('\n📊 模組統計:'));
        console.log(`總計: ${stats.total} 個模組`);
        console.log(`可安裝: ${stats.installable} 個`);
        console.log(`應用程式: ${stats.applications} 個`);
        console.log(`相依問題: ${stats.withDependencyIssues} 個`);
      } else if (options.graph) {
        await moduleManager.generateDependencyGraph();
      } else {
        await moduleManager.manageModulesInteractive();
      }
    } catch (error) {
      console.error(chalk.red('❌ 模組管理操作失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo command execution
program
  .command('odoo-cmd')
  .description('Execute Odoo commands')
  .option('-t, --type <type>', 'Command type (start, stop, restart, upgrade, test, install, update)')
  .option('-m, --modules <modules>', 'Module names (comma separated)')
  .option('-d, --database <name>', 'Database name')
  .option('-e, --env <name>', 'Environment name')
  .option('-b, --batch', 'Execute batch commands interactively')
  .option('-h, --history', 'Show command history')
  .option('-c, --cleanup', 'Cleanup command history')
  .action(async (options) => {
    try {
      const configPath = '.odoo-dev/config.json';
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const cmdExecutor = new OdooCommandExecutor(config);

      if (options.history) {
        const history = await cmdExecutor.getCommandHistory();
        if (history.length > 0) {
          console.log(chalk.cyan('\n📋 命令歷史:'));
          history.forEach(cmd => {
            const statusIcon = cmd.status === 'completed' ? '✅' : 
                             cmd.status === 'failed' ? '❌' : 
                             cmd.status === 'active' ? '🔄' : '📋';
            console.log(`${statusIcon} ${cmd.command}`);
            console.log(chalk.gray(`   ${new Date(cmd.created).toLocaleDateString()}`));
          });
        } else {
          console.log(chalk.yellow('沒有命令歷史記錄'));
        }
      } else if (options.cleanup) {
        await cmdExecutor.cleanupCommandHistory();
      } else if (options.batch) {
        // 簡化批次執行，直接使用 executeInteractive
        await cmdExecutor.executeInteractive();
      } else if (options.type) {
        const modules = options.modules ? options.modules.split(',').map((m: string) => m.trim()) : undefined;
        await cmdExecutor.executeOdooCommand(options.type, {
          modules,
          database: options.database,
          environment: options.env
        });
      } else {
        await cmdExecutor.executeInteractive();
      }
    } catch (error) {
      console.error(chalk.red('❌ 命令執行失敗:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add Odoo command lifecycle management
program
  .command('odoo-cleanup')
  .description('Manage Odoo command lifecycle and cleanup')
  .option('-r, --run', 'Run automatic cleanup')
  .option('-s, --stats', 'Show command statistics')
  .option('-l, --list', 'List all commands')
  .option('-f, --find <criteria>', 'Search commands (name, type, module, status)')
  .option('--archive <id>', 'Archive specific command')
  .option('--delete <id>', 'Delete specific command')
  .option('--status <id> <status>', 'Update command status')
  .option('--policy', 'Show cleanup policy')
  .option('--policy-edit', 'Edit cleanup policy')
  .action(async (options) => {
    try {
      const lifecycleManager = new CommandLifecycleManager();

      if (options.run) {
        console.log(chalk.blue('🧹 Running automatic command cleanup...'));
        const report = await lifecycleManager.cleanupExpiredCommands();
        
        console.log(chalk.cyan('\n📊 Cleanup Report:'));
        console.log(`Total processed: ${report.totalProcessed}`);
        console.log(`Archived: ${report.archived}`);
        console.log(`Deleted: ${report.deleted}`);
        console.log(`Retained: ${report.retained}`);
        
        if (report.errors.length > 0) {
          console.log(chalk.red('\n❌ Errors:'));
          report.errors.forEach(error => console.log(`  - ${error}`));
        }

      } else if (options.stats) {
        const stats = lifecycleManager.getCommandStats();
        
        console.log(chalk.cyan('\n📊 Command Statistics:'));
        console.log(`Total commands: ${stats.total}`);
        
        console.log('\nBy Type:');
        Object.entries(stats.byType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
        
        console.log('\nBy Status:');
        Object.entries(stats.byStatus).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });

        if (stats.mostUsed.length > 0) {
          console.log('\nMost Used Commands:');
          stats.mostUsed.slice(0, 5).forEach(cmd => {
            console.log(`  ${cmd.name} (used ${cmd.useCount} times)`);
          });
        }

      } else if (options.list) {
        const commands = lifecycleManager.searchCommands({});
        
        if (commands.length === 0) {
          console.log(chalk.yellow('No commands found'));
          return;
        }

        console.log(chalk.cyan(`\n📋 Commands (${commands.length} total):`));
        commands.forEach(cmd => {
          const statusIcon = cmd.status === 'active' ? '🟢' :
                            cmd.status === 'completed' ? '✅' :
                            cmd.status === 'archived' ? '📦' : '🔴';
          const typeIcon = cmd.type === 'task' ? '📝' :
                          cmd.type === 'bug' ? '🐛' :
                          cmd.type === 'feature' ? '🆕' :
                          cmd.type === 'spec' ? '📋' : '⚙️';
          
          console.log(`${statusIcon} ${typeIcon} ${cmd.name}`);
          console.log(`   Type: ${cmd.type} | Status: ${cmd.status} | Importance: ${cmd.importance}`);
          if (cmd.module) console.log(`   Module: ${cmd.module}`);
          console.log(`   Created: ${new Date(cmd.createdAt).toLocaleDateString()}`);
          if (cmd.lastUsed) console.log(`   Last used: ${new Date(cmd.lastUsed).toLocaleDateString()}`);
          console.log();
        });

      } else if (options.find) {
        const criteria = options.find.toLowerCase();
        const commands = lifecycleManager.searchCommands({
          name: criteria.includes('name=') ? criteria.split('name=')[1].split(',')[0] : undefined,
          type: criteria.includes('type=') ? criteria.split('type=')[1].split(',')[0] as any : undefined,
          module: criteria.includes('module=') ? criteria.split('module=')[1].split(',')[0] : undefined,
          status: criteria.includes('status=') ? criteria.split('status=')[1].split(',')[0] as any : undefined,
        });

        if (commands.length === 0) {
          console.log(chalk.yellow(`No commands found matching: ${options.find}`));
          return;
        }

        console.log(chalk.cyan(`\n🔍 Found ${commands.length} commands matching "${options.find}":`));
        commands.forEach(cmd => {
          console.log(`  ${cmd.id} - ${cmd.name} (${cmd.type}, ${cmd.status})`);
        });

      } else if (options.archive) {
        await lifecycleManager.archiveCommand(options.archive, 'Manual archive request');
        console.log(chalk.green(`✅ Command ${options.archive} archived`));

      } else if (options.delete) {
        await lifecycleManager.deleteCommand(options.delete, 'Manual delete request');
        console.log(chalk.green(`✅ Command ${options.delete} deleted`));

      } else if (options.status) {
        // This would need to be parsed from options.status and the next argument
        console.log(chalk.red('Status update requires both command ID and new status'));
        console.log(chalk.gray('Usage: --status <command-id> <new-status>'));

      } else if (options.policy) {
        console.log(chalk.cyan('📋 Current Cleanup Policy:'));
        console.log(chalk.gray('Policy file: .odoo-dev/cleanup-policy.yaml'));
        // Show policy summary or load and display the policy

      } else if (options.policyEdit) {
        console.log(chalk.blue('📝 Edit cleanup policy:'));
        console.log(chalk.gray('Please edit: .odoo-dev/cleanup-policy.yaml'));
        console.log(chalk.gray('After editing, run: odoo-cleanup --policy to verify'));

      } else {
        // Interactive menu
        const action = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Select cleanup action:',
            choices: [
              { name: 'Run automatic cleanup', value: 'cleanup' },
              { name: 'Show command statistics', value: 'stats' },
              { name: 'List all commands', value: 'list' },
              { name: 'Search commands', value: 'search' },
              { name: 'View cleanup policy', value: 'policy' },
              { name: 'Exit', value: 'exit' }
            ]
          }
        ]);

        switch (action.action) {
          case 'cleanup':
            const report = await lifecycleManager.cleanupExpiredCommands();
            console.log(chalk.green(`✅ Cleanup completed: ${report.archived} archived, ${report.deleted} deleted`));
            break;
          case 'stats':
            const stats = lifecycleManager.getCommandStats();
            console.log(chalk.cyan(`📊 Total commands: ${stats.total}`));
            break;
          case 'list':
            const commands = lifecycleManager.searchCommands({});
            console.log(chalk.cyan(`📋 Found ${commands.length} commands`));
            break;
          case 'search':
            const searchTerm = await inquirer.prompt([{
              type: 'input',
              name: 'term',
              message: 'Enter search term:'
            }]);
            const results = lifecycleManager.searchCommands({ name: searchTerm.term });
            console.log(chalk.cyan(`🔍 Found ${results.length} matching commands`));
            break;
          case 'policy':
            console.log(chalk.blue('📋 Cleanup policy location: .odoo-dev/cleanup-policy.yaml'));
            break;
          default:
            console.log(chalk.gray('Exiting...'));
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Command lifecycle management failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
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