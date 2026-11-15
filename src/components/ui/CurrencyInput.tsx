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
          <label className="font-semibold text-slate-900">{label}</label>
          <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
            ₹{formatNumber(value)}
          </span>
        </div>
      )}

      <div className="relative rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-colors">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-semibold text-sm">
          ₹
        </div>
        <input
          type="text"
          value={value ? formatNumber(value) : ''}
          onChange={handleInputChange}
          placeholder="0"
          className="w-full pl-8 pr-4 py-2 bg-transparent text-sm font-mono font-semibold text-slate-900 tabular-nums focus:outline-none"
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
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400 font-mono">{helperText}</p>
      )}
    </div>
  );
};
