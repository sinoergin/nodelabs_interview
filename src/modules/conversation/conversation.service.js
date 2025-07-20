import conversationRepository from './conversation.repository.js';
import messageRepository from '../message/message.repository.js';
import { redisClient } from '../../common/config/redis.js';
import logger from '../../common/config/logger.js';
import { NotFoundError } from '../../common/errors/index.js';

class ConversationService {
    async createConversation(userId1, userId2) {
        const existingConversation = await conversationRepository.findConversationByParticipants([
            userId1,
            userId2,
        ]);
        if (existingConversation) {
            return existingConversation;
        }
        const conversation = await conversationRepository.createConversation([userId1, userId2]);
        return conversation;
    }

    async getUserConversations(userId) {
        return await conversationRepository
            .findAllByParticipant(userId)
            .populate('participants', 'username');
    }

    async getMessagesForConversation(conversationId) {
        const messages = await messageRepository.findByConversationId(conversationId);
        if (!messages || messages.length === 0) {
            throw new NotFoundError('No messages found for this conversation');
        }
        return messages;
    }

    async deleteConversation(conversationId) {
        return await conversationRepository.deleteConversationById(conversationId);
    }

    async addUserToWaitingPool(userId) {
        await redisClient.sAdd('waiting_pool', userId);
    }

    async removeUserFromWaitingPool(userId) {
        await redisClient.sRem('waiting_pool', userId);
    }

    async pairUsersAndCreateConversation() {
        logger.info('Attempting to pair users and create conversation...');
        const waitingUsers = await redisClient.sMembers('waiting_pool');
        logger.info(`Users in waiting_pool: ${waitingUsers.length}`);

        if (waitingUsers.length < 2) {
            logger.info('Not enough users in waiting_pool for pairing.');
            return null;
        }

        const user1 = waitingUsers[0];
        const user2 = waitingUsers[1];
        logger.info(`Attempting to pair ${user1} and ${user2}.`);

        const conversation = await this.createConversation(user1, user2);
        if (conversation) {
            logger.info(`Conversation created: ${conversation._id} between ${user1} and ${user2}.`);
            await this.removeUserFromWaitingPool(user1);
            await this.removeUserFromWaitingPool(user2);
            logger.info(`Removed ${user1} and ${user2} from waiting_pool.`);
        } else {
            logger.warn(`Failed to create conversation between ${user1} and ${user2}.`);
        }

        return conversation;
    }
}

export default new ConversationService();
