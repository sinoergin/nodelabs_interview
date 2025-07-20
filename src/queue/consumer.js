import { getChannel } from './rabbitmq.js';
import messageRepository from '../modules/message/message.repository.js';
import autoMessageRepository from '../modules/autoMessage/autoMessage.repository.js';

const startConsumer = (io) => {
    const channel = getChannel();
    if (channel) {
        channel.consume('message_sending_queue', async (msg) => {
            if (msg !== null) {
                try {
                    const autoMessage = JSON.parse(msg.content.toString());
                    console.log('Received message from queue:', autoMessage);

                    // 1. Create a new message
                    const newMessage = await messageRepository.createMessage({
                        conversationId: autoMessage.conversationId,
                        sender: autoMessage.sender,
                        content: autoMessage.message,
                    });

                    const populatedMessage = await messageRepository.findMessageById(
                        newMessage._id,
                    );

                    // 2. Emit to receiver via Socket.IO
                    io.to(autoMessage.receiver).emit('message_received', populatedMessage);

                    // 3. Update AutoMessage to isSent: true
                    await autoMessageRepository.updateToSent(autoMessage._id);

                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message from queue:', error);
                    channel.nack(msg);
                }
            }
        });
    }
};

export default startConsumer;
