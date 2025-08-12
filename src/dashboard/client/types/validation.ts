/**
 * Runtime type validation system for dashboard TypeScript conversion
 * Provides type guards, Result types, and safe parsing utilities with error recovery
 */

import type {
  Project,
  Spec,
  Task,
  Bug,
  RequirementDetail,
  CodeReuseCategory,
  SteeringStatus,
  WebSocketMessage,
  InitialData,
  UpdateData,
  ErrorData,
  TunnelStatus,
  AppState,
  ActiveSession,
  MarkdownPreviewState,
  GroupedProjectsCache,
  ProjectTabData
} from '../../shared/dashboard.types';

/**
 * Result type for operations that can fail
 * Provides type-safe error handling throughout the application
 */
export type Result<T, E = ValidationError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public path?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * WebSocket message validation error
 */
export class WebSocketValidationError extends ValidationError {
  constructor(
    message: string,
    public messageType: string,
    public rawMessage?: unknown
  ) {
    super(message, 'WEBSOCKET_VALIDATION_ERROR', undefined, rawMessage);
    this.name = 'WebSocketValidationError';
  }
}

/**
 * Safe parsing utilities with error recovery
 */
export class SafeParser {
  /**
   * Safely parse JSON with error recovery
   */
  static parseJSON<T = unknown>(jsonString: string): Result<T> {
    try {
      const parsed = JSON.parse(jsonString) as T;
      return { success: true, data: parsed };
    } catch (error) {
      return {
        success: false,
        error: new ValidationError(
          `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'JSON_PARSE_ERROR',
          undefined,
          { jsonString: jsonString.substring(0, 100) + '...' }
        )
      };
    }
  }

  /**
   * Safely parse date with fallback
   */
  static parseDate(dateInput: unknown, fallback?: Date): Result<Date> {
    try {
      if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) 
          ? { success: false, error: new ValidationError('Invalid Date object', 'INVALID_DATE') }
          : { success: true, data: dateInput };
      }

      if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          if (fallback) {
            return { success: true, data: fallback };
          }
          return {
            success: false,
            error: new ValidationError(`Invalid date format: ${dateInput}`, 'INVALID_DATE_FORMAT')
          };
        }
        return { success: true, data: date };
      }

      return {
        success: false,
        error: new ValidationError(`Unsupported date type: ${typeof dateInput}`, 'UNSUPPORTED_DATE_TYPE')
      };
    } catch (error) {
      if (fallback) {
        return { success: true, data: fallback };
      }
      return {
        success: false,
        error: new ValidationError(
          `Date parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'DATE_PARSING_ERROR'
        )
      };
    }
  }

  /**
   * Safely parse number with bounds checking
   */
  static parseNumber(input: unknown, min?: number, max?: number): Result<number> {
    try {
      let num: number;
      
      if (typeof input === 'number') {
        num = input;
      } else if (typeof input === 'string') {
        num = parseFloat(input);
      } else {
        return {
          success: false,
          error: new ValidationError(`Cannot parse number from type: ${typeof input}`, 'INVALID_NUMBER_TYPE')
        };
      }

      if (isNaN(num)) {
        return {
          success: false,
          error: new ValidationError(`Not a valid number: ${input}`, 'NAN_VALUE')
        };
      }

      if (min !== undefined && num < min) {
        return {
          success: false,
          error: new ValidationError(`Number ${num} is below minimum ${min}`, 'BELOW_MINIMUM')
        };
      }

      if (max !== undefined && num > max) {
        return {
          success: false,
          error: new ValidationError(`Number ${num} is above maximum ${max}`, 'ABOVE_MAXIMUM')
        };
      }

      return { success: true, data: num };
    } catch (error) {
      return {
        success: false,
        error: new ValidationError(
          `Number parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'NUMBER_PARSING_ERROR'
        )
      };
    }
  }

  /**
   * Safely parse boolean with fallback
   */
  static parseBoolean(input: unknown, fallback?: boolean): Result<boolean> {
    if (typeof input === 'boolean') {
      return { success: true, data: input };
    }

    if (typeof input === 'string') {
      const normalized = input.toLowerCase().trim();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
        return { success: true, data: true };
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no') {
        return { success: true, data: false };
      }
    }

    if (typeof input === 'number') {
      return { success: true, data: input !== 0 };
    }

    if (fallback !== undefined) {
      return { success: true, data: fallback };
    }

    return {
      success: false,
      error: new ValidationError(`Cannot parse boolean from: ${input}`, 'INVALID_BOOLEAN')
    };
  }
}

/**
 * Type guard functions for core data interfaces
 */

// Basic type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Core data type guards
export function isTask(obj: unknown): obj is Task {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.id) &&
    isString(obj.description) &&
    isBoolean(obj.completed) &&
    isArray(obj.requirements) &&
    obj.requirements.every(isString) &&
    (obj.leverage === undefined || isString(obj.leverage)) &&
    (obj.details === undefined || (isArray(obj.details) && obj.details.every(isString))) &&
    (obj.subtasks === undefined || (isArray(obj.subtasks) && obj.subtasks.every(isTask)))
  );
}

export function isRequirementDetail(obj: unknown): obj is RequirementDetail {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.id) &&
    isString(obj.title) &&
    (obj.userStory === undefined || isString(obj.userStory)) &&
    isArray(obj.acceptanceCriteria) &&
    obj.acceptanceCriteria.every(isString)
  );
}

export function isCodeReuseCategory(obj: unknown): obj is CodeReuseCategory {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.title) &&
    isArray(obj.items) &&
    obj.items.every(isString)
  );
}

export function isSteeringStatus(obj: unknown): obj is SteeringStatus {
  if (!isObject(obj)) return false;
  
  return (
    isBoolean(obj.exists) &&
    isBoolean(obj.hasProduct) &&
    isBoolean(obj.hasTech) &&
    isBoolean(obj.hasStructure)
  );
}

export function isBug(obj: unknown): obj is Bug {
  if (!isObject(obj)) return false;
  
  const validStatuses = ['reported', 'analyzing', 'fixing', 'fixed', 'verifying', 'resolved'] as const;
  
  return (
    isString(obj.name) &&
    isString(obj.displayName) &&
    isString(obj.status) &&
    validStatuses.includes(obj.status as typeof validStatuses[number]) &&
    (obj.lastModified === undefined || isDate(obj.lastModified))
  );
}

export function isSpec(obj: unknown): obj is Spec {
  if (!isObject(obj)) return false;
  
  const validStatuses = ['not-started', 'requirements', 'design', 'tasks', 'in-progress', 'completed'] as const;
  
  return (
    isString(obj.name) &&
    isString(obj.displayName) &&
    isString(obj.status) &&
    validStatuses.includes(obj.status as typeof validStatuses[number]) &&
    (obj.lastModified === undefined || isDate(obj.lastModified))
  );
}

export function isProject(obj: unknown): obj is Project {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.path) &&
    isString(obj.name) &&
    isNumber(obj.level) &&
    isBoolean(obj.hasActiveSession) &&
    isArray(obj.specs) &&
    obj.specs.every(isSpec) &&
    (obj.bugs === undefined || (isArray(obj.bugs) && obj.bugs.every(isBug))) &&
    (obj.steeringStatus === undefined || isSteeringStatus(obj.steeringStatus))
  );
}

export function isTunnelStatus(obj: unknown): obj is TunnelStatus {
  if (!isObject(obj)) return false;
  
  return (
    isBoolean(obj.active) &&
    (obj.url === undefined || obj.url === null || isString(obj.url)) &&
    (obj.port === undefined || isNumber(obj.port)) &&
    (obj.startedAt === undefined || isDate(obj.startedAt))
  );
}

/**
 * WebSocket message type guards with enhanced validation
 */
export function isWebSocketMessage(obj: unknown): obj is WebSocketMessage {
  if (!isObject(obj)) return false;
  
  const validTypes = [
    'initial',
    'update', 
    'bug-update',
    'steering-update',
    'error',
    'tunnel:started',
    'tunnel:stopped',
    'tunnel:metrics:updated',
    'tunnel:visitor:new'
  ] as const;
  
  return isString(obj.type) && validTypes.includes(obj.type as typeof validTypes[number]) && 'data' in obj;
}

export function isInitialData(obj: unknown): obj is InitialData {
  if (!isObject(obj)) return false;
  
  return (
    isArray(obj.specs) &&
    obj.specs.every(isSpec) &&
    (obj.bugs === undefined || (isArray(obj.bugs) && obj.bugs.every(isBug))) &&
    isTunnelStatus(obj.tunnelStatus)
  );
}

export function isUpdateData(obj: unknown): obj is UpdateData {
  if (!isObject(obj)) return false;
  
  return (
    isArray(obj.projects) &&
    obj.projects.every(isProject) &&
    isNumber(obj.timestamp) &&
    (obj.changedFiles === undefined || (isArray(obj.changedFiles) && obj.changedFiles.every(isString)))
  );
}

export function isErrorData(obj: unknown): obj is ErrorData {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.message) &&
    (obj.code === undefined || isString(obj.code)) &&
    (obj.details === undefined || isObject(obj.details))
  );
}

/**
 * Application state type guards
 */
export function isActiveSession(obj: unknown): obj is ActiveSession {
  if (!isObject(obj)) return false;
  
  const validTypes = ['spec', 'bug'] as const;
  
  return (
    isString(obj.type) &&
    validTypes.includes(obj.type as typeof validTypes[number]) &&
    isString(obj.projectPath) &&
    (obj.specName === undefined || isString(obj.specName)) &&
    (obj.bugName === undefined || isString(obj.bugName)) &&
    (obj.currentTaskId === undefined || isString(obj.currentTaskId)) &&
    (obj.totalTasks === undefined || isNumber(obj.totalTasks)) &&
    (obj.progress === undefined || isNumber(obj.progress)) &&
    (obj.projectColorValue === undefined || isString(obj.projectColorValue))
  );
}

export function isMarkdownPreviewState(obj: unknown): obj is MarkdownPreviewState {
  if (!isObject(obj)) return false;
  
  return (
    isBoolean(obj.show) &&
    isString(obj.title) &&
    isString(obj.content) &&
    isString(obj.rawContent) &&
    isBoolean(obj.loading)
  );
}

export function isGroupedProjectsCache(obj: unknown): obj is GroupedProjectsCache {
  if (!isObject(obj)) return false;
  
  return (
    isNumber(obj.projectsCount) &&
    isString(obj.projectsHash) &&
    isArray(obj.data) &&
    obj.data.every(isProject)
  );
}

export function isProjectTabData(obj: unknown): obj is ProjectTabData {
  if (!isObject(obj)) return false;
  
  return (
    isString(obj.path) &&
    isString(obj.name) &&
    isNumber(obj.level) &&
    isBoolean(obj.hasActiveSession) &&
    isString(obj.colorValue) &&
    isString(obj.colorPrimary) &&
    isBoolean(obj.isNextTopLevel) &&
    isBoolean(obj.isPrevNested) &&
    isArray(obj.specs) &&
    obj.specs.every(isSpec) &&
    isArray(obj.bugs) &&
    obj.bugs.every(isBug)
  );
}

/**
 * Safe message validation for WebSocket communication
 * Leverages error handling patterns from parser.ts
 */
export class WebSocketMessageValidator {
  /**
   * Validate and parse incoming WebSocket message with error recovery
   */
  static validateMessage(rawMessage: unknown): Result<WebSocketMessage, WebSocketValidationError> {
    try {
      // First check if it's a valid object
      if (!isObject(rawMessage)) {
        return {
          success: false,
          error: new WebSocketValidationError(
            'Message is not an object',
            'unknown',
            rawMessage
          )
        };
      }

      // Check if it has the basic WebSocket message structure
      if (!isWebSocketMessage(rawMessage)) {
        return {
          success: false,
          error: new WebSocketValidationError(
            'Invalid WebSocket message structure',
            (rawMessage as { type?: unknown }).type ? String((rawMessage as { type?: unknown }).type) : 'unknown',
            rawMessage
          )
        };
      }

      // Type-specific validation
      const result = this.validateMessageData(rawMessage);
      if (!result.success) {
        const error = result as { success: false; error: ValidationError };
        return {
          success: false,
          error: new WebSocketValidationError(
            `Invalid message data: ${error.error.message}`,
            rawMessage.type,
            rawMessage
          )
        };
      }

      return { success: true, data: rawMessage };
    } catch (error) {
      return {
        success: false,
        error: new WebSocketValidationError(
          `Message validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'validation_error',
          rawMessage
        )
      };
    }
  }

  /**
   * Validate message data based on message type
   */
  private static validateMessageData(message: WebSocketMessage): Result<void> {
    switch (message.type) {
      case 'initial':
        if (!isInitialData(message.data)) {
          return {
            success: false,
            error: new ValidationError('Invalid initial data structure', 'INVALID_INITIAL_DATA')
          };
        }
        break;

      case 'update':
      case 'bug-update':
        if (!isUpdateData(message.data)) {
          return {
            success: false,
            error: new ValidationError('Invalid update data structure', 'INVALID_UPDATE_DATA')
          };
        }
        break;

      case 'steering-update':
        if (!isSteeringStatus(message.data)) {
          return {
            success: false,
            error: new ValidationError('Invalid steering status structure', 'INVALID_STEERING_STATUS')
          };
        }
        break;

      case 'error':
        if (!isErrorData(message.data)) {
          return {
            success: false,
            error: new ValidationError('Invalid error data structure', 'INVALID_ERROR_DATA')
          };
        }
        break;

      case 'tunnel:started':
      case 'tunnel:stopped':
      case 'tunnel:metrics:updated':
      case 'tunnel:visitor:new':
        // Tunnel messages have flexible data structures
        if (!isObject(message.data)) {
          return {
            success: false,
            error: new ValidationError('Invalid tunnel data structure', 'INVALID_TUNNEL_DATA')
          };
        }
        break;

      case 'project-update':
      case 'active-sessions-update':
      case 'git-update':
        // These messages have flexible data structures for now
        // TODO: Add proper validation for these message types
        if (message.data === undefined && message.type !== 'git-update') {
          return {
            success: false,
            error: new ValidationError('Missing data in update message', 'MISSING_UPDATE_DATA')
          };
        }
        break;

      default:
        return {
          success: false,
          error: new ValidationError(`Unknown message type: ${(message as { type: string }).type}`, 'UNKNOWN_MESSAGE_TYPE')
        };
    }

    return { success: true, data: undefined };
  }

  /**
   * Safe message parsing with automatic error recovery
   */
  static safeParseMessage(messageString: string): Result<WebSocketMessage, WebSocketValidationError> {
    // First try to parse JSON
    const jsonResult = SafeParser.parseJSON(messageString);
    if (!jsonResult.success) {
      const error = jsonResult as { success: false; error: ValidationError };
      return {
        success: false,
        error: new WebSocketValidationError(
          `Failed to parse message JSON: ${error.error.message}`,
          'json_parse_error'
        )
      };
    }

    // Then validate the message structure
    return this.validateMessage(jsonResult.data);
  }
}

/**
 * Utility functions for creating Result types
 */
export const ResultUtils = {
  /**
   * Create a success result
   */
  success<T>(data: T): Result<T> {
    return { success: true, data };
  },

  /**
   * Create an error result
   */
  error<T>(error: ValidationError): Result<T> {
    return { success: false, error };
  },

  /**
   * Transform a Result's data
   */
  map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
    if (result.success) {
      try {
        return this.success(fn(result.data));
      } catch (error) {
        return this.error(new ValidationError(
          `Transform function failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'TRANSFORM_ERROR'
        ));
      }
    }
    return { success: false, error: (result as { success: false; error: ValidationError }).error };
  },

  /**
   * Chain Result operations
   */
  flatMap<T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> {
    if (result.success) {
      try {
        return fn(result.data);
      } catch (error) {
        return this.error(new ValidationError(
          `FlatMap function failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'FLATMAP_ERROR'
        ));
      }
    }
    return { success: false, error: (result as { success: false; error: ValidationError }).error };
  },

  /**
   * Get data from Result or throw error
   */
  unwrap<T>(result: Result<T>): T {
    if (result.success) {
      return result.data;
    }
    throw (result as { success: false; error: ValidationError }).error;
  },

  /**
   * Get data from Result or return default value
   */
  unwrapOr<T>(result: Result<T>, defaultValue: T): T {
    return result.success ? result.data : defaultValue;
  },

  /**
   * Combine multiple Results into one
   */
  combine<T>(results: Result<T>[]): Result<T[]> {
    const data: T[] = [];
    for (const result of results) {
      if (!result.success) {
        return { success: false, error: (result as { success: false; error: ValidationError }).error };
      }
      data.push(result.data);
    }
    return this.success(data);
  }
};

/**
 * Export all validation utilities
 */
export const ValidationUtils = {
  SafeParser,
  WebSocketMessageValidator,
  ResultUtils,
  ValidationError,
  WebSocketValidationError,
  
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDate,
  isTask,
  isRequirementDetail,
  isCodeReuseCategory,
  isSteeringStatus,
  isBug,
  isSpec,
  isProject,
  isTunnelStatus,
  isWebSocketMessage,
  isInitialData,
  isUpdateData,
  isErrorData,
  isActiveSession,
  isMarkdownPreviewState,
  isGroupedProjectsCache,
  isProjectTabData
};