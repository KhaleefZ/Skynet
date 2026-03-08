import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'instructor', 'admin']),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const adminResetSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 60 * 60 * 1000, // 1 hour
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    // Set cookies
    res.cookie('accessToken', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    res.json({
      user: result.user,
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
    }
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
}

// Logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

// Refresh tokens
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const tokens = await authService.refreshTokensService(refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, accessCookieOptions);
    res.cookie('refreshToken', tokens.refreshToken, refreshCookieOptions);

    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    // Clear cookies on refresh failure
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
}

// Get current user
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.getCurrentUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

// Create user (admin/instructor only)
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const creatorRole = req.user?.role;
    
    if (!creatorRole || creatorRole === 'student') {
      return res.status(403).json({ error: 'Not authorized to create users' });
    }

    const data = createUserSchema.parse(req.body);
    const user = await authService.createUser(data, creatorRole);

    res.status(201).json({ user, message: 'User created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}

// Request password reset
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await authService.requestPasswordReset(data.email);

    // In production, send email with reset link
    // For demo, return the token directly
    res.json({
      message: 'If this email exists, a reset link has been sent',
      // Demo only - remove in production:
      resetToken: result.resetToken,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
    }
    // Always return success message to not reveal if email exists
    res.json({ message: 'If this email exists, a reset link has been sent' });
  }
}

// Reset password with token
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(data.token, data.newPassword);

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}

// Admin reset password for any user
export async function adminResetUserPassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = adminResetSchema.parse(req.body);
    await authService.adminResetPassword(data.userId, data.newPassword);

    res.json({ message: 'User password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}
