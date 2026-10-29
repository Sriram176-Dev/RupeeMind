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
        'inline-flex items-center gap-1 font-semibold rounded-lg tabular-nums',
        isPositive && 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
        !isPositive && !isNeutral && 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
        isNeutral && 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
      )}
    >
      {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
      {!isPositive && !isNeutral && <ArrowDownRight className="w-3.5 h-3.5" />}
      {isNeutral && <Minus className="w-3.5 h-3.5" />}
      
      {showAmount && (
        <span>
          {isPositive ? '+' : ''}{change.toFixed(2)}
        </span>
      )}
      <span>({formatPercent(changePercent)})</span>
    </div>
  );
};
