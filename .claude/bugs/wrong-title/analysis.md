# Bug Analysis: Wrong Title Display

## Root Cause Analysis

### Investigation Summary
Investigated the spec parser's title extraction logic in the dashboard. The parser attempts to extract meaningful feature names from markdown headings in spec documents. However, when encountering standard document titles with approval status indicators (like "# Requirements Document ✅ APPROVED"), the regex incorrectly captures the status indicator as the feature name.

### Root Cause
The regex pattern on line 239 of `src/dashboard/parser.ts` is designed to extract feature names from various heading formats but fails to exclude status indicators. When it encounters "# Requirements Document ✅ APPROVED", it captures "✅ APPROVED" as group 1, which then becomes the display name.

The pattern:
```typescript
/^#\s+(?:Requirements(?:\s+Document)?\s*[-:]\s+)?(.+?)(?:\s+Requirements)?$/m
```

This regex:
1. Matches the heading marker and whitespace: `^#\s+`
2. Optionally matches "Requirements" or "Requirements Document" with separator: `(?:Requirements(?:\s+Document)?\s*[-:]\s+)?`
3. Captures everything after that as the feature name: `(.+?)`
4. Optionally matches trailing "Requirements": `(?:\s+Requirements)?`

### Contributing Factors
- The validation logic (line 240) checks if the extracted text isn't "requirements" or "document" but doesn't check for status indicators
- The parser prioritizes extracted titles over the formatted directory name without validating content quality
- No pattern recognition for common status indicators (✅, ✓, APPROVED, etc.)

## Technical Details

### Affected Code Locations

- **File**: `src/dashboard/parser.ts`
  - **Method**: `getSpec()`
  - **Lines**: `239-242`
  - **Issue**: Regex captures status indicators as feature names

- **File**: `src/dashboard/parser.ts`
  - **Method**: `formatDisplayName()`
  - **Lines**: `675-680`
  - **Issue**: Fallback mechanism works correctly but is overridden by flawed extraction

### Data Flow Analysis
1. Spec parser creates initial displayName from directory name using `formatDisplayName()` (line 228)
2. Parser reads requirements.md and attempts to extract a better title (lines 239-242)
3. If extraction "succeeds" (finds non-empty, non-"requirements", non-"document" text), it overwrites the good default
4. Dashboard UI displays the incorrect extracted title instead of the formatted directory name

### Dependencies
- Node.js fs/promises for file reading
- Regular expressions for pattern matching
- No external libraries involved in this bug

## Impact Analysis

### Direct Impact
- Users see "✅ APPROVED" or similar status indicators as spec names in the dashboard
- Spec identification becomes difficult when multiple specs show the same status text
- Professional appearance is compromised

### Indirect Impact  
- Navigation confusion when selecting specs from the list
- Potential for selecting wrong spec due to identical display names
- Reduced trust in the tool's quality

### Risk Assessment
- **Low technical risk**: Display-only issue, no data corruption
- **Medium UX risk**: Confuses users and reduces usability
- **Low security risk**: No security implications

## Solution Approach

### Fix Strategy
Enhance the title extraction logic to:
1. Detect and exclude common status indicators from captured titles
2. Validate extracted titles for meaningful content
3. Fall back to formatted directory name when extraction yields poor results

### Alternative Solutions
1. **Option A (Recommended)**: Add status indicator detection to validation logic
   - Pros: Simple, targeted fix that preserves existing functionality
   - Cons: May need updates as new status patterns emerge

2. **Option B**: Modify regex to explicitly exclude status patterns
   - Pros: Prevents capture at the source
   - Cons: Complex regex, harder to maintain

3. **Option C**: Remove title extraction entirely, always use directory names
   - Pros: Consistent, predictable behavior
   - Cons: Loses ability to have more descriptive titles

### Risks and Trade-offs
- Risk of over-filtering legitimate titles that happen to include emoji
- Need to balance between catching all status indicators and allowing creative titles
- Solution should be maintainable and easy to extend

## Implementation Plan

### Changes Required

1. **Change 1**: Enhance title validation logic
   - File: `src/dashboard/parser.ts`
   - Modification: Add check for status indicators in extracted title (line 240)
   - Add pattern to detect: ✅, ✓, ❌, ✗, APPROVED, PENDING, DRAFT, WIP

2. **Change 2**: Create status indicator detection utility
   - File: `src/dashboard/parser.ts`
   - Modification: Add private method `isStatusIndicator()` to check if text is primarily status
   - Use in validation conditions alongside existing checks

### Testing Strategy
1. Unit test the new `isStatusIndicator()` method with various status patterns
2. Test title extraction with documents containing status indicators
3. Verify fallback to directory name works correctly
4. Test that legitimate titles without status indicators still work
5. Manual testing with the reported case: "# Requirements Document ✅ APPROVED"

### Rollback Plan
If the fix causes unexpected title extraction issues:
1. Revert the changes to parser.ts
2. Temporarily disable title extraction by commenting out lines 239-242
3. All specs will show formatted directory names until a better fix is developed