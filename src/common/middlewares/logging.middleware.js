import logger from '../config/logger.js';

const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Method: ${req.method}, URL: ${req.originalUrl}, Status: ${res.statusCode}, Duration: ${duration}ms, Body: ${JSON.stringify(req.body)}, Query: ${JSON.stringify(req.query)}`);
  });
  next();
};

export default loggingMiddleware;
