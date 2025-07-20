export function getSpecCreateCommand(): string {
  return `# Spec Create Command

Create a new feature specification following the spec-driven workflow.

## Usage
\`\`\`
/spec-create <feature-name> [description]
\`\`\`

## Instructions
You are helping create a new feature specification. Follow these steps:

**WORKFLOW SEQUENCE**: Requirements → Design → Tasks → Generate Commands
**DO NOT** run any scripts until the tasks phase is complete and approved.

1. **Create Directory Structure**
   - Create \`.claude/specs/{feature-name}/\` directory
   - Initialize empty requirements.md, design.md, and tasks.md files

2. **Parse Feature Description**
   - Take the feature name and optional description
   - Begin the requirements gathering phase immediately
   - Do not ask sequential questions - generate initial requirements

3. **Generate Initial Requirements**
   - Use the requirements template from \`.claude/templates/requirements-template.md\`
   - Create user stories in "As a [role], I want [feature], so that [benefit]" format
   - Write acceptance criteria in EARS format (WHEN/IF/THEN statements)
   - Consider edge cases and technical constraints

4. **Request User Approval**
   - Present the requirements document
   - Ask: "Do the requirements look good? If so, we can move on to the design."
   - Wait for explicit approval before proceeding

5. **Complete Requirements Phase**
   - Present the requirements document
   - Wait for explicit approval
   - **DO NOT** run any scripts yet
   - **NEXT STEP**: Proceed to \`/spec-design\` phase

6. **Rules**
   - Only create ONE spec at a time
   - Always use kebab-case for feature names
   - Follow the exact EARS format for acceptance criteria
   - Do not proceed without explicit user approval
   - **DO NOT** run scripts during /spec-create - only create requirements

## Example
\`\`\`
/spec-create user-authentication "Allow users to sign up and log in securely"
\`\`\`

## Next Steps
After user approval, proceed to \`/spec-design\` phase.
`;
}

export function getSpecRequirementsCommand(): string {
  return `# Spec Requirements Command

Generate or update requirements document for an existing spec.

## Usage
\`\`\`
/spec-requirements [feature-name]
\`\`\`

## Instructions
You are working on the requirements phase of the spec workflow.

1. **Identify Current Spec**
   - If no feature-name provided, look for specs in \`.claude/specs/\` directory
   - If multiple specs exist, ask user to specify which one
   - Load existing requirements.md if it exists

2. **Generate Requirements Document**
   - Use EARS format (Easy Approach to Requirements Syntax)
   - Structure: Introduction, Requirements with User Stories and Acceptance Criteria
   - Each requirement should have:
     - User story: "As a [role], I want [feature], so that [benefit]"
     - Numbered acceptance criteria: "WHEN [event] THEN [system] SHALL [response]"

3. **Content Guidelines**
   - Consider edge cases and error handling
   - Include non-functional requirements (performance, security, etc.)
   - Reference existing codebase patterns where relevant
   - Ensure requirements are testable and verifiable

4. **Approval Process**
   - Present the complete requirements document
   - Ask: "Do the requirements look good? If so, we can move on to the design."
   - Make revisions based on feedback
   - Continue until explicit approval is received

## Requirements Format
\`\`\`markdown
# Requirements Document

## Introduction
[Brief summary of the feature]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. IF [condition] THEN [system] SHALL [response]
\`\`\`

## Next Phase
After approval, proceed to \`/spec-design\`.
`;
}

export function getSpecDesignCommand(): string {
  return `# Spec Design Command

Generate design document based on approved requirements.

## Usage
\`\`\`
/spec-design [feature-name]
\`\`\`

## Instructions
You are working on the design phase of the spec workflow.

1. **Prerequisites**
   - Ensure requirements.md exists and is approved
   - Load the requirements document for context
   - Research existing codebase patterns and architecture

2. **Generate Design Document**
   - Create comprehensive design following the template
   - Include all required sections:
     - Overview
     - Architecture
     - Components and Interfaces
     - Data Models
     - Error Handling
     - Testing Strategy

3. **Research Phase**
   - Analyze existing codebase for patterns
   - Identify integration points
   - Research technical dependencies
   - Consider scalability and maintainability

4. **Design Content**
   - Use Mermaid diagrams for visual representations
   - Define clear interfaces and contracts
   - Specify data models and validation rules
   - Plan error handling and edge cases
   - Outline testing approach

5. **Approval Process**
   - Present the complete design document
   - Ask: "Does the design look good? If so, we can move on to the implementation plan."
   - Incorporate feedback and revisions
   - Continue until explicit approval

## Design Structure
\`\`\`markdown
# Design Document

## Overview
[High-level description]

## Architecture
[System architecture and patterns]

## Components and Interfaces
[Detailed component specifications]

## Data Models
[Data structures and validation]

## Error Handling
[Error scenarios and responses]

## Testing Strategy
[Testing approach and coverage]
\`\`\`

## Next Phase
After approval, proceed to \`/spec-tasks\`.
`;
}

export function getSpecTasksCommand(): string {
  return `# Spec Tasks Command

Generate implementation task list based on approved design.

## Usage
\`\`\`
/spec-tasks [feature-name]
\`\`\`

## Instructions
You are working on the tasks phase of the spec workflow.

**WORKFLOW**: This is the FINAL step before command generation.
**SEQUENCE**: Create Tasks → Get Approval → THEN run script
**DO NOT** run any scripts until tasks are approved.

1. **Prerequisites**
   - Ensure design.md exists and is approved
   - Load both requirements.md and design.md for context
   - Understand the complete feature scope

2. **Generate Task List**
   - Break design into atomic, executable coding tasks
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

3. **Task Guidelines**
   - Tasks should be concrete and actionable
   - Include specific file names and components
   - Build incrementally (each task builds on previous)
   - Reference requirements using _Requirements: X.Y_ format
   - Use test-driven development approach

4. **Task Format**
   \`\`\`markdown
   - [ ] 1. Task description
     - Sub-bullet with details
     - Specific files to create/modify
     - _Requirements: 1.1, 2.3_
   \`\`\`

5. **Excluded Tasks**
   - User acceptance testing
   - Deployment to production
   - Performance metrics gathering
   - User training or documentation
   - Business process changes

6. **Approval Process**
   - Present the complete task list
   - Ask: "Do the tasks look good?"
   - Make revisions based on feedback
   - Continue until explicit approval

7. **Generate Task Commands** (ONLY after tasks approval)
   - **WAIT**: Do not run script until user explicitly approves tasks
   - **THEN EXECUTE**: \`./.claude/scripts/generate-commands-launcher.sh {feature-name}\`
   - **PURPOSE**: Creates individual task commands in \`.claude/commands/{feature-name}/\`
   - **RESULT**: Each task gets its own command: \`/{feature-name}-task-{task-id}\`
   - **EXAMPLE**: Creates \`/{feature-name}-task-1\`, \`/{feature-name}-task-2.1\`, etc.
   - **IMPORTANT**: Do NOT edit the scripts - just run them as-is
   - **PLATFORM**: Automatically detects OS and runs appropriate script (Windows/macOS/Linux)
   - **RESTART REQUIRED**: Inform user to restart Claude Code for new commands to be visible

## Task Structure
\`\`\`markdown
# Implementation Plan

- [ ] 1. Setup project structure
  - Create directory structure
  - Define core interfaces
  - _Requirements: 1.1_

- [ ] 2. Implement data models
- [ ] 2.1 Create base model classes
  - Define validation methods
  - Write unit tests
  - _Requirements: 2.1, 2.2_
\`\`\`

## Next Phase
After approval and command generation:
1. **RESTART Claude Code** for new commands to be visible
2. Then you can:
   - Use \`/spec-execute\` to implement tasks
   - Use individual task commands: \`/{feature-name}-task-1\`, \`/{feature-name}-task-2\`, etc.
   - Check progress with \`/spec-status {feature-name}\`
`;
}

export function getSpecExecuteCommand(): string {
  return `# Spec Execute Command

Execute specific tasks from the approved task list.

## Usage
\`\`\`
/spec-execute [task-id] [feature-name]
\`\`\`

## Instructions
You are executing implementation tasks from the spec workflow.

1. **Prerequisites**
   - Ensure tasks.md exists and is approved
   - Load requirements.md, design.md, and tasks.md for context
   - Identify the specific task to execute

2. **Task Execution**
   - Focus on ONE task at a time
   - If task has sub-tasks, start with those
   - Follow the implementation details from design.md
   - Verify against requirements specified in the task

3. **Implementation Guidelines**
   - Write clean, maintainable code
   - Follow existing code patterns and conventions
   - Include appropriate error handling
   - Add unit tests where specified
   - Document complex logic

4. **Validation**
   - Verify implementation meets acceptance criteria
   - Run tests if they exist
   - Check for lint/type errors
   - Ensure integration with existing code

5. **Completion**
   - **CRITICAL**: Mark task as complete in tasks.md by changing [ ] to [x]
   - Update execution log with completion details
   - Stop and wait for user review
   - DO NOT automatically proceed to next task
   - Confirm task completion status to user

## Task Selection
If no task-id specified:
- Look at tasks.md for the spec
- Recommend the next pending task
- Ask user to confirm before proceeding

## Examples
\`\`\`
/spec-execute 1 user-authentication
/spec-execute 2.1 user-authentication
\`\`\`

## Important Rules
- Only execute ONE task at a time
- **ALWAYS** mark completed tasks as [x] in tasks.md
- Always stop after completing a task
- Wait for user approval before continuing
- Never skip tasks or jump ahead
- Confirm task completion status to user
`;
}

export function getSpecStatusCommand(): string {
  return `# Spec Status Command

Show current status of all specs or a specific spec.

## Usage
\`\`\`
/spec-status [feature-name]
\`\`\`

## Instructions
Display the current status of spec workflows.

1. **If no feature-name provided:**
   - List all specs in \`.claude/specs/\` directory
   - Show current phase for each spec
   - Display completion status

2. **If feature-name provided:**
   - Show detailed status for that spec
   - Display current workflow phase
   - Show completed vs pending tasks
   - List next recommended actions

3. **Status Information:**
   - Requirements: [Complete/In Progress/Pending]
   - Design: [Complete/In Progress/Pending]
   - Tasks: [Complete/In Progress/Pending]
   - Implementation: [X/Y tasks complete]

4. **Output Format:**
   \`\`\`
   Spec: user-authentication
   Phase: Implementation
   Progress: Requirements ✅ | Design ✅ | Tasks ✅
   Implementation: 3/8 tasks complete
   Next: Execute task 4 - "Implement password validation"
   \`\`\`

## Workflow Phases
- **Requirements**: Gathering and documenting requirements
- **Design**: Creating technical design and architecture
- **Tasks**: Breaking down into implementation tasks
- **Implementation**: Executing individual tasks
- **Complete**: All tasks finished and integrated
`;
}

export function getSpecListCommand(): string {
  return `# Spec List Command

List all specs in the current project.

## Usage
\`\`\`
/spec-list
\`\`\`

## Instructions
Display a comprehensive list of all specs in the project.

1. **Scan Directory**
   - Look in \`.claude/specs/\` directory
   - Find all spec directories
   - Check for required files (requirements.md, design.md, tasks.md)

2. **Display Information**
   - Feature name
   - Current phase
   - Completion status
   - Last modified date
   - Brief description from requirements

3. **Output Format**
   \`\`\`
   📋 Project Specs Overview

   1. user-authentication (Complete)
      Phase: Implementation (7/8 tasks)
      Last updated: 2025-01-15

   2. data-export (In Progress)
      Phase: Design
      Last updated: 2025-01-14

   3. notification-system (Planning)
      Phase: Requirements
      Last updated: 2025-01-13
   \`\`\`

4. **Additional Actions**
   - Show total spec count
   - Highlight specs needing attention
   - Suggest next actions for each spec
`;
}