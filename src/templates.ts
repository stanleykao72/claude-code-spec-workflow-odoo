/**
 * Template definitions for spec-driven workflow
 * 
 * NOTE: This file previously contained function-based template generation.
 * As of the markdown conversion, all template content has been moved to 
 * individual markdown files in src/markdown/templates/
 * 
 * The setup system now reads directly from these markdown files instead
 * of calling functions from this module.
 */

// All template generation functions have been removed and replaced with
// individual markdown files in src/markdown/templates/
// 
// Available template files:
// - requirements-template.md
// - design-template.md
// - tasks-template.md
// - product-template.md
// - tech-template.md
// - structure-template.md
// - bug-report-template.md
// - bug-analysis-template.md
// - bug-verification-template.md

export const AVAILABLE_TEMPLATES = [
  'requirements-template.md',
  'design-template.md',
  'tasks-template.md',
  'product-template.md',
  'tech-template.md',
  'structure-template.md',
  'bug-report-template.md',
  'bug-analysis-template.md',
  'bug-verification-template.md'
] as const;

export type TemplateName = typeof AVAILABLE_TEMPLATES[number];