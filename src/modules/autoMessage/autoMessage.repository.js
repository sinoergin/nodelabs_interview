import AutoMessage from './autoMessage.model.js';

class AutoMessageRepository {
  async createAutoMessage(messageData) {
    const autoMessage = new AutoMessage(messageData);
    return await autoMessage.save();
  }

  async findQueuableMessages() {
    return await AutoMessage.find({ sendDate: { $lte: new Date() }, isQueued: false });
  }

  async updateToQueued(id) {
    return await AutoMessage.findByIdAndUpdate(id, { isQueued: true });
  }

  async updateToSent(id) {
    return await AutoMessage.findByIdAndUpdate(id, { isSent: true });
  }
}

export default new AutoMessageRepository();
