# Implementation Plan: UI Improvements

✅ APPROVED

## Task Overview

This implementation plan breaks down the UI improvements into atomic tasks focused on conditional rendering for completed/resolved items and extending the active sessions view. Each task modifies specific files in the dashboard subsystem, leveraging existing Vue.js patterns and WebSocket infrastructure.

## Steering Document Compliance

- **structure.md**: All changes contained within `src/dashboard/` directory, respecting module boundaries
- **tech.md**: Uses existing petite-vue patterns, maintains WebSocket architecture, follows TypeScript conventions

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

- [x] 1. Hide progress bar for completed specs in multi-dashboard HTML
  - File: src/dashboard/public/multi.html
  - Add `&& spec.status !== 'completed'` condition to progress bar v-if directive
  - Locate the progress bar div around line 815-823
  - Purpose: Hide visual clutter for completed specs
  - _Leverage: Existing v-if directive pattern_
  - _Requirements: 1.1_

- [x] 2. Hide task count for completed specs in multi-dashboard HTML
  - File: src/dashboard/public/multi.html
  - Add `&& spec.status !== 'completed'` condition to task count span v-if
  - Locate the task count span around line 793-796
  - Purpose: Remove task count display for completed specs
  - _Leverage: Existing v-if directive pattern_
  - _Requirements: 1.2_

- [x] 3. Apply same hiding logic to single-project dashboard
  - File: src/dashboard/public/index.html
  - Add `&& spec.status !== 'completed'` to progress bar v-if (around line 693)
  - Add `&& spec.status !== 'completed'` to task count span v-if (around line 661)
  - Purpose: Maintain consistency across both dashboard views
  - _Leverage: Same v-if patterns as multi.html_
  - _Requirements: 1.1, 1.2_

- [ ] 4. Create conditional rendering for resolved bugs in multi-dashboard
  - File: src/dashboard/public/multi.html
  - Wrap bug severity, documents, and next action sections in `v-if="bug.status !== 'resolved'"`
  - Add this condition around lines 1105-1195
  - Keep bug name and status pill always visible
  - Purpose: Compact display for resolved bugs
  - _Leverage: Existing bug status conditions_
  - _Requirements: 2.1, 2.2_

- [ ] 5. Apply bug compact display to single-project dashboard
  - File: src/dashboard/public/index.html
  - Wrap bug details in `v-if="bug.status !== 'resolved'"` (around lines 927-1017)
  - Keep bug name and status pill always visible
  - Purpose: Maintain consistency across dashboards
  - _Leverage: Same conditional pattern as multi.html_
  - _Requirements: 2.1, 2.2_

- [ ] 6. Define ActiveSession TypeScript interface
  - File: src/dashboard/multi-server.ts
  - Add discriminated union types for ActiveSession after line 25
  - Define BaseActiveSession, ActiveSpecSession, and ActiveBugSession interfaces
  - Include type field to distinguish spec vs bug sessions
  - Purpose: Type-safe representation of active work items
  - _Leverage: Existing Task interface pattern_
  - _Requirements: 3.2, 4.1_

- [ ] 7. Rename and extend collectActiveTasks to collectActiveSessions
  - File: src/dashboard/multi-server.ts
  - Rename method from collectActiveTasks to collectActiveSessions (line 388)
  - Update return type to ActiveSession[]
  - Keep existing spec collection logic
  - Purpose: Prepare for bug inclusion
  - _Leverage: Existing task collection logic_
  - _Requirements: 3.1, 4.1_

- [ ] 8. Add bug collection to collectActiveSessions method
  - File: src/dashboard/multi-server.ts
  - After spec collection loop, add bug collection loop
  - Filter bugs by status: analyzing, fixing, verifying
  - Create ActiveBugSession objects with appropriate fields
  - Purpose: Include active bugs in session list
  - _Leverage: state.parser.getAllBugs() method_
  - _Requirements: 3.1, 3.2_

- [ ] 9. Implement single session per project filtering
  - File: src/dashboard/multi-server.ts
  - In collectActiveSessions, group sessions by projectPath
  - Sort each group by lastModified descending
  - Take only the first (most recent) session per project
  - Purpose: Show only most recent active item per project
  - _Leverage: JavaScript array sorting and filtering_
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 10. Update WebSocket message for active sessions
  - File: src/dashboard/multi-server.ts
  - Update all references from activeTasks to activeSessions
  - Change message type from 'active-tasks-update' to 'active-sessions-update'
  - Update initial state message structure
  - Purpose: Reflect new data structure in WebSocket communication
  - _Leverage: Existing WebSocket message patterns_
  - _Requirements: 3.3_

- [ ] 11. Update Vue app state for active sessions
  - File: src/dashboard/public/multi-app.js
  - Rename activeTasks to activeSessions in state (line 10)
  - Update message handlers to use new field name
  - Add type checking for spec vs bug display
  - Purpose: Handle new session data structure in UI
  - _Leverage: Existing Vue reactive state_
  - _Requirements: 3.3, 3.4_

- [ ] 12. Create bug session display in Active Sessions view
  - File: src/dashboard/public/multi.html
  - In active sessions template (around line 518), add v-if branches for session type
  - For type === 'bug', show bug name, status, and next command
  - For type === 'spec', keep existing task display
  - Purpose: Display bugs alongside specs in active view
  - _Leverage: Existing active task template structure_
  - _Requirements: 3.2, 3.4_

- [ ] 13. Add navigation from bug sessions to project view
  - File: src/dashboard/public/multi-app.js
  - Update selectProjectFromTask to handle bug sessions
  - Add logic to navigate to bug section when bug is clicked
  - Set selectedProject and scroll to bug if needed
  - Purpose: Enable navigation from active bug to its details
  - _Leverage: Existing selectProjectFromTask method_
  - _Requirements: 3.3_

- [ ] 14. Add lastModified tracking for session ordering
  - File: src/dashboard/parser.ts
  - Ensure parseSpec includes lastModified from file stats
  - Ensure parseBug includes lastModified from file stats
  - Use most recent modification time across all related files
  - Purpose: Enable accurate session ordering
  - _Leverage: Existing file stat reading logic_
  - _Requirements: 4.2_

- [ ] 15. Write tests for conditional rendering logic
  - File: src/dashboard/tests/ui-improvements.test.ts (new file)
  - Test that completed specs hide progress bars and task counts
  - Test that resolved bugs show compact display
  - Test active session filtering logic
  - Purpose: Ensure UI changes work correctly
  - _Leverage: Jest testing framework, existing test utilities_
  - _Requirements: All_