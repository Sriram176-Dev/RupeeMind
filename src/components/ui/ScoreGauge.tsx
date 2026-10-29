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
  // Use a 270 degree arc for gauge look
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Determine color gradient
  const getColor = () => {
    if (type === 'health') {
      if (score >= 71) return { stroke: '#16A34A', bg: '#DCFCE7', text: 'text-emerald-600 dark:text-emerald-400' };
      if (score >= 41) return { stroke: '#D97706', bg: '#FEF3C7', text: 'text-amber-600 dark:text-amber-400' };
      return { stroke: '#DC2626', bg: '#FEE2E2', text: 'text-red-600 dark:text-red-400' };
    } else {
      // Risk score: 0-30 blue/teal, 31-70 amber, 71-100 purple/rose
      if (score <= 30) return { stroke: '#0F766E', bg: '#E6F4F1', text: 'text-teal-700 dark:text-teal-400' };
      if (score <= 70) return { stroke: '#4F46E5', bg: '#EEF2FF', text: 'text-indigo-600 dark:text-indigo-400' };
      return { stroke: '#EA580C', bg: '#FFEDD5', text: 'text-orange-600 dark:text-orange-400' };
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
            className="text-gray-100 dark:text-gray-800"
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
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>

        {/* Center score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
            {displayScore}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6572] dark:text-[#8A97A6]">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${themeColors.text} bg-black/5 dark:bg-white/5`}>
          {label}
        </span>
        {sublabel && (
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] mt-1 max-w-[160px] mx-auto">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};
