import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchSymbols, getFunds } from "../../services/api";
import type { SearchResultItem, MutualFund } from "../../types";
import {
  Search,
  TrendingUp,
  PieChart,
  X,
  ArrowRight,
  CornerDownLeft,
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Wallet,
  Sparkles,
  Calculator,
  Newspaper,
  User,
  Settings,
  Scale,
  Bot,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlatformFeature {
  name: string;
  path: string;
  desc: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  isCopilot?: boolean;
}

const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    name: "Dashboard Overview",
    path: "/dashboard",
    desc: "High-level net worth, portfolio asset mix & signal health",
    category: "Core",
    icon: LayoutDashboard,
  },
  {
    name: "Portfolio Holdings & P&L",
    path: "/portfolio?tab=holdings",
    desc: "Real-time equity/mutual fund holdings & capital gains audit",
    category: "Portfolio",
    icon: Briefcase,
  },
  {
    name: "Stock Market & Signals",
    path: "/markets?tab=stocks",
    desc: "Live NSE/BSE quotes with algorithmic BUY/HOLD/SELL signals",
    category: "Markets",
    icon: TrendingUp,
  },
  {
    name: "Mutual Funds Explorer",
    path: "/markets?tab=funds",
    desc: "Quant-screened mutual funds, categories & historical NAVs",
    category: "Markets",
    icon: PieChart,
  },
  {
    name: "Mutual Fund Comparison Tool",
    path: "/funds/compare",
    desc: "Head-to-head risk, expense ratio, Sharpe ratio & returns compare",
    category: "Markets",
    icon: Scale,
  },
  {
    name: "Stress Test & Risk Analytics",
    path: "/portfolio?tab=analytics",
    desc: "Basel III VaR (95%/99%), Monte Carlo & crisis simulation",
    category: "Portfolio",
    icon: BarChart3,
  },
  {
    name: "Capital Gains & Tax Harvesting",
    path: "/portfolio?tab=tax",
    desc: "FIFO tax lots, Section 112A tax exemption harvest & P&L report",
    category: "Portfolio",
    icon: Scale,
  },
  {
    name: "Portfolio Rebalancing",
    path: "/portfolio?tab=rebalance",
    desc: "Target allocation drift analysis & zero-tax SIP rebalance",
    category: "Portfolio",
    icon: Scale,
  },
  {
    name: "Goal Planning & Simulator",
    path: "/portfolio?tab=goals",
    desc: "Corpus simulation, skip-SIP projection & retirement milestone",
    category: "Portfolio",
    icon: Wallet,
  },
  {
    name: "Price & Signal Alerts",
    path: "/portfolio?tab=alerts",
    desc: "Real-time automated alerts for price breaks, technical signals & drift",
    category: "Portfolio",
    icon: Bot,
  },
  {
    name: "Strategy Backtest Lab",
    path: "/portfolio?tab=analytics&subtab=backtest",
    desc: "Simulate SMA crossover & disciplined SIP on historical data",
    category: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Portfolio Optimizer",
    path: "/portfolio?tab=analytics&subtab=optimizer",
    desc: "Markowitz Mean-Variance Efficient Frontier & Max-Sharpe allocation",
    category: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Paper Trading Terminal",
    path: "/portfolio?tab=paper-trading",
    desc: "Virtual trading sandbox with ₹10,00,000 capital & order simulation",
    category: "Trading",
    icon: Wallet,
  },
  {
    name: "AI Quant Recommendations",
    path: "/markets?tab=picks",
    desc: "Personalized ML stock & mutual fund picks tailored to your KYC",
    category: "AI",
    icon: Sparkles,
  },
  {
    name: "Financial Calculators (SIP/SWP)",
    path: "/tools",
    desc: "SIP, Step-Up SIP, SWP, Lumpsum, ELSS Tax & Retirement Planner",
    category: "Tools",
    icon: Calculator,
  },
  {
    name: "Market News & Intel",
    path: "/markets?tab=news",
    desc: "Live curated Indian market headlines & sentiment analysis",
    category: "Markets",
    icon: Newspaper,
  },
  {
    name: "RupeeBot AI Copilot",
    path: "#copilot",
    desc: "Interactive financial assistant for portfolio risk & tax queries",
    category: "AI Copilot",
    icon: Bot,
    isCopilot: true,
  },
  {
    name: "Investor Profile & KYC",
    path: "/profile",
    desc: "Risk tolerance assessment, demographic tier & KYC settings",
    category: "Account",
    icon: User,
  },
  {
    name: "Account Settings",
    path: "/settings",
    desc: "Security, password & account preferences",
    category: "Account",
    icon: Settings,
  },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [stockResults, setStockResults] = useState<SearchResultItem[]>([]);
  const [fundResults, setFundResults] = useState<MutualFund[]>([]);
  const [featureResults, setFeatureResults] = useState<PlatformFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setStockResults([]);
      setFundResults([]);
      setFeatureResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search query processing
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setStockResults([]);
      setFundResults([]);
      setFeatureResults([]);
      return;
    }

    // Match platform features immediately
    const matchedFeatures = PLATFORM_FEATURES.filter(
      (feat) =>
        feat.name.toLowerCase().includes(trimmed) ||
        feat.desc.toLowerCase().includes(trimmed) ||
        feat.category.toLowerCase().includes(trimmed),
    );
    setFeatureResults(matchedFeatures.slice(0, 8));

    // Debounce remote stocks & mutual funds lookup
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
        console.warn("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Combined list for keyboard arrow navigation
  const allResults = [
    ...featureResults.map((feat) => ({ type: "feature" as const, data: feat })),
    ...stockResults.map((s) => ({ type: "stock" as const, data: s })),
    ...fundResults.map((f) => ({ type: "fund" as const, data: f })),
  ];

  const handleSelect = useCallback(
    (item: { type: "feature" | "stock" | "fund"; data: any }) => {
      onClose();
      if (item.type === "feature") {
        if (item.data.isCopilot) {
          window.dispatchEvent(new CustomEvent("toggle-copilot"));
        } else {
          navigate(item.data.path);
        }
      } else if (item.type === "stock") {
        navigate(`/market/${encodeURIComponent(item.data.symbol)}`);
      } else {
        navigate(`/funds/${encodeURIComponent(item.data.code)}`);
      }
    },
    [navigate, onClose],
  );

  // Keyboard navigation (Escape, Up, Down, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        allResults.length > 0 ? (prev + 1) % allResults.length : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        allResults.length > 0
          ? (prev - 1 + allResults.length) % allResults.length
          : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E7E5DF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E7E5DF] gap-3">
          <Search className="w-5 h-5 text-[#5B6572] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any page, tool, stock (e.g. RELIANCE), or fund..."
            className="w-full bg-transparent text-sm sm:text-base text-[#0B1220] placeholder-[#5B6572] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-[#5B6572] hover:text-[#0B1220]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-[#5B6572] bg-[#FAFAF7] rounded border border-[#E7E5DF]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-[#5B6572]">
              Searching platform features, markets & funds...
            </div>
          )}

          {!loading && query && allResults.length === 0 && (
            <div className="py-8 text-center text-xs text-[#5B6572]">
              No features, stocks, or mutual funds matching "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="py-2 px-1 space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  All Platform Features & Tools ({PLATFORM_FEATURES.length})
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Click to launch</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-medium px-1">
                {['All', 'Markets', 'Portfolio', 'Analytics', 'Tools', 'AI'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap',
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[36vh] overflow-y-auto pr-1 custom-scrollbar">
                {PLATFORM_FEATURES.filter(
                  (f) => categoryFilter === 'All' || f.category.toLowerCase().includes(categoryFilter.toLowerCase())
                ).map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <button
                      key={feat.name}
                      onClick={() => handleSelect({ type: 'feature', data: feat })}
                      className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-emerald-50/70 hover:border-emerald-300 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                            {feat.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 shrink-0">
                            {feat.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {feat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 mb-1.5 font-mono">
                  Popular Stock & Index Searches
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {[
                    "RELIANCE",
                    "TCS",
                    "HDFCBANK",
                    "INFY",
                    "ICICIBANK",
                    "TATAMOTORS",
                    "NIFTY 50",
                    "SENSEX",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Platform Features Section */}
          {!loading && featureResults.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                Platform Features & Tools
              </p>
              <div className="mt-1 space-y-1">
                {featureResults.map((feat, idx) => {
                  const globalIdx = idx;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = feat.icon;

                  return (
                    <div
                      key={feat.name}
                      onClick={() =>
                        handleSelect({ type: "feature", data: feat })
                      }
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[#E6F4F1] text-[#0F766E]"
                          : "hover:bg-black/5 text-[#0B1220]",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {feat.name}
                          </p>
                          <p className="text-[11px] text-[#5B6572] truncate">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/5 text-[#5B6572]">
                          {feat.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stocks Section */}
          {!loading && stockResults.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5B6572]">
                Stocks (NSE/BSE)
              </p>
              <div className="mt-1 space-y-1">
                {stockResults.map((s, idx) => {
                  const globalIdx = featureResults.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <div
                      key={s.symbol}
                      onClick={() => handleSelect({ type: "stock", data: s })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[#E6F4F1] text-[#0F766E]"
                          : "hover:bg-black/5 text-[#0B1220]",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {s.symbol}
                          </p>
                          <p className="text-[11px] text-[#5B6572] truncate">
                            {s.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/5 text-[#5B6572]">
                          {s.exchange || "NSE"}
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
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5B6572]">
                Mutual Funds
              </p>
              <div className="mt-1 space-y-1">
                {fundResults.map((f, idx) => {
                  const globalIdx =
                    featureResults.length + stockResults.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <div
                      key={f.code}
                      onClick={() => handleSelect({ type: "fund", data: f })}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors",
                        isSelected
                          ? "bg-[#E6F4F1] text-[#0F766E]"
                          : "hover:bg-black/5 text-[#0B1220]",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                          <PieChart className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{f.name}</p>
                          <p className="text-[11px] text-[#5B6572] truncate">
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
        <div className="px-4 py-2.5 bg-[#FAFAF7] border-t border-[#E7E5DF] flex items-center justify-between text-[11px] text-[#5B6572]">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="w-3 h-3" /> Select
          </span>
          <span>Use ↑ and ↓ arrows to navigate</span>
        </div>
      </div>
    </div>
  );
};
