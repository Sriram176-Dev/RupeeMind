import mongoose from 'mongoose';
import { Holding } from '../models/Holding.js';
import { PaperPosition } from '../models/PaperPosition.js';
import { PaperWallet } from '../models/PaperWallet.js';

// Pre-calibrated sector mapping & estimated Beta values relative to NIFTY 50
const STOCK_METRICS = {
  // Banking / Financials (High Beta)
  HDFCBANK: { sector: 'Banking', beta: 1.15, vol: 0.22 },
  ICICIBANK: { sector: 'Banking', beta: 1.25, vol: 0.24 },
  SBIN: { sector: 'Banking', beta: 1.35, vol: 0.28 },
  KOTAKBANK: { sector: 'Banking', beta: 1.10, vol: 0.21 },
  AXISBANK: { sector: 'Banking', beta: 1.30, vol: 0.27 },
  BAJFINANCE: { sector: 'Financial Services', beta: 1.40, vol: 0.30 },

  // IT / Technology
  TCS: { sector: 'IT', beta: 0.85, vol: 0.18 },
  INFY: { sector: 'IT', beta: 1.10, vol: 0.22 },
  WIPRO: { sector: 'IT', beta: 1.05, vol: 0.23 },
  HCLTECH: { sector: 'IT', beta: 0.95, vol: 0.20 },

  // Energy & Heavy Industry
  RELIANCE: { sector: 'Energy', beta: 1.05, vol: 0.21 },
  LT: { sector: 'Construction', beta: 1.15, vol: 0.23 },
  ONGC: { sector: 'Energy', beta: 1.10, vol: 0.26 },
  POWERGRID: { sector: 'Utilities', beta: 0.70, vol: 0.16 },

  // Auto
  TATAMOTORS: { sector: 'Auto', beta: 1.45, vol: 0.32 },
  MARUTI: { sector: 'Auto', beta: 1.05, vol: 0.22 },
  M_M: { sector: 'Auto', beta: 1.20, vol: 0.25 },

  // FMCG & Defensive
  ITC: { sector: 'FMCG', beta: 0.65, vol: 0.15 },
  HINDUNILVR: { sector: 'FMCG', beta: 0.60, vol: 0.14 },
  NESTLEIND: { sector: 'FMCG', beta: 0.55, vol: 0.13 },

  // Pharma (Defensive / Counter-cyclical)
  SUNPHARMA: { sector: 'Pharma', beta: 0.68, vol: 0.16 },
  CIPLA: { sector: 'Pharma', beta: 0.62, vol: 0.15 },
  DRREDDY: { sector: 'Pharma', beta: 0.70, vol: 0.17 },

  // Metals (Cyclical High Beta)
  TATASTEEL: { sector: 'Metals', beta: 1.55, vol: 0.35 },
  HINDALCO: { sector: 'Metals', beta: 1.50, vol: 0.34 },
};

export const HISTORICAL_SCENARIOS = {
  COVID_2020: {
    id: 'COVID_2020',
    title: 'COVID-19 Pandemic Crash (March 2020)',
    period: 'Feb 2020 – Mar 2020 (30 Days)',
    marketDropPercent: -38.4,
    description: 'Black swan global lockdown triggered the fastest -38% drop in Indian stock market history before unprecedented liquidity stimulus.',
    sectorShocks: {
      Banking: -45.0,
      'Financial Services': -48.0,
      Auto: -42.0,
      Metals: -44.0,
      Construction: -39.0,
      IT: -24.0,
      FMCG: -18.0,
      Pharma: +12.0, // Rally due to healthcare demand
      Energy: -32.0,
      Utilities: -22.0,
      Other: -35.0,
    },
    recoveryMonths: 7,
    keyLessons: 'Pharma and FMCG acted as critical defensive buffers. High beta metals and banks bore the brunt of liquidity freeze.',
  },
  GFC_2008: {
    id: 'GFC_2008',
    title: 'Global Financial Crisis (Lehman Brothers Collapse)',
    period: 'Jan 2008 – Oct 2008 (10 Months)',
    marketDropPercent: -55.2,
    description: 'Systemic global banking crisis and credit contraction caused foreign institutional investors to withdraw billions from emerging markets.',
    sectorShocks: {
      Construction: -72.0,
      Metals: -68.0,
      Banking: -62.0,
      'Financial Services': -65.0,
      Auto: -54.0,
      Energy: -52.0,
      IT: -48.0,
      Pharma: -24.0,
      FMCG: -16.0,
      Utilities: -30.0,
      Other: -50.0,
    },
    recoveryMonths: 23,
    keyLessons: 'Leveraged balance sheets and real estate collapsed hardest. FMCG survived with minimal capital impairment.',
  },
  RUSSIA_UKRAINE_2022: {
    id: 'RUSSIA_UKRAINE_2022',
    title: 'Geopolitical Conflict & $130 Crude Shock (2022)',
    period: 'Jan 2022 – Jun 2022 (5 Months)',
    marketDropPercent: -15.5,
    description: 'Crude oil surged to $139/barrel driving imported inflation in India, while global central banks began steep interest rate hiking cycles.',
    sectorShocks: {
      Auto: -24.0,
      Construction: -20.0,
      Banking: -16.0,
      IT: -28.0, // High valuation compression
      Energy: +16.0, // Oil producers gained
      Metals: +7.0, // Commodity surge
      FMCG: -8.0,
      Pharma: -12.0,
      Other: -14.0,
    },
    recoveryMonths: 6,
    keyLessons: 'Energy and commodity producers hedged against inflation while high multiple technology stocks faced severe valuation compression.',
  },
  RATE_HIKE_STAGFLATION: {
    id: 'RATE_HIKE_STAGFLATION',
    title: 'Severe Stagflation & 150 bps RBI Rate Hike',
    period: 'Simulated 6-Month Horizon',
    marketDropPercent: -22.0,
    description: 'Prolonged high inflation combined with aggressive central bank interest rate increases compressing retail demand and PE multiples.',
    sectorShocks: {
      Construction: -30.0,
      'Financial Services': -24.0,
      Auto: -26.0,
      Banking: -18.0,
      IT: -22.0,
      Metals: -20.0,
      FMCG: -8.0,
      Pharma: -10.0,
      Utilities: -12.0,
      Other: -18.0,
    },
    recoveryMonths: 12,
    keyLessons: 'Cash-flow positive dividend payers and defensive non-discretionary businesses protect capital during stagflation.',
  },
};

/**
 * Fetch unified portfolio assets (Real Holdings or Paper Trading positions)
 */
export async function getUnifiedUserPortfolio(userId) {
  let realHoldings = [];
  let paperPositions = [];
  let paperWallet = null;

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      [realHoldings, paperPositions, paperWallet] = await Promise.all([
        Holding.find({ userId }).lean(),
        PaperPosition.find({ userId }).lean(),
        PaperWallet.findOne({ userId }).lean(),
      ]);
    } catch {
      // In case of any DB read error or uninitialized collection, fallback smoothly
      realHoldings = [];
      paperPositions = [];
      paperWallet = null;
    }
  }

  let assets = [];
  let source = 'REAL';

  if (realHoldings && realHoldings.length > 0) {
    source = 'REAL_HOLDINGS';
    assets = realHoldings.map((h) => {
      const rawSym = h.symbolOrCode || h.symbol || '';
      const cleanSym = rawSym.replace(/\.(NS|BO)$/i, '').toUpperCase();
      const metrics = STOCK_METRICS[cleanSym] || { sector: h.categoryOrSector || 'Other', beta: 1.0, vol: 0.22 };
      const val = (h.quantity || 0) * (h.currentPrice || h.buyPrice || 100);
      return {
        symbol: cleanSym,
        name: h.name || cleanSym,
        quantity: h.quantity || 0,
        currentValue: val,
        sector: metrics.sector,
        beta: metrics.beta,
        volatility: metrics.vol,
      };
    });
  } else if (paperPositions && paperPositions.length > 0) {
    source = 'PAPER_POSITIONS';
    assets = paperPositions.map((p) => {
      const cleanSym = (p.symbol || '').replace(/\.(NS|BO)$/i, '').toUpperCase();
      const metrics = STOCK_METRICS[cleanSym] || { sector: 'Other', beta: 1.0, vol: 0.22 };
      const val = (p.quantity || 0) * (p.averageBuyPrice || 100);
      return {
        symbol: cleanSym,
        name: p.companyName || cleanSym,
        quantity: p.quantity || 0,
        currentValue: val,
        sector: metrics.sector,
        beta: metrics.beta,
        volatility: metrics.vol,
      };
    });
  } else {
    // Default balanced sample portfolio if user has no positions yet
    source = 'SAMPLE_DEMO';
    assets = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 20, currentValue: 58000, sector: 'Energy', beta: 1.05, volatility: 0.21 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', quantity: 40, currentValue: 68000, sector: 'Banking', beta: 1.15, volatility: 0.22 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 15, currentValue: 54000, sector: 'IT', beta: 0.85, volatility: 0.18 },
      { symbol: 'ITC', name: 'ITC Ltd.', quantity: 80, currentValue: 38000, sector: 'FMCG', beta: 0.65, volatility: 0.15 },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', quantity: 30, currentValue: 27000, sector: 'Auto', beta: 1.45, volatility: 0.32 },
    ];
  }

  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // Calculate weighted portfolio beta & annualized volatility
  let weightedBeta = 0;
  let weightedVol = 0;

  if (totalValue > 0) {
    assets.forEach((a) => {
      const weight = a.currentValue / totalValue;
      weightedBeta += weight * a.beta;
      weightedVol += weight * a.volatility;
    });
  } else {
    weightedBeta = 1.0;
    weightedVol = 0.20;
  }

  return {
    source,
    assets,
    totalValue: Number(totalValue.toFixed(2)),
    portfolioBeta: Number(weightedBeta.toFixed(2)),
    portfolioVol: Number(weightedVol.toFixed(3)),
    cashBalance: paperWallet ? paperWallet.cashBalance : 0,
  };
}

/**
 * Run historical crisis stress test on user portfolio
 */
export async function runCrisisStressTest(userId, scenarioId, customShockPercent) {
  const portfolio = await getUnifiedUserPortfolio(userId);
  const { totalValue, assets, portfolioBeta } = portfolio;

  let scenario = HISTORICAL_SCENARIOS[scenarioId];

  // If custom shock slider used
  if (scenarioId === 'CUSTOM' || !scenario) {
    const shock = typeof customShockPercent === 'number' ? customShockPercent : -20;
    scenario = {
      id: 'CUSTOM',
      title: `Custom Market Shock (${shock > 0 ? '+' : ''}${shock}%)`,
      period: 'Instantaneous Stress Test',
      marketDropPercent: shock,
      description: `User-defined hypothetical market movement of ${shock}% applied via individual asset Betas.`,
      sectorShocks: {},
      recoveryMonths: Math.round(Math.abs(shock) * 0.5),
      keyLessons: 'Beta-weighted sensitivity models how volatile high-beta assets swing relative to overall index shifts.',
    };
  }

  let projectedValue = 0;
  const assetImpacts = assets.map((asset) => {
    let shockRate = 0;
    if (scenario.id === 'CUSTOM') {
      // Asset shock = Asset Beta * Market Shock
      shockRate = asset.beta * scenario.marketDropPercent;
    } else {
      // Sector shock fallback to beta * marketDrop
      const sectorShock = scenario.sectorShocks[asset.sector];
      shockRate = sectorShock !== undefined ? sectorShock : asset.beta * scenario.marketDropPercent;
    }

    const valueLoss = Number((asset.currentValue * (shockRate / 100)).toFixed(2));
    const finalVal = Math.max(0, Number((asset.currentValue + valueLoss).toFixed(2)));
    projectedValue += finalVal;

    return {
      symbol: asset.symbol,
      name: asset.name,
      sector: asset.sector,
      beta: asset.beta,
      currentValue: asset.currentValue,
      projectedValue: finalVal,
      pnlImpact: valueLoss,
      percentageImpact: Number(shockRate.toFixed(2)),
    };
  });

  const totalLoss = Number((projectedValue - totalValue).toFixed(2));
  const totalPercentageDrop = totalValue > 0 ? Number(((totalLoss / totalValue) * 100).toFixed(2)) : 0;

  // Identify hardest hit vs most resilient assets
  const sorted = [...assetImpacts].sort((a, b) => a.percentageImpact - b.percentageImpact);
  const hardestHit = sorted.slice(0, 3);
  const mostResilient = sorted.slice(-3).reverse();

  // Generate actionable defensive suggestions
  const recommendations = [];
  if (portfolioBeta > 1.2) {
    recommendations.push({
      type: 'BETA_REDUCTION',
      title: 'High Portfolio Beta Risk (β > 1.2)',
      advice: 'Your portfolio drops faster than Nifty during market panics. Consider hedging with lower-beta FMCG (ITC/HUL) or short-term liquid debt funds.',
    });
  }
  if (Math.abs(totalPercentageDrop) > 30) {
    recommendations.push({
      type: 'CRITICAL_DRAWDOWN',
      title: 'Severe Drawdown Exposure (>30%)',
      advice: `In this scenario you risk losing ${Math.abs(totalPercentageDrop)}% (₹${Math.abs(totalLoss).toLocaleString('en-IN')}). Ensure an emergency fund of at least 6 months is kept completely separate from equities.`,
    });
  } else {
    recommendations.push({
      type: 'RESILIENCE_OK',
      title: 'Defensive Structure Intact',
      advice: 'Your asset distribution has sufficient defensive weight to withstand moderate shocks without catastrophic capital loss.',
    });
  }

  return {
    scenario,
    portfolioSource: portfolio.source,
    initialPortfolioValue: totalValue,
    projectedPortfolioValue: Number(projectedValue.toFixed(2)),
    totalLoss,
    totalPercentageDrop,
    portfolioBeta,
    assetImpacts,
    hardestHit,
    mostResilient,
    recommendations,
  };
}

/**
 * Value at Risk (VaR) & Expected Shortfall (CVaR) Engine
 */
export async function calculatePortfolioVaR(userId) {
  const portfolio = await getUnifiedUserPortfolio(userId);
  const { totalValue, portfolioVol, portfolioBeta } = portfolio;

  // Daily volatility = annualVol / sqrt(252)
  const dailyVol = portfolioVol / Math.sqrt(252);

  // Parametric VaR formula: VaR = Z * sigma * Value
  // Z(95%) = 1.645, Z(99%) = 2.326
  const var95_1d = Number((1.645 * dailyVol * totalValue).toFixed(2));
  const var99_1d = Number((2.326 * dailyVol * totalValue).toFixed(2));

  // 30-Day VaR = 1d VaR * sqrt(30)
  const var95_30d = Number((var95_1d * Math.sqrt(30)).toFixed(2));
  const var99_30d = Number((var99_1d * Math.sqrt(30)).toFixed(2));

  // Conditional VaR (Expected Shortfall / average loss when VaR is breached)
  const cvar95_1d = Number((var95_1d * 1.25).toFixed(2));
  const cvar95_30d = Number((var95_30d * 1.25).toFixed(2));

  return {
    totalValue,
    portfolioVolPercent: Number((portfolioVol * 100).toFixed(1)),
    portfolioBeta,
    dailyVolPercent: Number((dailyVol * 100).toFixed(2)),
    var95: {
      oneDay: var95_1d,
      oneDayPercent: totalValue > 0 ? Number(((var95_1d / totalValue) * 100).toFixed(2)) : 0,
      thirtyDay: var95_30d,
      thirtyDayPercent: totalValue > 0 ? Number(((var95_30d / totalValue) * 100).toFixed(2)) : 0,
      confidence: '95%',
      meaning: `There is a 95% statistical probability that your portfolio will NOT lose more than ₹${var95_1d.toLocaleString('en-IN')} in a single day.`,
    },
    var99: {
      oneDay: var99_1d,
      oneDayPercent: totalValue > 0 ? Number(((var99_1d / totalValue) * 100).toFixed(2)) : 0,
      thirtyDay: var99_30d,
      thirtyDayPercent: totalValue > 0 ? Number(((var99_30d / totalValue) * 100).toFixed(2)) : 0,
      confidence: '99%',
      meaning: `Under extreme stress (99% confidence / 1 in 100 trading sessions), maximum single-day loss is capped at ₹${var99_1d.toLocaleString('en-IN')}.`,
    },
    cvar95: {
      oneDay: cvar95_1d,
      thirtyDay: cvar95_30d,
      description: 'Expected Shortfall (Average loss during tail-risk events beyond the 95% VaR threshold).',
    },
  };
}

/**
 * Monte Carlo Simulation Engine (Geometric Brownian Motion)
 * Generates 1,000 randomized asset price paths over 252 trading days (1 year)
 */
export async function runMonteCarloSimulation(userId, { tradingDays = 252, simulationsCount = 1000 } = {}) {
  const portfolio = await getUnifiedUserPortfolio(userId);
  const V0 = portfolio.totalValue > 0 ? portfolio.totalValue : 100000;
  const mu = 0.135; // Long-term Nifty historical CAGR (13.5%)
  const sigma = Math.max(0.12, portfolio.portfolioVol);

  const dt = 1 / 252;
  const steps = Math.min(252, Math.max(30, tradingDays));
  const simCount = Math.min(1000, Math.max(100, simulationsCount));

  // Store final values for distribution analysis
  const finalValues = new Float64Array(simCount);

  // Subsample 25 trajectory points along the year (every ~10 trading days)
  const sampledStepsCount = 25;
  const sampleInterval = Math.floor(steps / (sampledStepsCount - 1));
  const trajectoryMatrix = Array.from({ length: sampledStepsCount }, () => new Float64Array(simCount));

  // Box-Muller transform for standard normal random variables
  function nextGaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);

  // Run simulations
  for (let s = 0; s < simCount; s++) {
    let currentVal = V0;
    let sampleIdx = 0;
    trajectoryMatrix[sampleIdx++][s] = currentVal;

    for (let t = 1; t <= steps; t++) {
      const z = nextGaussian();
      currentVal = currentVal * Math.exp(drift + diffusion * z);

      if (t % sampleInterval === 0 && sampleIdx < sampledStepsCount) {
        trajectoryMatrix[sampleIdx++][s] = currentVal;
      }
    }

    finalValues[s] = currentVal;
    if (sampleIdx < sampledStepsCount) {
      trajectoryMatrix[sampledStepsCount - 1][s] = currentVal;
    }
  }

  // Extract percentiles (95th, 75th, 50th, 25th, 5th) at each sampled step
  const trajectoryChartData = [];

  for (let step = 0; step < sampledStepsCount; step++) {
    const valuesAtStep = Array.from(trajectoryMatrix[step]).sort((a, b) => a - b);
    const dayNumber = Math.min(steps, Math.round(step * sampleInterval));

    trajectoryChartData.push({
      day: `Day ${dayNumber}`,
      dayNum: dayNumber,
      bullCase: Math.round(valuesAtStep[Math.floor(simCount * 0.95)]), // 95th Percentile
      aboveAvg: Math.round(valuesAtStep[Math.floor(simCount * 0.75)]), // 75th Percentile
      median: Math.round(valuesAtStep[Math.floor(simCount * 0.50)]),   // 50th Percentile
      belowAvg: Math.round(valuesAtStep[Math.floor(simCount * 0.25)]), // 25th Percentile
      bearCase: Math.round(valuesAtStep[Math.floor(simCount * 0.05)]), // 5th Percentile
    });
  }

  // Analyze final 1-year outcomes
  const sortedFinal = Array.from(finalValues).sort((a, b) => a - b);
  const p95Final = Math.round(sortedFinal[Math.floor(simCount * 0.95)]);
  const medianFinal = Math.round(sortedFinal[Math.floor(simCount * 0.50)]);
  const p5Final = Math.round(sortedFinal[Math.floor(simCount * 0.05)]);

  const profitCount = sortedFinal.filter((val) => val >= V0).length;
  const profitProbability = Number(((profitCount / simCount) * 100).toFixed(1));

  const doubleCount = sortedFinal.filter((val) => val >= V0 * 2).length;
  const doubleProbability = Number(((doubleCount / simCount) * 100).toFixed(1));

  return {
    initialValue: V0,
    timeHorizonDays: steps,
    simulationsRun: simCount,
    expectedReturnRate: Number((mu * 100).toFixed(1)),
    volatilityApplied: Number((sigma * 100).toFixed(1)),
    trajectoryChartData,
    summary: {
      bullCaseFinal: p95Final,
      bullCaseReturn: Number((((p95Final - V0) / V0) * 100).toFixed(1)),
      medianFinal,
      medianReturn: Number((((medianFinal - V0) / V0) * 100).toFixed(1)),
      bearCaseFinal: p5Final,
      bearCaseReturn: Number((((p5Final - V0) / V0) * 100).toFixed(1)),
      profitProbability,
      doubleProbability,
    },
  };
}
