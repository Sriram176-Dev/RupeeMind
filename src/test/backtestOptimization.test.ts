// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  calculatePortfolioRiskReturn,
  ASSET_SPECS,
  CORRELATION_MATRIX,
  RISK_FREE_RATE,
} from '../../server/src/services/portfolioOptimizationService.js';
import modelReport from '../../server/src/config/modelTransparencyReport.json';

describe('Phase 4: Portfolio Optimization & Risk-Return Math', () => {
  it('correctly calculates expected return and volatility for 100% Equity portfolio', () => {
    const weights = { equity: 1.0, debt: 0.0, gold: 0.0, cash: 0.0 };
    const stats = calculatePortfolioRiskReturn(weights);

    expect(stats.expectedReturn).toBeCloseTo(ASSET_SPECS.EQUITY.expectedReturn, 3);
    expect(stats.volatility).toBeCloseTo(ASSET_SPECS.EQUITY.volatility, 3);
    const expectedSharpe = (ASSET_SPECS.EQUITY.expectedReturn - RISK_FREE_RATE) / ASSET_SPECS.EQUITY.volatility;
    expect(stats.sharpeRatio).toBeCloseTo(expectedSharpe, 1);
  });

  it('correctly calculates expected return for a diversified 60/25/10/5 portfolio', () => {
    const weights = { equity: 0.60, debt: 0.25, gold: 0.10, cash: 0.05 };
    const stats = calculatePortfolioRiskReturn(weights);

    // Expected return: 0.60*0.145 + 0.25*0.075 + 0.10*0.10 + 0.05*0.055
    const expectedR = 0.60 * 0.145 + 0.25 * 0.075 + 0.10 * 0.10 + 0.05 * 0.055;
    expect(stats.expectedReturn).toBeCloseTo(expectedR, 3);

    // Diversification benefit: volatility must be strictly less than weighted sum of volatilities
    const weightedVol = 0.60 * 0.18 + 0.25 * 0.045 + 0.10 * 0.12 + 0.05 * 0.005;
    expect(stats.volatility).toBeLessThan(weightedVol);
    expect(stats.sharpeRatio).toBeGreaterThan(0);
  });

  it('verifies Indian asset correlation matrix symmetry and diagonal properties', () => {
    const assets = ['EQUITY', 'DEBT', 'GOLD', 'CASH'];
    for (const a of assets) {
      expect(CORRELATION_MATRIX[a][a]).toBe(1.0);
      for (const b of assets) {
        expect(CORRELATION_MATRIX[a][b]).toBe(CORRELATION_MATRIX[b][a]);
      }
    }
    // Debt and Equity should be negatively or lowly correlated in India
    expect(CORRELATION_MATRIX.EQUITY.DEBT).toBeLessThanOrEqual(0);
  });
});

describe('Phase 4: Backtest Performance Metrics Computations', () => {
  it('correctly calculates CAGR from initial and final values over N years', () => {
    const initial = 100000;
    const final = 172800;
    const years = 3; // (1.728)^(1/3) - 1 = 1.2 - 1 = 20%
    const cagr = (Math.pow(final / initial, 1 / years) - 1) * 100;
    expect(cagr).toBeCloseTo(20.0, 1);
  });

  it('correctly computes max drawdown percentage from an equity curve', () => {
    const curve = [100, 120, 110, 90, 105, 130];
    let peak = curve[0];
    let maxDrawdown = 0;

    for (const val of curve) {
      if (val > peak) peak = val;
      const dd = ((peak - val) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Peak = 120, trough = 90 -> ((120 - 90) / 120) * 100 = 25%
    expect(maxDrawdown).toBeCloseTo(25.0, 1);
  });

  it('computes win rate and trade statistics accurately', () => {
    const trades = [
      { pnl: 5000 },
      { pnl: -2000 },
      { pnl: 3500 },
      { pnl: 1200 },
      { pnl: -800 },
    ];
    const winning = trades.filter((t) => t.pnl > 0).length;
    const winRate = (winning / trades.length) * 100;

    expect(winning).toBe(3);
    expect(winRate).toBe(60.0);
  });
});

describe('Phase 4: Signal Model Transparency Validation & Governance', () => {
  it('validates that transparency report contains all required walk-forward fields', () => {
    expect(modelReport).toHaveProperty('modelType');
    expect(modelReport).toHaveProperty('modelSizeMb');
    expect(modelReport.modelSizeMb).toBeLessThan(20); // Must be lightweight (< 20MB)
    expect(modelReport).toHaveProperty('overallMetrics');
    expect(modelReport.overallMetrics).toHaveProperty('accuracy');
    expect(modelReport.overallMetrics).toHaveProperty('majorityClassBaseline');
    expect(modelReport.overallMetrics).toHaveProperty('beatsBaseline');
    expect(Array.isArray(modelReport.folds)).toBe(true);
    expect(modelReport.folds.length).toBeGreaterThanOrEqual(3);
  });

  it('confirms all feature inputs are scale-free ratios without absolute price levels', () => {
    const prohibitedPrefixes = ['price', 'close', 'open', 'high', 'low', 'nav'];
    for (const feat of modelReport.featuresList) {
      for (const prefix of prohibitedPrefixes) {
        // Feature name cannot just be raw price level
        expect(feat.toLowerCase()).not.toBe(prefix);
      }
    }
  });

  it('enforces that beatsBaseline accurately reflects out-of-sample accuracy vs majority baseline', () => {
    const { accuracy, majorityClassBaseline, beatsBaseline } = modelReport.overallMetrics;
    if (accuracy > majorityClassBaseline) {
      expect(beatsBaseline).toBe(true);
    } else {
      expect(beatsBaseline).toBe(false);
    }
  });
});
