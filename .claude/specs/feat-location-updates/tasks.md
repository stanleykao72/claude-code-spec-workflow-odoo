# Implementation Plan ✅ APPROVED

## Task Overview
Implementation will fix and enhance the existing routing system in `src/dashboard/client/multi-app.ts` to properly sync URL state with application state. The work involves correcting URL patterns, fixing route handling logic, and ensuring proper state restoration on page loads.

## Steering Document Compliance
All modifications remain within the existing `multi-app.ts` file following the tech.md principle of "Feature-based organization" and maintaining the existing state management patterns. No new files are created, adhering to the "Code Reuse First" philosophy.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Each task modifies only 1 file (multi-app.ts)
- **Time Boxing**: Each task completable in 15-30 minutes
- **Single Purpose**: One specific fix or enhancement per task
- **Specific Files**: All tasks target src/dashboard/client/multi-app.ts
- **Agent-Friendly**: Clear before/after states with specific code changes

## Tasks

- [x] 1. Fix updateURL method to use correct URL pattern
  - File: src/dashboard/client/multi-app.ts
  - Change line 1401 from `newPath = '/' + this.getProjectSlug(this.selectedProject);`
  - To: `newPath = '/project/' + this.getProjectSlug(this.selectedProject);`
  - Purpose: Use correct /project/{slug} URL format instead of /{slug}
  - _Leverage: existing updateURL() method at line 1397_
  - _Requirements: 1.1, 4.1_

- [x] 2. Update handleRouteChange to handle root path correctly
  - File: src/dashboard/client/multi-app.ts
  - Modify handleRouteChange() method starting at line 1358
  - Add handling for root path "/" to redirect to "/active"
  - Update condition at line 1362 to include `path === '/'`
  - Purpose: Ensure root path redirects to active sessions view
  - _Leverage: existing handleRouteChange() method_
  - _Requirements: 1.4, 2.4_

- [x] 3. Fix project route pattern matching
  - File: src/dashboard/client/multi-app.ts
  - Keep the regex at line 1369: `/^\/project\/(.+)$/`
  - Remove the fallback pattern matching for `/{slug}` format
  - Purpose: Only match proper /project/{slug} format
  - _Leverage: existing regex pattern matching_
  - _Requirements: 1.2, 4.1_

- [x] 4. Add history.replaceState for initial page load
  - File: src/dashboard/client/multi-app.ts
  - In handleRouteChange() method after setting initial state
  - Add replaceState call when path is "/" or invalid to update URL
  - Purpose: Ensure URL bar reflects actual state on initial load
  - _Leverage: existing History API usage in updateURL()_
  - _Requirements: 1.4, 2.1_

- [x] 5. Enhance project slug generation for special characters
  - File: src/dashboard/client/multi-app.ts
  - Update getProjectSlug() method at line 1410
  - Add handling for unicode characters and improve slug normalization
  - Keep existing hyphen replacement but add trim and lowercase normalization
  - Purpose: Ensure consistent, valid URL slugs for all project names
  - _Leverage: existing getProjectSlug() method_
  - _Requirements: 4.2_

- [ ] 6. Fix project not found handling with proper redirect
  - File: src/dashboard/client/multi-app.ts  
  - In handleRouteChange() at line 1384-1387
  - Ensure history.replaceState is called (not pushState) for invalid projects
  - Update to use replaceState to avoid breaking back button
  - Purpose: Graceful fallback without polluting browser history
  - _Leverage: existing error handling block_
  - _Requirements: 1.5, 2.4, 3.3_

- [ ] 7. Add URL update on WebSocket project deletion
  - File: src/dashboard/client/multi-app.ts
  - In handleWebSocketMessage() update case around line 882
  - Add check if deleted project is currently selected
  - If selected project deleted, reset to active tab and update URL
  - Purpose: Handle project deletion while viewing it
  - _Leverage: existing WebSocket message handler_
  - _Requirements: 2.4, 3.2_

- [ ] 8. Test browser navigation with manual verification
  - File: src/dashboard/client/multi-app.ts
  - Add console.log statements in handleRouteChange() for debugging
  - Log: incoming path, detected route type, final state
  - Add similar logging to updateURL() for state changes
  - Purpose: Enable verification of routing behavior
  - _Leverage: existing console.log patterns in codebase_
  - _Requirements: 2.1, 2.2_

- [ ] 9. Ensure URL consistency across all navigation methods
  - File: src/dashboard/client/multi-app.ts
  - Review all calls to selectProject() (lines 1029, 1035, 1054)
  - Verify each includes updateURL() call
  - Review switchTab() to ensure it updates URL (line 1026)
  - Purpose: Guarantee URL always reflects current state
  - _Leverage: existing navigation methods_
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 10. Clean up debug logging after testing
  - File: src/dashboard/client/multi-app.ts
  - Remove console.log statements added in task 8
  - Keep only essential error logging
  - Purpose: Production-ready code without debug output
  - _Leverage: existing logging patterns_
  - _Requirements: Non-functional performance requirement_