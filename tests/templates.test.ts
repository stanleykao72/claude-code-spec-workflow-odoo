import {
  getRequirementsTemplate,
  getDesignTemplate,
  getTasksTemplate,
  getProductTemplate,
  getTechTemplate,
  getStructureTemplate
} from '../src/templates';

describe('Template Functions', () => {
  describe('Existing Templates', () => {
    test('should return requirements template', () => {
      const template = getRequirementsTemplate();
      expect(template).toContain('# Requirements Document');
      expect(template).toContain('## Introduction');
      expect(template).toContain('User Story');
      expect(template).toContain('Acceptance Criteria');
    });

    test('should return design template', () => {
      const template = getDesignTemplate();
      expect(template).toContain('# Design Document');
      expect(template).toContain('## Overview');
      expect(template).toContain('## Architecture');
      expect(template).toContain('## Data Models');
    });

    test('should return tasks template', () => {
      const template = getTasksTemplate();
      expect(template).toContain('# Implementation Plan');
      expect(template).toContain('## Tasks');
      expect(template).toContain('_Requirements:');
    });
  });

  describe('Steering Templates', () => {
    test('should return product template', () => {
      const template = getProductTemplate();
      expect(template).toContain('# Product Overview');
      expect(template).toContain('## Product Purpose');
      expect(template).toContain('## Target Users');
      expect(template).toContain('## Key Features');
      expect(template).toContain('## Business Objectives');
      expect(template).toContain('## Success Metrics');
    });

    test('should return tech template', () => {
      const template = getTechTemplate();
      expect(template).toContain('# Technology Stack');
      expect(template).toContain('## Project Type');
      expect(template).toContain('## Core Technologies');
      expect(template).toContain('## Development Environment');
      expect(template).toContain('## Technical Requirements & Constraints');
    });

    test('should return structure template', () => {
      const template = getStructureTemplate();
      expect(template).toContain('# Project Structure');
      expect(template).toContain('## Directory Organization');
      expect(template).toContain('## Naming Conventions');
      expect(template).toContain('## Code Structure Patterns');
      expect(template).toContain('## Module Boundaries');
    });
  });

  describe('Language Agnostic Templates', () => {
    test('templates should not contain language-specific code', () => {
      const templates = [
        getRequirementsTemplate(),
        getDesignTemplate(),
        getTasksTemplate(),
        getProductTemplate(),
        getTechTemplate(),
        getStructureTemplate()
      ];

      // Check that templates don't have TypeScript-specific interface syntax
      templates.forEach(template => {
        expect(template).not.toMatch(/interface\s+\w+\s*{/);
      });
    });

    test('tech template should be project-type agnostic', () => {
      const template = getTechTemplate();
      // Should not assume web architecture
      expect(template).not.toContain('### Frontend');
      expect(template).not.toContain('### Backend');
      // Should ask about project type
      expect(template).toContain('Project Type');
      expect(template).toContain('[Describe what kind of project this is');
    });

    test('structure template should provide flexible examples', () => {
      const template = getStructureTemplate();
      // Should provide examples rather than prescriptive structure
      expect(template).toContain('Example for a library/package:');
      expect(template).toContain('Example for an application:');
      expect(template).toContain('[Define your project\'s directory structure');
    });
  });
});