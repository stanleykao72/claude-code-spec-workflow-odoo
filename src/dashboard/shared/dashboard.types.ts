/**
 * Shared type definitions for the dashboard frontend and backend
 * This file provides common interfaces and types that can be used
 * across the entire dashboard application to ensure type safety.
 */

// Import and re-export core types from parser
import type {
  Task,
  RequirementDetail,
  CodeReuseCategory,
  SteeringStatus,
  Bug,
  Spec
} from '../parser';

// Import tunnel types for dashboard use
import type {
  TunnelStatus,
  TunnelInfo,
  TunnelOptions
} from '../tunnel/types';

// Re-export for external consumers
export type {
  Task,
  RequirementDetail,
  CodeReuseCategory,
  SteeringStatus,
  Bug,
  Spec,
  TunnelStatus,
  TunnelInfo,
  TunnelOptions
};

/**
 * Extended Project interface for dashboard display
 * Represents a project with its specs, bugs, and metadata
 */
export interface Project {
  /** Absolute path to the project directory */
  path: string;
  /** Display name of the project */
  name: string;
  /** Hierarchy level for nested project display (0 = root) */
  level: number;
  /** Whether this project has an active dashboard session */
  hasActiveSession: boolean;
  /** All specifications found in this project */
  specs: Spec[];
  /** All bugs found in this project */
  bugs: Bug[];
  /** Steering document status (if available) */
  steeringStatus?: SteeringStatus;
}

/**
 * WebSocket message types for real-time communication
 * Uses discriminated unions for type-safe message handling
 */
export type WebSocketMessage = 
  | InitialDataMessage
  | UpdateDataMessage
  | BugUpdateMessage
  | SteeringUpdateMessage
  | ErrorDataMessage
  | TunnelStartedMessage
  | TunnelStoppedMessage
  | TunnelMetricsMessage
  | TunnelVisitorMessage;

export interface InitialDataMessage {
  type: 'initial';
  data: InitialData;
}

export interface UpdateDataMessage {
  type: 'update';
  data: UpdateData;
}

export interface BugUpdateMessage {
  type: 'bug-update';
  data: UpdateData;
}

export interface SteeringUpdateMessage {
  type: 'steering-update';
  data: SteeringStatus;
}

export interface ErrorDataMessage {
  type: 'error';
  data: ErrorData;
}

export interface TunnelStartedMessage {
  type: 'tunnel:started';
  data: TunnelInfo;
}

export interface TunnelStoppedMessage {
  type: 'tunnel:stopped';
  data: Record<string, unknown>;
}

export interface TunnelMetricsMessage {
  type: 'tunnel:metrics:updated';
  data: TunnelMetrics;
}

export interface TunnelVisitorMessage {
  type: 'tunnel:visitor:new';
  data: TunnelVisitor;
}

/**
 * Tunnel metrics data
 */
export interface TunnelMetrics {
  /** Current number of active viewers */
  viewers: number;
  /** Total requests served */
  totalRequests?: number;
  /** Data transferred in bytes */
  dataTransferred?: number;
  /** Uptime in milliseconds */
  uptime?: number;
}

/**
 * Tunnel visitor information
 */
export interface TunnelVisitor {
  /** Visitor IP address (anonymized) */
  ip: string;
  /** User agent string */
  userAgent?: string;
  /** Referrer URL */
  referrer?: string;
  /** Timestamp of first visit */
  firstVisit: Date;
  /** Location information (if available) */
  location?: {
    country?: string;
    city?: string;
  };
}

/**
 * Initial data sent when client connects
 */
export interface InitialData {
  /** All specifications found */
  specs: Spec[];
  /** All bugs found */
  bugs: Bug[];
  /** Current tunnel status */
  tunnelStatus: TunnelStatus;
  /** Server configuration info */
  config?: {
    version?: string;
    buildTime?: string;
  };
}

/**
 * Update data sent when files change
 */
export interface UpdateData {
  /** Updated projects (partial update) */
  projects: Project[];
  /** Timestamp of the update */
  timestamp: number;
  /** Files that triggered the update */
  changedFiles?: string[];
}

/**
 * Error data for communication errors
 */
export interface ErrorData {
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Additional error context */
  details?: Record<string, unknown>;
}


/**
 * Application state interface for reactive frontend state
 * Comprehensive state management for the multi-project dashboard
 */
export interface AppState {
  // Core Data State
  /** All projects loaded in the dashboard */
  projects: Project[];
  /** Currently selected project (null if none) */
  selectedProject: Project | null;
  /** Currently selected specification (null if none) */
  selectedSpec: Spec | null;
  /** List of active sessions (specs/bugs being worked on) */
  activeSessions: ActiveSession[];
  
  // Connection State
  /** WebSocket connection status */
  connected: boolean;
  /** WebSocket instance (null if not connected) */
  ws: globalThis.WebSocket | null;
  /** Current tunnel status (null if no tunnel) */
  tunnelStatus: TunnelStatus | null;
  
  // UI Theme and User State
  /** Current UI theme */
  theme: 'light' | 'dark' | 'system';
  /** Username for the current session */
  username: string;
  
  // Navigation State
  /** Active tab in the dashboard */
  activeTab: 'active' | 'projects';
  /** Whether to show completed specs/tasks */
  showCompleted: boolean;
  /** Pending project route (when projects haven't loaded yet) */
  pendingProjectRoute: string | null;
  
  // Expansion State Management
  /** Expanded state for requirements sections (spec name -> expanded) */
  expandedRequirements: Record<string, boolean>;
  /** Expanded state for design sections (spec name -> expanded) */
  expandedDesigns: Record<string, boolean>;
  /** Expanded state for task sections (spec name -> expanded) */
  expandedTasks: Record<string, boolean>;
  /** Expanded state for requirement accordions (specName-reqId -> expanded) */
  expandedRequirementAccordions: Record<string, boolean>;
  
  // Selection State Management
  /** Selected task IDs (spec name -> task ID) */
  selectedTasks: Record<string, string>;
  
  // Task Collapse State
  /** Collapsed state for completed tasks (spec name -> collapsed) */
  collapsedCompletedTasks: Record<string, boolean>;
  
  // Markdown Preview State
  /** Markdown preview modal state */
  markdownPreview: MarkdownPreviewState;
  
  // Cache Management (Non-reactive)
  /** Cache for grouped projects (invalidated when projects change) */
  _groupedProjectsCache: GroupedProjectsCache | null;
  /** Cache for computed color values */
  _colorValueCache: Record<string, string>;
  /** Pre-computed data for project tabs to avoid reactivity issues */
  projectTabsData: ProjectTabData[];
}

/**
 * Active session representing a spec or bug being worked on
 */
export interface ActiveSession {
  /** Type of session - spec or bug */
  type: 'spec' | 'bug';
  /** Path to the project containing this item */
  projectPath: string;
  /** Name of the spec */
  specName?: string;
  /** Name of the bug */
  bugName?: string;
  /** Current task ID being worked on (for specs) */
  currentTaskId?: string;
  /** Total number of tasks (for specs) */
  totalTasks?: number;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Pre-computed project color value for performance */
  projectColorValue?: string;
}

/**
 * Markdown preview modal state
 */
export interface MarkdownPreviewState {
  /** Whether the preview is visible */
  show: boolean;
  /** Title of the preview modal */
  title: string;
  /** Rendered HTML content */
  content: string;
  /** Raw markdown content */
  rawContent: string;
  /** Whether content is currently loading */
  loading: boolean;
}

/**
 * Cache for grouped projects to avoid expensive re-computation
 */
export interface GroupedProjectsCache {
  /** Number of projects when cache was created */
  projectsCount: number;
  /** Hash of project paths for cache invalidation */
  projectsHash: string;
  /** Cached grouped project data */
  data: Project[];
}

/**
 * Pre-computed project tab data for performance
 */
export interface ProjectTabData {
  /** Project path */
  path: string;
  /** Display name */
  name: string;
  /** Hierarchy level */
  level: number;
  /** Whether project has an active session */
  hasActiveSession: boolean;
  /** Pre-computed color value */
  colorValue: string;
  /** Primary color class name */
  colorPrimary: string;
  /** Whether next project is top-level */
  isNextTopLevel: boolean;
  /** Whether previous project is nested */
  isPrevNested: boolean;
  /** Project specs */
  specs: Spec[];
  /** Project bugs */
  bugs: Bug[];
}

/**
 * UI-specific state management types
 * These types represent different aspects of the user interface state
 */

/**
 * Expanded state management for different UI sections
 */
export interface ExpandedStates {
  /** Requirements sections (spec name -> expanded state) */
  requirements: Record<string, boolean>;
  /** Design sections (spec name -> expanded state) */
  designs: Record<string, boolean>;
  /** Task sections (spec name -> expanded state) */
  tasks: Record<string, boolean>;
  /** Requirement accordions (specName-reqId -> expanded state) */
  requirementAccordions: Record<string, boolean>;
  /** Completed task sections (spec name -> collapsed state) */
  collapsedCompletedTasks: Record<string, boolean>;
}

/**
 * Selection state management for interactive elements
 */
export interface SelectedItems {
  /** Selected project (null if none) */
  project: Project | null;
  /** Selected specification (null if none) */
  spec: Spec | null;
  /** Selected tasks per spec (spec name -> task ID) */
  tasks: Record<string, string>;
  /** Currently active tab */
  activeTab: 'active' | 'projects';
}

/**
 * Cache management interfaces for performance optimization
 */
export interface CacheManagement {
  /** Grouped projects cache with invalidation data */
  groupedProjects: GroupedProjectsCache | null;
  /** Color value cache for projects (path -> RGB string) */
  colorValues: Record<string, string>;
  /** Pre-computed project tabs data */
  projectTabsData: ProjectTabData[];
}

/**
 * Navigation state for routing and history management
 */
export interface NavigationState {
  /** Current active tab */
  activeTab: 'active' | 'projects';
  /** Pending project route when projects haven't loaded */
  pendingProjectRoute: string | null;
  /** Whether to show completed items */
  showCompleted: boolean;
}

/**
 * Theme and user preference state
 */
export interface UserPreferences {
  /** Current theme setting */
  theme: 'light' | 'dark' | 'system';
  /** Username for display */
  username: string;
  /** Show/hide completed items preference */
  showCompleted: boolean;
}

/**
 * Color scheme for project visualization
 * Extended to include dark mode variants
 */
export interface ColorScheme {
  /** Primary color (e.g., 'indigo-600') */
  primary: string;
  /** Light background color (e.g., 'indigo-100') */
  light: string;
  /** Ring/focus color (e.g., 'indigo-500') */
  ring: string;
  /** Dark mode variant */
  dark?: {
    /** Primary color for dark mode */
    primary: string;
    /** Light background for dark mode */
    light: string;
  };
}

/**
 * Grouped project structure for dashboard display
 */
export interface GroupedProject {
  /** Group identifier */
  groupId: string;
  /** Group display name */
  groupName: string;
  /** Projects in this group */
  projects: Project[];
  /** Color scheme for the group */
  colorScheme: ColorScheme;
  /** Whether the group is expanded in UI */
  expanded: boolean;
}

/**
 * Dashboard configuration options
 */
export interface DashboardOptions {
  /** Port to run the dashboard on */
  port?: number;
  /** Whether to open browser automatically */
  open?: boolean;
  /** Watch for file changes */
  watch?: boolean;
  /** Enable tunnel functionality */
  tunnel?: boolean;
  /** Tunnel options */
  tunnelOptions?: TunnelOptions;
}

/**
 * File watcher event types
 */
export interface FileWatchEvent {
  /** Type of file system event */
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  /** Absolute path to the changed file/directory */
  path: string;
  /** Relative path from project root */
  relativePath: string;
  /** Timestamp of the event */
  timestamp: number;
}

/**
 * Task execution context for generated commands
 */
export interface TaskExecutionContext {
  /** Name of the spec */
  specName: string;
  /** Task ID being executed */
  taskId: string;
  /** Full task object */
  task: Task;
  /** Associated requirements */
  requirements: RequirementDetail[];
  /** Code to leverage (from _Leverage: section) */
  leverage?: string[];
}

/**
 * Dashboard server status information
 */
export interface ServerStatus {
  /** Whether the server is running */
  running: boolean;
  /** Port the server is listening on */
  port?: number;
  /** Start time of the server */
  startTime?: Date;
  /** Number of connected clients */
  connections: number;
  /** Server version */
  version?: string;
}

/**
 * Statistics about the current dashboard session
 */
export interface DashboardStats {
  /** Total number of projects */
  totalProjects: number;
  /** Total number of specs */
  totalSpecs: number;
  /** Number of completed specs */
  completedSpecs: number;
  /** Number of specs in progress */
  inProgressSpecs: number;
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Total number of bugs */
  totalBugs: number;
  /** Number of resolved bugs */
  resolvedBugs: number;
}

/**
 * Frontend-specific extensions to core types
 */

/**
 * Extended Spec interface for UI state
 */
export interface UISpec extends Spec {
  /** Whether the spec is expanded in the UI */
  isExpanded?: boolean;
  /** Currently selected task ID */
  selectedTaskId?: string;
  /** Computed progress percentage (0-100) */
  progressPercentage?: number;
}

/**
 * Extended Task interface for UI state
 */
export interface UITask extends Task {
  /** Whether the task is visible in current filter */
  isVisible?: boolean;
  /** Indentation level for nested display */
  indentLevel?: number;
  /** Whether task details are expanded */
  detailsExpanded?: boolean;
}

/**
 * Extended Bug interface for UI state
 */
export interface UIBug extends Bug {
  /** Whether the bug is expanded in the UI */
  isExpanded?: boolean;
  /** Computed age in days */
  ageInDays?: number;
}

/**
 * Type guards for runtime type checking
 */
export function isWebSocketMessage(obj: unknown): obj is WebSocketMessage {
  return typeof obj === 'object' && obj !== null && 'type' in obj && 'data' in obj;
}

export function isInitialDataMessage(msg: WebSocketMessage): msg is InitialDataMessage {
  return msg.type === 'initial';
}

export function isUpdateDataMessage(msg: WebSocketMessage): msg is UpdateDataMessage {
  return msg.type === 'update';
}

export function isBugUpdateMessage(msg: WebSocketMessage): msg is BugUpdateMessage {
  return msg.type === 'bug-update';
}

export function isSteeringUpdateMessage(msg: WebSocketMessage): msg is SteeringUpdateMessage {
  return msg.type === 'steering-update';
}

export function isErrorDataMessage(msg: WebSocketMessage): msg is ErrorDataMessage {
  return msg.type === 'error';
}

export function isTunnelStartedMessage(msg: WebSocketMessage): msg is TunnelStartedMessage {
  return msg.type === 'tunnel:started';
}

export function isTunnelStoppedMessage(msg: WebSocketMessage): msg is TunnelStoppedMessage {
  return msg.type === 'tunnel:stopped';
}

export function isTunnelMetricsMessage(msg: WebSocketMessage): msg is TunnelMetricsMessage {
  return msg.type === 'tunnel:metrics:updated';
}

export function isTunnelVisitorMessage(msg: WebSocketMessage): msg is TunnelVisitorMessage {
  return msg.type === 'tunnel:visitor:new';
}

/**
 * State mutation methods interface
 * Defines method signatures for managing application state
 */
export interface AppStateMethods {
  // Navigation Methods
  /** Switch between 'active' and 'projects' tabs */
  switchTab(_tab: 'active' | 'projects'): void;
  /** Select a project and switch to projects tab */
  selectProject(_project: Project | null): void;
  /** Select a project from an active session */
  selectProjectFromSession(_session: ActiveSession): void;
  /** Select a project from a task link */
  selectProjectFromTask(_projectPath: string, _itemName: string, _sessionType?: 'spec' | 'bug'): void;

  // Expansion State Methods
  /** Toggle requirements section expansion for a spec */
  toggleRequirementsExpanded(_specName: string): void;
  /** Check if requirements section is expanded for a spec */
  isRequirementsExpanded(_specName: string): boolean;
  /** Toggle design section expansion for a spec */
  toggleDesignExpanded(_specName: string): void;
  /** Check if design section is expanded for a spec */
  isDesignExpanded(_specName: string): boolean;
  /** Toggle tasks section expansion for a spec */
  toggleTasksExpanded(_specName: string): void;
  /** Check if tasks section is expanded for a spec */
  isTasksExpanded(_specName: string): boolean;
  /** Toggle requirement accordion expansion */
  toggleRequirementAccordion(_specName: string, _requirementId: string): void;
  /** Check if requirement accordion is expanded */
  isRequirementExpanded(_specName: string, _requirementId: string): boolean;

  // Task Selection Methods  
  /** Select a task for a spec */
  selectTask(_specName: string, _taskId: string): void;
  /** Check if a task is selected for a spec */
  isTaskSelected(_specName: string, _taskId: string): boolean;
  /** Get the selected task ID for a spec */
  selectedTaskId(_specName: string): string | undefined;
  /** Get the selected task object for a spec */
  getSelectedTask(_specName: string): Task | null;
  /** Initialize selected task for a spec (first incomplete task) */
  initializeSelectedTask(_spec: Spec): void;

  // WebSocket Connection Methods
  /** Connect to WebSocket server */
  connectWebSocket(): void;
  /** Handle incoming WebSocket messages */
  handleWebSocketMessage(_message: WebSocketMessage): void;

  // Project Display Methods
  /** Get visible specs for a project (filtered by showCompleted) */
  getVisibleSpecs(_project: Project): Spec[];
  /** Get visible bugs for a project (filtered by showCompleted) */
  getVisibleBugs(_project: Project): Bug[];
  /** Toggle show/hide completed items */
  toggleShowCompleted(): void;

  // Cache Management Methods
  /** Get cached grouped projects, rebuilding if necessary */
  getCachedGroupedProjects(): Project[];
  /** Get grouped projects for template use */
  getGroupedProjects(): Project[];
  /** Update pre-computed project tabs data */
  updateProjectTabsData(): void;

  // Color Management Methods
  /** Get color scheme for a project path */
  getProjectColor(_projectPath: string): ColorScheme;
  /** Get CSS classes for project color */
  getProjectColorClasses(_projectPath: string, _type?: 'text' | 'bg' | 'bg-primary' | 'border' | 'border-l' | 'border-r'): string;
  /** Get project color value (RGB string) */
  getProjectColorValue(_projectPath: string): string;
  /** Get project tab styles for a project */
  getProjectTabStyles(_project: Project): string[];
  /** Get project badge styles */
  getProjectBadgeStyles(_project: Project): string[];

  // Project Statistics Methods
  /** Get number of specs in progress for a project */
  getSpecsInProgress(_project: Project): number;
  /** Get number of completed specs for a project */
  getSpecsCompleted(_project: Project): number;
  /** Get total number of tasks for a project */
  getTotalTasks(_project: Project): number;
  /** Get number of open specs for a project */
  getOpenSpecsCount(_project: Project): number;
  /** Get number of open bugs for a project */
  getOpenBugsCount(_project: Project): number;
  /** Get number of bugs in progress for a project */
  getBugsInProgress(_project: Project): number;
  /** Get number of resolved bugs for a project */
  getBugsResolved(_project: Project): number;

  // Active Session Methods
  /** Get task number for an active session */
  getTaskNumber(_activeSession: ActiveSession): number;
  /** Get total task count for a spec session */
  getSpecTaskCount(_activeSession: ActiveSession): number;
  /** Get progress percentage for a spec session */
  getSpecProgress(_activeSession: ActiveSession): number;
  /** Get next incomplete task for a spec session */
  getNextTask(_activeSession: ActiveSession): Task | null;
  /** Get current task for a spec */
  getCurrentTask(_spec: Spec): Task | null;

  // Routing Methods
  /** Initialize browser routing */
  initializeRouting(): void;
  /** Handle route changes */
  handleRouteChange(): void;
  /** Update browser URL based on current state */
  updateURL(): void;
  /** Convert project to URL-friendly slug */
  getProjectSlug(_project: Project): string;

  // Command Copying Methods
  /** Copy next task command to clipboard */
  copyNextTaskCommand(_spec: Spec, _event: Event): void;
  /** Copy orchestrate command to clipboard */
  copyOrchestrateCommand(_spec: Spec, _event: Event): void;

  // Utility Methods
  /** Sort projects by name */
  sortProjects(): void;
  /** Sort specs by status and name */
  sortSpecs(_specs: Spec[]): void;
  /** Sort bugs by status and creation date */
  sortBugs(_bugs: Bug[]): void;
  /** Normalize projects data from server */
  normalizeProjects(_projects: Project[]): Project[];
  /** Find first incomplete task in a task list */
  findFirstIncompleteTask(_tasks: Task[]): Task | null;
  /** Scroll to a specific requirement element */
  scrollToRequirement(_specName: string, _requirementId: string): void;

  // Tunnel Management Methods
  /** Check current tunnel status */
  checkTunnelStatus(): Promise<void>;
  /** Start tunnel for sharing dashboard */
  startTunnel(): Promise<void>;
  /** Stop active tunnel */
  stopTunnel(): Promise<void>;
  /** Format tunnel expiry time */
  formatTunnelExpiry(_expiresAt: string): string;
}

/**
 * Complete application state interface including methods
 * Combines reactive state properties with state mutation methods
 */
export interface CompleteAppState extends AppState, AppStateMethods {
  // Computed properties
  /** Number of projects with active sessions */
  readonly activeSessionCount: number;
  /** Grouped projects list for template use */
  readonly groupedProjectsList: Project[];
}

/**
 * Utility types for common patterns
 */

/** Status types that can be used throughout the application */
export type StatusType = 'not-started' | 'requirements' | 'design' | 'tasks' | 'in-progress' | 'completed';

/** Theme options for the dashboard */
export type ThemeType = 'light' | 'dark' | 'system';

/** Tab types for navigation */
export type TabType = 'active' | 'projects';

/** Event handler types for common interactions */
export type ProjectSelectHandler = (_project: Project | null) => void;
export type SpecSelectHandler = (_spec: Spec | null) => void;
export type TaskSelectHandler = (_task: Task | null) => void;
export type ThemeChangeHandler = (_theme: ThemeType) => void;

/**
 * Constants for common values
 */
export const DEFAULT_DASHBOARD_OPTIONS: Required<DashboardOptions> = {
  port: 3000,
  open: true,
  watch: true,
  tunnel: false,
  tunnelOptions: {}
};

export const STATUS_PRIORITY: Record<StatusType, number> = {
  'in-progress': 1,
  'tasks': 2,
  'design': 3,
  'requirements': 4,
  'not-started': 5,
  'completed': 6
};

export const BUG_STATUS_PRIORITY: Record<Bug['status'], number> = {
  'reported': 1,
  'analyzing': 2,
  'fixing': 3,
  'fixed': 4,
  'verifying': 5,
  'resolved': 6
};