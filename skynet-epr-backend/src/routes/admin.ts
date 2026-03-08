import { Router } from 'express';
import { 
  getAllUsers,
  getDashboardStats,
  getAssignments,
  createAssignment,
  removeAssignment,
} from '../controllers/adminController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Dashboard stats (admin/instructor)
router.get('/stats', authorize('admin', 'instructor'), asyncHandler(getDashboardStats));

// User management (admin only)
router.get('/users', authorize('admin'), asyncHandler(getAllUsers));

// Instructor-Student Assignments (admin only)
router.get('/assignments', authorize('admin'), asyncHandler(getAssignments));
router.post('/assignments', authorize('admin'), asyncHandler(createAssignment));
router.delete('/assignments/:id', authorize('admin'), asyncHandler(removeAssignment));

export default router;
