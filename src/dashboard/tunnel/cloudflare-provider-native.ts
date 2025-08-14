import { TunnelProvider, TunnelInstance, ProviderOptions, HealthStatus, TunnelProviderError } from './types';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';

export interface CloudflareConfig {
  accountId?: string;
  tunnelName?: string;
}

class CloudflareTunnelInstance extends EventEmitter implements TunnelInstance {
  public status: 'active' | 'closing' | 'error' = 'active';
  public createdAt: Date = new Date();
  public provider = 'cloudflare';
  private process?: ChildProcess;

  constructor(
    private _url: string
  ) {
    super();
  }

  get url(): string {
    return this._url;
  }

  setProcess(process: ChildProcess): void {
    this.process = process;
  }

  async close(): Promise<void> {
    if (this.status === 'closing') {
      return;
    }

    this.status = 'closing';
    
    if (this.process) {
      const proc = this.process;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          proc.kill('SIGKILL');
          resolve();
        }, 5000);

        proc.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        proc.kill('SIGTERM');
      });
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

export class CloudflareProvider implements TunnelProvider {
  name = 'cloudflare';
  
  constructor(private _config?: CloudflareConfig) {}

  async isAvailable(): Promise<boolean> {
    // For now, we'll use the cloudflared CLI approach since the npm package
    // requires setup and domain configuration
    // The cloudflared-tunnel package requires a one-time setup which is too complex
    // for a simple tunnel use case
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      
      const { stdout } = await execPromise('which cloudflared');
      return !!stdout.trim();
    } catch {
      return false;
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

  async createTunnel(port: number, _options: ProviderOptions): Promise<TunnelInstance> {
    await this.validateConfig();

    return new Promise((resolve, reject) => {
      // Use cloudflared CLI for simplicity
      // The npm packages require complex setup with domains
      const args = ['tunnel', '--url', `http://localhost:${port}`];
      
      const cloudflared = spawn('cloudflared', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let urlFound = false;
      let errorOutput = '';

      const handleOutput = (data: Buffer) => {
        const output = data.toString();
        
        // Look for the tunnel URL in the output
        const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !urlFound) {
          urlFound = true;
          const url = urlMatch[0];
          // Create new instance with URL
          const tunnelInstance = new CloudflareTunnelInstance(url);
          tunnelInstance.setProcess(cloudflared);
          resolve(tunnelInstance);
        }

        // Capture any error messages
        if (output.toLowerCase().includes('error')) {
          errorOutput += output;
        }
      };

      cloudflared.stdout.on('data', handleOutput);
      cloudflared.stderr.on('data', handleOutput);

      cloudflared.on('error', (error) => {
        reject(new TunnelProviderError(
          this.name,
          'CLOUDFLARED_START_ERROR',
          `Failed to start cloudflared: ${error.message}`,
          'Could not start Cloudflare tunnel.',
          [
            'Check that cloudflared is properly installed',
            'Verify your internet connection',
            'Try running: cloudflared tunnel --url http://localhost:' + port
          ]
        ));
      });

      cloudflared.on('exit', (code, signal) => {
        if (!urlFound) {
          reject(new TunnelProviderError(
            this.name,
            'CLOUDFLARED_EXIT_EARLY',
            `cloudflared exited unexpectedly (code: ${code}, signal: ${signal}). ${errorOutput}`,
            'Cloudflare tunnel exited before establishing connection.',
            [
              'Check that the port is not already in use',
              'Verify cloudflared has proper permissions',
              'Check your firewall settings'
            ]
          ));
        }
      });

      // Timeout if URL not found within 30 seconds
      setTimeout(() => {
        if (!urlFound) {
          cloudflared.kill();
          reject(new TunnelProviderError(
            this.name,
            'CLOUDFLARED_TIMEOUT',
            'Timeout waiting for tunnel URL from cloudflared',
            'Cloudflare tunnel took too long to start.',
            [
              'Check your internet connection',
              'Try running cloudflared manually'
            ]
          ));
        }
      }, 30000);
    });
  }
}