# Bug Fix Command

Implement the fix for the analyzed bug.

## Usage
```
/bug-fix [bug-name]
```

## Phase Overview
**Your Role**: Implement the solution based on the approved analysis

This is Phase 3 of the bug fix workflow. Your goal is to implement the fix while following project conventions.

## Instructions

You are working on the fix implementation phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure analysis.md exists and is approved
   - Load complete context using get-content script:
   
   ```bash
   # Load bug context documents
   # Windows:
   npx @pimzino/claude-code-spec-workflow@latest get-content "C:\path\to\project\.claude\bugs\{bug-name}\report.md"
   npx @pimzino/claude-code-spec-workflow@latest get-content "C:\path\to\project\.claude\bugs\{bug-name}\analysis.md"
   
   # macOS/Linux:
   npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/bugs/{bug-name}/report.md"
   npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/bugs/{bug-name}/analysis.md"
   ```
   
   - **Load steering documents** using get-content script:
   ```bash
   # Windows:
   npx @pimzino/claude-code-spec-workflow@latest get-content "C:\path\to\project\.claude\steering\tech.md"
   npx @pimzino/claude-code-spec-workflow@latest get-content "C:\path\to\project\.claude\steering\structure.md"
   
   # macOS/Linux:
   npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/tech.md"
   npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/steering/structure.md"
   ```
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

5. **Post-Implementation Review (if agents enabled)**
   First check if agents are available:
   ```bash
   npx @pimzino/claude-code-spec-workflow@latest using-agents
   ```
   
   If this returns `true`, use the implementation review agents for validation:
   
   **Code Quality Review:**
   ```
   Use the spec-task-implementation-reviewer agent to review the bug fix implementation for {bug-name}.
   
   The agent should:
   1. Load bug context documents from .claude/bugs/{bug-name}/
   2. Load steering documents from .claude/steering/ (if available)
   3. Review the fix implementation for correctness and compliance
   4. Verify the fix addresses the root cause identified in analysis.md
   5. Check that no unintended side effects were introduced
   6. Provide structured feedback on implementation quality
   
   This ensures the bug fix meets quality standards.
   ```
   
   **Duplication Analysis:**
   First check if agents are available:
   ```bash
   npx @pimzino/claude-code-spec-workflow@latest using-agents
   ```
   
   If this returns `true`, use the duplication detector:
   ```
   Use the spec-duplication-detector agent to analyze the bug fix for code duplication.
   
   The agent should:
   1. Scan the bug fix code changes
   2. Identify any duplicated patterns
   3. Suggest opportunities to reuse existing utilities
   4. Recommend refactoring if appropriate
   5. Help maintain DRY principles
   
   This ensures efficient and maintainable code.
   ```

6. **Final Confirmation**
   - Ask: "The fix has been implemented and reviewed. Should we proceed to verification?"
   - **CRITICAL**: Wait for user approval before proceeding

## Critical Rules
- **ONLY** implement the fix outlined in the approved analysis
- **ALWAYS** test the fix thoroughly
- **NEVER** make changes beyond the planned fix scope
- **MUST** wait for user approval before proceeding to verification

## Next Phase
After approval, proceed to `/bug-verify`.