# Requirements: UI Improvements

✅ APPROVED

## Introduction

This feature enhances the Claude Code Spec Workflow dashboard UI to improve visual clarity and information density. The improvements focus on making the dashboard more scannable by reducing visual clutter for completed items and consolidating active session tracking across both specs and bugs.

## Alignment with Product Vision

This feature directly supports the product vision by:
- **Project Visibility**: Enhances the real-time dashboard to show clearer, more focused information
- **Reduced Cognitive Load**: Simplifies the UI to show only relevant information for each item's state
- **Quality Assurance**: Ensures developers can quickly identify what needs attention vs what's complete

## Requirements

### Requirement 1: Compact Display for Completed Specs

**User Story:** As a developer, I want completed specs to display in a compact single-line format, so that I can focus on active work while still seeing completed items at a glance.

#### Acceptance Criteria

1. WHEN a spec has status 'completed' THEN the system SHALL hide the progress bar
2. WHEN a spec has status 'completed' THEN the system SHALL hide the task count display
3. WHEN a spec has status other than 'completed' THEN the system SHALL show the progress bar and task count as normal
4. WHEN viewing the spec list THEN completed specs SHALL maintain their clickable behavior to expand details

### Requirement 2: Compact Display for Resolved Bugs

**User Story:** As a developer, I want resolved bugs to display in a compact format, so that I can quickly scan the bug list and focus on active issues.

#### Acceptance Criteria

1. WHEN a bug has status 'resolved' THEN the system SHALL display it in a more compact format
2. WHEN a bug has status 'resolved' THEN the system SHALL hide detailed progress indicators
3. WHEN a bug has status other than 'resolved' THEN the system SHALL show full bug details including severity, documents, and next actions
4. WHEN viewing resolved bugs THEN they SHALL maintain the ability to view their documents

### Requirement 3: Bug Tracking in Active Sessions

**User Story:** As a developer, I want to see active bugs in the Active Sessions view, so that I have a unified view of all work currently in progress across both specs and bugs.

#### Acceptance Criteria

1. WHEN a bug has status 'analyzing', 'fixing', or 'verifying' THEN the system SHALL include it in the Active Sessions view
2. WHEN displaying a bug in Active Sessions THEN the system SHALL show the bug name, current status, and relevant next command
3. WHEN clicking on an active bug session THEN the system SHALL navigate to that project's bug section
4. IF no bugs are in active statuses THEN the system SHALL only show active spec tasks

### Requirement 4: Single Active Session Per Project

**User Story:** As a developer, I want each project to show only its most recent active session in the Active Sessions view, so that the list remains focused and manageable.

#### Acceptance Criteria

1. WHEN a project has multiple specs with in-progress tasks THEN the system SHALL show only the most recently modified one
2. WHEN a project has both active spec tasks and active bugs THEN the system SHALL show only the most recently modified one
3. WHEN determining recency THEN the system SHALL use the last modification time of the task/bug files
4. WHEN displaying the active session THEN the system SHALL indicate whether it's a spec task or bug

## Non-Functional Requirements

### Performance
- Dashboard updates must remain responsive (< 100ms) with the new active session logic
- The filtering for single active session per project must not impact WebSocket message processing

### Security
- No changes to security requirements - all operations remain local

### Reliability
- The dashboard must gracefully handle edge cases like missing modification times
- The UI must remain functional if bug tracking is not in use for a project

### Usability
- The visual hierarchy must clearly distinguish between active and completed/resolved items
- The compact display must not compromise the ability to access item details
- The Active Sessions view must clearly indicate the type of work (spec vs bug)