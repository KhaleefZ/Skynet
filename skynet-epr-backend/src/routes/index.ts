import { Router } from 'express';
import peopleRoutes from './people.js';
import eprRoutes from './epr.js';
import adminRoutes from './admin.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use('/people', authenticate, peopleRoutes);
router.use('/epr', authenticate, eprRoutes);
router.use('/admin', authenticate, adminRoutes);

export default router;