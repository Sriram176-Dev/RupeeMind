import Parser from 'rss-parser';
import NodeCache from 'node-cache';

const parser = new Parser({
  timeout: 3000, // 3s fast timeout so external slow sites never hang the server
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

// Cache for 10 minutes with 2-minute check period
const newsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// ── Curated High-Reliability RSS Feed Sources (Indian Financial News) ──
const RSS_FEEDS = [
  {
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    source: 'Economic Times',
    defaultCategory: 'Markets',
  },
  {
    url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
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
    url: 'https://www.livemint.com/rss/money',
    source: 'Mint',
    defaultCategory: 'Personal Finance',
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
  if (!dateStr) return 'Just now';
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

// ── Estimate Read Time ────────────────────────────────────────────────
function estimateReadTime(text) {
  const words = (text || '').trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 180));
  return `${mins} min read`;
}

// ── Category Gradients ────────────────────────────────────────────────
const CATEGORY_GRADIENTS = {
  Markets: 'from-blue-600 to-indigo-700',
  Economy: 'from-emerald-600 to-teal-700',
  'Mutual Funds': 'from-purple-600 to-pink-700',
  Companies: 'from-amber-600 to-orange-700',
  'Personal Finance': 'from-rose-600 to-red-700',
};

function getGradient(category) {
  return CATEGORY_GRADIENTS[category] || 'from-gray-700 to-gray-900';
}

// ── Fallback Unsplash Photos ──────────────────────────────────────────
const CATEGORY_FALLBACK_IMAGES = {
  Markets: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&auto=format&fit=crop&q=80',
  ],
  Economy: [
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&auto=format&fit=crop&q=80',
  ],
  'Mutual Funds': [
    'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
  ],
  Companies: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  ],
  'Personal Finance': [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
  ],
};

function extractImageUrl(item, category, idx) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  if (item.enclosure && item.enclosure.$ && item.enclosure.$.url) return item.enclosure.$.url;
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item.mediaContent && item.mediaContent.url) return item.mediaContent.url;
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;
  if (item.mediaThumbnail && item.mediaThumbnail.url) return item.mediaThumbnail.url;

  const html = item.content || item.description || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  if (imgMatch && imgMatch[1] && !imgMatch[1].includes('feedburner')) {
    return imgMatch[1];
  }

  const fallbacks = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.Markets;
  return fallbacks[idx % fallbacks.length];
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

// ── Single Feed Fetch ─────────────────────────────────────────────────
async function fetchSingleFeed(feed) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).map((item, idx) => {
      const title = stripHtml(item.title || '');
      const summary = stripHtml(item.contentSnippet || item.content || item.summary || '');
      const category = inferCategory(title, summary, feed.defaultCategory);
      const imageUrl = extractImageUrl(item, category, idx);

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
        imageUrl,
      };
    });
  } catch (err) {
    console.warn(`[NewsService] Failed to fetch ${feed.source}:`, err.message);
    return [];
  }
}

// ── Fast In-Memory Seed Items (Available instantly on startup) ────────
let lastSuccessfulAllItems = [
  {
    id: 'seed-1',
    headline: 'RBI Maintains Repo Rate at 6.5%, Forecasts Strong 7% GDP Growth Runway',
    source: 'Economic Times',
    category: 'Economy',
    timeAgo: '15m ago',
    summary: 'The Monetary Policy Committee unanimously kept key lending rates unchanged, highlighting resilient domestic macro fundamentals and disciplined inflation trajectory.',
    url: 'https://economictimes.indiatimes.com',
    gradient: 'from-emerald-600 to-teal-700',
    readTime: '3 min read',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-2',
    headline: 'Nifty 50 Touches Fresh All-Time High Led by Banking and IT Heavyweights',
    source: 'Mint',
    category: 'Markets',
    timeAgo: '28m ago',
    summary: 'Broad-based buying propelled Indian indices higher as institutional flows and strong corporate earnings continued to attract systematic retail and foreign capital.',
    url: 'https://www.livemint.com',
    gradient: 'from-blue-600 to-indigo-700',
    readTime: '2 min read',
    publishedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-3',
    headline: 'Mutual Fund Monthly SIP Inflows Cross Record ₹24,000 Crore Milestone in India',
    source: 'Economic Times',
    category: 'Mutual Funds',
    timeAgo: '45m ago',
    summary: 'AMFI data indicates sustained disciplined retail compounding with systematic investment plan accounts witnessing record monthly registrations across multi-cap funds.',
    url: 'https://economictimes.indiatimes.com',
    gradient: 'from-purple-600 to-pink-700',
    readTime: '3 min read',
    publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop&q=80',
  },
];

let isRefreshingInBackground = false;

// Background RSS Fetcher (non-blocking)
async function refreshFeedsInBackground() {
  if (isRefreshingInBackground) return;
  isRefreshingInBackground = true;

  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));
    let items = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        items.push(...r.value);
      }
    }

    if (items.length > 0) {
      // Deduplicate
      const seen = new Set();
      items = items.filter((item) => {
        const key = item.headline.toLowerCase().trim().slice(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      lastSuccessfulAllItems = items;

      // Update cache
      newsCache.set('news_all', items.slice(0, 50));
      console.log(`[NewsService] Background RSS sync complete: ${items.length} live articles.`);
    }
  } catch (err) {
    console.warn('[NewsService] Background RSS refresh failed:', err.message);
  } finally {
    isRefreshingInBackground = false;
  }
}

// Pre-warm background cache immediately on startup
setTimeout(refreshFeedsInBackground, 1500);

/**
 * Get News - Stale-While-Revalidate Engine
 * Always responds in < 2ms without blocking the client on slow network feeds.
 */
export async function getNews(category, forceRefresh = false) {
  const cacheKey = `news_${category || 'all'}`;

  if (!forceRefresh) {
    const cached = newsCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Trigger background revalidation if expired
  void refreshFeedsInBackground();

  // Instantly return from persistent in-memory articles
  let filtered = lastSuccessfulAllItems;
  if (category && category !== 'All') {
    filtered = filtered.filter((item) => item.category === category);
  }

  filtered = filtered.slice(0, 50);
  newsCache.set(cacheKey, filtered);
  return filtered;
}

export function invalidateNewsCache() {
  newsCache.flushAll();
}
