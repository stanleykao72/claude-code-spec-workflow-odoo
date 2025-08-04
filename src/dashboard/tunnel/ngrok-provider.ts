import { spawn, ChildProcess, exec } from 'child_process';
import { TunnelProvider, TunnelInstance, ProviderOptions, HealthStatus, TunnelProviderError } from './types';
import { promisify } from 'util';
import * as fs from 'fs';

const execPromise = promisify(exec);
const fsPromises = fs.promises;

export interface NgrokConfig {
  authToken?: string;
  region?: string;
}

class NgrokTunnelInstance implements TunnelInstance {
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

export class NgrokProvider implements TunnelProvider {
  name = 'ngrok';
  
  constructor(private _config?: NgrokConfig) {}

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execPromise('which ngrok');
      return !!stdout.trim();
    } catch {
      try {
        // Check if ngrok is available in common locations
        const { stdout } = await execPromise('ngrok --version 2>/dev/null');
        return !!stdout;
      } catch {
        // Check if ngrok is in node_modules
        try {
          const ngrokPath = require.resolve('ngrok/bin/ngrok');
          const stats = await fsPromises.stat(ngrokPath);
          return stats.isFile();
        } catch {
          return false;
        }
      }
    }
  }

  private async getNgrokExecutable(): Promise<string> {
    // First try system ngrok
    try {
      const { stdout } = await execPromise('which ngrok');
      if (stdout.trim()) {
        return 'ngrok';
      }
    } catch {
      // Continue to other options
    }

    // Try to find ngrok in node_modules
    try {
      const ngrokPath = require.resolve('ngrok/bin/ngrok');
      const stats = await fsPromises.stat(ngrokPath);
      if (stats.isFile()) {
        return ngrokPath;
      }
    } catch {
      // Continue to error
    }

    throw new TunnelProviderError(
      this.name,
      'NGROK_NOT_FOUND',
      'ngrok not found. Please install it from https://ngrok.com/download or run: npm install ngrok'
    );
  }

  async validateConfig(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new TunnelProviderError(
        this.name,
        'NGROK_NOT_FOUND',
        'ngrok not found. Please install it from https://ngrok.com/download or run: npm install ngrok'
      );
    }

    // Check if auth token is configured
    if (!this._config?.authToken) {
      // Check if ngrok is already configured with an auth token
      try {
        const ngrokExe = await this.getNgrokExecutable();
        const { stdout } = await execPromise(`${ngrokExe} config check`);
        if (!stdout.includes('authtoken')) {
          throw new TunnelProviderError(
            this.name,
            'NGROK_AUTH_REQUIRED',
            'ngrok requires an auth token. Set NGROK_AUTHTOKEN environment variable or pass authToken in config'
          );
        }
      } catch (error) {
        if (error instanceof TunnelProviderError) {
          throw error;
        }
        // If config check fails, we'll try to proceed anyway
      }
    }
  }

  async createTunnel(port: number, options: ProviderOptions): Promise<TunnelInstance> {
    await this.validateConfig();

    const instance = new NgrokTunnelInstance(this.name, port);
    const ngrokExe = await this.getNgrokExecutable();
    
    return new Promise((resolve, reject) => {
      const args = ['http', port.toString()];
      
      // Add region if configured
      if (this._config?.region) {
        args.push('--region', this._config.region);
      }

      // Add auth token if provided
      if (this._config?.authToken) {
        args.push('--authtoken', this._config.authToken);
      }

      // Add metadata as headers if provided
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          args.push('--request-header-add', `X-Tunnel-${key}: ${value}`);
        }
      }

      // Use JSON output for easier parsing
      args.push('--log', 'stdout', '--log-format', 'json');

      const ngrok = spawn(ngrokExe, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { 
          ...process.env,
          ...(this._config?.authToken ? { NGROK_AUTHTOKEN: this._config.authToken } : {})
        }
      });

      instance.setProcess(ngrok);

      let urlFound = false;
      let errorOutput = '';

      const handleOutput = (data: Buffer) => {
        const output = data.toString();
        
        try {
          // Try to parse each line as JSON
          const lines = output.trim().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const log = JSON.parse(line);
              
              // Look for the tunnel URL in the JSON output
              if (log.url && log.url.startsWith('https://') && !urlFound) {
                urlFound = true;
                instance.setUrl(log.url);
                resolve(instance);
              }
              
              // Capture errors
              if (log.err || log.error) {
                errorOutput += JSON.stringify(log) + '\n';
              }
            } catch (_parseError) {
              // If not JSON, look for URL in plain text
              const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok(?:-free)?\.app/);
              if (urlMatch && !urlFound) {
                urlFound = true;
                instance.setUrl(urlMatch[0]);
                resolve(instance);
              }
            }
          }
        } catch (_parseError) {
          // If parsing fails, try regex fallback
          const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok(?:-free)?\.app/);
          if (urlMatch && !urlFound) {
            urlFound = true;
            instance.setUrl(urlMatch[0]);
            resolve(instance);
          }
        }

        // Capture any error messages
        if (output.toLowerCase().includes('error') || output.toLowerCase().includes('err')) {
          errorOutput += output;
        }
      };

      ngrok.stdout.on('data', handleOutput);
      ngrok.stderr.on('data', handleOutput);

      ngrok.on('error', (error) => {
        instance.status = 'error';
        const enhancedError = new TunnelProviderError(
          this.name,
          'NGROK_START_ERROR',
          `Failed to start ngrok: ${error.message}`,
          'Could not start ngrok tunnel. This might be a configuration or authentication issue.',
          [
            'Check that ngrok is properly installed',
            'Verify your ngrok auth token is set: ngrok config add-authtoken YOUR_TOKEN',
            'Try running ngrok manually: ngrok http ' + port,
            'Check your ngrok account limits and quota'
          ]
        );
        reject(enhancedError);
      });

      ngrok.on('exit', (code, signal) => {
        if (!urlFound) {
          instance.status = 'error';
          const enhancedError = new TunnelProviderError(
            this.name,
            'NGROK_EXIT_EARLY',
            `ngrok exited unexpectedly (code: ${code}, signal: ${signal}). ${errorOutput}`,
            'ngrok tunnel exited before establishing connection.',
            [
              'Check that your ngrok auth token is valid',
              'Verify the port is not already in use',
              'Check if you have reached your ngrok account limits',
              'Review ngrok logs for specific error details'
            ]
          );
          reject(enhancedError);
        }
      });

      // Timeout if URL not found within 30 seconds
      setTimeout(() => {
        if (!urlFound) {
          ngrok.kill();
          const enhancedError = new TunnelProviderError(
            this.name,
            'NGROK_TIMEOUT',
            'Timeout waiting for tunnel URL from ngrok',
            'ngrok tunnel took too long to start. This usually indicates an authentication or network issue.',
            [
              'Check your internet connection',
              'Verify your ngrok auth token is correct',
              'Try running ngrok manually to test: ngrok http ' + port,
              'Check if you have reached your ngrok account connection limits'
            ]
          );
          reject(enhancedError);
        }
      }, 30000);
    });
  }
}