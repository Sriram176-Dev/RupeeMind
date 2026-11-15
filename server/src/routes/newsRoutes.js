import { Router } from 'express';
import { fetchNews, fetchPortfolioNews, newsQuerySchema } from '../controllers/newsController.js';
import { validateQuery } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/news/portfolio (User-matched holdings & watchlist news)
router.get('/portfolio', protect, fetchPortfolioNews);

// GET /api/news?category=Markets|Economy|...
router.get('/', validateQuery(newsQuerySchema), fetchNews);

export default router;
