/**
 * Type definitions for the TypeScript dashboard frontend
 * Exports all types, interfaces, and type utilities
 */

// Re-export petite-vue types
export * from './petite-vue';

// Re-export shared types from the shared module (except conflicting type guards)
export type {
  Project,
  Spec,
  Task,
  Bug,
  RequirementDetail,
  CodeReuseCategory,
  SteeringStatus,
  WebSocketMessage,
  InitialDataMessage,
  UpdateDataMessage,
  BugUpdateMessage,
  SteeringUpdateMessage,
  ErrorDataMessage,
  TunnelStartedMessage,
  TunnelStoppedMessage,
  TunnelMetricsMessage,
  TunnelVisitorMessage,
  TunnelMetrics,
  TunnelVisitor,
  InitialData,
  UpdateData,
  ErrorData,
  AppState,
  ActiveSession,
  MarkdownPreviewState,
  GroupedProjectsCache,
  ProjectTabData,
  ExpandedStates,
  SelectedItems,
  CacheManagement,
  NavigationState,
  UserPreferences,
  ColorScheme,
  GroupedProject,
  DashboardOptions,
  FileWatchEvent,
  TaskExecutionContext,
  ServerStatus,
  DashboardStats,
  UISpec,
  UITask,
  UIBug,
  AppStateMethods,
  CompleteAppState,
  StatusType,
  ThemeType,
  TabType,
  ProjectSelectHandler,
  SpecSelectHandler,
  TaskSelectHandler,
  ThemeChangeHandler
} from '../../shared/dashboard.types';

export {
  DEFAULT_DASHBOARD_OPTIONS,
  STATUS_PRIORITY,
  BUG_STATUS_PRIORITY
} from '../../shared/dashboard.types';

// Re-export validation utilities and runtime type guards (these will take precedence)
export * from './validation';