import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import type { SignalType } from '../../types';
import { Lock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SignalBadgeProps {
  signal: SignalType;
  signalStrength?: number;
  /** @deprecated Use signalStrength instead */
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showStrength?: boolean;
  score?: number;
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({
  signal,
  signalStrength,
  confidence,
  size = 'md',
  showStrength = true,
  score,
}) => {
  const { isAuthenticated } = useAuth();

  const getSignalConfig = (sig: SignalType) => {
    switch (sig) {
      case 'BUY':
        return {
          label: 'BUY',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: ArrowUpRight,
        };
      case 'SELL':
        return {
          label: 'SELL',
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          icon: ArrowDownRight,
        };
      case 'HOLD':
      default:
        return {
          label: 'HOLD',
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          icon: Minus,
        };
    }
  };

  const config = getSignalConfig(signal);
  const Icon = config.icon;

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 text-xs font-medium cursor-pointer hover:border-emerald-400 transition-colors"
        title="Log in to view signals"
      >
        <span className="blur-[3.5px] select-none font-semibold">BUY 85%</span>
        <Lock className="w-3 h-3 text-emerald-600 absolute right-2 opacity-90 group-hover:scale-110 transition-transform" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border font-semibold tracking-tight transition-all select-none',
        config.bg,
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3.5 py-1.5 text-sm'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {showStrength && (signalStrength != null || confidence != null) && (
        <span
          className="opacity-80 font-normal ml-0.5 text-[10px] tabular-nums"
          title="Signal Strength: how many of the 5 indicator groups (RSI, MACD, SMA, Bollinger, Volume) agree on the direction. Higher = stronger consensus."
        >
          {signalStrength ?? confidence}%
        </span>
      )}
      {score !== undefined && (
        <span className="ml-1 px-1 py-0.2 rounded bg-black/10 text-[10px] font-mono">
          {score > 0 ? `+${score}` : score}
        </span>
      )}
    </div>
  );
};
