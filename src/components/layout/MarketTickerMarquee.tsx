import React from 'react';
import { Link } from 'react-router-dom';
import { useMarket } from '../../context/MarketContext';
import { formatINR } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const MarketTickerMarquee: React.FC = () => {
  const { indices, quotes, marketStatus } = useMarket();

  // Combine indices and top active quotes for rich ticker coverage
  const tickerItems = [
    ...indices.map((idx) => ({
      key: `idx-${idx.symbol}`,
      symbol: idx.name,
      price: idx.value,
      change: idx.change,
      changePercent: idx.changePercent,
      isIndex: true,
      path: '/markets?tab=stocks',
    })),
    ...quotes.slice(0, 12).map((q) => ({
      key: `stk-${q.symbol}`,
      symbol: q.symbol,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      isIndex: false,
      path: `/market/${q.symbol}`,
    })),
  ];

  if (tickerItems.length === 0) return null;

  // Duplicate for seamless infinite marquee loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-[#0B0F19] border-b border-slate-800/90 text-slate-300 h-8 flex items-center overflow-hidden select-none z-30 relative font-mono text-[11px]">
      {/* Left fixed indicator: Market Status Badge */}
      <div className="shrink-0 px-3 h-full bg-[#0F172A] border-r border-slate-800 flex items-center gap-2 z-10 shadow-md">
        <span className="relative flex h-2 w-2">
          {marketStatus.isOpen && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              marketStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
            )}
          />
        </span>
        <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
          {marketStatus.isOpen ? 'NSE LIVE' : 'NSE CLOSED'}
        </span>
      </div>

      {/* Scrolling Marquee Container */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-marquee flex items-center gap-6 sm:gap-8 whitespace-nowrap pl-4">
          {duplicatedItems.map((item, idx) => {
            const isPositive = item.change >= 0;
            return (
              <Link
                key={`${item.key}-${idx}`}
                to={item.path}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors group cursor-pointer"
              >
                <span className="text-slate-400 font-semibold group-hover:text-emerald-400 transition-colors">
                  {item.symbol}
                </span>
                <span className="text-slate-200 tabular-nums font-medium">
                  {formatINR(item.price, false)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center text-[10px] tabular-nums font-semibold px-1 py-0.2 rounded',
                    isPositive
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : 'text-rose-400 bg-rose-950/60'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />
                  )}
                  {isPositive ? '+' : ''}
                  {item.changePercent.toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right gradient fade overlay */}
      <div className="shrink-0 w-8 h-full bg-gradient-to-l from-[#0B0F19] to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default MarketTickerMarquee;
