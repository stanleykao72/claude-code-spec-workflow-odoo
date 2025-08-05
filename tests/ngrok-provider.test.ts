import { NgrokProvider } from '../src/dashboard/tunnel/ngrok-provider';
import { TunnelProviderError } from '../src/dashboard/tunnel/types';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock fs.promises
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    stat: jest.fn()
  }
}));

describe('NgrokProvider', () => {
  let provider: NgrokProvider;
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  let mockExec: jest.Mock;
  let mockStat: jest.Mock;
  
  beforeEach(() => {
    provider = new NgrokProvider();
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    mockExec = require('child_process').exec;
    mockStat = fs.promises.stat as jest.Mock;
    jest.clearAllMocks();
  });
  
  describe('isAvailable', () => {
    test('should return true when ngrok is found in PATH', async () => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(null, { stdout: '/usr/local/bin/ngrok' });
        }
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
    
    test('should return true when ngrok is found via version check', async () => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(new Error('not found'));
        } else if (cmd.includes('ngrok --version')) {
          callback(null, { stdout: 'ngrok version 3.3.5' });
        }
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
    
    test('should return false when ngrok is not found', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(new Error('not found'));
      });
      
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });
  
  describe('validateConfig', () => {
    test('should pass when ngrok is available', async () => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(null, { stdout: '/usr/local/bin/ngrok' });
        } else if (cmd.includes('ngrok config check')) {
          callback(null, { stdout: 'Valid configuration with authtoken' });
        }
      });
      
      await expect(provider.validateConfig()).resolves.not.toThrow();
    });
    
    test('should pass when authToken is provided in config', async () => {
      provider = new NgrokProvider({ authToken: 'test-token' });
      
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(null, { stdout: '/usr/local/bin/ngrok' });
        }
      });
      
      await expect(provider.validateConfig()).resolves.not.toThrow();
    });
    
    test('should throw when ngrok is not available', async () => {
      mockExec.mockImplementation((_cmd: string, callback: Function) => {
        callback(new Error('not found'));
      });
      
      await expect(provider.validateConfig()).rejects.toThrow(TunnelProviderError);
      await expect(provider.validateConfig()).rejects.toThrow('ngrok not found');
    });
  });
  
  describe('createTunnel', () => {
    let mockProcess: any;
    
    beforeEach(() => {
      // Mock ngrok as available
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(null, { stdout: '/usr/local/bin/ngrok' });
        } else if (cmd.includes('ngrok config check')) {
          callback(null, { stdout: 'Valid configuration with authtoken' });
        }
      });
      
      // Create mock process
      mockProcess = new EventEmitter();
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess as any);
    });
    
    test('should create tunnel successfully with JSON output', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      // Simulate ngrok JSON output with tunnel URL
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(
          '{"url":"https://abc123.ngrok-free.app","proto":"https","addr":"http://localhost:3000"}\n'
        ));
      }, 100);
      
      const instance = await tunnelPromise;
      
      expect(instance.url).toBe('https://abc123.ngrok-free.app');
      expect(instance.provider).toBe('ngrok');
      expect(instance.status).toBe('active');
      expect(mockSpawn).toHaveBeenCalledWith(
        'ngrok',
        ['http', '3000', '--log', 'stdout', '--log-format', 'json'],
        expect.any(Object)
      );
    });
    
    test('should create tunnel with plain text fallback', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      // Simulate ngrok plain text output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(
          'Session Status                online\n' +
          'Version                       3.3.5\n' +
          'Forwarding                    https://def456.ngrok-free.app -> http://localhost:3000\n'
        ));
      }, 100);
      
      const instance = await tunnelPromise;
      
      expect(instance.url).toBe('https://def456.ngrok-free.app');
    });
    
    test('should add region when configured', async () => {
      provider = new NgrokProvider({ region: 'eu' });
      
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(
          '{"url":"https://test.ngrok.app"}\n'
        ));
      }, 100);
      
      await tunnelPromise;
      
      expect(mockSpawn).toHaveBeenCalledWith(
        'ngrok',
        expect.arrayContaining(['http', '3000', '--region', 'eu']),
        expect.any(Object)
      );
    });
    
    test('should add auth token when provided', async () => {
      provider = new NgrokProvider({ authToken: 'test-auth-token' });
      
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(
          '{"url":"https://test.ngrok.app"}\n'
        ));
      }, 100);
      
      await tunnelPromise;
      
      expect(mockSpawn).toHaveBeenCalledWith(
        'ngrok',
        expect.arrayContaining(['--authtoken', 'test-auth-token']),
        expect.any(Object)
      );
      
      // Check environment variable is also set
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({
            NGROK_AUTHTOKEN: 'test-auth-token'
          })
        })
      );
    });
    
    test('should add metadata headers when provided', async () => {
      const tunnelPromise = provider.createTunnel(3000, {
        metadata: {
          'project': 'test',
          'env': 'staging'
        }
      });
      
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(
          '{"url":"https://test.ngrok.app"}\n'
        ));
      }, 100);
      
      await tunnelPromise;
      
      expect(mockSpawn).toHaveBeenCalledWith(
        'ngrok',
        expect.arrayContaining([
          '--request-header-add',
          'X-Tunnel-project: test',
          '--request-header-add',
          'X-Tunnel-env: staging'
        ]),
        expect.any(Object)
      );
    });
    
    test('should handle ngrok start error', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.emit('error', new Error('Command not found'));
      }, 100);
      
      await expect(tunnelPromise).rejects.toThrow(TunnelProviderError);
      await expect(tunnelPromise).rejects.toThrow('Failed to start ngrok');
    });
    
    test('should handle ngrok exit without URL', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('{"err":"invalid authtoken"}\n'));
        mockProcess.emit('exit', 1, null);
      }, 100);
      
      await expect(tunnelPromise).rejects.toThrow(TunnelProviderError);
      await expect(tunnelPromise).rejects.toThrow('ngrok exited unexpectedly');
    });
  });
  
  describe('TunnelInstance', () => {
    let mockProcess: any;
    
    beforeEach(() => {
      mockExec.mockImplementation((cmd: string, callback: Function) => {
        if (cmd.includes('which ngrok')) {
          callback(null, { stdout: '/usr/local/bin/ngrok' });
        } else if (cmd.includes('ngrok config check')) {
          callback(null, { stdout: 'Valid configuration with authtoken' });
        }
      });
      
      mockProcess = new EventEmitter();
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();
      mockProcess.kill = jest.fn();
      
      mockSpawn.mockReturnValue(mockProcess as any);
    });
    
    test('should have correct initial state', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      // Use process.nextTick to ensure promise is created first
      process.nextTick(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"url":"https://test.ngrok.app"}\n'));
      });
      
      const instance = await tunnelPromise;
      
      expect(instance.status).toBe('active');
      expect(instance.provider).toBe('ngrok');
      expect(instance.createdAt).toBeInstanceOf(Date);
      expect(instance.url).toBe('https://test.ngrok.app');
    });
    
    test('should handle close operation', async () => {
      const tunnelPromise = provider.createTunnel(3000, {});
      
      process.nextTick(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"url":"https://test.ngrok.app"}\n'));
      });
      
      const instance = await tunnelPromise;
      
      // Start close and immediately emit exit
      const closePromise = instance.close();
      process.nextTick(() => {
        mockProcess.emit('exit', 0, null);
      });
      
      await closePromise;
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(instance.status).toBe('closing');
    });
    
    test('should check health of active tunnel', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({ ok: true });
      
      const tunnelPromise = provider.createTunnel(3000, {});
      
      process.nextTick(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"url":"https://test.ngrok.app"}\n'));
      });
      
      const instance = await tunnelPromise;
      const health = await instance.getHealth();
      
      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('https://test.ngrok.app', expect.any(Object));
    });
    
    test('should report unhealthy when health check fails', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const tunnelPromise = provider.createTunnel(3000, {});
      
      process.nextTick(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"url":"https://test.ngrok.app"}\n'));
      });
      
      const instance = await tunnelPromise;
      const health = await instance.getHealth();
      
      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Network error');
    });
  });
});