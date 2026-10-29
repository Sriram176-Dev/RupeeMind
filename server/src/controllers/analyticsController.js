import * as analyticsService from '../services/analyticsService.js';
import * as stressTestService from '../services/stressTestService.js';

export async function getPortfolioHealthController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await analyticsService.getPortfolioHealth(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSignalQualityController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await analyticsService.getSignalQuality(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsOverviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await analyticsService.getAnalyticsOverview(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function runStressTestController(req, res, next) {
  try {
    const userId = req.user.id;
    const { scenarioId = 'COVID_2020', customShockPercent } = req.body;
    const result = await stressTestService.runCrisisStressTest(userId, scenarioId, customShockPercent);
    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getVaRMetricsController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await stressTestService.calculatePortfolioVaR(userId);
    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function runMonteCarloController(req, res, next) {
  try {
    const userId = req.user.id;
    const { tradingDays = 252, simulationsCount = 1000 } = req.body;
    const result = await stressTestService.runMonteCarloSimulation(userId, { tradingDays, simulationsCount });
    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getScenariosListController(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: Object.values(stressTestService.HISTORICAL_SCENARIOS),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
