import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { debug } from '../logger';

export interface VisitorInfo {
  id: string;
  firstSeen: Date;
  lastSeen: Date;
  accessCount: number;
  userAgent: string;
  hashedIp: string;
}

export interface UsageMetrics {
  totalVisitors: number;
  activeVisitors: number;
  totalAccesses: number;
  visitors: VisitorInfo[];
  startTime: Date;
  lastActivity: Date;
}

export interface AccessEvent {
  ip: string;
  userAgent: string;
  path: string;
  timestamp: Date;
}

export class UsageTracker extends EventEmitter {
  private visitors: Map<string, VisitorInfo> = new Map();
  private startTime: Date;
  private lastActivity: Date;
  private totalAccesses: number = 0;
  private activeTimeout: number = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    super();
    this.startTime = new Date();
    this.lastActivity = new Date();
  }
  
  /**
   * Track a new access event
   */
  trackAccess(event: AccessEvent): void {
    debug('Tracking access:', { 
      path: event.path, 
      userAgent: event.userAgent.substring(0, 50) 
    });
    
    // Hash the IP for privacy
    const hashedIp = this.hashIp(event.ip);
    const visitorId = this.generateVisitorId(hashedIp, event.userAgent);
    
    // Update visitor info
    const now = new Date();
    const visitor = this.visitors.get(visitorId);
    
    if (visitor) {
      visitor.lastSeen = now;
      visitor.accessCount++;
    } else {
      this.visitors.set(visitorId, {
        id: visitorId,
        firstSeen: now,
        lastSeen: now,
        accessCount: 1,
        userAgent: event.userAgent,
        hashedIp: hashedIp
      });
      
      // Emit new visitor event
      this.emit('visitor:new', {
        id: visitorId,
        userAgent: event.userAgent
      });
    }
    
    this.totalAccesses++;
    this.lastActivity = now;
    
    // Emit access event
    this.emit('access', {
      visitorId,
      path: event.path,
      timestamp: now
    });
    
    // Emit metrics update
    this.emit('metrics:updated', this.getMetrics());
  }
  
  /**
   * Get current usage metrics
   */
  getMetrics(): UsageMetrics {
    const now = Date.now();
    const activeVisitors = Array.from(this.visitors.values())
      .filter(visitor => (now - visitor.lastSeen.getTime()) < this.activeTimeout)
      .length;
    
    return {
      totalVisitors: this.visitors.size,
      activeVisitors,
      totalAccesses: this.totalAccesses,
      visitors: Array.from(this.visitors.values())
        .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()),
      startTime: this.startTime,
      lastActivity: this.lastActivity
    };
  }
  
  /**
   * Get metrics for a specific visitor
   */
  getVisitorMetrics(visitorId: string): VisitorInfo | null {
    return this.visitors.get(visitorId) || null;
  }
  
  /**
   * Clear all metrics (for privacy or reset)
   */
  clearMetrics(): void {
    debug('Clearing all usage metrics');
    this.visitors.clear();
    this.totalAccesses = 0;
    this.startTime = new Date();
    this.lastActivity = new Date();
    
    this.emit('metrics:cleared');
  }
  
  /**
   * Remove inactive visitors (privacy cleanup)
   */
  cleanupInactiveVisitors(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [id, visitor] of this.visitors.entries()) {
      if (now - visitor.lastSeen.getTime() > maxAge) {
        this.visitors.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      debug(`Cleaned up ${removed} inactive visitors`);
      this.emit('metrics:updated', this.getMetrics());
    }
    
    return removed;
  }
  
  /**
   * Hash IP address for privacy preservation
   */
  private hashIp(ip: string): string {
    // Use SHA-256 with a salt for privacy
    const salt = 'claude-code-spec-workflow-v1';
    return createHash('sha256')
      .update(ip + salt)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for brevity
  }
  
  /**
   * Generate a unique visitor ID
   */
  private generateVisitorId(hashedIp: string, userAgent: string): string {
    // Combine hashed IP and user agent for unique identification
    const combined = hashedIp + userAgent;
    return createHash('sha256')
      .update(combined)
      .digest('hex')
      .substring(0, 12);
  }
  
  /**
   * Get active visitor count
   */
  getActiveVisitorCount(): number {
    const now = Date.now();
    return Array.from(this.visitors.values())
      .filter(visitor => (now - visitor.lastSeen.getTime()) < this.activeTimeout)
      .length;
  }
  
  /**
   * Set active timeout duration
   */
  setActiveTimeout(timeout: number): void {
    this.activeTimeout = timeout;
  }
  
  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const metrics = this.getMetrics();
    return JSON.stringify({
      ...metrics,
      // Anonymize visitor data for export
      visitors: metrics.visitors.map(v => ({
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        accessCount: v.accessCount,
        // Don't export hashed IPs or full user agents
        userAgentType: this.classifyUserAgent(v.userAgent)
      }))
    }, null, 2);
  }
  
  /**
   * Classify user agent for privacy-preserving analytics
   */
  private classifyUserAgent(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'mobile';
    if (ua.includes('tablet')) return 'tablet';
    if (ua.includes('bot') || ua.includes('crawler')) return 'bot';
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari')) return 'safari';
    if (ua.includes('edge')) return 'edge';
    return 'other';
  }
}