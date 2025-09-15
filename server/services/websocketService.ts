import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { storage } from '../storage';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { getSession } from '../replitAuth';

interface SubscriptionMap {
  [jobId: string]: Set<AuthenticatedWebSocket>;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
  sessionId?: string;
}

interface ProgressMessage {
  type: 'progress';
  jobId: number;
  status: string;
  progress: number;
  currentStep: string | null;
  errorMessage?: string | null;
}

interface SubscriptionMessage {
  type: 'subscribe';
  jobId: number;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private subscriptions: SubscriptionMap = {};
  private sessionStore: any = null;

  public initialize(server: any): void {
    // Initialize session store for WebSocket authentication
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
      tableName: "sessions",
    });

    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'
    });

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      console.log('WebSocket connection established from:', req.socket.remoteAddress);
      
      // Authenticate the WebSocket connection
      const isAuth = await this.authenticateConnection(ws, req);
      if (!isAuth) {
        ws.close(1008, 'Authentication required');
        return;
      }

      this.setupConnectionHandlers(ws);
    });

    console.log('WebSocket service initialized');
  }

  private async authenticateConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): Promise<boolean> {
    try {
      // Extract session information from cookies
      const cookies = this.parseCookies(req.headers.cookie || '');
      
      // Check for Replit session cookie
      const sessionCookie = cookies['connect.sid'];
      if (!sessionCookie) {
        console.log('No session cookie found for WebSocket connection');
        return false;
      }

      // Decode the session ID from the signed cookie
      // The session cookie is signed with the session secret
      const sessionId = this.decodeSessionId(sessionCookie);
      if (!sessionId) {
        console.log('Invalid session cookie format');
        return false;
      }

      // Validate session against the session store
      const sessionData = await this.getSessionData(sessionId);
      if (!sessionData) {
        console.log('Session not found in store');
        return false;
      }

      // Check if user is authenticated in the session
      const user = sessionData.passport?.user;
      if (!user || !user.claims || !user.claims.sub) {
        console.log('No authenticated user in session');
        return false;
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (user.expires_at && now > user.expires_at) {
        console.log('Session expired');
        return false;
      }
      
      // Set authentication info on WebSocket
      ws.isAuthenticated = true;
      ws.userId = user.claims.sub;
      ws.sessionId = sessionId;
      
      console.log('WebSocket authenticated for user:', ws.userId);
      return true;
      
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      return false;
    }
  }

  private parseCookies(cookieHeader: string): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        // Handle cookies with = in values by joining the rest
        const value = parts.slice(1).join('=');
        cookies[key] = value;
      }
    });
    return cookies;
  }

  private decodeSessionId(signedCookie: string): string | null {
    try {
      // Handle both signed and unsigned cookies for robustness
      if (signedCookie.startsWith('s:')) {
        // Signed cookie format: s:sessionId.signature
        const unsigned = signedCookie.slice(2);
        const dotIndex = unsigned.lastIndexOf('.');
        if (dotIndex > 0) {
          return unsigned.slice(0, dotIndex);
        }
      } else {
        // Handle unsigned cookie as fallback
        const decoded = decodeURIComponent(signedCookie);
        if (decoded.length > 0) {
          return decoded;
        }
      }
      return null;
    } catch (error) {
      console.error('Error decoding session ID:', error);
      return null;
    }
  }

  private async getSessionData(sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sessionStore.get(sessionId, (err: any, session: any) => {
        if (err) {
          console.error('Session store error:', err);
          resolve(null);
        } else {
          resolve(session);
        }
      });
    });
  }

  private setupConnectionHandlers(ws: AuthenticatedWebSocket): void {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.jobId) {
          await this.handleSubscription(ws, data.jobId);
        } else if (data.type === 'unsubscribe' && data.jobId) {
          await this.handleUnsubscription(ws, data.jobId);
        } else if (data.type === 'ping') {
          // Respond to ping with pong for connection health check
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed for user:', ws.userId);
      this.cleanupSubscriptions(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.cleanupSubscriptions(ws);
    });
  }

  private async handleSubscription(ws: AuthenticatedWebSocket, jobId: number): Promise<void> {
    try {
      if (!ws.isAuthenticated || !ws.userId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required'
        }));
        return;
      }

      // Verify that the user owns this job
      const job = await storage.getJob(jobId);
      if (!job) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Job not found'
        }));
        return;
      }

      // Verify job ownership - critical security check
      if (job.userId !== ws.userId) {
        console.log(`User ${ws.userId} attempted to access job ${jobId} owned by ${job.userId}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unauthorized: You can only access your own jobs'
        }));
        return;
      }
      
      const jobIdStr = jobId.toString();
      
      // Initialize subscription set for this job if it doesn't exist
      if (!this.subscriptions[jobIdStr]) {
        this.subscriptions[jobIdStr] = new Set();
      }

      // Check if already subscribed to avoid duplicates
      if (this.subscriptions[jobIdStr].has(ws)) {
        console.log(`WebSocket already subscribed to job ${jobId} for user ${ws.userId}`);
        // Still send confirmation and current status
      } else {
        // Add the WebSocket to the subscription set
        this.subscriptions[jobIdStr].add(ws);
        console.log(`WebSocket subscribed to job ${jobId} for user ${ws.userId}`);
      }

      // Send subscription confirmation
      ws.send(JSON.stringify({
        type: 'subscribed',
        jobId: jobId,
        message: 'Successfully subscribed to job updates'
      }));
      
      // Send current job status immediately
      const document = await storage.getDocument(job.documentId);
      const currentStatus: ProgressMessage = {
        type: 'progress',
        jobId: job.id,
        status: job.status || 'PENDING',
        progress: job.progress || 0,
        currentStep: job.currentStep || 'Starting...',
        errorMessage: job.errorMessage || null
      };
      
      ws.send(JSON.stringify(currentStatus));

    } catch (error) {
      console.error('Subscription error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to subscribe to job updates'
      }));
    }
  }
  
  private async handleUnsubscription(ws: AuthenticatedWebSocket, jobId: number): Promise<void> {
    try {
      if (!ws.isAuthenticated || !ws.userId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required'
        }));
        return;
      }
      
      const jobIdStr = jobId.toString();
      
      if (this.subscriptions[jobIdStr]) {
        this.subscriptions[jobIdStr].delete(ws);
        
        // Clean up empty subscription sets
        if (this.subscriptions[jobIdStr].size === 0) {
          delete this.subscriptions[jobIdStr];
        }
        
        console.log(`WebSocket unsubscribed from job ${jobId} for user ${ws.userId}`);
      }
      
      // Send unsubscription confirmation
      ws.send(JSON.stringify({
        type: 'unsubscribed',
        jobId: jobId,
        message: 'Successfully unsubscribed from job updates'
      }));
      
    } catch (error) {
      console.error('Unsubscription error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to unsubscribe from job updates'
      }));
    }
  }

  private cleanupSubscriptions(ws: AuthenticatedWebSocket): void {
    // Remove this WebSocket from all subscription sets
    Object.keys(this.subscriptions).forEach(jobId => {
      this.subscriptions[jobId].delete(ws);
      
      // Clean up empty subscription sets
      if (this.subscriptions[jobId].size === 0) {
        delete this.subscriptions[jobId];
      }
    });
  }

  public broadcastProgress(jobId: number, progress: ProgressMessage): void {
    const jobIdStr = jobId.toString();
    const subscribers = this.subscriptions[jobIdStr];
    
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = JSON.stringify(progress);
    const deadConnections = new Set<AuthenticatedWebSocket>();

    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error sending progress update:', error);
          deadConnections.add(ws);
        }
      } else {
        deadConnections.add(ws);
      }
    });

    // Clean up dead connections
    deadConnections.forEach(ws => {
      subscribers.delete(ws);
    });

    if (subscribers.size === 0) {
      delete this.subscriptions[jobIdStr];
    }

    console.log(`Broadcasted progress update for job ${jobId} to ${subscribers.size} subscribers`);
  }

  public getSubscriberCount(jobId: number): number {
    const jobIdStr = jobId.toString();
    return this.subscriptions[jobIdStr]?.size || 0;
  }

  public getAllSubscriptions(): { [jobId: string]: number } {
    const result: { [jobId: string]: number } = {};
    Object.keys(this.subscriptions).forEach(jobId => {
      result[jobId] = this.subscriptions[jobId].size;
    });
    return result;
  }
}

// Export a singleton instance
export const websocketService = new WebSocketService();