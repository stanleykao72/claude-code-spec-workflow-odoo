import { promises as fs } from 'fs';
import { join } from 'path';
import {
  getSpecCreateCommand,
  getSpecExecuteCommand,
  getSpecStatusCommand,
  getSpecListCommand,
  getSpecCompletionReviewCommand,
  getSpecSteeringSetupCommand,
  getBugCreateCommand,
  getBugAnalyzeCommand,
  getBugFixCommand,
  getBugVerifyCommand,
  getBugStatusCommand
} from './commands';
import {
  getRequirementsTemplate,
  getDesignTemplate,
  getTasksTemplate,
  getBugReportTemplate,
  getBugAnalysisTemplate,
  getBugVerificationTemplate
} from './templates';
import {
  taskExecutorAgent,
  requirementsValidatorAgent,
  designValidatorAgent,
  atomicTaskValidatorAgent,
  taskImplementationReviewerAgent,
  specIntegrationTesterAgent,
  specCompletionReviewerAgent,
  bugRootCauseAnalyzerAgent,
  steeringDocumentUpdaterAgent,
  specDependencyAnalyzerAgent,
  testGeneratorAgent,
  documentationGeneratorAgent,
  performanceAnalyzerAgent,
  codeDuplicationDetectorAgent,
  breakingChangeDetectorAgent,
  getAgentDefinitionFileContent
} from './agents';
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
    const commands = {
      'spec-create': getSpecCreateCommand(),
      'spec-execute': getSpecExecuteCommand(),
      'spec-status': getSpecStatusCommand(),
      'spec-list': getSpecListCommand(),
      'spec-completion-review': getSpecCompletionReviewCommand(),
      'spec-steering-setup': getSpecSteeringSetupCommand(),
      'bug-create': getBugCreateCommand(),
      'bug-analyze': getBugAnalyzeCommand(),
      'bug-fix': getBugFixCommand(),
      'bug-verify': getBugVerifyCommand(),
      'bug-status': getBugStatusCommand()
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
      'tasks-template.md': getTasksTemplate(),
      'bug-report-template.md': getBugReportTemplate(),
      'bug-analysis-template.md': getBugAnalysisTemplate(),
      'bug-verification-template.md': getBugVerificationTemplate()
    };

    for (const [templateName, templateContent] of Object.entries(templates)) {
      const templateFile = join(this.templatesDir, templateName);
      await fs.writeFile(templateFile, templateContent, 'utf-8');
    }
  }

  // NOTE: Script creation removed in v1.2.5 - task command generation now uses NPX command

  async setupAgents(): Promise<void> {
    // Only create agents if enabled
    if (!this.createAgents) {
      return;
    }

    // Create all spec workflow agents
    const agents = [
      taskExecutorAgent,
      requirementsValidatorAgent,
      designValidatorAgent,
      atomicTaskValidatorAgent,
      taskImplementationReviewerAgent,
      specIntegrationTesterAgent,
      specCompletionReviewerAgent,
      bugRootCauseAnalyzerAgent,
      steeringDocumentUpdaterAgent,
      specDependencyAnalyzerAgent,
      testGeneratorAgent,
      documentationGeneratorAgent,
      performanceAnalyzerAgent,
      codeDuplicationDetectorAgent,
      breakingChangeDetectorAgent
    ];

    for (const agent of agents) {
      const agentFile = join(this.agentsDir, `${agent.name}.md`);
      const agentContent = getAgentDefinitionFileContent(agent);
      await fs.writeFile(agentFile, agentContent, 'utf-8');
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