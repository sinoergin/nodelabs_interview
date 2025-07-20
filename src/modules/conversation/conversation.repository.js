import Conversation from './conversation.model.js';
import { redisClient } from '../../common/config/redis.js';

const CONVERSATION_CACHE_TTL = 60 * 60; // 1 hour

class ConversationRepository {
    findAllByParticipant(userId) {
        return Conversation.find({ participants: userId });
    }

    async findConversationByParticipants(participants) {
        const sortedParticipants = [...participants].sort();
        const cacheKey = `conversation:${sortedParticipants.join('-')}`;

        const cachedConversation = await redisClient.get(cacheKey);
        if (cachedConversation) {
            return JSON.parse(cachedConversation);
        }

        const conversation = await Conversation.findOne({ participants: { $all: participants } });
        if (conversation) {
            await redisClient.setEx(cacheKey, CONVERSATION_CACHE_TTL, JSON.stringify(conversation));
        }
        return conversation;
    }

    async createConversation(participants) {
        const conversation = new Conversation({ participants });
        const newConversation = await conversation.save();

        const sortedParticipants = [...participants].sort();
        const cacheKey = `conversation:${sortedParticipants.join('-')}`;
        await redisClient.setEx(cacheKey, CONVERSATION_CACHE_TTL, JSON.stringify(newConversation));

        return newConversation;
    }

    async deleteConversationById(conversationId) {
        const deletedConversation = await Conversation.findByIdAndDelete(conversationId);
        if (deletedConversation) {
            // Invalidate cache for this conversation
            const sortedParticipants = [
                ...deletedConversation.participants.map((p) => p.toString()),
            ].sort();
            const cacheKey = `conversation:${sortedParticipants.join('-')}`;
            await redisClient.del(cacheKey);
        }
        return deletedConversation;
    }
}

export default new ConversationRepository();
