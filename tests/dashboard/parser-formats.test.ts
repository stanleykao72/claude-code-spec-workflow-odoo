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
      
      // Should extract US and FR as requirements (AC entries are filtered out)
      const reqContent = spec!.requirements!.content!;
      expect(reqContent.length).toBeGreaterThanOrEqual(4); // US-1, US-2, FR-1, FR-2
      
      // Check User Story extraction
      const us1 = reqContent.find(r => r.id === 'US-1');
      expect(us1).toBeDefined();
      expect(us1!.title).toBe('Lead Generator Authentication');
      expect(us1!.userStory).toContain('**As a** lead generator');
      
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
      expect(spec!.requirements!.content!.length).toBeGreaterThanOrEqual(3);
      
      // Should find both old and new format requirements
      const oldReq = spec!.requirements!.content!.find(r => r.id === '1');
      const newFR = spec!.requirements!.content!.find(r => r.id === 'FR-1');
      const newUS = spec!.requirements!.content!.find(r => r.id === 'US-1');
      
      expect(oldReq).toBeDefined();
      expect(newFR).toBeDefined();
      expect(newUS).toBeDefined();
    });
  });
});