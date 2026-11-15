import React, { useState, useEffect } from 'react';
import { useMarket } from '../../context/MarketContext';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MarketStatusBadge: React.FC<{ compact?: boolean }> = React.memo(({ compact = false }) => {
  const { marketStatus, lastUpdated, isStale } = useMarket();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] text-xs">
        <div className="relative flex items-center justify-center">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              marketStatus.isOpen ? 'bg-emerald-600' : 'bg-amber-500'
            )}
          />
          {marketStatus.isOpen && (
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900 tracking-tight">
            {marketStatus.text}
          </span>
          {!compact && (
            <span className="text-slate-500 hidden sm:inline text-[11px]">
              • {marketStatus.subtext}
            </span>
          )}
        </div>

        <div
          className="border-l border-slate-200 pl-2 text-[11px] text-slate-500 flex items-center gap-1.5 cursor-help"
          title={`NSE/BSE live clock (delayed ~15m feed). Last data sync: ${lastUpdated.toLocaleTimeString('en-IN')}`}
        >
          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-mono font-medium text-slate-600 border border-slate-200/60 uppercase">
            NSE/BSE
          </span>
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="tabular-nums font-mono text-[11px] text-slate-700 font-medium">
            {currentTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            }).toLowerCase()}
          </span>
        </div>
      </div>

      {isStale && (
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Cached offline</span>
        </div>
      )}
    </div>
  );
});
