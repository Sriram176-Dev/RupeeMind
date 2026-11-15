import { Holding } from '../models/Holding.js';
import { Profile } from '../models/Profile.js';
import { getTaxAssetClass } from '../config/taxRules.js';

// Capital market assumptions for asset classes in India
export const ASSET_SPECS = {
  EQUITY: { expectedReturn: 0.145, volatility: 0.180, label: 'Equity' },
  DEBT: { expectedReturn: 0.075, volatility: 0.045, label: 'Debt' },
  GOLD: { expectedReturn: 0.100, volatility: 0.120, label: 'Gold' },
  CASH: { expectedReturn: 0.055, volatility: 0.005, label: 'Cash / Liquid' },
};

// Cross-asset correlation matrix for Indian markets
export const CORRELATION_MATRIX = {
  EQUITY: { EQUITY: 1.0, DEBT: -0.12, GOLD: 0.08, CASH: 0.0 },
  DEBT: { EQUITY: -0.12, DEBT: 1.0, GOLD: 0.10, CASH: 0.0 },
  GOLD: { EQUITY: 0.08, DEBT: 0.10, GOLD: 1.0, CASH: 0.0 },
  CASH: { EQUITY: 0.0, DEBT: 0.0, GOLD: 0.0, CASH: 1.0 },
};

export const RISK_FREE_RATE = 0.065; // 6.5% Indian 10Y G-Sec benchmark

/**
 * Calculates portfolio expected return and annualized volatility
 * @param {{ equity: number, debt: number, gold: number, cash: number }} weights Normalized fractions summing to 1.0
 */
export function calculatePortfolioRiskReturn(weights) {
  const assets = ['EQUITY', 'DEBT', 'GOLD', 'CASH'];
  const w = [
    weights.equity || 0,
    weights.debt || 0,
    weights.gold || 0,
    weights.cash || 0,
  ];

  // Expected return: sum(w_i * r_i)
  let expReturn = 0;
  for (let i = 0; i < assets.length; i++) {
    expReturn += w[i] * ASSET_SPECS[assets[i]].expectedReturn;
  }

  // Portfolio Variance: w^T * Sigma * w
  let variance = 0;
  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const cov =
        CORRELATION_MATRIX[assets[i]][assets[j]] *
        ASSET_SPECS[assets[i]].volatility *
        ASSET_SPECS[assets[j]].volatility;
      variance += w[i] * w[j] * cov;
    }
  }

  const volatility = Math.sqrt(Math.max(0, variance));
  const sharpe = volatility > 0 ? (expReturn - RISK_FREE_RATE) / volatility : 0;

  return {
    expectedReturn: Number(expReturn.toFixed(4)),
    volatility: Number(volatility.toFixed(4)),
    sharpeRatio: Number(sharpe.toFixed(2)),
  };
}

/**
 * Runs Mean-Variance Optimization, generates the Efficient Frontier,
 * identifies Max-Sharpe and Min-Variance portfolios, and plots current user portfolio.
 *
 * @param {string} userId
 * @param {string} [riskBandOverride]
 */
export async function optimizeUserPortfolio(userId, riskBandOverride = null) {
  const [holdings, profile] = await Promise.all([
    Holding.find({ userId }),
    Profile.findOne({ userId }),
  ]);

  // Determine risk band
  const riskBand = riskBandOverride || profile?.effectiveRiskBand || profile?.scores?.riskBand || 'Moderate';

  // Risk band equity caps
  const bandCaps = {
    Conservative: { maxEquity: 0.35, minDebt: 0.45 },
    'Moderately Conservative': { maxEquity: 0.50, minDebt: 0.35 },
    Moderate: { maxEquity: 0.70, minDebt: 0.20 },
    'Moderately Aggressive': { maxEquity: 0.85, minDebt: 0.10 },
    Aggressive: { maxEquity: 0.95, minDebt: 0.05 },
  };
  const constraints = bandCaps[riskBand] || bandCaps['Moderate'];

  // Calculate current user weights from holdings
  const currentAssetValues = { EQUITY: 0, DEBT: 0, GOLD: 0, CASH: 0 };
  for (const h of holdings) {
    const val = (h.quantity || 0) * (h.currentPrice || h.buyPrice || 0);
    const cls = getTaxAssetClass(h.type, h.categoryOrSector, h.name);
    currentAssetValues[cls] = (currentAssetValues[cls] || 0) + val;
  }

  const totalVal =
    currentAssetValues.EQUITY +
    currentAssetValues.DEBT +
    currentAssetValues.GOLD +
    currentAssetValues.CASH;

  let currentWeights = {
    equity: 0.60,
    debt: 0.30,
    gold: 0.10,
    cash: 0.0,
  };

  if (totalVal > 0) {
    currentWeights = {
      equity: currentAssetValues.EQUITY / totalVal,
      debt: currentAssetValues.DEBT / totalVal,
      gold: currentAssetValues.GOLD / totalVal,
      cash: currentAssetValues.CASH / totalVal,
    };
  }

  const currentStats = calculatePortfolioRiskReturn(currentWeights);

  // 1. Generate discrete random portfolios respecting constraints (Monte Carlo sampling for frontier)
  const sampledPortfolios = [];
  const N_SAMPLES = 1200;

  for (let k = 0; k < N_SAMPLES; k++) {
    // Random weights with constraint satisfaction
    let rawEq = Math.random() * constraints.maxEquity;
    let rawDebt = constraints.minDebt + Math.random() * (1 - constraints.minDebt - rawEq);
    let rawGold = Math.random() * 0.20;
    let rawCash = Math.random() * 0.10;

    const sum = rawEq + rawDebt + rawGold + rawCash;
    if (sum <= 0) continue;

    const w = {
      equity: rawEq / sum,
      debt: rawDebt / sum,
      gold: rawGold / sum,
      cash: rawCash / sum,
    };

    if (w.equity <= constraints.maxEquity && w.debt >= constraints.minDebt * 0.8) {
      const stats = calculatePortfolioRiskReturn(w);
      sampledPortfolios.push({
        weights: w,
        ...stats,
      });
    }
  }

  // 2. Identify Max Sharpe and Minimum Variance
  let maxSharpePortfolio = sampledPortfolios[0];
  let minVarPortfolio = sampledPortfolios[0];

  for (const p of sampledPortfolios) {
    if (p.sharpeRatio > maxSharpePortfolio.sharpeRatio) {
      maxSharpePortfolio = p;
    }
    if (p.volatility < minVarPortfolio.volatility) {
      minVarPortfolio = p;
    }
  }

  // 3. Construct clean Efficient Frontier curve (upper boundary envelope)
  sampledPortfolios.sort((a, b) => a.volatility - b.volatility);

  const frontierPoints = [];
  const volBuckets = 25;
  const minVol = minVarPortfolio.volatility;
  const maxVol = Math.max(...sampledPortfolios.map((p) => p.volatility));
  const step = (maxVol - minVol) / volBuckets;

  for (let b = 0; b < volBuckets; b++) {
    const bucketStart = minVol + b * step;
    const bucketEnd = bucketStart + step;
    const inBucket = sampledPortfolios.filter(
      (p) => p.volatility >= bucketStart && p.volatility <= bucketEnd
    );

    if (inBucket.length > 0) {
      // Pick portfolio with highest return in this volatility bucket
      const best = inBucket.reduce((prev, cur) =>
        cur.expectedReturn > prev.expectedReturn ? cur : prev
      );
      frontierPoints.push({
        volatilityPercent: Number((best.volatility * 100).toFixed(2)),
        returnPercent: Number((best.expectedReturn * 100).toFixed(2)),
        sharpeRatio: best.sharpeRatio,
        weights: {
          equity: Number((best.weights.equity * 100).toFixed(1)),
          debt: Number((best.weights.debt * 100).toFixed(1)),
          gold: Number((best.weights.gold * 100).toFixed(1)),
          cash: Number((best.weights.cash * 100).toFixed(1)),
        },
      });
    }
  }

  return {
    riskBand,
    constraints: {
      maxEquityPercent: constraints.maxEquity * 100,
      minDebtPercent: constraints.minDebt * 100,
    },
    currentPortfolio: {
      totalValue: totalVal,
      volatilityPercent: Number((currentStats.volatility * 100).toFixed(2)),
      returnPercent: Number((currentStats.expectedReturn * 100).toFixed(2)),
      sharpeRatio: currentStats.sharpeRatio,
      weights: {
        equity: Number((currentWeights.equity * 100).toFixed(1)),
        debt: Number((currentWeights.debt * 100).toFixed(1)),
        gold: Number((currentWeights.gold * 100).toFixed(1)),
        cash: Number((currentWeights.cash * 100).toFixed(1)),
      },
    },
    maxSharpePortfolio: {
      volatilityPercent: Number((maxSharpePortfolio.volatility * 100).toFixed(2)),
      returnPercent: Number((maxSharpePortfolio.expectedReturn * 100).toFixed(2)),
      sharpeRatio: maxSharpePortfolio.sharpeRatio,
      weights: {
        equity: Number((maxSharpePortfolio.weights.equity * 100).toFixed(1)),
        debt: Number((maxSharpePortfolio.weights.debt * 100).toFixed(1)),
        gold: Number((maxSharpePortfolio.weights.gold * 100).toFixed(1)),
        cash: Number((maxSharpePortfolio.weights.cash * 100).toFixed(1)),
      },
    },
    minVariancePortfolio: {
      volatilityPercent: Number((minVarPortfolio.volatility * 100).toFixed(2)),
      returnPercent: Number((minVarPortfolio.expectedReturn * 100).toFixed(2)),
      sharpeRatio: minVarPortfolio.sharpeRatio,
      weights: {
        equity: Number((minVarPortfolio.weights.equity * 100).toFixed(1)),
        debt: Number((minVarPortfolio.weights.debt * 100).toFixed(1)),
        gold: Number((minVarPortfolio.weights.gold * 100).toFixed(1)),
        cash: Number((minVarPortfolio.weights.cash * 100).toFixed(1)),
      },
    },
    efficientFrontier: frontierPoints,
    assetAssumptions: ASSET_SPECS,
    disclaimer:
      'Mean-variance optimization calculated using historical asset-class risk premiums and covariance matrix. Past asset performance and correlations may shift during macroeconomic stress.',
  };
}
