import React from 'react';
import { formatNumber } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  className?: string;
  showSlider?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  min = 500,
  max = 1000000,
  step = 500,
  helperText,
  className,
  showSlider = true,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    onChange(isNaN(num) ? 0 : num);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-[#0B1220] dark:text-[#E8EDF2]">{label}</label>
          <span className="font-serif font-bold text-sm text-[#0F766E] dark:text-emerald-400 tabular-nums">
            ₹{formatNumber(value)}
          </span>
        </div>
      )}

      <div className="relative rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] bg-white dark:bg-[#121821] focus-within:ring-2 focus-within:ring-[#0F766E] focus-within:border-transparent transition-all">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6572] dark:text-[#8A97A6] font-semibold text-sm">
          ₹
        </div>
        <input
          type="text"
          value={value ? formatNumber(value) : ''}
          onChange={handleInputChange}
          placeholder="0"
          className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums focus:outline-none"
        />
      </div>

      {showSlider && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#0F766E] dark:accent-emerald-500"
        />
      )}

      {helperText && (
        <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">{helperText}</p>
      )}
    </div>
  );
};
