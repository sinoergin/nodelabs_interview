import messageRepository from './message.repository.js';

export const GENERAL_CONVERSATION_ID = 'general_chat_room'; // Hardcoded ID for the general chat room

class MessageService {
  async createMessage(messageData) {
    return await messageRepository.createMessage(messageData);
  }

  async getMessages(conversationId) {
    return await messageRepository.findMessagesByConversationId(conversationId);
  }

  async getGeneralMessages() {
    return await messageRepository.findMessagesByConversationId(GENERAL_CONVERSATION_ID);
  }
}

export default new MessageService();
