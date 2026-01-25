import { Router } from 'express';
import { syncUser, getProfile } from '../controllers/userController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(validateToken);

router.post('/sync', syncUser);
router.get('/me', getProfile);

export default router;
