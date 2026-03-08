import { Router } from 'express';
import { 
  getEprs, 
  getEprDetail, 
  createEpr, 
  updateEpr, 
  getSummary, 
  getAssist,
  submitEpr,
  reviewEpr,
  getPendingReviews,
  exportEprReport
} from '../controllers/eprController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Level 2 routes MUST be before /:id to avoid matching 'summary' or 'assist' as an id
router.get('/summary/:personId', asyncHandler(getSummary));
router.post('/assist', asyncHandler(getAssist));

// EPR workflow routes
router.get('/pending-reviews', authorize('admin', 'instructor'), asyncHandler(getPendingReviews));
router.post('/:id/submit', asyncHandler(submitEpr));
router.post('/:id/review', authorize('admin', 'instructor'), asyncHandler(reviewEpr));

// Export route (Phase 4)
router.get('/export/:personId', asyncHandler(exportEprReport));

// CRUD routes
router.get('/', asyncHandler(getEprs));
router.get('/:id', asyncHandler(getEprDetail));
router.post('/', authorize('admin', 'instructor'), asyncHandler(createEpr));
router.patch('/:id', asyncHandler(updateEpr));

export default router;