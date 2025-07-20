import cron from 'node-cron';
import conversationService from '../modules/conversation/conversation.service.js';
import { redisClient } from '../common/config/redis.js';
import logger from '../common/config/logger.js';

/**
 * This job runs daily at 2 AM to pair users and create conversations.
 * It publishes a notification to Redis when a new conversation is created.
 */
const planningJob = cron.schedule('0 2 * * *', async () => {
    logger.info('Running user pairing job.');
    try {
        const conversation = await conversationService.pairUsersAndCreateConversation();

        if (conversation) {
            logger.info(
                `Conversation created: ${conversation._id} for users ${conversation.participants.join(' and ')}`,
            );

            const notification = {
                type: 'NEW_CONVERSATION',
                payload: {
                    conversationId: conversation._id.toString(),
                    participants: conversation.participants.map((p) => p.toString()),
                },
            };

            await redisClient.publish('socket_notifications', JSON.stringify(notification));
        }
    } catch (error) {
        logger.error('Error during user pairing job:', error);
    }
});

export default planningJob;
