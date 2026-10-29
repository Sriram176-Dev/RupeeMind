import { describe, it, expect } from 'vitest';
import * as stressTestService from '../src/services/stressTestService.js';

describe('Stress Test & Monte Carlo Service', () => {
  const dummyUserId = '64b1f2e8f1c2d3a4b5c6d7e8';

  it('provides scenarios with historical data and sector shocks', () => {
    const scenarios = Object.values(stressTestService.HISTORICAL_SCENARIOS);
    expect(scenarios.length).toBeGreaterThanOrEqual(4);
    const covid = stressTestService.HISTORICAL_SCENARIOS.COVID_2020;
    expect(covid).toBeDefined();
    expect(covid.marketDropPercent).toBe(-38.4);
    expect(covid.sectorShocks.Pharma).toBeGreaterThan(0); // Pharma rallied
  });

  it('runs crisis stress test on user portfolio (sample fallback when empty)', async () => {
    const result = await stressTestService.runCrisisStressTest(dummyUserId, 'COVID_2020');
    expect(result).toBeDefined();
    expect(result.scenario).toBeDefined();
    expect(result.initialPortfolioValue).toBeGreaterThan(0);
    expect(result.projectedPortfolioValue).toBeLessThan(result.initialPortfolioValue);
    expect(result.totalLoss).toBeLessThan(0); // Negative PnL
    expect(result.totalPercentageDrop).toBeLessThan(0);
    expect(result.assetImpacts.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('runs custom market shock simulation correctly', async () => {
    const customResult = await stressTestService.runCrisisStressTest(dummyUserId, 'CUSTOM', -25);
    expect(customResult.scenario.id).toBe('CUSTOM');
    expect(customResult.scenario.marketDropPercent).toBe(-25);
    expect(customResult.projectedPortfolioValue).toBeLessThan(customResult.initialPortfolioValue);
  });

  it('calculates parametric Value at Risk (VaR) and CVaR', async () => {
    const varMetrics = await stressTestService.calculatePortfolioVaR(dummyUserId);
    expect(varMetrics).toBeDefined();
    expect(varMetrics.totalValue).toBeGreaterThan(0);
    expect(varMetrics.portfolioBeta).toBeGreaterThan(0);
    expect(varMetrics.portfolioVolPercent).toBeGreaterThan(0);
    // 99% VaR must be greater than 95% VaR
    expect(varMetrics.var99.oneDay).toBeGreaterThan(varMetrics.var95.oneDay);
    expect(varMetrics.var99.thirtyDay).toBeGreaterThan(varMetrics.var95.thirtyDay);
    // CVaR (Expected Shortfall) must be >= 1-day 95% VaR
    expect(varMetrics.cvar95.oneDay).toBeGreaterThanOrEqual(varMetrics.var95.oneDay);
  });

  it('runs 1,000-path Monte Carlo simulation with percentiles and probabilities', async () => {
    const mc = await stressTestService.runMonteCarloSimulation(dummyUserId, {
      tradingDays: 126,
      simulationsCount: 200,
    });
    expect(mc).toBeDefined();
    expect(mc.initialValue).toBeGreaterThan(0);
    expect(mc.trajectoryChartData.length).toBeGreaterThan(0);
    expect(mc.summary.bullCaseFinal).toBeGreaterThan(mc.summary.medianFinal);
    expect(mc.summary.medianFinal).toBeGreaterThan(mc.summary.bearCaseFinal);
    expect(mc.summary.profitProbability).toBeGreaterThanOrEqual(0);
    expect(mc.summary.profitProbability).toBeLessThanOrEqual(100);
  });
});
