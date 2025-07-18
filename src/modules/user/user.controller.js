import userService from './user.service.js';
import { UserRegisterRequest, UserLoginRequest, UserResponse, LoginResponse } from '../../common/dtos/user.dto.js';

class UserController {
  async register(req, res, next) {
    try {
      const registerRequest = new UserRegisterRequest(req.body.email, req.body.password, req.body.username);
      const user = await userService.register(registerRequest);
      res.status(201).json({ success: true, data: new UserResponse(user) });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const loginRequest = new UserLoginRequest(req.body.email, req.body.password);
      const { user, accessToken, refreshToken } = await userService.login(loginRequest.email, loginRequest.password);
      res.json({ success: true, data: { user: new UserResponse(user), ...new LoginResponse(accessToken, refreshToken) } });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { accessToken } = await userService.refreshAccessToken(refreshToken);
      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await userService.logout(refreshToken);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user.id);
      res.json({ success: true, data: new UserResponse(user) });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.json({ success: true, data: users.map(user => new UserResponse(user)) });
    } catch (error) {
      next(error);
    }
  }

  async getOnlineUsers(req, res, next) {
    try {
      const onlineUsers = await userService.getOnlineUsers();
      res.json({ success: true, data: onlineUsers });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();