import socketAuth from './socket.auth.js';
import { redisClient, subscriber } from '../common/config/redis.js';
import messageService from '../modules/message/message.service.js';
import conversationService from '../modules/conversation/conversation.service.js';
import userService from '../modules/user/user.service.js';
import logger from '../common/config/logger.js';

// In-memory mapping of userId to socketId for direct messaging
const userSockets = new Map();

const initializeSocket = (io) => {
    // Subscribe to the Redis channel for cross-process notifications
    subscriber.subscribe('socket_notifications', (message) => {
        try {
            const notification = JSON.parse(message);
            if (notification.type === 'NEW_CONVERSATION') {
                const { conversationId, participants } = notification.payload;
                logger.info(`Received new conversation notification: ${conversationId}`);

                // Notify both participants that a conversation has started
                participants.forEach((userId) => {
                    const socketId = userSockets.get(userId);
                    if (socketId) {
                        io.to(socketId).emit('conversation_started', { conversationId });
                        logger.info(
                            `Notified user ${userId} (socket: ${socketId}) about new conversation.`,
                        );
                    }
                });
            }
        } catch (error) {
            logger.error('Error processing Redis notification:', error);
        }
    });

    io.use(socketAuth);

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        const username = socket.user.username;
        logger.info(`User connected: ${username} (${userId}), socket ID: ${socket.id}`);

        userSockets.set(userId, socket.id);
        await redisClient.sAdd('online_users', userId);

        socket.broadcast.emit('user_online', { userId, username });

        // --- Conversation Handling ---
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            logger.info(`User ${username} joined conversation room: ${conversationId}`);
        });

        socket.on('find_conversation', async () => {
            logger.info(`User ${username} is looking for a conversation.`);
            try {
                await conversationService.addUserToWaitingPool(userId);
                logger.info(`User ${username} added to waiting pool. Attempting to pair...`);

                const conversation = await conversationService.pairUsersAndCreateConversation();
                logger.info(
                    `Result of pairUsersAndCreateConversation: ${conversation ? 'Conversation created' : 'No conversation'}`,
                );
                const remainingWaitingUsers = await redisClient.sMembers('waiting_pool');
                logger.info(
                    `Users remaining in waiting_pool after pairing attempt: ${remainingWaitingUsers.length}`,
                );

                if (conversation) {
                    logger.info(`Pairing successful. Conversation ID: ${conversation._id}`);
                    const participantIds = conversation.participants.map((p) => p.toString());
                    const otherParticipantId = participantIds.find((id) => id !== userId);
                    const otherParticipantSocketId = userSockets.get(otherParticipantId);

                    // Get usernames for both participants
                    const user1 = await userService.getUserById(userId);
                    const user2 = await userService.getUserById(otherParticipantId);

                    if (user1 && user2) {
                        // Notify current user
                        socket.emit('conversation_started', {
                            conversationId: conversation._id,
                            partnerUsername: user2.username,
                        });
                        socket.join(conversation._id);
                        logger.info(
                            `User ${username} joined conversation room: ${conversation._id}`,
                        );

                        // Notify other participant if online
                        if (otherParticipantSocketId) {
                            io.to(otherParticipantSocketId).emit('conversation_started', {
                                conversationId: conversation._id,
                                partnerUsername: user1.username,
                            });
                            io.to(otherParticipantSocketId).socketsJoin(conversation._id);
                            logger.info(
                                `User ${user2.username} (${otherParticipantId}) joined conversation room: ${conversation._id} during conversation creation.`,
                            );
                            // Log current rooms for debugging (this requires fetching the socket object for the other participant)
                            // Note: Directly logging rooms for a socketId via io.to(socketId).rooms is not straightforward.
                            // We'll rely on the logger.info above to confirm the join.
                            // If more detailed debugging is needed, we might need to iterate through io.sockets.sockets
                            // or add a separate event for the other client to confirm their rooms.
                        } else {
                            logger.warn(
                                `Other participant ${user2.username} (${otherParticipantId}) is not online.`,
                            );
                        }
                    } else {
                        logger.warn(
                            `Could not find user details for pairing: user1=${user1}, user2=${user2}`,
                        );
                        socket.emit('error', {
                            message: 'Failed to retrieve user details for conversation.',
                        });
                    }
                } else {
                    logger.info(`No partner found for ${username} yet. Waiting...`);
                    // Optionally, emit an event back to the client to indicate waiting
                    socket.emit('waiting_for_partner');
                }
            } catch (error) {
                logger.error(`Error in find_conversation for user ${username}:`, error);
                socket.emit('error', {
                    message: 'An error occurred while trying to find a conversation.',
                });
            }
        });

        socket.on('cancel_find_conversation', async () => {
            logger.info(`User ${username} cancelled looking for a conversation.`);
            await conversationService.removeUserFromWaitingPool(userId);
        });

        // --- Message Handling ---
        socket.on('send_message', async (data) => {
            const { conversationId, content } = data;
            if (!conversationId || !content) {
                return socket.emit('error', { message: 'Missing conversationId or content.' });
            }

            try {
                const message = await messageService.createMessage({
                    sender: userId,
                    content,
                    conversationId,
                });

                // Send message to all participants in the room (including sender)
                io.to(conversationId).emit('message_received', message);
                logger.info(`Message from ${username} sent to conversation ${conversationId}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        socket.on('message_read', async (data) => {
            const { messageId } = data;
            try {
                const message = await messageService.markMessageAsRead(messageId);
                if (message) {
                    const recipientSocketId = userSockets.get(message.sender.toString());
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('message_was_read', {
                            messageId: message._id,
                            readAt: message.readAt,
                        });
                    }
                }
            } catch (error) {
                logger.error(`Failed to mark message ${messageId} as read:`, error);
            }
        });

        // --- Typing Indicators ---
        socket.on('typing', ({ conversationId }) => {
            socket.to(conversationId).emit('user_typing', { username });
        });

        socket.on('stopped_typing', ({ conversationId }) => {
            socket.to(conversationId).emit('user_stopped_typing', { username });
        });

        // --- Disconnect Handling ---
        socket.on('disconnect', async () => {
            logger.info(`User disconnected: ${username} (${userId})`);
            userSockets.delete(userId);
            await redisClient.sRem('online_users', userId);
            await conversationService.removeUserFromWaitingPool(userId); // Also remove from waiting pool
            socket.broadcast.emit('user_offline', { userId, username });
        });
    });
};

export default initializeSocket;
