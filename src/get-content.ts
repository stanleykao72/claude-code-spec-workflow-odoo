#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { getCachedFileContent } from './file-cache';

export async function getFileContent(filePath: string): Promise<void> {
  try {
    // Use shared caching utility
    const content = getCachedFileContent(filePath);

    if (content === null) {
      console.error(chalk.red(`Error: File not found: ${path.resolve(filePath)}`));
      process.exit(1);
    }

    console.log(content);

  } catch (error) {
    console.error(chalk.red('Error reading file:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(chalk.red('Error: Please provide a file path'));
    console.log(chalk.gray('Usage: get-content <file-path>'));
    process.exit(1);
  }
  
  const filePath = args[0];
  getFileContent(filePath);
}