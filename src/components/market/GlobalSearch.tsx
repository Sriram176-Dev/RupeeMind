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
  BookOpen,
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
    path: "/portfolio",
    desc: "Real-time equity/mutual fund holdings & capital gains audit",
    category: "Portfolio",
    icon: Briefcase,
  },
  {
    name: "Stock Market & Signals",
    path: "/market",
    desc: "Live NSE/BSE quotes with algorithmic BUY/HOLD/SELL signals",
    category: "Markets",
    icon: TrendingUp,
  },
  {
    name: "Mutual Funds Explorer",
    path: "/funds",
    desc: "Quant-screened mutual funds, categories & historical NAVs",
    category: "Funds",
    icon: PieChart,
  },
  {
    name: "Mutual Fund Comparison Tool",
    path: "/funds/compare",
    desc: "Head-to-head risk, expense ratio, Sharpe ratio & returns compare",
    category: "Funds",
    icon: Scale,
  },
  {
    name: "Stress Test & Risk Analytics",
    path: "/analytics",
    desc: "Basel III VaR (95%/99%), Monte Carlo & crisis simulation",
    category: "Analytics",
    icon: BarChart3,
  },
  {
    name: "Paper Trading Terminal",
    path: "/paper-trading",
    desc: "Virtual trading sandbox with ₹10,00,000 capital & order simulation",
    category: "Trading",
    icon: Wallet,
  },
  {
    name: "AI Quant Recommendations",
    path: "/recommendations",
    desc: "Personalized ML stock & mutual fund picks tailored to your KYC",
    category: "AI",
    icon: Sparkles,
  },
  {
    name: "Financial Calculators (SIP/SWP)",
    path: "/calculators",
    desc: "SIP, Step-Up SIP, SWP, Lumpsum, ELSS Tax & Retirement Planner",
    category: "Calculators",
    icon: Calculator,
  },
  {
    name: "Market News & Intel",
    path: "/news",
    desc: "Live curated Indian market headlines & sentiment analysis",
    category: "News",
    icon: Newspaper,
  },
  {
    name: "Learn Academy",
    path: "/learn",
    desc: "SEBI investor education, asset allocation & tax saving rules",
    category: "Education",
    icon: BookOpen,
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
    setFeatureResults(matchedFeatures.slice(0, 4));

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
            <div className="py-4 px-2 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6572] px-2">
                Quick Feature Navigation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLATFORM_FEATURES.slice(0, 6).map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <button
                      key={feat.path}
                      onClick={() =>
                        handleSelect({ type: "feature", data: feat })
                      }
                      className="p-2.5 rounded-xl border border-[#E7E5DF] bg-[#FAFAF7] hover:bg-[#E6F4F1] hover:border-emerald-300 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1220] group-hover:text-[#0F766E]">
                        <Icon className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span className="truncate">{feat.name}</span>
                      </div>
                      <p className="text-[10px] text-[#5B6572] truncate mt-0.5">
                        {feat.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6572] px-2 mb-2">
                  Popular Market Searches
                </p>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {[
                    "RELIANCE",
                    "TCS",
                    "HDFCBANK",
                    "INFY",
                    "Parag Parikh Flexi Cap",
                    "NIFTY 50",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E7E5DF] text-xs font-medium text-[#0B1220] hover:border-[#0F766E] transition-colors"
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
