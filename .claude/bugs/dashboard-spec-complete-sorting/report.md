# Bug Report

## Status
✅ APPROVED

## Bug Summary
When a spec completes while the dashboard is running, the spec list doesn't automatically re-sort to move the completed spec to the end of the list, requiring a manual refresh to see the correct order.

## Bug Details

### Expected Behavior
When a spec's status changes to "completed" while the dashboard is running:
1. The spec should automatically move to its correct position in the sorted list
2. Completed specs should appear at the end of the list (based on current sorting logic)
3. The UI should update in real-time without requiring a page refresh

### Actual Behavior  
When a spec completes while the dashboard is running:
1. The spec status updates to show "completed" 
2. The spec remains in its current position in the list
3. The list doesn't re-sort automatically
4. A manual page refresh is required to see the spec in its correct sorted position

### Steps to Reproduce
1. Open the Claude Code Spec Workflow dashboard
2. Have at least one spec in "in-progress" status
3. Complete all tasks in the spec (mark them as done)
4. Observe that the spec status changes to "completed"
5. Notice that the spec doesn't move to the end of the list
6. Refresh the page manually
7. Observe that the spec is now correctly positioned at the end

### Environment
- **Version**: Current main branch (post UI improvements implementation)
- **Platform**: All platforms (macOS, Windows, Linux)
- **Configuration**: Both single-project and multi-project dashboards

## Impact Assessment

### Severity
- [ ] Critical - System unusable
- [ ] High - Major functionality broken
- [x] Medium - Feature impaired but workaround exists
- [ ] Low - Minor issue or cosmetic

### Affected Users
All users of the Claude Code Spec Workflow dashboard who are actively monitoring spec progress.

### Affected Features
- Spec list sorting in both single and multi-project dashboards
- Real-time UI updates via WebSocket
- Visual organization of specs by status

## Additional Context

### Error Messages
```
No error messages - this is a UI state management issue
```

### Screenshots/Media
The issue is visual - completed specs remain in their original position instead of moving to the end of the list where other completed specs are grouped.

### Related Issues
- Related to the recent UI improvements implementation
- May affect the new compact display for completed specs feature
- Similar issue might exist for bug status changes (e.g., when a bug changes to "resolved")

## Initial Analysis

### Suspected Root Cause
The WebSocket update handler likely updates the spec's status but doesn't trigger a re-sort of the spec list. The sorting logic appears to only run on initial load or full refresh, not on individual spec updates.

### Affected Components
- `src/dashboard/public/multi-app.js` - Vue app WebSocket message handling
- `src/dashboard/public/app.js` - Single project dashboard app
- `src/dashboard/multi-server.ts` - WebSocket spec update broadcasting
- `src/dashboard/server.ts` - Single project server WebSocket handling
- Sorting logic in the Vue reactive state management