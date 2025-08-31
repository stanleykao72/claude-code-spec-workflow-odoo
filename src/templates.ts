/**
 * Generates the requirements document template with EARS format acceptance criteria.
 * Includes user stories and product vision alignment sections.
 * 
 * @returns Markdown template string for requirements documents
 * 
 * @example
 * ```typescript
 * const template = getRequirementsTemplate();
 * await fs.writeFile('.claude/templates/requirements-template.md', template);
 * ```
 */
export function getRequirementsTemplate(): string {
  return `# Requirements Document

## Introduction

[Provide a brief overview of the feature, its purpose, and its value to users]

## Alignment with Product Vision

[Explain how this feature supports the goals outlined in product.md]

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]
3. WHEN [event] AND [condition] THEN [system] SHALL [response]

### Requirement 2

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

## Non-Functional Requirements

### Performance
- [Performance requirements]

### Security
- [Security requirements]

### Reliability
- [Reliability requirements]

### Usability
- [Usability requirements]
`;
}

/**
 * Generates the design document template with architecture and code reuse analysis.
 * Includes technical architecture, components, data models, and testing strategy.
 * 
 * @returns Markdown template string for design documents
 * 
 * @example
 * ```typescript
 * const template = getDesignTemplate();
 * await fs.writeFile('.claude/templates/design-template.md', template);
 * ```
 */
export function getDesignTemplate(): string {
  return `# Design Document

## Overview

[High-level description of the feature and its place in the overall system]

## Steering Document Alignment

### Technical Standards (tech.md)
[How the design follows documented technical patterns and standards]

### Project Structure (structure.md)
[How the implementation will follow project organization conventions]

## Code Reuse Analysis
[What existing code will be leveraged, extended, or integrated with this feature]

### Existing Components to Leverage
- **[Component/Utility Name]**: [How it will be used]
- **[Service/Helper Name]**: [How it will be extended]

### Integration Points
- **[Existing System/API]**: [How the new feature will integrate]
- **[Database/Storage]**: [How data will connect to existing schemas]

## Architecture

[Describe the overall architecture and design patterns used]

\`\`\`mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
\`\`\`

## Components and Interfaces

### Component 1
- **Purpose:** [What this component does]
- **Interfaces:** [Public methods/APIs]
- **Dependencies:** [What it depends on]
- **Reuses:** [Existing components/utilities it builds upon]

### Component 2
- **Purpose:** [What this component does]
- **Interfaces:** [Public methods/APIs]
- **Dependencies:** [What it depends on]
- **Reuses:** [Existing components/utilities it builds upon]

## Data Models

### Model 1
\`\`\`
[Define the structure of Model1 in your language]
- id: [unique identifier type]
- name: [string/text type]
- [Additional properties as needed]
\`\`\`

### Model 2
\`\`\`
[Define the structure of Model2 in your language]
- id: [unique identifier type]
- [Additional properties as needed]
\`\`\`

## Error Handling

### Error Scenarios
1. **Scenario 1:** [Description]
   - **Handling:** [How to handle]
   - **User Impact:** [What user sees]

2. **Scenario 2:** [Description]
   - **Handling:** [How to handle]
   - **User Impact:** [What user sees]

## Testing Strategy

### Unit Testing
- [Unit testing approach]
- [Key components to test]

### Integration Testing
- [Integration testing approach]
- [Key flows to test]

### End-to-End Testing
- [E2E testing approach]
- [User scenarios to test]
`;
}

/**
 * Generates the tasks document template with atomic implementation tasks.
 * Includes task breakdown with requirement traceability and leverage references.
 * 
 * @returns Markdown template string for task documents
 * 
 * @example
 * ```typescript
 * const template = getTasksTemplate();
 * await fs.writeFile('.claude/templates/tasks-template.md', template);
 * ```
 */
export function getTasksTemplate(): string {
  return `# Implementation Plan

## Task Overview
[Brief description of the implementation approach]

## Steering Document Compliance
[How tasks follow structure.md conventions and tech.md patterns]

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: \`- [ ] Task number. Task description\`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: \`_Requirements: X.Y, Z.A_\`
- Reference existing code to leverage using: \`_Leverage: path/to/file.ts, path/to/component.tsx_\`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Good vs Bad Task Examples
❌ **Bad Examples (Too Broad)**:
- "Implement authentication system" (affects many files, multiple purposes)
- "Add user management features" (vague scope, no file specification)
- "Build complete dashboard" (too large, multiple components)

✅ **Good Examples (Atomic)**:
- "Create User model in models/user.py with email/password fields"
- "Add password hashing utility in utils/auth.py using bcrypt"
- "Create LoginForm component in components/LoginForm.tsx with email/password inputs"

## Tasks

- [ ] 1. Create core interfaces in src/types/feature.ts
  - File: src/types/feature.ts
  - Define TypeScript interfaces for feature data structures
  - Extend existing base interfaces from base.ts
  - Purpose: Establish type safety for feature implementation
  - _Leverage: src/types/base.ts_
  - _Requirements: 1.1_

- [ ] 2. Create base model class in src/models/FeatureModel.ts
  - File: src/models/FeatureModel.ts
  - Implement base model extending BaseModel class
  - Add validation methods using existing validation utilities
  - Purpose: Provide data layer foundation for feature
  - _Leverage: src/models/BaseModel.ts, src/utils/validation.ts_
  - _Requirements: 2.1_

- [ ] 3. Add specific model methods to FeatureModel.ts
  - File: src/models/FeatureModel.ts (continue from task 2)
  - Implement create, update, delete methods
  - Add relationship handling for foreign keys
  - Purpose: Complete model functionality for CRUD operations
  - _Leverage: src/models/BaseModel.ts_
  - _Requirements: 2.2, 2.3_

- [ ] 4. Create model unit tests in tests/models/FeatureModel.test.ts
  - File: tests/models/FeatureModel.test.ts
  - Write tests for model validation and CRUD methods
  - Use existing test utilities and fixtures
  - Purpose: Ensure model reliability and catch regressions
  - _Leverage: tests/helpers/testUtils.ts, tests/fixtures/data.ts_
  - _Requirements: 2.1, 2.2_

- [ ] 5. Create service interface in src/services/IFeatureService.ts
  - File: src/services/IFeatureService.ts
  - Define service contract with method signatures
  - Extend base service interface patterns
  - Purpose: Establish service layer contract for dependency injection
  - _Leverage: src/services/IBaseService.ts_
  - _Requirements: 3.1_

- [ ] 6. Implement feature service in src/services/FeatureService.ts
  - File: src/services/FeatureService.ts
  - Create concrete service implementation using FeatureModel
  - Add error handling with existing error utilities
  - Purpose: Provide business logic layer for feature operations
  - _Leverage: src/services/BaseService.ts, src/utils/errorHandler.ts, src/models/FeatureModel.ts_
  - _Requirements: 3.2_

- [ ] 7. Add service dependency injection in src/utils/di.ts
  - File: src/utils/di.ts (modify existing)
  - Register FeatureService in dependency injection container
  - Configure service lifetime and dependencies
  - Purpose: Enable service injection throughout application
  - _Leverage: existing DI configuration in src/utils/di.ts_
  - _Requirements: 3.1_

- [ ] 8. Create service unit tests in tests/services/FeatureService.test.ts
  - File: tests/services/FeatureService.test.ts
  - Write tests for service methods with mocked dependencies
  - Test error handling scenarios
  - Purpose: Ensure service reliability and proper error handling
  - _Leverage: tests/helpers/testUtils.ts, tests/mocks/modelMocks.ts_
  - _Requirements: 3.2, 3.3_

- [ ] 4. Create API endpoints
  - Design API structure
  - _Leverage: src/api/baseApi.ts, src/utils/apiUtils.ts_
  - _Requirements: 4.0_

- [ ] 4.1 Set up routing and middleware
  - Configure application routes
  - Add authentication middleware
  - Set up error handling middleware
  - _Leverage: src/middleware/auth.ts, src/middleware/errorHandler.ts_
  - _Requirements: 4.1_

- [ ] 4.2 Implement CRUD endpoints
  - Create API endpoints
  - Add request validation
  - Write API integration tests
  - _Leverage: src/controllers/BaseController.ts, src/utils/validation.ts_
  - _Requirements: 4.2, 4.3_

- [ ] 5. Add frontend components
  - Plan component architecture
  - _Leverage: src/components/BaseComponent.tsx, src/styles/theme.ts_
  - _Requirements: 5.0_

- [ ] 5.1 Create base UI components
  - Set up component structure
  - Implement reusable components
  - Add styling and theming
  - _Leverage: src/components/BaseComponent.tsx, src/styles/theme.ts_
  - _Requirements: 5.1_

- [ ] 5.2 Implement feature-specific components
  - Create feature components
  - Add state management
  - Connect to API endpoints
  - _Leverage: src/hooks/useApi.ts, src/components/BaseComponent.tsx_
  - _Requirements: 5.2, 5.3_

- [ ] 6. Integration and testing
  - Plan integration approach
  - _Leverage: src/utils/integrationUtils.ts, tests/helpers/testUtils.ts_
  - _Requirements: 6.0_

- [ ] 6.1 Write end-to-end tests
  - Set up E2E testing framework
  - Write user journey tests
  - Add test automation
  - _Leverage: tests/helpers/testUtils.ts, tests/fixtures/data.ts_
  - _Requirements: All_

- [ ] 6.2 Final integration and cleanup
  - Integrate all components
  - Fix any integration issues
  - Clean up code and documentation
  - _Leverage: src/utils/cleanup.ts, docs/templates/_
  - _Requirements: All_
`;
}

/**
 * Generates the product steering document template.
 * Defines product vision, goals, target users, and success metrics.
 * 
 * @returns Markdown template string for product steering document
 * 
 * @example
 * ```typescript
 * const template = getProductTemplate();
 * await fs.writeFile('.claude/steering/product.md', template);
 * ```
 */
export function getProductTemplate(): string {
  return `# Product Overview

## Product Purpose
[Describe the core purpose of this product/project. What problem does it solve?]

## Target Users
[Who are the primary users of this product? What are their needs and pain points?]

## Key Features
[List the main features that deliver value to users]

1. **Feature 1**: [Description]
2. **Feature 2**: [Description]
3. **Feature 3**: [Description]

## Business Objectives
[What are the business goals this product aims to achieve?]

- [Objective 1]
- [Objective 2]
- [Objective 3]

## Success Metrics
[How will we measure the success of this product?]

- [Metric 1]: [Target]
- [Metric 2]: [Target]
- [Metric 3]: [Target]

## Product Principles
[Core principles that guide product decisions]

1. **[Principle 1]**: [Explanation]
2. **[Principle 2]**: [Explanation]
3. **[Principle 3]**: [Explanation]

## Monitoring & Visibility (if applicable)
[How do users track progress and monitor the system?]

- **Dashboard Type**: [e.g., Web-based, CLI, Desktop app]
- **Real-time Updates**: [e.g., WebSocket, polling, push notifications]
- **Key Metrics Displayed**: [What information is most important to surface]
- **Sharing Capabilities**: [e.g., read-only links, exports, reports]

## Future Vision
[Where do we see this product evolving in the future?]

### Potential Enhancements
- **Remote Access**: [e.g., Tunnel features for sharing dashboards with stakeholders]
- **Analytics**: [e.g., Historical trends, performance metrics]
- **Collaboration**: [e.g., Multi-user support, commenting]
`;
}

/**
 * Generates the technology steering document template.
 * Defines tech stack, tools, practices, and constraints.
 * 
 * @returns Markdown template string for technology steering document
 * 
 * @example
 * ```typescript
 * const template = getTechTemplate();
 * await fs.writeFile('.claude/steering/tech.md', template);
 * ```
 */
export function getTechTemplate(): string {
  return `# Technology Stack

## Project Type
[Describe what kind of project this is: web application, CLI tool, desktop application, mobile app, library, API service, embedded system, game, etc.]

## Core Technologies

### Primary Language(s)
- **Language**: [e.g., Python 3.11, Go 1.21, TypeScript, Rust, C++]
- **Runtime/Compiler**: [if applicable]
- **Language-specific tools**: [package managers, build tools, etc.]

### Key Dependencies/Libraries
[List the main libraries and frameworks your project depends on]
- **[Library/Framework name]**: [Purpose and version]
- **[Library/Framework name]**: [Purpose and version]

### Application Architecture
[Describe how your application is structured - this could be MVC, event-driven, plugin-based, client-server, standalone, microservices, monolithic, etc.]

### Data Storage (if applicable)
- **Primary storage**: [e.g., PostgreSQL, files, in-memory, cloud storage]
- **Caching**: [e.g., Redis, in-memory, disk cache]
- **Data formats**: [e.g., JSON, Protocol Buffers, XML, binary]

### External Integrations (if applicable)
- **APIs**: [External services you integrate with]
- **Protocols**: [e.g., HTTP/REST, gRPC, WebSocket, TCP/IP]
- **Authentication**: [e.g., OAuth, API keys, certificates]

### Monitoring & Dashboard Technologies (if applicable)
- **Dashboard Framework**: [e.g., React, Vue, vanilla JS, terminal UI]
- **Real-time Communication**: [e.g., WebSocket, Server-Sent Events, polling]
- **Visualization Libraries**: [e.g., Chart.js, D3, terminal graphs]
- **State Management**: [e.g., Redux, Vuex, file system as source of truth]

## Development Environment

### Build & Development Tools
- **Build System**: [e.g., Make, CMake, Gradle, npm scripts, cargo]
- **Package Management**: [e.g., pip, npm, cargo, go mod, apt, brew]
- **Development workflow**: [e.g., hot reload, watch mode, REPL]

### Code Quality Tools
- **Static Analysis**: [Tools for code quality and correctness]
- **Formatting**: [Code style enforcement tools]
- **Testing Framework**: [Unit, integration, and/or end-to-end testing tools]
- **Documentation**: [Documentation generation tools]

### Version Control & Collaboration
- **VCS**: [e.g., Git, Mercurial, SVN]
- **Branching Strategy**: [e.g., Git Flow, GitHub Flow, trunk-based]
- **Code Review Process**: [How code reviews are conducted]

### Dashboard Development (if applicable)
- **Live Reload**: [e.g., Hot module replacement, file watchers]
- **Port Management**: [e.g., Dynamic allocation, configurable ports]
- **Multi-Instance Support**: [e.g., Running multiple dashboards simultaneously]

## Deployment & Distribution (if applicable)
- **Target Platform(s)**: [Where/how the project runs: cloud, on-premise, desktop, mobile, embedded]
- **Distribution Method**: [How users get your software: download, package manager, app store, SaaS]
- **Installation Requirements**: [Prerequisites, system requirements]
- **Update Mechanism**: [How updates are delivered]

## Technical Requirements & Constraints

### Performance Requirements
- [e.g., response time, throughput, memory usage, startup time]
- [Specific benchmarks or targets]

### Compatibility Requirements  
- **Platform Support**: [Operating systems, architectures, versions]
- **Dependency Versions**: [Minimum/maximum versions of dependencies]
- **Standards Compliance**: [Industry standards, protocols, specifications]

### Security & Compliance
- **Security Requirements**: [Authentication, encryption, data protection]
- **Compliance Standards**: [GDPR, HIPAA, SOC2, etc. if applicable]
- **Threat Model**: [Key security considerations]

### Scalability & Reliability
- **Expected Load**: [Users, requests, data volume]
- **Availability Requirements**: [Uptime targets, disaster recovery]
- **Growth Projections**: [How the system needs to scale]

## Technical Decisions & Rationale
[Document key architectural and technology choices]

### Decision Log
1. **[Technology/Pattern Choice]**: [Why this was chosen, alternatives considered]
2. **[Architecture Decision]**: [Rationale, trade-offs accepted]
3. **[Tool/Library Selection]**: [Reasoning, evaluation criteria]

## Known Limitations
[Document any technical debt, limitations, or areas for improvement]

- [Limitation 1]: [Impact and potential future solutions]
- [Limitation 2]: [Why it exists and when it might be addressed]
`;
}

/**
 * Generates the structure steering document template.
 * Defines file organization, naming conventions, and code patterns.
 * 
 * @returns Markdown template string for structure steering document
 * 
 * @example
 * ```typescript
 * const template = getStructureTemplate();
 * await fs.writeFile('.claude/steering/structure.md', template);
 * ```
 */
export function getStructureTemplate(): string {
  return `# Project Structure

## Directory Organization

\`\`\`
[Define your project's directory structure. Examples below - adapt to your project type]

Example for a library/package:
project-root/
├── src/                    # Source code
├── tests/                  # Test files  
├── docs/                   # Documentation
├── examples/               # Usage examples
└── [build/dist/out]        # Build output

Example for an application:
project-root/
├── [src/app/lib]           # Main source code
├── [assets/resources]      # Static resources
├── [config/settings]       # Configuration
├── [scripts/tools]         # Build/utility scripts
└── [tests/spec]            # Test files

Common patterns:
- Group by feature/module
- Group by layer (UI, business logic, data)
- Group by type (models, controllers, views)
- Flat structure for simple projects
\`\`\`

## Naming Conventions

### Files
- **Components/Modules**: [e.g., \`PascalCase\`, \`snake_case\`, \`kebab-case\`]
- **Services/Handlers**: [e.g., \`UserService\`, \`user_service\`, \`user-service\`]
- **Utilities/Helpers**: [e.g., \`dateUtils\`, \`date_utils\`, \`date-utils\`]
- **Tests**: [e.g., \`[filename]_test\`, \`[filename].test\`, \`[filename]Test\`]

### Code
- **Classes/Types**: [e.g., \`PascalCase\`, \`CamelCase\`, \`snake_case\`]
- **Functions/Methods**: [e.g., \`camelCase\`, \`snake_case\`, \`PascalCase\`]
- **Constants**: [e.g., \`UPPER_SNAKE_CASE\`, \`SCREAMING_CASE\`, \`PascalCase\`]
- **Variables**: [e.g., \`camelCase\`, \`snake_case\`, \`lowercase\`]

## Import Patterns

### Import Order
1. External dependencies
2. Internal modules
3. Relative imports
4. Style imports

### Module/Package Organization
\`\`\`
[Describe your project's import/include patterns]
Examples:
- Absolute imports from project root
- Relative imports within modules
- Package/namespace organization
- Dependency management approach
\`\`\`

## Code Structure Patterns

[Define common patterns for organizing code within files. Below are examples - choose what applies to your project]

### Module/Class Organization
\`\`\`
Example patterns:
1. Imports/includes/dependencies
2. Constants and configuration
3. Type/interface definitions
4. Main implementation
5. Helper/utility functions
6. Exports/public API
\`\`\`

### Function/Method Organization
\`\`\`
Example patterns:
- Input validation first
- Core logic in the middle
- Error handling throughout
- Clear return points
\`\`\`

### File Organization Principles
\`\`\`
Choose what works for your project:
- One class/module per file
- Related functionality grouped together
- Public API at the top/bottom
- Implementation details hidden
\`\`\`

## Code Organization Principles

1. **Single Responsibility**: Each file should have one clear purpose
2. **Modularity**: Code should be organized into reusable modules
3. **Testability**: Structure code to be easily testable
4. **Consistency**: Follow patterns established in the codebase

## Module Boundaries
[Define how different parts of your project interact and maintain separation of concerns]

Examples of boundary patterns:
- **Core vs Plugins**: Core functionality vs extensible plugins
- **Public API vs Internal**: What's exposed vs implementation details  
- **Platform-specific vs Cross-platform**: OS-specific code isolation
- **Stable vs Experimental**: Production code vs experimental features
- **Dependencies direction**: Which modules can depend on which

## Code Size Guidelines
[Define your project's guidelines for file and function sizes]

Suggested guidelines:
- **File size**: [Define maximum lines per file]
- **Function/Method size**: [Define maximum lines per function]
- **Class/Module complexity**: [Define complexity limits]
- **Nesting depth**: [Maximum nesting levels]

## Dashboard/Monitoring Structure (if applicable)
[How dashboard or monitoring components are organized]

### Example Structure:
\`\`\`
src/
└── dashboard/          # Self-contained dashboard subsystem
    ├── server/        # Backend server components
    ├── client/        # Frontend assets
    ├── shared/        # Shared types/utilities
    └── public/        # Static assets
\`\`\`

### Separation of Concerns
- Dashboard isolated from core business logic
- Own CLI entry point for independent operation
- Minimal dependencies on main application
- Can be disabled without affecting core functionality

## Documentation Standards
- All public APIs must have documentation
- Complex logic should include inline comments
- README files for major modules
- Follow language-specific documentation conventions
`;
}

export function getBugReportTemplate(): string {
  return `# Bug Report

## Bug Summary
[Provide a clear, concise description of the bug]

## Bug Details

### Expected Behavior
[Describe what should happen]

### Actual Behavior  
[Describe what actually happens]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Observe the issue]

### Environment
- **Version**: [Application/system version]
- **Platform**: [OS, browser, device, etc.]
- **Configuration**: [Relevant settings or environment details]

## Impact Assessment

### Severity
- [ ] Critical - System unusable
- [ ] High - Major functionality broken
- [ ] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
[Who is impacted by this bug?]

### Affected Features
[What functionality is broken or impaired?]

## Additional Context

### Error Messages
\`\`\`
[Include any error messages, stack traces, or logs]
\`\`\`

### Screenshots/Media
[Describe any visual evidence or attach files]

### Related Issues
[Reference any related bugs, features, or discussions]

## Initial Analysis

### Suspected Root Cause
[Initial thoughts on what might be causing the issue]

### Affected Components
[List files, modules, or systems that might be involved]
`;
}

export function getBugAnalysisTemplate(): string {
  return `# Bug Analysis

## Root Cause Analysis

### Investigation Summary
[Overview of the investigation process and findings]

### Root Cause
[The underlying cause of the bug]

### Contributing Factors
[Any secondary factors that led to or exacerbated the issue]

## Technical Details

### Affected Code Locations
[List specific files, functions, or code sections involved]

- **File**: \`path/to/file.ext\`
  - **Function/Method**: \`functionName()\`
  - **Lines**: \`123-145\`
  - **Issue**: [Description of the problem in this location]

### Data Flow Analysis
[How data moves through the system and where it breaks]

### Dependencies
[External libraries, services, or components involved]

## Impact Analysis

### Direct Impact
[Immediate effects of the bug]

### Indirect Impact  
[Secondary effects or potential cascading issues]

### Risk Assessment
[Risks if the bug is not fixed]

## Solution Approach

### Fix Strategy
[High-level approach to solving the problem]

### Alternative Solutions
[Other possible approaches considered]

### Risks and Trade-offs
[Potential risks of the chosen solution]

## Implementation Plan

### Changes Required
[Specific modifications needed]

1. **Change 1**: [Description]
   - File: \`path/to/file\`
   - Modification: [What needs to be changed]

2. **Change 2**: [Description]
   - File: \`path/to/file\`
   - Modification: [What needs to be changed]

### Testing Strategy
[How to verify the fix works]

### Rollback Plan
[How to revert if the fix causes issues]
`;
}

export function getBugVerificationTemplate(): string {
  return `# Bug Verification

## Fix Implementation Summary
[Brief description of what was changed to fix the bug]

## Test Results

### Original Bug Reproduction
- [ ] **Before Fix**: Bug successfully reproduced
- [ ] **After Fix**: Bug no longer occurs

### Reproduction Steps Verification
[Re-test the original steps that caused the bug]

1. [Step 1] - ✅ Works as expected
2. [Step 2] - ✅ Works as expected  
3. [Step 3] - ✅ Works as expected
4. [Expected outcome] - ✅ Achieved

### Regression Testing
[Verify related functionality still works]

- [ ] **Related Feature 1**: [Test result]
- [ ] **Related Feature 2**: [Test result]
- [ ] **Integration Points**: [Test result]

### Edge Case Testing
[Test boundary conditions and edge cases]

- [ ] **Edge Case 1**: [Description and result]
- [ ] **Edge Case 2**: [Description and result]
- [ ] **Error Conditions**: [How errors are handled]

## Code Quality Checks

### Automated Tests
- [ ] **Unit Tests**: All passing
- [ ] **Integration Tests**: All passing
- [ ] **Linting**: No issues
- [ ] **Type Checking**: No errors

### Manual Code Review
- [ ] **Code Style**: Follows project conventions
- [ ] **Error Handling**: Appropriate error handling added
- [ ] **Performance**: No performance regressions
- [ ] **Security**: No security implications

## Deployment Verification

### Pre-deployment
- [ ] **Local Testing**: Complete
- [ ] **Staging Environment**: Tested
- [ ] **Database Migrations**: Verified (if applicable)

### Post-deployment
- [ ] **Production Verification**: Bug fix confirmed in production
- [ ] **Monitoring**: No new errors or alerts
- [ ] **User Feedback**: Positive confirmation from affected users

## Documentation Updates
- [ ] **Code Comments**: Added where necessary
- [ ] **README**: Updated if needed
- [ ] **Changelog**: Bug fix documented
- [ ] **Known Issues**: Updated if applicable

## Closure Checklist
- [ ] **Original issue resolved**: Bug no longer occurs
- [ ] **No regressions introduced**: Related functionality intact
- [ ] **Tests passing**: All automated tests pass
- [ ] **Documentation updated**: Relevant docs reflect changes
- [ ] **Stakeholders notified**: Relevant parties informed of resolution

## Notes
[Any additional observations, lessons learned, or follow-up actions needed]
`;
}

// Odoo-specific templates

/**
 * Generates Odoo requirements document template with ERP-specific elements.
 * Includes business process alignment, module compatibility, and data migration needs.
 * 
 * @param options Configuration options for the template
 * @returns Markdown template string for Odoo requirements documents
 */
export function getOdooRequirementsTemplate(options: {
  moduleName?: string;
  odooVersion?: string;
  author?: string;
  category?: string;
} = {}): string {
  const {
    moduleName = '{{MODULE_NAME}}',
    odooVersion = '{{ODOO_VERSION}}',
    author = '{{AUTHOR}}',
    category = '{{CATEGORY}}'
  } = options;

  return `# Odoo 模組需求文件 - ${moduleName}

## 模組概況

**模組名稱：** ${moduleName}  
**Odoo 版本：** ${odooVersion}  
**模組版本：** 1.0.0  
**開發者：** ${author}  
**類別：** ${category}  

## 商業需求對齊

### 商業流程影響
[說明此模組如何改善或支援現有的商業流程]

### ROI 評估
- **預期效益：** [量化的商業效益]
- **實施成本：** [開發和維護成本預估]
- **回收期：** [預期投資回收時間]

## 功能需求

### 主要功能 1

**使用者故事：** 身為 [角色]，我希望 [功能]，以便 [效益]

#### 驗收條件
1. 當 [事件] 時，系統應該 [回應]
2. 如果 [前置條件]，則系統應該 [回應]  
3. 當 [事件] 且 [條件] 時，系統應該 [回應]

#### Odoo 特定需求
- **模型需求：** [需要建立或修改的模型]
- **視圖需求：** [Form/Tree/Kanban 等視圖需求]
- **權限需求：** [存取控制和安全性需求]
- **工作流程：** [狀態流轉和核准流程]

## 非功能性需求

### 效能需求
- **資料量：** 預期處理 [數量] 筆記錄
- **並發用戶：** 支援 [數量] 位同時使用者
- **回應時間：** [具體時間要求]

### 安全性需求
- **資料保護：** [敏感資料保護措施]
- **存取控制：** [用戶權限分級]
- **稽核追蹤：** [操作記錄需求]

### 相容性需求
- **Odoo 版本：** ${odooVersion} 及後續版本
- **瀏覽器支援：** [支援的瀏覽器版本]
- **行動裝置：** [行動端支援需求]

## 整合需求

### 與核心模組整合
- **Sales (sale)：** [整合方式和資料交換]
- **Purchase (purchase)：** [整合方式和資料交換]
- **Inventory (stock)：** [整合方式和資料交換]
- **Accounting (account)：** [整合方式和資料交換]

### 資料模型需求
\`\`\`python
# 範例資料模型結構
class ${moduleName.replace(/_/g, '').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}(models.Model):
    _name = '${moduleName}.main'
    _description = '${moduleName} 主記錄'
    
    name = fields.Char('名稱', required=True)
    description = fields.Text('說明')
    state = fields.Selection([
        ('draft', '草稿'),
        ('confirmed', '確認'),
        ('done', '完成'),
    ], default='draft')
\`\`\`

## 驗證和測試需求

### 單元測試
- **模型測試：** [資料模型驗證]
- **方法測試：** [商業邏輯驗證]
- **計算欄位測試：** [計算邏輯驗證]

### 整合測試
- **模組間測試：** [跨模組功能測試]
- **工作流程測試：** [完整業務流程測試]
- **權限測試：** [角色權限驗證]

## 部署和維護需求

### 部署需求
- **部署環境：** [開發/測試/生產環境需求]
- **資料庫變更：** [資料庫遷移指令]
- **相依性：** [依賴的其他模組]

### 維護需求
- **監控：** [系統監控指標]
- **備份：** [資料備份策略]
- **更新：** [模組更新流程]

## 風險評估

### 技術風險
1. **風險：** [技術風險描述]
   - **影響：** [風險影響評估]
   - **緩解措施：** [風險控制方法]

### 商業風險
1. **風險：** [商業風險描述]
   - **影響：** [風險影響評估]
   - **緩解措施：** [風險控制方法]

## 成功指標

### 關鍵績效指標 (KPI)
- **使用率：** [用戶採用率目標]
- **效率提升：** [作業效率改善目標]
- **錯誤率：** [系統錯誤率控制]
- **滿意度：** [用戶滿意度目標]
`;
}

/**
 * Generates Odoo design document template with ERP architecture patterns.
 * Includes model relationships, view hierarchies, and Odoo-specific patterns.
 */
export function getOdooDesignTemplate(options: {
  moduleName?: string;
  odooVersion?: string;
  pythonVersion?: string;
} = {}): string {
  const {
    moduleName = '{{MODULE_NAME}}',
    odooVersion = '{{ODOO_VERSION}}',
    pythonVersion = '{{PYTHON_VERSION}}'
  } = options;

  return `# Odoo 模組設計文件 - ${moduleName}

## 模組概覽

**模組名稱：** ${moduleName}  
**技術堆疊：** Python ${pythonVersion} + Odoo ${odooVersion}  
**資料庫：** PostgreSQL  
**架構模式：** MVC (Model-View-Controller)

## Steering Documents 對齊

### 技術標準 (technical-stack.md)
- **Python 版本：** 遵循 ${pythonVersion} 標準
- **程式碼風格：** 遵循 PEP 8 和 Odoo 編碼規範
- **資料庫設計：** 遵循 PostgreSQL 最佳實務

### 模組標準 (module-standards.md)
- **模組結構：** 遵循 Odoo 標準模組架構
- **檔案命名：** 遵循 Odoo 命名慣例
- **版本控制：** 遵循語義版本控制

## 系統架構

### 整體架構圖
\`\`\`mermaid
graph TB
    UI[前端介面] --> Controller[控制器層]
    Controller --> Model[模型層]
    Model --> DB[(PostgreSQL)]
    
    Model --> |繼承| BaseModel[Odoo BaseModel]
    Controller --> |使用| ORM[Odoo ORM]
    
    subgraph "Odoo Framework"
        BaseModel
        ORM
        Security[安全框架]
        Workflow[工作流引擎]
    end
    
    Model --> Security
    Controller --> Workflow
\`\`\`

## 資料模型設計

### 主要模型
\`\`\`python
class ${moduleName.replace(/_/g, '').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}(models.Model):
    _name = '${moduleName}.main'
    _description = '${moduleName} 主記錄'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'
    
    # 基礎欄位
    name = fields.Char('名稱', required=True, tracking=True)
    description = fields.Text('說明')
    
    # 狀態管理
    state = fields.Selection([
        ('draft', '草稿'),
        ('confirmed', '確認'),
        ('done', '完成'),
        ('cancelled', '取消'),
    ], default='draft', string='狀態', tracking=True)
    
    # 關聯欄位
    partner_id = fields.Many2one('res.partner', string='合作夥伴')
    company_id = fields.Many2one('res.company', string='公司', 
                                default=lambda self: self.env.company)
    
    # 計算欄位
    total_amount = fields.Float('總金額', compute='_compute_total_amount',
                               store=True)
\`\`\`

## 商業邏輯設計

### 狀態管理
\`\`\`python
def action_confirm(self):
    \"\"\"確認功能\"\"\"
    for record in self:
        if record.state != 'draft':
            raise UserError('只有草稿狀態可以確認')
        record.state = 'confirmed'

@api.depends('line_ids.subtotal')
def _compute_total_amount(self):
    \"\"\"計算總金額\"\"\"
    for record in self:
        record.total_amount = sum(record.line_ids.mapped('subtotal'))
\`\`\`

## 用戶介面設計

### Form View (表單視圖)
\`\`\`xml
<record id="${moduleName}_main_view_form" model="ir.ui.view">
    <field name="name">${moduleName}.main.view.form</field>
    <field name="model">${moduleName}.main</field>
    <field name="arch" type="xml">
        <form>
            <header>
                <button name="action_confirm" type="object" 
                        string="確認" class="oe_highlight"
                        attrs="{'invisible': [('state', '!=', 'draft')]}"/>
                <field name="state" widget="statusbar"/>
            </header>
            <sheet>
                <group>
                    <field name="name"/>
                    <field name="partner_id"/>
                    <field name="description"/>
                </group>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
\`\`\`

## 測試策略

### 單元測試
\`\`\`python
from odoo.tests import TransactionCase
from odoo.exceptions import UserError

class Test${moduleName.replace(/_/g, '').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}(TransactionCase):
    
    def setUp(self):
        super().setUp()
        self.main_model = self.env['${moduleName}.main']
        self.partner = self.env.ref('base.res_partner_1')
    
    def test_create_main(self):
        \"\"\"測試建立主記錄\"\"\"
        main = self.main_model.create({
            'name': 'Test Record',
            'partner_id': self.partner.id,
        })
        self.assertEqual(main.state, 'draft')
        self.assertEqual(main.name, 'Test Record')
\`\`\`

## 版本升級和相容性

### 版本相容性
- **${odooVersion}：** 主要支援版本
- **向後相容：** 支援前一個 LTS 版本
- **向前相容：** 考慮下一個版本的變更
`;
}

/**
 * Generates Odoo tasks document template with ERP development workflow.
 * Includes phase-based development with Odoo-specific atomic tasks.
 */
export function getOdooTasksTemplate(options: {
  moduleName?: string;
  odooVersion?: string;
} = {}): string {
  const {
    moduleName = '{{MODULE_NAME}}',
    odooVersion = '{{ODOO_VERSION}}'
  } = options;

  return `# Odoo 模組實施計畫 - ${moduleName}

## 任務概覽
基於 Odoo ${odooVersion} 框架的模組開發，遵循 MVC 架構和 Odoo 最佳實務。

## Steering Documents 合規性
- **模組標準：** 遵循 module-standards.md 中的結構規範
- **技術堆疊：** 符合 technical-stack.md 的技術選擇
- **商業規則：** 實現 business-rules.md 定義的業務邏輯

## 原子任務需求 (Odoo 特化)
**每個任務必須符合以下 Odoo 開發最佳實務：**
- **檔案範圍：** 每次最多修改 1-2 個相關的 Python/XML 檔案
- **時間限制：** 15-30 分鐘內可完成的 Odoo 開發任務
- **單一目的：** 一個可測試的 Odoo 功能或元件
- **明確檔案：** 指定確切的 Python 模型、XML 視圖或配置檔案
- **Odoo 相容：** 符合 Odoo 編碼標準和框架慣例

## 實施任務

### Phase 1: 模組基礎架構

- [ ] 1. 建立模組基礎結構和 manifest 檔案
  - 檔案: \`${moduleName}/__manifest__.py\`, \`${moduleName}/__init__.py\`
  - 建立模組目錄結構 (models/, views/, security/, data/, static/)
  - 定義模組 manifest 包含名稱、版本、依賴、資料檔案
  - 設定模組初始化檔案導入所有子模組
  - 目的: 建立 Odoo 模組的基礎架構
  - _需求: 1.1_

- [ ] 2. 建立主要資料模型 ${moduleName}_main.py
  - 檔案: \`${moduleName}/models/${moduleName}_main.py\`
  - 定義主要模型類別繼承 models.Model 和 mail.thread
  - 新增基礎欄位 (name, description, state, partner_id, company_id)
  - 實作狀態管理選項 (draft, confirmed, done, cancelled)
  - 新增計算欄位 total_amount 和相關的 @api.depends 方法
  - 目的: 建立模組的核心資料模型
  - _利用: odoo/models.py, mail/thread.py_
  - _需求: 2.1, 2.2_

### Phase 2: 用戶介面開發

- [ ] 3. 建立主要表單視圖 (Form View)
  - 檔案: \`${moduleName}/views/${moduleName}_views.xml\`
  - 建立 ir.ui.view 記錄定義表單視圖架構
  - 新增 header 區域包含狀態按鈕和 statusbar
  - 建立 sheet 包含基本欄位的群組布局
  - 整合 chatter (message_follower_ids, message_ids) 
  - 目的: 建立用戶資料輸入和查看的主要介面
  - _需求: 4.1_

- [ ] 4. 建立列表視圖 (Tree View)
  - 檔案: \`${moduleName}/views/${moduleName}_views.xml\` (續前一任務)
  - 新增 ir.ui.view 記錄定義樹狀列表視圖
  - 顯示關鍵欄位: name, partner_id, total_amount, state, create_date
  - 設定欄位寬度和對齊方式最佳化
  - 目的: 提供記錄的總覽列表介面
  - _需求: 4.2_

### Phase 3: 商業邏輯實作

- [ ] 5. 實作狀態轉換方法
  - 檔案: \`${moduleName}/models/${moduleName}_main.py\` (續任務 2)
  - 新增 action_confirm() 方法處理草稿到確認狀態轉換
  - 新增 action_done() 方法處理確認到完成狀態轉換  
  - 新增 action_cancel() 方法處理取消邏輯
  - 加入狀態驗證和錯誤處理 UserError
  - 目的: 實作模組的核心業務流程控制
  - _需求: 5.1_

- [ ] 6. 設定模型存取權限
  - 檔案: \`${moduleName}/security/ir.model.access.csv\`
  - 為主模型建立存取權限記錄
  - 設定一般用戶 (group_user) 的讀寫權限
  - 設定管理員 (group_system) 的完整權限
  - 目的: 確保資料安全和權限控制
  - _需求: 3.1_

### Phase 4: 測試和最佳化

- [ ] 7. 建立單元測試
  - 檔案: \`${moduleName}/tests/__init__.py\`, \`${moduleName}/tests/test_${moduleName}.py\`
  - 建立 TransactionCase 測試類別
  - 測試模型建立、狀態轉換、計算欄位功能
  - 測試資料驗證約束和錯誤處理
  - 目的: 確保程式碼品質和功能正確性
  - _利用: odoo.tests.TransactionCase_
  - _需求: 8.1_

- [ ] 8. 新增示範資料
  - 檔案: \`${moduleName}/demo/${moduleName}_demo.xml\`
  - 建立示範的主記錄資料
  - 包含不同狀態的範例記錄
  - 關聯到系統預設的合作夥伴
  - 目的: 提供模組功能展示和測試資料
  - _需求: 8.2_

## 版本相容性考量

### Odoo ${odooVersion} 特定功能
- 使用新的 ORM API (@api.model, @api.depends, @api.constrains)
- 利用改進的 mail.thread 整合功能
- 採用最新的 QWeb 報表引擎
- 遵循 ${odooVersion} 的安全框架升級

### 部署檢查清單

#### 生產部署前確認
- [ ] 所有測試通過
- [ ] 權限設定正確
- [ ] 示範資料僅在開發環境載入
- [ ] 效能指標符合預期
- [ ] 安全掃描無高風險問題
`;
}