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
        'p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col justify-between transition-all hover:border-[#0F766E]/30 dark:hover:border-emerald-500/30',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6572] dark:text-[#8A97A6]">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
          {value}
        </p>

        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded-md',
                trend.isPositive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
