/**
 * Typed WebSocket client for the dashboard
 * Provides strongly typed message handling, automatic reconnection with exponential backoff,
 * and type guards for message validation.
 */

import type {
  WebSocketMessage,
  InitialDataMessage,
  UpdateDataMessage,
  BugUpdateMessage,
  SteeringUpdateMessage,
  ErrorDataMessage,
  TunnelStartedMessage,
  TunnelStoppedMessage,
  TunnelMetricsMessage,
  TunnelVisitorMessage
} from '../shared/dashboard.types';

import {
  isWebSocketMessage,
  isInitialDataMessage,
  isUpdateDataMessage,
  isBugUpdateMessage,
  isSteeringUpdateMessage,
  isErrorDataMessage,
  isTunnelStartedMessage,
  isTunnelStoppedMessage,
  isTunnelMetricsMessage,
  isTunnelVisitorMessage
} from '../shared/dashboard.types';

import {
  WebSocketMessageValidator,
  Result,
  ValidationError,
  WebSocketValidationError
} from './types/validation';

/**
 * Connection state for the WebSocket client
 */
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * WebSocket client options
 */
export interface WebSocketClientOptions {
  /** Maximum number of reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in milliseconds (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnection delay in milliseconds (default: 30000) */
  maxReconnectDelay?: number;
  /** Multiplier for exponential backoff (default: 1.5) */
  reconnectBackoffMultiplier?: number;
  /** Whether to automatically reconnect on close (default: true) */
  autoReconnect?: boolean;
  /** Connection timeout in milliseconds (default: 10000) */
  connectionTimeout?: number;
}

/**
 * Event handler types for WebSocket events
 */
export interface WebSocketEventHandlers {
  /** Called when connection is established */
  onOpen?: () => void;
  /** Called when connection is closed */
  onClose?: (_event: globalThis.CloseEvent) => void;
  /** Called when an error occurs */
  onError?: (_error: globalThis.Event) => void;
  /** Called when connection state changes */
  onStateChange?: (_state: ConnectionState) => void;
  /** Called when a reconnection attempt starts */
  onReconnectAttempt?: (_attempt: number, _delay: number) => void;
  /** Called when reconnection fails completely */
  onReconnectFailed?: (_totalAttempts: number) => void;
  /** Called for message handling errors */
  onMessageError?: (_error: Error, _rawMessage: unknown) => void;
}

/**
 * Typed message handlers for different message types
 */
export interface TypedMessageHandlers {
  /** Handle initial data messages */
  onInitial?: (_message: InitialDataMessage['data']) => void;
  /** Handle update messages */
  onUpdate?: (_message: UpdateDataMessage['data']) => void;
  /** Handle bug update messages */
  onBugUpdate?: (_message: BugUpdateMessage['data']) => void;
  /** Handle steering update messages */
  onSteeringUpdate?: (_message: SteeringUpdateMessage['data']) => void;
  /** Handle error messages */
  onError?: (_message: ErrorDataMessage['data']) => void;
  /** Handle tunnel started messages */
  onTunnelStarted?: (_message: TunnelStartedMessage['data']) => void;
  /** Handle tunnel stopped messages */
  onTunnelStopped?: (_message: TunnelStoppedMessage['data']) => void;
  /** Handle tunnel metrics messages */
  onTunnelMetrics?: (_message: TunnelMetricsMessage['data']) => void;
  /** Handle tunnel visitor messages */
  onTunnelVisitor?: (_message: TunnelVisitorMessage['data']) => void;
}

/**
 * Default WebSocket client options
 */
const DEFAULT_OPTIONS: Required<WebSocketClientOptions> = {
  maxReconnectAttempts: Infinity,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectBackoffMultiplier: 1.5,
  autoReconnect: true,
  connectionTimeout: 10000
};

/**
 * Type-safe WebSocket client with automatic reconnection and message validation
 */
export class TypedWebSocketClient {
  private ws: globalThis.WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectDelay = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<WebSocketClientOptions>;
  private url: string;
  private eventHandlers: WebSocketEventHandlers = {};
  private messageHandlers: TypedMessageHandlers = {};
  private isIntentionalClose = false;

  constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.reconnectDelay = this.options.initialReconnectDelay;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve();
        return;
      }

      if (this.connectionState === 'connecting') {
        // Already connecting, wait for result
        const onStateChange = (state: ConnectionState) => {
          if (state === 'connected') {
            this.removeEventHandler('onStateChange', onStateChange);
            resolve();
          } else if (state === 'disconnected') {
            this.removeEventHandler('onStateChange', onStateChange);
            reject(new Error('Connection failed'));
          }
        };
        this.addEventHandler('onStateChange', onStateChange);
        return;
      }

      this.isIntentionalClose = false;
      this.setConnectionState('connecting');

      try {
        this.ws = new globalThis.WebSocket(this.url);
        this.setupWebSocketEventHandlers(resolve, reject);
        this.startConnectionTimeout(reject);
      } catch (error) {
        this.setConnectionState('disconnected');
        reject(error instanceof Error ? error : new Error('Unknown connection error'));
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.isIntentionalClose = true;
    this.clearTimers();
    
    if (this.ws) {
      // Close with normal closure code
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.setConnectionState('disconnected');
  }

  /**
   * Send a typed message to the server
   */
  public send(message: WebSocketMessage): boolean {
    if (!this.ws || this.connectionState !== 'connected') {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.eventHandlers.onError?.(error as globalThis.Event);
      return false;
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if the client is connected
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Add event handler
   */
  public addEventHandler<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: NonNullable<WebSocketEventHandlers[K]>
  ): void {
    this.eventHandlers[event] = handler as WebSocketEventHandlers[K];
  }

  /**
   * Remove event handler
   */
  public removeEventHandler<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler?: WebSocketEventHandlers[K]
  ): void {
    if (!handler || this.eventHandlers[event] === handler) {
      delete this.eventHandlers[event];
    }
  }

  /**
   * Add typed message handler
   */
  public addMessageHandler<K extends keyof TypedMessageHandlers>(
    messageType: K,
    handler: NonNullable<TypedMessageHandlers[K]>
  ): void {
    this.messageHandlers[messageType] = handler as TypedMessageHandlers[K];
  }

  /**
   * Remove typed message handler
   */
  public removeMessageHandler<K extends keyof TypedMessageHandlers>(
    messageType: K
  ): void {
    delete this.messageHandlers[messageType];
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketEventHandlers(
    resolveConnect: () => void,
    rejectConnect: (_error: Error) => void
  ): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.clearConnectionTimer();
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = this.options.initialReconnectDelay;
      this.eventHandlers.onOpen?.();
      resolveConnect();
    };

    this.ws.onclose = (event) => {
      this.clearConnectionTimer();
      const wasConnected = this.connectionState === 'connected';
      this.setConnectionState('disconnected');
      this.ws = null;
      this.eventHandlers.onClose?.(event);

      if (!this.isIntentionalClose && this.options.autoReconnect && wasConnected) {
        this.scheduleReconnect();
      } else if (!wasConnected) {
        // Failed to connect initially
        rejectConnect(new Error(`WebSocket connection failed: ${event.code} ${event.reason}`));
      }
    };

    this.ws.onerror = (error) => {
      this.eventHandlers.onError?.(error);
      
      // If we're still connecting, this is a connection failure
      if (this.connectionState === 'connecting') {
        this.clearConnectionTimer();
        rejectConnect(new Error('WebSocket connection error'));
      }
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  /**
   * Handle incoming WebSocket messages with enhanced validation and error recovery
   */
  private handleMessage(event: globalThis.MessageEvent): void {
    // Use the enhanced WebSocket message validator with error recovery
    const validationResult = WebSocketMessageValidator.safeParseMessage(event.data);
    
    if (!validationResult.success) {
      const error = validationResult as { success: false; error: WebSocketValidationError };
      // Log validation error with details for debugging
      console.error('WebSocket message validation failed:', {
        error: error.error.message,
        code: error.error.code,
        messageType: error.error.messageType,
        timestamp: new Date().toISOString()
      });

      // Notify error handler with detailed error information
      this.eventHandlers.onMessageError?.(error.error, error.error.rawMessage);
      
      // Attempt graceful degradation based on error type
      this.handleValidationError(error.error);
      return;
    }

    // Message is valid, route to appropriate handlers
    try {
      this.routeTypedMessage(validationResult.data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown message routing error');
      console.error('Failed to route WebSocket message:', err.message);
      this.eventHandlers.onMessageError?.(err, validationResult.data);
    }
  }

  /**
   * Handle validation errors with graceful degradation
   */
  private handleValidationError(error: WebSocketValidationError): void {
    switch (error.code) {
      case 'JSON_PARSE_ERROR':
        // Critical error - message is not valid JSON
        console.warn('Received malformed JSON message, ignoring');
        break;
        
      case 'WEBSOCKET_VALIDATION_ERROR':
        // Message structure is invalid
        if (error.messageType !== 'unknown') {
          console.warn(`Received invalid ${error.messageType} message, attempting recovery`);
          // Could attempt to extract partial data here if needed
        } else {
          console.warn('Received message with unknown type, ignoring');
        }
        break;
        
      default:
        console.warn('Unknown validation error, attempting to continue:', error.message);
    }

    // Log error for debugging but don't disconnect unless it's critical
    if (error.code === 'JSON_PARSE_ERROR') {
      // JSON parse errors might indicate server issues
      console.warn('Multiple JSON parse errors may indicate server issues');
    }
  }

  /**
   * Route typed messages to appropriate handlers
   */
  private routeTypedMessage(message: WebSocketMessage): void {
    // Route to specific typed handlers based on message type
    if (isInitialDataMessage(message)) {
      this.messageHandlers.onInitial?.(message.data);
    } else if (isUpdateDataMessage(message)) {
      this.messageHandlers.onUpdate?.(message.data);
    } else if (isBugUpdateMessage(message)) {
      this.messageHandlers.onBugUpdate?.(message.data);
    } else if (isSteeringUpdateMessage(message)) {
      this.messageHandlers.onSteeringUpdate?.(message.data);
    } else if (isErrorDataMessage(message)) {
      this.messageHandlers.onError?.(message.data);
    } else if (isTunnelStartedMessage(message)) {
      this.messageHandlers.onTunnelStarted?.(message.data);
    } else if (isTunnelStoppedMessage(message)) {
      this.messageHandlers.onTunnelStopped?.(message.data);
    } else if (isTunnelMetricsMessage(message)) {
      this.messageHandlers.onTunnelMetrics?.(message.data);
    } else if (isTunnelVisitorMessage(message)) {
      this.messageHandlers.onTunnelVisitor?.(message.data);
    } else {
      console.warn('Received unknown message type:', (message as { type: string }).type);
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.options.maxReconnectAttempts}) reached`);
      this.eventHandlers.onReconnectFailed?.(this.reconnectAttempts);
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;
    
    const currentDelay = Math.min(this.reconnectDelay, this.options.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${currentDelay}ms (attempt ${this.reconnectAttempts})`);
    this.eventHandlers.onReconnectAttempt?.(this.reconnectAttempts, currentDelay);

    this.reconnectTimer = globalThis.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // Exponential backoff for next attempt
        this.reconnectDelay = Math.min(
          this.reconnectDelay * this.options.reconnectBackoffMultiplier,
          this.options.maxReconnectDelay
        );
        this.scheduleReconnect();
      });
    }, currentDelay);
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.eventHandlers.onStateChange?.(state);
    }
  }

  /**
   * Start connection timeout timer
   */
  private startConnectionTimeout(reject: (_error: Error) => void): void {
    this.connectionTimer = globalThis.setTimeout(() => {
      if (this.connectionState === 'connecting') {
        this.ws?.close();
        this.setConnectionState('disconnected');
        reject(new Error(`Connection timeout after ${this.options.connectionTimeout}ms`));
      }
    }, this.options.connectionTimeout);
  }

  /**
   * Clear connection timeout timer
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer !== null) {
      globalThis.clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearConnectionTimer();
    
    if (this.reconnectTimer !== null) {
      globalThis.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * Factory function to create a WebSocket client for the dashboard
 */
export function createDashboardWebSocketClient(options?: WebSocketClientOptions): TypedWebSocketClient {
  const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${globalThis.location.host}/ws`;
  
  return new TypedWebSocketClient(wsUrl, options);
}

/**
 * Utility function to create a WebSocket client with common dashboard message handlers
 */
export function createDashboardWebSocketClientWithHandlers(
  messageHandlers: TypedMessageHandlers,
  eventHandlers?: WebSocketEventHandlers,
  options?: WebSocketClientOptions
): TypedWebSocketClient {
  const client = createDashboardWebSocketClient(options);
  
  // Add message handlers
  Object.entries(messageHandlers).forEach(([type, handler]) => {
    if (handler) {
      client.addMessageHandler(type as keyof TypedMessageHandlers, handler);
    }
  });
  
  // Add event handlers
  if (eventHandlers) {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler) {
        client.addEventHandler(event as keyof WebSocketEventHandlers, handler);
      }
    });
  }
  
  return client;
}

/**
 * Type guard helpers for external use
 */
export {
  isWebSocketMessage,
  isInitialDataMessage,
  isUpdateDataMessage,
  isBugUpdateMessage,
  isSteeringUpdateMessage,
  isErrorDataMessage,
  isTunnelStartedMessage,
  isTunnelStoppedMessage,
  isTunnelMetricsMessage,
  isTunnelVisitorMessage
};

/**
 * Export connection state type for external use
 */
export type { ConnectionState };