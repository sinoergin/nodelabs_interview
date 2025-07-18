import userRepository from './user.repository.js';
import jwt from 'jsonwebtoken';
import config from '../../common/config/index.js';
import { redisClient } from '../../common/config/redis.js';

class UserService {
  async register(registerRequest) {
    return await userRepository.createUser(registerRequest);
  }

  async login(email, password) {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  generateAccessToken(user) {
    return jwt.sign({ id: user._id, username: user.username }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  generateRefreshToken(user) {
    return jwt.sign({ id: user._id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await userRepository.findUserById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }
      const newAccessToken = this.generateAccessToken(user);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const expirationTime = decoded.exp - Math.floor(Date.now() / 1000);
      await redisClient.setEx(`blacklist:${refreshToken}`, expirationTime, 'blacklisted');
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Invalid refresh token or already logged out');
    }
  }

  async getUserProfile(userId) {
    return await userRepository.findUserById(userId);
  }

  async getAllUsers() {
    return await userRepository.findAllUsers();
  }

  async getOnlineUsers() {
    const onlineUserIds = await redisClient.sMembers('online_users');
    const onlineUsers = [];

    for (const userId of onlineUserIds) {
      const user = await userRepository.findUserById(userId);
      if (user) {
        onlineUsers.push({ id: user._id, username: user.username });
      }
    }
    return onlineUsers;
  }
}

export default new UserService();
