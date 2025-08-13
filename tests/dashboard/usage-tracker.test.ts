import { UsageTracker, AccessEvent } from '../../src/dashboard/tunnel/usage-tracker';

describe('UsageTracker', () => {
  let tracker: UsageTracker;
  
  beforeEach(() => {
    tracker = new UsageTracker();
  });
  
  describe('trackAccess', () => {
    it('should track new visitors', () => {
      const event: AccessEvent = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      };
      
      tracker.trackAccess(event);
      
      const metrics = tracker.getMetrics();
      expect(metrics.totalVisitors).toBe(1);
      expect(metrics.totalAccesses).toBe(1);
      expect(metrics.activeVisitors).toBe(1);
    });
    
    it('should increment access count for returning visitors', () => {
      const event: AccessEvent = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      };
      
      tracker.trackAccess(event);
      tracker.trackAccess({ ...event, path: '/api/info' });
      
      const metrics = tracker.getMetrics();
      expect(metrics.totalVisitors).toBe(1);
      expect(metrics.totalAccesses).toBe(2);
      expect(metrics.visitors[0].accessCount).toBe(2);
    });
    
    it('should hash IP addresses for privacy', () => {
      const event: AccessEvent = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      };
      
      tracker.trackAccess(event);
      
      const metrics = tracker.getMetrics();
      const visitor = metrics.visitors[0];
      expect(visitor.hashedIp).not.toBe('192.168.1.1');
      expect(visitor.hashedIp).toHaveLength(16);
    });
    
    it('should emit events on new visitor', (done) => {
      tracker.on('visitor:new', (data) => {
        expect(data.id).toBeDefined();
        expect(data.userAgent).toBe('Mozilla/5.0');
        done();
      });
      
      const event: AccessEvent = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      };
      
      tracker.trackAccess(event);
    });
  });
  
  describe('getActiveVisitorCount', () => {
    it('should count only active visitors', async () => {
      // Set short timeout for testing
      tracker.setActiveTimeout(100); // 100ms
      
      const event: AccessEvent = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      };
      
      tracker.trackAccess(event);
      expect(tracker.getActiveVisitorCount()).toBe(1);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(tracker.getActiveVisitorCount()).toBe(0);
      
      // But total visitors should still be 1
      expect(tracker.getMetrics().totalVisitors).toBe(1);
    });
  });
  
  describe('cleanupInactiveVisitors', () => {
    it('should remove old visitors', async () => {
      // Add first visitor
      tracker.trackAccess({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      });
      
      // Wait a bit then add another visitor
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Add recent visitor
      tracker.trackAccess({
        ip: '192.168.1.2',
        userAgent: 'Chrome/100',
        path: '/api/info',
        timestamp: new Date()
      });
      
      expect(tracker.getMetrics().totalVisitors).toBe(2);
      
      // Cleanup with 100ms max age - should remove the first visitor
      const removed = tracker.cleanupInactiveVisitors(100);
      
      expect(removed).toBe(1);
      expect(tracker.getMetrics().totalVisitors).toBe(1);
    });
  });
  
  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      tracker.trackAccess({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        path: '/api/specs',
        timestamp: new Date()
      });
      
      expect(tracker.getMetrics().totalVisitors).toBe(1);
      
      tracker.clearMetrics();
      
      const metrics = tracker.getMetrics();
      expect(metrics.totalVisitors).toBe(0);
      expect(metrics.totalAccesses).toBe(0);
      expect(metrics.visitors).toHaveLength(0);
    });
  });
  
  describe('exportMetrics', () => {
    it('should export anonymized metrics', () => {
      tracker.trackAccess({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        path: '/api/specs',
        timestamp: new Date()
      });
      
      const exported = JSON.parse(tracker.exportMetrics());
      
      expect(exported.totalVisitors).toBe(1);
      expect(exported.visitors[0].userAgentType).toBe('chrome');
      expect(exported.visitors[0].hashedIp).toBeUndefined();
      expect(exported.visitors[0].userAgent).toBeUndefined();
    });
    
    it('should classify user agents correctly', () => {
      const testCases = [
        { ua: 'Mobile Safari', expected: 'mobile' },
        { ua: 'iPad', expected: 'tablet' },
        { ua: 'Googlebot', expected: 'bot' },
        { ua: 'Chrome/91.0', expected: 'chrome' },
        { ua: 'Firefox/89.0', expected: 'firefox' },
        { ua: 'Safari/14.1', expected: 'safari' },
        { ua: 'Edg/91.0', expected: 'edge' },
        { ua: 'Unknown Browser', expected: 'other' }
      ];
      
      testCases.forEach(({ ua, expected }, index) => {
        tracker.trackAccess({
          ip: `192.168.1.${index + 1}`,
          userAgent: ua,
          path: '/',
          timestamp: new Date()
        });
      });
      
      const exported = JSON.parse(tracker.exportMetrics());
      testCases.forEach(({ expected }, index) => {
        expect(exported.visitors[index].userAgentType).toBe(expected);
      });
    });
  });
});