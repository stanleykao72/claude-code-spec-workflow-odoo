import { SpecParser } from '../../src/dashboard/parser';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SpecParser Format Support', () => {
  let tempDir: string;
  let parser: SpecParser;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'parser-test-'));
    parser = new SpecParser(tempDir);
    
    // Create .claude/specs directory
    await mkdir(join(tempDir, '.claude', 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Old Format Support', () => {
    it('should parse requirements in old format', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'test-spec');
      await mkdir(specDir, { recursive: true });
      
      const oldFormatContent = `# Requirements: Test Feature

## Requirements

### Requirement 1: User Authentication
**User Story:** As a user, I want to log in securely, so that I can access my data

#### Acceptance Criteria
1. WHEN user enters valid credentials THEN system authenticates
2. IF credentials are invalid THEN show error message

### Requirement 2: Data Display
**User Story:** As a user, I want to see my data, so that I can make decisions

#### Acceptance Criteria
- WHEN user logs in THEN display dashboard
- IF no data exists THEN show empty state

## Status

✅ APPROVED`;

      await writeFile(join(specDir, 'requirements.md'), oldFormatContent);
      
      const spec = await parser.getSpec('test-spec');
      
      expect(spec).not.toBeNull();
      expect(spec!.requirements!.exists).toBe(true);
      expect(spec!.requirements!.userStories).toBe(2);
      expect(spec!.requirements!.approved).toBe(true);
      expect(spec!.requirements!.content).toHaveLength(2);
      
      const req1 = spec!.requirements!.content![0];
      expect(req1.id).toBe('1');
      expect(req1.title).toBe('User Authentication');
      expect(req1.userStory).toBe('As a user, I want to log in securely, so that I can access my data');
      expect(req1.acceptanceCriteria).toHaveLength(2);
    });
  });

  describe('New Format Support', () => {
    it('should parse requirements in new format', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'new-spec');
      await mkdir(specDir, { recursive: true });
      
      const newFormatContent = `# Requirements: Public Disposition API

## Overview
Create a public API endpoint for lead generators.

## User Stories

### US-1: Lead Generator Authentication
**As a** lead generator  
**I want** to authenticate using only my leadgen key  
**So that** I can securely access information about my referred leads

### US-2: Lead Status Retrieval
**As a** lead generator  
**I want** to retrieve comprehensive status information  
**So that** I can track progress

## Functional Requirements

### FR-1: Authentication
- The API must authenticate requests using leadgen key
- Keys must be validated against database

### FR-2: Lead Data Retrieval
The API must return lead information

## Acceptance Criteria

### AC-1: Authentication Flow
**GIVEN** a lead generator with a valid key  
**WHEN** they make an API request  
**THEN** the system authenticates and returns data

**GIVEN** an invalid key  
**WHEN** the API processes the request  
**THEN** it returns 401 Unauthorized

## Status

✅ APPROVED`;

      await writeFile(join(specDir, 'requirements.md'), newFormatContent);
      
      const spec = await parser.getSpec('new-spec');
      
      expect(spec).not.toBeNull();
      expect(spec!.requirements!.exists).toBe(true);
      expect(spec!.requirements!.userStories).toBe(2);
      expect(spec!.requirements!.approved).toBe(true);
      
      // Should extract only FR and NFR as requirements (US and AC entries are filtered out)
      const reqContent = spec!.requirements!.content!;
      expect(reqContent.length).toBeGreaterThanOrEqual(2); // FR-1, FR-2 (NFR entries if present)
      
      // US entries should be filtered out (they're user stories, not requirements)
      const us1 = reqContent.find(r => r.id === 'US-1');
      expect(us1).toBeUndefined();
      
      // Check Functional Requirement
      const fr1 = reqContent.find(r => r.id === 'FR-1');
      expect(fr1).toBeDefined();
      expect(fr1!.title).toBe('Authentication');
      
      // AC entries should be filtered out
      const ac1 = reqContent.find(r => r.id === 'AC-1');
      expect(ac1).toBeUndefined();
    });

    it('should count user stories correctly in new format', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'story-spec');
      await mkdir(specDir, { recursive: true });
      
      const content = `# Requirements

## User Stories

### US-1: First Story
**As a** user  
**I want** feature one  
**So that** benefit one

### US-2: Second Story
**As a** admin  
**I want** feature two  
**So that** benefit two

### US-3: Third Story
**As a** guest  
**I want** feature three  
**So that** benefit three`;

      await writeFile(join(specDir, 'requirements.md'), content);
      
      const spec = await parser.getSpec('story-spec');
      
      expect(spec).not.toBeNull();
      expect(spec!.requirements!.userStories).toBe(3);
    });
  });

  describe('Mixed Format Support', () => {
    it('should handle documents with both formats', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'mixed-spec');
      await mkdir(specDir, { recursive: true });
      
      const mixedContent = `# Requirements: Mixed Format

## Requirements

### Requirement 1: Legacy Feature
**User Story:** As a user, I want legacy support

### FR-1: New Style Requirement
- Must support new format
- Must be backwards compatible

### US-1: New Style Story
**As a** developer  
**I want** both formats to work  
**So that** migration is smooth

## Status
✅ APPROVED`;

      await writeFile(join(specDir, 'requirements.md'), mixedContent);
      
      const spec = await parser.getSpec('mixed-spec');
      
      expect(spec).not.toBeNull();
      expect(spec!.requirements!.exists).toBe(true);
      expect(spec!.requirements!.content!.length).toBeGreaterThanOrEqual(2); // Only old req + FR-1
      
      // Should find both old and new format requirements, but not user stories
      const oldReq = spec!.requirements!.content!.find(r => r.id === '1');
      const newFR = spec!.requirements!.content!.find(r => r.id === 'FR-1');
      const newUS = spec!.requirements!.content!.find(r => r.id === 'US-1');
      
      expect(oldReq).toBeDefined();
      expect(newFR).toBeDefined();
      expect(newUS).toBeUndefined(); // US entries are user stories, not requirements
    });
  });
  
  describe('Code Reuse Analysis Parsing', () => {
    it('should parse old format code reuse analysis', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'reuse-old');
      await mkdir(specDir, { recursive: true });
      
      const content = `# Design: Test Feature

## Code Reuse Analysis

1. **Configuration Infrastructure**
   - Use existing ConfigLoader class
   - Leverage validation utilities
   
2. **Database Access**
   - Reuse existing repository patterns
   - Use shared connection pool

## Other Section`;

      await writeFile(join(specDir, 'design.md'), content);
      
      const spec = await parser.getSpec('reuse-old');
      
      expect(spec).not.toBeNull();
      expect(spec!.design!.hasCodeReuseAnalysis).toBe(true);
      expect(spec!.design!.codeReuseContent).toHaveLength(2);
      expect(spec!.design!.codeReuseContent![0].title).toBe('Configuration Infrastructure');
      expect(spec!.design!.codeReuseContent![0].items).toHaveLength(2);
    });
    
    it('should parse new format code reuse section', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'reuse-new');
      await mkdir(specDir, { recursive: true });
      
      const content = `# Design: Public API

## Architecture

Some architecture details...

### Existing Components to Reuse
1. **PhenixServlet**: Base servlet class for consistent error handling
2. **LeadGen.withApiKey()**: Existing authentication query
3. **Potion ORM patterns**: For database access
4. **Lead entity relationships**: Contact, Campaign associations
5. **JSON utilities**: JsonMap for response building

### New Components Required
1. **Stage mapping**: Utility to map Heat enum`;

      await writeFile(join(specDir, 'design.md'), content);
      
      const spec = await parser.getSpec('reuse-new');
      
      expect(spec).not.toBeNull();
      expect(spec!.design!.hasCodeReuseAnalysis).toBe(true);
      expect(spec!.design!.codeReuseContent).toHaveLength(5);
      expect(spec!.design!.codeReuseContent![0].title).toBe('PhenixServlet');
      expect(spec!.design!.codeReuseContent![0].items).toContain('Base servlet class for consistent error handling');
    });
  });
  
  describe('Title Extraction', () => {
    it('should extract title without document type prefix', async () => {
      const specDir = join(tempDir, '.claude', 'specs', 'api-spec');
      await mkdir(specDir, { recursive: true });
      
      // Requirements with prefix
      await writeFile(join(specDir, 'requirements.md'), `# Requirements: Public Disposition API

## Overview
Test content`);

      // Design with prefix
      await writeFile(join(specDir, 'design.md'), `# Design: Public Disposition API

## Overview
Test content`);

      // Tasks with prefix
      await writeFile(join(specDir, 'tasks.md'), `# Implementation Plan: Public Disposition API

## Tasks
- [ ] Task 1`);

      const spec = await parser.getSpec('api-spec');
      
      expect(spec).not.toBeNull();
      expect(spec!.displayName).toBe('Public Disposition API');
      expect(spec!.displayName).not.toContain('Requirements:');
      expect(spec!.displayName).not.toContain('Design:');
      expect(spec!.displayName).not.toContain('Implementation Plan:');
    });
  });
});