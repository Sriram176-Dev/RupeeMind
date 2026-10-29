import { Router } from 'express';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import watchlistRoutes from './watchlistRoutes.js';
import holdingsRoutes from './holdingsRoutes.js';
import calculationRoutes from './calculationRoutes.js';
import marketRoutes from './marketRoutes.js';
import newsRoutes from './newsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import fundRoutes from './fundRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import sipRoutes from './sipRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import paperTradingRoutes from './paperTradingRoutes.js';
import copilotRoutes from './copilotRoutes.js';
import reportRoutes from './reportRoutes.js';

import accountRoutes from './accountRoutes.js';
import { getHealth, getSimpleHealth } from '../controllers/healthController.js';

import { authRateLimiter, readOnlyRateLimiter } from '../middleware/rateLimiter.js';

const apiRouter = Router();

// Health check endpoints
apiRouter.get('/health', getHealth);
apiRouter.get('/health/simple', getSimpleHealth);

apiRouter.use('/auth', authRateLimiter, authRoutes);
apiRouter.use('/account', accountRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/watchlist', watchlistRoutes);
apiRouter.use('/holdings', holdingsRoutes);
apiRouter.use('/calculations', calculationRoutes);
apiRouter.use('/market', readOnlyRateLimiter, marketRoutes);
apiRouter.use('/news', readOnlyRateLimiter, newsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/funds', readOnlyRateLimiter, fundRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/sips', sipRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/paper-trading', paperTradingRoutes);
apiRouter.use('/copilot', copilotRoutes);
apiRouter.use('/reports', reportRoutes);

export default apiRouter;
