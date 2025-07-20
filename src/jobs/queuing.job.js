import cron from 'node-cron';
import autoMessageRepository from '../modules/autoMessage/autoMessage.repository.js';
import { getChannel } from '../queue/rabbitmq.js';

/**
 * This job runs every minute to find messages that can be queued for sending.
 * It retrieves messages from the database and sends them to a RabbitMQ queue.
 * After sending, it updates the message status to 'queued'.
 */
const queuingJob = cron.schedule('* * * * *', async () => {
    console.log('Running queuing job every minute');
    try {
        const messages = await autoMessageRepository.findQueuableMessages();
        if (messages.length === 0) {
            console.log('No messages to queue.');
            return;
        }

        const channel = getChannel();
        for (const message of messages) {
            channel.sendToQueue('message_sending_queue', Buffer.from(JSON.stringify(message)));
            await autoMessageRepository.updateToQueued(message._id);
        }
        console.log(`${messages.length} messages sent to queue.`);
    } catch (error) {
        console.error('Error running queuing job:', error);
    }
});

export default queuingJob;
