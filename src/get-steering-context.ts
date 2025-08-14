#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { getCachedFileContent, cachedFileExists } from './file-cache';

export async function getSteeringContext(projectPath?: string): Promise<void> {
  try {
    // Use provided project path or current working directory
    const workingDir = projectPath || process.cwd();

    // Path to steering directory
    const steeringDir = path.join(workingDir, '.claude', 'steering');

    // Check if steering directory exists
    if (!cachedFileExists(steeringDir)) {
      console.log('## Steering Documents Context\n\nNo steering documents found.');
      return;
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
      console.log('## Steering Documents Context\n\nNo steering documents found or all are empty.');
      return;
    }

    // Output formatted steering context
    console.log('## Steering Documents Context (Pre-loaded)');
    console.log('\n' + sections.join('\n\n---\n\n'));
    console.log('\n**Note**: Steering documents have been pre-loaded. Do not use get-content to fetch them again.');

  } catch (error) {
    console.error(chalk.red('Error loading steering context:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectPath = args[0]; // Optional project path argument

  getSteeringContext(projectPath);
}