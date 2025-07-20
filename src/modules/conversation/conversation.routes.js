import express from 'express';
import conversationController from './conversation.controller.js';
import authMiddleware from '../../common/middlewares/auth.middleware.js';
import validate from '../../common/middlewares/validate.middleware.js';
import { messageSchema } from '../../common/validation/message.validation.js';

const router = express.Router();

router.get('/', authMiddleware, conversationController.getMyConversations);
router.get('/:conversationId/messages', authMiddleware, conversationController.getMessages);
router.post(
    '/:conversationId/messages',
    authMiddleware,
    validate(messageSchema),
    conversationController.sendMessage,
);
router.delete('/:conversationId', authMiddleware, conversationController.deleteConversation);

export default router;
