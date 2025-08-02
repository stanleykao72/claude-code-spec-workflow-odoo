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

    // Delete existing default commands (but preserve task command folders)
    const commandsEntries = await fs.readdir(this.commandsDir, { withFileTypes: true });
    
    for (const entry of commandsEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const commandPath = join(this.commandsDir, entry.name);
        await fs.unlink(commandPath);
      }
      // Preserve directories (which contain task commands for specific specs)
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

    // Delete existing templates
    try {
      const templateEntries = await fs.readdir(this.templatesDir);
      for (const entry of templateEntries) {
        if (entry.endsWith('.md')) {
          const templatePath = join(this.templatesDir, entry);
          await fs.unlink(templatePath);
        }
      }
    } catch {
      // Templates directory might not exist, continue
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

    // Delete existing agents
    try {
      const agentEntries = await fs.readdir(this.agentsDir);
      for (const entry of agentEntries) {
        if (entry.endsWith('.md')) {
          const agentPath = join(this.agentsDir, entry);
          await fs.unlink(agentPath);
        }
      }
    } catch {
      // Agents directory might not exist, continue
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
          console.log(`  ${specName}: No tasks found in tasks.md, skipping`);
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