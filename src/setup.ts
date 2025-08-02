import { promises as fs } from 'fs';
import { join } from 'path';
// CLAUDE.md generation removed - all workflow instructions now in individual commands
// Script imports removed in v1.2.5 - task command generation now uses NPX command

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
  private createAgents: boolean;
  public _updateChoices?: { updateItems: string[] };
  
  // Source markdown directories
  private markdownDir: string;
  private markdownCommandsDir: string;
  private markdownTemplatesDir: string;
  private markdownAgentsDir: string;

  constructor(projectRoot: string = process.cwd(), enableAgents: boolean = false) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.commandsDir = join(this.claudeDir, 'commands');
    this.specsDir = join(this.claudeDir, 'specs');
    this.templatesDir = join(this.claudeDir, 'templates');
    // scriptsDir initialization removed in v1.2.5
    this.steeringDir = join(this.claudeDir, 'steering');
    this.bugsDir = join(this.claudeDir, 'bugs');
    this.agentsDir = join(this.claudeDir, 'agents');
    this.createAgents = enableAgents;
    
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

    // Only create agents directory if agents are enabled
    if (this.createAgents) {
      directories.push(this.agentsDir);
    }

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createSlashCommands(): Promise<void> {
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

    for (const commandName of commandNames) {
      const sourceFile = join(this.markdownCommandsDir, `${commandName}.md`);
      const destFile = join(this.commandsDir, `${commandName}.md`);
      
      try {
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
    // Only create agents if enabled
    if (!this.createAgents) {
      return;
    }

    // List of available agent files (all 15 agents now extracted to markdown)
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

    for (const agentFile of agentFiles) {
      const sourceFile = join(this.markdownAgentsDir, agentFile);
      const destFile = join(this.agentsDir, agentFile);
      
      try {
        const agentContent = await fs.readFile(sourceFile, 'utf-8');
        await fs.writeFile(destFile, agentContent, 'utf-8');
      } catch (error) {
        console.error(`Failed to copy agent ${agentFile}:`, error);
        throw error;
      }
    }
  }

  async createConfigFile(): Promise<void> {
    const config = {
      spec_workflow: {
        version: '1.0.0',
        auto_create_directories: true,
        auto_reference_requirements: true,
        enforce_approval_workflow: true,
        default_feature_prefix: 'feature-',
        supported_formats: ['markdown', 'mermaid'],
        agents_enabled: this.createAgents
      }
    };

    const configFile = join(this.claudeDir, 'spec-config.json');
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8');
  }

  // CLAUDE.md creation removed - all workflow instructions now in individual commands

  async runSetup(): Promise<void> {
    await this.setupDirectories();
    await this.createSlashCommands();
    await this.createTemplates();
    await this.setupAgents();
    // Script creation removed in v1.2.5 - using NPX command instead
    await this.createConfigFile();
    // CLAUDE.md creation removed - all workflow instructions now in individual commands
  }
}