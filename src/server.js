import { server, io, connectDB, connectRedis, connectRabbitMQ, startConsumer, planningJob, queuingJob, logger } from './app.js';
import config from './common/config/index.js';

const port = config.port;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await connectRabbitMQ();
    startConsumer(io);

    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    planningJob.start();
    queuingJob.start();

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
