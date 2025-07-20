import Message from './message.model.js';

class MessageRepository {
    async create(messageData) {
        const message = new Message(messageData);
        await message.save();
        return await message.populate('sender', 'username');
    }

    async findByConversationId(conversationId) {
        return await Message.find({ conversationId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 }); // Sort messages by creation time
    }

    async findById(id) {
        return await Message.findById(id);
    }

    async save(message) {
        return await message.save();
    }
}

export default new MessageRepository();
