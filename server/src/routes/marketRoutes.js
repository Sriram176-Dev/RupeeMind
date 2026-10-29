import { Router } from 'express';
import {
  getMarketStatusController,
  getIndicesController,
  getQuotesController,
  getSingleQuoteController,
  getHistoryController,
  searchSymbolsController,
  getSignalController,
  getBatchSignalsController,
  quotesQuerySchema,
  historyQuerySchema,
  searchQuerySchema,
} from '../controllers/marketController.js';
import { protect } from '../middleware/auth.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';
import { validateQuery } from '../middleware/validate.js';

const router = Router();

router.get('/status', getMarketStatusController);
router.get('/indices', getIndicesController);
router.get('/quotes', validateQuery(quotesQuerySchema), getQuotesController);
router.get('/search', searchRateLimiter, validateQuery(searchQuerySchema), searchSymbolsController);
router.get('/:symbol/quote', getSingleQuoteController);
router.get('/:symbol/history', validateQuery(historyQuerySchema), getHistoryController);

// Signal endpoints (Protected by authentication)
router.get('/signals/batch', protect, getBatchSignalsController);
router.get('/:symbol/signal', protect, getSignalController);

export default router;
