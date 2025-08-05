import { CloudflareProvider } from '../src/dashboard/tunnel/cloudflare-provider';
import { TunnelProviderError } from '../src/dashboard/tunnel/types';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('CloudflareProvider', () => {
  let provider: CloudflareProvider;
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  let mockExec: jest.Mock;
  
  beforeEach(() => {
    provider = new CloudflareProvider();
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    mockExec = require('child_process').exec;
    jest.clearAllMocks();
  });
  
  describe('isAvailable', () => {
    test('should return true when cloudflared is found', async () => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which cloudflared')) {
          callback(null, { stdout: '/usr/local/bin/cloudflared' });
        } else {
          callback(null, { stdout: 'cloudflared version 2023.8.0' });
        }
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
    
    test('should return true when cloudflared is found via version check', async () => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which cloudflared')) {
          callback(new Error('not found'));
        } else if (cmd.includes('cloudflared --version')) {
          callback(null, { stdout: 'cloudflared version 2023.8.0' });
        }
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
    
    test('should return false when cloudflared is not found', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(new Error('not found'));
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });
  
  describe('validateConfig', () => {
    test('should pass when cloudflared is available', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: '/usr/local/bin/cloudflared' });
      });
      
      await expect(provider.validateConfig()).resolves.not.toThrow();
    });
    
    test('should throw when cloudflared is not available', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(new Error('not found'));
      });
      
      await expect(provider.validateConfig()).rejects.toThrow(TunnelProviderError);
      await expect(provider.validateConfig()).rejects.toThrow('cloudflared CLI not found');
    });
  });
  
  describe('createTunnel', () => {
    let mockProcess: any;
    
    beforeEach(() => {
      // Mock cloudflared as available
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: '/usr/local/bin/cloudflared' });
      });
      
      // Create mock process
      mockProcess = new EventEmitter();
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess as any);
    });
    
    test('should create tunnel successfully', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      // Simulate cloudflared output with tunnel URL
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from(
          '2023-08-15T12:00:00Z INF +------------------------------------------------------------+\n' +
          '2023-08-15T12:00:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |\n' +
          '2023-08-15T12:00:00Z INF |  https://test-tunnel-123.trycloudflare.com                |\n' +
          '2023-08-15T12:00:00Z INF +------------------------------------------------------------+'
        ));
      }, 100);
      
      const instance = await tunnelPromise;
      
      expect(instance.url).toBe('https://test-tunnel-123.trycloudflare.com');
      expect(instance.provider).toBe('cloudflare');
      expect(instance.status).toBe('active');
      expect(mockSpawn).toHaveBeenCalledWith('cloudflared', ['tunnel', '--url', 'http://localhost:3000'], expect.any(Object));
    });
    
    test('should add metadata headers when provided', async () => {
      const tunnelPromise = provider.createTunnel(3000, {
        metadata: {
          'project': 'test',
          'env': 'dev'
        }
      });
      
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from(
          'https://test-tunnel-123.trycloudflare.com'
        ));
      }, 100);
      
      await tunnelPromise;
      
      expect(mockSpawn).toHaveBeenCalledWith('cloudflared', [
        'tunnel',
        '--url',
        'http://localhost:3000',
        '--header',
        'X-Tunnel-project: test',
        '--header',
        'X-Tunnel-env: dev'
      ], expect.any(Object));
    });
    
    test('should handle cloudflared start error', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.emit('error', new Error('Failed to start'));
      }, 100);
      
      await expect(tunnelPromise).rejects.toThrow(TunnelProviderError);
      await expect(tunnelPromise).rejects.toThrow('Failed to start cloudflared');
    });
    
    test('should handle cloudflared exit without URL', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('Error: Something went wrong'));
        mockProcess.emit('exit', 1, null);
      }, 100);
      
      await expect(tunnelPromise).rejects.toThrow(TunnelProviderError);
      await expect(tunnelPromise).rejects.toThrow('cloudflared exited unexpectedly');
    });
  });
  
  describe('TunnelInstance', () => {
    let mockProcess: any;
    
    beforeEach(() => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(null, { stdout: '/usr/local/bin/cloudflared' });
      });
      
      mockProcess = new EventEmitter();
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess as any);
    });
    
    test('should have correct initial state', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      // Emit URL to resolve promise
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('https://test.trycloudflare.com'));
      }, 10);
      
      const instance = await tunnelPromise;
      
      expect(instance.status).toBe('active');
      expect(instance.provider).toBe('cloudflare');
      expect(instance.createdAt).toBeInstanceOf(Date);
      expect(instance.url).toBe('https://test.trycloudflare.com');
    });
    
    test('should handle close operation', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('https://test.trycloudflare.com'));
      }, 10);
      
      const instance = await tunnelPromise;
      
      // Start close and immediately emit exit
      const closePromise = instance.close();
      mockProcess.emit('exit', 0, null);
      
      await closePromise;
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(instance.status).toBe('closing');
    });
    
    test('should check health of active tunnel', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: true });
      
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('https://test.trycloudflare.com'));
      }, 10);
      
      const instance = await tunnelPromise;
      const health = await instance.getHealth();
      
      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('https://test.trycloudflare.com', expect.any(Object));
    });
  });
});