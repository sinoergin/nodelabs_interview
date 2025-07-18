import cron from 'node-cron';
import userRepository from '../modules/user/user.repository.js';
import conversationRepository from '../modules/conversation/conversation.repository.js';
import autoMessageRepository from '../modules/autoMessage/autoMessage.repository.js';

// Planning Job (Cron Job - Every day at 02:00 AM)
// This job matches active users and creates conversations with automated messages.
// It runs every day at 02:00 AM.
const planningJob = cron.schedule('0 2 * * *', async () => {
  console.log('Running planning job at 02:00 AM');
  try {
    const users = await userRepository.findAllUsers();
    if (users.length < 2) {
      console.log('Not enough users to create a conversation.');
      return;
    }

    const shuffledUsers = users.sort(() => 0.5 - Math.random());

    for (let i = 0; i < shuffledUsers.length - 1; i += 2) {
      const sender = shuffledUsers[i];
      const receiver = shuffledUsers[i + 1];

      let conversation = await conversationRepository.findConversationByParticipants([sender._id, receiver._id]);
      if (!conversation) {
        conversation = await conversationRepository.createConversation([sender._id, receiver._id]);
      }

      const message = `Hello ${receiver.username}, this is an automated message from ${sender.username}.`;
      const sendDate = new Date(Date.now() + Math.random() * 60000); // Send within a minute

      await autoMessageRepository.createAutoMessage({
        conversationId: conversation._id,
        sender: sender._id,
        receiver: receiver._id,
        message,
        sendDate,
      });
    }
    console.log('Planning job finished.');
  } catch (error) {
    console.error('Error running planning job:', error);
  }
});

export default planningJob;
