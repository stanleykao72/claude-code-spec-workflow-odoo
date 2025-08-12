/**
 * Multi-project dashboard application
 * TypeScript implementation with comprehensive type safety
 */

import type {
  Project,
  Spec,
  Bug,
  Task,
  WebSocketMessage,
  AppState,
  ActiveSession,
  ColorScheme,
  ProjectTabData,
  TunnelStatus,
  StatusType
} from '../shared/dashboard.types';

import { dashboardShared } from './shared-components';

// ============================================================================
// External Cache Management (Outside Reactive System)
// ============================================================================

/**
 * Project color cache stored outside petite-vue reactive system
 * to avoid Proxy errors with Map objects
 */
const projectColorCache = new Map<string, ColorScheme>();

// Note: Legacy BaseAppState global interface removed - using direct imports instead

/**
 * PetiteVue type definitions for the app
 */
interface PetiteVueApp {
  mount(selector: string): this;
}

declare const PetiteVue: {
  createApp: (data: Record<string, unknown>) => PetiteVueApp;
};

// ============================================================================
// Color Palette Definition
// ============================================================================

/**
 * Carefully curated color palette with maximum visual distinction
 * Colors are ordered to maximize contrast between adjacent items
 */
const COLOR_PALETTE: readonly ColorScheme[] = [
  { primary: 'cyan-600', light: 'cyan-100', ring: 'cyan-500', dark: { primary: 'cyan-400', light: 'cyan-900' } },
  { primary: 'violet-600', light: 'violet-100', ring: 'violet-500', dark: { primary: 'violet-400', light: 'violet-900' } },
  { primary: 'rose-600', light: 'rose-100', ring: 'rose-500', dark: { primary: 'rose-400', light: 'rose-900' } },
  { primary: 'amber-600', light: 'amber-100', ring: 'amber-500', dark: { primary: 'amber-400', light: 'amber-900' } },
  { primary: 'emerald-600', light: 'emerald-100', ring: 'emerald-500', dark: { primary: 'emerald-400', light: 'emerald-900' } },
  { primary: 'fuchsia-600', light: 'fuchsia-100', ring: 'fuchsia-500', dark: { primary: 'fuchsia-400', light: 'fuchsia-900' } },
  { primary: 'orange-600', light: 'orange-100', ring: 'orange-500', dark: { primary: 'orange-400', light: 'orange-900' } },
  { primary: 'teal-600', light: 'teal-100', ring: 'teal-500', dark: { primary: 'teal-400', light: 'teal-900' } },
  { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500', dark: { primary: 'indigo-400', light: 'indigo-900' } },
  { primary: 'lime-600', light: 'lime-100', ring: 'lime-500', dark: { primary: 'lime-400', light: 'lime-900' } },
  { primary: 'sky-600', light: 'sky-100', ring: 'sky-500', dark: { primary: 'sky-400', light: 'sky-900' } },
  { primary: 'pink-600', light: 'pink-100', ring: 'pink-500', dark: { primary: 'pink-400', light: 'pink-900' } },
  { primary: 'red-600', light: 'red-100', ring: 'red-500', dark: { primary: 'red-400', light: 'red-900' } },
  { primary: 'green-600', light: 'green-100', ring: 'green-500', dark: { primary: 'green-400', light: 'green-900' } },
  { primary: 'blue-600', light: 'blue-100', ring: 'blue-500', dark: { primary: 'blue-400', light: 'blue-900' } },
] as const;

/**
 * RGB color mappings for inline styles
 */
const COLOR_RGB_MAP: Record<string, string> = {
  'cyan-600': 'rgb(8, 145, 178)',
  'cyan-400': 'rgb(34, 211, 238)',
  'cyan-100': 'rgb(207, 250, 254)',
  'cyan-900': 'rgb(22, 78, 99)',
  'violet-600': 'rgb(124, 58, 237)',
  'violet-400': 'rgb(167, 139, 250)',
  'violet-100': 'rgb(237, 233, 254)',
  'violet-900': 'rgb(76, 29, 149)',
  'rose-600': 'rgb(225, 29, 72)',
  'rose-400': 'rgb(251, 113, 133)',
  'rose-100': 'rgb(255, 228, 230)',
  'rose-900': 'rgb(136, 19, 55)',
  'amber-600': 'rgb(217, 119, 6)',
  'amber-400': 'rgb(251, 191, 36)',
  'amber-100': 'rgb(254, 243, 199)',
  'amber-900': 'rgb(120, 53, 15)',
  'emerald-600': 'rgb(5, 150, 105)',
  'emerald-400': 'rgb(52, 211, 153)',
  'emerald-100': 'rgb(209, 250, 229)',
  'emerald-900': 'rgb(6, 78, 59)',
  'fuchsia-600': 'rgb(219, 39, 119)',
  'fuchsia-400': 'rgb(244, 114, 182)',
  'fuchsia-100': 'rgb(250, 232, 255)',
  'fuchsia-900': 'rgb(134, 25, 143)',
  'orange-600': 'rgb(234, 88, 12)',
  'orange-400': 'rgb(251, 146, 60)',
  'orange-100': 'rgb(254, 215, 170)',
  'orange-900': 'rgb(124, 45, 18)',
  'teal-600': 'rgb(13, 148, 136)',
  'teal-400': 'rgb(45, 212, 191)',
  'teal-100': 'rgb(204, 251, 241)',
  'teal-900': 'rgb(19, 78, 74)',
  'indigo-600': 'rgb(79, 70, 229)',
  'indigo-400': 'rgb(129, 140, 248)',
  'indigo-100': 'rgb(224, 231, 255)',
  'indigo-900': 'rgb(49, 46, 129)',
  'lime-600': 'rgb(132, 204, 22)',
  'lime-400': 'rgb(163, 230, 53)',
  'lime-100': 'rgb(236, 252, 203)',
  'lime-900': 'rgb(54, 83, 20)',
  'sky-600': 'rgb(2, 132, 199)',
  'sky-400': 'rgb(56, 189, 248)',
  'sky-100': 'rgb(224, 242, 254)',
  'sky-900': 'rgb(12, 74, 110)',
  'pink-600': 'rgb(219, 39, 119)',
  'pink-400': 'rgb(244, 114, 182)',
  'pink-100': 'rgb(252, 231, 243)',
  'pink-900': 'rgb(131, 24, 67)',
  'red-600': 'rgb(220, 38, 38)',
  'red-400': 'rgb(248, 113, 113)',
  'red-100': 'rgb(254, 226, 226)',
  'red-900': 'rgb(127, 29, 29)',
  'green-600': 'rgb(22, 163, 74)',
  'green-400': 'rgb(74, 222, 128)',
  'green-100': 'rgb(220, 252, 231)',
  'green-900': 'rgb(20, 83, 45)',
  'blue-600': 'rgb(37, 99, 235)',
  'blue-400': 'rgb(96, 165, 250)',
  'blue-100': 'rgb(219, 234, 254)',
  'blue-900': 'rgb(30, 58, 138)',
} as const;

// ============================================================================
// Main Application State Interface
// ============================================================================

/**
 * Main application state extending AppState with computed properties and methods
 * This interface represents the complete reactive state for the multi-project dashboard
 * Simplified to remove unused method declarations
 */
interface MultiAppState extends AppState {
  // Computed Properties
  readonly activeSessionCount: number;
  readonly groupedProjectsList: Project[];

  // Essential Methods (only those actually implemented)
  init(): Promise<void>;
  connectWebSocket(): void;
  handleWebSocketMessage(message: WebSocketMessage): void;
  initTheme(): void;
  applyTheme(theme: string): void;
  cycleTheme(): void;
  closeMarkdownPreview(): void;
  setupKeyboardHandlers(): void;
  setupCodeBlockCopyHandlers(): void;
  copyCodeBlock(event: Event): void;
  viewMarkdownWithProject(specName: string, docType: string, projectPath: string): Promise<void>;
  
  // Core functionality methods that exist in the implementation 
  getVisibleSpecs(project: Project): Spec[];
  getVisibleBugs(project: Project): Bug[];
  getProjectColor(projectPath: string): ColorScheme;
  getProjectColorClasses(projectPath: string, type?: 'text' | 'bg' | 'bg-primary' | 'border' | 'border-l' | 'border-r' | 'border-b' | 'text-primary'): string;
  getProjectColorValue(projectPath: string): string;
  getCachedGroupedProjects(): Project[];
  getGroupedProjects(): Project[];
  _buildGroupedProjects(): Project[];
  
  // Additional methods found in implementation
  getProjectTabStyles(project: Project): string;
  getProjectBadgeStyles(project: Project): string;
  getColorValue(colorName: string): string;
  getColorWithOpacity(colorName: string, opacity: string): string;
  getParentProjectPath(projectPath: string, groupedProjects: Project[], currentIndex: number): string;
  updateProjectTabsData(): void;
  initializeRouting(): void;
  fetchTunnelStatus(): Promise<void>;
  normalizeProjects(projects: Project[]): Project[];
  sortProjects(): void;
  getProjectSlug(project: Project): string;
  updateURL(): void;
  getOpenBugsCount(project: Project): number;
  selectProjectFromSession(session: ActiveSession): void;
  findFirstIncompleteTask(tasks: Task[]): Task | null;
  handleRouteChange(): void;
  initializeSelectedTask(spec: Spec): void;
  getProjectAtIndex(index: number): Project | null;
  isNextProjectTopLevel(index: number): boolean;
  isPreviousProjectNested(index: number): boolean;
  getCurrentTask(spec: Spec): Task | null;
  switchTab(tab: 'active' | 'projects'): void;
  selectProject(project: Project | null): void;
  selectProjectAndShowBugs(project: Project | null): void;
  selectProjectFromTask(projectPath: string, itemName: string, sessionType?: 'spec' | 'bug'): void;
  toggleRequirementsExpanded(specName: string): void;
  isRequirementsExpanded(specName: string): boolean;
  toggleDesignExpanded(specName: string): void;
  isDesignExpanded(specName: string): boolean;
  toggleTasksExpanded(specName: string): void;
  isTasksExpanded(specName: string): boolean;
  toggleRequirementAccordion(specName: string, requirementId: string): void;
  isRequirementExpanded(specName: string, requirementId: string): boolean;
  selectTask(specName: string, taskId: string): void;
  isTaskSelected(specName: string, taskId: string): boolean;
  getSelectedTask(specName: string): Task | null;
  getTaskNumber(activeSession: ActiveSession): number;
  getSpecTaskCount(activeSession: ActiveSession): number;
  getSpecProgress(activeSession: ActiveSession): number;
  getNextTask(activeSession: ActiveSession): Task | null;
  getSpecsInProgress(project: Project): number;
  getSpecsCompleted(project: Project): number;
  getTotalTasks(project: Project): number;
  getOpenSpecsCount(project: Project): number;
  getBugsInProgress(project: Project): number;
  getBugsResolved(project: Project): number;
  copyNextTaskCommand(spec: Spec, event: Event): void;
  copyOrchestrateCommand(spec: Spec, event: Event): void;
  toggleShowCompleted(): void;
  selectedTaskId(specName: string): string | undefined;
  sortSpecs(specs: Spec[]): void;
  sortBugs(bugs: Bug[]): void;
  scrollToRequirement(specName: string, requirementId: string): void;
  startTunnel(): Promise<void>;
  stopTunnel(): Promise<void>;
  viewMarkdown(specName: string, docType: string, projectPath?: string | null): Promise<void>;
  viewBugMarkdown(projectPath: string, bugName: string, docType: string): Promise<void>;
  hasBugDocument(bugName: string, docType: string): boolean;
  viewBugDocument(projectPath: string, bugName: string, docType: string): Promise<void>;
  formatTunnelExpiry(expiresAt: string): string;
  
  // Shared utility methods from dashboardShared
  getStatusLabel(status: StatusType): string;
  getStatusClass(status: StatusType): string;
  formatDate(dateString: string): string;
  copyCommand(command: string, event?: globalThis.Event): Promise<void>;
  renderMarkdown(content: string): string;
  formatAcceptanceCriteria(criteria: string): string;
  formatUserStory(story: string): string;
}

// ============================================================================
// Application Initialization Function
// ============================================================================

/**
 * Initialize the multi-project dashboard application
 * Waits for shared components to load before creating the PetiteVue app
 */
function initApp(): void {
  console.log('Initializing multi-dashboard app with shared components');
  
  // Create the PetiteVue application with typed state
  const appState: MultiAppState = {
    // ========================================================================
    // Reactive State Properties
    // ========================================================================
    
    // Copy base state properties (not methods)
    theme: 'system' as 'light' | 'dark' | 'system',
    collapsedCompletedTasks: {},
    markdownPreview: {
      show: false,
      title: '',
      content: '',
      rawContent: '',
      loading: false
    },

    // Multi dashboard specific state
    projects: [],
    selectedProject: null,
    selectedSpec: null,
    activeSessions: [],
    activeTab: 'active' as const,
    connected: false,
    ws: null,
    username: 'User',
    expandedRequirements: {},
    expandedDesigns: {},
    expandedTasks: {},
    selectedTasks: {},
    expandedRequirementAccordions: {},
    pendingProjectRoute: null,
    showCompleted: localStorage.getItem('showCompleted') !== 'false',
    tunnelStatus: null,
    _groupedProjectsCache: null,
    _colorValueCache: {},
    projectTabsData: [],

    // ========================================================================
    // Computed Properties
    // ========================================================================
    
    get activeSessionCount(): number {
      return this.projects.filter((p) => p.hasActiveSession).length;
    },
    
    get groupedProjectsList(): Project[] {
      const grouped = this.getCachedGroupedProjects();
      if (!grouped || grouped.length === 0) return [];
      
      // Create a new array with simple objects to avoid reactivity issues
      return grouped.map(p => ({
        path: p.path,
        name: p.name,
        level: p.level || 0,
        hasActiveSession: p.hasActiveSession || false,
        specs: p.specs || [],
        bugs: p.bugs || [],
        steeringStatus: p.steeringStatus
      } as Project));
    },

    // ========================================================================
    // Visibility and Filtering Methods
    // ========================================================================

    getVisibleSpecs(project: Project): Spec[] {
      if (!project?.specs) return [];
      if (this.showCompleted) {
        return project.specs;
      }
      return project.specs.filter(s => s?.status !== 'completed');
    },

    getVisibleBugs(project: Project): Bug[] {
      if (!project?.bugs) return [];
      if (this.showCompleted) {
        return project.bugs;
      }
      return project.bugs.filter(b => b?.status !== 'resolved');
    },

    // ========================================================================
    // Project Color Management Methods
    // ========================================================================

    getProjectColor(projectPath: string): ColorScheme {
      if (!projectPath) {
        return { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500' };
      }
      
      // Return cached color if exists
      const cachedColor = projectColorCache.get(projectPath);
      if (cachedColor) {
        return cachedColor;
      }
      
      // Get grouped projects once and work with plain array
      const groupedProjects = this.getCachedGroupedProjects();
      if (!groupedProjects || groupedProjects.length === 0) {
        return { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500' };
      }
      
      // Find all top-level projects (level 0) in the grouped list
      const topLevelProjects: Project[] = [];
      for (let i = 0; i < groupedProjects.length; i++) {
        const project = groupedProjects[i];
        if (project?.level === 0) {
          topLevelProjects.push(project);
        }
      }
      
      // Find which top-level project this path belongs to
      let topLevelProject: Project | null = null;
      let topLevelIndex = -1;
      
      for (let i = 0; i < topLevelProjects.length; i++) {
        const project = topLevelProjects[i];
        // Check if this projectPath is under this top-level project
        if (project && (projectPath === project.path || projectPath.startsWith(project.path + '/'))) {
          topLevelProject = project;
          topLevelIndex = i;
          break;
        }
      }
      
      // If not found, check if this IS a top-level project
      if (topLevelIndex === -1) {
        topLevelIndex = topLevelProjects.findIndex(p => p?.path === projectPath);
        if (topLevelIndex >= 0) {
          topLevelProject = topLevelProjects[topLevelIndex] || null;
        }
      }
      
      // Use the index to select a color, cycling through if needed
      const colorIndex = topLevelIndex >= 0 ? topLevelIndex % COLOR_PALETTE.length : 0;
      const color = COLOR_PALETTE[colorIndex] as ColorScheme; // TypeScript doesn't infer that modulo ensures valid index
      
      // Cache the color for this project and all its children
      if (topLevelProject) {
        // Cache color for the top-level project
        projectColorCache.set(topLevelProject.path, color);
        // Cache same color for all children
        for (let i = 0; i < groupedProjects.length; i++) {
          const p = groupedProjects[i];
          if (p?.path && (p.path.startsWith(topLevelProject.path + '/') || p.path === topLevelProject.path)) {
            projectColorCache.set(p.path, color);
          }
        }
      } else {
        // Just cache for this specific path
        projectColorCache.set(projectPath, color);
      }
      
      return color;
    },

    getProjectColorClasses(projectPath: string, type: 'text' | 'bg' | 'bg-primary' | 'border' | 'border-l' | 'border-r' | 'border-b' | 'text-primary' = 'text'): string {
      const color = this.getProjectColor(projectPath);
      if (!color?.primary) return '';
      
      const isDark = document.documentElement.classList.contains('dark');
      
      switch(type) {
        case 'text':
          return isDark && color.dark?.primary ? `text-${color.dark.primary}` : `text-${color.primary}`;
        case 'bg':
          return isDark && color.dark?.light ? `bg-${color.dark.light}` : `bg-${color.light || 'indigo-100'}`;
        case 'bg-primary':
          return `bg-${color.primary}`;
        case 'border':
          return `border-${color.primary}`;
        case 'border-l':
          return `border-l-${color.primary}`;
        case 'border-r':
          return `border-r-${color.primary}`;
        case 'border-b':
          return `border-b-${color.primary}`;
        case 'text-primary':
          return `text-${color.primary}`;
        default:
          return '';
      }
    },

    getProjectColorValue(projectPath: string): string {
      if (!projectPath) return 'rgb(79, 70, 229)'; // Default indigo
      
      // Try to get from cache first
      const cachedValue = this._colorValueCache?.[projectPath];
      if (cachedValue) return cachedValue;
      
      const color = this.getProjectColor(projectPath);
      const value = (color?.primary && COLOR_RGB_MAP[color.primary]) || 'rgb(8, 145, 178)';
      
      // Cache the computed value
      if (!this._colorValueCache) {
        this._colorValueCache = {};
      }
      this._colorValueCache[projectPath] = value;
      
      return value;
    },

    getProjectTabStyles(project: Project): string {
      const styles: string[] = [];
      const isActive = this.activeTab === 'projects' && this.selectedProject?.path === project?.path;
      const color = this.getProjectColor(project?.path || '');
      const borderColor = this.getColorValue(color?.primary || 'indigo-600');
      const isDark = document.documentElement.classList.contains('dark');
      const groupedProjects = this.getCachedGroupedProjects();
      const projectIndex = groupedProjects.findIndex(p => p?.path === project?.path);
      
      // For active tabs, set the border and text color
      if (isActive) {
        styles.push(`border-bottom-color: ${borderColor}`);
        styles.push(`color: ${borderColor}`);
      }
      
      // Check if this project is part of a group (either parent or child)
      const nextProject = projectIndex >= 0 && projectIndex < groupedProjects.length - 1 ? groupedProjects[projectIndex + 1] : null;
      const hasChildren = nextProject?.level !== undefined && nextProject.level > 0;
      const isPartOfGroup = (project?.level || 0) > 0 || hasChildren;
      
      if (isPartOfGroup) {
        // Determine which color to use (parent's color for the whole group)
        let groupColor: ColorScheme;
        if ((project?.level || 0) > 0) {
          // Nested project - use parent color
          const parentPath = this.getParentProjectPath(project?.path || '', groupedProjects, projectIndex);
          groupColor = this.getProjectColor(parentPath);
        } else {
          // Parent project - use its own color
          groupColor = color || { primary: 'indigo-600', light: 'indigo-100', ring: 'indigo-500' };
        }
        
        const groupBorderColor = this.getColorValue(groupColor?.primary || 'indigo-600');
        
        // Add left border ONLY for the parent (first item in group)
        if ((project?.level || 0) === 0 && hasChildren) {
          styles.push(`border-left: 2px solid ${groupBorderColor}`);
        }
        
        // Add subtle background color for all projects in a group
        const bgOpacity = isDark ? '0.1' : '0.05';
        styles.push(`background-color: ${this.getColorWithOpacity(groupColor?.primary || 'indigo-600', bgOpacity)}`);
        
        // Add right border ONLY for the last item in group
        const nextProjectAfter = projectIndex < groupedProjects.length - 1 ? groupedProjects[projectIndex + 1] : null;
        const isLastInGroup = (project?.level || 0) > 0 && 
                             (projectIndex === groupedProjects.length - 1 || 
                              (nextProjectAfter?.level === 0));
        
        if (isLastInGroup) {
          styles.push(`border-right: 2px solid ${groupBorderColor}`);
        }
      }
      
      return styles.join('; ');
    },

    getProjectBadgeStyles(project: Project): string {
      const styles: string[] = [];
      const color = this.getProjectColor(project?.path || '');
      const isDark = document.documentElement.classList.contains('dark');
      
      if (project?.hasActiveSession) {
        // Light mode colors
        const bgColors: Record<string, string> = {
          'cyan-600': 'rgb(207, 250, 254)', // cyan-100
          'violet-600': 'rgb(237, 233, 254)', // violet-100
          'rose-600': 'rgb(255, 228, 230)', // rose-100
          'amber-600': 'rgb(254, 243, 199)', // amber-100
          'emerald-600': 'rgb(209, 250, 229)', // emerald-100
          'fuchsia-600': 'rgb(250, 232, 255)', // fuchsia-100
          'orange-600': 'rgb(255, 237, 213)', // orange-100
          'teal-600': 'rgb(204, 251, 241)', // teal-100
          'indigo-600': 'rgb(224, 231, 255)', // indigo-100
          'lime-600': 'rgb(236, 252, 203)', // lime-100
          'sky-600': 'rgb(224, 242, 254)' // sky-100
        };
        
        // Dark mode colors
        const darkBgColors: Record<string, string> = {
          'cyan-600': 'rgb(22, 78, 99)', // cyan-900
          'violet-600': 'rgb(76, 29, 149)', // violet-900
          'rose-600': 'rgb(136, 19, 55)', // rose-900
          'amber-600': 'rgb(120, 53, 15)', // amber-900
          'emerald-600': 'rgb(6, 78, 59)', // emerald-900
          'fuchsia-600': 'rgb(134, 25, 143)', // fuchsia-900
          'orange-600': 'rgb(124, 45, 18)', // orange-900
          'teal-600': 'rgb(19, 78, 74)', // teal-900
          'indigo-600': 'rgb(49, 46, 129)', // indigo-900
          'lime-600': 'rgb(54, 83, 20)', // lime-900
          'sky-600': 'rgb(12, 74, 110)' // sky-900
        };
        
        const primaryColor = color?.primary || 'indigo-600';
        const bgColor = isDark ? (darkBgColors[primaryColor] || 'rgb(55, 65, 81)') : (bgColors[primaryColor] || 'rgb(243, 244, 246)');
        const textColor = this.getColorValue(primaryColor);
        
        styles.push(`background-color: ${bgColor}`);
        styles.push(`color: ${textColor}`);
      } else {
        // Inactive - gray colors
        styles.push(`background-color: ${isDark ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'}`);
        styles.push(`color: ${isDark ? 'rgb(156, 163, 175)' : 'rgb(75, 85, 99)'}`);
      }
      
      return styles.join('; ');
    },

    getColorValue(colorName: string): string {
      return COLOR_RGB_MAP[colorName] || 'rgb(79, 70, 229)';
    },
    
    getColorWithOpacity(colorName: string, opacity: string): string {
      const colorRgb: Record<string, string> = {
        'cyan-600': '8, 145, 178',
        'violet-600': '124, 58, 237',
        'rose-600': '225, 29, 72',
        'amber-600': '217, 119, 6',
        'emerald-600': '5, 150, 105',
        'fuchsia-600': '219, 39, 119',
        'orange-600': '234, 88, 12',
        'teal-600': '13, 148, 136',
        'indigo-600': '79, 70, 229',
        'lime-600': '132, 204, 22',
        'sky-600': '2, 132, 199'
      };
      
      const rgb = colorRgb[colorName] || '79, 70, 229'; // Default to indigo
      return `rgba(${rgb}, ${opacity})`;
    },

    // ========================================================================
    // Grouped Projects Management
    // ========================================================================

    getCachedGroupedProjects(): Project[] {
      // Invalidate cache if projects have changed
      if (!this._groupedProjectsCache || 
          this._groupedProjectsCache.projectsCount !== this.projects.length ||
          this._groupedProjectsCache.projectsHash !== JSON.stringify(this.projects.map(p => p.path))) {
        this._groupedProjectsCache = {
          projectsCount: this.projects.length,
          projectsHash: JSON.stringify(this.projects.map(p => p.path)),
          data: this._buildGroupedProjects()
        };
      }
      return this._groupedProjectsCache.data;
    },
    
    getGroupedProjects(): Project[] {
      // Use the computed property for template access
      return this.groupedProjectsList;
    },
    
    _buildGroupedProjects(): Project[] {
      // Return empty array if no projects
      if (!this.projects || this.projects.length === 0) {
        return [];
      }
      
      // Sort projects by path first to ensure parents come before children
      const sortedProjects = [...this.projects].sort((a, b) => a.path.localeCompare(b.path));
      
      // Create a map for quick lookup
      const projectMap = new Map<string, Project>();
      sortedProjects.forEach(p => projectMap.set(p.path, p));
      
      const grouped: Project[] = [];
      const addedPaths = new Set<string>();
      
      // Helper function to add a project and all its descendants
      const addProjectWithDescendants = (project: Project, level = 0): void => {
        if (addedPaths.has(project.path)) return;
        
        grouped.push({ ...project, level });
        addedPaths.add(project.path);
        
        // Find all descendants (not just direct children)
        const descendants = sortedProjects.filter(child => {
          if (addedPaths.has(child.path)) return false;
          // Check if it's a descendant
          return child.path.startsWith(project.path + '/');
        });
        
        // Sort descendants by path depth then by name
        descendants.sort((a, b) => {
          const depthA = a.path.split('/').length;
          const depthB = b.path.split('/').length;
          if (depthA !== depthB) return depthA - depthB; // Shallower paths first
          return a.name.localeCompare(b.name);
        });
        
        // Add each descendant with appropriate level based on path depth
        descendants.forEach(descendant => {
          const relativePath = descendant.path.substring(project.path.length + 1);
          const relativeDepth = relativePath.split('/').length;
          grouped.push({ ...descendant, level: level + relativeDepth });
          addedPaths.add(descendant.path);
        });
      };
      
      // Find and process all top-level projects (those without parents in our list)
      sortedProjects.forEach(project => {
        if (addedPaths.has(project.path)) return;
        
        // Check if this project has a parent in our list
        const pathParts = project.path.split('/');
        let hasParent = false;
        
        for (let i = pathParts.length - 1; i > 0; i--) {
          const potentialParentPath = pathParts.slice(0, i).join('/');
          if (projectMap.has(potentialParentPath)) {
            hasParent = true;
            break;
          }
        }
        
        if (!hasParent) {
          // This is a top-level project - add it with all its descendants
          addProjectWithDescendants(project, 0);
        }
      });
      
      console.log('Grouped projects:', grouped.map(p => `${' '.repeat((p?.level || 0) * 2)}${p?.name || 'Unknown'} (${p?.path || 'Unknown'})`).join('\n'));
      return grouped;
    },

    getParentProjectPath(projectPath: string, groupedProjects: Project[], currentIndex: number): string {
      // For level 0 projects, they are their own parent
      const currentProject = groupedProjects[currentIndex];
      if (!currentProject || (currentProject?.level || 0) === 0) {
        return projectPath;
      }
      
      // Look backwards to find the parent (level 0) project
      for (let i = currentIndex - 1; i >= 0; i--) {
        const project = groupedProjects[i];
        if (project && (project?.level || 0) === 0) {
          return project?.path || projectPath;
        }
      }
      
      // Fallback to current path
      return projectPath;
    },
    
    getProjectAtIndex(index: number): Project | null {
      const projects = this.groupedProjectsList;
      return projects?.[index] || null;
    },
    
    isNextProjectTopLevel(index: number): boolean {
      const projects = this.groupedProjectsList;
      if (!projects || index < 0 || index >= projects.length - 1) return false;
      const nextProject = projects[index + 1];
      return nextProject?.level === 0;
    },
    
    isPreviousProjectNested(index: number): boolean {
      if (index === 0) return false;
      const projects = this.groupedProjectsList;
      if (!projects || index <= 0 || index >= projects.length) return false;
      const prevProject = projects[index - 1];
      return (prevProject?.level || 0) > 0;
    },

    updateProjectTabsData(): void {
      const grouped = this.getCachedGroupedProjects();
      if (!grouped || grouped.length === 0) {
        this.projectTabsData = [];
        return;
      }
      
      // Pre-compute all data needed for project tabs (except dynamic styles)
      this.projectTabsData = grouped.map((project, index): ProjectTabData => {
        const colorValue = this.getProjectColorValue(project?.path || '');
        const color = this.getProjectColor(project?.path || '');
        const isNextTopLevel = index < grouped.length - 1 && (grouped[index + 1]?.level || 0) === 0;
        const isPrevNested = index > 0 && (grouped[index - 1]?.level || 0) > 0;
        
        return {
          path: project.path,
          name: project.name,
          level: project.level || 0,
          hasActiveSession: project.hasActiveSession || false,
          colorValue: colorValue,
          colorPrimary: color.primary,
          isNextTopLevel: isNextTopLevel,
          isPrevNested: isPrevNested,
          specs: project.specs || [],
          bugs: project.bugs || []
        };
      });
    },

    // ========================================================================
    // Application Initialization
    // ========================================================================

    async init(): Promise<void> {
      console.log('Multi-project dashboard initializing...');
      this.initTheme();
      this.setupKeyboardHandlers();
      this.setupCodeBlockCopyHandlers();
      this.initializeRouting();
      this.connectWebSocket();
      await this.fetchTunnelStatus();
    },

    // ========================================================================
    // WebSocket Connection Management
    // ========================================================================

    connectWebSocket(): void {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (): void => {
        console.log('WebSocket connected');
        this.connected = true;
      };

      this.ws.onmessage = (event): void => {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message:', message);
        this.handleWebSocketMessage(message);
      };

      this.ws.onclose = (): void => {
        console.log('WebSocket disconnected');
        this.connected = false;
        setTimeout(() => this.connectWebSocket(), 2000);
      };

      this.ws.onerror = (error): void => {
        console.error('WebSocket error:', error);
      };
    },

    handleWebSocketMessage(message: WebSocketMessage): void {
      switch (message.type) {
        case 'initial':
          console.log('Initial message received:', message);
          console.log('message.data type:', typeof message.data, 'isArray:', Array.isArray(message.data));
          console.log('message.data:', message.data);
          
          // Handle initial data properly - the message structure may vary
          let projectsData: Project[] = [];
          let sessionsData: ActiveSession[] = [];
          let username = 'User';
          
          if ('data' in message) {
            // Handle the case where data contains projects directly
            if (Array.isArray((message as any).data)) {
              projectsData = (message as any).data;
            }
            // Handle active sessions
            if ('activeSessions' in message && Array.isArray((message as any).activeSessions)) {
              sessionsData = (message as any).activeSessions;
            }
            // Handle username
            if ('username' in message && typeof (message as any).username === 'string') {
              username = (message as any).username;
            }
          }
          
          this.projects = this.normalizeProjects(projectsData);
          // Pre-compute color values for active sessions
          this.activeSessions = sessionsData.map(session => ({
            ...session,
            projectColorValue: this.getProjectColorValue(session.projectPath)
          }));
          this.username = username;
          // Clear caches when projects change
          this._groupedProjectsCache = null;
          // Clear external color cache
          projectColorCache.clear();
          this._colorValueCache = {};
          // Pre-compute project tabs data
          this.updateProjectTabsData();

          console.log(
            `Received initial data: ${this.projects.length} projects, ${this.activeSessions.length} active sessions`
          );
          console.log('Projects after normalization:', this.projects);
          console.log('Active sessions:', this.activeSessions);
          
          // Sort projects: active first, then by activity
          this.sortProjects();
          
          // Handle pending route if we were waiting for projects to load
          if (this.pendingProjectRoute && this.projects.length > 0) {
            const project = this.projects.find(p => this.getProjectSlug(p) === this.pendingProjectRoute);
            if (project) {
              this.selectedProject = project;
              this.activeTab = 'projects';
              this.updateURL();
            } else {
              // Project still not found, redirect to active
              this.activeTab = 'active';
              this.selectedProject = null;
              this.updateURL();
            }
            this.pendingProjectRoute = null;
          }
          // Select first project if none selected and we're on projects tab
          else if (!this.selectedProject && this.projects.length > 0 && this.activeTab === 'projects') {
            this.selectedProject = this.projects[0] || null;
            this.updateURL();
          }
          break;

        case 'update':
          // Handle project updates
          const updateData = message.data as { projects?: Project[]; projectPath?: string; data?: any };
          if (updateData.projects) {
            this.projects = this.normalizeProjects(updateData.projects);
            this.sortProjects();
            // Clear caches
            this._groupedProjectsCache = null;
            projectColorCache.clear();
            this._colorValueCache = {};
            this.updateProjectTabsData();
          }
          break;

        case 'steering-update':
          // Handle steering document updates
          const steeringData = message as any;
          const steeringProjectPath = steeringData.projectPath;
          const steeringProject = this.projects.find((p) => p.path === steeringProjectPath);
          if (steeringProject) {
            steeringProject.steeringStatus = steeringData.data;
            console.log(`Steering documents updated for ${steeringProject.name}:`, steeringData.data);
          }
          break;

        case 'tunnel:started':
          this.tunnelStatus = {
            active: true,
            info: (message as any).data,
            viewers: 0
          } as TunnelStatus;
          console.log('Tunnel started:', this.tunnelStatus);
          
          // Automatically copy tunnel URL to clipboard
          if ((message as any).data && (message as any).data.url) {
            void dashboardShared.copyCommand((message as any).data.url);
          }
          break;

        case 'tunnel:stopped':
          this.tunnelStatus = {
            active: false,
            info: null as any,  // TypeScript workaround for initial state
            viewers: 0
          } as TunnelStatus;
          console.log('Tunnel stopped:', this.tunnelStatus);
          break;

        case 'tunnel:metrics:updated':
          if (this.tunnelStatus) {
            this.tunnelStatus.viewers = ((message as any).data.viewers as number) || 0;
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },

    // ========================================================================
    // Navigation and Tab Management
    // ========================================================================

    switchTab(tab: 'active' | 'projects'): void {
      this.activeTab = tab;
      this.updateURL();
    },

    selectProject(project: Project | null): void {
      this.selectedProject = project;
      this.activeTab = 'projects';
      this.updateURL();
    },

    selectProjectAndShowBugs(project: Project | null): void {
      this.selectedProject = project;
      this.activeTab = 'projects';
      this.updateURL();
      
      // Scroll to bug section after a short delay to allow DOM update
      if (project && this.getOpenBugsCount(project) > 0) {
        setTimeout(() => {
          const bugSection = document.querySelector('[data-bug-section]');
          if (bugSection) {
            bugSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    },

    selectProjectFromSession(session: ActiveSession): void {
      const project = this.projects.find((p) => p.path === session.projectPath);
      if (project) {
        this.selectedProject = project;
        this.activeTab = 'projects';
        this.updateURL();
        
        // Handle based on session type
        if (session.type === 'spec' && project.specs) {
          // Find and expand the spec
          const spec = project.specs.find((s) => s.name === session.specName);
          if (spec) {
            this.selectedSpec = spec;
          }
        } else if (session.type === 'bug') {
          // Scroll to bug section if needed
          setTimeout(() => {
            const bugElement = document.getElementById(`bug-${session.bugName}`);
            if (bugElement) {
              bugElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }
    },

    selectProjectFromTask(projectPath: string, itemName: string, sessionType: 'spec' | 'bug' = 'spec'): void {
      // Find the session or create a minimal one for navigation
      const project = this.projects.find((p) => p.path === projectPath);
      if (!project) return;

      // Create a session-like object for navigation
      let session: ActiveSession;
      if (sessionType === 'bug' || (project.bugs && project.bugs.find(b => b.name === itemName))) {
        session = {
          type: 'bug',
          projectPath: projectPath,
          bugName: itemName
        };
      } else {
        session = {
          type: 'spec',
          projectPath: projectPath,
          specName: itemName
        };
      }

      this.selectProjectFromSession(session);
    },

    // ========================================================================
    // Expansion State Management
    // ========================================================================

    toggleRequirementsExpanded(specName: string): void {
      if (this.expandedRequirements[specName]) {
        delete this.expandedRequirements[specName];
      } else {
        this.expandedRequirements[specName] = true;
      }
    },

    isRequirementsExpanded(specName: string): boolean {
      return !!this.expandedRequirements[specName];
    },

    toggleDesignExpanded(specName: string): void {
      if (this.expandedDesigns[specName]) {
        delete this.expandedDesigns[specName];
      } else {
        this.expandedDesigns[specName] = true;
      }
    },

    isDesignExpanded(specName: string): boolean {
      return !!this.expandedDesigns[specName];
    },

    toggleTasksExpanded(specName: string): void {
      if (this.expandedTasks[specName]) {
        delete this.expandedTasks[specName];
        // Clear task selection when collapsing
        delete this.selectedTasks[specName];
      } else {
        this.expandedTasks[specName] = true;
        // Auto-select first incomplete task when expanding
        const project = this.selectedProject;
        if (project && project.specs) {
          const spec = project.specs.find(s => s?.name === specName);
          if (spec && spec.tasks && spec.tasks.taskList && spec.tasks.taskList.length > 0) {
            const firstIncomplete = this.findFirstIncompleteTask(spec.tasks.taskList);
            if (firstIncomplete) {
              this.selectedTasks[specName] = firstIncomplete.id;
            } else {
              // If no incomplete tasks, select the first task
              const firstTask = spec.tasks.taskList[0];
              if (firstTask) {
                this.selectedTasks[specName] = firstTask.id;
              }
            }
          }
        }
      }
    },

    isTasksExpanded(specName: string): boolean {
      return !!this.expandedTasks[specName];
    },

    toggleRequirementAccordion(specName: string, requirementId: string): void {
      const key = `${specName}-${requirementId}`;
      const isCurrentlyExpanded = this.expandedRequirementAccordions[key];
      
      // Close all requirements for this spec first
      Object.keys(this.expandedRequirementAccordions).forEach(k => {
        if (k.startsWith(specName + '-')) {
          delete this.expandedRequirementAccordions[k];
        }
      });
      
      // If it wasn't expanded before, expand it now (accordion behavior)
      if (!isCurrentlyExpanded) {
        this.expandedRequirementAccordions[key] = true;
      }
    },

    isRequirementExpanded(specName: string, requirementId: string): boolean {
      const key = `${specName}-${requirementId}`;
      return !!this.expandedRequirementAccordions[key];
    },

    // ========================================================================
    // Task Selection Management
    // ========================================================================

    selectTask(specName: string, taskId: string): void {
      if (this.selectedTasks[specName] === taskId) {
        // Deselect if clicking the same task
        delete this.selectedTasks[specName];
      } else {
        this.selectedTasks[specName] = taskId;
      }
    },

    isTaskSelected(specName: string, taskId: string): boolean {
      return this.selectedTasks[specName] === taskId;
    },

    selectedTaskId(specName: string): string | undefined {
      return this.selectedTasks[specName];
    },

    getSelectedTask(specName: string): Task | null {
      const taskId = this.selectedTasks[specName];
      if (!taskId) return null;
      
      // Find the project and spec
      const project = this.selectedProject;
      if (!project || !project.specs) return null;
      
      const spec = project.specs.find(s => s.name === specName);
      if (!spec || !spec.tasks || !spec.tasks.taskList) return null;
      
      return spec.tasks.taskList.find(task => task.id === taskId) || null;
    },

    initializeSelectedTask(spec: Spec): void {
      if (!this.selectedTasks[spec.name] && spec.tasks && spec.tasks.taskList) {
        const firstIncomplete = this.findFirstIncompleteTask(spec.tasks.taskList);
        if (firstIncomplete) {
          this.selectedTasks[spec.name] = firstIncomplete.id;
        }
      }
    },

    findFirstIncompleteTask(tasks: Task[]): Task | null {
      for (const task of tasks) {
        if (!task.completed) {
          return task;
        }
        if (task.subtasks) {
          const subtask = this.findFirstIncompleteTask(task.subtasks);
          if (subtask) return subtask;
        }
      }
      return null;
    },

    // ========================================================================
    // Active Session Helpers
    // ========================================================================

    getTaskNumber(activeSession: ActiveSession): number {
      if (activeSession?.type !== 'spec') return 1;
      
      const spec = this.projects
        .find((p) => p?.path === activeSession?.projectPath)
        ?.specs?.find((s) => s?.name === activeSession?.specName);
      
      if (!spec?.tasks?.taskList) return 1;
      
      const taskIndex = spec.tasks.taskList.findIndex((t) => t?.id === activeSession?.currentTaskId);
      return taskIndex >= 0 ? taskIndex + 1 : 1;
    },

    getSpecTaskCount(activeSession: ActiveSession): number {
      if (activeSession?.type !== 'spec') return 0;
      
      const spec = this.projects
        .find((p) => p?.path === activeSession?.projectPath)
        ?.specs?.find((s) => s?.name === activeSession?.specName);
      
      return spec?.tasks?.total || 0;
    },

    getSpecProgress(activeSession: ActiveSession): number {
      if (activeSession?.type !== 'spec') return 0;
      
      const spec = this.projects
        .find((p) => p?.path === activeSession?.projectPath)
        ?.specs?.find((s) => s?.name === activeSession?.specName);
      
      if (!spec?.tasks?.total) return 0;
      return (spec.tasks.completed / spec.tasks.total) * 100;
    },

    getNextTask(activeSession: ActiveSession): Task | null {
      if (activeSession?.type !== 'spec') return null;
      
      const spec = this.projects
        .find((p) => p?.path === activeSession?.projectPath)
        ?.specs?.find((s) => s?.name === activeSession?.specName);
      
      if (!spec?.tasks?.taskList) return null;
      
      const taskList = spec.tasks.taskList;  // TypeScript now knows this is defined
      const currentIndex = taskList.findIndex((t) => t?.id === activeSession?.currentTaskId);
      if (currentIndex >= 0 && currentIndex < taskList.length - 1) {
        const nextTask = taskList[currentIndex + 1];
        if (nextTask && !nextTask.completed) return nextTask;
      }
      
      return taskList.find((t) => t && !t.completed && t.id !== activeSession?.currentTaskId) || null;
    },

    getCurrentTask(spec: Spec): Task | null {
      if (!spec?.tasks?.taskList || !spec.tasks.inProgress) return null;
      const taskList = spec.tasks.taskList;
      const inProgressId = spec.tasks.inProgress;
      return taskList.find(task => task?.id === inProgressId) || null;
    },

    // ========================================================================
    // Project Statistics
    // ========================================================================

    getSpecsInProgress(project: Project): number {
      if (!project?.specs) return 0;
      return project.specs.filter((s) => s?.status === 'in-progress').length;
    },

    getSpecsCompleted(project: Project): number {
      if (!project?.specs) return 0;
      return project.specs.filter((s) => s?.status === 'completed').length;
    },

    getTotalTasks(project: Project): number {
      if (!project?.specs) return 0;
      return project.specs.reduce((total, spec) => {
        return total + (spec?.tasks?.total || 0);
      }, 0);
    },

    getOpenSpecsCount(project: Project): number {
      if (!project?.specs) return 0;
      return project.specs.filter((s) => s?.status !== 'completed').length;
    },

    getOpenBugsCount(project: Project): number {
      if (!project?.bugs) return 0;
      return project.bugs.filter((b) => b?.status !== 'resolved').length;
    },

    getBugsInProgress(project: Project): number {
      if (!project?.bugs) return 0;
      return project.bugs.filter((b) => b?.status && ['analyzing', 'fixing', 'verifying'].includes(b.status)).length;
    },

    getBugsResolved(project: Project): number {
      if (!project?.bugs) return 0;
      return project.bugs.filter((b) => b?.status === 'resolved').length;
    },

    // ========================================================================
    // Routing Methods
    // ========================================================================

    initializeRouting(): void {
      // Handle browser back/forward navigation
      window.addEventListener('popstate', () => {
        this.handleRouteChange();
      });

      // Set initial route based on URL
      this.handleRouteChange();
    },

    handleRouteChange(): void {
      const path = window.location.pathname;
      
      // Handle base path - if we're at the dashboard root or common dashboard paths
      if (path === '/' || path === '/active' || path === '/dashboard' || path === '/dashboard/' || path.includes('/dashboard/public')) {
        this.activeTab = 'active';
        this.selectedProject = null;
        return;
      }
      
      // Check if this looks like a project route (only match /project/name pattern)
      const projectMatch = path.match(/^\/project\/(.+)$/);
      if (projectMatch) {
        const projectName = projectMatch[1];
        
        // Find project by name
        const project = this.projects.find(p => this.getProjectSlug(p) === projectName);
        if (project) {
          this.selectedProject = project;
          this.activeTab = 'projects';
        } else {
          // Project not found, check if we have projects loaded yet
          if (this.projects.length === 0 && projectName && !projectName.includes('.')) {
            // Projects not loaded yet and this looks like a project name, store for later
            this.pendingProjectRoute = projectName;
          } else {
            // Projects are loaded but project not found, or invalid route - go to active tab
            this.activeTab = 'active';
            this.selectedProject = null;
            this.updateURL();
          }
        }
      } else {
        // For any other path, default to active tab
        this.activeTab = 'active';
        this.selectedProject = null;
      }
    },

    updateURL(): void {
      let newPath = '/active';
      
      if (this.activeTab === 'projects' && this.selectedProject) {
        newPath = '/' + this.getProjectSlug(this.selectedProject);
      }

      // Only update if path has changed to avoid infinite loops
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    },

    getProjectSlug(project: Project): string {
      // Convert project name to URL-friendly slug
      return (project?.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
    },

    // ========================================================================
    // Command Copying Methods
    // ========================================================================

    copyNextTaskCommand(spec: Spec, event: Event): void {
      if (spec?.tasks?.taskList) {
        const nextTask = this.findFirstIncompleteTask(spec.tasks.taskList);
        if (nextTask?.id && spec.name) {
          const command = `/spec-execute ${spec.name} ${nextTask.id}`;
          void dashboardShared.copyCommand(command, event);
        }
      }
    },

    copyOrchestrateCommand(spec: Spec, event: Event): void {
      if (spec?.name) {
        const command = `/spec-orchestrate ${spec.name}`;
        void dashboardShared.copyCommand(command, event);
      }
    },

    // ========================================================================
    // Utility Methods
    // ========================================================================

    sortProjects(): void {
      this.projects.sort((a, b) => {
        // Active sessions come first
        if (a.hasActiveSession && !b.hasActiveSession) return -1;
        if (!a.hasActiveSession && b.hasActiveSession) return 1;
        
        // Then sort by last activity
        const dateA = (a as any).lastActivity ? new Date((a as any).lastActivity) : new Date(0);
        const dateB = (b as any).lastActivity ? new Date((b as any).lastActivity) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    },

    sortSpecs(specs: Spec[]): void {
      if (!specs || !Array.isArray(specs)) return;
      
      specs.sort((a, b) => {
        // Define status priority order (lower number = higher priority)
        const statusPriority: Record<StatusType, number> = {
          'in-progress': 1,
          'tasks': 2,
          'design': 3,
          'requirements': 4,
          'not-started': 5,
          'completed': 6  // Completed specs always at bottom
        };
        
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        
        // Primary sort: by status priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Secondary sort: by last modified date within same status group (newest first)
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
    },

    sortBugs(bugs: Bug[]): void {
      if (!bugs || !Array.isArray(bugs)) return;
      
      bugs.sort((a, b) => {
        // Define bug status priority order (lower number = higher priority)
        const statusPriority: Record<Bug['status'], number> = {
          'reported': 1,    // New bugs need immediate attention
          'analyzing': 2,   // Being investigated
          'fixing': 3,      // Being worked on
          'fixed': 4,       // Fixed but not verified
          'verifying': 5,   // Being tested
          'resolved': 6     // Completed bugs at bottom
        };
        
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        
        // Primary sort: by status priority
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Secondary sort: by last modified date within same status group (newest first)
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
    },

    normalizeProjects(projects: Project[]): Project[] {
      return projects.map((project) => {
        if (project.specs) {
          project.specs = project.specs.map((spec) => {
            // Initialize selected task to first incomplete when tasks exist
            this.initializeSelectedTask(spec);
            
            // Ensure requirements content is properly handled
            if (spec.requirements && spec.requirements.content) {
              // Parse requirements if needed
              if (typeof spec.requirements.content === 'string') {
                try {
                  spec.requirements.content = JSON.parse(spec.requirements.content);
                } catch (e) {
                  console.warn('Failed to parse requirements content:', e);
                }
              }
            }

            // Ensure design content is properly parsed
            if (spec.design && (spec.design as any).codeReuseContent) {
              if (typeof (spec.design as any).codeReuseContent === 'string') {
                try {
                  (spec.design as any).codeReuseContent = JSON.parse((spec.design as any).codeReuseContent);
                } catch (e) {
                  console.warn('Failed to parse design content:', e);
                }
              }
            }

            return spec;
          });
        }
        return project;
      });
    },

    scrollToRequirement(specName: string, requirementId: string): void {
      const element = document.getElementById(`${specName}-req-${requirementId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },

    toggleShowCompleted(): void {
      this.showCompleted = !this.showCompleted;
      localStorage.setItem('showCompleted', this.showCompleted.toString());
    },

    // ========================================================================
    // Tunnel Management
    // ========================================================================

    async fetchTunnelStatus(): Promise<void> {
      try {
        const response = await fetch('/api/tunnel/status');
        if (response.ok) {
          this.tunnelStatus = await response.json() as TunnelStatus;
          console.log('Tunnel status:', this.tunnelStatus);
        } else {
          // No tunnel or error - set inactive status
          this.tunnelStatus = { active: false } as TunnelStatus;
        }
      } catch (error) {
        console.error('Error fetching tunnel status:', error);
        this.tunnelStatus = { active: false } as TunnelStatus;
      }
    },

    async startTunnel(): Promise<void> {
      try {
        const response = await fetch('/api/tunnel/start', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          console.log('Tunnel started successfully:', data);
        } else {
          console.error('Failed to start tunnel:', response.status);
          alert('Failed to start tunnel. Check the console for details.');
        }
      } catch (error) {
        console.error('Error starting tunnel:', error);
        alert('Error starting tunnel. Check the console for details.');
      }
    },

    async stopTunnel(): Promise<void> {
      try {
        const response = await fetch('/api/tunnel/stop', { method: 'POST' });
        if (response.ok) {
          this.tunnelStatus = { active: false } as TunnelStatus;
          console.log('Tunnel stopped successfully');
        } else {
          console.error('Failed to stop tunnel:', response.status);
        }
      } catch (error) {
        console.error('Error stopping tunnel:', error);
      }
    },

    formatTunnelExpiry(expiresAt: string): string {
      if (!expiresAt) return '';
      const expires = new Date(expiresAt);
      const now = new Date();
      const diffMs = expires.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffHours > 0) {
        return `in ${diffHours}h ${diffMins % 60}m`;
      } else if (diffMins > 0) {
        return `in ${diffMins}m`;
      } else {
        return 'soon';
      }
    },

    // ========================================================================
    // Markdown Viewing (Override with projectPath)
    // ========================================================================

    async viewMarkdown(specName: string, docType: string, projectPath: string | null = null): Promise<void> {
      // If projectPath is provided directly, use it
      if (projectPath) {
        // Create a temporary object with the required state
        const previewState = {
          markdownPreview: this.markdownPreview
        };
        
        // Use the shared viewMarkdown implementation
        return this.viewMarkdownWithProject(specName, docType, projectPath);
      }
      
      // Otherwise use selectedProject
      if (!this.selectedProject) {
        console.error('No project selected for viewing markdown');
        // Don't show the modal if there's no project selected
        return;
      }
      return this.viewMarkdownWithProject(specName, docType, this.selectedProject.path);
    },

    async viewBugMarkdown(projectPath: string, bugName: string, docType: string): Promise<void> {
      this.markdownPreview.show = true;
      this.markdownPreview.loading = true;
      this.markdownPreview.title = `${bugName} - ${docType}.md`;
      
      try {
        const encodedPath = encodeURIComponent(projectPath);
        const response = await fetch(`/api/projects/${encodedPath}/bugs/${bugName}/${docType}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response not OK:', response.status, errorText);
          throw new Error(`Failed to fetch ${docType} content: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Setting bug markdown preview content, data:', data);
        this.markdownPreview.content = data.content;
        this.markdownPreview.rawContent = data.content;  // Store raw markdown
        console.log('markdownPreview.rawContent is now:', this.markdownPreview.rawContent?.substring(0, 100));
      } catch (error) {
        console.error(`Error fetching ${docType} content:`, error);
        this.markdownPreview.content = `# Error loading ${docType} content\n\n${(error as Error).message}`;
        this.markdownPreview.rawContent = '';
      } finally {
        this.markdownPreview.loading = false;
      }
    },

    hasBugDocument(bugName: string, docType: string): boolean {
      // First try to find the bug in any active session
      for (const session of this.activeSessions) {
        if (session.type === 'bug' && session.bugName === bugName) {
          // Find the project for this session
          const project = this.projects.find(p => p.path === session.projectPath);
          if (project && project.bugs) {
            const bug = project.bugs.find(b => b.name === bugName);
            if (bug) {
              switch (docType) {
                case 'report':
                  return bug.report?.exists || false;
                case 'analysis':
                  return bug.analysis?.exists || false;
                case 'fix':
                  return bug.fix?.exists || false;
              }
            }
          }
        }
      }
      
      // Fallback to selected project if not in active sessions
      if (this.selectedProject && this.selectedProject.bugs) {
        const bug = this.selectedProject.bugs.find(b => b.name === bugName);
        if (bug) {
          switch (docType) {
            case 'report':
              return bug.report?.exists || false;
            case 'analysis':
              return bug.analysis?.exists || false;
            case 'fix':
              return bug.fix?.exists || false;
          }
        }
      }
      
      return false;
    },

    async viewBugDocument(projectPath: string, bugName: string, docType: string): Promise<void> {
      // Use the existing viewBugMarkdown method to display the document
      await this.viewBugMarkdown(projectPath, bugName, docType);
    },

    // ========================================================================
    // Shared Component Method Bindings
    // ========================================================================

    initTheme(): void {
      const savedTheme = localStorage.getItem('theme') || 'system';
      this.theme = savedTheme as 'light' | 'dark' | 'system';
      this.applyTheme(this.theme);
    },

    applyTheme(theme: string): void {
      const root = document.documentElement;
      
      if (theme === 'dark' || 
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    },

    cycleTheme(): void {
      const themes = ['light', 'dark', 'system'] as const;
      const currentIndex = themes.indexOf(this.theme);
      this.theme = themes[(currentIndex + 1) % themes.length] || 'system';
      localStorage.setItem('theme', this.theme);
      this.applyTheme(this.theme);
    },

    closeMarkdownPreview(): void {
      this.markdownPreview.show = false;
      this.markdownPreview.title = '';
      this.markdownPreview.content = '';
      this.markdownPreview.rawContent = '';
    },

    setupKeyboardHandlers(): void {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.markdownPreview.show) {
          this.closeMarkdownPreview();
        }
      });
    },

    setupCodeBlockCopyHandlers(): void {
      // Use event delegation on the document body to catch all code copy buttons
      document.addEventListener('click', (event) => {
        const button = event.target && (event.target as Element).closest('.code-copy-btn');
        if (button) {
          event.preventDefault();
          event.stopPropagation();
          this.copyCodeBlock(event);
        }
      });
    },

    copyCodeBlock(event: Event): void {
      const button = event.target && (event.target as Element).closest('.code-copy-btn') as HTMLButtonElement;
      if (!button) return;
      
      const pre = button.parentElement?.querySelector('pre[data-code-content]') as HTMLPreElement;
      if (!pre) return;
      
      const encodedCode = pre.getAttribute('data-code-content');
      if (!encodedCode) return;
      
      try {
        const decodedCode = decodeURIComponent(escape(atob(encodedCode)));
        void dashboardShared.copyCommand(decodedCode, event);
      } catch (err) {
        console.error('Failed to decode code content:', err);
        
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-times"></i> Error';
        button.classList.add('text-red-600', 'dark:text-red-400');
        
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove('text-red-600', 'dark:text-red-400');
        }, 2000);
      }
    },

    async viewMarkdownWithProject(specName: string, docType: string, projectPath: string): Promise<void> {
      this.markdownPreview.show = true;
      this.markdownPreview.loading = true;
      this.markdownPreview.title = `${specName} - ${docType}.md`;
      
      try {
        const encodedPath = encodeURIComponent(projectPath);
        const response = await fetch(`/api/projects/${encodedPath}/specs/${specName}/${docType}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${docType} content: ${response.status}`);
        }
        
        const data = await response.json();
        this.markdownPreview.content = data.content;
        this.markdownPreview.rawContent = data.content;
      } catch (error) {
        console.error(`Error fetching ${docType} content:`, error);
        this.markdownPreview.content = `# Error loading ${docType} content\n\n${(error as Error).message}`;
        this.markdownPreview.rawContent = '';
      } finally {
        this.markdownPreview.loading = false;
      }
    },

    // ========================================================================
    // Expose shared utilities from dashboardShared
    // ========================================================================
    
    getStatusLabel: dashboardShared.getStatusLabel,
    getStatusClass: dashboardShared.getStatusClass,
    formatDate: dashboardShared.formatDate,
    copyCommand: dashboardShared.copyCommand,
    renderMarkdown: dashboardShared.renderMarkdown,
    formatAcceptanceCriteria: dashboardShared.formatAcceptanceCriteria,
    formatUserStory: dashboardShared.formatUserStory
  };

  // Mount the PetiteVue application
  PetiteVue.createApp(appState as any).mount('#app');
}

// ============================================================================
// Application Bootstrap
// ============================================================================

// Start initialization
function startApp() {
  // Wait for PetiteVue to be available
  if (typeof PetiteVue === 'undefined') {
    console.log('Waiting for PetiteVue to load...');
    setTimeout(startApp, 10);
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

startApp();