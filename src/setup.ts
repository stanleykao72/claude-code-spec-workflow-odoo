import { promises as fs } from 'fs';
import { join } from 'path';
import {
  getSpecCreateCommand,
  getSpecRequirementsCommand,
  getSpecDesignCommand,
  getSpecTasksCommand,
  getSpecExecuteCommand,
  getSpecStatusCommand,
  getSpecListCommand,
  getSpecSteeringSetupCommand
} from './commands';
import {
  getRequirementsTemplate,
  getDesignTemplate,
  getTasksTemplate
} from './templates';
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

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.commandsDir = join(this.claudeDir, 'commands');
    this.specsDir = join(this.claudeDir, 'specs');
    this.templatesDir = join(this.claudeDir, 'templates');
    // scriptsDir initialization removed in v1.2.5
    this.steeringDir = join(this.claudeDir, 'steering');
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
      this.steeringDir
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createSlashCommands(): Promise<void> {
    const commands = {
      'spec-create': getSpecCreateCommand(),
      'spec-requirements': getSpecRequirementsCommand(),
      'spec-design': getSpecDesignCommand(),
      'spec-tasks': getSpecTasksCommand(),
      'spec-execute': getSpecExecuteCommand(),
      'spec-status': getSpecStatusCommand(),
      'spec-list': getSpecListCommand(),
      'spec-steering-setup': getSpecSteeringSetupCommand()
    };

    for (const [commandName, commandContent] of Object.entries(commands)) {
      const commandFile = join(this.commandsDir, `${commandName}.md`);
      await fs.writeFile(commandFile, commandContent, 'utf-8');
    }
  }

  async createTemplates(): Promise<void> {
    const templates = {
      'requirements-template.md': getRequirementsTemplate(),
      'design-template.md': getDesignTemplate(),
      'tasks-template.md': getTasksTemplate()
    };

    for (const [templateName, templateContent] of Object.entries(templates)) {
      const templateFile = join(this.templatesDir, templateName);
      await fs.writeFile(templateFile, templateContent, 'utf-8');
    }
  }

  // NOTE: Script creation removed in v1.2.5 - task command generation now uses NPX command

  async createConfigFile(): Promise<void> {
    const config = {
      spec_workflow: {
        version: '1.0.0',
        auto_create_directories: true,
        auto_reference_requirements: true,
        enforce_approval_workflow: true,
        default_feature_prefix: 'feature-',
        supported_formats: ['markdown', 'mermaid']
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
    // Script creation removed in v1.2.5 - using NPX command instead
    await this.createConfigFile();
    // CLAUDE.md creation removed - all workflow instructions now in individual commands
  }
}