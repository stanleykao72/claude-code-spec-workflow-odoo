import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { 
  TunnelOptions, 
  TunnelInfo, 
  TunnelStatus, 
  TunnelProvider, 
  TunnelInstance,
  TunnelConfig,
  TunnelProviderError,
  HealthStatus,
  TunnelRecoveryOptions,
  TunnelHealth
} from './types';
import { AccessController } from './access-controller';
import { UsageTracker, AccessEvent } from './usage-tracker';
import { TunnelErrorHandler } from './error-handler';
import { debug } from '../logger';

const DEFAULT_CONFIG: TunnelConfig = {
  providers: {},
  defaults: {
    provider: 'auto',
    ttl: 60, // 1 hour
    maxViewers: 10
  },
  security: {
    requirePassword: false,
    allowedOrigins: ['*']
  }
};

const DEFAULT_RECOVERY_OPTIONS: TunnelRecoveryOptions = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  healthCheckInterval: 30000, // 30 seconds
  enableAutoReconnect: true
};

export class TunnelManager extends EventEmitter {
  private providers: Map<string, TunnelProvider> = new Map();
  private activeTunnel?: TunnelInstance;
  private activeInfo?: TunnelInfo;
  private config: TunnelConfig;
  private accessController: AccessController;
  private usageTracker?: UsageTracker;
  private tunnelId?: string;
  private errorHandler: TunnelErrorHandler;
  private recoveryOptions: TunnelRecoveryOptions;
  private healthCheckTimer?: ReturnType<typeof setInterval>;
  private tunnelHealth: TunnelHealth;
  private lastTunnelOptions?: TunnelOptions;
  private retryCount = 0;
  
  constructor(
    private _server: FastifyInstance,
    config?: Partial<TunnelConfig>,
    recoveryOptions?: Partial<TunnelRecoveryOptions>
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.recoveryOptions = { ...DEFAULT_RECOVERY_OPTIONS, ...recoveryOptions };
    this.accessController = new AccessController();
    this.errorHandler = new TunnelErrorHandler();
    this.tunnelHealth = {
      status: 'unhealthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 0
    };
  }
  
  registerProvider(provider: TunnelProvider): void {
    debug(`Registering tunnel provider: ${provider.name}`);
    this.providers.set(provider.name.toLowerCase(), provider);
  }
  
  async startTunnel(options: TunnelOptions = {}): Promise<TunnelInfo> {
    debug('Starting tunnel with options:', options);
    
    // Store options for potential reconnection
    this.lastTunnelOptions = options;
    this.retryCount = 0;
    
    return this.attemptTunnelStart(options);
  }
  
  private async attemptTunnelStart(options: TunnelOptions, isRetry = false): Promise<TunnelInfo> {
    try {
      // Stop any existing tunnel
      if (this.activeTunnel && !isRetry) {
        await this.stopTunnel();
      }
      
      const mergedOptions = {
        ...this.config.defaults,
        ...options
      };
      
      // Get available providers
      const availableProviders = await this.getAvailableProviders(mergedOptions.provider);
      
      if (availableProviders.length === 0) {
        const error = new TunnelProviderError(
          'all',
          'NO_AVAILABLE_PROVIDERS',
          'No tunnel providers are available. Please check your configuration.'
        );
        throw await this.errorHandler.handleError(error);
      }
      
      // Try providers with enhanced error handling
      let lastError: TunnelProviderError | undefined;
      
      for (const provider of availableProviders) {
        try {
          debug(`Attempting to create tunnel with provider: ${provider.name}`);
          
          const tunnelInfo = await this.createTunnelWithProvider(provider, mergedOptions);
          
          // Reset retry count on success
          this.retryCount = 0;
          
          // Start health monitoring
          this.startHealthMonitoring();
          
          return tunnelInfo;
          
        } catch (error) {
          const tunnelError = error instanceof TunnelProviderError 
            ? error 
            : new TunnelProviderError(provider.name, 'UNKNOWN_ERROR', error instanceof Error ? error.message : String(error));
          
          // Handle the error with recovery strategies
          lastError = await this.errorHandler.handleError(tunnelError);
          debug(`Provider ${provider.name} failed:`, lastError.message);
          
          // Continue to next provider
          if (provider !== availableProviders[availableProviders.length - 1]) {
            continue;
          }
        }
      }
      
      // All providers failed
      const finalError = new TunnelProviderError(
        'all',
        'PROVIDER_FAILURES',
        `All tunnel providers failed. Last error: ${lastError?.message}`,
        'Failed to create tunnel with any available provider.',
        ['Check your internet connection', 'Verify provider installations', 'Check provider configurations']
      );
      
      throw await this.errorHandler.handleError(finalError);
      
    } catch (error) {
      // If retry is enabled and we haven't exceeded max retries
      if (this.recoveryOptions.enableAutoReconnect && 
          this.retryCount < (this.recoveryOptions.maxRetries || 3) &&
          error instanceof TunnelProviderError) {
        
        this.retryCount++;
        debug(`Retrying tunnel creation (attempt ${this.retryCount}/${this.recoveryOptions.maxRetries})`);
        
        // Wait before retry with exponential backoff
        const baseDelay = this.recoveryOptions.retryDelay || 2000;
        const delay = baseDelay * Math.pow(2, this.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.emit('tunnel:retry', { attempt: this.retryCount, error: error.message });
        
        return this.attemptTunnelStart(options, true);
      }
      
      throw error;
    }
  }
  
  private async createTunnelWithProvider(provider: TunnelProvider, options: Record<string, unknown>): Promise<TunnelInfo> {
    // Get the server port
    const address = this._server.server.address();
    const port = (address && typeof address === 'object' && 'port' in address) ? (address as { port: number }).port : 3000;
    
    // Create tunnel
    this.activeTunnel = await provider.createTunnel(port, {
      ttl: typeof options.ttl === 'number' ? options.ttl : undefined,
      metadata: {
        projectName: 'claude-code-spec-workflow',
        readOnly: 'true'
      }
    });
    
    // Create tunnel info
    this.activeInfo = {
      url: this.activeTunnel.url,
      provider: provider.name,
      expiresAt: (typeof options.ttl === 'number') ? new Date(Date.now() + options.ttl * 60 * 1000) : undefined,
      passwordProtected: !!options.password
    };
    
    // Generate tunnel ID and set password if provided
    this.tunnelId = this.generateTunnelId();
    if (typeof options.password === 'string') {
      this.accessController.setPassword(this.tunnelId, options.password);
    }
    
    // Enable read-only mode for tunneled connections
    this.accessController = new AccessController({
      readOnlyMode: true,
      password: typeof options.password === 'string' ? options.password : undefined
    });
    
    // Initialize usage tracker if analytics is enabled
    if (options.analytics !== false) {
      this.usageTracker = new UsageTracker();
      
      // Forward usage events
      this.usageTracker.on('visitor:new', (data) => {
        this.emit('tunnel:visitor:new', data);
      });
      
      this.usageTracker.on('metrics:updated', (metrics) => {
        this.emit('tunnel:metrics:updated', metrics);
      });
      
      debug('Usage tracking enabled for tunnel');
    }
    
    // Initialize tunnel health
    this.tunnelHealth = {
      status: 'healthy',
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: Date.now()
    };
    
    // Emit tunnel started event
    this.emit('tunnel:started', this.activeInfo);
    
    debug(`Tunnel created successfully: ${this.activeTunnel.url}`);
    return this.activeInfo;
  }
  
  async stopTunnel(): Promise<void> {
    debug('Stopping tunnel');
    
    // Stop health monitoring
    this.stopHealthMonitoring();
    
    if (!this.activeTunnel) {
      debug('No active tunnel to stop');
      return;
    }
    
    try {
      await this.activeTunnel.close();
      
      // Emit tunnel stopped event with final metrics
      if (this.usageTracker) {
        const finalMetrics = this.usageTracker.getMetrics();
        this.emit('tunnel:stopped', { 
          info: this.activeInfo,
          metrics: finalMetrics 
        });
      } else {
        this.emit('tunnel:stopped', this.activeInfo);
      }
      
      this.activeTunnel = undefined;
      this.activeInfo = undefined;
      this.tunnelId = undefined;
      this.usageTracker = undefined;
      this.lastTunnelOptions = undefined;
      this.retryCount = 0;
      
      // Reset tunnel health
      this.tunnelHealth = {
        status: 'unhealthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        uptime: 0
      };
      
      debug('Tunnel stopped successfully');
    } catch (error) {
      debug('Error stopping tunnel:', error);
      throw error;
    }
  }
  
  getStatus(): TunnelStatus {
    if (!this.activeTunnel || !this.activeInfo) {
      return {
        active: false
      };
    }
    
    const status: TunnelStatus = {
      active: true,
      info: this.activeInfo
    };
    
    // Include viewer count if usage tracking is enabled
    if (this.usageTracker) {
      status.viewers = this.usageTracker.getActiveVisitorCount();
    }
    
    // Include health status
    if (this.tunnelHealth.status !== 'healthy') {
      status.error = `Tunnel is ${this.tunnelHealth.status} (${this.tunnelHealth.consecutiveFailures} consecutive failures)`;
    }
    
    return status;
  }
  
  private async getAvailableProviders(preferredProvider?: string): Promise<TunnelProvider[]> {
    const providers = Array.from(this.providers.values());
    
    if (!providers.length) {
      return [];
    }
    
    // Check provider availability
    const availabilityChecks = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        available: await provider.isAvailable().catch(() => false)
      }))
    );
    
    const availableProviders = availabilityChecks
      .filter(({ available }) => available)
      .map(({ provider }) => provider);
    
    // If specific provider requested, filter to just that one
    if (preferredProvider && preferredProvider !== 'auto') {
      const preferred = availableProviders.find(
        p => p.name.toLowerCase() === preferredProvider.toLowerCase()
      );
      return preferred ? [preferred] : [];
    }
    
    // Return all available providers for auto mode
    return availableProviders;
  }
  
  async checkTunnelHealth(): Promise<HealthStatus | null> {
    if (!this.activeTunnel) {
      return null;
    }
    
    try {
      const health = await this.activeTunnel.getHealth();
      
      // Update tunnel health tracking
      this.updateTunnelHealth(health);
      
      // Emit health check event
      this.emit('tunnel:health', health);
      
      // If unhealthy and auto-reconnect is enabled, attempt recovery
      if (!health.healthy && this.recoveryOptions.enableAutoReconnect && this.lastTunnelOptions) {
        debug('Tunnel unhealthy, attempting recovery');
        
        // Only attempt recovery if we haven't exceeded consecutive failures threshold
        if (this.tunnelHealth.consecutiveFailures < (this.recoveryOptions.maxRetries || 3)) {
          this.emit('tunnel:recovery:start', { health, attempt: this.tunnelHealth.consecutiveFailures + 1 });
          
          try {
            await this.stopTunnel();
            await this.startTunnel(this.lastTunnelOptions);
            this.emit('tunnel:recovery:success');
          } catch (error) {
            debug('Tunnel recovery failed:', error);
            this.emit('tunnel:recovery:failed', { error: error instanceof Error ? error.message : String(error) });
          }
        } else {
          debug('Max recovery attempts exceeded, stopping tunnel');
          this.emit('tunnel:recovery:exhausted');
          await this.stopTunnel();
        }
      }
      
      return health;
    } catch (error) {
      debug('Health check failed:', error);
      const healthStatus = {
        healthy: false,
        error: (error as Error).message
      };
      
      this.updateTunnelHealth(healthStatus);
      return healthStatus;
    }
  }
  
  private updateTunnelHealth(health: HealthStatus): void {
    this.tunnelHealth.lastCheck = new Date();
    
    if (health.healthy) {
      this.tunnelHealth.status = 'healthy';
      this.tunnelHealth.consecutiveFailures = 0;
    } else {
      this.tunnelHealth.consecutiveFailures++;
      
      if (this.tunnelHealth.consecutiveFailures >= 3) {
        this.tunnelHealth.status = 'unhealthy';
      } else {
        this.tunnelHealth.status = 'degraded';
      }
    }
  }
  
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    const interval = this.recoveryOptions.healthCheckInterval || 30000;
    this.healthCheckTimer = setInterval(() => {
      this.checkTunnelHealth().catch(error => {
        debug('Health check interval error:', error);
      });
    }, interval);
    
    debug(`Started health monitoring with ${interval}ms interval`);
  }
  
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      debug('Stopped health monitoring');
    }
  }
  
  getTunnelHealth(): TunnelHealth {
    return { ...this.tunnelHealth };
  }
  
  getRecoveryOptions(): TunnelRecoveryOptions {
    return { ...this.recoveryOptions };
  }
  
  updateRecoveryOptions(options: Partial<TunnelRecoveryOptions>): void {
    this.recoveryOptions = { ...this.recoveryOptions, ...options };
    
    // Restart health monitoring if interval changed
    if (options.healthCheckInterval && this.healthCheckTimer) {
      this.stopHealthMonitoring();
      this.startHealthMonitoring();
    }
  }
  
  private generateTunnelId(): string {
    return `tunnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getAccessController(): AccessController {
    return this.accessController;
  }
  
  getTunnelId(): string | undefined {
    return this.tunnelId;
  }
  
  /**
   * Track an access event for analytics
   */
  trackAccess(event: AccessEvent): void {
    if (!this.usageTracker) {
      return; // Analytics not enabled
    }
    
    this.usageTracker.trackAccess(event);
  }
  
  /**
   * Get current usage metrics
   */
  getUsageMetrics() {
    if (!this.usageTracker) {
      return null;
    }
    
    return this.usageTracker.getMetrics();
  }
  
  /**
   * Export usage metrics as JSON
   */
  exportUsageMetrics(): string | null {
    if (!this.usageTracker) {
      return null;
    }
    
    return this.usageTracker.exportMetrics();
  }
  
  /**
   * Clear usage metrics
   */
  clearUsageMetrics(): void {
    if (this.usageTracker) {
      this.usageTracker.clearMetrics();
    }
  }
  
  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return !!this.usageTracker;
  }
}