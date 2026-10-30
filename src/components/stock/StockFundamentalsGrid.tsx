import React from 'react';
import type { StockQuote } from '../../types';
import { formatCompactINR } from '../../lib/utils';

interface StockFundamentalsGridProps {
  quote: StockQuote;
}

export const StockFundamentalsGrid: React.FC<StockFundamentalsGridProps> = ({ quote }) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-3">
      <h3 className="font-serif text-base font-bold text-[#0B1220]">
        Key Fundamentals & Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <span className="text-[10px] text-[#5B6572] uppercase">Market Cap</span>
          <p className="font-serif font-bold text-sm text-[#0B1220] mt-0.5">
            {formatCompactINR(quote.marketCap * 10000000)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <span className="text-[10px] text-[#5B6572] uppercase">52W High / Low</span>
          <p className="font-serif font-bold text-sm text-[#0B1220] mt-0.5">
            ₹{quote.fiftyTwoWeekHigh} / ₹{quote.fiftyTwoWeekLow}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <span className="text-[10px] text-[#5B6572] uppercase">Day High / Low</span>
          <p className="font-serif font-bold text-sm text-[#0B1220] mt-0.5">
            ₹{quote.dayHigh} / ₹{quote.dayLow}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF]">
          <span className="text-[10px] text-[#5B6572] uppercase">Index Inclusion</span>
          <p className="font-semibold text-xs text-[#0F766E] mt-0.5">
            {quote.isNifty50 ? 'NIFTY 50 • Large Cap' : 'NSE Next 50'}
          </p>
        </div>
      </div>
    </div>
  );
};
