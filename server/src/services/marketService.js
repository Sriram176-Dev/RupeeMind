import YahooFinance from 'yahoo-finance2';
import NodeCache from 'node-cache';
import { getMarketStatus } from '../utils/marketHours.js';
import { NIFTY_50_SYMBOLS, TRACKED_INDICES } from '../config/marketUniverse.js';

// Instantiate YahooFinance v4 client with notice suppression
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

// Cache instance
const cache = new NodeCache({ stdTTL: 15, checkperiod: 60 });
// Sparkline cache (cache real sparkline points for 1 hour)
const sparklineCache = new NodeCache({ stdTTL: 3600 });
// In-flight promise coalescing map
const inFlightRequests = new Map();
// Last known values fallback cache (persists indefinitely for stale fallbacks)
const fallbackCache = new Map();

// Known NIFTY 50 clean symbols for tagging
const NIFTY_50_SET = new Set(NIFTY_50_SYMBOLS.map((s) => s.replace(/\.NS$/, '')));

/**
 * Symbol sanitization and validation
 */
export function sanitizeSymbol(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().toUpperCase();

  // Validate whitelist: letters, digits, &, -, ^, .
  const isValid = /^[A-Z0-9&.\-^]{1,25}$/.test(trimmed);
  if (!isValid) return '';

  return trimmed;
}

/**
 * Format symbol for Yahoo Finance (adds .NS if no suffix and not an index)
 */
export function toYahooSymbol(symbol) {
  const sanitized = sanitizeSymbol(symbol);
  if (!sanitized) return '';
  if (sanitized.startsWith('^') || sanitized.endsWith('.NS') || sanitized.endsWith('.BO')) {
    return sanitized;
  }
  return `${sanitized}.NS`;
}

/**
 * Convert Yahoo symbol back to base Indian symbol
 */
export function toCleanSymbol(yahooSymbol) {
  if (!yahooSymbol) return '';
  if (yahooSymbol.startsWith('^')) return yahooSymbol;
  return yahooSymbol.replace(/\.(NS|BO)$/i, '');
}

/**
 * Exponential backoff retry wrapper
 */
async function fetchWithRetry(fn, retries = 2, delayMs = 500) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

/**
 * Coalesced fetch with caching and graceful stale fallback
 */
async function cachedOrFetch(cacheKey, ttlSeconds, fetcher) {
  // 1. Check active cache
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return { data: cached, stale: false, fromCache: true };
  }

  // 2. Coalesce in-flight requests for identical key
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const freshData = await fetchWithRetry(fetcher, 2, 400);
      cache.set(cacheKey, freshData, ttlSeconds);
      fallbackCache.set(cacheKey, { data: freshData, savedAt: new Date().toISOString() });
      return { data: freshData, stale: false, fromCache: false };
    } catch (error) {
      console.warn(`[MarketService] Upstream fetch failed for ${cacheKey}: ${error?.message || error}`);
      // Fallback to last known data if available
      const fallback = fallbackCache.get(cacheKey);
      if (fallback) {
        return { data: fallback.data, stale: true, fromCache: true, lastSavedAt: fallback.savedAt };
      }
      throw error;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Fetch real sparkline points for a symbol (7-day daily closes)
 */
async function getRealSparkline(yahooSymbol) {
  const cached = sparklineCache.get(yahooSymbol);
  if (cached) return cached;

  try {
    const period1 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const chart = await yahooFinance.chart(yahooSymbol, {
      interval: '1d',
      period1,
    });
    const closes = (chart.quotes || [])
      .map((q) => q.close)
      .filter((c) => typeof c === 'number' && !isNaN(c));

    if (closes.length >= 2) {
      const points = closes.slice(-7).map((p) => Number(p.toFixed(2)));
      sparklineCache.set(yahooSymbol, points);
      return points;
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Transform Yahoo quote object to Rupee Mind StockQuote
 */
function transformQuote(q) {
  const cleanSym = toCleanSymbol(q.symbol);
  const price = Number((q.regularMarketPrice ?? q.regularMarketPreviousClose ?? 0).toFixed(2));
  const prevClose = Number((q.regularMarketPreviousClose ?? price).toFixed(2));
  const change = Number((q.regularMarketChange ?? (price - prevClose)).toFixed(2));
  const changePercent = Number((q.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0)).toFixed(2));
  const dayHigh = Number((q.regularMarketDayHigh ?? Math.max(price, prevClose)).toFixed(2));
  const dayLow = Number((q.regularMarketDayLow ?? Math.min(price, prevClose)).toFixed(2));
  const fiftyTwoWeekHigh = Number((q.fiftyTwoWeekHigh ?? dayHigh).toFixed(2));
  const fiftyTwoWeekLow = Number((q.fiftyTwoWeekLow ?? dayLow).toFixed(2));
  const volume = q.regularMarketVolume ?? 0;
  const marketCap = q.marketCap ? Math.round(q.marketCap / 10000000) : 0; // Convert to Crores
  const isNifty50 = NIFTY_50_SET.has(cleanSym);

  // Sparkline from cache if present, else minimal real 2-point array [prevClose, price]
  const cachedSpark = sparklineCache.get(q.symbol);
  const sparkline = cachedSpark && cachedSpark.length > 0 ? cachedSpark : [prevClose, price];

  return {
    symbol: cleanSym,
    yahooSymbol: q.symbol,
    companyName: q.shortName || q.longName || cleanSym,
    price,
    change,
    changePercent,
    volume,
    dayHigh,
    dayLow,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    previousClose: prevClose,
    marketCap,
    sector: q.sector || '—',
    marketState: q.marketState || (getMarketStatus().isOpen ? 'REGULAR' : 'CLOSED'),
    isNifty50,
    sparkline,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get Quotes for a list of symbols (Batched)
 * Defaults to the tracked Nifty 50 universe if no symbols provided.
 */
export async function getQuotes(rawSymbols = []) {
  const symbolsToFetch =
    Array.isArray(rawSymbols) && rawSymbols.length > 0
      ? rawSymbols.map(sanitizeSymbol).filter(Boolean).slice(0, 50)
      : NIFTY_50_SYMBOLS.map(toCleanSymbol);

  if (symbolsToFetch.length === 0) {
    return { data: [], stale: false, lastUpdated: new Date().toISOString() };
  }

  const yahooSymbols = symbolsToFetch.map(toYahooSymbol);
  const cacheKey = `quotes:${yahooSymbols.sort().join(',')}`;
  const isOpen = getMarketStatus().isOpen;
  const ttl = isOpen ? 15 : 300; // 15s during market hours, 5 min when closed

  try {
    const result = await cachedOrFetch(cacheKey, ttl, async () => {
      // Yahoo quote supports array of symbols in one single HTTP request
      const rawResults = await yahooFinance.quote(yahooSymbols);
      const list = Array.isArray(rawResults) ? rawResults : [rawResults].filter(Boolean);
      return list.map(transformQuote);
    });

    return {
      data: result.data,
      stale: result.stale,
      delayed: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[MarketService] Error fetching quotes:', error);
    return {
      data: [],
      stale: true,
      delayed: true,
      error: error?.message || 'Failed to fetch live quotes',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get Quote for a single stock or index symbol
 */
export async function getQuote(rawSymbol) {
  if (!rawSymbol) return null;
  const clean = toCleanSymbol(rawSymbol);
  const result = await getQuotes([clean]);
  if (result.data && result.data.length > 0) {
    return result.data[0];
  }
  return null;
}

/**
 * Get Major Indian Market Indices
 */
export async function getIndices() {
  const symbols = TRACKED_INDICES.map((i) => i.symbol);
  const cacheKey = `indices:${symbols.join(',')}`;
  const isOpen = getMarketStatus().isOpen;
  const ttl = isOpen ? 15 : 300;

  try {
    const result = await cachedOrFetch(cacheKey, ttl, async () => {
      const quotes = await yahooFinance.quote(symbols);
      const list = Array.isArray(quotes) ? quotes : [quotes].filter(Boolean);

      return TRACKED_INDICES.map((idx) => {
        const q = list.find((item) => item.symbol === idx.symbol);
        const price = q?.regularMarketPrice ?? 0;
        const prevClose = q?.regularMarketPreviousClose ?? price;
        const change = q?.regularMarketChange ?? (price - prevClose);
        const changePercent = q?.regularMarketChangePercent ?? (prevClose ? (change / prevClose) * 100 : 0);

        const cachedSpark = sparklineCache.get(idx.symbol);
        const sparkline = cachedSpark && cachedSpark.length > 0 ? cachedSpark : [prevClose, price];

        return {
          symbol: idx.cleanSymbol,
          yahooSymbol: idx.symbol,
          name: idx.name,
          value: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          high: Number((q?.regularMarketDayHigh ?? price).toFixed(2)),
          low: Number((q?.regularMarketDayLow ?? price).toFixed(2)),
          sparkline,
        };
      });
    });

    return {
      data: result.data,
      stale: result.stale,
      delayed: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[MarketService] Error fetching indices:', error);
    return {
      data: [],
      stale: true,
      delayed: true,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get Historical Chart Data
 */
export async function getHistory(rawSymbol, range = '1M') {
  const yfSymbol = toYahooSymbol(rawSymbol);
  if (!yfSymbol) {
    throw new Error('Invalid stock symbol');
  }

  const upperRange = range.toUpperCase();
  const cacheKey = `history:${yfSymbol}:${upperRange}`;

  let interval = '1d';
  let period1 = new Date();
  let isIntraday = false;

  const now = new Date();
  if (upperRange === '1D') {
    interval = '5m';
    period1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days to cover market opening
    isIntraday = true;
  } else if (upperRange === '1W') {
    interval = '30m';
    period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    isIntraday = true;
  } else if (upperRange === '1M') {
    interval = '1d';
    period1 = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);
  } else if (upperRange === '1Y') {
    interval = '1d';
    period1 = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
  } else if (upperRange === '5Y') {
    interval = '1wk';
    period1 = new Date(now.getTime() - 5 * 366 * 24 * 60 * 60 * 1000);
  } else {
    interval = '1d';
    period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const ttl = isIntraday ? 300 : 3600; // 5 min for intraday, 1 hour for daily/weekly

  try {
    const result = await cachedOrFetch(cacheKey, ttl, async () => {
      const chartResult = await yahooFinance.chart(yfSymbol, {
        interval,
        period1: period1.toISOString().split('T')[0],
      });

      const quotes = chartResult.quotes || [];
      const pricePoints = quotes
        .filter((q) => q.close !== null && q.close !== undefined)
        .map((q) => {
          const dateObj = new Date(q.date);
          const dateStr = isIntraday
            ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
            : dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: upperRange === '5Y' ? '2-digit' : undefined });

          return {
            date: dateStr,
            fullDate: dateObj.toISOString(),
            price: Number(q.close.toFixed(2)),
            open: Number((q.open ?? q.close).toFixed(2)),
            high: Number((q.high ?? q.close).toFixed(2)),
            low: Number((q.low ?? q.close).toFixed(2)),
            close: Number(q.close.toFixed(2)),
            volume: q.volume || 0,
          };
        });

      // Update sparkline cache if we fetched recent 1M daily data
      if (upperRange === '1M' && pricePoints.length >= 7) {
        const last7 = pricePoints.slice(-7).map((p) => p.price);
        sparklineCache.set(yfSymbol, last7);
      }

      return pricePoints;
    });

    return {
      data: result.data,
      stale: result.stale,
      symbol: toCleanSymbol(rawSymbol),
      range: upperRange,
      delayed: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[MarketService] Error fetching history for ${rawSymbol}:`, error);
    return {
      data: [],
      stale: true,
      symbol: toCleanSymbol(rawSymbol),
      range: upperRange,
      delayed: true,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Fetch ~2 years of raw daily OHLCV history for indicator and backtesting calculations
 */
export async function getRawDailyHistory(rawSymbol, years = 2) {
  const yfSymbol = toYahooSymbol(rawSymbol);
  if (!yfSymbol) throw new Error('Invalid symbol');

  const cacheKey = `raw_daily:${yfSymbol}:${years}y`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const startDate = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const chart = await yahooFinance.chart(yfSymbol, {
    interval: '1d',
    period1: startDate,
  });

  const quotes = (chart.quotes || [])
    .filter((q) => q.close !== null && q.close !== undefined && q.open !== null)
    .map((q) => ({
      date: new Date(q.date),
      dateStr: new Date(q.date).toISOString().split('T')[0],
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume || 0,
    }));

  cache.set(cacheKey, quotes, 1800); // 30 min cache
  return quotes;
}

/**
 * Search Symbols — supports the full NSE/BSE universe via Yahoo Finance search()
 * plus a direct quote() fallback for tickers not indexed in Yahoo search
 * (e.g. ZOMATO was renamed to ETERNAL, PAYTM, IRFC, newer listings etc.)
 */
export async function searchSymbols(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { data: [] };
  }

  const q = query.trim();
  const cacheKey = `search:${q.toLowerCase()}`;

  const mapItem = (item) => ({
    symbol: toCleanSymbol(item.symbol),
    yahooSymbol: item.symbol,
    name: item.shortName || item.shortname || item.longName || item.longname || item.symbol,
    exchange: item.exchange || 'NSI',
    type: item.quoteType || 'EQUITY',
    sector: item.sector || '—',
    industry: item.industry || '—',
  });

  try {
    const result = await cachedOrFetch(cacheKey, 600, async () => {
      const searchRes = await yahooFinance.search(q, { newsCount: 0 });
      const quotes = searchRes.quotes || [];

      // Prefer Indian exchange results; fall back to all Yahoo Finance entries
      const indian = quotes.filter((item) => {
        const sym = item.symbol || '';
        const exch = item.exchange || '';
        return (
          sym.endsWith('.NS') ||
          sym.endsWith('.BO') ||
          exch === 'NSI' ||
          exch === 'BSE' ||
          exch === 'NSE' ||
          exch === 'BOM'
        );
      });

      const candidates = indian.length > 0 ? indian : quotes.filter((i) => i.isYahooFinance);
      return candidates.slice(0, 12).map(mapItem);
    });

    // If search returned no usable symbols, try a direct .NS / .BO quote lookup as fallback.
    // This handles renamed tickers and any stock Yahoo search hasn't indexed yet.
    const hasValid = Array.isArray(result.data) && result.data.some((r) => r.symbol && r.symbol.length > 0);
    if (!hasValid) {
      const baseSymbol = q.toUpperCase().replace(/\.(NS|BO)$/i, '');
      for (const suffix of ['.NS', '.BO']) {
        try {
          const directQuote = await yahooFinance.quote(baseSymbol + suffix);
          if (directQuote && directQuote.symbol) {
            return { data: [mapItem(directQuote)] };
          }
        } catch {
          // continue to next suffix
        }
      }
    }

    return { data: result.data };
  } catch (error) {
    console.error(`[MarketService] Search error for ${q}:`, error);
    return { data: [] };
  }
}
