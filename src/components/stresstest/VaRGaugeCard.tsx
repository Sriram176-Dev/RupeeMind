import React from 'react';
import type { PortfolioVaRMetrics } from '../../types';
import { formatINR } from '../../lib/utils';
import { Shield, AlertCircle, Info, Activity, Gauge } from 'lucide-react';

interface Props {
  metrics: PortfolioVaRMetrics;
}

export const VaRGaugeCard: React.FC<Props> = ({ metrics }) => {
  const { totalValue, portfolioVolPercent, portfolioBeta, dailyVolPercent, var95, var99, cvar95 } =
    metrics;

  return (
    <div className="bg-white border border-[#E7E5DF] rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E7E5DF] gap-2">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Gauge className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#0B1220]">
              Parametric Value at Risk (VaR) & Tail Risk (CVaR)
            </h3>
            <p className="text-xs text-[#5B6572]">
              Institutional Basel III capital adequacy statistical metrics calibrated on current volatility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#5B6572] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E7E5DF]">
            Daily Vol: <strong className="text-[#0B1220]">{dailyVolPercent}%</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E7E5DF]">
            Annual Vol: <strong className="text-[#0B1220]">{portfolioVolPercent}%</strong>
          </span>
        </div>
      </div>

      {/* Primary VaR Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 95% Confidence VaR */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-[#0B1220] text-sm">95% Confidence VaR</span>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              1 in 20 Days Breach
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
              <span className="text-xs text-[#5B6572] font-medium">1-Day VaR (95%)</span>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatINR(var95.oneDay)}
              </div>
              <span className="text-xs text-[#5B6572] font-mono">
                {var95.oneDayPercent}% of portfolio
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
              <span className="text-xs text-[#5B6572] font-medium">30-Day Monthly VaR</span>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatINR(var95.thirtyDay)}
              </div>
              <span className="text-xs text-[#5B6572] font-mono">
                {var95.thirtyDayPercent}% of portfolio
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>{var95.meaning}</span>
          </div>
        </div>

        {/* 99% Confidence VaR */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-[#0B1220] text-sm">99% Confidence VaR (Extreme Tail)</span>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              1 in 100 Sessions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
              <span className="text-xs text-[#5B6572] font-medium">1-Day VaR (99%)</span>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatINR(var99.oneDay)}
              </div>
              <span className="text-xs text-[#5B6572] font-mono">
                {var99.oneDayPercent}% of portfolio
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
              <span className="text-xs text-[#5B6572] font-medium">30-Day Monthly VaR</span>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatINR(var99.thirtyDay)}
              </div>
              <span className="text-xs text-[#5B6572] font-mono">
                {var99.thirtyDayPercent}% of portfolio
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 leading-relaxed">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{var99.meaning}</span>
          </div>
        </div>
      </div>

      {/* Expected Shortfall (CVaR) Sub-Banner */}
      <div className="p-4 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h5 className="font-semibold text-[#0B1220] text-sm">
              Expected Shortfall (Conditional VaR / CVaR)
            </h5>
            <p className="text-xs text-[#5B6572]">
              Average estimated capital loss when the 95% tail-risk barrier is violently breached.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-xs text-[#5B6572]">1-Day CVaR</span>
            <div className="text-sm font-bold font-mono text-amber-600">
              {formatINR(cvar95.oneDay)}
            </div>
          </div>
          <div className="border-l border-[#E7E5DF] pl-4">
            <span className="text-xs text-[#5B6572]">30-Day CVaR</span>
            <div className="text-sm font-bold font-mono text-amber-600">
              {formatINR(cvar95.thirtyDay)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
