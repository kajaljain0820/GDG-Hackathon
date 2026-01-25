import { Router } from 'express';
import { professorLogin } from '../controllers/authController';

const router = Router();

// Professor login endpoint
router.post('/professor-login', professorLogin);

export default router;
