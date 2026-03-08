import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, refreshTokens } from '../db/schema.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  hashResetToken,
} from '../utils/jwt.js';
import type { TokenPayload } from '../utils/jwt.js';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_DAYS = 7;

export type Role = 'student' | 'instructor' | 'admin';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserResult {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean | null;
  createdAt: Date | null;
}

// Register a new user (called by admin/instructor)
export async function createUser(data: SignupData, creatorRole: Role): Promise<UserResult> {
  // Authorization: Admin can create any role, Instructor can only create students
  if (creatorRole === 'instructor' && data.role !== 'student') {
    throw new Error('Instructors can only create student accounts');
  }
  if (creatorRole === 'student') {
    throw new Error('Students cannot create accounts');
  }

  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, data.email));
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user
  const [newUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
  }).returning();

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt,
  };
}

// Login user
export async function login(data: LoginData): Promise<AuthResult> {
  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, data.email));
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Verify password
  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

// Refresh tokens
export async function refreshTokensService(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify the refresh token
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new Error('Invalid refresh token');
  }

  // Check if token exists in database and is not expired
  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, oldRefreshToken),
        gt(refreshTokens.expiresAt, new Date())
      )
    );

  if (!storedToken) {
    throw new Error('Refresh token not found or expired');
  }

  // Delete old refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

  // Generate new tokens
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Store new refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await db.insert(refreshTokens).values({
    userId: payload.userId,
    token: newRefreshToken,
    expiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// Logout - invalidate refresh token
export async function logout(refreshToken: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
}

// Get current user by ID
export async function getCurrentUser(userId: string): Promise<UserResult | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<{ resetToken: string; expiresAt: Date }> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  
  if (!user) {
    // Don't reveal if email exists for security
    throw new Error('If this email exists, a reset link has been sent');
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const hashedToken = hashResetToken(resetToken);
  
  // Set expiry to 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store hashed token in database
  await db.update(users).set({
    passwordResetToken: hashedToken,
    passwordResetExpiry: expiresAt,
  }).where(eq(users.id, user.id));

  // Return unhashed token (would be sent via email in production)
  return { resetToken, expiresAt };
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hashedToken = hashResetToken(token);

  // Find user with valid reset token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, hashedToken),
        gt(users.passwordResetExpiry, new Date())
      )
    );

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear reset token
  await db.update(users).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiry: null,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  // Invalidate all refresh tokens for this user (force re-login)
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
}

// Admin: Reset password for any user
export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db.update(users).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiry: null,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  // Invalidate all refresh tokens
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
