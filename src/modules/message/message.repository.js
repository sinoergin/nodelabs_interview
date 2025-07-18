import Message from './message.model.js';

class MessageRepository {
  async createMessage(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  async findMessagesByConversationId(conversationId) {
    return await Message.find({ conversationId }).populate('sender', 'username');
  }
}

export default new MessageRepository();
