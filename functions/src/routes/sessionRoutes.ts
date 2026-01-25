import { Router } from 'express';
import { createSession, getSessions } from '../controllers/teachingSessionController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(validateToken);

router.post('/', createSession);
router.get('/', getSessions);

export default router;
