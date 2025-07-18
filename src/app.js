import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './common/config/database.js';
import { connectRedis } from './common/config/redis.js';
import { connectRabbitMQ } from './queue/rabbitmq.js';
import startConsumer from './queue/consumer.js';
import userRoutes from './modules/user/user.routes.js';
import messageRoutes from './modules/message/message.routes.js';
import initializeSocket from './sockets/chat.gateway.js';
import planningJob from './jobs/planning.job.js';
import queuingJob from './jobs/queuing.job.js';
import logger from './common/config/logger.js';
import loggingMiddleware from './common/middlewares/logging.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(fs.readFileSync(path.resolve(__dirname, './common/swagger/swagger.json'), 'utf8'));

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

initializeSocket(io);

// Security Middlewares
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(loggingMiddleware);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', userRoutes);
app.use('/api/messages', messageRoutes);

// Centralized Error Handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export { app, server, io, connectDB, connectRedis, connectRabbitMQ, startConsumer, planningJob, queuingJob, logger };
