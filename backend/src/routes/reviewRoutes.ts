import { Router } from 'express';
import { 
  submitReview, 
  getReviewDetails, 
  getReviewDocs, 
  getUserReviews, 
  deleteReview 
} from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/submit', authMiddleware as any, submitReview as any);
router.get('/', authMiddleware as any, getUserReviews as any);
router.get('/:id', authMiddleware as any, getReviewDetails as any);
router.get('/:id/docs', authMiddleware as any, getReviewDocs as any);
router.delete('/:id', authMiddleware as any, deleteReview as any);

export default router;
