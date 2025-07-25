# Dashboard Refactoring Plan

## Problem
Currently, the single-project dashboard (index.html) and multi-project dashboard (multi.html) duplicate significant amounts of code:
- UI components (spec cards, task lists, status badges)
- JavaScript logic (formatting, state management, markdown preview)
- Styles and layout
- Every UI change requires updates in both files

## Proposed Solution

### 1. Create Shared Components Library
Create a new file `src/dashboard/public/shared-components.js` containing:

#### Shared UI Components:
- `SpecCard` - The expandable spec card with status, progress bar, etc.
- `TaskList` - Task list with completion tracking
- `StatusBadge` - Status pills (in-progress, completed, etc.)
- `ProgressBar` - Reusable progress indicator
- `MarkdownPreviewModal` - The markdown viewer modal
- `SteeringWarning` - The steering documents warning banner
- `RequirementsSection` - Requirements display with expand/collapse
- `DesignSection` - Design display with code reuse analysis
- `TasksSection` - Tasks display with execution buttons

#### Shared Utilities:
- `formatDate()` - Date formatting
- `getStatusClass()` - Status badge styling
- `getStatusLabel()` - Status text mapping
- `copyCommand()` - Command copying functionality
- `renderMarkdown()` - Markdown rendering

### 2. Refactor HTML Templates
Both dashboards would import the shared components:
```html
<script src="/shared-components.js"></script>
```

Then use the components:
```html
<spec-card 
  v-for="spec in specs" 
  :spec="spec"
  :selected="selectedSpec"
  @toggle="toggleSpec"
  @copy-task="copyTaskCommand"
  @view-markdown="viewMarkdown"
/>
```

### 3. State Management Pattern
Create a base state object that both dashboards extend:
```javascript
const BaseAppState = {
  theme: 'system',
  collapsedCompletedTasks: {},
  markdownPreview: { show: false, title: '', content: '', loading: false },
  
  // Shared methods
  initTheme() { ... },
  cycleTheme() { ... },
  copyCommand(command) { ... },
  // etc.
};

// Single dashboard extends base
const SingleDashboardApp = {
  ...BaseAppState,
  specs: [],
  selectedSpec: null,
  // Single-specific logic
};

// Multi dashboard extends base
const MultiDashboardApp = {
  ...BaseAppState,
  projects: [],
  selectedProject: null,
  // Multi-specific logic
};
```

### 4. Implementation Steps

1. **Extract shared utilities** (30 mins)
   - Create shared-components.js
   - Move utility functions
   - Test both dashboards still work

2. **Create UI component templates** (2 hours)
   - Define component structure
   - Extract HTML into reusable templates
   - Handle event bindings

3. **Refactor state management** (1 hour)
   - Create base state object
   - Extend for each dashboard
   - Ensure WebSocket handling remains separate

4. **Update build process** (30 mins)
   - Ensure shared-components.js is copied during build
   - Update any TypeScript definitions if needed

5. **Testing** (1 hour)
   - Test all functionality in both dashboards
   - Verify no regressions
   - Check performance

### 5. Alternative Approaches Considered

1. **Vue Single File Components** - Would require build step, adds complexity
2. **Web Components** - Good option but requires more refactoring
3. **Server-side templating** - Would need to change server architecture
4. **Keep duplication** - Maintenance burden will only grow

### 6. Benefits
- Single source of truth for UI components
- Easier maintenance and updates
- Consistent behavior across dashboards
- Reduced file sizes
- Better testability

### 7. Risks
- Initial refactoring time investment
- Potential for introducing bugs
- Need to maintain backwards compatibility

## Decision
Proceed with shared components approach using vanilla JavaScript modules for minimal complexity and maximum compatibility.