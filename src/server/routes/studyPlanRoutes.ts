import { Router } from 'express';
import { createStudyPlan, getStudyPlans, updateStudyPlan, deleteStudyPlan } from '../controllers/studyPlanController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();

// All study plan routes require authentication
router.use(validateToken);

router.post('/', createStudyPlan);
router.get('/', getStudyPlans);
router.put('/:planId', updateStudyPlan);
router.delete('/:planId', deleteStudyPlan);

export default router;
