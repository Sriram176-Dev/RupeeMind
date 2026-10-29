import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Fund } from '../models/Fund.js';
import {
  MFAPI_BASE_URL,
  PRIORITY_AMCS,
  FUND_SYNC_MAX,
  normalizeCategory,
  getIndicativeRisk,
} from '../config/fundConfig.js';
import { calculateFundMetrics } from '../services/fundService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rupeemind';

/**
 * Concurrency runner helper (limit max concurrent promises)
 */
async function mapConcurrent(items, limit, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        const res = await fn(items[i], i);
        results[i] = res;
      } catch (err) {
        results[i] = { error: err.message };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Retry helper with exponential backoff
 */
async function fetchWithBackoff(url, retries = 3, delay = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'RupeeMind/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
}

export async function syncMutualFunds(maxLimit = FUND_SYNC_MAX) {
  console.log(`[FundSync] Starting mutual funds synchronization from ${MFAPI_BASE_URL}...`);
  const startTime = Date.now();

  // 1. Fetch entire scheme master list
  const masterUrl = `${MFAPI_BASE_URL}/mf`;
  const allSchemes = await fetchWithBackoff(masterUrl);
  console.log(`[FundSync] Total AMFI schemes discovered: ${allSchemes.length}`);

  // 2. Filter: Direct Plan + Growth Option only
  const directGrowthSchemes = allSchemes.filter((s) => {
    const name = (s.schemeName || '').toLowerCase();
    const isDirect = name.includes('direct') || name.includes('- dir ') || name.includes(' dir -');
    const isGrowth = (name.includes('growth') || name.includes(' gr') || name.includes('-gr')) && !name.includes('dividend') && !name.includes('idcw');
    return isDirect && isGrowth;
  });
  console.log(`[FundSync] Direct-Growth schemes filtered: ${directGrowthSchemes.length}`);

  // 3. Prioritize by major AMCs
  const prioritized = [];
  const others = [];

  for (const s of directGrowthSchemes) {
    const name = s.schemeName.toLowerCase();
    const isPriority = PRIORITY_AMCS.some((amc) => {
      const amcPrefix = amc.toLowerCase().replace(' mutual fund', '').replace(' asset', '');
      return name.includes(amcPrefix);
    });

    if (isPriority) {
      prioritized.push(s);
    } else {
      others.push(s);
    }
  }

  const candidateSchemes = [...prioritized, ...others].slice(0, maxLimit);
  console.log(`[FundSync] Selected top ${candidateSchemes.length} schemes for detailed processing (Concurrency: 5)...`);

  // 4. Fetch details in batches with concurrency limit 5
  let savedCount = 0;
  let skippedCount = 0;

  await mapConcurrent(candidateSchemes, 5, async (scheme, idx) => {
    const schemeCode = scheme.schemeCode.toString();
    try {
      const detail = await fetchWithBackoff(`${MFAPI_BASE_URL}/mf/${schemeCode}`, 2, 400);
      const meta = detail?.meta;
      const navData = detail?.data;

      if (!meta || !Array.isArray(navData) || navData.length < 180) {
        // Skip funds with less than ~6 months / 1 year history
        skippedCount++;
        return;
      }

      const name = meta.scheme_name || scheme.schemeName;
      const rawCategory = meta.scheme_category || '';
      const category = normalizeCategory(rawCategory, name);
      const riskLevel = getIndicativeRisk(category, name);
      const fundHouse = meta.fund_house || 'Indian Mutual Fund';

      // Clean scheme code / slug for URLs
      const code = `mf_${schemeCode}`;

      // Calculate real metrics from NAV history
      const metrics = calculateFundMetrics(navData);

      await Fund.findOneAndUpdate(
        { schemeCode },
        {
          schemeCode,
          code,
          name,
          fundHouse,
          category,
          rawCategory,
          riskLevel,
          nav: metrics.latestNav,
          navDate: metrics.navDate,
          cagr1Y: metrics.cagr1Y,
          cagr3Y: metrics.cagr3Y,
          cagr5Y: metrics.cagr5Y,
          volatility: metrics.volatility,
          maxDrawdown: metrics.maxDrawdown,
          sharpeRatio: metrics.sharpeRatio,
          expenseRatio: null, // No free source
          aum: null, // No free source
          navHistory: metrics.navHistorySample,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      savedCount++;
      if (savedCount % 20 === 0 || savedCount === candidateSchemes.length) {
        console.log(`[FundSync] Progress: ${savedCount}/${candidateSchemes.length} saved (${skippedCount} skipped)...`);
      }
    } catch (err) {
      skippedCount++;
    }
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[FundSync] Sync complete! Successfully stored ${savedCount} mutual funds in ${durationSec}s (${skippedCount} skipped).`);
  return { savedCount, skippedCount, durationSec };
}

// Standalone execution script
if (process.argv[1]?.endsWith('syncFunds.js')) {
  (async () => {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log(`[FundSync] Connected to MongoDB: ${MONGODB_URI}`);
      await syncMutualFunds();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[FundSync] Fatal error:', err);
      process.exit(1);
    }
  })();
}
