import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatPercent } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface PriceChangeChipProps {
  change: number;
  changePercent: number;
  showAmount?: boolean;
  size?: 'sm' | 'md';
}

export const PriceChangeChip: React.FC<PriceChangeChipProps> = ({
  change,
  changePercent,
  showAmount = false,
  size = 'md',
}) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-md tabular-nums border transition-colors',
        isPositive && 'text-emerald-800 bg-emerald-50/90 border-emerald-200/70',
        !isPositive && !isNeutral && 'text-rose-800 bg-rose-50/90 border-rose-200/70',
        isNeutral && 'text-slate-600 bg-slate-100 border-slate-200',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {isPositive && <ArrowUpRight className="w-3 h-3 text-emerald-700 shrink-0" />}
      {!isPositive && !isNeutral && <ArrowDownRight className="w-3 h-3 text-rose-700 shrink-0" />}
      {isNeutral && <Minus className="w-3 h-3 text-slate-500 shrink-0" />}
      
      {showAmount && (
        <span>
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
      )}
      <span className="font-mono tracking-tight">({formatPercent(changePercent)})</span>
    </div>
  );
};
