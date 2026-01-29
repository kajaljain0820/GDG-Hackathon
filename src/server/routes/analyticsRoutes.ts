import { Router } from 'express';
import { getProfessorAnalytics, exportAnalyticsToSheet } from '../controllers/analyticsController';
import { validateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(validateToken);

// Only professors can view analytics
router.get('/', requireRole('professor'), getProfessorAnalytics);
router.post('/export', requireRole('professor'), exportAnalyticsToSheet);

export default router;


