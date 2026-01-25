import { Router } from 'express';
import { getProfessorAnalytics } from '../controllers/analyticsController';
import { validateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(validateToken);

// Only professors can view analytics
// Only professors can view analytics
router.get('/', requireRole('professor'), getProfessorAnalytics);
router.post('/export', requireRole('professor'), require('../controllers/analyticsController').exportAnalyticsToSheet);

export default router;
