import React from 'react';
import type { StockQuote } from '../../types';
import { formatCompactINR } from '../../lib/utils';

interface StockFundamentalsGridProps {
  quote: StockQuote;
}

export const StockFundamentalsGrid: React.FC<StockFundamentalsGridProps> = ({ quote }) => {
  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-3">
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        Key Fundamentals & Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Market Cap</span>
          <p className="font-mono font-bold text-sm text-slate-900 mt-0.5 tabular-nums">
            {formatCompactINR(quote.marketCap * 10000000)}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono">52W High / Low</span>
          <p className="font-mono font-bold text-sm text-slate-900 mt-0.5 tabular-nums">
            ₹{quote.fiftyTwoWeekHigh} / ₹{quote.fiftyTwoWeekLow}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Day High / Low</span>
          <p className="font-mono font-bold text-sm text-slate-900 mt-0.5 tabular-nums">
            ₹{quote.dayHigh} / ₹{quote.dayLow}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] text-slate-500 uppercase font-mono">Index Inclusion</span>
          <p className="font-medium text-xs text-emerald-700 mt-0.5 font-mono">
            {quote.isNifty50 ? 'NIFTY 50 • Large Cap' : 'NSE Next 50'}
          </p>
        </div>
      </div>
    </div>
  );
};
