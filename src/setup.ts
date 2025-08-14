import { promises as fs } from 'fs';
import { join } from 'path';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';
// CLAUDE.md generation removed - all workflow instructions now in individual commands
// Script imports removed in v1.2.5 - task command generation now uses NPX command

/**
 * Main class that orchestrates the entire spec workflow setup process.
 * Creates directory structure, commands, templates, and configuration files.
 * 
 * @example
 * ```typescript
 * const setup = new SpecWorkflowSetup('/my/project');
 * await setup.setupWorkflow();
 * ```
 */
export class SpecWorkflowSetup {
  private projectRoot: string;
  private claudeDir: string;
  private commandsDir: string;
  private specsDir: string;
  private templatesDir: string;
  // scriptsDir removed in v1.2.5 - no longer creating scripts
  private steeringDir: string;
  private bugsDir: string;
  private agentsDir: string;
  
  // Source markdown directories
  private markdownDir: string;
  private markdownCommandsDir: string;
  private markdownTemplatesDir: string;
  private markdownAgentsDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.commandsDir = join(this.claudeDir, 'commands');
    this.specsDir = join(this.claudeDir, 'specs');
    this.templatesDir = join(this.claudeDir, 'templates');
    // scriptsDir initialization removed in v1.2.5
    this.steeringDir = join(this.claudeDir, 'steering');
    this.bugsDir = join(this.claudeDir, 'bugs');
    this.agentsDir = join(this.claudeDir, 'agents');
    // Agents are now mandatory - no longer configurable
    
    // Initialize source markdown directories
    this.markdownDir = join(__dirname, 'markdown');
    this.markdownCommandsDir = join(this.markdownDir, 'commands');
    this.markdownTemplatesDir = join(this.markdownDir, 'templates');
    this.markdownAgentsDir = join(this.markdownDir, 'agents');
  }

  async claudeDirectoryExists(): Promise<boolean> {
    try {
      await fs.access(this.claudeDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the installation is complete by verifying all required files and directories exist
   * This prevents treating incomplete installations as complete ones
   */
  async isInstallationComplete(): Promise<boolean> {
    try {
      // First check if .claude directory exists
      if (!await this.claudeDirectoryExists()) {
        return false;
      }

      // Check all required directories
      const requiredDirectories = [
        this.commandsDir,
        this.specsDir,
        this.templatesDir,
        this.steeringDir,
        this.bugsDir
      ];

      // Agents are now mandatory
      requiredDirectories.push(this.agentsDir);

      for (const dir of requiredDirectories) {
        try {
          await fs.access(dir);
        } catch {
          return false;
        }
      }

      // Check all required command files
      const requiredCommands = [
        'spec-create.md',
        'spec-execute.md',
        'spec-status.md',
        'spec-list.md',
        'spec-steering-setup.md',
        'bug-create.md',
        'bug-analyze.md',
        'bug-fix.md',
        'bug-verify.md',
        'bug-status.md'
      ];

      for (const commandFile of requiredCommands) {
        try {
          await fs.access(join(this.commandsDir, commandFile));
        } catch {
          return false;
        }
      }

      // Check all required template files
      const requiredTemplates = [
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

      for (const templateFile of requiredTemplates) {
        try {
          await fs.access(join(this.templatesDir, templateFile));
        } catch {
          return false;
        }
      }

      // Check required agent files (agents are now mandatory)
      const requiredAgents = [
        'spec-requirements-validator.md',
        'spec-design-validator.md',
        'spec-task-validator.md',
        'spec-task-executor.md',
      ];

      for (const agentFile of requiredAgents) {
        try {
          await fs.access(join(this.agentsDir, agentFile));
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  async setupDirectories(): Promise<void> {
    const directories = [
      this.claudeDir,
      this.commandsDir,
      this.specsDir,
      this.templatesDir,
      // scriptsDir removed from directory creation
      this.steeringDir,
      this.bugsDir
    ];

    // Agents are now mandatory
    directories.push(this.agentsDir);

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createSlashCommands(): Promise<void> {
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

    for (const commandName of commandNames) {
      const sourceFile = join(this.markdownCommandsDir, `${commandName}.md`);
      const destFile = join(this.commandsDir, `${commandName}.md`);

      try {
        // Delete existing file if it exists to ensure clean replacement
        try {
          await fs.unlink(destFile);
        } catch {
          // File might not exist, which is fine
        }

        const commandContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, commandContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to copy command ${commandName}:`, error);
        throw error;
      }
    }
  }

  async createTemplates(): Promise<void> {
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

    for (const templateName of templateNames) {
      const sourceFile = join(this.markdownTemplatesDir, templateName);
      const destFile = join(this.templatesDir, templateName);

      try {
        // Delete existing file if it exists to ensure clean replacement
        try {
          await fs.unlink(destFile);
        } catch {
          // File might not exist, which is fine
        }

        const templateContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, templateContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to copy template ${templateName}:`, error);
        throw error;
      }
    }
  }

  // NOTE: Script creation removed in v1.2.5 - task command generation now uses NPX command

  async setupAgents(): Promise<void> {
    // Agents are now mandatory - always create them
    const agentFiles = [
      'spec-requirements-validator.md',
      'spec-design-validator.md',
      'spec-task-validator.md',
      'spec-task-executor.md',
    ];

    for (const agentFile of agentFiles) {
      const sourceFile = join(this.markdownAgentsDir, agentFile);
      const destFile = join(this.agentsDir, agentFile);

      try {
        // Delete existing file if it exists to ensure clean replacement
        try {
          await fs.unlink(destFile);
        } catch {
          // File might not exist, which is fine
        }

        const agentContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, agentContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to copy agent ${agentFile}:`, error);
        throw error;
      }
    }
  }



  // CLAUDE.md creation removed - all workflow instructions now in individual commands

  /**
   * Auto-generate task commands for all existing specs
   */
  async autoGenerateTaskCommands(): Promise<void> {
    try {
      // Check if specs directory exists
      await fs.access(this.specsDir);
    } catch {
      // No specs directory, nothing to generate
      return;
    }

    try {
      const specsEntries = await fs.readdir(this.specsDir, { withFileTypes: true });
      const specDirs = specsEntries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      if (specDirs.length === 0) {
        return;
      }

      console.log(`Auto-generating task commands for ${specDirs.length} existing spec(s)...`);

      for (const specName of specDirs) {
        const tasksFile = join(this.specsDir, specName, 'tasks.md');
        const commandsSpecDir = join(this.commandsDir, specName);

        try {
          // Check if tasks.md exists
          await fs.access(tasksFile);

          // Read tasks.md
          const tasksContent = await fs.readFile(tasksFile, 'utf8');

          // Parse tasks and generate commands
          const tasks = parseTasksFromMarkdown(tasksContent);

          if (tasks.length === 0) {
            continue;
          }

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

          console.log(`  Generated ${tasks.length} task commands for spec: ${specName}`);

        } catch {
          // tasks.md doesn't exist for this spec, skip
          continue;
        }
      }
    } catch {
      // Error reading specs directory, skip
      return;
    }
  }

  async runSetup(): Promise<void> {
    await this.setupDirectories();
    await this.createSlashCommands();
    await this.createTemplates();
    await this.setupAgents();
    // Script creation removed in v1.2.5 - using NPX command instead
    // spec-config.json creation removed - not required
    // CLAUDE.md creation removed - all workflow instructions now in individual commands

    // Auto-generate task commands for existing specs
    await this.autoGenerateTaskCommands();
  }
}