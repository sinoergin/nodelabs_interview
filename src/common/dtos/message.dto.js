class MessageRequest {
  constructor(content, conversationId) {
    this.content = content;
    this.conversationId = conversationId;
  }
}

class MessageResponse {
  constructor(message) {
    this.id = message._id;
    this.sender = message.sender;
    this.content = message.content;
    this.conversationId = message.conversationId;
    this.createdAt = message.createdAt;
  }
}

export { MessageRequest, MessageResponse };