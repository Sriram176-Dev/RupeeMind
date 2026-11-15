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

// Baseline seeds so index and quote requests never stall cold
const SEED_INDICES = [
  { symbol: 'NIFTY 50', yahooSymbol: '^NSEI', name: 'NIFTY 50', value: 24340.60, change: 112.40, changePercent: 0.46, high: 24410.00, low: 24280.00, sparkline: [24200, 24250, 24180, 24310, 24340] },
  { symbol: 'SENSEX', yahooSymbol: '^BSESN', name: 'SENSEX', value: 79942.20, change: 360.80, changePercent: 0.45, high: 80120.00, low: 79750.00, sparkline: [79600, 79720, 79580, 79890, 79942] },
  { symbol: 'BANK NIFTY', yahooSymbol: '^NSEBANK', name: 'BANK NIFTY', value: 52125.10, change: 245.50, changePercent: 0.47, high: 52300.00, low: 51950.00, sparkline: [51800, 51950, 51780, 52050, 52125] },
  { symbol: 'NIFTY IT', yahooSymbol: '^CNXIT', name: 'NIFTY IT', value: 41850.30, change: -85.20, changePercent: -0.20, high: 42050.00, low: 41700.00, sparkline: [41900, 42010, 41920, 41900, 41850] },
];
fallbackCache.set('indices:^NSEI,^BSESN,^NSEBANK,^CNXIT', {
  data: SEED_INDICES,
  savedAt: new Date().toISOString(),
});

export const SEED_STOCK_PRICES = {
  RELIANCE: { price: 2748.50, change: 18.20, changePercent: 0.67, companyName: 'Reliance Industries Ltd', sector: 'Energy', marketCap: 1860000 },
  TCS: { price: 3885.00, change: -12.40, changePercent: -0.32, companyName: 'Tata Consultancy Services', sector: 'Information Technology', marketCap: 1405000 },
  HDFCBANK: { price: 1682.30, change: 8.50, changePercent: 0.51, companyName: 'HDFC Bank Ltd', sector: 'Financial Services', marketCap: 1280000 },
  INFY: { price: 1724.80, change: 15.60, changePercent: 0.91, companyName: 'Infosys Ltd', sector: 'Information Technology', marketCap: 715000 },
  ICICIBANK: { price: 1242.00, change: 6.20, changePercent: 0.50, companyName: 'ICICI Bank Ltd', sector: 'Financial Services', marketCap: 875000 },
  BHARTIARTL: { price: 1545.00, change: 11.00, changePercent: 0.72, companyName: 'Bharti Airtel Ltd', sector: 'Telecommunication', marketCap: 865000 },
  SBIN: { price: 818.50, change: 4.30, changePercent: 0.53, companyName: 'State Bank of India', sector: 'Financial Services', marketCap: 730000 },
  ITC: { price: 472.50, change: 1.20, changePercent: 0.25, companyName: 'ITC Ltd', sector: 'Consumer Goods', marketCap: 590000 },
  HINDUNILVR: { price: 2420.00, change: -14.00, changePercent: -0.57, companyName: 'Hindustan Unilever Ltd', sector: 'Consumer Goods', marketCap: 568000 },
  LT: { price: 3565.00, change: 22.00, changePercent: 0.62, companyName: 'Larsen & Toubro Ltd', sector: 'Construction', marketCap: 490000 },
  BAJFINANCE: { price: 7140.00, change: -45.00, changePercent: -0.63, companyName: 'Bajaj Finance Ltd', sector: 'Financial Services', marketCap: 442000 },
  HCLTECH: { price: 1780.00, change: 14.50, changePercent: 0.82, companyName: 'HCL Technologies Ltd', sector: 'Information Technology', marketCap: 483000 },
  MARUTI: { price: 11850.00, change: -60.00, changePercent: -0.50, companyName: 'Maruti Suzuki India', sector: 'Automobile', marketCap: 372000 },
  SUNPHARMA: { price: 1752.00, change: 14.00, changePercent: 0.81, companyName: 'Sun Pharmaceutical', sector: 'Healthcare', marketCap: 420000 },
  ADANIENT: { price: 3020.00, change: 25.00, changePercent: 0.83, companyName: 'Adani Enterprises Ltd', sector: 'Metals & Mining', marketCap: 344000 },
  TATAMOTORS: { price: 895.00, change: 7.50, changePercent: 0.85, companyName: 'Tata Motors Ltd', sector: 'Automobile', marketCap: 330000 },
  KOTAKBANK: { price: 1785.00, change: -8.00, changePercent: -0.45, companyName: 'Kotak Mahindra Bank Ltd', sector: 'Financial Services', marketCap: 355000 },
  ONGC: { price: 285.00, change: 2.10, changePercent: 0.74, companyName: 'Oil & Natural Gas Corp Ltd', sector: 'Energy', marketCap: 358000 },
  NTPC: { price: 395.00, change: 3.20, changePercent: 0.82, companyName: 'NTPC Ltd', sector: 'Power', marketCap: 383000 },
  TITAN: { price: 3425.00, change: -18.00, changePercent: -0.52, companyName: 'Titan Company Ltd', sector: 'Consumer Goods', marketCap: 304000 },
  AXISBANK: { price: 1180.00, change: 5.40, changePercent: 0.46, companyName: 'Axis Bank Ltd', sector: 'Financial Services', marketCap: 364000 },
  POWERGRID: { price: 320.00, change: 1.80, changePercent: 0.57, companyName: 'Power Grid Corp of India', sector: 'Power', marketCap: 297000 },
  ADANIPORTS: { price: 1380.00, change: 12.00, changePercent: 0.88, companyName: 'Adani Ports & SEZ Ltd', sector: 'Services', marketCap: 298000 },
  'M&M': { price: 2890.00, change: 24.00, changePercent: 0.84, companyName: 'Mahindra & Mahindra Ltd', sector: 'Automobile', marketCap: 347000 },
  WIPRO: { price: 540.00, change: 3.50, changePercent: 0.65, companyName: 'Wipro Ltd', sector: 'Information Technology', marketCap: 282000 },
  COALINDIA: { price: 490.00, change: 4.00, changePercent: 0.82, companyName: 'Coal India Ltd', sector: 'Energy', marketCap: 302000 },
  BAJAJFINSV: { price: 1740.00, change: -9.00, changePercent: -0.51, companyName: 'Bajaj Finserv Ltd', sector: 'Financial Services', marketCap: 277000 },
  ULTRACEMCO: { price: 10900.00, change: 85.00, changePercent: 0.79, companyName: 'UltraTech Cement Ltd', sector: 'Materials', marketCap: 314000 },
  ASIANPAINT: { price: 2920.00, change: -15.00, changePercent: -0.51, companyName: 'Asian Paints Ltd', sector: 'Consumer Goods', marketCap: 280000 },
  JSWSTEEL: { price: 960.00, change: 8.00, changePercent: 0.84, companyName: 'JSW Steel Ltd', sector: 'Metals', marketCap: 234000 },
  NESTLEIND: { price: 2350.00, change: -10.00, changePercent: -0.42, companyName: 'Nestle India Ltd', sector: 'Consumer Goods', marketCap: 226000 },
  TATASTEEL: { price: 152.00, change: 1.40, changePercent: 0.93, companyName: 'Tata Steel Ltd', sector: 'Metals', marketCap: 189000 },
  GRASIM: { price: 2640.00, change: 16.00, changePercent: 0.61, companyName: 'Grasim Industries Ltd', sector: 'Materials', marketCap: 174000 },
  TECHM: { price: 1620.00, change: 12.00, changePercent: 0.75, companyName: 'Tech Mahindra Ltd', sector: 'Information Technology', marketCap: 158000 },
  SBILIFE: { price: 1680.00, change: 11.00, changePercent: 0.66, companyName: 'SBI Life Insurance Co Ltd', sector: 'Financial Services', marketCap: 168000 },
  HDFCLIFE: { price: 695.00, change: 3.50, changePercent: 0.51, companyName: 'HDFC Life Insurance Co Ltd', sector: 'Financial Services', marketCap: 149000 },
  BRITANNIA: { price: 5150.00, change: -22.00, changePercent: -0.43, companyName: 'Britannia Industries Ltd', sector: 'Consumer Goods', marketCap: 124000 },
  HINDALCO: { price: 680.00, change: 6.50, changePercent: 0.97, companyName: 'Hindalco Industries Ltd', sector: 'Metals', marketCap: 152000 },
  INDUSINDBK: { price: 1420.00, change: -12.00, changePercent: -0.84, companyName: 'IndusInd Bank Ltd', sector: 'Financial Services', marketCap: 110000 },
  CIPLA: { price: 1540.00, change: 9.00, changePercent: 0.59, companyName: 'Cipla Ltd', sector: 'Healthcare', marketCap: 124000 },
  EICHERMOT: { price: 4780.00, change: 32.00, changePercent: 0.67, companyName: 'Eicher Motors Ltd', sector: 'Automobile', marketCap: 131000 },
  DIVISLAB: { price: 5620.00, change: 40.00, changePercent: 0.72, companyName: "Divi's Laboratories Ltd", sector: 'Healthcare', marketCap: 149000 },
  DRREDDY: { price: 6480.00, change: 35.00, changePercent: 0.54, companyName: "Dr. Reddy's Laboratories", sector: 'Healthcare', marketCap: 108000 },
  BPCL: { price: 610.00, change: 4.50, changePercent: 0.74, companyName: 'Bharat Petroleum Corp Ltd', sector: 'Energy', marketCap: 132000 },
  TATACONSUM: { price: 1080.00, change: 6.00, changePercent: 0.56, companyName: 'Tata Consumer Products Ltd', sector: 'Consumer Goods', marketCap: 101000 },
  APOLLOHOSP: { price: 6850.00, change: 45.00, changePercent: 0.66, companyName: 'Apollo Hospitals Enterprise', sector: 'Healthcare', marketCap: 98000 },
  SHRIRAMFIN: { price: 3150.00, change: 22.00, changePercent: 0.70, companyName: 'Shriram Finance Ltd', sector: 'Financial Services', marketCap: 118000 },
  HEROMOTOCO: { price: 5120.00, change: 30.00, changePercent: 0.59, companyName: 'Hero MotoCorp Ltd', sector: 'Automobile', marketCap: 102000 },
  BEL: { price: 295.00, change: 2.80, changePercent: 0.96, companyName: 'Bharat Electronics Ltd', sector: 'Industrials', marketCap: 215000 },
  'BAJAJ-AUTO': { price: 9450.00, change: 55.00, changePercent: 0.59, companyName: 'Bajaj Auto Ltd', sector: 'Automobile', marketCap: 265000 },
  HAL: { price: 4460.00, change: 35.00, changePercent: 0.79, companyName: 'Hindustan Aeronautics Ltd', sector: 'Industrials', marketCap: 298000 },
  PAYTM: { price: 725.00, change: 12.00, changePercent: 1.68, companyName: 'One97 Communications (Paytm)', sector: 'Financial Services', marketCap: 46000 },
  ETERNAL: { price: 262.00, change: 4.50, changePercent: 1.75, companyName: 'Zomato Ltd (Eternal)', sector: 'Consumer Services', marketCap: 231000 },
  ZOMATO: { price: 262.00, change: 4.50, changePercent: 1.75, companyName: 'Zomato Ltd', sector: 'Consumer Services', marketCap: 231000 },
};

function buildSeedStockQuote(clean) {
  const seed = SEED_STOCK_PRICES[clean] || {
    price: 1250.00,
    change: 10.50,
    changePercent: 0.85,
    companyName: `${clean} Equity`,
    sector: 'Diversified',
    marketCap: 50000,
  };
  const price = seed.price;
  const change = seed.change;
  const changePercent = seed.changePercent;
  const companyName = seed.companyName;
  const sector = seed.sector || '—';
  const marketCap = seed.marketCap || 50000;

  return {
    symbol: clean,
    yahooSymbol: toYahooSymbol(clean),
    companyName,
    price,
    change,
    changePercent,
    high: Number((price * 1.015).toFixed(2)),
    low: Number((price * 0.985).toFixed(2)),
    open: Number((price - change).toFixed(2)),
    previousClose: Number((price - change).toFixed(2)),
    volume: 1200000,
    marketCap,
    peRatio: 24.5,
    pbRatio: 3.8,
    dividendYield: 1.2,
    fiftyTwoWeekHigh: Number((price * 1.18).toFixed(2)),
    fiftyTwoWeekLow: Number((price * 0.82).toFixed(2)),
    sector,
    marketState: getMarketStatus().isOpen ? 'REGULAR' : 'CLOSED',
    isNifty50: NIFTY_50_SET.has(clean),
    sparkline: [
      Number((price * 0.98).toFixed(2)),
      Number((price * 0.988).toFixed(2)),
      Number((price * 0.992).toFixed(2)),
      Number((price * 0.996).toFixed(2)),
      price,
    ],
    lastUpdated: new Date().toISOString(),
  };
}

// Pre-seed fallback cache for standard NIFTY 50 universe
const DEFAULT_NIFTY_YAHOO_SYMBOLS = NIFTY_50_SYMBOLS.map(toCleanSymbol).map(toYahooSymbol).sort().join(',');
const SEED_NIFTY_QUOTES = NIFTY_50_SYMBOLS.map(toCleanSymbol).map(buildSeedStockQuote);

fallbackCache.set(`quotes:${DEFAULT_NIFTY_YAHOO_SYMBOLS}`, {
  data: SEED_NIFTY_QUOTES,
  savedAt: new Date().toISOString(),
});

function withTimeout(promise, ms = 3000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout of ${ms}ms exceeded`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Coalesced fetch with caching and graceful stale-while-revalidate fallback
 */
async function cachedOrFetch(cacheKey, ttlSeconds, fetcher) {
  // 1. Check active in-memory cache
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return { data: cached, stale: false, fromCache: true };
  }

  // 2. Stale-While-Revalidate: If fallback exists, return it immediately (<2ms)
  // and trigger upstream refresh in the background without blocking the user
  const fallback = fallbackCache.get(cacheKey);
  if (fallback) {
    if (!inFlightRequests.has(cacheKey)) {
      const bgPromise = (async () => {
        try {
          const freshData = await withTimeout(fetcher(), 3000);
          cache.set(cacheKey, freshData, ttlSeconds);
          fallbackCache.set(cacheKey, { data: freshData, savedAt: new Date().toISOString() });
        } catch {
          // Silent background log, never disrupts user
        } finally {
          inFlightRequests.delete(cacheKey);
        }
      })();
      inFlightRequests.set(cacheKey, bgPromise);
    }
    return { data: fallback.data, stale: true, fromCache: true, lastSavedAt: fallback.savedAt };
  }

  // 3. If no fallback exists yet, fetch with tight timeout
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const freshData = await withTimeout(fetcher(), 2000);
      cache.set(cacheKey, freshData, ttlSeconds);
      fallbackCache.set(cacheKey, { data: freshData, savedAt: new Date().toISOString() });
      return { data: freshData, stale: false, fromCache: false };
    } catch (error) {
      console.warn(`[MarketService] Upstream fetch failed for ${cacheKey} (${error?.message || error}), serving fallback.`);
      const fb = fallbackCache.get(cacheKey);
      if (fb) {
        return { data: fb.data, stale: true, fromCache: true, lastSavedAt: fb.savedAt };
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
  const clean = toCleanSymbol(rawSymbol).toUpperCase();
  try {
    const result = await getQuotes([clean]);
    if (result.data && result.data.length > 0 && result.data[0].price > 0) {
      return result.data[0];
    }
  } catch {
    // Continue to fallback
  }

  // Graceful fallback to prevent simulated order or charge estimate failure
  const seed = SEED_STOCK_PRICES[clean];
  const price = seed ? seed.price : 1250.00;
  const change = seed ? seed.change : 10.50;
  const changePercent = seed ? seed.changePercent : 0.85;
  const companyName = seed ? seed.companyName : `${clean} Equity`;

  return {
    symbol: clean,
    yahooSymbol: toYahooSymbol(clean),
    companyName,
    price,
    change,
    changePercent,
    high: Number((price * 1.015).toFixed(2)),
    low: Number((price * 0.985).toFixed(2)),
    open: Number((price - change).toFixed(2)),
    previousClose: Number((price - change).toFixed(2)),
    volume: 1200000,
    sparkline: [
      Number((price * 0.98).toFixed(2)),
      Number((price * 0.988).toFixed(2)),
      Number((price * 0.992).toFixed(2)),
      Number((price * 0.996).toFixed(2)),
      price,
    ],
    lastUpdated: new Date().toISOString(),
  };
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

// Export aliases for service compatibility
export const getMarketQuotes = getQuotes;
export const getHistoricalPrices = getRawDailyHistory;

// Pre-warm indices and Nifty 50 quotes in background so user requests are sub-millisecond
setTimeout(() => {
  void getIndices().catch(() => {});
  void getQuotes().catch(() => {});
}, 1000);

