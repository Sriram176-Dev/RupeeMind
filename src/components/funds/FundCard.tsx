import React from 'react';
import { Link } from 'react-router-dom';
import type { MutualFund } from '../../types';
import { RiskMeter } from '../ui/RiskMeter';
import { formatPercent } from '../../lib/utils';
import { ArrowUpRight } from 'lucide-react';
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
    <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between hover:border-slate-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-200 group">
      <div>
        {/* Top Badges & Compare */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              {fund.category}
            </span>
            {fund.sharpeRatio !== null && fund.sharpeRatio !== undefined ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                <span className="font-mono text-[10px]">Sharpe {fund.sharpeRatio.toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {showCompareOption && onToggleCompare && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none hover:text-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={isCompared}
                onChange={() => onToggleCompare(fund.code)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 border-slate-300 cursor-pointer"
              />
              <span className="text-[11px] font-medium">Compare</span>
            </label>
          )}
        </div>

        {/* Fund Title & House */}
        <Link
          to={`/funds/${fund.code}`}
          className="block text-[15px] font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2 tracking-tight"
        >
          {fund.name}
        </Link>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {fund.fundHouse}
        </p>

        {/* Risk & Expense ratio */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Risk Profile</span>
            <RiskMeter level={fund.riskLevel as any} />
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Expense Drag</span>
            <p className="font-mono font-semibold text-slate-800 mt-0.5">
              {fund.expenseRatio !== null && fund.expenseRatio !== undefined ? `${fund.expenseRatio}%` : '—'}
            </p>
          </div>
        </div>

        {/* Returns Grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 text-center border border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">1Y CAGR</p>
            <p className={cn('text-xs font-mono font-semibold tabular-nums mt-0.5', (fund.cagr1Y ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {fund.cagr1Y !== null && fund.cagr1Y !== undefined ? formatPercent(fund.cagr1Y) : '—'}
            </p>
          </div>
          <div className="border-x border-slate-200/70">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">3Y CAGR</p>
            <p className={cn('text-xs font-mono font-semibold tabular-nums mt-0.5', (fund.cagr3Y ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {fund.cagr3Y !== null && fund.cagr3Y !== undefined ? formatPercent(fund.cagr3Y) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">5Y CAGR</p>
            <p className={cn('text-xs font-mono font-semibold tabular-nums mt-0.5', (fund.cagr5Y ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {fund.cagr5Y !== null && fund.cagr5Y !== undefined ? formatPercent(fund.cagr5Y) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500">
          NAV: <span className="font-semibold text-slate-900">₹{fund.nav?.toFixed(2) || '—'}</span>
        </span>
        <Link
          to={`/funds/${fund.code}`}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Analyze Fund</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
