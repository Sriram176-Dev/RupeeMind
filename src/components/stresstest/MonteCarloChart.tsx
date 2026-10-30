import React, { useState } from 'react';
import type { MonteCarloSimulationResult } from '../../types';
import { formatINR, formatCompactINR } from '../../lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Percent,
  RefreshCw,
  Info,
} from 'lucide-react';

interface Props {
  data: MonteCarloSimulationResult;
  onRerun: (days: number, count: number) => void;
  loading: boolean;
}

export const MonteCarloChart: React.FC<Props> = ({ data, onRerun, loading }) => {
  const [tradingDays, setTradingDays] = useState(data.timeHorizonDays || 252);
  const { initialValue, expectedReturnRate, volatilityApplied, trajectoryChartData, summary } = data;

  const handleApplyDays = (days: number) => {
    setTradingDays(days);
    onRerun(days, 1000);
  };

  return (
    <div className="bg-white border border-[#E7E5DF] rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E5DF] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#0F766E] border border-emerald-200">
              <Cpu className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-[#0B1220]">
              Monte Carlo 1,000-Path Geometric Brownian Motion
            </h3>
          </div>
          <p className="text-sm text-[#5B6572] mt-1">
            Simulates 1,000 randomized market trajectories over 1 year using Nifty historical drift (μ={expectedReturnRate}%) & portfolio volatility (σ={volatilityApplied}%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex items-center bg-[#FAFAF7] rounded-xl p-1 border border-[#E7E5DF]">
            <button
              type="button"
              onClick={() => handleApplyDays(63)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 63
                  ? 'bg-[#0F766E] text-white shadow'
                  : 'text-[#5B6572] hover:text-[#0B1220]'
              }`}
            >
              3 Months
            </button>
            <button
              type="button"
              onClick={() => handleApplyDays(126)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 126
                  ? 'bg-[#0F766E] text-white shadow'
                  : 'text-[#5B6572] hover:text-[#0B1220]'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => handleApplyDays(252)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 252
                  ? 'bg-[#0F766E] text-white shadow'
                  : 'text-[#5B6572] hover:text-[#0B1220]'
              }`}
            >
              1 Year (252d)
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRerun(tradingDays, 1000)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#FAFAF7] hover:bg-gray-100 text-[#0B1220] border border-[#E7E5DF] transition-colors disabled:opacity-50"
            title="Re-run 1,000 simulations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F766E]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Outcome Probability Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Profit Probability */}
        <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <div className="flex items-center justify-between text-xs text-[#5B6572] mb-1">
            <span>Probability of Profit</span>
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {summary.profitProbability}%
          </div>
          <span className="text-xs text-[#5B6572]">Positive return probability</span>
        </div>

        {/* Median 50th Outcome */}
        <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <div className="flex items-center justify-between text-xs text-[#5B6572] mb-1">
            <span>Median Target (50th)</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-[#0B1220] font-mono">
            {formatINR(summary.medianFinal)}
          </div>
          <span className="text-xs text-emerald-600 font-bold font-mono">
            +{summary.medianReturn}% expected
          </span>
        </div>

        {/* 95th Percentile Bull Case */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between text-xs text-[#5B6572] mb-1">
            <span>Bull Case (95th %ile)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {formatINR(summary.bullCaseFinal)}
          </div>
          <span className="text-xs text-emerald-600 font-bold font-mono">
            +{summary.bullCaseReturn}% upside
          </span>
        </div>

        {/* 5th Percentile Bear Case */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
          <div className="flex items-center justify-between text-xs text-[#5B6572] mb-1">
            <span>Bear Case (5th %ile)</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">
            {formatINR(summary.bearCaseFinal)}
          </div>
          <span className="text-xs text-rose-600 font-bold font-mono">
            {summary.bearCaseReturn}% downside
          </span>
        </div>
      </div>

      {/* Probability Cone Area Chart */}
      <div className="h-80 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="medianGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5DF" opacity={0.8} />
            <XAxis dataKey="day" stroke="#5B6572" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#5B6572"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v: any) => formatCompactINR(Number(v))}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#E7E5DF',
                borderRadius: '0.75rem',
                color: '#0B1220',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(val: any, name: any) => [formatINR(Number(val)), name]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '12px', color: '#0B1220' }}
            />

            <Area
              type="monotone"
              dataKey="bullCase"
              name="95th Percentile (Bull Case)"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bullGrad)"
            />
            <Area
              type="monotone"
              dataKey="median"
              name="50th Percentile (Median Expected)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#medianGrad)"
            />
            <Area
              type="monotone"
              dataKey="bearCase"
              name="5th Percentile (Bear Case)"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bearGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs text-[#5B6572]">
        <Info className="w-4 h-4 text-[#0F766E] shrink-0" />
        <span>
          Starting from portfolio value {formatINR(initialValue)}. Paths account for continuous compound drift with stochastic diffusion calibrated to historical Indian equity dispersion.
        </span>
      </div>
    </div>
  );
};
