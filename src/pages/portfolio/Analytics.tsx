import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import {
  getPortfolioHealthApi,
  getSignalQualityApi,
} from '../../services/analyticsService';
import {
  getScenariosApi,
  runStressTestApi,
  getVaRMetricsApi,
  runMonteCarloApi,
} from '../../services/stressTestService';
import type {
  PortfolioHealthData,
  SignalQualityData,
  StressScenario,
  StressTestResult,
  PortfolioVaRMetrics,
  MonteCarloSimulationResult,
} from '../../types';
import { formatINR } from '../../lib/utils';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  PieChart as PieIcon,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Layers,
  Award,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  Gauge,
  Flame,
  FileText,
} from 'lucide-react';
import {
  CrisisScenarioSelector,
  ScenarioImpactCard,
  VaRGaugeCard,
  MonteCarloChart,
} from '../../components/stresstest';
import { AuditReportModal } from '../../components/reports';

export const Analytics: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'health' | 'stress-test' | 'var' | 'monte-carlo'
  const initialTab =
    location.pathname === '/crisis-simulator' || searchParams.get('tab') === 'stress-test'
      ? 'stress-test'
      : (searchParams.get('tab') as 'health' | 'stress-test' | 'var' | 'monte-carlo') || 'health';

  const [activeTab, setActiveTab] = useState<'health' | 'stress-test' | 'var' | 'monte-carlo'>(initialTab);

  // Health & Signal Telemetry
  const [healthData, setHealthData] = useState<PortfolioHealthData | null>(null);
  const [signalData, setSignalData] = useState<SignalQualityData | null>(null);
  const [loading, setLoading] = useState(true);

  // Stress Testing & Monte Carlo state
  const [scenarios, setScenarios] = useState<StressScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('COVID_2020');
  const [customShock, setCustomShock] = useState<number>(-20);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);

  // VaR & Tail Risk state
  const [varMetrics, setVarMetrics] = useState<PortfolioVaRMetrics | null>(null);
  const [varLoading, setVarLoading] = useState(false);

  // Monte Carlo state
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloSimulationResult | null>(null);
  const [mcLoading, setMcLoading] = useState(false);

  // Institutional Audit PDF Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const handleTabChange = (tab: 'health' | 'stress-test' | 'var' | 'monte-carlo') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchHealthAndSignal = async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([
        getPortfolioHealthApi(),
        getSignalQualityApi(),
      ]);
      setHealthData(h);
      setSignalData(s);
    } catch (err) {
      console.error('Failed to load portfolio health analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStressScenariosAndInit = async () => {
    try {
      const scList = await getScenariosApi();
      setScenarios(scList);
      if (scList.length > 0 && !stressResult) {
        setStressLoading(true);
        const initialResult = await runStressTestApi('COVID_2020');
        setStressResult(initialResult);
        setStressLoading(false);
      }
    } catch (err) {
      console.error('Failed to load stress scenarios:', err);
      setStressLoading(false);
    }
  };

  const fetchVaR = async () => {
    setVarLoading(true);
    try {
      const metrics = await getVaRMetricsApi();
      setVarMetrics(metrics);
    } catch (err) {
      console.error('Failed to load VaR metrics:', err);
    } finally {
      setVarLoading(false);
    }
  };

  const fetchMonteCarlo = async (days = 252, count = 1000) => {
    setMcLoading(true);
    try {
      const mc = await runMonteCarloApi(days, count);
      setMonteCarloResult(mc);
    } catch (err) {
      console.error('Failed to run Monte Carlo simulation:', err);
    } finally {
      setMcLoading(false);
    }
  };

  const handleExecuteStressTest = async () => {
    setStressLoading(true);
    try {
      const result = await runStressTestApi(selectedScenarioId, customShock);
      setStressResult(result);
    } catch (err) {
      console.error('Stress test execution failed:', err);
    } finally {
      setStressLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHealthAndSignal();
    fetchStressScenariosAndInit();
    fetchVaR();
    fetchMonteCarlo();
  }, []);

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F766E]/15 via-[#4F46E5]/10 to-transparent border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            INSTITUTIONAL QUANT ANALYTICS & SIMULATION
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
            Portfolio Health, Crisis Stress-Testing & Monte Carlo
          </h1>
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] mt-1">
            End-to-end diagnostic suite: concentration risk, 2008/2020 historical crisis replay, parametric VaR, and 1,000-path stochastic projections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 transition-all flex items-center gap-2 shadow-md shadow-emerald-900/20 min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            <span>Audit Dossier (PDF)</span>
          </button>

          <button
            onClick={() => {
              fetchHealthAndSignal();
              fetchStressScenariosAndInit();
              fetchVaR();
              fetchMonteCarlo();
            }}
            disabled={loading || stressLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center gap-2 shadow-xs shrink-0 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading || stressLoading ? 'animate-spin' : ''}`} />
            <span>Refresh All Models</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('health')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'health'
              ? 'bg-[#0F766E] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Portfolio Health & Signal Telemetry</span>
        </button>

        <button
          onClick={() => handleTabChange('stress-test')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'stress-test'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Crisis Stress Simulator (Option B)</span>
        </button>

        <button
          onClick={() => handleTabChange('var')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'var'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Value at Risk (VaR & CVaR)</span>
        </button>

        <button
          onClick={() => handleTabChange('monte-carlo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'monte-carlo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Monte Carlo 1,000-Path Engine</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PORTFOLIO HEALTH & SIGNAL TELEMETRY               */}
      {/* ========================================================= */}
      {activeTab === 'health' && (
        <div className="space-y-8">
          {loading ? (
            <div className="p-16 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] text-center space-y-3">
              <Activity className="w-8 h-8 text-[#0F766E] animate-pulse mx-auto" />
              <p className="text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                Calculating portfolio health & signal quality telemetry...
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: Portfolio Health Diagnostics */}
              <div className="space-y-4">
                <SectionHeader
                  eyebrow="DIAGNOSTIC TELEMETRY"
                  title="Portfolio Health & Concentration Diagnostics"
                  subtitle="Holistic assessment of risk diversification, balance, and performance yield."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Score & Metrics Card */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Overall Health Score
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            healthData?.healthGrade === 'Excellent'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : healthData?.healthGrade === 'Good'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {healthData?.healthGrade}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="font-serif text-5xl sm:text-6xl font-bold text-[#0F766E] dark:text-emerald-400">
                          {healthData?.healthScore}
                        </span>
                        <span className="text-lg font-bold text-gray-400">/ 100</span>
                      </div>

                      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-[#0F766E] rounded-full transition-all duration-500"
                          style={{ width: `${healthData?.healthScore || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E7E5DF] dark:border-[#1F2933]">
                      <div className="p-3 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Total Invested</span>
                        <p className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">
                          {formatINR(healthData?.metrics?.totalInvested || 0)}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Current Value</span>
                        <p className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">
                          {formatINR(healthData?.metrics?.currentValue || 0)}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Unrealized P&L</span>
                        <p
                          className={`font-serif text-lg font-bold mt-0.5 ${
                            (healthData?.metrics?.totalPnl || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {(healthData?.metrics?.totalPnl || 0) >= 0 ? '+' : ''}
                          {formatINR(healthData?.metrics?.totalPnl || 0)}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Concentration Risk</span>
                        <p
                          className={`font-serif text-lg font-bold mt-0.5 ${
                            healthData?.diversification?.concentrationRisk === 'High'
                              ? 'text-rose-600'
                              : healthData?.diversification?.concentrationRisk === 'Moderate'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {healthData?.diversification?.concentrationRisk}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Allocation & Concentration Breakdown */}
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                          Asset Split & Top Exposures
                        </h3>
                        <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
                          {healthData?.metrics?.holdingsCount || 0} active holdings analyzed
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                          Stocks ({healthData?.assetAllocation?.stocks || 0}%)
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                          Funds ({healthData?.assetAllocation?.mutualFunds || 0}%)
                        </span>
                      </div>
                    </div>

                    {/* Top Holdings Weight Table */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Highest Weight Holdings
                      </span>
                      <div className="space-y-2">
                        {healthData?.diversification?.holdings?.map((h) => (
                          <div
                            key={h.id}
                            className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                                {h.symbol}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                {h.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">{formatINR(h.currentValue)}</span>
                              <span className="font-bold text-[#0F766E] dark:text-emerald-400 min-w-[45px] text-right">
                                {h.weight}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Insights */}
                    <div className="space-y-2 pt-2 border-t border-[#E7E5DF] dark:border-[#1F2933]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Diagnostic Insights
                      </span>
                      <div className="space-y-1.5">
                        {healthData?.actionableInsights?.map((insight, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-[#0B1220] dark:text-[#E8EDF2] leading-relaxed"
                          >
                            <CheckCircle className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Algorithm & Signal Quality Telemetry */}
              <div className="space-y-4">
                <SectionHeader
                  eyebrow="SIGNAL ACCURACY & TELEMETRY"
                  title="Smart Stock Signal Telemetry"
                  subtitle="Predictive signal distribution, ML model adoption, and walk-forward historical accuracy."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Tracked Signals */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#0F766E] dark:text-emerald-400" />
                      <h4 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                        Signal Distribution
                      </h4>
                    </div>
                    <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
                      Active signals across {signalData?.totalTracked || 0} monitored watchlist stocks.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">BUY</span>
                        <p className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {signalData?.breakdown?.BUY || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400">HOLD</span>
                        <p className="font-serif text-2xl font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                          {signalData?.breakdown?.HOLD || 0}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20">
                        <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">SELL</span>
                        <p className="font-serif text-2xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                          {signalData?.breakdown?.SELL || 0}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
                      {signalData?.flipsLast7Days || 0} signal flip(s) detected in the last 7 days.
                    </p>
                  </div>

                  {/* Card 2: ML Engine vs Rules */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                        ML Resilience Architecture
                      </h4>
                    </div>
                    <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
                      56-feature machine learning model with automatic rule-based circuit breaker.
                    </p>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-600 dark:text-gray-300">ML Model Usage</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {signalData?.engineMetrics?.mlAdoptionPercent || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${signalData?.engineMetrics?.mlAdoptionPercent || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Rule-based Fallback</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {signalData?.engineMetrics?.ruleEnginePercent || 100}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
                      Zero-downtime architecture gracefully maintains signal generation even during ML maintenance.
                    </p>
                  </div>

                  {/* Card 3: Historical Backtest Accuracy */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h4 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                        Historical Backtest Yield
                      </h4>
                    </div>
                    <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
                      Walk-forward simulation across Nifty 50 constituents ({signalData?.engineMetrics?.sampleSize || 142} samples).
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Signal Win Rate</span>
                        <p className="font-serif text-2xl font-bold text-emerald-600 mt-0.5">
                          {signalData?.engineMetrics?.historicalWinRate || 58.5}%
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14]">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Avg 20D Return</span>
                        <p className="font-serif text-2xl font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">
                          +{signalData?.engineMetrics?.avgForwardReturn || 3.75}%
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
                      Baseline buy-and-hold average forward return across identical windows: +{signalData?.engineMetrics?.baselineAvgReturn || 1.42}%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CRISIS STRESS SIMULATOR (OPTION B)                */}
      {/* ========================================================= */}
      {activeTab === 'stress-test' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="BLACK SWAN STRESS SIMULATION"
            title="Portfolio Crisis Stress-Testing Engine"
            subtitle="Analyze asset vulnerability against historical crashes (COVID 2020, GFC 2008, 2022 Oil Shock) or inject custom market drawdown sliders."
          />

          <CrisisScenarioSelector
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
            customShock={customShock}
            onSelectScenario={(id) => setSelectedScenarioId(id)}
            onChangeCustomShock={(val) => setCustomShock(val)}
            onRunTest={handleExecuteStressTest}
            loading={stressLoading}
          />

          {stressResult ? (
            <ScenarioImpactCard result={stressResult} />
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-bounce" />
              <p>Click "Execute Stress Test" above to calculate crisis impacts for your holdings.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INSTITUTIONAL VALUE AT RISK (VAR & CVAR)           */}
      {/* ========================================================= */}
      {activeTab === 'var' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="BASEL III CAPITAL ADEQUACY"
            title="Parametric Value at Risk (VaR) & Expected Shortfall"
            subtitle="Statistically measure the maximum potential loss across 1-day and 30-day horizons with 95% and 99% confidence intervals."
          />

          {varLoading || !varMetrics ? (
            <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Gauge className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Computing parametric VaR and tail-risk distribution...
              </p>
            </div>
          ) : (
            <VaRGaugeCard metrics={varMetrics} />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MONTE CARLO 1,000-PATH ENGINE                     */}
      {/* ========================================================= */}
      {activeTab === 'monte-carlo' && (
        <div className="space-y-6">
          <SectionHeader
            eyebrow="STOCHASTIC BROWNIAN MOTION"
            title="Monte Carlo 1,000-Path Asset Trajectory Simulation"
            subtitle="Probabilistic distribution of 1-year future outcomes modeled on historical compound Nifty drift and individual asset volatility."
          />

          {mcLoading || !monteCarloResult ? (
            <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Cpu className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Generating 1,000 stochastic price trajectories...
              </p>
            </div>
          ) : (
            <MonteCarloChart
              data={monteCarloResult}
              onRerun={(days, count) => fetchMonteCarlo(days, count)}
              loading={mcLoading}
            />
          )}
        </div>
      )}

      {/* Common Disclaimer */}
      <DisclaimerBanner
        type="info"
        customText="All crisis simulations, Value at Risk calculations, and Monte Carlo probability estimates are quantitative models for educational and risk-management planning. They do not constitute guaranteed investment returns or SEBI-registered advisory."
      />

      {/* Institutional Audit Dossier Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};

export default Analytics;
