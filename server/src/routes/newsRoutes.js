import { Router } from 'express';
import { fetchNews, newsQuerySchema } from '../controllers/newsController.js';
import { validateQuery } from '../middleware/validate.js';

const router = Router();

// GET /api/news?category=Markets|Economy|...
router.get('/', validateQuery(newsQuerySchema), fetchNews);

export default router;
