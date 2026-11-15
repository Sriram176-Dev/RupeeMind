import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between transition-colors hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>

        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'text-xs font-mono font-semibold px-2 py-0.5 rounded-md border',
                trend.isPositive
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                  : 'text-rose-700 bg-rose-50 border-rose-200/80'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-slate-400 font-mono">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
