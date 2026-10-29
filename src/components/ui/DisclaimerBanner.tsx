import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { APP_CONFIG } from '../../config';

interface DisclaimerBannerProps {
  type?: 'warning' | 'info';
  customText?: string;
  className?: string;
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  type = 'warning',
  customText,
  className = '',
  compact = false,
}) => {
  const isWarn = type === 'warning';
  const Icon = isWarn ? AlertTriangle : Info;

  return (
    <div
      className={`${compact ? 'p-3 text-[11px]' : 'p-4 text-xs'} rounded-2xl flex items-start gap-3 leading-relaxed border ${
        isWarn
          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
          : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
      } ${className}`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 mt-0.5 ${
          isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
        }`}
      />
      <div>
        <p className="font-semibold mb-0.5">Educational Signal Disclaimer</p>
        <p className="opacity-90">
          {customText || APP_CONFIG.disclaimer}
        </p>
      </div>
    </div>
  );
};
