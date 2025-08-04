export interface TunnelOptions {
  provider?: string; // Allow any provider name for extensibility
  password?: string;
  maxViewers?: number;
  ttl?: number; // Time to live in minutes
  analytics?: boolean;
}

export interface TunnelInfo {
  url: string;
  provider: string;
  expiresAt?: Date;
  passwordProtected: boolean;
}

export interface TunnelStatus {
  active: boolean;
  info?: TunnelInfo;
  viewers?: number;
  error?: string;
}

export interface TunnelProvider {
  name: string;
  
  isAvailable(): Promise<boolean>;
  
  createTunnel(
    port: number, 
    options: ProviderOptions
  ): Promise<TunnelInstance>;
  
  validateConfig(): Promise<void>;
}

export interface ProviderOptions {
  ttl?: number;
  metadata?: Record<string, string>;
}

export interface TunnelInstance {
  url: string;
  status: 'active' | 'closing' | 'error';
  provider: string;
  createdAt: Date;
  
  close(): Promise<void>;
  
  getHealth(): Promise<HealthStatus>;
}

export interface HealthStatus {
  healthy: boolean;
  latency?: number;
  error?: string;
}

export interface TunnelConfig {
  providers: {
    cloudflare?: {
      accountId?: string;
      tunnelName?: string;
    };
    ngrok?: {
      authToken?: string;
      region?: string;
    };
  };
  defaults: {
    provider: string; // Allow any provider name
    ttl: number; // minutes
    maxViewers: number;
  };
  security: {
    requirePassword: boolean;
    allowedOrigins: string[];
  };
}

export class TunnelProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'TunnelProviderError';
  }
}