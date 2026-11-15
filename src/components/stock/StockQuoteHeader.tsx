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
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-900">
            {quote.symbol}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            • {quote.sector}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {quote.companyName}
        </h1>

        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
            {formatINR(quote.price)}
          </span>
          <PriceChangeChip change={quote.change} changePercent={quote.changePercent} showAmount={true} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleWatchlist}
          className={`px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors ${
            isWatchlist
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Star className={`w-4 h-4 ${isWatchlist ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
          <span>{isWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>
    </div>
  );
};
