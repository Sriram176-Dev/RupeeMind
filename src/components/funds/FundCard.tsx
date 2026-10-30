import React from 'react';
import { Link } from 'react-router-dom';
import type { MutualFund } from '../../types';
import { RiskMeter } from '../ui/RiskMeter';
import { formatINR, formatPercent, formatCompactINR } from '../../lib/utils';
import { ArrowUpRight, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FundCardProps {
  fund: MutualFund;
  isCompared?: boolean;
  onToggleCompare?: (code: string) => void;
  showCompareOption?: boolean;
}

export const FundCard: React.FC<FundCardProps> = ({
  fund,
  isCompared = false,
  onToggleCompare,
  showCompareOption = true,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs flex flex-col justify-between hover:border-[#0F766E]/40 transition-all group">
      <div>
        {/* Top Badges & Compare */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4F1] text-[#0F766E] border border-emerald-500/20">
              {fund.category}
            </span>
            {fund.sharpeRatio !== null && fund.sharpeRatio !== undefined ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-300/30">
                <span>Sharpe {fund.sharpeRatio.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {showCompareOption && onToggleCompare && (
            <label className="flex items-center gap-1.5 text-xs text-[#5B6572] cursor-pointer select-none hover:text-[#0B1220]">
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => onToggleCompare(fund.code)}
                className="w-4 h-4 rounded-sm text-[#0F766E] focus:ring-emerald-500 focus:ring-offset-0 border-[#E7E5DF]"
              />
              <span className="text-[11px]">Compare</span>
            </label>
          )}
        </div>

        {/* Fund Title & House */}
        <Link
          to={`/funds/${fund.code}`}
          className="block font-serif text-lg font-bold text-[#0B1220] group-hover:text-[#0F766E] transition-colors leading-snug line-clamp-2"
        >
          {fund.name}
        </Link>
        <p className="text-xs text-[#5B6572] mt-1">
          {fund.fundHouse}
        </p>

        {/* Risk & Expense ratio */}
        <div className="mt-4 pt-3 border-t border-[#E7E5DF] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#5B6572]">Risk (Indicative)</span>
            <RiskMeter level={fund.riskLevel as any} />
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#5B6572]">Expense</span>
            <p className="text-xs font-semibold text-[#0B1220]">
              {fund.expenseRatio !== null && fund.expenseRatio !== undefined ? `${fund.expenseRatio}%` : '—'}
            </p>
          </div>
        </div>

        {/* Returns Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAFAF7] text-center border border-[#E7E5DF]">
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#5B6572]">1Y CAGR</p>
            <p className={cn('text-xs font-bold tabular-nums mt-0.5', (fund.cagr1Y ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {fund.cagr1Y !== null && fund.cagr1Y !== undefined ? formatPercent(fund.cagr1Y) : '—'}
            </p>
          </div>
          <div className="border-x border-[#E7E5DF]">
            <p className="text-[10px] uppercase font-semibold text-[#5B6572]">3Y CAGR</p>
            <p className={cn('text-xs font-bold tabular-nums mt-0.5', (fund.cagr3Y ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {fund.cagr3Y !== null && fund.cagr3Y !== undefined ? formatPercent(fund.cagr3Y) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-[#5B6572]">5Y CAGR</p>
            <p className={cn('text-xs font-bold tabular-nums mt-0.5', (fund.cagr5Y ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {fund.cagr5Y !== null && fund.cagr5Y !== undefined ? formatPercent(fund.cagr5Y) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-5 pt-3 border-t border-[#E7E5DF] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#5B6572] uppercase">Current NAV</span>
          <p className="text-sm font-bold text-[#0B1220] tabular-nums">
            {formatINR(fund.nav)}
          </p>
        </div>

        <Link
          to={`/funds/${fund.code}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0F766E] bg-[#E6F4F1] hover:bg-[#0F766E] hover:text-white transition-all min-h-[36px]"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
