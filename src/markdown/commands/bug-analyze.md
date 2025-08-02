# Bug Analyze Command

Investigate and analyze the root cause of a reported bug.

## Usage
```
/bug-analyze [bug-name]
```

## Phase Overview
**Your Role**: Investigate the bug and identify the root cause

This is Phase 2 of the bug fix workflow. Your goal is to understand why the bug is happening and plan the fix approach.

## Instructions

**Agent-Based Analysis (Recommended)**: First check if agents are enabled:

```bash
npx @pimzino/claude-code-spec-workflow@latest using-agents
```

If this returns `true`, use the `bug-root-cause-analyzer` agent for comprehensive root cause analysis:

```
Use the bug-root-cause-analyzer agent to perform enhanced root cause analysis for the {bug-name} bug.

The agent should:
1. Load the bug report from .claude/bugs/{bug-name}/report.md
2. Perform git archaeology to find when the bug was introduced
3. Analyze git history for similar issues and patterns
4. Investigate code context and evolution
5. Assess impact and relationships
6. Develop prevention strategies
7. Provide comprehensive analysis with fix recommendations

Context for analysis:
- Bug report with symptoms and reproduction steps
- Git history for pattern recognition
- Related code and its evolution
- Similar historical issues and fixes
```

**Manual Analysis (Fallback)**: If agents are not enabled, follow this process:

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
   - **Template to Follow**: Use the exact structure from `.claude/templates/bug-analysis-template.md`
   - **Read and follow**: Load the template and follow all sections precisely
   - Document investigation findings following the template structure

## Template Usage
- **Follow exact structure**: Use `.claude/templates/bug-analysis-template.md` precisely
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
After approval, proceed to `/bug-fix`.