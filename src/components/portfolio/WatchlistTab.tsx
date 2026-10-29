import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { StockQuote } from '../../types';
import { PriceChangeChip } from '../ui/PriceChangeChip';
import { SignalBadge } from '../ui/SignalBadge';
import { formatINR } from '../../lib/utils';

interface WatchlistTabProps {
  watchlistQuotes: StockQuote[];
  onToggleWatch: (symbol: string) => void;
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({
  watchlistQuotes,
  onToggleWatch,
}) => {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAF7] dark:bg-[#0B0F14] text-[#5B6572] dark:text-[#8A97A6]">
            <tr>
              <th className="py-3 px-4 font-semibold">Symbol / Company</th>
              <th className="py-3 px-4 font-semibold text-right">LTP (INR)</th>
              <th className="py-3 px-4 font-semibold text-right">Day Change</th>
              <th className="py-3 px-4 font-semibold text-center">Algorithmic Signal</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5DF] dark:divide-[#1F2933]">
            {watchlistQuotes.map((stk) => (
              <tr key={stk.symbol} className="hover:bg-[#FAFAF7] dark:hover:bg-[#1A2330]">
                <td className="py-3.5 px-4">
                  <Link
                    to={`/market/${stk.symbol}`}
                    className="font-mono font-bold text-sm text-[#0B1220] dark:text-[#E8EDF2] hover:underline"
                  >
                    {stk.symbol}
                  </Link>
                  <p className="text-[11px] text-[#5B6572]">{stk.companyName}</p>
                </td>
                <td className="py-3.5 px-4 text-right font-serif font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
                  {formatINR(stk.price)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <PriceChangeChip change={stk.change} changePercent={stk.changePercent} size="sm" />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <SignalBadge
                    signal={stk.changePercent >= 0.8 ? 'BUY' : stk.changePercent <= -0.8 ? 'SELL' : 'HOLD'}
                    size="sm"
                  />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    onClick={() => onToggleWatch(stk.symbol)}
                    className="text-amber-500 p-1"
                    title="Remove"
                  >
                    <Star className="w-4 h-4 fill-amber-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
