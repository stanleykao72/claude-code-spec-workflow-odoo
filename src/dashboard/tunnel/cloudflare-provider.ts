import { spawn, ChildProcess, exec } from 'child_process';
import { TunnelProvider, TunnelInstance, ProviderOptions, HealthStatus, TunnelProviderError } from './types';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface CloudflareConfig {
  accountId?: string;
  tunnelName?: string;
}

class CloudflareTunnelInstance implements TunnelInstance {
  public status: 'active' | 'closing' | 'error' = 'active';
  public createdAt: Date = new Date();
  private process: ChildProcess | null = null;
  private _url: string | null = null;
  private closing = false;

  constructor(
    public provider: string,
    private _port: number
  ) {}

  get url(): string {
    if (!this._url) {
      throw new Error('Tunnel URL not yet available');
    }
    return this._url;
  }

  setUrl(url: string): void {
    this._url = url;
  }

  setProcess(process: ChildProcess): void {
    this.process = process;
  }

  async close(): Promise<void> {
    if (this.closing || this.status === 'closing') {
      return;
    }

    this.closing = true;
    this.status = 'closing';

    if (this.process) {
      const process = this.process;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (process) {
            process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        process.once('exit', () => {
          clearTimeout(timeout);
          this.status = 'closing';
          resolve();
        });

        process.kill('SIGTERM');
      });
    }
  }

  async getHealth(): Promise<HealthStatus> {
    if (this.status !== 'active' || !this._url) {
      return {
        healthy: false,
        error: `Tunnel is ${this.status}`
      };
    }

    try {
      const start = Date.now();
      
      // Simple health check - just verify the tunnel is still active
      // Full HTTP health checks would require additional dependencies
      const latency = Date.now() - start;
      
      return {
        healthy: this.status === 'active' && !!this._url,
        latency,
        error: this.status !== 'active' ? `Tunnel status: ${this.status}` : undefined
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }
}

export class CloudflareProvider implements TunnelProvider {
  name = 'cloudflare';
  
  constructor(private _config?: CloudflareConfig) {}

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execPromise('which cloudflared');
      return !!stdout.trim();
    } catch {
      try {
        // Check if cloudflared is available in common locations
        const { stdout } = await execPromise('cloudflared --version 2>/dev/null');
        return !!stdout;
      } catch {
        return false;
      }
    }
  }

  async validateConfig(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new TunnelProviderError(
        this.name,
        'CLOUDFLARED_NOT_FOUND',
        'cloudflared CLI not found. Please install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/'
      );
    }
  }

  async createTunnel(port: number, options: ProviderOptions): Promise<TunnelInstance> {
    await this.validateConfig();

    const instance = new CloudflareTunnelInstance(this.name, port);
    
    return new Promise((resolve, reject) => {
      const args = ['tunnel', '--url', `http://localhost:${port}`];
      
      // Add metadata if provided
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          args.push('--header', `X-Tunnel-${key}: ${value}`);
        }
      }

      const cloudflared = spawn('cloudflared', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      instance.setProcess(cloudflared);

      let urlFound = false;
      let errorOutput = '';

      const handleOutput = (data: Buffer) => {
        const output = data.toString();
        
        // Look for the tunnel URL in the output
        const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !urlFound) {
          urlFound = true;
          instance.setUrl(urlMatch[0]);
          resolve(instance);
        }

        // Capture any error messages
        if (output.toLowerCase().includes('error')) {
          errorOutput += output;
        }
      };

      cloudflared.stdout.on('data', handleOutput);
      cloudflared.stderr.on('data', handleOutput);

      cloudflared.on('error', (error) => {
        instance.status = 'error';
        const enhancedError = new TunnelProviderError(
          this.name,
          'CLOUDFLARED_START_ERROR',
          `Failed to start cloudflared: ${error.message}`,
          'Could not start Cloudflare tunnel. This might be a configuration or network issue.',
          [
            'Check that cloudflared is properly installed',
            'Verify your internet connection',
            'Try running cloudflared manually: cloudflared tunnel --url http://localhost:' + port,
            'Check firewall settings for outbound HTTPS access'
          ]
        );
        reject(enhancedError);
      });

      cloudflared.on('exit', (code, signal) => {
        if (!urlFound) {
          instance.status = 'error';
          const enhancedError = new TunnelProviderError(
            this.name,
            'CLOUDFLARED_EXIT_EARLY',
            `cloudflared exited unexpectedly (code: ${code}, signal: ${signal}). ${errorOutput}`,
            'Cloudflare tunnel exited before establishing connection.',
            [
              'Check that the port is not already in use',
              'Verify cloudflared has proper permissions',
              'Try a different port or check port conflicts',
              'Review cloudflared logs for specific error details'
            ]
          );
          reject(enhancedError);
        }
      });

      // Timeout if URL not found within 30 seconds
      setTimeout(() => {
        if (!urlFound) {
          cloudflared.kill();
          const enhancedError = new TunnelProviderError(
            this.name,
            'CLOUDFLARED_TIMEOUT',
            'Timeout waiting for tunnel URL from cloudflared',
            'Cloudflare tunnel took too long to start. This usually indicates a network or configuration issue.',
            [
              'Check your internet connection',
              'Verify firewall allows outbound HTTPS connections',
              'Try running cloudflared manually to test: cloudflared tunnel --url http://localhost:' + port,
              'Check if you have any proxy or VPN that might interfere'
            ]
          );
          reject(enhancedError);
        }
      }, 30000);
    });
  }
}