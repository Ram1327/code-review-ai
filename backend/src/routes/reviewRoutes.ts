import { Router } from 'express';
import { submitReview } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/submit', authMiddleware as any, submitReview as any);

export default router;
