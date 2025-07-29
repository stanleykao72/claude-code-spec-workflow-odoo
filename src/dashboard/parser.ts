import { readFile, readdir, access } from 'fs/promises';
import { join, resolve, normalize } from 'path';
import { constants } from 'fs';
import { debug } from './logger';
import { SteeringLoader } from '../steering';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  requirements: string[];
  leverage?: string;
  subtasks?: Task[];
}

export interface RequirementDetail {
  id: string;
  title: string;
  userStory?: string;
  acceptanceCriteria: string[];
}

export interface CodeReuseCategory {
  title: string;
  items: string[];
}

export interface SteeringStatus {
  exists: boolean;
  hasProduct: boolean;
  hasTech: boolean;
  hasStructure: boolean;
}

export interface Spec {
  name: string;
  displayName: string;
  status: 'not-started' | 'requirements' | 'design' | 'tasks' | 'in-progress' | 'completed';
  requirements?: {
    exists: boolean;
    userStories: number;
    approved: boolean;
    content?: RequirementDetail[];
  };
  design?: {
    exists: boolean;
    approved: boolean;
    hasCodeReuseAnalysis: boolean;
    codeReuseContent?: CodeReuseCategory[];
  };
  tasks?: {
    exists: boolean;
    approved: boolean;
    total: number;
    completed: number;
    inProgress?: string;
    taskList: Task[];
  };
  lastModified?: Date;
}

export class SpecParser {
  private projectPath: string;
  private specsPath: string;
  private steeringLoader: SteeringLoader;

  constructor(projectPath: string) {
    // Normalize path to handle Windows/Unix separators before resolving
    const normalizedInput = projectPath.replace(/\\/g, '/');
    this.projectPath = normalize(resolve(normalizedInput));
    this.specsPath = join(this.projectPath, '.claude', 'specs');
    this.steeringLoader = new SteeringLoader(this.projectPath);
  }

  async getProjectSteeringStatus(): Promise<SteeringStatus> {
    return this.getSteeringStatus();
  }

  async getAllSpecs(): Promise<Spec[]> {
    try {
      // Check if specs directory exists first
      try {
        await access(this.specsPath, constants.F_OK);
      } catch {
        // Specs directory doesn't exist, return empty array
        return [];
      }

      debug('Reading specs from:', this.specsPath);
      const dirs = await readdir(this.specsPath);
      debug('Found directories:', dirs);
      const specs = await Promise.all(
        dirs.filter((dir) => !dir.startsWith('.')).map((dir) => this.getSpec(dir))
      );
      const validSpecs = specs.filter((spec) => spec !== null) as Spec[];
      debug('Parsed specs:', validSpecs.length);
      // Sort by last modified date, newest first
      validSpecs.sort((a, b) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
      return validSpecs;
    } catch (error) {
      console.error('Error reading specs from', this.specsPath, ':', error);
      return [];
    }
  }

  async getSpec(name: string): Promise<Spec | null> {
    const specPath = join(this.specsPath, name);

    try {
      await access(specPath, constants.F_OK);
    } catch {
      return null;
    }

    const spec: Spec = {
      name,
      displayName: this.formatDisplayName(name),
      status: 'not-started',
    };

    // Check requirements
    const requirementsPath = join(specPath, 'requirements.md');
    if (await this.fileExists(requirementsPath)) {
      const content = await readFile(requirementsPath, 'utf-8');

      // Try to extract title from the first heading
      // Handle formats like "# Requirements: Feature Name" or "# Feature Name Requirements"
      const titleMatch = content.match(/^#\s+(?:Requirements:\s+)?(.+?)(?:\s+Requirements)?$/m);
      if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().toLowerCase() !== 'requirements') {
        spec.displayName = titleMatch[1].trim();
      }

      const extractedRequirements = this.extractRequirements(content);
      const extractedStories = this.extractUserStories(content);
      
      spec.requirements = {
        exists: true,
        userStories: extractedStories.length,
        approved: content.includes('✅ APPROVED') || content.includes('**Approved:** ✓'),
        content: extractedRequirements,
      };
      // Set initial status
      spec.status = 'requirements';

      // If requirements are approved, we move to design phase
      if (spec.requirements.approved) {
        spec.status = 'design';
      }
    }

    // Check design
    const designPath = join(specPath, 'design.md');
    if (await this.fileExists(designPath)) {
      const content = await readFile(designPath, 'utf-8');
      
      // If we haven't found a display name yet, try to extract from design
      if (spec.displayName === this.formatDisplayName(name)) {
        // Handle formats like "# Design: Feature Name" or "# Feature Name Design"
        const titleMatch = content.match(/^#\s+(?:Design:\s+)?(.+?)(?:\s+Design(?:\s+Document)?)?$/m);
        if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().toLowerCase() !== 'design') {
          spec.displayName = titleMatch[1].trim();
        }
      }
      
      const codeReuseContent = this.extractCodeReuseAnalysis(content);
      
      spec.design = {
        exists: true,
        approved: content.includes('✅ APPROVED'),
        hasCodeReuseAnalysis: content.includes('## Code Reuse Analysis') || 
                             content.includes('### Existing Components to Reuse') ||
                             content.includes('## Existing Components') ||
                             content.includes('## Code Reuse') ||
                             codeReuseContent.length > 0,
        codeReuseContent: codeReuseContent,
      };
      // If design is approved, we move to tasks phase
      if (spec.design.approved) {
        spec.status = 'tasks';
      }
    }

    // Check tasks
    const tasksPath = join(specPath, 'tasks.md');
    if (await this.fileExists(tasksPath)) {
      debug(`Reading tasks from: ${tasksPath}`);
      const content = await readFile(tasksPath, 'utf-8');
      debug('Tasks file content length:', content.length);
      debug('Tasks file includes APPROVED:', content.includes('✅ APPROVED'));
      
      // If we still haven't found a display name, try to extract from tasks
      if (spec.displayName === this.formatDisplayName(name)) {
        // Handle formats like "# Tasks: Feature Name" or "# Implementation Plan: Feature Name"
        const titleMatch = content.match(/^#\s+(?:(?:Tasks|Implementation Plan):\s+)?(.+?)(?:\s+(?:Tasks|Plan))?$/m);
        if (titleMatch && titleMatch[1].trim() && 
            titleMatch[1].trim().toLowerCase() !== 'tasks' && 
            titleMatch[1].trim().toLowerCase() !== 'implementation plan') {
          spec.displayName = titleMatch[1].trim();
        }
      }

      const taskList = this.parseTasks(content);
      const completed = this.countCompletedTasks(taskList);
      const total = this.countTotalTasks(taskList);
      const inProgressTaskId = (taskList as any)._inProgressTaskId;

      debug('Parsed task counts - Total:', total, 'Completed:', completed, 'In Progress:', inProgressTaskId);

      spec.tasks = {
        exists: true,
        approved: content.includes('✅ APPROVED'),
        total,
        completed,
        taskList,
      };

      if (spec.tasks.approved) {
        if (completed === 0) {
          spec.status = 'tasks';
        } else if (completed < total) {
          spec.status = 'in-progress';
          // Use the explicitly marked in-progress task if available
          spec.tasks.inProgress = inProgressTaskId || this.findInProgressTask(taskList);
        } else {
          spec.status = 'completed';
        }
      }
    }

    // Get last modified time
    const files = ['requirements.md', 'design.md', 'tasks.md'];
    let lastModified = new Date(0);
    for (const file of files) {
      const filePath = join(specPath, file);
      if (await this.fileExists(filePath)) {
        const stats = await import('fs').then((fs) => fs.promises.stat(filePath));
        if (stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }
      }
    }
    spec.lastModified = lastModified;

    return spec;
  }

  private parseTasks(content: string): Task[] {
    debug('Parsing tasks from content...');
    const tasks: Task[] = [];
    const lines = content.split('\n');
    debug('Total lines:', lines.length);

    // Let's test what the actual lines look like
    lines.slice(0, 20).forEach((line, i) => {
      if (line.includes('[') && line.includes(']')) {
        debug(`Line ${i}: "${line}"`);
      }
    });

    // Match the actual format: "- [x] 1. Create GraphQL queries..." or "- [ ] **1. Task description**"
    const taskRegex = /^(\s*)- \[([ x])\] (?:\*\*)?(\d+(?:\.\d+)*)\. (.+?)(?:\*\*)?$/;
    const requirementsRegex = /_Requirements: ([\d., ]+)/;
    const leverageRegex = /_Leverage: (.+)$/;
    const inProgressRegex = /_In Progress:/;

    let currentTask: Task | null = null;
    let parentStack: { level: number; task: Task }[] = [];
    let inProgressTaskId: string | undefined;

    for (const line of lines) {
      const match = line.match(taskRegex);
      if (match) {
        const [, indent, checked, id, description] = match;
        const level = indent.length / 2;

        currentTask = {
          id,
          description: description.trim(),
          completed: checked === 'x',
          requirements: [],
        };

        // Find parent based on level
        while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
          parentStack.pop();
        }

        if (parentStack.length > 0) {
          const parent = parentStack[parentStack.length - 1].task;
          if (!parent.subtasks) parent.subtasks = [];
          parent.subtasks.push(currentTask);
        } else {
          tasks.push(currentTask);
        }

        parentStack.push({ level, task: currentTask });
      } else if (currentTask) {
        // Check for requirements
        const reqMatch = line.match(requirementsRegex);
        if (reqMatch) {
          currentTask.requirements = reqMatch[1].split(',').map((r) => r.trim());
        }

        // Check for leverage
        const levMatch = line.match(leverageRegex);
        if (levMatch) {
          currentTask.leverage = levMatch[1].trim();
        }

        // Check for in progress marker
        if (line.match(inProgressRegex)) {
          inProgressTaskId = currentTask.id;
        }
      }
    }

    // Store the in progress task ID in the tasks array metadata
    if (inProgressTaskId) {
      (tasks as any)._inProgressTaskId = inProgressTaskId;
    }

    return tasks;
  }

  private countCompletedTasks(tasks: Task[]): number {
    let count = 0;
    for (const task of tasks) {
      if (task.completed) count++;
      if (task.subtasks) {
        count += this.countCompletedTasks(task.subtasks);
      }
    }
    return count;
  }

  private countTotalTasks(tasks: Task[]): number {
    let count = tasks.length;
    for (const task of tasks) {
      if (task.subtasks) {
        count += this.countTotalTasks(task.subtasks);
      }
    }
    return count;
  }

  private findInProgressTask(tasks: Task[]): string | undefined {
    for (const task of tasks) {
      if (!task.completed) {
        return task.id;
      }
      if (task.subtasks) {
        const subTaskId = this.findInProgressTask(task.subtasks);
        if (subTaskId) return subTaskId;
      }
    }
    return undefined;
  }

  private formatDisplayName(name: string): string {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractRequirements(content: string): RequirementDetail[] {
    const requirements: RequirementDetail[] = [];
    const lines = content.split('\n');
    let currentRequirement: RequirementDetail | null = null;
    let inAcceptanceCriteria = false;

    debug('Extracting requirements from content...');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line contains a numbered requirement - try multiple patterns
      const requirementPatterns = [
        /^### Requirement (\d+): (.+)$/,           // ### Requirement 1: Title
        /^## Requirement (\d+): (.+)$/,            // ## Requirement 1: Title
        /^### (\d+)\. (.+)$/,                      // ### 1. Title
        /^## (\d+)\. (.+)$/,                       // ## 1. Title
        /^### (FR-\d+): (.+)$/,                    // ### FR-1: Title (Functional Requirement)
        /^### (NFR-\d+): (.+)$/,                   // ### NFR-1: Title (Non-Functional Requirement)
        /^### (AC-\d+): (.+)$/,                    // ### AC-1: Title (Acceptance Criteria)
        /^### (US-\d+): (.+)$/,                    // ### US-1: Title (User Story)
      ];

      let matchFound = false;
      for (const pattern of requirementPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Save previous requirement
          if (currentRequirement) {
            requirements.push(currentRequirement);
          }

          currentRequirement = {
            id: match[1],
            title: match[2].trim(),
            acceptanceCriteria: [],
          };
          debug(`Found requirement ${match[1]}: ${match[2].trim()}`);
          inAcceptanceCriteria = false;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // Look for user story in requirement body
        if (currentRequirement && line.includes('**User Story:**')) {
          currentRequirement.userStory = line.replace('**User Story:**', '').trim();
        }
        // Look for user story parts in new format
        else if (currentRequirement && (line.includes('**As a**') || line.includes('**I want**') || line.includes('**So that**'))) {
          if (!currentRequirement.userStory) {
            currentRequirement.userStory = '';
          }
          currentRequirement.userStory += ' ' + line.trim();
        }
        // Look for acceptance criteria section
        else if (currentRequirement && line.includes('#### Acceptance Criteria')) {
          inAcceptanceCriteria = true;
        }
        // Look for GIVEN/WHEN/THEN format in new style
        else if (currentRequirement && (line.includes('**GIVEN**') || line.includes('**WHEN**') || line.includes('**THEN**'))) {
          if (!currentRequirement.acceptanceCriteria) {
            currentRequirement.acceptanceCriteria = [];
          }
          
          // For AC-N style requirements, we need to collect GIVEN/WHEN/THEN as a group
          if (currentRequirement.id && currentRequirement.id.startsWith('AC-')) {
            // Start collecting a new acceptance criteria scenario
            let scenario = line.trim();
            let j = i + 1;
            
            // Collect WHEN and THEN parts that follow
            while (j < lines.length) {
              const nextLine = lines[j].trim();
              if (nextLine.startsWith('**WHEN**') || nextLine.startsWith('**THEN**')) {
                scenario += ' ' + nextLine;
                j++;
              } else if (nextLine === '' || nextLine.startsWith('**GIVEN**')) {
                // Empty line or new GIVEN indicates end of this scenario
                break;
              } else if (nextLine.startsWith('###') || nextLine.startsWith('##')) {
                // Section header indicates end
                break;
              } else {
                // Continuation of current line
                scenario += ' ' + nextLine;
                j++;
              }
            }
            
            currentRequirement.acceptanceCriteria.push(scenario);
            i = j - 1; // Skip lines we've already processed
          } else {
            // Old format - just collect the line
            currentRequirement.acceptanceCriteria.push(line.trim());
          }
        }
        // Collect acceptance criteria items (old format)
        else if (currentRequirement && inAcceptanceCriteria && line.match(/^\d+\. /)) {
          currentRequirement.acceptanceCriteria.push(line.replace(/^\d+\. /, '').trim());
        }
        // Also collect bullet point acceptance criteria (- WHEN...)
        else if (currentRequirement && inAcceptanceCriteria && line.match(/^[-•]\s+/)) {
          const criterion = line.replace(/^[-•]\s+/, '').trim();
          if (criterion) {
            currentRequirement.acceptanceCriteria.push(criterion);
          }
        }
        // Stop at next major section
        else if (line.startsWith('### Requirement') || line.startsWith('### ') || line.startsWith('## ')) {
          inAcceptanceCriteria = false;
        }
      }
    }

    // Don't forget the last requirement
    if (currentRequirement) {
      requirements.push(currentRequirement);
    }

    // Clean up user stories that might have extra spaces
    requirements.forEach(req => {
      if (req.userStory) {
        req.userStory = req.userStory.trim().replace(/\s+/g, ' ');
      }
    });

    // In the new format, we need to separate different types of entries:
    // - US-* are user stories, not requirements
    // - FR-*, NFR-* are the actual requirements
    // - AC-* are acceptance criteria, not requirements
    const userStories = requirements.filter(r => r.id && r.id.startsWith('US-'));
    const functionalRequirements = requirements.filter(r => r.id && (r.id.startsWith('FR-') || r.id.startsWith('NFR-')));
    const acceptanceCriteria = requirements.filter(r => r.id && r.id.startsWith('AC-'));
    const otherRequirements = requirements.filter(r => !r.id || (!r.id.startsWith('US-') && !r.id.startsWith('FR-') && !r.id.startsWith('NFR-') && !r.id.startsWith('AC-')));
    
    // Return functional requirements and old-style requirements
    const mainRequirements = [...functionalRequirements, ...otherRequirements];
    
    debug(`Extracted ${mainRequirements.length} requirements (${userStories.length} user stories, ${acceptanceCriteria.length} AC entries):`, 
          mainRequirements.map(r => `${r.id}: ${r.title}`));
    return mainRequirements;
  }

  private extractUserStories(content: string): string[] {
    const stories: string[] = [];
    const lines = content.split('\n');
    let currentStory = '';
    let inStorySection = false;
    let currentStoryTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for old format: **User Story:**
      if (line.includes('**User Story:**')) {
        if (currentStory) {
          stories.push(currentStory.trim());
        }
        // Extract the story content after "**User Story:**"
        currentStory = line.replace('**User Story:**', '').trim();
        inStorySection = true;
        currentStoryTitle = '';
      } 
      // Check for new format: ### US-N: Title
      else if (line.match(/^### US-\d+: (.+)$/)) {
        if (currentStory) {
          stories.push(currentStory.trim());
        }
        const match = line.match(/^### US-\d+: (.+)$/);
        currentStoryTitle = match![1].trim();
        currentStory = currentStoryTitle;
        inStorySection = true;
        
        // Look ahead for the user story content in the new format
        // Format: **As a** X **I want** Y **So that** Z
        let storyParts: string[] = [];
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith('**As a**') || 
              nextLine.startsWith('**I want**') || 
              nextLine.startsWith('**So that**')) {
            storyParts.push(nextLine);
          } else if (nextLine.startsWith('###') || nextLine.startsWith('##')) {
            break;
          }
        }
        if (storyParts.length > 0) {
          currentStory = currentStoryTitle + ': ' + storyParts.join(' ');
        }
      } 
      else if (inStorySection && line.trim()) {
        // Stop at next major section (### or ##) or next user story
        if (line.startsWith('###') || line.startsWith('##') || line.includes('**User Story:**')) {
          if (currentStory) {
            stories.push(currentStory.trim());
            currentStory = '';
          }
          // If this line is another user story, process it
          if (line.includes('**User Story:**')) {
            currentStory = line.replace('**User Story:**', '').trim();
            currentStoryTitle = '';
          } else {
            inStorySection = false;
          }
        } else if (!line.startsWith('#') && line.trim() && !currentStoryTitle) {
          // Continue building the story if it's not a heading (old format only)
          currentStory += ' ' + line.trim();
        }
      }
    }

    // Don't forget the last story
    if (currentStory) {
      stories.push(currentStory.trim());
    }

    return stories; // Return all stories
  }

  private extractCodeReuseAnalysis(content: string): CodeReuseCategory[] {
    const categories: CodeReuseCategory[] = [];
    const lines = content.split('\n');
    let inCodeReuseSection = false;
    let currentCategory: CodeReuseCategory | null = null;

    for (const line of lines) {
      // Look for various code reuse section headers
      if (line.includes('## Code Reuse Analysis') || 
          line.includes('### Existing Components to Reuse') ||
          line.includes('## Existing Components') ||
          line.includes('## Code Reuse')) {
        inCodeReuseSection = true;
        continue;
      }

      if (inCodeReuseSection) {
        // Stop at next major section
        if ((line.startsWith('## ') || line.startsWith('### ')) && 
            !line.includes('Code Reuse') && 
            !line.includes('Existing Components')) {
          break;
        }

        // Look for numbered categories like "1. **Configuration Infrastructure**" or just "1. Item Name:"
        const categoryMatch = line.match(/^\d+\.\s*(?:\*\*(.+?)\*\*|(.+?)(?::|\s*$))/);
        if (categoryMatch) {
          const categoryName = categoryMatch[1] || categoryMatch[2];
          
          // In phenix format, the numbered items ARE the reuse items, not categories
          // So we'll treat them as single-item categories for consistency
          if (currentCategory) {
            categories.push(currentCategory);
          }
          
          currentCategory = {
            title: categoryName.trim(),
            items: [],
          };
          
          // Check if there's content on the same line after colon
          const colonIndex = line.indexOf(':');
          if (colonIndex > -1 && colonIndex < line.length - 1) {
            const afterColon = line.substring(colonIndex + 1).trim();
            if (afterColon) {
              currentCategory.items.push(afterColon);
            }
          }
        }
        // Look for bullet points under categories
        else if (currentCategory && (line.startsWith('   - ') || line.startsWith('  - ') || line.startsWith('- '))) {
          const item = line.replace(/^\s*-\s*/, '').trim();
          if (item) {
            // Clean up markdown formatting
            const cleanItem = item
              .replace(/`([^`]+)`/g, '$1') // Remove backticks
              .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
              .trim();
            currentCategory.items.push(cleanItem);
          }
        }
      }
    }

    // Don't forget the last category
    if (currentCategory) {
      categories.push(currentCategory);
    }

    return categories;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async getSteeringStatus(): Promise<SteeringStatus> {
    const steeringPath = join(this.projectPath, '.claude', 'steering');
    
    try {
      await access(steeringPath, constants.F_OK);
      
      const status: SteeringStatus = {
        exists: true,
        hasProduct: await this.fileExists(join(steeringPath, 'product.md')),
        hasTech: await this.fileExists(join(steeringPath, 'tech.md')),
        hasStructure: await this.fileExists(join(steeringPath, 'structure.md'))
      };
      
      return status;
    } catch {
      return {
        exists: false,
        hasProduct: false,
        hasTech: false,
        hasStructure: false
      };
    }
  }
}
