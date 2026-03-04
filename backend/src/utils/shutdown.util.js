import Logger from './logger.js';

export const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    Logger.info(`Received ${signal}. Graceful shutdown...`);

    server.close(() => {
      Logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      Logger.info('Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};