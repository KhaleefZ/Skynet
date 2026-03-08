import { Router } from 'express';
import { getPeople, getPersonById, updatePerson, toggleUserActive } from '../controllers/personController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// All authenticated users can list people (filtering applied in controller)
router.get('/', asyncHandler(getPeople));

// Get single person
router.get('/:id', asyncHandler(getPersonById));

// Update person (admin only)
router.patch('/:id', authorize('admin'), asyncHandler(updatePerson));

// Toggle user active status (admin only)
router.post('/:id/toggle-active', authorize('admin'), asyncHandler(toggleUserActive));

export default router;