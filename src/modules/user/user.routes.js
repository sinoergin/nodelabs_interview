import express from 'express';
import userController from './user.controller.js';
import authMiddleware from '../../common/middlewares/auth.middleware.js';
import validate from '../../common/middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../common/validation/user.validation.js';

const router = express.Router();

router.post('/auth/register', validate(registerSchema), userController.register);
router.post('/auth/login', validate(loginSchema), userController.login);
router.post('/auth/refresh', validate(refreshTokenSchema), userController.refresh);
router.post('/auth/logout', authMiddleware, userController.logout);
router.get('/auth/me', authMiddleware, userController.getMe);
router.get('/user/list', authMiddleware, userController.listUsers);
router.get('/user/online-users', authMiddleware, userController.getOnlineUsers);

export default router;
