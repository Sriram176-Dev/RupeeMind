import React from 'react';
import { Star } from 'lucide-react';
import type { StockQuote } from '../../types';
import { PriceChangeChip } from '../ui/PriceChangeChip';
import { formatINR } from '../../lib/utils';

interface StockQuoteHeaderProps {
  quote: StockQuote;
  isWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export const StockQuoteHeader: React.FC<StockQuoteHeaderProps> = ({
  quote,
  isWatchlist,
  onToggleWatchlist,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold px-2 py-0.5 rounded-md bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2]">
            {quote.symbol}
          </span>
          <span className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
            • {quote.sector}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-1">
          {quote.companyName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220] dark:text-[#E8EDF2] tabular-nums">
            {formatINR(quote.price)}
          </span>
          <PriceChangeChip change={quote.change} changePercent={quote.changePercent} showAmount={true} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleWatchlist}
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
            isWatchlist
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
              : 'border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2] hover:bg-black/5'
          }`}
        >
          <Star className={`w-4 h-4 ${isWatchlist ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
          <span>{isWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>
    </div>
  );
};
