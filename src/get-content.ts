#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function getFileContent(filePath: string): Promise<void> {
  try {
    // Normalize the path for cross-platform compatibility
    const normalizedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!existsSync(normalizedPath)) {
      console.error(chalk.red(`Error: File not found: ${normalizedPath}`));
      process.exit(1);
    }
    
    // Read and print file contents
    const content = readFileSync(normalizedPath, 'utf-8');
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