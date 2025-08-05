#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { getCachedFileContent, cachedFileExists } from './file-cache';

export async function getSpecContext(specName: string, projectPath?: string): Promise<void> {
  try {
    // Use provided project path or current working directory
    const workingDir = projectPath || process.cwd();

    // Path to spec directory
    const specDir = path.join(workingDir, '.claude', 'specs', specName);

    // Check if spec directory exists
    if (!cachedFileExists(specDir)) {
      console.log(`## Specification Context\n\nNo specification found for: ${specName}`);
      return;
    }

    const specFiles = [
      { name: 'requirements.md', title: 'Requirements' },
      { name: 'design.md', title: 'Design' },
      { name: 'tasks.md', title: 'Tasks' }
    ];

    const sections: string[] = [];
    let hasContent = false;

    for (const file of specFiles) {
      const filePath = path.join(specDir, file.name);

      if (cachedFileExists(filePath)) {
        const content = getCachedFileContent(filePath);
        if (content && content.trim()) {
          sections.push(`### ${file.title}\n${content.trim()}`);
          hasContent = true;
        }
      }
    }

    if (!hasContent) {
      console.log(`## Specification Context\n\nNo specification documents found for: ${specName}`);
      return;
    }

    // Output formatted spec context
    console.log(`## Specification Context (Pre-loaded): ${specName}`);
    console.log('\n' + sections.join('\n\n---\n\n'));
    console.log('\n**Note**: Specification documents have been pre-loaded. Do not use get-content to fetch them again.');

  } catch (error) {
    console.error(chalk.red('Error loading specification context:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(chalk.red('Error: Please provide a spec name'));
    console.log(chalk.gray('Usage: get-spec-context <spec-name> [project-path]'));
    process.exit(1);
  }

  const specName = args[0];
  const projectPath = args[1]; // Optional project path argument

  getSpecContext(specName, projectPath);
}