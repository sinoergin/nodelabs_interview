import { sendSuccess } from '../../common/utils/responseHandler.js';
import userService from './user.service.js';
import {
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    LoginResponse,
} from '../../common/dtos/user.dto.js';

class UserController {
    async register(req, res, next) {
        try {
            const registerRequest = new UserRegisterRequest(
                req.body.email,
                req.body.password,
                req.body.username,
            );
            const user = await userService.register(registerRequest);
            sendSuccess(res, new UserResponse(user), 'User registered successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const loginRequest = new UserLoginRequest(req.body.email, req.body.password);
            const { user, accessToken, refreshToken } = await userService.login(
                loginRequest.email,
                loginRequest.password,
            );
            sendSuccess(
                res,
                { user: new UserResponse(user), ...new LoginResponse(accessToken, refreshToken) },
                'User logged in successfully',
            );
        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const { accessToken } = await userService.refreshAccessToken(refreshToken);
            sendSuccess(res, { accessToken }, 'Token refreshed successfully');
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await userService.logout(userId);
            sendSuccess(res, null, result.message);
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await userService.getUserProfile(req.user.id);
            sendSuccess(res, new UserResponse(user), 'Current user info');
        } catch (error) {
            next(error);
        }
    }

    async listUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            sendSuccess(
                res,
                users.map((user) => new UserResponse(user)),
                'List of users',
            );
        } catch (error) {
            next(error);
        }
    }

    async getOnlineUsers(req, res, next) {
        try {
            const onlineUsers = await userService.getOnlineUsers();
            sendSuccess(res, onlineUsers, 'List of online users');
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const updatedUser = await userService.updateProfile(req.user.id, req.body);
            sendSuccess(res, new UserResponse(updatedUser), 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
