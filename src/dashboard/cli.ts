#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { MultiProjectDashboardServer } from './multi-server';
import { TunnelProviderError } from './tunnel';

const program = new Command();

program
  .name('claude-spec-dashboard')
  .description('Launch a real-time dashboard for Claude Code Spec Workflow')
  .version('1.3.0');

program
  .option('-p, --port <port>', 'Port to run the dashboard on', '8247')
  .option('-o, --open', 'Open dashboard in browser automatically')
  .option('-t, --tunnel', 'Create a secure tunnel to share the dashboard')
  .option('--tunnel-password <password>', 'Password-protect the tunnel')
  .option('--tunnel-provider <provider>', 'Tunnel provider to use (cloudflare, ngrok, auto)', 'ngrok')
  .option('--ngrok', 'Create a secure tunnel using Ngrok (alias for --tunnel --tunnel-provider ngrok)')
  .option('--cloudflare', 'Create a secure tunnel using Cloudflare (alias for --tunnel --tunnel-provider cloudflare)')
  .action(async (options) => {
    // Handle alias options
    if (options.ngrok) {
      options.tunnel = true;
      options.tunnelProvider = 'ngrok';
    }
    if (options.cloudflare) {
      options.tunnel = true;
      options.tunnelProvider = 'cloudflare';
    }

    console.log(chalk.cyan.bold('🚀 Claude Code Spec Dashboard'));
    console.log(chalk.gray('Real-time spec and task monitoring'));
    console.log();

    const spinner = ora(options.tunnel ? 'Starting dashboard server and creating tunnel...' : 'Starting dashboard server...').start();

    try {
      const server = new MultiProjectDashboardServer({
        port: parseInt(options.port),
        autoOpen: options.open,
        tunnel: options.tunnel,
        tunnelPassword: options.tunnelPassword,
        tunnelProvider: options.tunnelProvider,
      });

      await server.start();

      // Check if tunnel was created
      const tunnelStatus = server.getTunnelStatus();
      
      if (tunnelStatus.active && tunnelStatus.info) {
        spinner.succeed(
          chalk.green(`Dashboard running at http://localhost:${options.port}`)
        );
        console.log();
        console.log(chalk.cyan.bold('╔════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║ 🔗 Tunnel Active                           ║'));
        console.log(chalk.cyan.bold('╚════════════════════════════════════════════╝'));
        console.log();
        console.log(chalk.white.bold('Share this URL:'));
        console.log(chalk.green.bold(tunnelStatus.info.url));
        console.log(chalk.gray('(Copy the URL above to share)'));
        console.log();
        
        if (tunnelStatus.info.passwordProtected) {
          console.log(chalk.yellow('Password: ') + chalk.yellow.bold(options.tunnelPassword));
          console.log();
        }
        
        console.log(chalk.gray('Provider: ') + tunnelStatus.info.provider);
        console.log(chalk.gray('Local dashboard: ') + `http://localhost:${options.port}`);
        console.log();
        console.log(chalk.gray('Press Ctrl+C to stop'));
        console.log();
      } else {
        spinner.succeed(
          chalk.green(`Dashboard running at http://localhost:${options.port}`)
        );
        console.log();
        console.log(chalk.gray('Press Ctrl+C to stop the server'));
        console.log();
      }

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
      spinner.fail('Failed to start dashboard');
      
      // Enhanced error handling for tunnel errors
      if (error instanceof TunnelProviderError) {
        console.log();
        console.error(chalk.red.bold('❌ Tunnel Error'));
        console.log(chalk.red(error.getUserFriendlyMessage()));
      } else {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      }
      
      process.exit(1);
    }
  });

program.parse(process.argv);