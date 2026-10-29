import Parser from 'rss-parser';
import NodeCache from 'node-cache';

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [['media:content', 'mediaContent']],
  },
});

const newsCache = new NodeCache({ stdTTL: 600 }); // 10 min cache

// ── RSS Feed Sources (Indian Financial News) ──────────────────────────
const RSS_FEEDS = [
  {
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    source: 'Economic Times',
    defaultCategory: 'Markets',
  },
  {
    url: 'https://economictimes.indiatimes.com/markets/mutual-funds/rssfeeds/93702498.cms',
    source: 'Economic Times',
    defaultCategory: 'Mutual Funds',
  },
  {
    url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
    source: 'Economic Times',
    defaultCategory: 'Economy',
  },
  {
    url: 'https://economictimes.indiatimes.com/news/company/corporate-trends/rssfeeds/2143429.cms',
    source: 'Economic Times',
    defaultCategory: 'Companies',
  },
  {
    url: 'https://www.livemint.com/rss/markets',
    source: 'Mint',
    defaultCategory: 'Markets',
  },
  {
    url: 'https://www.livemint.com/rss/money',
    source: 'Mint',
    defaultCategory: 'Personal Finance',
  },
  {
    url: 'https://www.livemint.com/rss/companies',
    source: 'Mint',
    defaultCategory: 'Companies',
  },
  {
    url: 'https://www.thehindubusinessline.com/markets/stock-markets/feeder/default.rss',
    source: 'BusinessLine',
    defaultCategory: 'Markets',
  },
];

// ── Category Inference ────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  'Mutual Funds': ['mutual fund', 'sip', 'nav', 'amc', 'amfi', 'elss', 'fund house', 'nfo', 'scheme'],
  Economy: ['rbi', 'gdp', 'inflation', 'fiscal', 'monetary', 'repo rate', 'gst', 'pmi', 'trade deficit', 'current account', 'budget'],
  Companies: ['quarterly', 'earnings', 'revenue', 'profit', 'ipo', 'merger', 'acquisition', 'board', 'dividend', 'buyback', 'demerger'],
  'Personal Finance': ['tax', 'insurance', 'ppf', 'epf', 'nps', 'fixed deposit', 'savings', 'loan', 'credit', 'retirement'],
  Markets: ['nifty', 'sensex', 'bse', 'nse', 'bull', 'bear', 'rally', 'correction', 'fii', 'dii', 'f&o'],
};

function inferCategory(title, summary, defaultCategory) {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return cat;
    }
  }
  return defaultCategory;
}

// ── Time Ago Formatter ────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return 'recently';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return 'recently';

  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

// ── Gradient Palette ──────────────────────────────────────────────────
const GRADIENT_MAP = {
  Markets: 'from-indigo-600 to-blue-800',
  Economy: 'from-emerald-600 to-teal-800',
  'Mutual Funds': 'from-teal-600 to-emerald-900',
  Companies: 'from-amber-600 to-orange-800',
  'Personal Finance': 'from-emerald-700 to-cyan-900',
};

function getGradient(category) {
  return GRADIENT_MAP[category] || 'from-slate-700 to-zinc-900';
}

// ── Read Time Estimate ────────────────────────────────────────────────
function estimateReadTime(text) {
  const words = (text || '').split(/\s+/).length;
  const mins = Math.max(2, Math.ceil(words / 200));
  return `${mins} min read`;
}

// ── Strip HTML Tags ───────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Main Fetch ────────────────────────────────────────────────────────
async function fetchSingleFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map((item, idx) => {
      const title = stripHtml(item.title || '');
      const summary = stripHtml(item.contentSnippet || item.content || item.summary || '');
      const category = inferCategory(title, summary, feed.defaultCategory);

      return {
        id: `rss-${feed.source.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${idx}`,
        headline: title,
        source: feed.source,
        category,
        timeAgo: formatTimeAgo(item.pubDate || item.isoDate),
        summary: summary.slice(0, 280) + (summary.length > 280 ? '…' : ''),
        url: item.link || '#',
        gradient: getGradient(category),
        readTime: estimateReadTime(summary),
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn(`[NewsService] Failed to fetch ${feed.source} (${feed.url}):`, err.message);
    return [];
  }
}

// Persistent fallback cache across TTL expirations
let lastSuccessfulAllItems = [];

/**
 * Fetch all RSS feeds, deduplicate by title, sort by date, cache.
 */
export async function getNews(category) {
  const cacheKey = `news_${category || 'all'}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return cached;

  // Fetch all feeds concurrently
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));
  let allItems = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allItems.push(...r.value);
    }
  }

  // If live fetch succeeded
  if (allItems.length > 0) {
    // Deduplicate by headline similarity
    const seen = new Set();
    allItems = allItems.filter((item) => {
      const key = item.headline.toLowerCase().trim().slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Update persistent cache
    lastSuccessfulAllItems = allItems;

    // Filter by category if requested
    let filtered = allItems;
    if (category && category !== 'All') {
      filtered = allItems.filter((item) => item.category === category);
    }

    // Cap at 50 items
    filtered = filtered.slice(0, 50);
    newsCache.set(cacheKey, filtered);
    return filtered;
  }

  // If live fetch returned 0 items, check persistent fallback
  if (lastSuccessfulAllItems.length > 0) {
    console.warn('[NewsService] All live RSS feeds failed; returning stale cached articles.');
    let filtered = lastSuccessfulAllItems.map((item) => ({ ...item, stale: true }));
    if (category && category !== 'All') {
      filtered = filtered.filter((item) => item.category === category);
    }
    return filtered.slice(0, 50);
  }

  // If all feeds failed and no cache exists, throw 503 Service Unavailable
  const error = new Error('Live financial news feeds are temporarily unavailable. Please retry shortly.');
  error.statusCode = 503;
  throw error;
}

/**
 * Force-refresh the cache
 */
export function invalidateNewsCache() {
  newsCache.flushAll();
}
