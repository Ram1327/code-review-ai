import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', register);
router.post('/login', login);
router.get('/me', authMiddleware as any, getMe as any);

export default router;
