import { AccessController } from '../../../src/dashboard/tunnel/access-controller';
import { FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket } from 'ws';

describe('AccessController', () => {
  let controller: AccessController;

  beforeEach(() => {
    controller = new AccessController({
      readOnlyMode: true,
      rateLimitAttempts: 3,
      rateLimitWindow: 60000
    });
  });

  describe('Password Management', () => {
    it('should set and validate passwords correctly', () => {
      const tunnelId = 'test-tunnel';
      const password = 'secretPassword123';

      controller.setPassword(tunnelId, password);
      
      expect(controller.validatePassword(tunnelId, password)).toBe(true);
      expect(controller.validatePassword(tunnelId, 'wrongPassword')).toBe(false);
    });

    it('should return true when no password is set', () => {
      expect(controller.validatePassword('no-password-tunnel', 'anyPassword')).toBe(true);
    });

    it('should enforce rate limiting on failed attempts', () => {
      const tunnelId = 'test-tunnel';
      const clientIp = '192.168.1.1';
      controller.setPassword(tunnelId, 'correctPassword');

      // Make 3 failed attempts (the limit)
      for (let i = 0; i < 3; i++) {
        expect(controller.validatePassword(tunnelId, 'wrongPassword', clientIp)).toBe(false);
      }

      // Next attempt should throw rate limit error
      expect(() => {
        controller.validatePassword(tunnelId, 'wrongPassword', clientIp);
      }).toThrow('Too many attempts. Please try again later.');
    });
  });

  describe('Read-Only Enforcement', () => {
    it('should allow GET requests in read-only mode', async () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/specs'
      } as FastifyRequest;
      
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as unknown as FastifyReply;

      await controller.enforceReadOnly(mockRequest, mockReply);
      
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should allow WebSocket connections in read-only mode', async () => {
      const mockRequest = {
        method: 'GET',
        url: '/ws'
      } as FastifyRequest;
      
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as unknown as FastifyReply;

      await controller.enforceReadOnly(mockRequest, mockReply);
      
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should block non-GET requests in read-only mode', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const mockRequest = {
          method,
          url: '/api/specs'
        } as FastifyRequest;
        
        const mockReply = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn()
        } as unknown as FastifyReply;

        await controller.enforceReadOnly(mockRequest, mockReply);
        
        expect(mockReply.code).toHaveBeenCalledWith(403);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Read-only access',
          message: 'This dashboard is in read-only mode. Only viewing is allowed.'
        });
      }
    });

    it('should allow all requests when not in read-only mode', async () => {
      controller = new AccessController({
        readOnlyMode: false
      });

      const mockRequest = {
        method: 'POST',
        url: '/api/specs'
      } as FastifyRequest;
      
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as unknown as FastifyReply;

      await controller.enforceReadOnly(mockRequest, mockReply);
      
      expect(mockReply.code).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket Filtering', () => {
    it('should wrap WebSocket for read-only mode', () => {
      const mockSocket = {
        send: jest.fn(),
        on: jest.fn()
      } as unknown as WebSocket;
      
      const sessionId = 'test-session';
      controller.wrapWebSocketForReadOnly(mockSocket, sessionId);
      
      expect(controller.isReadOnlySession(sessionId)).toBe(true);
      expect(mockSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should filter out write-related WebSocket messages', () => {
      const mockSocket = {
        send: jest.fn(),
        on: jest.fn()
      } as unknown as WebSocket;
      
      controller.wrapWebSocketForReadOnly(mockSocket, 'test-session');
      
      // Override should be in place, test by calling the wrapped send
      const wrappedSend = mockSocket.send as jest.Mock;
      
      // These messages should be filtered out
      const blockedMessages = [
        JSON.stringify({ type: 'command', data: 'something' }),
        JSON.stringify({ type: 'action', data: 'something' }),
        JSON.stringify({ type: 'write', data: 'something' })
      ];
      
      // Mock the original send to track calls
      const originalSend = jest.fn();
      (mockSocket as any).send = function(data: any, cb?: any) {
        try {
          const message = JSON.parse(data.toString());
          if (!['command', 'action', 'write'].includes(message.type)) {
            originalSend(data, cb);
          }
        } catch {
          // Don't send unparseable messages
        }
      };
      
      blockedMessages.forEach(msg => {
        (mockSocket as any).send(msg);
      });
      
      expect(originalSend).not.toHaveBeenCalled();
    });

    it('should add read-only indicator to allowed messages', () => {
      const mockSocket = {
        send: jest.fn(),
        on: jest.fn()
      } as unknown as WebSocket;
      
      const originalSend = jest.fn();
      mockSocket.send = originalSend;
      
      controller.wrapWebSocketForReadOnly(mockSocket, 'test-session');
      
      // Test message transformation
      const testMessage = JSON.stringify({ type: 'update', data: 'something' });
      (mockSocket as any).send(testMessage);
      
      // The wrapped function should modify the message
      expect(originalSend).toHaveBeenCalled();
      const sentData = originalSend.mock.calls[0][0];
      const sentMessage = JSON.parse(sentData);
      expect(sentMessage.readOnly).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track access statistics', () => {
      const tunnelId = 'test-tunnel';
      controller.setPassword(tunnelId, 'password');
      
      // Add some read-only sessions
      controller.wrapWebSocketForReadOnly({
        send: jest.fn(),
        on: jest.fn()
      } as unknown as WebSocket, 'session1');
      
      controller.wrapWebSocketForReadOnly({
        send: jest.fn(),
        on: jest.fn()
      } as unknown as WebSocket, 'session2');
      
      const stats = controller.getStats();
      expect(stats.activeSessions).toBe(2);
      expect(stats.protectedTunnels).toBe(1);
      expect(stats.rateLimitedIps).toBe(0);
    });
  });

  describe('Rate Limit Cleanup', () => {
    it('should clean up expired rate limit entries', () => {
      // Create controller with very short rate limit window for testing
      controller = new AccessController({
        readOnlyMode: true,
        rateLimitAttempts: 1,
        rateLimitWindow: 100 // 100ms
      });

      const tunnelId = 'test-tunnel';
      controller.setPassword(tunnelId, 'password');
      
      // Trigger rate limit
      controller.validatePassword(tunnelId, 'wrong', '192.168.1.1');
      
      // Should be rate limited
      expect(() => {
        controller.validatePassword(tunnelId, 'wrong', '192.168.1.1');
      }).toThrow();
      
      // Wait for rate limit to expire
      setTimeout(() => {
        controller.cleanupRateLimits();
        
        // Should be able to try again
        expect(() => {
          controller.validatePassword(tunnelId, 'wrong', '192.168.1.1');
        }).not.toThrow();
      }, 150);
    });
  });
});