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
 */
export interface AppState {
  /** All projects loaded in the dashboard */
  projects: Project[];
  /** Currently selected project (null if none) */
  selectedProject: Project | null;
  /** Currently selected specification (null if none) */
  selectedSpec: Spec | null;
  /** Current UI theme */
  theme: 'light' | 'dark' | 'system';
  /** WebSocket connection status */
  connected: boolean;
  /** Current tunnel status (null if no tunnel) */
  tunnelStatus: TunnelStatus | null;
  
  // UI State
  /** Active tab in the dashboard */
  activeTab: 'active' | 'projects';
  /** Whether to show completed specs/tasks */
  showCompleted: boolean;
  /** Expanded state for requirements sections (spec name -> expanded) */
  expandedRequirements: Record<string, boolean>;
  /** Expanded state for design sections (spec name -> expanded) */
  expandedDesigns: Record<string, boolean>;
  /** Expanded state for task sections (spec name -> expanded) */
  expandedTasks: Record<string, boolean>;
  /** Selected task IDs (spec name -> task ID) */
  selectedTasks: Record<string, string>;
}

/**
 * Color scheme for project visualization
 */
export interface ColorScheme {
  /** Background color */
  bg: string;
  /** Text color */
  text: string;
  /** Border color */
  border: string;
  /** Accent color */
  accent: string;
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