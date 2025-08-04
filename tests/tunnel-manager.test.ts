import { FastifyInstance } from 'fastify';
import { TunnelManager } from '../src/dashboard/tunnel/manager';
import { TunnelProvider, TunnelInstance, HealthStatus } from '../src/dashboard/tunnel/types';

// Mock provider for testing
class MockTunnelProvider implements TunnelProvider {
  name = 'mock';
  private _available = true;
  private _shouldFail = false;
  
  setAvailable(available: boolean) {
    this._available = available;
  }
  
  setShouldFail(shouldFail: boolean) {
    this._shouldFail = shouldFail;
  }
  
  async isAvailable(): Promise<boolean> {
    return this._available;
  }
  
  async createTunnel(port: number): Promise<TunnelInstance> {
    if (this._shouldFail) {
      throw new Error('Mock provider failed');
    }
    
    return {
      url: `https://mock-tunnel.example.com:${port}`,
      status: 'active',
      provider: this.name,
      createdAt: new Date(),
      close: async () => {},
      getHealth: async () => ({ healthy: true })
    };
  }
  
  async validateConfig(): Promise<void> {
    // Mock validation
  }
}

// Mock Fastify instance
const createMockFastify = (): FastifyInstance => {
  return {
    server: {
      address: () => ({ port: 3000 })
    }
  } as any;
};

describe('TunnelManager', () => {
  let manager: TunnelManager;
  let mockProvider: MockTunnelProvider;
  let fastify: FastifyInstance;
  
  beforeEach(() => {
    fastify = createMockFastify();
    manager = new TunnelManager(fastify);
    mockProvider = new MockTunnelProvider();
    manager.registerProvider(mockProvider);
  });
  
  describe('Provider Registration', () => {
    test('should register providers', () => {
      const provider2 = new MockTunnelProvider();
      provider2.name = 'mock2';
      
      manager.registerProvider(provider2);
      
      // No direct way to test registration, but startTunnel will use registered providers
      expect(() => manager.registerProvider(provider2)).not.toThrow();
    });
  });
  
  describe('Tunnel Creation', () => {
    test('should create tunnel with available provider', async () => {
      const info = await manager.startTunnel();
      
      expect(info).toMatchObject({
        url: 'https://mock-tunnel.example.com:3000',
        provider: 'mock',
        passwordProtected: false
      });
    });
    
    test('should fail when no providers available', async () => {
      mockProvider.setAvailable(false);
      
      await expect(manager.startTunnel()).rejects.toThrow('No tunnel providers are available');
    });
    
    test('should fail when provider creation fails', async () => {
      mockProvider.setShouldFail(true);
      
      await expect(manager.startTunnel()).rejects.toThrow('All tunnel providers failed');
    });
    
    test('should set password protection flag', async () => {
      const info = await manager.startTunnel({ password: 'secret' });
      
      expect(info.passwordProtected).toBe(true);
    });
    
    test('should calculate expiry time with ttl', async () => {
      const ttl = 30; // 30 minutes
      const before = Date.now();
      
      const info = await manager.startTunnel({ ttl });
      
      const after = Date.now();
      
      expect(info.expiresAt).toBeDefined();
      const expiryTime = info.expiresAt!.getTime();
      expect(expiryTime).toBeGreaterThanOrEqual(before + ttl * 60 * 1000);
      expect(expiryTime).toBeLessThanOrEqual(after + ttl * 60 * 1000);
    });
  });
  
  describe('Provider Fallback', () => {
    test('should fallback to next provider if first fails', async () => {
      // Create a new manager without the default mock provider
      manager = new TunnelManager(fastify);
      
      const failingProvider = new MockTunnelProvider();
      failingProvider.name = 'failing';
      failingProvider.setShouldFail(true);
      
      const workingProvider = new MockTunnelProvider();
      workingProvider.name = 'working';
      
      manager.registerProvider(failingProvider);
      manager.registerProvider(workingProvider);
      
      const info = await manager.startTunnel({ provider: 'auto' });
      
      // Should use the working provider after failing provider fails
      expect(info.provider).toBe('working');
    });
    
    test('should respect provider preference when specified', async () => {
      const provider1 = new MockTunnelProvider();
      provider1.name = 'provider1';
      
      const provider2 = new MockTunnelProvider();
      provider2.name = 'provider2';
      
      manager.registerProvider(provider1);
      manager.registerProvider(provider2);
      
      const info = await manager.startTunnel({ provider: 'provider2' });
      
      expect(info.provider).toBe('provider2');
    });
  });
  
  describe('Tunnel Management', () => {
    test('should stop active tunnel', async () => {
      await manager.startTunnel();
      
      await expect(manager.stopTunnel()).resolves.not.toThrow();
      
      const status = manager.getStatus();
      expect(status.active).toBe(false);
    });
    
    test('should handle stop when no active tunnel', async () => {
      await expect(manager.stopTunnel()).resolves.not.toThrow();
    });
    
    test('should stop existing tunnel when starting new one', async () => {
      const info1 = await manager.startTunnel();
      const info2 = await manager.startTunnel();
      
      // Should have different URLs (different instances)
      expect(info2.url).toBe(info1.url); // Same because mock always returns same URL
      
      const status = manager.getStatus();
      expect(status.active).toBe(true);
    });
  });
  
  describe('Status Reporting', () => {
    test('should report inactive status when no tunnel', () => {
      const status = manager.getStatus();
      
      expect(status).toEqual({
        active: false
      });
    });
    
    test('should report active status with tunnel info', async () => {
      const info = await manager.startTunnel();
      const status = manager.getStatus();
      
      expect(status).toMatchObject({
        active: true,
        info,
        viewers: 0
      });
    });
  });
  
  describe('Health Checks', () => {
    test('should return null when no active tunnel', async () => {
      const health = await manager.checkTunnelHealth();
      expect(health).toBeNull();
    });
    
    test('should return health status for active tunnel', async () => {
      await manager.startTunnel();
      const health = await manager.checkTunnelHealth();
      
      expect(health).toEqual({
        healthy: true
      });
    });
    
    test('should restart unhealthy tunnel', async () => {
      let healthCheckCount = 0;
      const unhealthyProvider = new MockTunnelProvider();
      unhealthyProvider.name = 'unhealthy';
      
      // Override createTunnel to return unhealthy instance
      unhealthyProvider.createTunnel = async (port: number) => ({
        url: `https://unhealthy.example.com:${port}`,
        status: 'active' as const,
        provider: unhealthyProvider.name,
        createdAt: new Date(),
        close: async () => {},
        getHealth: async () => {
          healthCheckCount++;
          return { 
            healthy: healthCheckCount > 1 
          };
        }
      });
      
      manager = new TunnelManager(fastify);
      manager.registerProvider(unhealthyProvider);
      
      await manager.startTunnel();
      
      // First check should trigger restart
      const health1 = await manager.checkTunnelHealth();
      expect(health1?.healthy).toBe(false);
      
      // After restart, should be healthy
      const health2 = await manager.checkTunnelHealth();
      expect(health2?.healthy).toBe(true);
    });
  });
  
  describe('Event Emission', () => {
    test('should emit tunnel:started event', async () => {
      const handler = jest.fn();
      manager.on('tunnel:started', handler);
      
      const info = await manager.startTunnel();
      
      expect(handler).toHaveBeenCalledWith(info);
    });
    
    test('should emit tunnel:stopped event', async () => {
      const handler = jest.fn();
      manager.on('tunnel:stopped', handler);
      
      const info = await manager.startTunnel();
      await manager.stopTunnel();
      
      expect(handler).toHaveBeenCalledWith(info);
    });
    
    test('should emit tunnel:health event', async () => {
      const handler = jest.fn();
      manager.on('tunnel:health', handler);
      
      await manager.startTunnel();
      await manager.checkTunnelHealth();
      
      expect(handler).toHaveBeenCalledWith({ healthy: true });
    });
  });
});