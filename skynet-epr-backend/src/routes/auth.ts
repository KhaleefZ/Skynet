import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Authenticated routes
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh); // Uses refresh token cookie
router.get('/me', authenticate, authController.me);

// Admin/Instructor routes
router.post('/users', authenticate, authController.createUser);
router.post('/admin/reset-password', authenticate, authController.adminResetUserPassword);

export default router;
