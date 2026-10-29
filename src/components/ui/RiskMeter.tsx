import React from 'react';
import type { FundRiskLevel } from '../../types';
import { cn } from '../../lib/utils';

interface RiskMeterProps {
  level: FundRiskLevel;
  showText?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ level, showText = true }) => {
  const levels: FundRiskLevel[] = ['Low', 'Moderately Low', 'Moderate', 'Moderately High', 'Very High'];
  const currentIndex = levels.indexOf(level);

  const colors = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-amber-500',
    'bg-orange-500',
    'bg-rose-500',
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {levels.map((lvl, index) => {
          const isActive = index <= currentIndex;
          return (
            <div
              key={lvl}
              className={cn(
                'h-1.5 w-4 rounded-full transition-colors',
                isActive ? colors[currentIndex] : 'bg-gray-200 dark:bg-gray-800'
              )}
              title={lvl}
            />
          );
        })}
      </div>
      {showText && (
        <span className="text-[11px] font-medium text-[#5B6572] dark:text-[#8A97A6]">
          {level} Risk
        </span>
      )}
    </div>
  );
};
