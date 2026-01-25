import { Router } from 'express';
import { createChat, sendMessage, getUserChats, getChatDetails } from '../controllers/chatController';
import { validateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(validateToken);

router.post('/', createChat);
router.get('/', getUserChats);
router.get('/:chatId', getChatDetails);
router.post('/:chatId/message', sendMessage);

export default router;
