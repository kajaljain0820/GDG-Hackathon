import { Router } from 'express';
import { professorLogin, createProfessor, createStudent } from '../controllers/authController';

const router = Router();

// Professor login endpoint (Legacy/Fallback)
router.post('/professor-login', professorLogin);

// Create new professor endpoint (Admin only)
router.post('/create-professor', createProfessor);

// Create new student endpoint (Admin only)
router.post('/create-student', createStudent);

export default router;
