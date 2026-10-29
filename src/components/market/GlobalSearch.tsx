import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSymbols, getFunds } from '../../services/api';
import type { SearchResultItem, MutualFund } from '../../types';
import { Search, TrendingUp, PieChart, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [stockResults, setStockResults] = useState<SearchResultItem[]>([]);
  const [fundResults, setFundResults] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setStockResults([]);
      setFundResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setStockResults([]);
      setFundResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [stocks, funds] = await Promise.all([
          searchSymbols(query),
          getFunds({ search: query }),
        ]);
        setStockResults(stocks.slice(0, 5));
        setFundResults(funds.slice(0, 4));
        setSelectedIndex(0);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Total items list for keyboard navigation
  const allResults = [
    ...stockResults.map((s) => ({ type: 'stock' as const, data: s })),
    ...fundResults.map((f) => ({ type: 'fund' as const, data: f })),
  ];

  const handleSelect = useCallback(
    (item: { type: 'stock' | 'fund'; data: any }) => {
      onClose();
      if (item.type === 'stock') {
        navigate(`/market/${encodeURIComponent(item.data.symbol)}`);
      } else {
        navigate(`/funds/${encodeURIComponent(item.data.code)}`);
      }
    },
    [navigate, onClose]
  );

  // Keyboard navigation (Escape, Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allResults.length > 0 ? (prev + 1) % allResults.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        allResults.length > 0 ? (prev - 1 + allResults.length) % allResults.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#121821] rounded-3xl border border-[#E7E5DF] dark:border-[#1F2933] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E7E5DF] dark:border-[#1F2933] gap-3">
          <Search className="w-5 h-5 text-[#5B6572] dark:text-[#8A97A6] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NSE stocks (e.g. RELIANCE, TCS) or mutual funds..."
            className="w-full bg-transparent text-sm sm:text-base text-[#0B1220] dark:text-[#E8EDF2] placeholder-[#5B6572] dark:placeholder-[#8A97A6] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#5B6572] hover:text-[#0B1220] dark:hover:text-[#E8EDF2]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-[#5B6572] dark:text-[#8A97A6] bg-[#FAFAF7] dark:bg-[#0B0F14] rounded border border-[#E7E5DF] dark:border-[#1F2933]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
              Searching markets & funds...
            </div>
          )}

          {!loading && query && allResults.length === 0 && (
            <div className="py-8 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
              No stocks or mutual funds matching "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 px-4 text-center space-y-2 text-[#5B6572] dark:text-[#8A97A6]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400">
                Popular Quick Searches
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'Parag Parikh Flexi Cap', 'NIFTY 50'].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-xs font-medium text-[#0B1220] dark:text-[#E8EDF2] hover:border-[#0F766E] transition-colors"
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Stocks Section */}
          {!loading && stockResults.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5B6572] dark:text-[#8A97A6]">
                Stocks (NSE/BSE)
              </p>
              <div className="mt-1 space-y-1">
                {stockResults.map((s, idx) => {
                  const globalIdx = idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <div
                      key={s.symbol}
                      onClick={() => handleSelect({ type: 'stock', data: s })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-[#E6F4F1] dark:bg-emerald-950/50 text-[#0F766E] dark:text-emerald-400'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#0B1220] dark:text-[#E8EDF2]'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{s.symbol}</p>
                          <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] truncate">
                            {s.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#5B6572] dark:text-[#8A97A6]">
                          {s.exchange || 'NSE'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mutual Funds Section */}
          {!loading && fundResults.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5B6572] dark:text-[#8A97A6]">
                Mutual Funds
              </p>
              <div className="mt-1 space-y-1">
                {fundResults.map((f, idx) => {
                  const globalIdx = stockResults.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <div
                      key={f.code}
                      onClick={() => handleSelect({ type: 'fund', data: f })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-[#E6F4F1] dark:bg-emerald-950/50 text-[#0F766E] dark:text-emerald-400'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#0B1220] dark:text-[#E8EDF2]'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <PieChart className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{f.name}</p>
                          <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] truncate">
                            {f.category} • 3Y CAGR: {f.cagr3Y}%
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#FAFAF7] dark:bg-[#0B0F14] border-t border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="w-3 h-3" /> Select
          </span>
          <span>Use ↑ and ↓ arrows to navigate</span>
        </div>
      </div>
    </div>
  );
};
