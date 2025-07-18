import express from 'express';
import messageController from './message.controller.js';
import authMiddleware from '../../common/middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, messageController.getGeneralMessages);
router.get('/:conversationId', authMiddleware, messageController.getMessages);

export default router;
