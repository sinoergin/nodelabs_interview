import conversationService from './conversation.service.js';
import messageService from '../message/message.service.js';
import { sendSuccess } from '../../common/utils/responseHandler.js';

class ConversationController {
    async getMyConversations(req, res, next) {
        try {
            const userId = req.user.id;
            const conversations = await conversationService.getUserConversations(userId);
            sendSuccess(res, conversations, 'User conversations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMessages(req, res, next) {
        try {
            const { conversationId } = req.params;
            const messages = await conversationService.getMessagesForConversation(conversationId);
            sendSuccess(res, messages, 'Messages retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;
            const sender = req.user.id;

            const message = await messageService.createMessage({
                sender,
                content,
                conversationId,
            });
            sendSuccess(res, message, 'Message sent successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async deleteConversation(req, res, next) {
        try {
            const { conversationId } = req.params;
            await conversationService.deleteConversation(conversationId);
            sendSuccess(res, null, 'Conversation deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new ConversationController();
