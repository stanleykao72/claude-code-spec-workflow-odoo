import * as ngrok from '@ngrok/ngrok';
import { TunnelProvider, TunnelInstance, ProviderOptions, HealthStatus, TunnelProviderError } from './types';
import { EventEmitter } from 'events';

export interface NgrokConfig {
  authToken?: string;
  region?: string;
}

class NgrokTunnelInstance extends EventEmitter implements TunnelInstance {
  public status: 'active' | 'closing' | 'error' = 'active';
  public createdAt: Date = new Date();
  public provider = 'ngrok';

  constructor(
    private _url: string,
    private listener: ngrok.Listener
  ) {
    super();
  }

  get url(): string {
    return this._url;
  }

  async close(): Promise<void> {
    if (this.status === 'closing') {
      return;
    }

    this.status = 'closing';
    
    try {
      await this.listener.close();
      this.status = 'closing';
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    if (this.status !== 'active') {
      return {
        healthy: false,
        error: `Tunnel is ${this.status}`
      };
    }

    return {
      healthy: true,
      latency: 0
    };
  }
}

export class NgrokProvider implements TunnelProvider {
  name = 'ngrok';
  
  constructor(private _config?: NgrokConfig) {
    // Config is used in validateConfig and createTunnel
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if we can import ngrok (it's already installed)
      const ngrokModule = await import('@ngrok/ngrok');
      return !!ngrokModule;
    } catch {
      return false;
    }
  }

  async validateConfig(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new TunnelProviderError(
        this.name,
        'NGROK_NOT_FOUND',
        '@ngrok/ngrok package not found. Please install it: npm install @ngrok/ngrok'
      );
    }

    // Try to read auth token from ngrok config file if not provided
    if (!this._config?.authToken && !process.env.NGROK_AUTHTOKEN) {
      try {
        const os = await import('os');
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const configPath = path.join(os.homedir(), 'Library/Application Support/ngrok/ngrok.yml');
        const configContent = await fs.readFile(configPath, 'utf8');
        
        // Simple regex to extract authtoken
        const authTokenMatch = configContent.match(/authtoken:\s*([^\s]+)/);
        if (authTokenMatch && authTokenMatch[1]) {
          process.env.NGROK_AUTHTOKEN = authTokenMatch[1];
        }
      } catch (error) {
        // Ignore error - ngrok might work without auth token
        console.log('Note: Running ngrok without auth token. Some features may be limited.');
      }
    }
  }

  async createTunnel(port: number, _options: ProviderOptions): Promise<TunnelInstance> {
    await this.validateConfig();

    try {
      // Configure ngrok with auth token if provided
      if (this._config?.authToken) {
        process.env.NGROK_AUTHTOKEN = this._config.authToken;
      }

      // Create tunnel using native ngrok library
      const listener = await ngrok.connect({
        addr: port,
        authtoken: this._config?.authToken || process.env.NGROK_AUTHTOKEN,
        region: this._config?.region,
        // Set a custom metadata
        metadata: JSON.stringify({
          name: 'claude-code-spec-workflow',
          readOnly: 'true'
        })
      });

      // Get the public URL
      const url = listener.url();
      
      if (!url) {
        throw new TunnelProviderError(
          this.name,
          'NGROK_NO_URL',
          'Failed to get tunnel URL from ngrok'
        );
      }

      const instance = new NgrokTunnelInstance(url, listener);
      
      return instance;
      
    } catch (error) {
      if (error instanceof TunnelProviderError) {
        throw error;
      }

      throw new TunnelProviderError(
        this.name,
        'NGROK_START_ERROR',
        `Failed to start ngrok: ${error instanceof Error ? error.message : String(error)}`,
        'Could not start ngrok tunnel. This might be a configuration or authentication issue.',
        [
          'Check your ngrok auth token',
          'Verify your internet connection',
          'Check if you have reached your ngrok account limits'
        ]
      );
    }
  }
}