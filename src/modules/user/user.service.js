import userRepository from './user.repository.js';
import jwt from 'jsonwebtoken';
import config from '../../common/config/index.js';
import { redisClient } from '../../common/config/redis.js';
import { AuthenticationError, NotFoundError, ValidationError } from '../../common/errors/index.js';

class UserService {
    async getUserById(userId) {
        return await userRepository.findUserById(userId);
    }

    async register(registerRequest) {
        try {
            // Check if email already exists
            const existingUserByEmail = await userRepository.findUserByEmail(registerRequest.email);
            if (existingUserByEmail) {
                throw new ValidationError('Email already registered');
            }

            // Check if username already exists
            const existingUserByUsername = await userRepository.findUserByUsername(
                registerRequest.username,
            );
            if (existingUserByUsername) {
                throw new ValidationError('Username already taken');
            }

            return await userRepository.createUser(registerRequest);
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                const field = Object.keys(error.keyPattern)[0];
                throw new ValidationError(
                    `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
                );
            }
            throw error;
        }
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
        return jwt.sign({ id: user._id, username: user.username }, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    generateRefreshToken(user) {
        return jwt.sign({ id: user._id }, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        });
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

    async logout(userId) {
        try {
            // Kullanıcının tüm refresh token'larını Redis'ten temizle
            const pattern = `refresh_token:${userId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            return { message: 'Logged out successfully' };
        } catch (error) {
            throw new Error('Logout failed');
        }
    }

    async getUserProfile(userId) {
        const cacheKey = `user_profile:${userId}`;
        const cachedUser = await redisClient.get(cacheKey);

        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        const user = await userRepository.findUserById(userId);
        if (user) {
            await redisClient.setEx(cacheKey, 7200, JSON.stringify(user)); // 2 hours TTL
        }
        return user;
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

    async updateProfile(userId, updateData) {
        const updatedUser = await userRepository.updateUser(userId, updateData);
        const cacheKey = `user_profile:${userId}`;
        await redisClient.del(cacheKey); // Invalidate cache
        return updatedUser;
    }
}

export default new UserService();
