import React, { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0 - 100
  size?: number; // default 140
  strokeWidth?: number; // default 10
  label: string;
  sublabel?: string;
  type?: 'risk' | 'health';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  type = 'risk',
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    if (end === 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 1200; // ms
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Determine color gradient
  const getColor = () => {
    if (type === 'health') {
      if (score >= 71) return { stroke: '#059669', bg: '#ECFDF5', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      if (score >= 41) return { stroke: '#D97706', bg: '#FFFBEB', text: 'text-amber-700 bg-amber-50 border-amber-200' };
      return { stroke: '#DC2626', bg: '#FEF2F2', text: 'text-rose-700 bg-rose-50 border-rose-200' };
    } else {
      if (score <= 30) return { stroke: '#047857', bg: '#ECFDF5', text: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
      if (score <= 70) return { stroke: '#3B82F6', bg: '#EFF6FF', text: 'text-blue-700 bg-blue-50 border-blue-200' };
      return { stroke: '#E11D48', bg: '#FFF1F2', text: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
  };

  const themeColors = getColor();

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100"
            fill="transparent"
          />
          {/* Animated score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={themeColors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>

        {/* Center score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {displayScore}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-2.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${themeColors.text}`}>
          {label}
        </span>
        {sublabel && (
          <p className="text-xs text-slate-500 mt-1 max-w-[160px] mx-auto leading-normal">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};
