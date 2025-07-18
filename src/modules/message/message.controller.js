import messageService from './message.service.js';
import { MessageResponse } from '../../common/dtos/message.dto.js';

class MessageController {
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const messages = await messageService.getMessages(conversationId);
      res.json({ success: true, data: messages.map(message => new MessageResponse(message)) });
    } catch (error) {
      next(error);
    }
  }

  async getGeneralMessages(req, res, next) {
    try {
      const messages = await messageService.getGeneralMessages();
      res.json({ success: true, data: messages.map(message => new MessageResponse(message)) });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
