require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const queueWorker = require('./services/queueWorker');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  // Connect MongoDB Atlas
  try {
    await connectDB();
  } catch (err) {
    if (process.env.SANDBOX_MODE === 'true' && process.env.NODE_ENV !== 'production') {
      logger.warn('Database connection failed. Running in sandbox mock mode.');
    } else {
      logger.error('FATAL: Database connection failed and Sandbox Mode is disabled. Exiting process.');
      process.exit(1);
    }
  }

  // Start BullMQ Worker
  queueWorker.start();
  
  server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await queueWorker.stop();
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
