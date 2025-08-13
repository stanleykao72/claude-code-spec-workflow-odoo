# Bug Report: Wrong Title Display

## Bug Summary
The spec parser incorrectly extracts "✅ APPROVED" as the display name from requirements.md files that have the title "# Requirements Document ✅ APPROVED", resulting in the spec being shown as "Requirements Document ✅ APPROVED" instead of using the proper spec name derived from the directory.

## Severity
**Medium** - UI display issue that affects user understanding but doesn't break functionality

## Reproduction Steps
1. Create a spec with a requirements.md file containing the heading "# Requirements Document ✅ APPROVED"
2. Start the dashboard server with `pnpm run dashboard`
3. Navigate to the dashboard in the browser
4. Observe that the spec is displayed with the title "Requirements Document ✅ APPROVED" instead of a meaningful spec name

## Expected Behavior
- The spec should display a meaningful name derived from the spec directory name (e.g., "feat-location-updates" should display as "Feat Location Updates")
- The "✅ APPROVED" indicator should be recognized as a status marker, not part of the title
- The parser should handle various title formats gracefully without extracting status indicators as the display name

## Actual Behavior
- The regex in parser.ts (line 239) extracts "✅ APPROVED" as the feature name
- This happens because the regex pattern captures everything after "Requirements Document" as the feature name
- The spec is displayed as "Requirements Document ✅ APPROVED" in the dashboard UI

## Impact
- **User Confusion**: Users see an unclear spec name that doesn't represent the actual feature
- **Navigation Issues**: Makes it harder to identify and select the correct spec from the list
- **Professional Appearance**: The display looks incorrect with status markers shown as titles

## Technical Details

### Root Cause Location
File: `src/dashboard/parser.ts:239-241`

The problematic regex:
```typescript
const titleMatch = content.match(/^#\s+(?:Requirements(?:\s+Document)?\s*[-:]\s+)?(.+?)(?:\s+Requirements)?$/m);
```

This regex captures "✅ APPROVED" as group 1 when parsing "# Requirements Document ✅ APPROVED"

### Affected Components
- `src/dashboard/parser.ts`: SpecParser.parseSpec() method
- `src/dashboard/public/index.html`: Line 1252 displays spec.displayName

## Environment
- Project: claude-code-spec-workflow-2
- Dashboard version: Current main branch
- Affected spec: feat-location-updates in ~/Projects/claude-code-spec-workflow

## Additional Context
- The spec's requirements.md file follows a standard format with "# Requirements Document ✅ APPROVED" as the title
- The parser should either:
  1. Exclude status indicators (✅ APPROVED, ✓ APPROVED, etc.) from title extraction
  2. Fall back to using the formatted directory name when no meaningful title is found
  3. Recognize common patterns like "Requirements Document" without additional text as non-titles

## Proposed Solution
Update the regex pattern to:
1. Exclude common status indicators (✅, ✓, APPROVED) from captured titles
2. Detect when the extracted title is just a status indicator and fall back to directory name
3. Add specific handling for the "Requirements Document ✅ APPROVED" pattern

---
*Bug reported: 2025-08-13*