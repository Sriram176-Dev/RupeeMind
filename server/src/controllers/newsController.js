import { z } from 'zod';
import { getNews } from '../services/newsService.js';

export const newsQuerySchema = z.object({
  category: z.string().max(50).optional(),
});

/**
 * GET /api/news?category=Markets
 * Returns live financial news from RSS feeds.
 */
export async function fetchNews(req, res, next) {
  try {
    const category = req.query.category || 'All';
    const items = await getNews(category);
    res.json({ data: items, count: items.length });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: err.message,
        data: [],
      });
    }
    next(err);
  }
}
