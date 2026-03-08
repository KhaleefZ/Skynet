import type { Request, Response, NextFunction } from 'express';

type Role = 'student' | 'instructor' | 'admin';

/**
 * Authorization middleware - checks if user has required role
 * Usage: authorize('admin', 'instructor') or authorize('admin')
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(user.role as Role)) {
      return res.status(403).json({ 
        error: 'Forbidden - insufficient permissions',
        required: allowedRoles,
        current: user.role,
      });
    }

    next();
  };
}

/**
 * Check if user can access a specific resource
 * For example: students can only view their own EPRs
 */
export function authorizeOwnerOrRole(
  getResourceOwnerId: (req: Request) => string | undefined,
  ...allowedRoles: Role[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin/Instructor can access based on role
    if (allowedRoles.includes(user.role as Role)) {
      return next();
    }

    // Otherwise check ownership
    const resourceOwnerId = getResourceOwnerId(req);
    if (resourceOwnerId && resourceOwnerId === user.userId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Forbidden - you can only access your own resources',
    });
  };
}
