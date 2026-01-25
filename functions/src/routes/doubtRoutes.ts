import { Router } from 'express';
import { createDoubt, getDoubts, createDoubtFromAudio } from '../controllers/doubtController';
import { validateToken } from '../middleware/authMiddleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(validateToken);
router.post('/', createDoubt);
router.get('/', getDoubts);
router.post('/audio', upload.single('audio'), createDoubtFromAudio);

export default router;
