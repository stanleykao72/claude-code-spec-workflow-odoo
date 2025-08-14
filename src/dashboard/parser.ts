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

export interface Bug {
  name: string;
  displayName: string;
  status: 'reported' | 'analyzing' | 'fixing' | 'fixed' | 'verifying' | 'resolved';
  report?: {
    exists: boolean;
    severity?: 'critical' | 'high' | 'medium' | 'low';
    reproductionSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
    impact?: string;
  };
  analysis?: {
    exists: boolean;
    rootCause?: string;
    proposedFix?: string;
    filesAffected?: string[];
  };
  fix?: {
    exists: boolean;
    summary?: string;
    implemented?: boolean;
  };
  verification?: {
    exists: boolean;
    verified: boolean;
    testsPassed?: boolean;
    regressionChecks?: string[];
  };
  lastModified?: Date;
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
  private bugsPath: string;
  private steeringLoader: SteeringLoader;

  constructor(projectPath: string) {
    // Normalize path to handle Windows/Unix separators before resolving
    const normalizedInput = projectPath.replace(/\\/g, '/');
    this.projectPath = normalize(resolve(normalizedInput));
    this.specsPath = join(this.projectPath, '.claude', 'specs');
    this.bugsPath = join(this.projectPath, '.claude', 'bugs');
    this.steeringLoader = new SteeringLoader(this.projectPath);
  }

  async getProjectSteeringStatus(): Promise<SteeringStatus> {
    return this.getSteeringStatus();
  }

  async getAllBugs(): Promise<Bug[]> {
    try {
      // Check if bugs directory exists first
      try {
        await access(this.bugsPath, constants.F_OK);
      } catch {
        // Bugs directory doesn't exist, return empty array
        return [];
      }

      debug('Reading bugs from:', this.bugsPath);
      const dirs = await readdir(this.bugsPath);
      debug('Found bug directories:', dirs);
      const bugs = await Promise.all(
        dirs.filter((dir) => !dir.startsWith('.')).map((dir) => this.getBug(dir))
      );
      const validBugs = bugs.filter((bug) => bug !== null) as Bug[];
      debug('Parsed bugs:', validBugs.length);
      // Sort by last modified date, newest first
      validBugs.sort((a, b) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
      return validBugs;
    } catch (error) {
      console.error('Error reading bugs from', this.bugsPath, ':', error);
      return [];
    }
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
      // Handle formats like "# Requirements: Feature Name", "# Requirements - Feature Name", or "# Feature Name Requirements"
      const titleMatch = content.match(/^#\s+(?:Requirements\s*[-:]\s+)?(.+?)(?:\s+Requirements)?$/m);
      if (titleMatch?.[1]?.trim() && titleMatch[1].trim().toLowerCase() !== 'requirements') {
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
        // Handle formats like "# Design: Feature Name", "# Design - Feature Name", or "# Feature Name Design"
        const titleMatch = content.match(/^#\s+(?:Design\s*[-:]\s+)?(.+?)(?:\s+Design(?:\s+Document)?)?$/m);
        if (titleMatch?.[1]?.trim() && titleMatch[1].trim().toLowerCase() !== 'design') {
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
        // Handle formats like "# Tasks: Feature Name", "# Tasks - Feature Name", or "# Implementation Plan: Feature Name"
        const titleMatch = content.match(/^#\s+(?:(?:Tasks|Implementation Plan)\s*[-:]\s+)?(.+?)(?:\s+(?:Tasks|Plan))?$/m);
        if (titleMatch?.[1]?.trim() && 
            titleMatch[1].trim().toLowerCase() !== 'tasks' && 
            titleMatch[1].trim().toLowerCase() !== 'implementation plan') {
          spec.displayName = titleMatch[1].trim();
        }
      }

      const taskList = this.parseTasks(content);
      const completed = this.countCompletedTasks(taskList);
      const total = this.countTotalTasks(taskList);

      debug('Parsed task counts - Total:', total, 'Completed:', completed);

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
          // Always use the first uncompleted task as in-progress
          const inProgressTask = this.findInProgressTask(taskList);
          if (inProgressTask) {
            spec.tasks.inProgress = inProgressTask;
          }
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

  async getBug(name: string): Promise<Bug | null> {
    const bugPath = join(this.bugsPath, name);

    try {
      await access(bugPath, constants.F_OK);
    } catch {
      return null;
    }

    const bug: Bug = {
      name,
      displayName: this.formatDisplayName(name),
      status: 'reported',
    };

    // Check report
    const reportPath = join(bugPath, 'report.md');
    if (await this.fileExists(reportPath)) {
      const content = await readFile(reportPath, 'utf-8');

      // Try to extract title from the first heading
      const titleMatch = content.match(/^#\s+(?:Bug Report\s*[-:]\s+)?(.+?)(?:\s+Bug Report)?$/m);
      if (titleMatch?.[1]?.trim() && titleMatch[1].trim().toLowerCase() !== 'bug report') {
        bug.displayName = titleMatch[1].trim();
      }

      const severity = this.extractBugSeverity(content);
      const expectedBehavior = this.extractSection(content, 'Expected Behavior');
      const actualBehavior = this.extractSection(content, 'Actual Behavior');
      const impact = this.extractSection(content, 'Impact');
      
      bug.report = {
        exists: true,
        ...(severity && { severity }),
        reproductionSteps: this.extractReproductionSteps(content),
        ...(expectedBehavior && { expectedBehavior }),
        ...(actualBehavior && { actualBehavior }),
        ...(impact && { impact }),
      };
    }

    // Check analysis
    const analysisPath = join(bugPath, 'analysis.md');
    if (await this.fileExists(analysisPath)) {
      const content = await readFile(analysisPath, 'utf-8');
      
      const rootCause = this.extractSection(content, 'Root Cause');
      const proposedFix = this.extractSection(content, 'Proposed Fix');
      
      bug.analysis = {
        exists: true,
        ...(rootCause && { rootCause }),
        ...(proposedFix && { proposedFix }),
        filesAffected: this.extractFilesAffected(content),
      };
      // Only set to analyzing if there's actual analysis content
      // Check for content in the actual analysis sections (not just headers)
      const hasRootCauseContent = this.hasContentAfterSection(content, 'Root Cause Analysis') ||
                                this.hasContentAfterSection(content, 'Investigation Summary') ||
                                this.hasContentAfterSection(content, 'Root Cause');
      const hasImplementationPlan = this.hasContentAfterSection(content, 'Implementation Plan') ||
                                  this.hasContentAfterSection(content, 'Changes Required');
      
      if (hasRootCauseContent || hasImplementationPlan) {
        bug.status = 'analyzing';
        
        // If analysis is complete (all required sections have content), we're ready to fix
        const hasAllAnalysisContent = hasRootCauseContent && hasImplementationPlan;
        const analysisApproved = content.includes('✅ APPROVED') || 
                               content.includes('**Approved:** ✓') ||
                               content.includes('## Next Phase') ||
                               content.includes('proceed to');
        
        if (hasAllAnalysisContent && analysisApproved) {
          bug.status = 'fixing';
        }
      }
    }

    // Check if fix has been implemented
    const fixPath = join(bugPath, 'fix.md');
    if (await this.fileExists(fixPath)) {
      const content = await readFile(fixPath, 'utf-8');
      
      // Check if fix has actual content (not just template)
      const hasFixContent = this.hasContentAfterSection(content, 'Fix Summary') ||
                           this.hasContentAfterSection(content, 'Implementation Details') ||
                           this.hasContentAfterSection(content, 'Changes Made') ||
                           this.hasContentAfterSection(content, 'Code Changes');
      
      if (hasFixContent) {
        bug.status = 'fixed';
        
        // Add fix information to bug object
        const summary = this.extractSection(content, 'Fix Summary');
        
        bug.fix = {
          exists: true,
          ...(summary && { summary }),
          implemented: content.includes('✅') || content.includes('implemented') || content.includes('complete'),
        };
      }
    }

    // Check verification
    const verificationPath = join(bugPath, 'verification.md');
    if (await this.fileExists(verificationPath)) {
      const content = await readFile(verificationPath, 'utf-8');
      
      const testsPassed = this.extractTestStatus(content);
      
      bug.verification = {
        exists: true,
        verified: content.includes('✅ VERIFIED') || 
                 content.includes('**Verified:** ✓') ||
                 content.includes('**Production Verified**') ||
                 (content.includes('✅') && content.toLowerCase().includes('verified')),
        ...(testsPassed !== undefined && { testsPassed }),
        regressionChecks: this.extractRegressionChecks(content),
      };
      
      // Only set to verifying if there's actual verification content AND we're past the fixing phase
      const hasTestResults = this.hasContentAfterSection(content, 'Test Results') ||
                           this.hasContentAfterSection(content, 'Verification Steps') ||
                           this.hasContentAfterSection(content, 'Fix Verification');
      const hasRegressionChecks = this.hasContentAfterSection(content, 'Regression Testing') ||
                                this.hasContentAfterSection(content, 'Regression Checks') ||
                                this.hasContentAfterSection(content, 'Side Effects Check');
      
      // Only set to verifying if:
      // 1. There's actual verification content (not just template)
      // 2. Bug is in 'fixed' status (fix has been implemented)
      if ((hasTestResults || hasRegressionChecks) && bug.status === 'fixed') {
        bug.status = 'verifying';
        
        // Check if verification is complete
        if (bug.verification?.verified) {
          bug.status = 'resolved';
        }
      }
    }

    // Get last modified time
    const files = ['report.md', 'analysis.md', 'verification.md'];
    let lastModified = new Date(0);
    for (const file of files) {
      const filePath = join(bugPath, file);
      if (await this.fileExists(filePath)) {
        const stats = await import('fs').then((fs) => fs.promises.stat(filePath));
        if (stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }
      }
    }
    bug.lastModified = lastModified;

    return bug;
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
    // Removed _In Progress: parsing - now automatically using first uncompleted task

    let currentTask: Task | null = null;
    let parentStack: { level: number; task: Task }[] = [];

    for (const line of lines) {
      const match = line.match(taskRegex);
      if (match) {
        const indent = match[1] || '';
        const checked = match[2] || '';
        const id = match[3] || '';
        const description = match[4] || '';
        const level = indent.length / 2;

        currentTask = {
          id,
          description: description?.trim() || '',
          completed: checked === 'x',
          requirements: [],
        };

        // Find parent based on level
        while (parentStack.length > 0 && parentStack[parentStack.length - 1]!.level >= level) {
          parentStack.pop();
        }

        if (parentStack.length > 0) {
          const parent = parentStack[parentStack.length - 1]!.task;
          if (!parent.subtasks) parent.subtasks = [];
          parent.subtasks.push(currentTask);
        } else {
          tasks.push(currentTask);
        }

        parentStack.push({ level, task: currentTask });
      } else if (currentTask) {
        // Check for requirements
        const reqMatch = line.match(requirementsRegex);
        if (reqMatch?.[1]) {
          currentTask.requirements = reqMatch[1].split(',').map((r) => r.trim());
        }

        // Check for leverage
        const levMatch = line.match(leverageRegex);
        if (levMatch?.[1]) {
          currentTask.leverage = levMatch[1].trim();
        }

        // Removed in-progress marker check - now using first uncompleted task automatically
      }
    }

    // No longer storing in-progress task ID - automatically determined by first uncompleted task

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
      if (!line) continue;

      // Skip non-requirement section headers
      if (line.match(/^###\s+(Non-Functional Requirements|Technical Constraints|Edge Cases)\s*$/)) {
        continue;
      }

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
        const match = line?.match(pattern);
        if (match) {
          // Save previous requirement
          if (currentRequirement) {
            requirements.push(currentRequirement);
          }

          currentRequirement = {
            id: match[1] || '',
            title: match[2]?.trim() || '',
            acceptanceCriteria: [],
          };
          debug(`Found requirement ${match[1]}: ${match[2]?.trim()}`);
          inAcceptanceCriteria = false;
          matchFound = true;
          break;
        }
      }

      if (!matchFound && currentRequirement) {
        // Debug every line to see what we're getting
        if (line.trim()) {
          debug(`Processing line for ${currentRequirement.id}: "${line}"`);
        }
        
        // Look for user story in requirement body
        if (line?.includes('**User Story:**')) {
          currentRequirement.userStory = line.replace('**User Story:**', '').trim();
          debug(`Found user story for ${currentRequirement.id}: ${currentRequirement.userStory}`);
        }
        // Look for user story parts in new format - check more broadly
        else if (line?.includes('As a') || line?.includes('I want') || line?.includes('So that')) {
          if (!currentRequirement.userStory) {
            currentRequirement.userStory = '';
          }
          currentRequirement.userStory += ' ' + line.trim();
          debug(`Building user story for ${currentRequirement.id}: ${line?.trim()}`);
        }
        // Look for acceptance criteria section
        else if (line?.includes('#### Acceptance Criteria') || line?.includes('**Acceptance Criteria**')) {
          inAcceptanceCriteria = true;
          debug(`Found acceptance criteria section for ${currentRequirement.id}`);
        }
        // Look for GIVEN/WHEN/THEN format in new style (might be direct under requirement)
        else if (line?.includes('GIVEN') || line?.includes('WHEN') || line?.includes('THEN')) {
          if (!currentRequirement.acceptanceCriteria) {
            currentRequirement.acceptanceCriteria = [];
          }
          
          // Collect GIVEN/WHEN/THEN as a group for better formatting
          // Start collecting a new acceptance criteria scenario
          let scenario = line?.trim() || '';
          let j = i + 1;
          
          // Collect WHEN and THEN parts that follow
          while (j < lines.length) {
            const nextLine = lines[j]?.trim() || '';
            if (nextLine.startsWith('**WHEN**') || nextLine.startsWith('**THEN**')) {
              scenario += ' ' + nextLine;
              j++;
            } else if (nextLine === '') {
              // Empty line indicates end of this scenario
              break;
            } else if (nextLine.startsWith('**GIVEN**')) {
              // New GIVEN means this is a separate scenario - save current and start new
              currentRequirement.acceptanceCriteria.push(scenario);
              scenario = nextLine;
              j++;
              continue;
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
        }
        // Collect acceptance criteria items (numbered format)
        else if (currentRequirement && inAcceptanceCriteria && line?.match(/^\d+\. /)) {
          const criterion = line.replace(/^\d+\. /, '').trim();
          if (criterion) {
            currentRequirement.acceptanceCriteria.push(criterion);
            debug(`Found acceptance criterion for ${currentRequirement.id}: ${criterion}`);
          }
        }
        // Also collect bullet point acceptance criteria (- WHEN...)
        else if (currentRequirement && inAcceptanceCriteria && line?.match(/^[-•]\s+/)) {
          const criterion = line.replace(/^[-•]\s+/, '').trim();
          if (criterion) {
            currentRequirement.acceptanceCriteria.push(criterion);
          }
        }
        // For FR/NFR requirements, collect bullet points directly as acceptance criteria
        else if (currentRequirement && !inAcceptanceCriteria && line?.match(/^[-•]\s+/) && 
                 currentRequirement.id && (currentRequirement.id.startsWith('FR-') || currentRequirement.id.startsWith('NFR-'))) {
          if (!currentRequirement.acceptanceCriteria) {
            currentRequirement.acceptanceCriteria = [];
          }
          const criterion = line?.replace(/^[-•]\s+/, '').trim() || '';
          if (criterion) {
            currentRequirement.acceptanceCriteria.push(criterion);
            debug(`Found bullet criterion for ${currentRequirement.id}: ${criterion}`);
          }
        }
        // For FR/NFR requirements, also collect regular text as part of description
        else if (currentRequirement && line?.trim() && !line.startsWith('#') &&
                 currentRequirement.id && (currentRequirement.id.startsWith('FR-') || currentRequirement.id.startsWith('NFR-'))) {
          // If it's descriptive text, add it to the user story
          if (!currentRequirement.userStory) {
            currentRequirement.userStory = line.trim();
          } else if (!line.match(/^[-•]\s+/)) {
            // Continue building the description if it's not a bullet point
            currentRequirement.userStory += ' ' + line.trim();
          }
          debug(`Adding description for ${currentRequirement.id}: ${line?.trim()}`);
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
    
    // Return ALL requirements (including user stories and acceptance criteria)
    // The filtering was preventing US-* and AC-* from being displayed
    const allRequirements = requirements;
    
    debug(`Extracted ${allRequirements.length} requirements total:`, 
          allRequirements.map(r => `${r.id}: ${r.title}`));
    debug(`  Breakdown: ${functionalRequirements.length} FR/NFR, ${userStories.length} US, ${acceptanceCriteria.length} AC, ${otherRequirements.length} other`);
    allRequirements.forEach(req => {
      debug(`  ${req.id}: userStory="${req.userStory || 'none'}", acceptanceCriteria=${req.acceptanceCriteria?.length || 0}`);
    });
    return allRequirements;
  }

  private extractUserStories(content: string): string[] {
    const stories: string[] = [];
    const lines = content.split('\n');
    let currentStory = '';
    let inStorySection = false;
    let currentStoryTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Check for old format: **User Story:**
      if (line.includes('**User Story:**')) {
        if (currentStory) {
          stories.push(currentStory.trim());
        }
        // Extract the story content after "**User Story:**"
        currentStory = line?.replace('**User Story:**', '').trim() || '';
        inStorySection = true;
        currentStoryTitle = '';
      } 
      // Check for new format: ### US-N: Title
      else if (line.match(/^### US-\d+: (.+)$/)) {
        if (currentStory) {
          stories.push(currentStory.trim());
        }
        const match = line.match(/^### US-\d+: (.+)$/);
        currentStoryTitle = match?.[1]?.trim() || '';
        currentStory = currentStoryTitle;
        inStorySection = true;
        
        // Look ahead for the user story content in the new format
        // Format: **As a** X **I want** Y **So that** Z
        let storyParts: string[] = [];
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j]?.trim() || '';
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
      else if (inStorySection && line?.trim()) {
        // Stop at next major section (### or ##) or next user story
        if (line.startsWith('###') || line.startsWith('##') || line.includes('**User Story:**')) {
          if (currentStory) {
            stories.push(currentStory.trim());
            currentStory = '';
          }
          // If this line is another user story, process it
          if (line.includes('**User Story:**')) {
            currentStory = line?.replace('**User Story:**', '').trim() || '';
            currentStoryTitle = '';
          } else {
            inStorySection = false;
          }
        } else if (!line.startsWith('#') && line?.trim() && !currentStoryTitle) {
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
            title: categoryName?.trim() || '',
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

  private extractBugSeverity(content: string): 'critical' | 'high' | 'medium' | 'low' | undefined {
    const severityMatch = content.match(/\*\*Severity\*\*:\s*(critical|high|medium|low)/i);
    if (severityMatch?.[1]) {
      return severityMatch[1].toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
    }
    return undefined;
  }

  private extractReproductionSteps(content: string): string[] {
    const steps: string[] = [];
    const lines = content.split('\n');
    let inReproductionSection = false;

    for (const line of lines) {
      if (line.includes('## Reproduction Steps') || line.includes('### Reproduction Steps')) {
        inReproductionSection = true;
        continue;
      }

      if (inReproductionSection) {
        // Stop at next section
        if (line.startsWith('## ') || line.startsWith('### ')) {
          break;
        }

        // Look for numbered steps
        const stepMatch = line.match(/^\d+\.\s+(.+)$/);
        if (stepMatch?.[1]) {
          steps.push(stepMatch[1].trim());
        }
      }
    }

    return steps;
  }

  private extractSection(content: string, sectionName: string): string | undefined {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = '';

    for (const line of lines) {
      if (line.includes(`## ${sectionName}`) || line.includes(`### ${sectionName}`)) {
        inSection = true;
        continue;
      }

      if (inSection) {
        // Stop at next section
        if (line.startsWith('## ') || line.startsWith('### ')) {
          break;
        }

        if (line.trim()) {
          sectionContent += line.trim() + ' ';
        }
      }
    }

    return sectionContent.trim() || undefined;
  }

  private hasContentAfterSection(content: string, sectionName: string): boolean {
    const lines = content.split('\n');
    let inSection = false;
    let hasContent = false;

    for (const line of lines) {
      if (line.includes(`## ${sectionName}`) || line.includes(`### ${sectionName}`)) {
        inSection = true;
        continue;
      }

      if (inSection) {
        // Stop at next section
        if (line.startsWith('## ') || line.startsWith('### ')) {
          break;
        }

        // Check if line has meaningful content (not just whitespace or template placeholders)
        const trimmed = line.trim();
        if (trimmed && 
            !trimmed.startsWith('[') && // Skip template placeholders like [Description]
            !trimmed.match(/^\[.*\]$/) && // Skip full line placeholders
            !trimmed.match(/^<.*>$/) && // Skip placeholder tags
            !trimmed.match(/^\{.*\}$/)) { // Skip template variables
          hasContent = true;
          break;
        }
      }
    }

    return hasContent;
  }

  private extractFilesAffected(content: string): string[] {
    const files: string[] = [];
    const lines = content.split('\n');
    let inFilesSection = false;

    for (const line of lines) {
      if (line.includes('Files Affected') || line.includes('Affected Files')) {
        inFilesSection = true;
        continue;
      }

      if (inFilesSection) {
        // Stop at next section
        if (line.startsWith('## ') || line.startsWith('### ')) {
          break;
        }

        // Look for file paths (basic heuristic: contains / or .)
        const fileMatch = line.match(/[-•]\s*(.+\.[a-zA-Z]+)/) || line.match(/[-•]\s*(.+\/.+)/);
        if (fileMatch?.[1]) {
          files.push(fileMatch[1].trim());
        }
      }
    }

    return files;
  }

  private extractTestStatus(content: string): boolean | undefined {
    if (content.includes('✅ All tests passed') || content.includes('Tests: PASSED')) {
      return true;
    }
    if (content.includes('❌ Tests failed') || content.includes('Tests: FAILED')) {
      return false;
    }
    return undefined;
  }

  private extractRegressionChecks(content: string): string[] {
    const checks: string[] = [];
    const lines = content.split('\n');
    let inRegressionSection = false;

    for (const line of lines) {
      if (line.includes('Regression Checks') || line.includes('Regression Testing')) {
        inRegressionSection = true;
        continue;
      }

      if (inRegressionSection) {
        // Stop at next section
        if (line.startsWith('## ') || line.startsWith('### ')) {
          break;
        }

        // Look for check items
        const checkMatch = line.match(/[-•✅❌]\s+(.+)$/);
        if (checkMatch?.[1]) {
          checks.push(checkMatch[1].trim());
        }
      }
    }

    return checks;
  }
}
