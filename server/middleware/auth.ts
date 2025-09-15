import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
    expires_at: number;
  };
}

/**
 * Middleware to check if user is authenticated
 * This would be implemented by the Replit Auth blueprint
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.user.claims) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (req.user.expires_at && now > req.user.expires_at) {
    return res.status(401).json({ message: 'Token expired' });
  }
  
  next();
}

/**
 * Middleware to extract user information for optional authentication
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Set user if available, but don't require it
  next();
}
