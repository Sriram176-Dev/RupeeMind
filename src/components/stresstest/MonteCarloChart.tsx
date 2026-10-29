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
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-100">
              Monte Carlo 1,000-Path Geometric Brownian Motion
            </h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulates 1,000 randomized market trajectories over 1 year using Nifty historical drift (μ={expectedReturnRate}%) & portfolio volatility (σ={volatilityApplied}%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => handleApplyDays(63)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 63
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 Months
            </button>
            <button
              type="button"
              onClick={() => handleApplyDays(126)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 126
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => handleApplyDays(252)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tradingDays === 252
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Year (252d)
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRerun(tradingDays, 1000)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            title="Re-run 1,000 simulations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Outcome Probability Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Profit Probability */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Probability of Profit</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary.profitProbability}%
          </div>
          <span className="text-xs text-slate-500">Positive return probability</span>
        </div>

        {/* Median 50th Outcome */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Median Target (50th)</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-slate-100 font-mono">
            {formatINR(summary.medianFinal)}
          </div>
          <span className="text-xs text-emerald-400 font-bold font-mono">
            +{summary.medianReturn}% expected
          </span>
        </div>

        {/* 95th Percentile Bull Case */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bull Case (95th %ile)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">
            {formatINR(summary.bullCaseFinal)}
          </div>
          <span className="text-xs text-emerald-400 font-bold font-mono">
            +{summary.bullCaseReturn}% upside
          </span>
        </div>

        {/* 5th Percentile Bear Case */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Bear Case (5th %ile)</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-300 font-mono">
            {formatINR(summary.bearCaseFinal)}
          </div>
          <span className="text-xs text-rose-400 font-bold font-mono">
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

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v: any) => formatCompactINR(Number(v))}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any) => [formatINR(Number(val)), name]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
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

      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Starting from portfolio value {formatINR(initialValue)}. Paths account for continuous compound drift with stochastic diffusion calibrated to historical Indian equity dispersion.
        </span>
      </div>
    </div>
  );
};
