import { SpecParser } from '../../src/dashboard/parser';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtemp, rm } from 'fs/promises';

describe('Bug Status Detection', () => {
  let tempDir: string;
  let parser: SpecParser;
  let bugsPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'test-bug-status-'));
    const claudeDir = join(tempDir, '.claude');
    bugsPath = join(claudeDir, 'bugs');
    await fs.mkdir(bugsPath, { recursive: true });
    
    parser = new SpecParser(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Bug workflow status transitions', () => {
    it('should not advance to analyzing status with empty analysis.md', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create report.md
      await fs.writeFile(join(bugPath, 'report.md'), `# Bug Report

## Bug Summary
Test bug summary

## Bug Details
Some details here
`);

      // Create empty analysis.md with just template
      await fs.writeFile(join(bugPath, 'analysis.md'), `# Bug Analysis

## Root Cause Analysis

### Investigation Summary
[What investigation steps were taken to understand this bug?]

### Root Cause
[What is the fundamental cause of this bug?]

## Implementation Plan

### Changes Required
[List the specific changes needed]
`);

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('reported'); // Should stay in reported status
      expect(bug?.analysis?.exists).toBe(true);
    });

    it('should advance to analyzing status with actual analysis content', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create report.md
      await fs.writeFile(join(bugPath, 'report.md'), `# Bug Report

## Bug Summary
Test bug summary
`);

      // Create analysis.md with actual content
      await fs.writeFile(join(bugPath, 'analysis.md'), `# Bug Analysis

## Root Cause Analysis

### Investigation Summary
Investigated the parser.ts file and found that bug status detection uses file existence checks instead of content validation.

### Root Cause
The bug workflow incorrectly advances through phases based solely on file existence rather than actual content completion.

## Implementation Plan

### Changes Required
1. Add content validation helper method
2. Update bug status transitions to check for actual content
`);

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('analyzing'); // Should advance to analyzing
    });

    it('should advance to fixing status only when analysis is approved', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create report.md
      await fs.writeFile(join(bugPath, 'report.md'), `# Bug Report

## Bug Summary
Test bug summary
`);

      // Create complete and approved analysis.md
      await fs.writeFile(join(bugPath, 'analysis.md'), `# Bug Analysis

## Root Cause Analysis

### Investigation Summary
Investigated the parser.ts file and found issues.

### Root Cause
The root cause has been identified.

## Implementation Plan

### Changes Required
1. Fix the issue

✅ APPROVED - Ready to proceed with the fix
`);

      // Create fix.md file to trigger 'fixing' status
      await fs.writeFile(join(bugPath, 'fix.md'), '# Fix Document\n\n');

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('fixing'); // Should advance to fixing
    });

    it('should not advance to verifying with empty verification.md', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create all files including empty verification
      await fs.writeFile(join(bugPath, 'report.md'), '# Bug Report\n\nContent');
      await fs.writeFile(join(bugPath, 'analysis.md'), `# Bug Analysis

## Root Cause Analysis
### Investigation Summary
Found the issue
### Root Cause
Bug identified

## Implementation Plan
### Changes Required
1. Fix it

✅ APPROVED`);
      
      // Create fix.md with actual content
      await fs.writeFile(join(bugPath, 'fix.md'), `# Fix Document

## Fix Summary
The bug has been fixed

## Implementation Details
Changes were made to fix the issue
`);
      
      // Create empty verification.md
      await fs.writeFile(join(bugPath, 'verification.md'), `# Bug Verification

## Test Results
[Describe test execution and results]

## Regression Testing
[List regression tests performed]
`);

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('fixed'); // Should be 'fixed' since fix has content but verification is empty
    });

    it('should advance to verifying with actual verification content', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create all files
      await fs.writeFile(join(bugPath, 'report.md'), '# Bug Report\n\nContent');
      await fs.writeFile(join(bugPath, 'analysis.md'), `# Bug Analysis

## Root Cause Analysis
### Investigation Summary
Found the issue
### Root Cause
Bug identified

## Implementation Plan
### Changes Required
1. Fix it

✅ APPROVED`);
      
      // Create verification.md with actual content
      await fs.writeFile(join(bugPath, 'verification.md'), `# Bug Verification

## Test Results
All tests passed successfully. The bug no longer reproduces.

## Regression Testing
Ran full test suite - no regressions found.
`);

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('verifying'); // Should advance to verifying
    });

    it('should advance to resolved when verification is complete', async () => {
      const bugName = 'test-bug';
      const bugPath = join(bugsPath, bugName);
      await fs.mkdir(bugPath, { recursive: true });

      // Create all files
      await fs.writeFile(join(bugPath, 'report.md'), '# Bug Report\n\nContent');
      await fs.writeFile(join(bugPath, 'analysis.md'), '# Analysis\n\nContent\n\n✅ APPROVED');
      await fs.writeFile(join(bugPath, 'verification.md'), `# Bug Verification

## Test Results
All tests passed.

## Regression Testing
No regressions found.

✅ VERIFIED - Bug is resolved
`);

      const bug = await parser.getBug(bugName);
      expect(bug).toBeDefined();
      expect(bug?.status).toBe('resolved'); // Should be resolved
    });
  });
});