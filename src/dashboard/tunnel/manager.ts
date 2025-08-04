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
  HealthStatus
} from './types';
import { AccessController } from './access-controller';
import { UsageTracker, AccessEvent } from './usage-tracker';
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

export class TunnelManager extends EventEmitter {
  private providers: Map<string, TunnelProvider> = new Map();
  private activeTunnel?: TunnelInstance;
  private activeInfo?: TunnelInfo;
  private config: TunnelConfig;
  private accessController: AccessController;
  private usageTracker?: UsageTracker;
  private tunnelId?: string;
  
  constructor(
    private server: FastifyInstance,
    config?: Partial<TunnelConfig>
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.accessController = new AccessController();
  }
  
  registerProvider(provider: TunnelProvider): void {
    debug(`Registering tunnel provider: ${provider.name}`);
    this.providers.set(provider.name.toLowerCase(), provider);
  }
  
  async startTunnel(options: TunnelOptions = {}): Promise<TunnelInfo> {
    debug('Starting tunnel with options:', options);
    
    // Stop any existing tunnel
    if (this.activeTunnel) {
      await this.stopTunnel();
    }
    
    const mergedOptions = {
      ...this.config.defaults,
      ...options
    };
    
    // Get available providers
    const availableProviders = await this.getAvailableProviders(mergedOptions.provider);
    
    if (availableProviders.length === 0) {
      throw new TunnelProviderError(
        'all',
        'NO_AVAILABLE_PROVIDERS',
        'No tunnel providers are available. Please check your configuration.'
      );
    }
    
    // Try providers with fallback
    let lastError: Error | undefined;
    for (const provider of availableProviders) {
      try {
        debug(`Attempting to create tunnel with provider: ${provider.name}`);
        
        // Get the server port
        const address = this.server.server.address();
        const port = (address && typeof address === 'object' && 'port' in address) ? address.port : 3000;
        
        // Create tunnel
        this.activeTunnel = await provider.createTunnel(port, {
          ttl: mergedOptions.ttl,
          metadata: {
            projectName: 'claude-code-spec-workflow',
            readOnly: 'true'
          }
        });
        
        // Create tunnel info
        this.activeInfo = {
          url: this.activeTunnel.url,
          provider: provider.name,
          expiresAt: mergedOptions.ttl ? new Date(Date.now() + mergedOptions.ttl * 60 * 1000) : undefined,
          passwordProtected: !!mergedOptions.password
        };
        
        // Generate tunnel ID and set password if provided
        this.tunnelId = this.generateTunnelId();
        if (mergedOptions.password) {
          this.accessController.setPassword(this.tunnelId, mergedOptions.password);
        }
        
        // Enable read-only mode for tunneled connections
        this.accessController = new AccessController({
          readOnlyMode: true,
          password: mergedOptions.password
        });
        
        // Initialize usage tracker if analytics is enabled
        if (mergedOptions.analytics !== false) {
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
        
        // Emit tunnel started event
        this.emit('tunnel:started', this.activeInfo);
        
        debug(`Tunnel created successfully: ${this.activeTunnel.url}`);
        return this.activeInfo;
        
      } catch (error) {
        lastError = error as Error;
        debug(`Provider ${provider.name} failed:`, error);
        
        // Continue to next provider
        if (provider !== availableProviders[availableProviders.length - 1]) {
          continue;
        }
      }
    }
    
    // All providers failed
    throw new TunnelProviderError(
      'all',
      'PROVIDER_FAILURES',
      `All tunnel providers failed. Last error: ${lastError?.message}`
    );
  }
  
  async stopTunnel(): Promise<void> {
    debug('Stopping tunnel');
    
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
      
      // Emit health check event
      this.emit('tunnel:health', health);
      
      // If unhealthy, consider restarting
      if (!health.healthy && this.activeInfo) {
        debug('Tunnel unhealthy, attempting restart');
        const options = this.getLastTunnelOptions();
        await this.stopTunnel();
        await this.startTunnel(options);
      }
      
      return health;
    } catch (error) {
      debug('Health check failed:', error);
      return {
        healthy: false,
        error: (error as Error).message
      };
    }
  }
  
  private getLastTunnelOptions(): TunnelOptions {
    // TODO: Store and retrieve the last used tunnel options
    return {};
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