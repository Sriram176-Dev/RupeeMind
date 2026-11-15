import { z } from "zod";
import { getNews, getPortfolioNews } from "../services/newsService.js";

export const newsQuerySchema = z.object({
  category: z.string().max(50).optional(),
  fresh: z.string().optional(),
});

/**
 * GET /api/news?category=Markets&fresh=true
 * Returns live financial news from RSS feeds.
 */
export async function fetchNews(req, res, next) {
  try {
    const category = req.query.category || "All";
    const forceRefresh = req.query.fresh === "true" || req.query.fresh === "1";
    const items = await getNews(category, forceRefresh);
    res.json({
      success: true,
      news: items,
      data: items,
      count: items.length,
      fetchedAt: new Date().toISOString(),
      isLive: true,
    });
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

/**
 * GET /api/news/portfolio
 * Returns articles matched to the user's holdings and watchlist with sentiment tagging
 */
export async function fetchPortfolioNews(req, res, next) {
  try {
    const userId = req.user?.id;
    const items = await getPortfolioNews(userId);
    res.json({
      success: true,
      data: items,
      count: items.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
