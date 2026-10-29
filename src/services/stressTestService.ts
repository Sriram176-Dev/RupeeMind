import { apiClient } from '../lib/apiClient';
import type {
  StressScenario,
  StressTestResult,
  PortfolioVaRMetrics,
  MonteCarloSimulationResult,
} from '../types';

export async function getScenariosApi(): Promise<StressScenario[]> {
  const res = await apiClient.get<{ success: boolean; data: StressScenario[] }>(
    '/analytics/scenarios'
  );
  return res.data.data;
}

export async function runStressTestApi(
  scenarioId: string,
  customShockPercent?: number
): Promise<StressTestResult> {
  const res = await apiClient.post<{ success: boolean; data: StressTestResult }>(
    '/analytics/stress-test',
    { scenarioId, customShockPercent }
  );
  return res.data.data;
}

export async function getVaRMetricsApi(): Promise<PortfolioVaRMetrics> {
  const res = await apiClient.get<{ success: boolean; data: PortfolioVaRMetrics }>(
    '/analytics/var-metrics'
  );
  return res.data.data;
}

export async function runMonteCarloApi(
  tradingDays = 252,
  simulationsCount = 1000
): Promise<MonteCarloSimulationResult> {
  const res = await apiClient.post<{ success: boolean; data: MonteCarloSimulationResult }>(
    '/analytics/monte-carlo',
    { tradingDays, simulationsCount }
  );
  return res.data.data;
}

export const stressTestService = {
  getScenarios: getScenariosApi,
  runStressTest: runStressTestApi,
  getVaRMetrics: getVaRMetricsApi,
  runMonteCarlo: runMonteCarloApi,
};

export default stressTestService;
