import Conversation from './conversation.model.js';
import { redisClient } from '../../common/config/redis.js';

const CONVERSATION_CACHE_TTL = 60 * 60; // 1 hour

class ConversationRepository {
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
}

export default new ConversationRepository();
