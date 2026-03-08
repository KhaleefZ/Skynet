import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import type { TokenPayload } from '../utils/jwt.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Authentication middleware
 * Verifies access token from cookies and attaches user to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const payload = verifyAccessToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints that behave differently for logged-in users
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
    
    next();
  } catch {
    // Token invalid, but continue without user
    next();
  }
};

// Keep mockAuth for backwards compatibility during transition
export const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    // Simulate user from header for testing
    req.user = {
      userId,
      email: 'mock@test.com',
      role: 'admin',
    };
  }
  next();
};