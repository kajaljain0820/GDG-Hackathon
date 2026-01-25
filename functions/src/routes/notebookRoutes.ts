import { Router } from 'express';
import { queryNotebook } from '../controllers/notebookController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(validateToken);
router.post('/query', queryNotebook);

export default router;
