import React from 'react';
import type { StressTestResult } from '../../types';
import { formatINR } from '../../lib/utils';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Layers,
  ArrowDownRight,
  Lightbulb,
} from 'lucide-react';

interface Props {
  result: StressTestResult;
}

export const ScenarioImpactCard: React.FC<Props> = ({ result }) => {
  const {
    scenario,
    portfolioSource,
    initialPortfolioValue,
    projectedPortfolioValue,
    totalLoss,
    totalPercentageDrop,
    portfolioBeta,
    hardestHit,
    mostResilient,
    recommendations,
  } = result;

  const isPositive = totalPercentageDrop >= 0;

  const getSourceBadge = () => {
    switch (portfolioSource) {
      case 'REAL_HOLDINGS':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Holdings Portfolio
          </span>
        );
      case 'PAPER_POSITIONS':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Virtual Paper Positions
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Nifty 50 Sample Portfolio
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Level Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pre-Stress Value */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Initial Portfolio</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {formatINR(initialPortfolioValue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            {getSourceBadge()}
          </div>
        </div>

        {/* Post-Stress Value */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stressed Portfolio</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {formatINR(projectedPortfolioValue)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Under {scenario.title} conditions
          </p>
        </div>

        {/* Projected Loss / Gain */}
        <div
          className={`p-5 rounded-2xl border shadow-lg backdrop-blur-md ${
            isPositive
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Crisis Drawdown
            </span>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalLoss < 0 ? `-` : `+`}{formatINR(Math.abs(totalLoss))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {totalPercentageDrop}%
            </span>
            <span className="text-xs text-slate-400">total capital shift</span>
          </div>
        </div>

        {/* Portfolio Sensitivity Beta */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weighted Beta (β)</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {portfolioBeta.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {portfolioBeta > 1.2
              ? 'Aggressive (Amplifies Nifty swings)'
              : portfolioBeta < 0.85
              ? 'Defensive (Lower shock exposure)'
              : 'Market-neutral (Tracks benchmark)'}
          </p>
        </div>
      </div>

      {/* Asset Level Breakdown: Hardest Hit vs Most Resilient */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardest Hit */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-rose-400 font-semibold text-sm">
            <ArrowDownRight className="w-4 h-4" />
            <span>Hardest Hit Holdings (Highest Capital Bleed)</span>
          </div>

          <div className="space-y-3">
            {hardestHit.map((asset) => (
              <div
                key={asset.symbol}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{asset.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {asset.sector}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">β {asset.beta}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Value: {formatINR(asset.currentValue)} → {formatINR(asset.projectedValue)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {asset.percentageImpact}%
                  </span>
                  <div className="text-xs text-rose-500 font-mono">
                    {formatINR(asset.pnlImpact)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Resilient */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Most Resilient Holdings (Defensive Anchors)</span>
          </div>

          <div className="space-y-3">
            {mostResilient.map((asset) => (
              <div
                key={asset.symbol}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{asset.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {asset.sector}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">β {asset.beta}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Value: {formatINR(asset.currentValue)} → {formatINR(asset.projectedValue)}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-bold font-mono ${
                      asset.percentageImpact >= 0 ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {asset.percentageImpact >= 0 ? `+` : ``}{asset.percentageImpact}%
                  </span>
                  <div
                    className={`text-xs font-mono ${
                      asset.percentageImpact >= 0 ? 'text-emerald-500' : 'text-slate-400'
                    }`}
                  >
                    {formatINR(asset.pnlImpact)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Defensive Risk Recommendations */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-800/80 border border-slate-700 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-bold text-slate-100 text-base">Defensive Portfolio Recommendations</h4>
            <p className="text-xs text-slate-400">Institutional risk reduction measures derived from this scenario</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-slate-200 text-sm mb-1">{rec.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
