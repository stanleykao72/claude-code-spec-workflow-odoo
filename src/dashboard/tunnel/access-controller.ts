import { FastifyRequest, FastifyReply } from 'fastify';
import { WebSocket, RawData } from 'ws';
import crypto from 'crypto';

interface PasswordEntry {
  hash: string;
  attempts: number;
  lastAttempt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface SessionEntry {
  tunnelId: string;
  createdAt: number;
  expiresAt: number;
}

export interface AccessControlOptions {
  readOnlyMode: boolean;
  password?: string;
  rateLimitAttempts?: number;
  rateLimitWindow?: number; // in milliseconds
}

export class AccessController {
  private passwords: Map<string, PasswordEntry> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private readOnlySessions: Set<string> = new Set();
  private sessions: Map<string, SessionEntry> = new Map();
  
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly SESSION_DURATION = 3600000; // 1 hour
  
  constructor(
    private _options: AccessControlOptions = {
      readOnlyMode: false,
      rateLimitAttempts: 5,
      rateLimitWindow: 60000
    }
  ) {}

  /**
   * Set password for a tunnel
   */
  setPassword(tunnelId: string, password: string): void {
    const hash = this.hashPassword(password);
    this.passwords.set(tunnelId, {
      hash,
      attempts: 0,
      lastAttempt: 0
    });
  }

  /**
   * Validate password for a tunnel
   */
  validatePassword(tunnelId: string, password: string, clientIp?: string): boolean {
    const entry = this.passwords.get(tunnelId);
    if (!entry) return true; // No password set
    
    // Check rate limit
    if (clientIp && !this.checkRateLimit(clientIp)) {
      throw new Error('Too many attempts. Please try again later.');
    }
    
    const hash = this.hashPassword(password);
    const isValid = hash === entry.hash;
    
    if (!isValid) {
      entry.attempts++;
      entry.lastAttempt = Date.now();
      
      if (clientIp) {
        this.incrementRateLimit(clientIp);
      }
    }
    
    return isValid;
  }

  /**
   * Middleware to enforce read-only access
   */
  enforceReadOnly = async (req: FastifyRequest, reply: FastifyReply) => {
    // Skip if not in read-only mode
    if (!this._options.readOnlyMode) {
      return;
    }

    // Allow GET requests and WebSocket connections
    if (req.method === 'GET' || req.url === '/ws') {
      return;
    }

    // Block all other methods
    reply.code(403).send({ 
      error: 'Read-only access', 
      message: 'This dashboard is in read-only mode. Only viewing is allowed.'
    });
  };

  /**
   * Create a read-only WebSocket wrapper
   */
  wrapWebSocketForReadOnly(socket: WebSocket, sessionId: string): void {
    if (!this._options.readOnlyMode) return;
    
    // Mark session as read-only
    this.readOnlySessions.add(sessionId);
    
    // For now, just mark the socket as read-only
    // TODO: Implement proper WebSocket message filtering
    console.log(`WebSocket ${sessionId} marked as read-only`);
    
    // Clean up on close
    socket.on('close', () => {
      this.readOnlySessions.delete(sessionId);
    });
  }

  /**
   * Check if a session is read-only
   */
  isReadOnlySession(sessionId: string): boolean {
    return this.readOnlySessions.has(sessionId);
  }

  /**
   * Filter WebSocket messages for read-only mode
   */
  private filterWebSocketMessage(data: RawData): string | null {
    try {
      const str = data.toString();
      const message = JSON.parse(str);
      
      // Filter out any interactive or write-related messages
      if (message.type === 'command' || 
          message.type === 'action' || 
          message.type === 'write') {
        return null;
      }
      
      // Add read-only indicator to messages
      if (message.type === 'initial' || message.type === 'update') {
        message.readOnly = true;
      }
      
      return JSON.stringify(message);
    } catch {
      // If we can't parse it, don't send it in read-only mode
      return null;
    }
  }

  /**
   * Hash password using SHA-256
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Check rate limit for an IP
   */
  private checkRateLimit(ip: string): boolean {
    const entry = this.rateLimits.get(ip);
    const now = Date.now();
    
    if (!entry || now > entry.resetAt) {
      return true;
    }
    
    return entry.count < (this._options.rateLimitAttempts || this.MAX_ATTEMPTS);
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(ip: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(ip);
    
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(ip, {
        count: 1,
        resetAt: now + (this._options.rateLimitWindow || this.RATE_LIMIT_WINDOW)
      });
    } else {
      entry.count++;
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (now > entry.resetAt) {
        this.rateLimits.delete(ip);
      }
    }
  }

  /**
   * Create a new session after successful authentication
   */
  createSession(tunnelId: string): string {
    const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    this.sessions.set(sessionToken, {
      tunnelId,
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION
    });
    
    // Clean up expired sessions periodically
    this.cleanupSessions();
    
    return sessionToken;
  }

  /**
   * Validate a session token
   */
  validateSession(sessionToken: string, tunnelId: string): boolean {
    const session = this.sessions.get(sessionToken);
    
    if (!session) {
      return false;
    }
    
    const now = Date.now();
    
    // Check if session is expired
    if (now > session.expiresAt) {
      this.sessions.delete(sessionToken);
      return false;
    }
    
    // Check if session is for the correct tunnel
    if (session.tunnelId !== tunnelId) {
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }

  /**
   * Get access statistics
   */
  getStats() {
    return {
      activeSessions: this.readOnlySessions.size,
      authenticatedSessions: this.sessions.size,
      protectedTunnels: this.passwords.size,
      rateLimitedIps: this.rateLimits.size
    };
  }
}