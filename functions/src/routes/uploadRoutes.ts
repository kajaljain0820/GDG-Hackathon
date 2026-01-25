import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

// POST /api/upload
// Note: No Multer middleware - controller handles parsing directly
router.post('/', uploadFile);

export default router;
