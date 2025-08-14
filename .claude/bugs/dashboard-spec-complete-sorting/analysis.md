# Bug Analysis

## Status
✅ APPROVED

## Root Cause Analysis

### Investigation Summary
Through git archaeology and code analysis, I investigated the dashboard spec sorting issue. The bug was introduced on August 5, 2025 (commit `b831cab`) when sophisticated status-based sorting was implemented in the server-side parser. The WebSocket update mechanism correctly updates individual spec properties but bypasses the sorting logic, which only runs during initial data load or full refresh.

### Root Cause
The WebSocket update handlers in both single-project and multi-project dashboards directly modify client-side spec arrays without re-applying the status-based sorting logic. The sorting algorithm exists exclusively in `src/dashboard/parser.ts` and is not replicated in the client-side WebSocket message handlers.

### Contributing Factors
- Code review gap: WebSocket update handlers weren't reviewed for sorting consistency when status-based sorting was implemented
- Architecture separation: Sorting logic is isolated to server-side without client-side equivalent
- Test coverage gap: No automated tests verify WebSocket update sorting behavior
- Pattern inconsistency: Similar issues were fixed for active sessions but not applied to spec updates

## Technical Details

### Affected Code Locations

- **File**: `src/dashboard/public/multi-app.js`
  - **Function/Method**: WebSocket message handler (`case 'spec-update'`)
  - **Lines**: `128-137`
  - **Issue**: Updates spec in array but doesn't trigger re-sort

- **File**: `src/dashboard/public/app.js`
  - **Function/Method**: `updateSpec(updatedSpec)`
  - **Lines**: `158-216`
  - **Issue**: Modifies spec array without applying sorting logic

- **File**: `src/dashboard/parser.ts`
  - **Function/Method**: `getAllSpecs()` and `getAllBugs()`
  - **Lines**: Various
  - **Issue**: Contains correct sorting logic but only called during initial load

- **File**: `src/dashboard/multi-server.ts`
  - **Function/Method**: WebSocket spec update broadcasting
  - **Lines**: Various
  - **Issue**: Correctly broadcasts updates but doesn't coordinate sorting

### Data Flow Analysis
1. **Initial Load**: Server calls `parser.getAllSpecs()` → applies status-based sorting → sends sorted data to client
2. **WebSocket Update**: File watcher detects change → server parses individual spec → broadcasts `spec-update` message → client updates array directly
3. **Breaking Point**: Client-side update skips sorting step, leaving completed specs in wrong positions
4. **Manual Refresh**: Triggers full reload → server re-applies sorting → correct order restored

### Dependencies
- **chokidar**: File watching system that triggers WebSocket updates
- **WebSocket**: Real-time communication between server and dashboard
- **Vue.js/petite-vue**: Client-side reactive state management
- **Node.js fs**: File system operations for parsing spec files

## Impact Analysis

### Direct Impact
- Completed specs remain in original positions instead of moving to end of list
- Users must manually refresh browser to see correct sort order
- Visual confusion when monitoring multiple active specs
- Inconsistent behavior between initial load (correct) and real-time updates (incorrect)

### Indirect Impact
- Degraded user experience for dashboard's core value proposition (real-time monitoring)
- Reduced confidence in dashboard reliability
- Increased cognitive load for users managing multiple specs
- Potential workflow disruption for teams relying on visual organization

### Risk Assessment
- **User Experience**: Medium risk - workaround exists but affects usability
- **Data Integrity**: Low risk - no data loss, only display ordering issue
- **System Stability**: Low risk - bug doesn't affect core functionality
- **Future Features**: Medium risk - similar issues may affect new features (bugs, other status changes)

## Solution Approach

### Fix Strategy
Implement client-side sorting logic that mirrors the server-side sorting algorithm. Add sorting function calls to both WebSocket update handlers to maintain consistent order after any spec status change.

**Benefits:**
- Minimal code change with immediate fix
- Consistent behavior across all update mechanisms
- Preserves existing server-side sorting as source of truth
- Low risk implementation

### Alternative Solutions
1. **Full refresh approach**: Trigger complete data reload after spec updates (higher performance cost)
2. **Server-side sorting broadcast**: Send pre-sorted array with each update (increased WebSocket payload)
3. **Vue reactivity**: Implement computed properties for automatic sorting (architectural change)

### Risks and Trade-offs
- **Performance**: Client-side sorting adds minimal computational overhead
- **Consistency**: Risk of client-side sorting diverging from server-side logic
- **Maintenance**: Need to keep both sorting implementations in sync
- **Testing**: Requires additional test coverage for client-side behavior

## Implementation Plan

### Changes Required

1. **Multi-project dashboard sorting**
   - File: `src/dashboard/public/multi-app.js`
   - Modification: Add `sortSpecs()` method and call after spec updates in WebSocket handler (lines 132-137)

2. **Single-project dashboard sorting**
   - File: `src/dashboard/public/app.js`
   - Modification: Add `sortSpecs()` method and call in `updateSpec()` method (lines 212-216)

3. **Extract sorting utility** (recommended)
   - File: `src/dashboard/public/sorting-utils.js` (new)
   - Modification: Create shared sorting function that matches server-side logic

4. **Bug sorting consistency** (future-proofing)
   - File: Both dashboard files
   - Modification: Apply same sorting logic to bug updates

### Testing Strategy
1. **Manual Testing**: Start dashboard, complete a spec, verify it moves to end of list
2. **WebSocket Integration Tests**: Automated tests for spec status change sorting
3. **Cross-browser Testing**: Verify behavior in different browsers
4. **Performance Testing**: Measure impact of client-side sorting operations
5. **Regression Testing**: Ensure manual refresh still works correctly

### Rollback Plan
1. **Git revert**: Simple rollback of changes if issues arise
2. **Feature flag**: Implement toggle for client-side sorting if needed
3. **Monitoring**: Track WebSocket update frequency and client performance
4. **Fallback behavior**: Maintain existing manual refresh functionality as backup