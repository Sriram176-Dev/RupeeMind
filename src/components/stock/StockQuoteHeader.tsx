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
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#E7E5DF] text-[#0B1220]">
            {quote.symbol}
          </span>
          <span className="text-xs text-[#5B6572]">
            • {quote.sector}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220] mt-1">
          {quote.companyName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1220] tabular-nums">
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
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'border-[#E7E5DF] text-[#0B1220] hover:bg-black/5'
          }`}
        >
          <Star className={`w-4 h-4 ${isWatchlist ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
          <span>{isWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>
    </div>
  );
};
