#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { DashboardServer } from './server';
import { MultiProjectDashboardServer } from './multi-server';
import { existsSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('claude-spec-dashboard')
  .description('Launch a real-time dashboard for Claude Code Spec Workflow')
  .version('1.3.0');

program
  .option('-p, --port <port>', 'Port to run the dashboard on', '3000')
  .option('-d, --dir <path>', 'Project directory containing .claude', process.cwd())
  .option('-o, --open', 'Open dashboard in browser automatically')
  .option('-m, --multi', 'Launch multi-project dashboard')
  .action(async (options) => {
    if (options.multi) {
      console.log(chalk.cyan.bold('🚀 Claude Code Multi-Project Dashboard'));
      console.log(chalk.gray('Monitoring all Claude projects on your system'));
      console.log();

      const spinner = ora('Discovering Claude projects...').start();

      try {
        const server = new MultiProjectDashboardServer({
          port: parseInt(options.port),
          autoOpen: options.open,
        });

        await server.start();

        spinner.succeed(
          chalk.green(`Multi-project dashboard running at http://localhost:${options.port}`)
        );
        console.log();
        console.log(chalk.gray('Press Ctrl+C to stop the server'));
        console.log();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n\nShutting down dashboard...'));

          const forceExitTimeout = setTimeout(() => {
            console.log(chalk.red('Force exiting...'));
            process.exit(1);
          }, 5000);

          try {
            await server.stop();
            clearTimeout(forceExitTimeout);
            process.exit(0);
          } catch (error) {
            console.error(chalk.red('Error during shutdown:'), error);
            process.exit(1);
          }
        });
      } catch (error) {
        spinner.fail('Failed to start multi-project dashboard');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    } else {
      console.log(chalk.cyan.bold('🚀 Claude Code Spec Dashboard'));
      console.log(chalk.gray('Real-time spec and task monitoring'));
      console.log();

      const projectPath = options.dir;
      const claudePath = join(projectPath, '.claude');

      // Check if .claude directory exists
      if (!existsSync(claudePath)) {
        console.error(chalk.red('❌ Error: .claude directory not found'));
        console.log(
          chalk.yellow('Make sure you are in a project with Claude Code Spec Workflow installed')
        );
        console.log(chalk.gray('Run: npx @pimzino/claude-code-spec-workflow'));
        process.exit(1);
      }

      const spinner = ora('Starting dashboard server...').start();

      try {
        const server = new DashboardServer({
          port: parseInt(options.port),
          projectPath,
          autoOpen: options.open,
        });

        await server.start();

        spinner.succeed(chalk.green(`Dashboard running at http://localhost:${options.port}`));
        console.log();
        console.log(chalk.gray('Press Ctrl+C to stop the server'));
        console.log();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log(chalk.yellow('\n\nShutting down dashboard...'));

          // Set a timeout to force exit if graceful shutdown hangs
          const forceExitTimeout = setTimeout(() => {
            console.log(chalk.red('Force exiting...'));
            process.exit(1);
          }, 5000); // 5 second timeout

          try {
            await server.stop();
            clearTimeout(forceExitTimeout);
            process.exit(0);
          } catch (error) {
            console.error(chalk.red('Error during shutdown:'), error);
            process.exit(1);
          }
        });
      } catch (error) {
        spinner.fail('Failed to start dashboard');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  });

program.parse();
