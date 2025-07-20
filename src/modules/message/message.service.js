import messageRepository from './message.repository.js';
import { NotFoundError } from '../../common/errors/index.js';

class MessageService {
    async createMessage(messageData) {
        return await messageRepository.create(messageData);
    }

    async markMessageAsRead(messageId) {
        const message = await messageRepository.findById(messageId);
        if (!message) {
            throw new NotFoundError('Message not found');
        }

        if (!message.readAt) {
            message.readAt = new Date();
            return await messageRepository.save(message);
        }

        return message;
    }
}

export default new MessageService();
