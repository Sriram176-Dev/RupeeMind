import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../../context/MarketContext";
import { useAuth } from "../../context/AuthContext";
import { getWatchlist, toggleWatchlist } from "../../services/api";
import { searchSymbols } from "../../services/marketService";
import type { SearchResultItem } from "../../types";
import { MarketStatusBadge } from "../../components/ui/MarketStatusBadge";
import { SignalBadge } from "../../components/ui/SignalBadge";
import { Sparkline } from "../../components/ui/Sparkline";
import { PriceChangeChip } from "../../components/ui/PriceChangeChip";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { DisclaimerBanner } from "../../components/ui/DisclaimerBanner";
import { formatINR, formatCompactINR, formatNumber } from "../../lib/utils";
import {
  Search,
  Star,
  ArrowUpDown,
  Filter,
  Sparkles,
  TrendingUp,
  Layers,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Market: React.FC = () => {
  const {
    indices,
    quotes,
    priceChanges,
    subscribeSymbols,
    unsubscribeSymbols,
  } = useMarket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [niftyFilter, setNiftyFilter] = useState<
    "all" | "nifty50" | "gainers" | "losers"
  >("all");
  const [sortBy, setSortBy] = useState<
    "marketCap" | "price" | "changePercent" | "volume"
  >("marketCap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Live search across the full NSE universe
  const [liveResults, setLiveResults] = useState<SearchResultItem[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function syncWatchlist() {
      try {
        const serverWatchlist = await getWatchlist();
        setWatchlist(serverWatchlist);
      } catch {
        setWatchlist([]);
      }
    }
    void syncWatchlist();
  }, []);

  // Debounced live search — queries the full NSE/BSE universe
  useEffect(() => {
    if (!search.trim()) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }
    setLiveLoading(true);
    setShowDropdown(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSymbols(search.trim());
        setLiveResults(results.slice(0, 10));
      } catch {
        setLiveResults([]);
      } finally {
        setLiveLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Subscribe to visible symbols
  useEffect(() => {
    if (quotes.length > 0) {
      const symbols = quotes.map((q) => q.symbol);
      subscribeSymbols(symbols);
      return () => {
        unsubscribeSymbols(symbols);
      };
    }
  }, [quotes.length, subscribeSymbols, unsubscribeSymbols]);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const set = new Set(quotes.map((q) => q.sector));
    return ["All", ...Array.from(set)];
  }, [quotes]);

  // Filtered and Sorted Quotes
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q),
      );
    }

    if (selectedSector !== "All") {
      result = result.filter((s) => s.sector === selectedSector);
    }

    if (niftyFilter === "gainers") {
      result = result
        .filter((s) => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent);
    } else if (niftyFilter === "losers") {
      result = result
        .filter((s) => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent);
    } else if (niftyFilter === "nifty50") {
      result = result.filter((s) => s.isNifty50);
    }

    if (niftyFilter !== "gainers" && niftyFilter !== "losers") {
      result.sort((a, b) => {
        const factor = sortOrder === "asc" ? 1 : -1;
        return (a[sortBy] > b[sortBy] ? 1 : -1) * factor;
      });
    }

    return result;
  }, [quotes, search, selectedSector, niftyFilter, sortBy, sortOrder]);

  const handleToggleWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await toggleWatchlist(symbol);
    setWatchlist(res.watchlist);
    toast.success(
      res.inWatchlist
        ? `Added ${symbol} to watchlist`
        : `Removed ${symbol} from watchlist`,
    );
  };

  const handleSort = (
    field: "marketCap" | "price" | "changePercent" | "volume",
  ) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header & Market Status Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <SectionHeader
            eyebrow="NATIONAL STOCK EXCHANGE (NSE)"
            title="Live Market & Technical Signals"
            subtitle="Real-time Indian equities intelligence with automated RSI, MACD, and Moving Average signal synthesis."
            className="mb-0"
          />
        </div>
        <div className="shrink-0">
          <MarketStatusBadge />
        </div>
      </div>

      {/* Indices Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indices.map((idx) => (
          <div
            key={idx.symbol}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs space-y-2 hover:border-[#0F766E]/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5B6572]">
                {idx.name}
              </span>
              <PriceChangeChip
                change={idx.change}
                changePercent={idx.changePercent}
                size="sm"
              />
            </div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220] tabular-nums">
              {formatINR(idx.value, false)}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#5B6572]">
                Intraday Trend
              </span>
              <Sparkline
                data={idx.sparkline}
                width={70}
                height={20}
                isPositive={idx.change >= 0}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar / Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search bar — queries the full NSE/BSE universe */}
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5B6572] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              onFocus={() => { if (search.trim() && liveResults.length > 0) setShowDropdown(true); }}
              placeholder="Search any NSE/BSE stock (e.g. ETERNAL, PAYTM, HAL)..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs sm:text-sm text-[#0B1220] placeholder:text-[#5B6572] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setLiveResults([]); setShowDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6572] hover:text-[#0B1220]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live search dropdown */}
            {showDropdown && search.trim() && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl bg-white border border-[#E7E5DF] shadow-xl overflow-hidden">
                {liveLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#5B6572]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching NSE / BSE...
                  </div>
                ) : liveResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#5B6572]">
                    No results for &ldquo;{search}&rdquo; — try the exact NSE ticker symbol.
                  </div>
                ) : (
                  liveResults.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => { setShowDropdown(false); navigate(`/market/${item.symbol}`); }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#F0FAF8] text-left transition-colors border-b border-[#F0EDE8] last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#E6F4F1] text-[#0F766E] font-bold flex items-center justify-center text-[10px] shrink-0">
                          {item.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-mono font-bold text-xs text-[#0B1220]">{item.symbol}</p>
                          <p className="text-[10px] text-[#5B6572] truncate max-w-[200px]">{item.name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#5B6572] shrink-0">{item.exchange || 'NSE'}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Filters: Nifty 50, Gainers, Losers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setNiftyFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                niftyFilter === "all"
                  ? "bg-[#0F766E] text-white"
                  : "bg-[#FAFAF7] text-[#5B6572] hover:bg-black/5"
              }`}
            >
              All 20 NSE
            </button>
            <button
              onClick={() => setNiftyFilter("nifty50")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                niftyFilter === "nifty50"
                  ? "bg-[#0F766E] text-white"
                  : "bg-[#FAFAF7] text-[#5B6572] hover:bg-black/5"
              }`}
            >
              Nifty 50 Bluechips
            </button>
            <button
              onClick={() => setNiftyFilter("gainers")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                niftyFilter === "gainers"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#FAFAF7] text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Top Gainers
            </button>
            <button
              onClick={() => setNiftyFilter("losers")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                niftyFilter === "losers"
                  ? "bg-rose-600 text-white"
                  : "bg-[#FAFAF7] text-rose-700 hover:bg-rose-50"
              }`}
            >
              Top Losers
            </button>
          </div>

          {/* Sector Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5B6572]" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs font-semibold text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === "All" ? "All Sectors" : sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Stock Table */}
      <div className="hidden lg:block rounded-3xl bg-white border border-[#E7E5DF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF7] border-b border-[#E7E5DF] text-[#5B6572]">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">★</th>
                <th className="py-3.5 px-4 font-semibold">Stock / Company</th>
                <th
                  onClick={() => handleSort("price")}
                  className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-[#0B1220]"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>LTP (INR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("changePercent")}
                  className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-[#0B1220]"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Change %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("volume")}
                  className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-[#0B1220]"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  52-Week Range
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  Technical Signal
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  Intraday Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5DF]">
              {filteredQuotes.map((stock) => {
                const isWatch = watchlist.includes(stock.symbol);
                const nudgeState = priceChanges[stock.symbol];

                // 52W range progress
                const rangeDiff =
                  stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow;
                const progress =
                  rangeDiff > 0
                    ? ((stock.price - stock.fiftyTwoWeekLow) / rangeDiff) * 100
                    : 50;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(`/market/${stock.symbol}`)}
                    className={`hover:bg-[#FAFAF7] cursor-pointer transition-colors ${
                      nudgeState === "up"
                        ? "bg-emerald-500/10"
                        : nudgeState === "down"
                          ? "bg-rose-500/10"
                          : ""
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={(e) => handleToggleWatchlist(stock.symbol, e)}
                        className="p-1 rounded-md text-amber-500 hover:bg-black/5"
                        title={
                          isWatch ? "Remove from Watchlist" : "Add to Watchlist"
                        }
                      >
                        <Star
                          className={`w-4 h-4 ${isWatch ? "fill-amber-500" : "text-gray-300"}`}
                        />
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] text-[#0F766E] font-bold flex items-center justify-center text-xs shrink-0">
                          {stock.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="font-mono font-bold text-sm text-[#0B1220] group-hover:text-[#0F766E]">
                            {stock.symbol}
                          </p>
                          <p className="text-[11px] text-[#5B6572]">
                            {stock.companyName} •{" "}
                            <span className="opacity-80">{stock.sector}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-serif font-bold text-sm text-[#0B1220] tabular-nums">
                        {formatINR(stock.price)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <PriceChangeChip
                        change={stock.change}
                        changePercent={stock.changePercent}
                      />
                    </td>

                    <td className="py-4 px-4 text-right text-[#5B6572] tabular-nums">
                      {formatNumber(stock.volume)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="w-32 mx-auto space-y-1 text-[10px] text-[#5B6572]">
                        <div className="flex justify-between">
                          <span>{formatINR(stock.fiftyTwoWeekLow, false)}</span>
                          <span>
                            {formatINR(stock.fiftyTwoWeekHigh, false)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0F766E] rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(5, progress))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline">
                        <span>Analyze</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <Sparkline
                        data={stock.sparkline}
                        width={65}
                        height={20}
                        isPositive={stock.change >= 0}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="lg:hidden space-y-3">
        {filteredQuotes.map((stock) => {
          const isWatch = watchlist.includes(stock.symbol);

          return (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/market/${stock.symbol}`)}
              className="p-4 rounded-2xl bg-white border border-[#E7E5DF] shadow-xs space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-[#0B1220]">
                      {stock.symbol}
                    </span>
                    <button
                      onClick={(e) => handleToggleWatchlist(stock.symbol, e)}
                      className="text-amber-500 p-0.5"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${isWatch ? "fill-amber-500" : "text-gray-300"}`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-[#5B6572] truncate max-w-[200px]">
                    {stock.companyName}
                  </p>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0F766E]">
                  <span>Analyze</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E7E5DF]">
                <div>
                  <p className="font-serif text-lg font-bold text-[#0B1220] tabular-nums">
                    {formatINR(stock.price)}
                  </p>
                  <PriceChangeChip
                    change={stock.change}
                    changePercent={stock.changePercent}
                    size="sm"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5B6572]">
                    52W High
                  </span>
                  <p className="text-xs font-semibold text-[#0B1220] tabular-nums">
                    {formatINR(stock.fiftyTwoWeekHigh, false)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DisclaimerBanner type="warning" compact={true} className="mt-6" />
    </div>
  );
};
