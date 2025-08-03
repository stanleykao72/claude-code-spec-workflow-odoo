import { promises as fs } from 'fs';
import { join } from 'path';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';

export class SpecWorkflowUpdater {
  private projectRoot: string;
  private claudeDir: string;
  private commandsDir: string;
  private templatesDir: string;
  private agentsDir: string;
  private specsDir: string;
  
  // Source markdown directories
  private markdownDir: string;
  private markdownCommandsDir: string;
  private markdownTemplatesDir: string;
  private markdownAgentsDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.commandsDir = join(this.claudeDir, 'commands');
    this.templatesDir = join(this.claudeDir, 'templates');
    this.agentsDir = join(this.claudeDir, 'agents');
    this.specsDir = join(this.claudeDir, 'specs');

    // Initialize source markdown directories
    this.markdownDir = join(__dirname, 'markdown');
    this.markdownCommandsDir = join(this.markdownDir, 'commands');
    this.markdownTemplatesDir = join(this.markdownDir, 'templates');
    this.markdownAgentsDir = join(this.markdownDir, 'agents');
  }

  /**
   * Create a backup of the current .claude directory before making changes
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.projectRoot, `.claude.backup-${timestamp}`);

    try {
      // Copy the entire .claude directory to backup location
      await this.copyDirectory(this.claudeDir, backupDir);
      console.log(`Backup created: ${backupDir}`);
      return backupDir;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Backup creation failed. Update cancelled for safety.');
    }
  }

  /**
   * Recursively copy a directory
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * List all backup directories in the project root
   */
  async listBackups(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.projectRoot, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('.claude.backup-'))
        .map(entry => entry.name)
        .sort()
        .reverse(); // Most recent first
    } catch {
      return [];
    }
  }

  /**
   * Clean up old backups, keeping only the most recent N backups
   */
  async cleanupOldBackups(keepCount: number = 5): Promise<void> {
    const backups = await this.listBackups();
    const toDelete = backups.slice(keepCount);

    for (const backup of toDelete) {
      try {
        const backupPath = join(this.projectRoot, backup);
        await fs.rm(backupPath, { recursive: true });
        console.log(`Cleaned up old backup: ${backup}`);
      } catch (error) {
        console.warn(`Failed to clean up backup ${backup}:`, error);
      }
    }
  }

  async updateCommands(): Promise<void> {
    // List of default command files to update (exclude task command folders)
    const commandNames = [
      'spec-create',
      'spec-execute',
      'spec-orchestrate',
      'spec-status',
      'spec-list',
      'spec-completion-review',
      'spec-steering-setup',
      'bug-create',
      'bug-analyze',
      'bug-fix',
      'bug-verify',
      'bug-status'
    ];

    // Only delete known default command files (preserve custom files)
    for (const commandName of commandNames) {
      const commandPath = join(this.commandsDir, `${commandName}.md`);
      try {
        await fs.unlink(commandPath);
      } catch {
        // File might not exist, which is fine
      }
    }

    // Copy new command files
    for (const commandName of commandNames) {
      const sourceFile = join(this.markdownCommandsDir, `${commandName}.md`);
      const destFile = join(this.commandsDir, `${commandName}.md`);
      
      try {
        const commandContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, commandContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to update command ${commandName}:`, error);
        throw error;
      }
    }
  }

  async updateTemplates(): Promise<void> {
    const templateNames = [
      'requirements-template.md',
      'design-template.md',
      'tasks-template.md',
      'product-template.md',
      'tech-template.md',
      'structure-template.md',
      'bug-report-template.md',
      'bug-analysis-template.md',
      'bug-verification-template.md'
    ];

    // Only delete known default template files (preserve custom templates)
    for (const templateName of templateNames) {
      const templatePath = join(this.templatesDir, templateName);
      try {
        await fs.unlink(templatePath);
      } catch {
        // File might not exist, which is fine
      }
    }

    // Ensure templates directory exists
    await fs.mkdir(this.templatesDir, { recursive: true });

    // Copy new template files
    for (const templateName of templateNames) {
      const sourceFile = join(this.markdownTemplatesDir, templateName);
      const destFile = join(this.templatesDir, templateName);
      
      try {
        const templateContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, templateContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to update template ${templateName}:`, error);
        throw error;
      }
    }
  }

  async updateAgents(): Promise<void> {
    // Check if agents are enabled in config
    const configFile = join(this.claudeDir, 'spec-config.json');
    let agentsEnabled = false;
    
    try {
      const configContent = await fs.readFile(configFile, 'utf-8');
      const config = JSON.parse(configContent);
      agentsEnabled = config.spec_workflow?.agents_enabled || false;
    } catch {
      // Config might not exist or be malformed, skip agents update
      return;
    }

    if (!agentsEnabled) {
      // If agents are disabled, remove agents directory if it exists
      try {
        await fs.rm(this.agentsDir, { recursive: true });
      } catch {
        // Directory might not exist, ignore
      }
      return;
    }

    // List of available agent files
    const agentFiles = [
      'spec-requirements-validator.md',
      'spec-design-validator.md', 
      'spec-task-validator.md',
      'spec-task-executor.md',
      'spec-task-implementation-reviewer.md',
      'spec-integration-tester.md',
      'spec-completion-reviewer.md',
      'bug-root-cause-analyzer.md',
      'steering-document-updater.md',
      'spec-dependency-analyzer.md',
      'spec-test-generator.md',
      'spec-documentation-generator.md',
      'spec-performance-analyzer.md',
      'spec-duplication-detector.md',
      'spec-breaking-change-detector.md'
    ];

    // Only delete known default agent files (preserve custom agents)
    for (const agentFile of agentFiles) {
      const agentPath = join(this.agentsDir, agentFile);
      try {
        await fs.unlink(agentPath);
      } catch {
        // File might not exist, which is fine
      }
    }

    // Ensure agents directory exists
    await fs.mkdir(this.agentsDir, { recursive: true });

    // Copy new agent files
    for (const agentFile of agentFiles) {
      const sourceFile = join(this.markdownAgentsDir, agentFile);
      const destFile = join(this.agentsDir, agentFile);
      
      try {
        const agentContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, agentContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to update agent ${agentFile}:`, error);
        throw error;
      }
    }
  }

  async regenerateTaskCommands(): Promise<void> {
    console.log('Scanning for existing specs...');
    
    // Find all existing specs
    let specDirs: string[] = [];
    
    try {
      const specsEntries = await fs.readdir(this.specsDir, { withFileTypes: true });
      specDirs = specsEntries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      if (specDirs.length === 0) {
        console.log('No specs found to regenerate task commands for.');
        return;
      }
      
      console.log(`Found ${specDirs.length} spec(s): ${specDirs.join(', ')}`);
    } catch {
      console.log('No specs directory found, skipping task command regeneration.');
      // Specs directory might not exist
      return;
    }

    // For each spec, regenerate task commands if tasks.md exists
    for (const specName of specDirs) {
      const specDir = join(this.specsDir, specName);
      const tasksFile = join(specDir, 'tasks.md');
      const commandsSpecDir = join(this.commandsDir, specName);
      
      try {
        // Check if tasks.md exists
        await fs.access(tasksFile);
        
        // Read tasks.md
        const tasksContent = await fs.readFile(tasksFile, 'utf8');
        
        // Parse tasks and generate commands
        const tasks = parseTasksFromMarkdown(tasksContent);
        
        if (tasks.length === 0) {
          console.log(`  ${specName}: No tasks found in tasks.md (check format: "- [ ] 1. Task description"), skipping`);
          continue;
        }
        
        console.log(`  ${specName}: Regenerating ${tasks.length} task commands...`);
        
        // Delete existing task commands for this spec
        try {
          await fs.rm(commandsSpecDir, { recursive: true });
        } catch {
          // Directory might not exist
        }
        
        // Create spec commands directory
        await fs.mkdir(commandsSpecDir, { recursive: true });
        
        // Generate commands
        for (const task of tasks) {
          await generateTaskCommand(commandsSpecDir, specName, task);
        }
        
        console.log(`  ${specName}: Generated commands for tasks: ${tasks.map(t => t.id).join(', ')}`);
        
      } catch {
        console.log(`  ${specName}: No tasks.md found, skipping`);
        // tasks.md doesn't exist for this spec, skip
        continue;
      }
    }
    
    console.log('Task command regeneration complete!');
  }
}