import { Fund } from '../models/Fund.js';
import { MFAPI_BASE_URL, normalizeCategory, getIndicativeRisk, RISK_FREE_RATE } from '../config/fundConfig.js';

/**
 * Parse DD-MM-YYYY date format from mfapi
 */
export function parseMfDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Calculate financial metrics from NAV history
 * navEntries is array of { date: 'DD-MM-YYYY', nav: '12.34' } sorted newest first
 */
export function calculateFundMetrics(navEntries, riskFreeRate = RISK_FREE_RATE) {
  if (!Array.isArray(navEntries) || navEntries.length < 30) {
    return {
      latestNav: navEntries?.[0]?.nav ? parseFloat(navEntries[0].nav) : 0,
      navDate: navEntries?.[0]?.date || '',
      cagr1Y: null,
      cagr3Y: null,
      cagr5Y: null,
      volatility: null,
      maxDrawdown: null,
      sharpeRatio: null,
      navHistorySample: [],
    };
  }

  const parsed = navEntries
    .map((item) => ({
      dateObj: parseMfDate(item.date),
      dateStr: item.date,
      nav: parseFloat(item.nav),
    }))
    .filter((item) => item.dateObj && !isNaN(item.nav) && item.nav > 0);

  if (parsed.length === 0) {
    return {
      latestNav: 0,
      navDate: '',
      cagr1Y: null,
      cagr3Y: null,
      cagr5Y: null,
      volatility: null,
      maxDrawdown: null,
      sharpeRatio: null,
      navHistorySample: [],
    };
  }

  // parsed is newest first (index 0 is latest)
  const latest = parsed[0];
  const latestDate = latest.dateObj.getTime();
  const latestNav = latest.nav;

  // Helper to find NAV entry closest to N years ago
  function getHistoricalNav(years) {
    const targetTime = latestDate - years * 365.25 * 24 * 60 * 60 * 1000;
    // Tolerance: within +/- 45 days
    const toleranceMs = 45 * 24 * 60 * 60 * 1000;

    let closest = null;
    let minDiff = Infinity;

    for (let i = 1; i < parsed.length; i++) {
      const diff = Math.abs(parsed[i].dateObj.getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = parsed[i];
      }
    }

    if (closest && minDiff <= toleranceMs && closest.nav > 0) {
      const actualYears = (latestDate - closest.dateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (actualYears >= years * 0.85) {
        const cagr = (Math.pow(latestNav / closest.nav, 1 / actualYears) - 1) * 100;
        return Number(cagr.toFixed(2));
      }
    }
    return null;
  }

  const cagr1Y = getHistoricalNav(1);
  const cagr3Y = getHistoricalNav(3);
  const cagr5Y = getHistoricalNav(5);

  // Entries within 1 year and 3 years
  const oneYearEntries = parsed.filter(
    (item) => latestDate - item.dateObj.getTime() <= 365.25 * 24 * 60 * 60 * 1000
  );
  const threeYearEntries = parsed.filter(
    (item) => latestDate - item.dateObj.getTime() <= 3 * 365.25 * 24 * 60 * 60 * 1000
  );

  let volatility = null;
  if (threeYearEntries.length >= 60) {
    // Calculate daily log returns (chronological: reverse slice)
    const chrono = [...threeYearEntries].reverse();
    const dailyReturns = [];
    for (let i = 1; i < chrono.length; i++) {
      if (chrono[i - 1].nav > 0 && chrono[i].nav > 0) {
        dailyReturns.push(Math.log(chrono[i].nav / chrono[i - 1].nav));
      }
    }

    if (dailyReturns.length >= 50) {
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance =
        dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1);
      const dailyStd = Math.sqrt(variance);
      // Annualize with sqrt(252 trading days)
      const annualVol = dailyStd * Math.sqrt(252) * 100;
      volatility = Number(annualVol.toFixed(2));
    }
  }

  // Max Drawdown over all available history
  let maxDrawdown = null;
  if (parsed.length >= 60) {
    const chronoAll = [...parsed].reverse();
    let peak = chronoAll[0].nav;
    let maxDd = 0;

    for (let i = 0; i < chronoAll.length; i++) {
      const current = chronoAll[i].nav;
      if (current > peak) {
        peak = current;
      }
      const dd = ((peak - current) / peak) * 100;
      if (dd > maxDd) {
        maxDd = dd;
      }
    }
    maxDrawdown = Number(maxDd.toFixed(2));
  }

  // Sharpe Ratio = (3Y CAGR - RiskFreeRate) / Volatility
  let sharpeRatio = null;
  const returnForSharpe = cagr3Y !== null ? cagr3Y : cagr1Y;
  if (returnForSharpe !== null && volatility !== null && volatility > 0) {
    const rfPct = riskFreeRate * 100;
    const sharpe = (returnForSharpe - rfPct) / volatility;
    sharpeRatio = Number(sharpe.toFixed(2));
  }

  // Sample NAV history for charting (1 point every 7 days for the past 1 year)
  const navHistorySample = oneYearEntries
    .filter((_, idx) => idx % 5 === 0 || idx === 0)
    .reverse()
    .map((item) => ({
      date: item.dateStr,
      nav: Number(item.nav.toFixed(2)),
    }));

  return {
    latestNav: Number(latestNav.toFixed(2)),
    navDate: latest.dateStr,
    cagr1Y,
    cagr3Y,
    cagr5Y,
    volatility,
    maxDrawdown,
    sharpeRatio,
    navHistorySample,
  };
}

/**
 * Fetch raw scheme detail from mfapi.in
 */
export async function fetchSchemeDetailFromMfApi(schemeCode) {
  const url = `${MFAPI_BASE_URL}/mf/${schemeCode}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'RupeeMind/1.0' },
  });
  if (!response.ok) {
    throw new Error(`mfapi.in returned HTTP ${response.status} for scheme ${schemeCode}`);
  }
  return await response.json();
}

/**
 * Query funds with rich filtering, sorting, pagination
 */
export async function getFundsList(filters = {}) {
  const query = {};

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: regex }, { fundHouse: regex }, { category: regex }, { schemeCode: regex }];
  }

  if (filters.category && filters.category !== 'All') {
    query.category = filters.category;
  }

  if (filters.riskLevel && filters.riskLevel !== 'All') {
    query.riskLevel = filters.riskLevel;
  }

  if (filters.fundHouse && filters.fundHouse !== 'All') {
    query.fundHouse = new RegExp(filters.fundHouse.trim(), 'i');
  }

  if (filters.min3YReturn !== undefined && filters.min3YReturn !== null) {
    query.cagr3Y = { $gte: parseFloat(filters.min3YReturn) };
  }

  let sort = { cagr3Y: -1 };
  if (filters.sortBy) {
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    sort = { [filters.sortBy]: order };
  }

  const page = Math.max(1, parseInt(filters.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit || '50', 10)));
  const skip = (page - 1) * limit;

  const [funds, total] = await Promise.all([
    Fund.find(query).select('-navHistory').sort(sort).skip(skip).limit(limit).lean(),
    Fund.countDocuments(query),
  ]);

  return {
    data: funds.map(formatFundDocument),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get single fund by code or schemeCode
 */
export async function getFundByCode(code) {
  if (!code) return null;
  const cleanCode = code.toString().trim();
  const fund = await Fund.findOne({
    $or: [{ code: cleanCode }, { schemeCode: cleanCode }],
  }).lean();

  if (!fund) return null;

  const formatted = formatFundDocument(fund);

  // Downsample navHistory to at most 500 points for the frontend chart
  if (formatted.navHistory && formatted.navHistory.length > 500) {
    const step = Math.ceil(formatted.navHistory.length / 500);
    formatted.navHistory = formatted.navHistory.filter((_, idx) => idx % step === 0 || idx === formatted.navHistory.length - 1);
  }

  return formatted;
}

/**
 * Compare multiple funds
 */
export async function compareFunds(codes = []) {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  const cleanCodes = codes.map((c) => c.toString().trim());
  const funds = await Fund.find({
    $or: [{ code: { $in: cleanCodes } }, { schemeCode: { $in: cleanCodes } }],
  }).select('-navHistory').lean();

  return funds.map(formatFundDocument);
}

/**
 * Format MongoDB document to standard frontend MutualFund structure
 */
function formatFundDocument(doc) {
  return {
    code: doc.code || doc.schemeCode,
    schemeCode: doc.schemeCode,
    name: doc.name,
    fundHouse: doc.fundHouse,
    category: doc.category,
    riskLevel: doc.riskLevel,
    nav: doc.nav,
    navDate: doc.navDate,
    cagr1Y: doc.cagr1Y,
    cagr3Y: doc.cagr3Y,
    cagr5Y: doc.cagr5Y,
    volatility: doc.volatility,
    maxDrawdown: doc.maxDrawdown,
    sharpeRatio: doc.sharpeRatio,
    expenseRatio: doc.expenseRatio, // null -> UI shows '—'
    aum: doc.aum, // null -> UI shows '—'
    navHistory: doc.navHistory || [],
  };
}
