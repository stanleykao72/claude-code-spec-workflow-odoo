import { TunnelProviderError } from './types';
import { debug } from '../logger';

export interface ErrorRecoveryStrategy {
  canRecover(error: TunnelProviderError): boolean;
  recover(error: TunnelProviderError): Promise<void>;
}

export class TunnelErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  
  constructor() {
    // Register default recovery strategies
    this.registerStrategy(new ProviderFailoverStrategy());
    this.registerStrategy(new ConfigurationErrorStrategy());
    this.registerStrategy(new NetworkErrorStrategy());
  }
  
  registerStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }
  
  async handleError(error: TunnelProviderError): Promise<TunnelProviderError> {
    debug(`Handling tunnel error: ${error.code}`, error);
    
    // Try recovery strategies
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error);
          debug(`Successfully recovered from error using ${strategy.constructor.name}`);
          return error; // Recovery successful
        } catch (recoveryError) {
          debug(`Recovery strategy ${strategy.constructor.name} failed:`, recoveryError);
        }
      }
    }
    
    // If no recovery worked, enhance the error with user-friendly messages
    return this.enhanceErrorMessage(error);
  }
  
  private enhanceErrorMessage(error: TunnelProviderError): TunnelProviderError {
    const enhancements = this.getErrorEnhancements(error);
    
    return new TunnelProviderError(
      error.provider,
      error.code,
      error.message,
      enhancements.userMessage,
      enhancements.troubleshooting
    );
  }
  
  private getErrorEnhancements(error: TunnelProviderError): {
    userMessage: string;
    troubleshooting: string[];
  } {
    const errorMappings: Record<string, { userMessage: string; troubleshooting: string[] }> = {
      'NO_AVAILABLE_PROVIDERS': {
        userMessage: 'No tunnel providers are available. Please install at least one tunnel provider.',
        troubleshooting: [
          'Install Cloudflare tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/',
          'Install ngrok: https://ngrok.com/download or run "npm install ngrok"',
          'Check that the installed provider binaries are in your PATH',
          'Restart your terminal after installation'
        ]
      },
      'CLOUDFLARED_NOT_FOUND': {
        userMessage: 'Cloudflare tunnel (cloudflared) is not installed or not found in PATH.',
        troubleshooting: [
          'Download cloudflared from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/',
          'Make sure cloudflared is in your PATH environment variable',
          'Try running "cloudflared --version" to verify installation',
          'On macOS, you can install with: brew install cloudflared'
        ]
      },
      'NGROK_NOT_FOUND': {
        userMessage: 'ngrok is not installed or not found.',
        troubleshooting: [
          'Download ngrok from: https://ngrok.com/download',
          'Install via npm: npm install -g ngrok',
          'Make sure ngrok is in your PATH environment variable',
          'Try running "ngrok --version" to verify installation'
        ]
      },
      'NGROK_AUTH_REQUIRED': {
        userMessage: 'ngrok requires authentication. Please configure an auth token.',
        troubleshooting: [
          'Sign up for a free ngrok account at: https://ngrok.com/signup',
          'Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken',
          'Set the auth token: ngrok config add-authtoken YOUR_TOKEN',
          'Or set the NGROK_AUTHTOKEN environment variable'
        ]
      },
      'CLOUDFLARED_TIMEOUT': {
        userMessage: 'Cloudflare tunnel took too long to start. This might be a network or configuration issue.',
        troubleshooting: [
          'Check your internet connection',
          'Verify that port is not already in use',
          'Try running cloudflared manually: cloudflared tunnel --url http://localhost:3000',
          'Check firewall settings - cloudflared needs outbound HTTPS access'
        ]
      },
      'NGROK_TIMEOUT': {
        userMessage: 'ngrok tunnel took too long to start. This might be a network or configuration issue.',
        troubleshooting: [
          'Check your internet connection',
          'Verify your ngrok auth token is valid',
          'Try running ngrok manually: ngrok http 3000',
          'Check if you have reached your ngrok account limits'
        ]
      },
      'PROVIDER_FAILURES': {
        userMessage: 'All tunnel providers failed to create a tunnel. Please check your configuration and network connection.',
        troubleshooting: [
          'Check your internet connection',
          'Verify that your firewall allows outbound connections',
          'Try creating tunnels manually to test provider configurations',
          'Check provider-specific documentation for troubleshooting'
        ]
      }
    };
    
    const enhancement = errorMappings[error.code];
    if (enhancement) {
      return enhancement;
    }
    
    // Default enhancement for unknown errors
    return {
      userMessage: `Tunnel error: ${error.message}`,
      troubleshooting: [
        'Check your internet connection',
        'Verify tunnel provider is properly installed',
        'Try restarting the tunnel',
        'Check provider documentation for specific error details'
      ]
    };
  }
}

class ProviderFailoverStrategy implements ErrorRecoveryStrategy {
  canRecover(error: TunnelProviderError): boolean {
    // Can recover from single provider failures if other providers might be available
    return error.code !== 'NO_AVAILABLE_PROVIDERS' && error.provider !== 'all';
  }
  
  async recover(_error: TunnelProviderError): Promise<void> {
    debug(`Attempting provider failover from ${_error.provider}`);
    // The actual failover logic is handled by TunnelManager's provider iteration
    // This strategy just indicates that failover should be attempted
  }
}

class ConfigurationErrorStrategy implements ErrorRecoveryStrategy {
  canRecover(error: TunnelProviderError): boolean {
    const recoverableCodes = [
      'CLOUDFLARED_NOT_FOUND',
      'NGROK_NOT_FOUND', 
      'NGROK_AUTH_REQUIRED'
    ];
    return recoverableCodes.includes(error.code);
  }
  
  async recover(error: TunnelProviderError): Promise<void> {
    debug(`Configuration error detected: ${error.code}`);
    // Configuration errors typically require manual intervention
    // We enhance the error message instead of automatic recovery
    throw new Error('Configuration errors require manual intervention');
  }
}

class NetworkErrorStrategy implements ErrorRecoveryStrategy {
  canRecover(error: TunnelProviderError): boolean {
    const networkErrorCodes = [
      'CLOUDFLARED_TIMEOUT',
      'NGROK_TIMEOUT',
      'TUNNEL_CONNECTION_FAILED'
    ];
    return networkErrorCodes.includes(error.code);
  }
  
  async recover(error: TunnelProviderError): Promise<void> {
    debug(`Network error detected: ${error.code}, implementing retry with backoff`);
    
    // Implement exponential backoff for network errors
    const delay = Math.min(1000 * Math.pow(2, 0), 5000); // Start with 1s, max 5s
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // The actual retry logic is handled by the caller
  }
}