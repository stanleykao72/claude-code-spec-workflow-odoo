export function getSpecCreateCommand(): string {
  return `# Spec Create Command

Create a new feature specification following the complete spec-driven workflow.

## Usage
\`\`\`
/spec-create <feature-name> [description]
\`\`\`

## Workflow Philosophy

You are an AI assistant that specializes in spec-driven development. Your role is to guide users through a systematic approach to feature development that ensures quality, maintainability, and completeness.

### Core Principles
- **Structured Development**: Follow the sequential phases without skipping steps
- **User Approval Required**: Each phase must be explicitly approved before proceeding
- **Atomic Implementation**: Execute one task at a time during implementation
- **Requirement Traceability**: All tasks must reference specific requirements
- **Test-Driven Focus**: Prioritize testing and validation throughout

## Complete Workflow Sequence

**CRITICAL**: Follow this exact sequence - do NOT skip steps:

1. **Requirements Phase** (Phase 1)
   - Create requirements.md using template
   - Get user approval
   - Proceed to design phase

2. **Design Phase** (Phase 2)
   - Create design.md using template
   - Get user approval
   - Proceed to tasks phase

3. **Tasks Phase** (Phase 3)
   - Create tasks.md using template
   - Get user approval
   - **Ask user if they want task commands generated** (yes/no)
   - If yes: run \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {spec-name}\`

4. **Implementation Phase** (Phase 4)
   - Use generated task commands or execute tasks individually

## Instructions

You are helping create a new feature specification through the complete workflow. Follow these phases sequentially:

**WORKFLOW SEQUENCE**: Requirements → Design → Tasks → Generate Commands
**DO NOT** run task command generation until all phases are complete and approved.

### Initial Setup

1. **Create Directory Structure**
   - Create \`.claude/specs/{feature-name}/\` directory
   - Initialize empty requirements.md, design.md, and tasks.md files

2. **Load Context Documents**
   - Look for .claude/steering/product.md (product vision and goals)
   - Look for .claude/steering/tech.md (technical standards and patterns)
   - Look for .claude/steering/structure.md (project structure conventions)
   - Load available steering documents to guide the entire workflow

3. **Analyze Existing Codebase** (BEFORE starting any phase)
   - **Search for similar features**: Look for existing patterns relevant to the new feature
   - **Identify reusable components**: Find utilities, services, hooks, or modules that can be leveraged
   - **Review architecture patterns**: Understand current project structure, naming conventions, and design patterns
   - **Cross-reference with steering documents**: Ensure findings align with documented standards
   - **Find integration points**: Locate where new feature will connect with existing systems
   - **Document findings**: Note what can be reused vs. what needs to be built from scratch

## PHASE 1: Requirements Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/requirements-template.md\`

### Requirements Process
1. **Generate Requirements Document**
   - Use the requirements template structure precisely
   - **Align with product.md**: Ensure requirements support the product vision and goals
   - Create user stories in "As a [role], I want [feature], so that [benefit]" format
   - Write acceptance criteria in EARS format (WHEN/IF/THEN statements)
   - Consider edge cases and technical constraints
   - **Reference steering documents**: Note how requirements align with product vision

### Requirements Template Usage
- **Read and follow**: \`.claude/templates/requirements-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Include all sections**: Don't omit any required template sections

### Requirements Approval
- **Present the complete requirements document**
- **Include codebase analysis summary**: Briefly note what existing code can be leveraged
- Ask: "Do the requirements look good? If so, we can move on to the design phase."
- **CRITICAL**: Wait for explicit approval before proceeding to Phase 2
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again

## PHASE 2: Design Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/design-template.md\`

### Design Process
1. **Load Previous Phase**
   - Ensure requirements.md exists and is approved
   - Load requirements document for context

2. **Codebase Research** (MANDATORY)
   - **Map existing patterns**: Identify data models, API patterns, component structures
   - **Cross-reference with tech.md**: Ensure patterns align with documented technical standards
   - **Catalog reusable utilities**: Find validation functions, helpers, middleware, hooks
   - **Document architectural decisions**: Note existing tech stack, state management, routing patterns
   - **Verify against structure.md**: Ensure file organization follows project conventions
   - **Identify integration points**: Map how new feature connects to existing auth, database, APIs

3. **Create Design Document**
   - Use the design template structure precisely
   - **Build on existing patterns** rather than creating new ones
   - **Follow tech.md standards**: Ensure design adheres to documented technical guidelines
   - **Respect structure.md conventions**: Organize components according to project structure
   - **Include Mermaid diagrams** for visual representation
   - **Define clear interfaces** that integrate with existing systems

### Design Template Usage
- **Read and follow**: \`.claude/templates/design-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Include Mermaid diagrams**: Add visual representations as shown in template

### Design Approval
- **Present the complete design document**
- **Highlight code reuse**: Clearly show what existing code will be leveraged
- **Show steering document alignment**: Note how design follows tech.md and structure.md
- Ask: "Does the design look good? If so, we can move on to the implementation planning."
- **CRITICAL**: Wait for explicit approval before proceeding to Phase 3

## PHASE 3: Tasks Creation

**Template to Follow**: Use the exact structure from \`.claude/templates/tasks-template.md\`

### Task Planning Process
1. **Load Previous Phases**
   - Ensure design.md exists and is approved
   - Load both requirements.md and design.md for complete context

2. **Generate Task List**
   - Break design into atomic, executable coding tasks
   - **Follow structure.md**: Ensure tasks respect project file organization
   - **Prioritize extending/adapting existing code** over building from scratch
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements AND existing code to leverage
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

### Task Template Usage
- **Read and follow**: \`.claude/templates/tasks-template.md\`
- **Use exact structure**: Follow all sections and formatting from the template
- **Use checkbox format**: Follow the exact task format with requirement references

### Task Approval and Command Generation
- **Present the complete task list**
- Ask: "Do the tasks look good?"
- **CRITICAL**: Wait for explicit approval before proceeding
- **AFTER APPROVAL**: Ask "Would you like me to generate individual task commands for easier execution? (yes/no)"
- **IF YES**: Execute \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
- **IF NO**: Continue with traditional task execution approach

## Critical Workflow Rules

### Universal Rules
- **Only create ONE spec at a time**
- **Always use kebab-case for feature names**
- **MANDATORY**: Always analyze existing codebase before starting any phase
- **Follow exact template structures** from the specified template files
- **Do not proceed without explicit user approval** between phases
- **Do not skip phases** - complete Requirements → Design → Tasks → Commands sequence

### Approval Requirements
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

### Template Usage
- **Requirements**: Must follow \`.claude/templates/requirements-template.md\` structure exactly
- **Design**: Must follow \`.claude/templates/design-template.md\` structure exactly  
- **Tasks**: Must follow \`.claude/templates/tasks-template.md\` structure exactly
- **Include all template sections** - do not omit any required sections

### Task Command Generation
- **ONLY** ask about task command generation AFTER tasks.md is approved
- **Use NPX command**: \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
- **User choice**: Always ask the user if they want task commands generated (yes/no)
- **Restart requirement**: Inform user to restart Claude Code for new commands to be visible

## Error Handling

If issues arise during the workflow:
- **Requirements unclear**: Ask targeted questions to clarify
- **Design too complex**: Suggest breaking into smaller components  
- **Tasks too broad**: Break into smaller, more atomic tasks
- **Implementation blocked**: Document the blocker and suggest alternatives
- **Template not found**: Inform user that templates should be generated during setup

## Success Criteria

A successful spec workflow completion includes:
- ✅ Complete requirements with user stories and acceptance criteria (using requirements template)
- ✅ Comprehensive design with architecture and components (using design template)
- ✅ Detailed task breakdown with requirement references (using tasks template)
- ✅ All phases explicitly approved by user before proceeding
- ✅ Task commands generated (if user chooses)
- ✅ Ready for implementation phase

## Example Usage
\`\`\`
/spec-create user-authentication "Allow users to sign up and log in securely"
\`\`\`

## Implementation Phase
After completing all phases and generating task commands, Display the following information to the user:
0. **RESTART Claude Code** for new commands to be visible
1. **Use individual task commands**: \`/user-authentication-task-1\`, \`/user-authentication-task-2\`, etc.
2. **Or use spec-execute**: Execute tasks individually as needed
3. **Track progress**: Use \`/spec-status user-authentication\` to monitor progress
`;
}

export function getSpecRequirementsCommand(): string {
  return `# Spec Requirements Command

Generate or update requirements document for an existing spec.

## Usage
\`\`\`
/spec-requirements [feature-name]
\`\`\`

## Phase Overview
**Your Role**: Generate comprehensive requirements based on user input

This is Phase 1 of the spec workflow. Your goal is to create a complete requirements document that will guide the rest of the feature development.

## Instructions
You are working on the requirements phase of the spec workflow.

1. **Identify Current Spec**
   - If no feature-name provided, look for specs in \`.claude/specs/\` directory
   - If multiple specs exist, ask user to specify which one
   - If feature-name provided, load from \`.claude/specs/{feature-name}/requirements.md\`
   - Check if requirements.md already exists in the spec directory

2. **Load Context**
   - **Load steering documents**: 
     - Check for .claude/steering/product.md for product vision alignment
     - Check for .claude/steering/tech.md for technical constraints
     - Check for .claude/steering/structure.md for organizational patterns
   - **Analyze codebase**: Search for similar features and patterns

3. **Generate Requirements Document**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/requirements-template.md\`
   - **Use EARS format**: Easy Approach to Requirements Syntax for acceptance criteria
   - Each requirement should have:
     - User story: "As a [role], I want [feature], so that [benefit]"
     - Numbered acceptance criteria: "WHEN [event] THEN [system] SHALL [response]"
   - **Ensure alignment**: Verify requirements support goals outlined in product.md

### Requirements Creation Process
1. **Read the requirements template**: Load \`.claude/templates/requirements-template.md\` and follow its exact structure
2. Parse the feature description provided by the user
3. Create user stories in format: "As a [role], I want [feature], so that [benefit]"
4. Generate acceptance criteria using EARS format:
   - WHEN [event] THEN [system] SHALL [response]
   - IF [condition] THEN [system] SHALL [response]
5. Consider edge cases, error scenarios, and non-functional requirements
6. Present complete requirements document following the template structure
7. Ask: "Do the requirements look good? If so, we can move on to the design phase."
8. **CRITICAL**: Wait for explicit approval before proceeding to the design phase

4. **Content Guidelines**
   - Consider edge cases and error handling
   - Include non-functional requirements (performance, security, etc.)
   - Reference existing codebase patterns where relevant
   - **Align with product vision**: Ensure all requirements support product.md goals
   - Ensure requirements are testable and verifiable

5. **Approval Process**
   - Present the complete requirements document
   - Ask: "Do the requirements look good? If so, we can move on to the design phase."
   - Make revisions based on feedback
   - Continue until explicit approval is received
   - **CRITICAL**: Do not proceed without explicit approval

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/requirements-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **EARS format**: Use proper WHEN/IF/THEN statements for acceptance criteria

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval, the next phase is design creation. The user can proceed to work on the design document.
`;
}

export function getSpecDesignCommand(): string {
  return `# Spec Design Command

Generate design document based on approved requirements.

## Usage
\`\`\`
/spec-design [feature-name]
\`\`\`

## Phase Overview
**Your Role**: Create technical architecture and design

This is Phase 2 of the spec workflow. Your goal is to create a comprehensive technical design that translates requirements into a concrete implementation plan.

## Instructions
You are working on the design phase of the spec workflow.

1. **Prerequisites**
   - Ensure requirements.md exists and is approved in \`.claude/specs/{feature-name}/\`
   - Load the requirements document from \`.claude/specs/{feature-name}/requirements.md\`
   - **Load steering documents** (if available): 
     - Check for .claude/steering/tech.md for technical standards
     - Check for .claude/steering/structure.md for project conventions
     - Check for .claude/steering/product.md for product context
   - Research existing codebase patterns and architecture

2. **Design Creation Process**
   1. **Read the design template**: Load \`.claude/templates/design-template.md\` and follow its exact structure
   2. Research existing codebase patterns and architecture
   3. Create comprehensive design document following the template including:
      - System overview and architecture
      - Component specifications and interfaces
      - Data models and validation rules
      - Error handling strategies
      - Testing approach
   4. Include Mermaid diagrams for visual representation
   5. Present complete design document following the template structure
   6. Ask: "Does the design look good? If so, we can move on to the implementation planning phase."
   7. **CRITICAL**: Wait for explicit approval before proceeding to the tasks phase

3. **Codebase Research Phase** (MANDATORY)
   - **Map existing patterns**: Identify data models, API patterns, component structures that match your needs
   - **Cross-reference with tech.md**: Ensure patterns align with documented technical standards
   - **Catalog reusable utilities**: Find validation functions, helpers, middleware, hooks that can be leveraged
   - **Document architectural decisions**: Note existing tech stack, state management, routing patterns to follow
   - **Verify against structure.md**: Ensure file organization follows project conventions
   - **Identify integration points**: Map how new feature connects to existing auth, database, APIs
   - **Find similar implementations**: Look for features with similar requirements already implemented
   - **Note gaps**: Document what needs to be built vs. what can be reused or extended

4. **Design Content** (leverage codebase research and steering documents)
   - **Reuse Architecture**: Build on existing patterns rather than creating new ones
   - **Follow tech.md standards**: Ensure design adheres to documented technical guidelines
   - **Respect structure.md conventions**: Organize components according to project structure
   - **Extend Components**: Design to leverage and extend existing utilities, services, components
   - Use Mermaid diagrams for visual representations
   - Define clear interfaces that integrate with existing systems
   - Specify data models that follow established patterns
   - Plan error handling consistent with current approach
   - Outline testing approach using existing test utilities

5. **Approval Process**
   - Present the complete design document
   - **Highlight code reuse**: Clearly show what existing code will be leveraged
   - **Show steering document alignment**: Note how design follows tech.md and structure.md
   - Ask: "Does the design look good? If so, we can move on to the implementation planning phase."
   - Incorporate feedback and revisions
   - Continue until explicit approval
   - **CRITICAL**: Do not proceed without explicit approval

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/design-template.md\` precisely
- **Include all sections**: Don't omit any required template sections (Overview, Architecture, Components, Data Models, Error Handling, Testing Strategy)
- **Add Mermaid diagrams**: Include visual representations as shown in template

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval, the next phase is task planning. The user can proceed to work on the implementation plan.
`;
}

export function getSpecTasksCommand(): string {
  return `# Spec Tasks Command

Generate implementation task list based on approved design.

## Usage
\`\`\`
/spec-tasks [feature-name]
\`\`\`

## Phase Overview
**Your Role**: Break design into executable implementation tasks

This is Phase 3 of the spec workflow. Your goal is to create a detailed task breakdown that will guide the implementation of the feature.

## Instructions
You are working on the tasks phase of the spec workflow.

**WORKFLOW**: This is the FINAL step before command generation.
**SEQUENCE**: Create Tasks → Get Approval → Ask User → Generate Commands
**DO NOT** run task command generation until tasks are approved.

1. **Prerequisites**
   - Ensure design.md exists and is approved in \`.claude/specs/{feature-name}/\`
   - Load both documents from the spec directory:
     - Load \`.claude/specs/{feature-name}/requirements.md\` for feature context
     - Load \`.claude/specs/{feature-name}/design.md\` for technical design
   - **Load steering documents** (if available):
     - Check for .claude/steering/structure.md for project conventions
     - Check for .claude/steering/tech.md for technical patterns
   - Understand the complete feature scope

2. **Task Creation Process**
   1. **Read the task template**: Load \`.claude/templates/tasks-template.md\` and follow its exact structure
   2. Convert design into atomic, executable coding tasks
   3. Ensure each task:
      - Has a clear, actionable objective
      - References specific requirements using _Requirements: X.Y_ format
      - References existing code to leverage using _Leverage: path/to/file.ts_ format
      - Builds incrementally on previous tasks
      - Focuses on coding activities only
   4. Use checkbox format with hierarchical numbering as shown in template
   5. Present complete task list following the template structure
   6. Ask: "Do the tasks look good?"
   7. **CRITICAL**: Wait for explicit approval before proceeding
   8. **AFTER APPROVAL**: Ask "Would you like me to generate individual task commands for easier execution? (yes/no)"
   9. **IF YES**: Execute \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
   10. **IF NO**: Continue with traditional task execution approach

3. **Generate Task List** (prioritize code reuse and follow conventions)
   - Break design into atomic, executable coding tasks
   - **Follow structure.md**: Ensure tasks respect project file organization
   - **Prioritize extending/adapting existing code** over building from scratch
   - Use checkbox format with numbered hierarchy
   - Each task should reference specific requirements AND existing code to leverage
   - Focus ONLY on coding tasks (no deployment, user testing, etc.)

4. **Task Guidelines**
   - Tasks should be concrete and actionable
   - **Reference existing code to reuse**: Include specific files/components to extend or adapt
   - Include specific file names and components
   - Build incrementally (each task builds on previous)
   - Reference requirements using _Requirements: X.Y_ format
   - Use test-driven development approach leveraging existing test patterns

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/tasks-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Use checkbox format**: Follow the exact task format with requirement and leverage references
- **See template for format rules**: The template includes detailed formatting guidelines

### Excluded Task Types
- User acceptance testing
- Production deployment
- Performance metrics gathering
- User training or documentation
- Business process changes

5. **Approval Process**
   - Present the complete task list
   - Ask: "Do the tasks look good?"
   - Make revisions based on feedback
   - Continue until explicit approval
   - **CRITICAL**: Do not proceed without explicit approval

6. **Critical Task Command Generation Rules**

**Use NPX Command for Task Generation**: Task commands are now generated using the package's CLI command.
- **COMMAND**: \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {spec-name}\`
- **TIMING**: Only run after tasks.md is approved AND user confirms they want task commands
- **USER CHOICE**: Always ask the user if they want task commands generated (yes/no)
- **CROSS-PLATFORM**: Works automatically on Windows, macOS, and Linux

### Generate Task Commands (ONLY after tasks approval)
- **WAIT**: Do not run command generation until user explicitly approves tasks
- **ASK USER**: "Would you like me to generate individual task commands for easier execution? (yes/no)"
- **IF YES**: Execute \`npx @pimzino/claude-code-spec-workflow@latest generate-task-commands {feature-name}\`
- **IF NO**: Continue with traditional task execution approach
- **PURPOSE**: Creates individual task commands in \`.claude/commands/{feature-name}/\`
- **RESULT**: Each task gets its own command: \`/{feature-name}-task-{task-id}\`
- **EXAMPLE**: Creates \`/{feature-name}-task-1\`, \`/{feature-name}-task-2.1\`, etc.
- **RESTART REQUIRED**: Inform user to restart Claude Code for new commands to be visible


## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval and command generation:
1. **RESTART Claude Code** for new commands to be visible
2. Then you can:
   - Use individual task commands (if generated): \`/{feature-name}-task-1\`, \`/{feature-name}-task-2\`, etc.
   - Or execute tasks individually as needed
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

## Phase Overview
**Your Role**: Execute tasks systematically with validation

This is Phase 4 of the spec workflow. Your goal is to implement individual tasks from the approved task list, one at a time.

## Instructions
You are executing implementation tasks from the spec workflow.

1. **Prerequisites**
   - Ensure tasks.md exists and is approved
   - Load the spec documents from \`.claude/specs/{feature-name}/\`:
     - Load \`.claude/specs/{feature-name}/requirements.md\` for feature requirements
     - Load \`.claude/specs/{feature-name}/design.md\` for technical design
     - Load \`.claude/specs/{feature-name}/tasks.md\` for the complete task list
   - **Load all steering documents** (if available): 
     - Load .claude/steering/product.md for product context
     - Load .claude/steering/tech.md for technical patterns
     - Load .claude/steering/structure.md for project conventions
   - Identify the specific task to execute

2. **Process**
   1. Load spec documents from \`.claude/specs/{feature-name}/\` directory:
      - Load requirements.md, design.md, and tasks.md for complete context
   2. Execute ONLY the specified task (never multiple tasks)
   3. Implement following existing code patterns and conventions
   4. Validate implementation against referenced requirements
   5. Run tests and checks if applicable
   6. **CRITICAL**: Mark task as complete by changing [ ] to [x] in tasks.md
   7. Confirm task completion status to user
   8. **CRITICAL**: Stop and wait for user review before proceeding

3. **Task Execution**
   - Focus on ONE task at a time
   - If task has sub-tasks, start with those
   - Follow the implementation details from design.md
   - Verify against requirements specified in the task

4. **Implementation Guidelines**
   - Write clean, maintainable code
   - **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
   - Follow existing code patterns and conventions
   - Include appropriate error handling
   - Add unit tests where specified
   - Document complex logic

5. **Validation**
   - Verify implementation meets acceptance criteria
   - Run tests if they exist
   - Check for lint/type errors
   - Ensure integration with existing code

6. **Task Completion Protocol**
When completing any task during \`/spec-execute\`:
   1. **Update tasks.md**: Change task status from \`- [ ]\` to \`- [x]\`
   2. **Confirm to user**: State clearly "Task X has been marked as complete"
   3. **Stop execution**: Do not proceed to next task automatically
   4. **Wait for instruction**: Let user decide next steps

## Critical Workflow Rules

### Task Execution
- **ONLY** execute one task at a time during implementation
- **CRITICAL**: Mark completed tasks as [x] in tasks.md before stopping
- **ALWAYS** stop after completing a task
- **NEVER** automatically proceed to the next task
- **MUST** wait for user to request next task execution
- **CONFIRM** task completion status to user

### Requirement References
- **ALL** tasks must reference specific requirements using _Requirements: X.Y_ format
- **ENSURE** traceability from requirements through design to implementation
- **VALIDATE** implementations against referenced requirements

## Task Selection
If no task-id specified:
- Look at tasks.md for the spec
- Recommend the next pending task
- Ask user to confirm before proceeding

If no feature-name specified:
- Check \`.claude/specs/\` directory for available specs
- If only one spec exists, use it
- If multiple specs exist, ask user which one to use
- Display error if no specs are found

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

## Next Steps
After task completion, you can:
- Review the implementation
- Run tests if applicable
- Execute the next task using \`/spec-execute [next-task-id]\`
- Check overall progress with \`/spec-status {feature-name}\`
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

export function getSpecSteeringSetupCommand(): string {
  return `# Spec Steering Setup Command

Create or update steering documents that provide persistent project context.

## Usage
\`\`\`
/spec-steering-setup
\`\`\`

## Instructions
You are helping set up steering documents that will guide all future spec development. These documents provide persistent context about the product vision, technology stack, and project structure.

## Process

1. **Check for Existing Steering Documents**
   - Look for \`.claude/steering/\` directory
   - Check for existing product.md, tech.md, structure.md files
   - If they exist, load and display current content

2. **Analyze the Project**
   - Review the codebase to understand:
     - Project type and purpose
     - Technology stack in use
     - Directory structure and patterns
     - Coding conventions
     - Existing features and functionality
   - Look for:
     - package.json, requirements.txt, go.mod, etc.
     - README files
     - Configuration files
     - Source code structure

3. **Present Inferred Details**
   - Show the user what you've learned about:
     - **Product**: Purpose, features, target users
     - **Technology**: Frameworks, libraries, tools
     - **Structure**: File organization, naming conventions
   - Format as:
     \`\`\`
     Based on my analysis, here's what I've inferred:
     
     **Product Details:**
     - [Inferred detail 1]
     - [Inferred detail 2]
     
     **Technology Stack:**
     - [Inferred tech 1]
     - [Inferred tech 2]
     
     **Project Structure:**
     - [Inferred pattern 1]
     - [Inferred pattern 2]
     \`\`\`
   - Ask: "Do these inferred details look correct? Please let me know which ones to keep or discard."

4. **Gather Missing Information**
   - Based on user feedback, identify gaps
   - Ask targeted questions to fill in missing details:
     
     **Product Questions:**
     - What is the main problem this product solves?
     - Who are the primary users?
     - What are the key business objectives?
     - What metrics define success?
     
     **Technology Questions:**
     - Are there any technical constraints or requirements?
     - What third-party services are integrated?
     - What are the performance requirements?
     
     **Structure Questions:**
     - Are there specific coding standards to follow?
     - How should new features be organized?
     - What are the testing requirements?

5. **Generate Steering Documents**
   - Create \`.claude/steering/\` directory if it doesn't exist
   - Generate three files based on templates and gathered information:
     
     **product.md**: Product vision, users, features, objectives
     **tech.md**: Technology stack, tools, constraints, decisions
     **structure.md**: File organization, naming conventions, patterns

6. **Review and Confirm**
   - Present the generated documents to the user
   - Ask for final approval before saving
   - Make any requested adjustments

## Important Notes

- **Steering documents are persistent** - they will be referenced in all future spec commands
- **Keep documents focused** - each should cover its specific domain
- **Update regularly** - steering docs should evolve with the project
- **Never include sensitive data** - no passwords, API keys, or credentials

## Example Flow

1. Analyze project and find it's a React/TypeScript app
2. Present inferred details about the e-commerce platform
3. User confirms most details but clarifies target market
4. Ask about performance requirements and third-party services
5. Generate steering documents with all gathered information
6. User reviews and approves the documents
7. Save to \`.claude/steering/\` directory

## Next Steps
After steering documents are created, they will automatically be referenced during:
- \`/spec-create\` - Align requirements with product vision
- \`/spec-design\` - Follow established tech patterns
- \`/spec-tasks\` - Use correct file organization
- \`/spec-execute\` - Implement following all conventions
`;
}

export function getBugCreateCommand(): string {
  return `# Bug Create Command

Initialize a new bug fix workflow for tracking and resolving bugs.

## Usage
\`\`\`
/bug-create <bug-name> [description]
\`\`\`

## Workflow Overview

This is the **streamlined bug fix workflow** - a lighter alternative to the full spec workflow for addressing bugs and issues.

### Bug Fix Phases
1. **Report Phase** (This command) - Document the bug
2. **Analysis Phase** (\`/bug-analyze\`) - Investigate root cause
3. **Fix Phase** (\`/bug-fix\`) - Implement solution
4. **Verification Phase** (\`/bug-verify\`) - Confirm resolution

## Instructions

You are helping create a new bug fix workflow. This is designed for smaller fixes that don't need the full spec workflow overhead.

1. **Create Directory Structure**
   - Create \`.claude/bugs/{bug-name}/\` directory
   - Initialize report.md, analysis.md, and verification.md files

2. **Load Context** (if available)
   - Check for .claude/steering/tech.md for technical context
   - Check for .claude/steering/structure.md for project patterns
   - Load available steering documents to understand project context

3. **Gather Bug Information**
   - Take the bug name and optional description
   - Guide user through bug report creation
   - Use structured format for consistency

4. **Generate Bug Report**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-report-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Create detailed bug description following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-report-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Structured format**: Follow the template's format for consistency

5. **Request User Input**
   - Ask for bug details if not provided in description
   - Guide through each section of the bug report
   - Ensure all required information is captured

6. **Save and Proceed**
   - Save the completed bug report to report.md
   - Ask: "Is this bug report accurate? If so, we can move on to the analysis."
   - Wait for explicit approval before proceeding

## Key Differences from Spec Workflow

- **Faster**: No requirements/design phases
- **Targeted**: Focus on fixing existing functionality
- **Streamlined**: 4 phases instead of detailed workflow
- **Practical**: Direct from problem to solution

## Rules

- Only create ONE bug fix at a time
- Always use kebab-case for bug names
- Must analyze existing codebase during investigation
- Follow existing project patterns and conventions
- Do not proceed without user approval between phases

## Error Handling

If issues arise during the workflow:
- **Bug unclear**: Ask targeted questions to clarify
- **Too complex**: Suggest breaking into smaller bugs or using spec workflow
- **Reproduction blocked**: Document blockers and suggest alternatives

## Example
\`\`\`
/bug-create login-timeout "Users getting logged out too quickly"
\`\`\`

## Next Steps
After bug report approval, proceed to \`/bug-analyze\` phase.
`;
}

export function getBugAnalyzeCommand(): string {
  return `# Bug Analyze Command

Investigate and analyze the root cause of a reported bug.

## Usage
\`\`\`
/bug-analyze [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Investigate the bug and identify the root cause

This is Phase 2 of the bug fix workflow. Your goal is to understand why the bug is happening and plan the fix approach.

## Instructions

You are working on the analysis phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure report.md exists and is complete
   - Load the bug report for context
   - **Load steering documents**: 
     - Check for .claude/steering/tech.md for technical patterns
     - Check for .claude/steering/structure.md for project organization
   - Understand the reported issue completely

2. **Investigation Process**
   1. **Code Investigation**
      - Search codebase for relevant functionality
      - Identify files, functions, and components involved
      - Map data flow and identify potential failure points
      - Look for similar issues or patterns

   2. **Root Cause Analysis**
      - Determine the underlying cause of the bug
      - Identify contributing factors
      - Understand why existing tests didn't catch this
      - Assess impact and risks

   3. **Solution Planning**
      - Design fix strategy
      - Consider alternative approaches
      - Plan testing approach
      - Identify potential risks

3. **Create Analysis Document**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-analysis-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Document investigation findings following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-analysis-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Detailed analysis**: Follow the template's format for comprehensive investigation

4. **Investigation Guidelines**
   - **Follow tech.md standards**: Understand existing patterns before proposing changes
   - **Respect structure.md**: Know where fixes should be placed
   - **Search thoroughly**: Look for existing utilities, similar bugs, related code
   - **Think systematically**: Consider data flow, error handling, edge cases
   - **Plan for testing**: How will you verify the fix works

5. **Approval Process**
   - Present the complete analysis document
   - **Show code reuse opportunities**: Note existing utilities that can help
   - **Highlight integration points**: Show how fix fits with existing architecture
   - Ask: "Does this analysis look correct? If so, we can proceed to implement the fix."
   - Incorporate feedback and revisions
   - Continue until explicit approval
   - **CRITICAL**: Do not proceed without explicit approval

## Analysis Guidelines

### Code Investigation
- Use search tools to find relevant code
- Understand existing error handling patterns
- Look for similar functionality that works correctly
- Check for recent changes that might have caused the issue

### Root Cause Identification
- Don't just fix symptoms - find the real cause
- Consider edge cases and error conditions
- Look for design issues vs implementation bugs
- Understand the intended behavior vs actual behavior

### Solution Design
- Prefer minimal, targeted fixes
- Reuse existing patterns and utilities
- Consider backwards compatibility
- Plan for future prevention of similar bugs

## Critical Rules
- **NEVER** proceed to the next phase without explicit user approval
- Accept only clear affirmative responses: "yes", "approved", "looks good", etc.
- If user provides feedback, make revisions and ask for approval again
- Continue revision cycle until explicit approval is received

## Next Phase
After approval, proceed to \`/bug-fix\`.
`;
}

export function getBugFixCommand(): string {
  return `# Bug Fix Command

Implement the fix for the analyzed bug.

## Usage
\`\`\`
/bug-fix [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Implement the solution based on the approved analysis

This is Phase 3 of the bug fix workflow. Your goal is to implement the fix while following project conventions.

## Instructions

You are working on the fix implementation phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure analysis.md exists and is approved
   - Load report.md and analysis.md for complete context
   - **Load steering documents**: 
     - Load .claude/steering/tech.md for technical patterns
     - Load .claude/steering/structure.md for project conventions
   - Understand the planned fix approach completely

2. **Implementation Process**
   1. **Follow the Implementation Plan**
      - Execute changes exactly as outlined in analysis.md
      - Make targeted, minimal changes
      - Follow existing code patterns and conventions

   2. **Code Changes**
      - Implement the fix following project standards
      - Add appropriate error handling
      - Include logging or debugging aids if needed
      - Update or add tests as specified

   3. **Quality Checks**
      - Verify fix addresses the root cause
      - Ensure no unintended side effects
      - Follow code style and conventions
      - Run tests and checks

3. **Implementation Guidelines**
   - **Follow steering documents**: Adhere to patterns in tech.md and conventions in structure.md
   - **Make minimal changes**: Fix only what's necessary
   - **Preserve existing behavior**: Don't break unrelated functionality
   - **Use existing patterns**: Leverage established code patterns and utilities
   - **Add appropriate tests**: Ensure the bug won't return

4. **Testing Requirements**
   - Test the specific bug scenario
   - Verify related functionality still works
   - Run existing test suite if available
   - Add regression tests for this bug

5. **Documentation Updates**
   - Update code comments if needed
   - Document any non-obvious changes
   - Update error messages if applicable

## Implementation Rules

### Code Quality
- Follow project coding standards
- Use existing utilities and patterns
- Add proper error handling
- Include meaningful comments for complex logic

### Testing Strategy
- Test the original bug reproduction steps
- Verify fix doesn't break related functionality
- Add tests to prevent regression
- Run full test suite if available

### Change Management
- Make atomic, focused changes
- Document the fix approach
- Preserve existing API contracts
- Consider backwards compatibility

## Completion Process

1. **Implement the Fix**
   - Make the necessary code changes
   - Follow the implementation plan from analysis.md
   - Ensure code follows project conventions

2. **Verify Implementation**
   - Test that the original bug is resolved
   - Verify no new issues introduced
   - Run relevant tests and checks

3. **Update Documentation**
   - Document the changes made
   - Update any relevant comments or docs

4. **Confirm Completion**
   - Present summary of changes made
   - Show test results confirming fix
   - Ask: "The fix has been implemented. Should we proceed to verification?"
   - **CRITICAL**: Wait for user approval before proceeding

## Critical Rules
- **ONLY** implement the fix outlined in the approved analysis
- **ALWAYS** test the fix thoroughly
- **NEVER** make changes beyond the planned fix scope
- **MUST** wait for user approval before proceeding to verification

## Next Phase
After approval, proceed to \`/bug-verify\`.
`;
}

export function getBugVerifyCommand(): string {
  return `# Bug Verify Command

Verify that the bug fix works correctly and doesn't introduce regressions.

## Usage
\`\`\`
/bug-verify [bug-name]
\`\`\`

## Phase Overview
**Your Role**: Thoroughly verify the fix works and document the results

This is Phase 4 (final) of the bug fix workflow. Your goal is to confirm the bug is resolved and the fix is safe.

## Instructions

You are working on the verification phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure the fix has been implemented
   - Load report.md, analysis.md for context
   - Understand what was changed and why
   - Have the verification plan from analysis.md

2. **Verification Process**
   1. **Original Bug Testing**
      - Reproduce the original steps from report.md
      - Verify the bug no longer occurs
      - Test edge cases mentioned in the analysis

   2. **Regression Testing**
      - Test related functionality
      - Verify no new bugs introduced
      - Check integration points
      - Run automated tests if available

   3. **Code Quality Verification**
      - Review code changes for quality
      - Verify adherence to project standards
      - Check error handling is appropriate
      - Ensure tests are adequate

3. **Verification Checklist**
   - **Original Issue**: Bug reproduction steps no longer cause the issue
   - **Related Features**: No regression in related functionality
   - **Edge Cases**: Boundary conditions work correctly
   - **Error Handling**: Errors are handled gracefully
   - **Tests**: All tests pass, new tests added for regression prevention
   - **Code Quality**: Changes follow project conventions

4. **Create Verification Document**
   - **Template to Follow**: Use the exact structure from \`.claude/templates/bug-verification-template.md\`
   - **Read and follow**: Load the template and follow all sections precisely
   - Document all test results following the template structure

## Template Usage
- **Follow exact structure**: Use \`.claude/templates/bug-verification-template.md\` precisely
- **Include all sections**: Don't omit any required template sections
- **Complete checklist**: Follow the template's checklist format for thoroughness

5. **Final Approval**
   - Present complete verification results
   - Show that all checks pass
   - Ask: "The bug fix has been verified successfully. Is this bug resolved?"
   - Get final confirmation before closing

## Verification Guidelines

### Testing Approach
- Test the exact scenario from the bug report
- Verify fix works in different environments
- Check that related features still work
- Test error conditions and edge cases

### Quality Verification
- Code follows project standards
- Appropriate error handling added
- No security implications
- Performance not negatively impacted

### Documentation Check
- Code comments updated if needed
- Any relevant docs reflect changes
- Bug fix documented appropriately

## Completion Criteria

The bug fix is complete when:
- ✅ Original bug no longer occurs
- ✅ No regressions introduced
- ✅ All tests pass
- ✅ Code follows project standards
- ✅ Documentation is up to date
- ✅ User confirms resolution

## Critical Rules
- **THOROUGHLY** test the original bug scenario
- **VERIFY** no regressions in related functionality
- **DOCUMENT** all verification results
- **GET** final user approval before considering bug resolved

## Success Criteria
A successful bug fix includes:
- ✅ Root cause identified and addressed
- ✅ Minimal, targeted fix implemented
- ✅ Comprehensive verification completed
- ✅ No regressions introduced
- ✅ Appropriate tests added
- ✅ User confirms issue resolved
`;
}

export function getBugStatusCommand(): string {
  return `# Bug Status Command

Show current status of all bug fixes or a specific bug fix.

## Usage
\`\`\`
/bug-status [bug-name]
\`\`\`

## Instructions
Display the current status of bug fix workflows.

1. **If no bug-name provided:**
   - List all bugs in \`.claude/bugs/\` directory
   - Show current phase for each bug
   - Display completion status

2. **If bug-name provided:**
   - Show detailed status for that bug
   - Display current workflow phase
   - Show completed vs pending phases
   - List next recommended actions

3. **Status Information:**
   - Report: [Complete/In Progress/Pending]
   - Analysis: [Complete/In Progress/Pending]
   - Fix: [Complete/In Progress/Pending]
   - Verification: [Complete/In Progress/Pending]

4. **Output Format:**
   \`\`\`
   Bug: login-timeout
   Phase: Fix Implementation
   Progress: Report ✅ | Analysis ✅ | Fix 🔄 | Verification ⏳
   Status: Implementing fix for session timeout issue
   Next: Complete implementation and verify fix works
   \`\`\`

## Bug Fix Phases
- **Report**: Bug description and impact assessment
- **Analysis**: Root cause investigation and solution planning
- **Fix**: Implementation of the planned solution
- **Verification**: Testing and confirmation of resolution
- **Complete**: Bug fully resolved and verified
`;
}