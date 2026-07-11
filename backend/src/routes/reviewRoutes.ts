import { Router } from 'express';
import { submitReview, getReviewDetails } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/submit', authMiddleware as any, submitReview as any);
router.get('/:id', authMiddleware as any, getReviewDetails as any);

export default router;
