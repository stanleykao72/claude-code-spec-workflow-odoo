import { readFileSync } from 'fs';
import { join } from 'path';
import { AVAILABLE_TEMPLATES } from '../src/templates';

// Helper function to read template content from markdown files
function getTemplateContent(templateName: string): string {
  const templatePath = join(__dirname, '..', 'src', 'markdown', 'templates', templateName);
  return readFileSync(templatePath, 'utf-8');
}

describe('Template Functions', () => {
  describe('Existing Templates', () => {
    test('should have requirements template', () => {
      const template = getTemplateContent('requirements-template.md');
      expect(template).toContain('# Requirements Document');
      expect(template).toContain('## Introduction');
      expect(template).toContain('User Story');
      expect(template).toContain('Acceptance Criteria');
    });

    test('should have design template', () => {
      const template = getTemplateContent('design-template.md');
      expect(template).toContain('# Design Document');
      expect(template).toContain('## Overview');
      expect(template).toContain('## Architecture');
      expect(template).toContain('## Data Models');
    });

    test('should have tasks template', () => {
      const template = getTemplateContent('tasks-template.md');
      expect(template).toContain('# Implementation Plan');
      expect(template).toContain('## Tasks');
      expect(template).toContain('_Requirements:');
    });
  });

  describe('Steering Templates', () => {
    test('should have product template', () => {
      const template = getTemplateContent('product-template.md');
      expect(template).toContain('# Product Overview');
      expect(template).toContain('## Product Purpose');
      expect(template).toContain('## Target Users');
      expect(template).toContain('## Key Features');
      expect(template).toContain('## Business Objectives');
      expect(template).toContain('## Success Metrics');
    });

    test('should have tech template', () => {
      const template = getTemplateContent('tech-template.md');
      expect(template).toContain('# Technology Stack');
      expect(template).toContain('## Project Type');
      expect(template).toContain('## Core Technologies');
      expect(template).toContain('## Development Environment');
      expect(template).toContain('## Technical Requirements & Constraints');
    });

    test('should have structure template', () => {
      const template = getTemplateContent('structure-template.md');
      expect(template).toContain('# Project Structure');
      expect(template).toContain('## Directory Organization');
      expect(template).toContain('## Naming Conventions');
      expect(template).toContain('## Code Structure Patterns');
      expect(template).toContain('## Module Boundaries');
    });
  });

  describe('Language Agnostic Templates', () => {
    test('templates should not contain language-specific code', () => {
      const templateContents = [
        getTemplateContent('requirements-template.md'),
        getTemplateContent('design-template.md'),
        getTemplateContent('tasks-template.md'),
        getTemplateContent('product-template.md'),
        getTemplateContent('tech-template.md'),
        getTemplateContent('structure-template.md')
      ];

      // Check that templates don't have TypeScript-specific interface syntax
      templateContents.forEach(template => {
        expect(template).not.toMatch(/interface\s+\w+\s*{/);
      });
    });

    test('tech template should be project-type agnostic', () => {
      const template = getTemplateContent('tech-template.md');
      // Should not assume web architecture
      expect(template).not.toContain('### Frontend');
      expect(template).not.toContain('### Backend');
      // Should ask about project type
      expect(template).toContain('Project Type');
      expect(template).toContain('[Describe what kind of project this is');
    });

    test('structure template should provide flexible examples', () => {
      const template = getTemplateContent('structure-template.md');
      // Should provide examples rather than prescriptive structure
      expect(template).toContain('Example for a library/package:');
      expect(template).toContain('Example for an application:');
      expect(template).toContain('[Define your project\'s directory structure');
    });
  });

  describe('Template List Exports', () => {
    test('should export list of available templates', () => {
      expect(AVAILABLE_TEMPLATES).toContain('requirements-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('design-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('tasks-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('product-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('tech-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('structure-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('bug-report-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('bug-analysis-template.md');
      expect(AVAILABLE_TEMPLATES).toContain('bug-verification-template.md');
    });

    test('all template files should exist', () => {
      AVAILABLE_TEMPLATES.forEach(templateName => {
        expect(() => getTemplateContent(templateName)).not.toThrow();
      });
    });
  });
});