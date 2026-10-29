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
        'mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4',
        align === 'center' && 'text-center items-center',
        className
      )}
    >
      <div className={cn('space-y-1.5', align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-3xl')}>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0F766E] dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-[#5B6572] dark:text-[#8A97A6] leading-relaxed max-w-[65ch]">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
