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
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E7E5DF] shadow-xs text-xs">
        <div className="relative flex items-center justify-center">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              marketStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
            )}
          />
          {marketStatus.isOpen && (
            <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#0B1220]">
            {marketStatus.text}
          </span>
          {!compact && (
            <span className="text-[#5B6572] hidden sm:inline">
              • {marketStatus.subtext}
            </span>
          )}
        </div>

        <div
          className="border-l border-[#E7E5DF] pl-2 text-[10px] text-[#5B6572] flex items-center gap-1.5 cursor-help"
          title={`NSE/BSE live clock (delayed ~15m feed). Last data sync: ${lastUpdated.toLocaleTimeString('en-IN')}`}
        >
          <span className="px-1 py-0.5 rounded bg-gray-100 text-[9px] font-medium text-[#5B6572]">
            Delayed ~15m
          </span>
          <Clock className="w-3 h-3 text-[#5B6572]" />
          <span className="tabular-nums font-mono text-[10px]">
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
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-medium">
          <AlertCircle className="w-3 h-3" />
          <span>Showing last known data</span>
        </div>
      )}
    </div>
  );
});
