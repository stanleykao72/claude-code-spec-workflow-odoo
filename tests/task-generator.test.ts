import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseTasksFromMarkdown, generateTaskCommand, ParsedTask } from '../src/task-generator';

describe('Task Generator', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'task-generator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('parseTasksFromMarkdown', () => {
    test('should parse simple tasks correctly', () => {
      const tasksContent = `# Implementation Plan

## Tasks

- [ ] 1. Set up project structure
  - Create directory structure
  - _Requirements: 1.1_

- [ ] 2. Implement data models
  - Create model classes
  - Add validation
  - _Leverage: existing-validator.ts_
  - _Requirements: 2.1, 2.2_

- [ ] 3. Create API endpoints
  - Set up routing
  - _Requirements: 3.1_
`;

      const tasks = parseTasksFromMarkdown(tasksContent);

      expect(tasks).toHaveLength(3);
      
      // Task 1
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].description).toBe('Set up project structure');
      expect(tasks[0].requirements).toBe('1.1');
      expect(tasks[0].leverage).toBeUndefined();

      // Task 2
      expect(tasks[1].id).toBe('2');
      expect(tasks[1].description).toBe('Implement data models');
      expect(tasks[1].requirements).toBe('2.1, 2.2');
      expect(tasks[1].leverage).toBe('existing-validator.ts');

      // Task 3
      expect(tasks[2].id).toBe('3');
      expect(tasks[2].description).toBe('Create API endpoints');
      expect(tasks[2].requirements).toBe('3.1');
      expect(tasks[2].leverage).toBeUndefined();
    });

    test('should parse hierarchical tasks correctly', () => {
      const tasksContent = `# Implementation Plan

- [ ] 1. Main task
  - Main task details
  - _Requirements: 1.1_

- [ ] 2. Parent task
- [ ] 2.1 Subtask one
  - Subtask details
  - _Leverage: utils/helper.js_
  - _Requirements: 2.1_

- [ ] 2.2 Subtask two
  - Another subtask
  - _Requirements: 2.2_

- [ ] 3. Final task
  - Final details
  - _Requirements: 3.1_
`;

      const tasks = parseTasksFromMarkdown(tasksContent);

      expect(tasks).toHaveLength(5);

      expect(tasks[0].id).toBe('1');
      expect(tasks[0].description).toBe('Main task');

      expect(tasks[1].id).toBe('2');
      expect(tasks[1].description).toBe('Parent task');

      expect(tasks[2].id).toBe('2.1');
      expect(tasks[2].description).toBe('Subtask one');
      expect(tasks[2].leverage).toBe('utils/helper.js');
      expect(tasks[2].requirements).toBe('2.1');

      expect(tasks[3].id).toBe('2.2');
      expect(tasks[3].description).toBe('Subtask two');
      expect(tasks[3].requirements).toBe('2.2');

      expect(tasks[4].id).toBe('3');
      expect(tasks[4].description).toBe('Final task');
    });

    test('should handle tasks with dots in descriptions correctly', () => {
      const tasksContent = `- [ ] 1. Create user.service.ts file
  - Implement UserService class
  - _Requirements: 1.1_

- [ ] 2.1 Add validation to user.model.ts
  - Add validation methods
  - _Requirements: 2.1_
`;

      const tasks = parseTasksFromMarkdown(tasksContent);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].description).toBe('Create user.service.ts file');
      expect(tasks[1].id).toBe('2.1');
      expect(tasks[1].description).toBe('Add validation to user.model.ts');
    });

    test('should handle tasks without optional fields', () => {
      const tasksContent = `- [ ] 1. Simple task
  - Just a simple task description

- [ ] 2. Another task
  - Another description
`;

      const tasks = parseTasksFromMarkdown(tasksContent);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].description).toBe('Simple task');
      expect(tasks[0].requirements).toBeUndefined();
      expect(tasks[0].leverage).toBeUndefined();

      expect(tasks[1].id).toBe('2');
      expect(tasks[1].description).toBe('Another task');
      expect(tasks[1].requirements).toBeUndefined();
      expect(tasks[1].leverage).toBeUndefined();
    });

    test('should handle empty or malformed content gracefully', () => {
      expect(parseTasksFromMarkdown('')).toHaveLength(0);
      expect(parseTasksFromMarkdown('# Just a title\n\nSome content')).toHaveLength(0);
      expect(parseTasksFromMarkdown('- [x] 1. Completed task')).toHaveLength(0); // Only parses uncompleted tasks
    });

    test('should ignore completed tasks', () => {
      const tasksContent = `- [x] 1. Completed task
  - This is done
  - _Requirements: 1.1_

- [ ] 2. Pending task
  - This is not done
  - _Requirements: 2.1_
`;

      const tasks = parseTasksFromMarkdown(tasksContent);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('2');
      expect(tasks[0].description).toBe('Pending task');
    });
  });

  describe('generateTaskCommand', () => {
    test('should generate command file with all sections', async () => {
      const commandsDir = join(tempDir, 'commands');
      await fs.mkdir(commandsDir, { recursive: true });

      const task: ParsedTask = {
        id: '1',
        description: 'Create user authentication system',
        requirements: '1.1, 1.2',
        leverage: 'auth/BaseAuth.ts, utils/validation.js'
      };

      await generateTaskCommand(commandsDir, 'user-auth', task);

      const commandFile = join(commandsDir, 'task-1.md');
      await expect(fs.access(commandFile)).resolves.not.toThrow();

      const content = await fs.readFile(commandFile, 'utf-8');

      // Check basic structure
      expect(content).toContain('# user-auth - Task 1');
      expect(content).toContain('Execute task 1 for the user-auth specification');

      // Check task description
      expect(content).toContain('## Task Description');
      expect(content).toContain('Create user authentication system');

      // Check code reuse section
      expect(content).toContain('## Code Reuse');
      expect(content).toContain('**Leverage existing code**: auth/BaseAuth.ts, utils/validation.js');

      // Check requirements section
      expect(content).toContain('## Requirements Reference');
      expect(content).toContain('**Requirements**: 1.1, 1.2');

      // Check usage section
      expect(content).toContain('## Usage');
      expect(content).toContain('/user-auth-task-1');

      // Check instructions
      expect(content).toContain('## Instructions');
      expect(content).toContain('/spec-execute 1 user-auth');
      expect(content).toContain('Mark task as complete by changing [ ] to [x]');

      // Check next steps
      expect(content).toContain('## Next Steps');
      expect(content).toContain('/spec-status user-auth');
    });

    test('should generate command file without optional sections', async () => {
      const commandsDir = join(tempDir, 'commands');
      await fs.mkdir(commandsDir, { recursive: true });

      const task: ParsedTask = {
        id: '2.1',
        description: 'Simple task without extras'
      };

      await generateTaskCommand(commandsDir, 'simple-spec', task);

      const commandFile = join(commandsDir, 'task-2.1.md');
      const content = await fs.readFile(commandFile, 'utf-8');

      // Should have basic sections
      expect(content).toContain('# simple-spec - Task 2.1');
      expect(content).toContain('Simple task without extras');
      expect(content).toContain('/simple-spec-task-2.1');

      // Should NOT have optional sections
      expect(content).not.toContain('## Code Reuse');
      expect(content).not.toContain('## Requirements Reference');
    });

    test('should handle hierarchical task IDs correctly', async () => {
      const commandsDir = join(tempDir, 'commands');
      await fs.mkdir(commandsDir, { recursive: true });

      const task: ParsedTask = {
        id: '3.2.1',
        description: 'Deep nested task'
      };

      await generateTaskCommand(commandsDir, 'nested-spec', task);

      const commandFile = join(commandsDir, 'task-3.2.1.md');
      await expect(fs.access(commandFile)).resolves.not.toThrow();

      const content = await fs.readFile(commandFile, 'utf-8');
      expect(content).toContain('# nested-spec - Task 3.2.1');
      expect(content).toContain('/nested-spec-task-3.2.1');
      expect(content).toContain('/spec-execute 3.2.1 nested-spec');
    });
  });

  describe('integration test', () => {
    test('should parse template format and generate correct commands', async () => {
      // Use the exact format from the tasks template
      const templateTasksContent = `# Implementation Plan

## Task Overview
[Brief description of the implementation approach]

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for components
  - Define core interfaces and types
  - Set up basic configuration
  - _Requirements: 1.1_

- [ ] 2. Implement data models and validation
- [ ] 2.1 Create base model classes
  - Define data structures/schemas
  - Implement validation methods
  - Write unit tests for models
  - _Requirements: 2.1, 2.2_

- [ ] 2.2 Implement specific model classes
  - Create concrete model implementations
  - Add relationship handling
  - Test model interactions
  - _Requirements: 2.3_

- [ ] 3. Create service layer
- [ ] 3.1 Implement core service interfaces
  - Define service contracts
  - Create base service classes
  - Add dependency injection
  - _Requirements: 3.1_
`;

      const tasks = parseTasksFromMarkdown(templateTasksContent);

      expect(tasks).toHaveLength(6);

      // Verify parsing of the exact template format
      expect(tasks[0].id).toBe('1');
      expect(tasks[0].description).toBe('Set up project structure and core interfaces');
      expect(tasks[0].requirements).toBe('1.1');

      expect(tasks[1].id).toBe('2');
      expect(tasks[1].description).toBe('Implement data models and validation');

      expect(tasks[2].id).toBe('2.1');
      expect(tasks[2].description).toBe('Create base model classes');
      expect(tasks[2].requirements).toBe('2.1, 2.2');

      expect(tasks[3].id).toBe('2.2');
      expect(tasks[3].description).toBe('Implement specific model classes');
      expect(tasks[3].requirements).toBe('2.3');

      expect(tasks[4].id).toBe('3');
      expect(tasks[4].description).toBe('Create service layer');

      expect(tasks[5].id).toBe('3.1');
      expect(tasks[5].description).toBe('Implement core service interfaces');
      expect(tasks[5].requirements).toBe('3.1');

      // Test command generation
      const commandsDir = join(tempDir, 'commands');
      await fs.mkdir(commandsDir, { recursive: true });

      for (const task of tasks) {
        await generateTaskCommand(commandsDir, 'test-spec', task);
      }

      // Verify all command files were created
      for (const task of tasks) {
        const commandFile = join(commandsDir, `task-${task.id}.md`);
        await expect(fs.access(commandFile)).resolves.not.toThrow();

        const content = await fs.readFile(commandFile, 'utf-8');
        expect(content).toContain(`# test-spec - Task ${task.id}`);
        expect(content).toContain(task.description);
      }
    });
  });
});