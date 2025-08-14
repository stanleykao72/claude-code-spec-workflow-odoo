/**
 * Automatic update functionality
 * Checks for newer versions and auto-updates the package
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

interface PackageInfo {
  version: string;
  name: string;
}

/**
 * Get the current package version
 */
export function getCurrentVersion(): string {
  try {
    const packageJson = require('../package.json');
    return packageJson.version;
  } catch {
    return '1.5.5'; // Fallback version
  }
}

/**
 * Get the latest version from npm registry
 */
export async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`);
    return stdout.trim();
  } catch (error) {
    console.error(chalk.gray('Could not check for updates:', error instanceof Error ? error.message : error));
    return null;
  }
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Check if an update is available
 */
export async function checkForUpdate(packageName: string): Promise<{ hasUpdate: boolean; currentVersion: string; latestVersion: string | null }> {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion(packageName);
  
  if (!latestVersion) {
    return { hasUpdate: false, currentVersion, latestVersion };
  }
  
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
  return { hasUpdate, currentVersion, latestVersion };
}

/**
 * Perform automatic update
 */
export async function performAutoUpdate(packageName: string): Promise<boolean> {
  const spinner = ora('Updating to latest version...').start();
  
  try {
    // Try global update first
    await execAsync(`npm install -g ${packageName}`, { timeout: 60000 });
    spinner.succeed(chalk.green('Successfully updated to latest version!'));
    return true;
  } catch (error) {
    spinner.fail(chalk.red('Auto-update failed'));
    console.error(chalk.gray('Update error:', error instanceof Error ? error.message : error));
    console.log(chalk.yellow('Please update manually: npm install -g @pimzino/claude-code-spec-workflow'));
    return false;
  }
}

/**
 * Main auto-update function
 * Checks for updates and auto-updates if available
 */
export async function autoUpdate(packageName: string = '@pimzino/claude-code-spec-workflow'): Promise<boolean> {
  try {
    const updateInfo = await checkForUpdate(packageName);
    
    if (!updateInfo.hasUpdate) {
      // No update needed
      return true;
    }
    
    console.log(chalk.cyan(`📦 Update available: ${updateInfo.currentVersion} → ${updateInfo.latestVersion}`));
    console.log(chalk.gray('Auto-updating...'));
    console.log();
    
    const success = await performAutoUpdate(packageName);
    
    if (success) {
      console.log(chalk.green('✅ Update complete! Continuing with setup...'));
      console.log();
      return true;
    } else {
      console.log(chalk.yellow('⚠️  Update failed, but continuing with current version...'));
      console.log();
      return false;
    }
    
  } catch (error) {
    console.error(chalk.gray('Auto-update check failed:', error instanceof Error ? error.message : error));
    console.log(chalk.gray('Continuing with current version...'));
    console.log();
    return false;
  }
}
