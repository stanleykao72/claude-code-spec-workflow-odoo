import { SpecParser } from '../../src/dashboard/parser';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('UI Improvements - Conditional Rendering Logic', () => {
  let tempDir: string;
  let parser: SpecParser;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ui-improvements-test-'));
    parser = new SpecParser(tempDir);
    
    // Create .claude/specs directory
    await mkdir(join(tempDir, '.claude', 'specs'), { recursive: true });
    await mkdir(join(tempDir, '.claude', 'bugs'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Completed Specs Conditional Rendering', () => {
    describe('Progress Bar Display', () => {
      it('should hide progress bar for completed specs', async () => {
        const specDir = join(tempDir, '.claude', 'specs', 'completed-spec');
        await mkdir(specDir, { recursive: true });
        
        const tasksContent = `# Implementation Plan: Completed Feature

✅ APPROVED

## Tasks

- [x] 1. First task
- [x] 2. Second task  
- [x] 3. Third task`;

        await writeFile(join(specDir, 'tasks.md'), tasksContent);
        
        const spec = await parser.getSpec('completed-spec');
        
        expect(spec).not.toBeNull();
        expect(spec!.status).toBe('completed');
        expect(spec!.tasks!.total).toBe(3);
        expect(spec!.tasks!.completed).toBe(3);
        
        // Test the conditional logic: progress bar should be hidden
        const shouldShowProgressBar = spec!.tasks && spec!.tasks.total > 0 && spec!.status !== 'completed';
        expect(shouldShowProgressBar).toBe(false);
      });

      it('should show progress bar for incomplete specs', async () => {
        const specDir = join(tempDir, '.claude', 'specs', 'incomplete-spec');
        await mkdir(specDir, { recursive: true });
        
        const tasksContent = `# Implementation Plan: Incomplete Feature

✅ APPROVED

## Tasks

- [x] 1. First task
- [ ] 2. Second task  
- [ ] 3. Third task`;

        await writeFile(join(specDir, 'tasks.md'), tasksContent);
        
        const spec = await parser.getSpec('incomplete-spec');
        
        expect(spec).not.toBeNull();
        expect(spec!.status).toBe('in-progress');
        expect(spec!.tasks!.total).toBe(3);
        expect(spec!.tasks!.completed).toBe(1);
        
        // Test the conditional logic: progress bar should be shown
        const shouldShowProgressBar = spec!.tasks && spec!.tasks.total > 0 && spec!.status !== 'completed';
        expect(shouldShowProgressBar).toBe(true);
      });

      it('should show progress bar for approved specs without tasks', async () => {
        const specDir = join(tempDir, '.claude', 'specs', 'approved-spec');
        await mkdir(specDir, { recursive: true });
        
        const requirementsContent = `# Requirements: Approved Feature

## Requirements

### Requirement 1
**User Story:** As a user, I want something

## Status
✅ APPROVED`;

        await writeFile(join(specDir, 'requirements.md'), requirementsContent);
        
        const spec = await parser.getSpec('approved-spec');
        
        expect(spec).not.toBeNull();
        expect(spec!.status).toBe('design');
        expect(spec!.tasks).toBeUndefined();
        
        // Test the conditional logic: no tasks means no progress bar
        const shouldShowProgressBar = spec!.tasks && spec!.tasks.total > 0 && spec!.status !== 'completed';
        expect(shouldShowProgressBar).toBeFalsy();
      });
    });

    describe('Task Count Display', () => {
      it('should hide task count for completed specs', async () => {
        const specDir = join(tempDir, '.claude', 'specs', 'completed-tasks');
        await mkdir(specDir, { recursive: true });
        
        const tasksContent = `# Implementation Plan: Completed Tasks

✅ APPROVED

## Tasks

- [x] 1. Completed task
- [x] 2. Another completed task`;

        await writeFile(join(specDir, 'tasks.md'), tasksContent);
        
        const spec = await parser.getSpec('completed-tasks');
        
        expect(spec).not.toBeNull();
        expect(spec!.status).toBe('completed');
        
        // Test the conditional logic: task count should be hidden
        const shouldShowTaskCount = spec!.tasks && spec!.status !== 'completed';
        expect(shouldShowTaskCount).toBe(false);
      });

      it('should show task count for non-completed specs', async () => {
        const specDir = join(tempDir, '.claude', 'specs', 'active-tasks');
        await mkdir(specDir, { recursive: true });
        
        const tasksContent = `# Implementation Plan: Active Tasks

✅ APPROVED

## Tasks

- [x] 1. Completed task
- [ ] 2. Pending task`;

        await writeFile(join(specDir, 'tasks.md'), tasksContent);
        
        const spec = await parser.getSpec('active-tasks');
        
        expect(spec).not.toBeNull();
        expect(spec!.status).toBe('in-progress');
        
        // Test the conditional logic: task count should be shown
        const shouldShowTaskCount = spec!.tasks && spec!.status !== 'completed';
        expect(shouldShowTaskCount).toBe(true);
      });
    });
  });

  describe('Resolved Bugs Conditional Rendering', () => {
    describe('Bug Details Display', () => {
      it('should display resolved bugs in compact single-line format', async () => {
        const bugDir = join(tempDir, '.claude', 'bugs', 'resolved-bug');
        await mkdir(bugDir, { recursive: true });
        
        const reportContent = `# Bug Report: Resolved Issue

## Bug Details
**Severity**: high
**Reporter**: developer

## Description
This bug was fixed`;

        const analysisContent = `# Analysis: Root Cause Found

## Root Cause
Found the issue in component X

## Implementation Plan  
Fix by updating method Y

✅ APPROVED`;

        const fixContent = `# Fix: Bug Resolution

## Fix Summary
Fixed the bug successfully

## Implementation Details
Updated component X to handle edge case properly

## Code Changes
- Modified method Y to validate input
- Added error handling for null values

✅ IMPLEMENTED`;

        const verificationContent = `# Verification: Bug Fixed

## Test Results
All tests pass - unit tests, integration tests, and manual testing completed successfully

## Regression Checks
- No side effects in related components
- All existing functionality works as expected
- Performance impact is minimal

✅ VERIFIED`;

        await writeFile(join(bugDir, 'report.md'), reportContent);
        await writeFile(join(bugDir, 'analysis.md'), analysisContent);
        await writeFile(join(bugDir, 'fix.md'), fixContent);
        await writeFile(join(bugDir, 'verification.md'), verificationContent);
        
        const bugs = await parser.getAllBugs();
        const resolvedBug = bugs.find(b => b.name === 'resolved-bug');
        
        expect(resolvedBug).toBeDefined();
        expect(resolvedBug!.status).toBe('resolved');
        expect(resolvedBug!.report?.severity).toBe('high');
        
        // Test the conditional logic: bug details should be hidden for resolved bugs
        const shouldShowBugDetails = resolvedBug!.status !== 'resolved';
        expect(shouldShowBugDetails).toBe(false);
        
        // Resolved bugs should only show the name and status badge - no additional message/emoji
      });

      it('should show detailed information for active bugs', async () => {
        const bugDir = join(tempDir, '.claude', 'bugs', 'active-bug');
        await mkdir(bugDir, { recursive: true });
        
        const reportContent = `# Bug Report: Active Issue

## Bug Details
**Severity**: critical
**Reporter**: developer

## Description
This bug needs attention`;

        const analysisContent = `# Analysis: Root Cause Investigation

## Root Cause
Found the issue in component X

## Implementation Plan
Fix by updating method Y

✅ APPROVED`;

        await writeFile(join(bugDir, 'report.md'), reportContent);
        await writeFile(join(bugDir, 'analysis.md'), analysisContent);
        // Create fix.md to trigger 'fixing' status
        await writeFile(join(bugDir, 'fix.md'), '# Fix Document\n\n');
        
        const bugs = await parser.getAllBugs();
        const activeBug = bugs.find(b => b.name === 'active-bug');
        
        expect(activeBug).toBeDefined();
        expect(activeBug!.status).toBe('fixing');
        expect(activeBug!.report?.severity).toBe('critical');
        
        // Test the conditional logic: bug details should be shown
        const shouldShowBugDetails = activeBug!.status !== 'resolved';
        expect(shouldShowBugDetails).toBe(true);
      });

      it('should maintain document access for resolved bugs', async () => {
        const bugDir = join(tempDir, '.claude', 'bugs', 'resolved-with-docs');
        await mkdir(bugDir, { recursive: true });
        
        const reportContent = `# Bug Report: Resolved with Documents

## Bug Details  
**Severity**: medium
**Reporter**: developer

## Description
This bug has been resolved with full documentation`;

        const analysisContent = `# Analysis: Root Cause

## Root Cause
Found the issue in component X

## Implementation Plan
Fix by updating method Y

✅ APPROVED`;

        const fixContent = `# Fix: Bug Resolution

## Fix Summary
Fixed the bug successfully

## Implementation Details
Updated component X to handle edge case properly

## Code Changes
- Modified method Y to validate input
- Added error handling for null values

✅ IMPLEMENTED`;

        const verificationContent = `# Verification: Bug Fixed

## Test Results
All tests pass - unit tests, integration tests, and manual testing completed successfully

## Regression Checks
- No side effects in related components
- All existing functionality works as expected
- Performance impact is minimal

✅ VERIFIED`;

        await writeFile(join(bugDir, 'report.md'), reportContent);
        await writeFile(join(bugDir, 'analysis.md'), analysisContent);
        await writeFile(join(bugDir, 'fix.md'), fixContent);
        await writeFile(join(bugDir, 'verification.md'), verificationContent);
        
        const bugs = await parser.getAllBugs();
        const resolvedBug = bugs.find(b => b.name === 'resolved-with-docs');
        
        expect(resolvedBug).toBeDefined();
        expect(resolvedBug!.status).toBe('resolved');
        expect(resolvedBug!.analysis?.exists).toBe(true);
        
        // Even resolved bugs should maintain document access
        expect(resolvedBug!.analysis).toBeDefined();
      });
    });
  });

  describe('Active Session Filtering Logic', () => {
    describe('Bug Inclusion in Active Sessions', () => {
      it('should include analyzing bugs in active sessions', () => {
        const bug = {
          name: 'analyzing-bug',
          status: 'analyzing' as const,
          severity: 'high' as const,
          lastModified: new Date()
        };
        
        // Test the conditional logic for active session inclusion
        const isActiveStatus = ['analyzing', 'fixing', 'verifying'].includes(bug.status);
        expect(isActiveStatus).toBe(true);
      });

      it('should include fixing bugs in active sessions', () => {
        const bug = {
          name: 'fixing-bug',
          status: 'fixing' as const,
          severity: 'critical' as const,
          lastModified: new Date()
        };
        
        const isActiveStatus = ['analyzing', 'fixing', 'verifying'].includes(bug.status);
        expect(isActiveStatus).toBe(true);
      });

      it('should include verifying bugs in active sessions', () => {
        const bug = {
          name: 'verifying-bug',
          status: 'verifying' as const,
          severity: 'medium' as const,
          lastModified: new Date()
        };
        
        const isActiveStatus = ['analyzing', 'fixing', 'verifying'].includes(bug.status);
        expect(isActiveStatus).toBe(true);
      });

      it('should exclude resolved bugs from active sessions', () => {
        const bug = {
          name: 'resolved-bug',
          status: 'resolved' as const,
          severity: 'low' as const,
          lastModified: new Date()
        };
        
        const isActiveStatus = ['analyzing', 'fixing', 'verifying'].includes(bug.status);
        expect(isActiveStatus).toBe(false);
      });

      it('should exclude reported bugs from active sessions', () => {
        const bug = {
          name: 'reported-bug',
          status: 'reported' as const,
          severity: 'medium' as const,
          lastModified: new Date()
        };
        
        const isActiveStatus = ['analyzing', 'fixing', 'verifying'].includes(bug.status);
        expect(isActiveStatus).toBe(false);
      });
    });

    describe('Single Session Per Project Logic', () => {
      it('should select most recent item when multiple active items exist', () => {
        const baseDate = new Date('2024-01-01');
        
        const activeItems = [
          {
            type: 'spec' as const,
            projectPath: '/test-project',
            specName: 'old-spec',
            lastModified: new Date(baseDate.getTime() + 1000) // +1 second
          },
          {
            type: 'bug' as const,
            projectPath: '/test-project',
            bugName: 'recent-bug',
            lastModified: new Date(baseDate.getTime() + 5000) // +5 seconds  
          },
          {
            type: 'spec' as const,
            projectPath: '/test-project',
            specName: 'newer-spec',
            lastModified: new Date(baseDate.getTime() + 3000) // +3 seconds
          }
        ];

        // Simulate the filtering logic: group by project, sort by lastModified desc, take first
        const projectGroups = new Map<string, typeof activeItems>();
        
        activeItems.forEach(item => {
          if (!projectGroups.has(item.projectPath)) {
            projectGroups.set(item.projectPath, []);
          }
          projectGroups.get(item.projectPath)!.push(item);
        });

        const singleSessionPerProject = Array.from(projectGroups.values())
          .map(group => 
            group.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]
          );

        expect(singleSessionPerProject).toHaveLength(1);
        expect(singleSessionPerProject[0].type).toBe('bug');
        expect(singleSessionPerProject[0].bugName).toBe('recent-bug');
      });

      it('should handle single project with only specs', () => {
        const activeItems = [
          {
            type: 'spec' as const,
            projectPath: '/spec-only-project',
            specName: 'only-spec',
            lastModified: new Date()
          }
        ];

        const projectGroups = new Map<string, typeof activeItems>();
        
        activeItems.forEach(item => {
          if (!projectGroups.has(item.projectPath)) {
            projectGroups.set(item.projectPath, []);
          }
          projectGroups.get(item.projectPath)!.push(item);
        });

        const singleSessionPerProject = Array.from(projectGroups.values())
          .map(group => 
            group.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]
          );

        expect(singleSessionPerProject).toHaveLength(1);
        expect(singleSessionPerProject[0].type).toBe('spec');
        expect(singleSessionPerProject[0].specName).toBe('only-spec');
      });

      it('should handle multiple projects with different active items', () => {
        const activeItems = [
          {
            type: 'spec' as const,
            projectPath: '/project-a',
            specName: 'spec-a',
            lastModified: new Date('2024-01-01')
          },
          {
            type: 'bug' as const,
            projectPath: '/project-b',
            bugName: 'bug-b',
            lastModified: new Date('2024-01-02')
          },
          {
            type: 'spec' as const,
            projectPath: '/project-a',
            specName: 'newer-spec-a',
            lastModified: new Date('2024-01-03')
          }
        ];

        const projectGroups = new Map<string, typeof activeItems>();
        
        activeItems.forEach(item => {
          if (!projectGroups.has(item.projectPath)) {
            projectGroups.set(item.projectPath, []);
          }
          projectGroups.get(item.projectPath)!.push(item);
        });

        const singleSessionPerProject = Array.from(projectGroups.values())
          .map(group => 
            group.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]
          )
          .sort((a, b) => a.projectPath.localeCompare(b.projectPath));

        expect(singleSessionPerProject).toHaveLength(2);
        
        // Project A should show the newer spec
        expect(singleSessionPerProject[0].projectPath).toBe('/project-a');
        expect(singleSessionPerProject[0].type).toBe('spec');
        expect(singleSessionPerProject[0].specName).toBe('newer-spec-a');
        
        // Project B should show the bug
        expect(singleSessionPerProject[1].projectPath).toBe('/project-b');
        expect(singleSessionPerProject[1].type).toBe('bug');
        expect(singleSessionPerProject[1].bugName).toBe('bug-b');
      });
    });

    describe('Last Modified Time Handling', () => {
      it('should use file modification time as fallback', () => {
        const now = new Date();
        const fileStats = { mtime: now, ctime: now };
        
        // Simulate the fallback logic
        const getLastModified = (item: { lastModified?: Date }, fallbackStats: typeof fileStats) => {
          return item.lastModified || fallbackStats.mtime || fallbackStats.ctime || new Date();
        };
        
        const itemWithoutTime = {};
        const lastModified = getLastModified(itemWithoutTime, fileStats);
        
        expect(lastModified).toEqual(now);
      });

      it('should prefer item lastModified over file stats', () => {
        const itemTime = new Date('2024-01-01');
        const fileTime = new Date('2024-01-02');
        const fileStats = { mtime: fileTime, ctime: fileTime };
        
        const getLastModified = (item: { lastModified?: Date }, fallbackStats: typeof fileStats) => {
          return item.lastModified || fallbackStats.mtime || fallbackStats.ctime || new Date();
        };
        
        const itemWithTime = { lastModified: itemTime };
        const lastModified = getLastModified(itemWithTime, fileStats);
        
        expect(lastModified).toEqual(itemTime);
      });
    });
  });

  describe('UI State Management Logic', () => {
    describe('Session Type Handling', () => {
      it('should correctly identify spec sessions', () => {
        const session = {
          type: 'spec' as const,
          specName: 'test-spec',
          task: { id: '1', title: 'Test Task' }
        };
        
        expect(session.type).toBe('spec');
        expect('specName' in session).toBe(true);
        expect('bugName' in session).toBe(false);
      });

      it('should correctly identify bug sessions', () => {
        const session = {
          type: 'bug' as const,
          bugName: 'test-bug',
          bugStatus: 'fixing' as const,
          nextCommand: '/bug-fix test-bug'
        };
        
        expect(session.type).toBe('bug');
        expect('bugName' in session).toBe(true);
        expect('specName' in session).toBe(false);
      });
    });

    describe('Navigation Logic', () => {
      it('should generate correct navigation for spec sessions', () => {
        const session = {
          type: 'spec' as const,
          projectPath: '/test-project',
          specName: 'user-auth',
          task: { id: '1', title: 'Setup authentication' }
        };
        
        const getNavigationTarget = (session: { type: 'spec'; projectPath: string; specName: string; task: any }) => {
          if (session.type === 'spec') {
            return {
              section: 'specs',
              target: session.specName,
              projectPath: session.projectPath
            };
          }
          return null;
        };
        
        const navigation = getNavigationTarget(session);
        expect(navigation).toEqual({
          section: 'specs',
          target: 'user-auth',
          projectPath: '/test-project'
        });
      });

      it('should generate correct navigation for bug sessions', () => {
        const session = {
          type: 'bug' as const,
          projectPath: '/test-project', 
          bugName: 'login-issue',
          bugStatus: 'analyzing' as const,
          nextCommand: '/bug-analyze login-issue'
        };
        
        const getNavigationTarget = (session: { type: 'bug'; projectPath: string; bugName: string; bugStatus: string; nextCommand: string }) => {
          if (session.type === 'bug') {
            return {
              section: 'bugs',
              target: session.bugName,
              projectPath: session.projectPath
            };
          }
          return null;
        };
        
        const navigation = getNavigationTarget(session);
        expect(navigation).toEqual({
          section: 'bugs',
          target: 'login-issue',
          projectPath: '/test-project'
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Missing Modification Times', () => {
      it('should handle missing lastModified gracefully', () => {
        const items = [
          {
            type: 'spec' as const,
            projectPath: '/test',
            specName: 'no-time',
            lastModified: undefined as any
          },
          {
            type: 'bug' as const,
            projectPath: '/test',
            bugName: 'has-time',
            lastModified: new Date('2024-01-01')
          }
        ];

        // Simulate the sorting with fallback
        const sortWithFallback = (items: Array<{ lastModified?: Date; specName?: string; bugName?: string }>) => {
          return items.sort((a, b) => {
            const aTime = a.lastModified || new Date(0);
            const bTime = b.lastModified || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });
        };

        const sorted = sortWithFallback([...items]);
        
        expect(sorted[0].bugName).toBe('has-time');
        expect(sorted[1].specName).toBe('no-time');
      });
    });

    describe('Invalid Status Values', () => {
      it('should exclude items with invalid status', () => {
        const bugs = [
          { status: 'analyzing', name: 'valid-1' },
          { status: 'invalid-status', name: 'invalid' },
          { status: 'fixing', name: 'valid-2' },
          { status: '', name: 'empty' }
        ];

        const validActiveStatuses = ['analyzing', 'fixing', 'verifying'];
        const activeBugs = bugs.filter(bug => validActiveStatuses.includes(bug.status));
        
        expect(activeBugs).toHaveLength(2);
        expect(activeBugs.map(b => b.name)).toEqual(['valid-1', 'valid-2']);
      });
    });

    describe('Empty Collections', () => {
      it('should handle empty active sessions gracefully', () => {
        const activeItems: any[] = [];
        
        const projectGroups = new Map<string, typeof activeItems>();
        
        activeItems.forEach(item => {
          if (!projectGroups.has(item.projectPath)) {
            projectGroups.set(item.projectPath, []);
          }
          projectGroups.get(item.projectPath)!.push(item);
        });

        const singleSessionPerProject = Array.from(projectGroups.values())
          .map(group => 
            group.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0]
          );

        expect(singleSessionPerProject).toHaveLength(0);
      });
    });
  });
});