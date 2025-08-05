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

  /**
   * Delete the entire .claude directory for a fresh start
   */
  async deleteClaudeDirectory(): Promise<void> {
    try {
      await fs.rm(this.claudeDir, { recursive: true });
      console.log('Deleted existing .claude directory for fresh installation');
    } catch (error) {
      console.error('Failed to delete .claude directory:', error);
      throw new Error('Failed to delete existing .claude directory. Update cancelled for safety.');
    }
  }

  /**
   * Restore user content (specs and task commands) from backup
   */
  async restoreUserContent(backupDir: string): Promise<void> {
    // The backup directory IS the .claude directory (from createBackup method)
    const backupSpecsDir = join(backupDir, 'specs');
    const backupCommandsDir = join(backupDir, 'commands');

    try {
      // Restore specs directory if it exists in backup
      try {
        await fs.access(backupSpecsDir);
        const specEntries = await fs.readdir(backupSpecsDir, { withFileTypes: true });
        const specDirs = specEntries.filter(entry => entry.isDirectory());

        if (specDirs.length > 0) {
          console.log(`Restoring ${specDirs.length} spec(s) from backup...`);
          
          // Ensure specs directory exists
          await fs.mkdir(this.specsDir, { recursive: true });
          
          // Copy each spec directory
          for (const specDir of specDirs) {
            const sourceSpecDir = join(backupSpecsDir, specDir.name);
            const destSpecDir = join(this.specsDir, specDir.name);
            await this.copyDirectory(sourceSpecDir, destSpecDir);
            console.log(`  Restored spec: ${specDir.name}`);
          }
        }
      } catch {
        // No specs directory in backup, that's fine
        console.log('No specs found in backup to restore');
      }

      // Restore task command directories if they exist in backup
      try {
        await fs.access(backupCommandsDir);
        const commandEntries = await fs.readdir(backupCommandsDir, { withFileTypes: true });
        const taskCommandDirs = commandEntries.filter(entry => entry.isDirectory());

        if (taskCommandDirs.length > 0) {
          console.log(`Restoring ${taskCommandDirs.length} task command folder(s) from backup...`);
          
          // Ensure commands directory exists
          await fs.mkdir(this.commandsDir, { recursive: true });
          
          // Copy each task command directory (these are spec-specific)
          for (const taskDir of taskCommandDirs) {
            const sourceTaskDir = join(backupCommandsDir, taskDir.name);
            const destTaskDir = join(this.commandsDir, taskDir.name);
            await this.copyDirectory(sourceTaskDir, destTaskDir);
            console.log(`  Restored task commands: ${taskDir.name}`);
          }
        }
      } catch {
        // No task command directories in backup, that's fine
        console.log('No task command directories found in backup to restore');
      }

      // Restore settings.local.json if it exists in backup
      try {
        const backupSettingsFile = join(backupDir, 'settings.local.json');
        await fs.access(backupSettingsFile);
        
        const destSettingsFile = join(this.claudeDir, 'settings.local.json');
        await fs.copyFile(backupSettingsFile, destSettingsFile);
        console.log('  Restored Claude Code settings (settings.local.json)');
      } catch {
        // No settings.local.json in backup, that's fine
        console.log('No Claude Code settings found in backup to restore');
      }

      console.log('User content restoration complete');
    } catch (error) {
      console.error('Failed to restore user content from backup:', error);
      throw new Error('Failed to restore user content from backup. Please manually recover from backup if needed.');
    }
  }

  async updateCommands(): Promise<void> {
    // List of default command files to update (exclude task command folders)
    const commandNames = [
      'spec-create',
      'spec-execute',
      'spec-status',
      'spec-list',
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
    // Agents are now mandatory - always update them

    // List of available agent files
    const agentFiles = [
      'spec-requirements-validator.md',
      'spec-design-validator.md', 
      'spec-task-validator.md',
      'spec-task-executor.md',
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

  /**
   * Update with fresh install approach: backup -> delete -> fresh install -> restore user content
   */
  async updateWithFreshInstall(): Promise<void> {
    console.log('Starting fresh installation update...');
    
    // 1. Create backup first
    const backupDir = await this.createBackup();
    
    try {
      // 2. Delete existing .claude directory
      await this.deleteClaudeDirectory();
      
      // 3. Run fresh installation (agents are now mandatory)
      const { SpecWorkflowSetup } = await import('./setup');
      const setup = new SpecWorkflowSetup(this.projectRoot);
      await setup.runSetup();
      console.log('Fresh installation complete');
      
      // 4. Restore user content (specs and task commands)
      await this.restoreUserContent(backupDir);

      // 5. Auto-generate task commands for restored specs
      await this.regenerateTaskCommands();

      console.log('Fresh installation update complete!');
      
    } catch (error) {
      console.error('Fresh installation update failed:', error);
      console.log(`Your data is safely backed up in: ${backupDir}`);
      console.log('You can manually restore your specs and task commands from the backup if needed.');
      throw error;
    }
  }
}