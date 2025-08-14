# Bug Report: Incorrect Bug Status Display in Dashboard

## Bug Summary
The dashboard is displaying incorrect statuses for bug reports. Newly created bugs with only template content in their analysis.md and verification.md files are being shown as "analyzing" or "verifying" instead of "reported". The parser's template detection logic is not properly identifying and skipping placeholder content.

## Severity
**Medium** - Incorrect status display causes confusion about actual bug workflow state

## Reproduction Steps
1. Create a new bug report using `/bug-create` command
2. Ensure the bug has report.md, analysis.md, and verification.md files with default template content
3. Start the dashboard with `pnpm run dashboard`
4. Navigate to the Bugs section in the dashboard
5. Observe that bugs show incorrect statuses:
   - build-fails-typecheck: Shows as "analyzing" (should be "reported")
   - wrong-title: Shows as "verifying" (should be "reported")
   - dashboard-spec-complete-sorting: Shows as "verifying" (should be "analyzing")

## Expected Behavior
- Bugs with only template content in analysis.md should show as "reported"
- Bugs with only template content in verification.md should not show as "verifying"
- Bug status should accurately reflect the actual workflow phase:
  - "reported" - Only report.md has content
  - "analyzing" - analysis.md has actual analysis content (not just template)
  - "fixing" - fix.md exists with implementation details
  - "verifying" - verification.md has actual test results
  - "resolved" - Bug is verified and closed

## Actual Behavior
- The parser incorrectly identifies template content as actual content
- Bugs with verification.md files containing "*To be completed after fix implementation*" are marked as "verifying"
- Bugs with analysis.md files containing "**Pending** - Analysis not yet started" are marked as "analyzing"
- The `hasVerificationContent` method fails to properly filter out italic placeholder text

## Impact
- **User Confusion**: Dashboard shows misleading workflow status
- **Workflow Disruption**: Users can't tell which bugs actually need attention
- **Process Visibility**: Loss of accurate tracking for bug fix progress
- **Team Communication**: Incorrect status causes miscommunication about bug states

## Technical Details

### Root Cause Location
File: `src/dashboard/parser.ts`

The issue is in the template detection logic within:
1. `hasVerificationContent` method (lines 1227-1282)
2. `hasContentAfterSection` method (lines 1187-1226)

### Specific Problems

1. **Italic text detection** (line 1271):
   ```typescript
   !trimmed.match(/^\*.*\*$/) && // Skip italic placeholder text
   ```
   This regex only matches if the ENTIRE line is wrapped in asterisks, but doesn't catch:
   - Multi-line italic text
   - Italic text with other characters on the same line
   - The actual template format: "*To be completed after fix implementation*"

2. **Template text detection** (lines 1272-1274):
   The hardcoded strings don't match all template variations:
   - Doesn't catch "To be performed after" 
   - Doesn't catch "To be defined after"
   - Doesn't catch "pending" variations

3. **Status section handling**:
   The parser doesn't recognize "**Pending**" as a template marker in the Status section

### Affected Bugs
- **build-fails-typecheck**: Has verification.md with template → incorrectly shows "analyzing"
- **wrong-title**: Has verification.md with template → incorrectly shows "verifying"  
- **dashboard-spec-complete-sorting**: Has approved analysis → correctly shows "analyzing" but user expects "fixing"

## Environment
- Project: claude-code-spec-workflow-2
- File: `src/dashboard/parser.ts`
- Dashboard version: Current main branch
- Bug workflow: Report → Analyze → Fix → Verify

## Additional Context
- The bug workflow uses standard templates created by `/bug-create` command
- Template files contain placeholder text in italics and "Pending" status markers
- The parser should recognize these patterns and treat files as empty templates
- The dashboard-spec-complete-sorting bug has actual analysis content (marked "✅ APPROVED") so "analyzing" may be correct

## Proposed Solution
1. **Improve italic text detection**: Use a more comprehensive regex or parse markdown properly
2. **Expand template detection**: Add more template phrase variations
3. **Add Status field checking**: Recognize "**Pending**" in Status sections as template content
4. **Consider markdown parsing**: Use a proper markdown parser to identify placeholder content
5. **Add explicit template markers**: Use HTML comments or special markers to identify template sections

## Test Cases
After fix, verify:
1. New bugs with only templates show as "reported"
2. Bugs with actual analysis content show as "analyzing"
3. Bugs with verification templates don't show as "verifying"
4. Status progression follows actual content, not file presence

---
*Bug reported: 2025-08-13*