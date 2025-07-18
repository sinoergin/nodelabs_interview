import socketAuth from './socket.auth.js';
import { redisClient } from '../common/config/redis.js';
import messageService from '../modules/message/message.service.js';
import { GENERAL_CONVERSATION_ID } from '../modules/message/message.service.js';

const initializeSocket = (io) => {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.user.id);
    await redisClient.sAdd('online_users', socket.user.id);
    socket.broadcast.emit('user_online', { userId: socket.user.id });

    // Automatically join the general chat room
    socket.join(GENERAL_CONVERSATION_ID);
    console.log(`User ${socket.user.id} joined general chat room`);

    socket.on('send_message', async (data) => {
      const { content } = data;
      const sender = socket.user.id;
      
      try {
        const message = await messageService.createMessage({
          sender,
          content,
          conversationId: GENERAL_CONVERSATION_ID,
        });
        io.to(GENERAL_CONVERSATION_ID).emit('message', { sender: socket.user.username, content: message.content });
      } catch (error) {
        console.error('Error saving or emitting message:', error);
      }
    });

    socket.on('typing', () => {
      socket.to(GENERAL_CONVERSATION_ID).emit('typing', socket.user.username);
    });

    socket.on('stop typing', () => {
      socket.to(GENERAL_CONVERSATION_ID).emit('stop typing');
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.user.id);
      await redisClient.sRem('online_users', socket.user.id);
      socket.broadcast.emit('user_offline', { userId: socket.user.id });
    });
  });
};

export default initializeSocket;
