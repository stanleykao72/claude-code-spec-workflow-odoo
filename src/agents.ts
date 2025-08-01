/**
 * Agent definitions for spec-driven workflow
 * 
 * NOTE: This file previously contained function-based agent definitions.
 * As of the markdown conversion, key agent definitions have been moved to 
 * individual markdown files in src/markdown/agents/
 * 
 * The setup system now reads directly from these markdown files instead
 * of calling functions from this module.
 */

export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
}

// Key agent definitions have been extracted to markdown files in src/markdown/agents/
// 
// Extracted agent files (4/15):
// - spec-requirements-validator.md
// - spec-design-validator.md
// - spec-task-validator.md
// - spec-task-executor.md

export const EXTRACTED_AGENTS = [
  'spec-requirements-validator',
  'spec-design-validator', 
  'spec-task-validator',
  'spec-task-executor'
] as const;

// Remaining agent definitions that could be extracted in the future:
// - spec-task-implementation-reviewer
// - spec-integration-tester
// - spec-completion-reviewer
// - bug-root-cause-analyzer
// - steering-document-updater
// - spec-dependency-analyzer
// - spec-test-generator
// - spec-documentation-generator
// - spec-performance-analyzer
// - spec-duplication-detector
// - spec-breaking-change-detector

export type ExtractedAgentName = typeof EXTRACTED_AGENTS[number];

/**
 * Generate agent definition file content in Markdown with YAML frontmatter format
 */
export function getAgentDefinitionFileContent(agent: AgentDefinition): string {
  return `---
name: ${agent.name}
description: ${agent.description}
---

${agent.systemPrompt}`;
}