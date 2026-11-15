import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  className,
  align = 'left',
  action,
}) => {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-4',
        align === 'center' && 'text-center items-center',
        className
      )}
    >
      <div className={cn('space-y-1.5', align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wider uppercase text-emerald-800 bg-emerald-50 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-slate-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[68ch]">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
