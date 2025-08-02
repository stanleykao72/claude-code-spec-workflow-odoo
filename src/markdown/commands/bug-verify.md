# Bug Verify Command

Verify that the bug fix works correctly and doesn't introduce regressions.

## Usage
```
/bug-verify [bug-name]
```

## Phase Overview
**Your Role**: Thoroughly verify the fix works and document the results

This is Phase 4 (final) of the bug fix workflow. Your goal is to confirm the bug is resolved and the fix is safe.

## Instructions

You are working on the verification phase of the bug fix workflow.

1. **Prerequisites**
   - Ensure the fix has been implemented
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
   - **Template to Follow**: Load the verification template using get-content script:
   
   ```bash
   # Windows:
   npx @pimzino/claude-code-spec-workflow@latest get-content "C:\path\to\project\.claude\templates\bug-verification-template.md"
   
   # macOS/Linux:
   npx @pimzino/claude-code-spec-workflow@latest get-content "/path/to/project/.claude/templates/bug-verification-template.md"
   ```
   - Document all test results following the template structure

## Template Usage
- **Follow exact structure**: Use loaded verification template precisely
- **Include all sections**: Don't omit any required template sections
- **Complete checklist**: Follow the template's checklist format for thoroughness

5. **Automated Verification (if agents enabled)**
   First check if agents are available:
   ```bash
   npx @pimzino/claude-code-spec-workflow@latest using-agents
   ```
   
   If this returns `true`, use automated verification agents:
   
   **Integration Testing:**
   ```
   Use the spec-integration-tester agent to perform comprehensive verification of the bug fix for {bug-name}.
   
   The agent should:
   1. Load bug context documents from .claude/bugs/{bug-name}/
   2. Analyze the original bug reproduction steps
   3. Run automated tests for the fix
   4. Validate integration points and API contracts
   5. Check for regressions using git history analysis
   6. Verify the fix works in different scenarios
   7. Provide comprehensive verification feedback
   
   This ensures thorough validation of the bug fix.
   ```
   
   **Performance Impact Analysis:**
   First check if agents are available:
   ```bash
   npx @pimzino/claude-code-spec-workflow@latest using-agents
   ```
   
   If this returns true, use the performance analyzer:
   ```
   Use the spec-performance-analyzer agent to check performance impact of the bug fix for {bug-name}.
   
   The agent should:
   1. Analyze the performance implications of the fix
   2. Check for any performance regressions
   3. Identify potential optimization opportunities
   4. Validate that the fix doesn't introduce bottlenecks
   5. Recommend performance testing strategies if needed
   
   This ensures the fix doesn't negatively impact system performance.
   ```

6. **Final Approval**
   - Present complete verification results (manual and automated if available)
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