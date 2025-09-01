#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import { getCachedFileContent, cachedFileExists } from './file-cache';

export async function getTemplateContext(templateType?: string, projectPath?: string): Promise<void> {
  try {
    // Use provided project path or current working directory
    const workingDir = projectPath || process.cwd();

    // Path to templates directory
    const templatesDir = path.join(workingDir, '.claude', 'templates');
    const odooTemplatesDir = path.join(workingDir, '.odoo-dev', 'templates');

    // Check if templates directory exists
    const hasClaudeTemplates = cachedFileExists(templatesDir);
    const hasOdooTemplates = cachedFileExists(odooTemplatesDir);
    
    if (!hasClaudeTemplates && !hasOdooTemplates) {
      console.log('## Template Context\n\nNo templates directory found.');
      return;
    }

    // Define template categories
    const templateCategories = {
      'spec': [
        { name: 'requirements-template.md', title: 'Requirements Template' },
        { name: 'design-template.md', title: 'Design Template' },
        { name: 'tasks-template.md', title: 'Tasks Template' }
      ],
      'steering': [
        { name: 'product-template.md', title: 'Product Template' },
        { name: 'tech-template.md', title: 'Technology Template' },
        { name: 'structure-template.md', title: 'Structure Template' }
      ],
      'bug': [
        { name: 'bug-report-template.md', title: 'Bug Report Template' },
        { name: 'bug-analysis-template.md', title: 'Bug Analysis Template' },
        { name: 'bug-verification-template.md', title: 'Bug Verification Template' }
      ],
      'odoo': [
        { name: 'odoo-requirements-template.md', title: 'Odoo Requirements Template' },
        { name: 'odoo-design-template.md', title: 'Odoo Design Template' },
        { name: 'odoo-tasks-template.md', title: 'Odoo Tasks Template' },
        { name: 'odoo-product-template.md', title: 'Odoo Product Template' }
      ],
      'all': [] as { name: string; title: string; }[] // Will be populated with all templates
    };

    // Populate 'all' category with all templates
    templateCategories.all = [
      ...templateCategories.spec,
      ...templateCategories.steering,
      ...templateCategories.bug,
      ...templateCategories.odoo
    ];

    // Determine which templates to load
    const templatesToLoad = templateType && templateCategories[templateType as keyof typeof templateCategories]
      ? templateCategories[templateType as keyof typeof templateCategories]
      : templateCategories.all;

    const sections: string[] = [];
    let hasContent = false;

    for (const template of templatesToLoad) {
      // All templates are now in .claude/templates/ (including odoo-* templates as of v1.7.4)
      // Check .claude/templates/ first, then fallback to .odoo-dev/templates/ for compatibility
      let filePath = path.join(templatesDir, template.name);
      
      // If not found in .claude/templates/, try .odoo-dev/templates/ for odoo templates
      if (!cachedFileExists(filePath) && template.name.startsWith('odoo-')) {
        filePath = path.join(odooTemplatesDir, template.name);
      }

      if (cachedFileExists(filePath)) {
        const content = getCachedFileContent(filePath);
        if (content && content.trim()) {
          sections.push(`### ${template.title}\n${content.trim()}`);
          hasContent = true;
        }
      }
    }

    if (!hasContent) {
      const typeText = templateType ? ` for type: ${templateType}` : '';
      console.log(`## Template Context\n\nNo templates found${typeText}.`);
      return;
    }

    // Output formatted template context
    const typeText = templateType ? ` (${templateType})` : '';
    console.log(`## Template Context (Pre-loaded)${typeText}`);
    console.log('\n' + sections.join('\n\n---\n\n'));
    console.log('\n**Note**: Templates have been pre-loaded. Do not use get-content to fetch them again.');

  } catch (error) {
    console.error(chalk.red('Error loading template context:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// If this file is run directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse arguments: [template-type] [project-path]
  let templateType: string | undefined;
  let projectPath: string | undefined;

  if (args.length === 1) {
    // Could be either template type or project path
    // If it looks like a path (contains / or \), treat as project path
    if (args[0].includes('/') || args[0].includes('\\')) {
      projectPath = args[0];
    } else {
      templateType = args[0];
    }
  } else if (args.length >= 2) {
    templateType = args[0];
    projectPath = args[1];
  }

  getTemplateContext(templateType, projectPath);
}