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
        <div className="p-5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs">
          <div className="flex items-center justify-between text-[#5B6572] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Initial Portfolio</span>
            <Layers className="w-4 h-4 text-[#5B6572]" />
          </div>
          <div className="text-2xl font-black text-[#0B1220] font-mono">
            {formatINR(initialPortfolioValue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#5B6572]">
            {getSourceBadge()}
          </div>
        </div>

        {/* Post-Stress Value */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs">
          <div className="flex items-center justify-between text-[#5B6572] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stressed Portfolio</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-[#0B1220] font-mono">
            {formatINR(projectedPortfolioValue)}
          </div>
          <p className="text-xs text-[#5B6572] mt-2">
            Under {scenario.title} conditions
          </p>
        </div>

        {/* Projected Loss / Gain */}
        <div
          className={`p-5 rounded-2xl border shadow-xs ${
            isPositive
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6572]">
              Crisis Drawdown
            </span>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {totalLoss < 0 ? `-` : `+`}{formatINR(Math.abs(totalLoss))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totalPercentageDrop}%
            </span>
            <span className="text-xs text-[#5B6572]">total capital shift</span>
          </div>
        </div>

        {/* Portfolio Sensitivity Beta */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs">
          <div className="flex items-center justify-between text-[#5B6572] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weighted Beta (β)</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1220] font-mono">
            {portfolioBeta.toFixed(2)}
          </div>
          <p className="text-xs text-[#5B6572] mt-2">
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
        <div className="p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-rose-600 font-semibold text-sm">
            <ArrowDownRight className="w-4 h-4" />
            <span>Hardest Hit Holdings (Highest Capital Bleed)</span>
          </div>

          <div className="space-y-3">
            {hardestHit.map((asset) => (
              <div
                key={asset.symbol}
                className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B1220] text-sm">{asset.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-[#0B1220]">
                      {asset.sector}
                    </span>
                    <span className="text-xs text-[#5B6572] font-mono">β {asset.beta}</span>
                  </div>
                  <div className="text-xs text-[#5B6572] mt-1">
                    Value: {formatINR(asset.currentValue)} → {formatINR(asset.projectedValue)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-rose-600">
                    {asset.percentageImpact}%
                  </span>
                  <div className="text-xs text-rose-700 font-mono font-medium">
                    {formatINR(asset.pnlImpact)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Resilient */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Most Resilient Holdings (Defensive Anchors)</span>
          </div>

          <div className="space-y-3">
            {mostResilient.map((asset) => (
              <div
                key={asset.symbol}
                className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B1220] text-sm">{asset.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-[#0B1220]">
                      {asset.sector}
                    </span>
                    <span className="text-xs text-[#5B6572] font-mono">β {asset.beta}</span>
                  </div>
                  <div className="text-xs text-[#5B6572] mt-1">
                    Value: {formatINR(asset.currentValue)} → {formatINR(asset.projectedValue)}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-bold font-mono ${
                      asset.percentageImpact >= 0 ? 'text-emerald-600' : 'text-[#0B1220]'
                    }`}
                  >
                    {asset.percentageImpact >= 0 ? `+` : ``}{asset.percentageImpact}%
                  </span>
                  <div
                    className={`text-xs font-mono font-medium ${
                      asset.percentageImpact >= 0 ? 'text-emerald-700' : 'text-[#5B6572]'
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
      <div className="p-6 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <Lightbulb className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-bold text-[#0B1220] text-base">Defensive Portfolio Recommendations</h4>
            <p className="text-xs text-[#5B6572]">Institutional risk reduction measures derived from this scenario</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-[#E7E5DF] flex items-start gap-3 shadow-xs"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-[#0B1220] text-sm mb-1">{rec.title}</h5>
                <p className="text-xs text-[#5B6572] leading-relaxed">{rec.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
