import scrapeRoutes from './scrape.routes.js';
import authRoutes from './auth.routes.js';
import cacheRoutes from './cache.routes.js';
import advancedCacheRoutes from './advancedCache.routes.js';
import notificationRoutes from './notification.routes.js';
import analyticsRoutes from './analytics.routes.js';
import securityRoutes from './security.routes.js';
import databaseRoutes from './database.routes.js';
import websocketRoutes from './websocket.routes.js';
import quotaRoutes from './quota.routes.js';
import fileUploadRoutes from './fileUpload.routes.js';
import jobMonitoringRoutes from './jobMonitoring.routes.js';
import monitoringRoutes from './monitoring.routes.js';
import grindRoomRoutes from './grindRoom.routes.js';
import tournamentRoutes from './tournament.routes.js';
import duelRoutes from './duel.routes.js';
import mentorshipRoutes from './mentorship.routes.js';
import socialRoutes from './social.routes.js';
import settingsRoutes from './settings.routes.js';
import invoicesRoutes from './invoices.routes.js';
import { HTTP_STATUS } from '../constants/app.constants.js';

export const setupRoutes = (app) => {
  // API routes
  app.use('/api/scrape', scrapeRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/cache', cacheRoutes);
  app.use('/api/advanced-cache', advancedCacheRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/security', securityRoutes);
  app.use('/api/database', databaseRoutes);
  app.use('/api/websocket', websocketRoutes);
  app.use('/api/quota', quotaRoutes);
  app.use('/api/upload', fileUploadRoutes);
  app.use('/api/job-monitoring', jobMonitoringRoutes);
  app.use('/api/monitoring', monitoringRoutes);
  app.use('/api/rooms', grindRoomRoutes);
  app.use('/api/tournaments', tournamentRoutes);
  app.use('/api/duels', duelRoutes);
  app.use('/api/mentorship', mentorshipRoutes);
  app.use('/api/social', socialRoutes);

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'GrindMap API v1.0',
      documentation: '/api/docs',
      endpoints: {
        scraping: '/api/scrape',
        authentication: '/api/auth',
        cache: '/api/cache',
        advancedCache: '/api/advanced-cache',
        notifications: '/api/notifications',
        analytics: '/api/analytics',
        websocket: '/ws',
        websocketAPI: '/api/websocket',
        quota: '/api/quota',
        jobs: '/api/jobs',
        monitoring: '/api/monitoring',
        tournaments: '/api/tournaments',
        duels: '/api/duels',
        mentorship: '/api/mentorship',
        social: '/api/social',
        settings: '/api/settings',
        invoices: '/api/invoices',
        health: '/health',
        database: '/api/database',
      },
      correlationId: req.correlationId,
    });
  });
};
