import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SpecWorkflowSetup } from '../src/setup';

describe('SpecWorkflowSetup', () => {
  let tempDir: string;
  let setup: SpecWorkflowSetup;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'claude-spec-test-'));
    setup = new SpecWorkflowSetup(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should create directory structure', async () => {
    await setup.setupDirectories();

    const claudeDir = join(tempDir, '.claude');
    const commandsDir = join(claudeDir, 'commands');
    const specsDir = join(claudeDir, 'specs');
    const templatesDir = join(claudeDir, 'templates');
    const steeringDir = join(claudeDir, 'steering');

    await expect(fs.access(claudeDir)).resolves.not.toThrow();
    await expect(fs.access(commandsDir)).resolves.not.toThrow();
    await expect(fs.access(specsDir)).resolves.not.toThrow();
    await expect(fs.access(templatesDir)).resolves.not.toThrow();
    await expect(fs.access(steeringDir)).resolves.not.toThrow();
  });

  test('should detect existing claude directory', async () => {
    expect(await setup.claudeDirectoryExists()).toBe(false);

    await setup.setupDirectories();

    expect(await setup.claudeDirectoryExists()).toBe(true);
  });

  test('should create slash commands', async () => {
    await setup.setupDirectories();
    await setup.createSlashCommands();

    const commandsDir = join(tempDir, '.claude', 'commands');
    const expectedCommands = [
      'spec-create.md',
      'spec-requirements.md',
      'spec-design.md',
      'spec-tasks.md',
      'spec-execute.md',
      'spec-status.md',
      'spec-list.md',
      'spec-steering-setup.md'
    ];

    for (const command of expectedCommands) {
      const commandPath = join(commandsDir, command);
      await expect(fs.access(commandPath)).resolves.not.toThrow();

      const content = await fs.readFile(commandPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('# Spec');
    }
  });

  test('should create templates', async () => {
    await setup.setupDirectories();
    await setup.createTemplates();

    const templatesDir = join(tempDir, '.claude', 'templates');
    const expectedTemplates = [
      'requirements-template.md',
      'design-template.md',
      'tasks-template.md'
    ];

    for (const template of expectedTemplates) {
      const templatePath = join(templatesDir, template);
      await expect(fs.access(templatePath)).resolves.not.toThrow();

      const content = await fs.readFile(templatePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  // NOTE: Scripts test removed in v1.2.5 - task command generation now uses NPX command

  test('should create config file', async () => {
    await setup.setupDirectories();
    await setup.createConfigFile();

    const configPath = join(tempDir, '.claude', 'spec-config.json');
    await expect(fs.access(configPath)).resolves.not.toThrow();

    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config).toHaveProperty('spec_workflow');
    expect(config.spec_workflow).toHaveProperty('version');
    expect(config.spec_workflow).toHaveProperty('auto_create_directories');
  });

  test('should create CLAUDE.md', async () => {
    await setup.setupDirectories();
    await setup.createClaudeMd();

    const claudeMdPath = join(tempDir, 'CLAUDE.md');
    await expect(fs.access(claudeMdPath)).resolves.not.toThrow();

    const content = await fs.readFile(claudeMdPath, 'utf-8');
    expect(content).toContain('# Spec Workflow');
    expect(content).toContain('/spec-create');
    expect(content).toContain('/spec-steering-setup');
    expect(content).toContain('Requirements → Design → Tasks → Implementation');
    expect(content).toContain('Steering Documents');
    expect(content).toContain('product.md');
    expect(content).toContain('tech.md');
    expect(content).toContain('structure.md');
  });

  test('should run complete setup', async () => {
    await setup.runSetup();

    // Check that all components were created
    const claudeDir = join(tempDir, '.claude');
    const commandsDir = join(claudeDir, 'commands');
    const templatesDir = join(claudeDir, 'templates');
    const configPath = join(claudeDir, 'spec-config.json');
    const claudeMdPath = join(tempDir, 'CLAUDE.md');

    await expect(fs.access(claudeDir)).resolves.not.toThrow();
    await expect(fs.access(commandsDir)).resolves.not.toThrow();
    await expect(fs.access(templatesDir)).resolves.not.toThrow();
    await expect(fs.access(configPath)).resolves.not.toThrow();
    await expect(fs.access(claudeMdPath)).resolves.not.toThrow();

    // Check that files have content
    const claudeMdContent = await fs.readFile(claudeMdPath, 'utf-8');
    expect(claudeMdContent.length).toBeGreaterThan(1000);
  });

  test('should handle existing CLAUDE.md', async () => {
    // Create existing CLAUDE.md with content
    const existingContent = '# My Project\n\nThis is my existing project documentation.\n';
    await fs.writeFile(join(tempDir, 'CLAUDE.md'), existingContent);

    await setup.setupDirectories();
    await setup.createClaudeMd();

    const claudeMdContent = await fs.readFile(join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMdContent).toContain('# My Project');
    expect(claudeMdContent).toContain('# Spec Workflow');
    expect(claudeMdContent).toContain('existing project documentation');
  });
});