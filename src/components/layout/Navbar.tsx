import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  TrendingUp,
  PieChart,
  Calculator,
  Newspaper,
  BookOpen,
  Sparkles,
  Briefcase,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  BarChart3,
  Wallet,
  Scale,
  Grid,
  FileText,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Sliders,
  Target,
  HeartPulse,
  Bell,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { GlobalSearch } from "../market/GlobalSearch";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K (Search) & Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setMegaMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setUserDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(target)) {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setMegaMenuOpen(false);
  }, [location.pathname]);

  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPod|iPad/.test(navigator.platform || "");

  // Core 1-click links for top bar
  const primaryLinks: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
  }> = isAuthenticated
    ? [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Portfolio", path: "/portfolio", icon: Briefcase },
        { label: "Market", path: "/market", icon: TrendingUp },
        { label: "Mutual Funds", path: "/funds", icon: PieChart },
        {
          label: "Paper Trading",
          path: "/paper-trading",
          icon: Wallet,
          className: "hidden xl:flex",
        },
      ]
    : [
        { label: "Market", path: "/market", icon: TrendingUp },
        { label: "Mutual Funds", path: "/funds", icon: PieChart },
        {
          label: "Calculators",
          path: "/calculators",
          icon: Calculator,
          className: "hidden xl:flex",
        },
        {
          label: "News",
          path: "/news",
          icon: Newspaper,
          className: "hidden 2xl:flex",
        },
        {
          label: "Learn",
          path: "/learn",
          icon: BookOpen,
          className: "hidden 2xl:flex",
        },
      ];

  // Complete catalog of all platform features grouped by category
  const featureCategories = [
    {
      title: "Markets & Securities",
      items: [
        {
          label: "Stock Market & Signals",
          path: "/market",
          icon: TrendingUp,
          desc: "NSE/BSE live quotes & algorithmic signals",
        },
        {
          label: "Mutual Funds Explorer",
          path: "/funds",
          icon: PieChart,
          desc: "Quant-screened funds, NAVs & categories",
        },
        {
          label: "Fund Comparison Tool",
          path: "/funds/compare",
          icon: Scale,
          desc: "Side-by-side risk, CAGR & expense compare",
        },
        {
          label: "Market News & Intel",
          path: "/news",
          icon: Newspaper,
          desc: "Live financial commentary & sentiment",
        },
      ],
    },
    {
      title: "Portfolio & Risk Intelligence",
      items: [
        {
          label: "Portfolio Holdings & P&L",
          path: "/portfolio",
          icon: Briefcase,
          desc: "Asset allocation, holdings & statement import",
        },
        {
          label: "Capital Gains & Tax Harvesting",
          path: "/tax",
          icon: Receipt,
          desc: "FIFO tax lots, STCG/LTCG & Section 112A harvest",
        },
        {
          label: "Portfolio Rebalancing",
          path: "/rebalance",
          icon: Scale,
          desc: "Fiduciary target vs drift & zero-tax SIP rebalance",
        },
        {
          label: "Stress Test & VaR Analytics",
          path: "/analytics",
          icon: BarChart3,
          desc: "Basel III VaR, Monte Carlo & crisis replay",
        },
        {
          label: "Portfolio Optimization",
          path: "/optimize",
          icon: Sliders,
          desc: "Efficient frontier & max-Sharpe MPT allocation",
        },
        {
          label: "Executive Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          desc: "High-level net worth & portfolio health",
        },
      ],
    },
    {
      title: "Trading & AI Engine",
      items: [
        {
          label: "Price & Signal Alerts",
          path: "/alerts",
          icon: Bell,
          desc: "Real-time rules for prices, signals & drift",
        },
        {
          label: "Strategy Backtest Lab",
          path: "/backtest",
          icon: BarChart3,
          desc: "Simulate SMA crossover & SIP with realistic taxes",
        },
        {
          label: "Model Transparency",
          path: "/model-transparency",
          icon: ShieldCheck,
          desc: "Walk-forward validation audit & baseline benchmarks",
        },
        {
          label: "Paper Trading Sandbox",
          path: "/paper-trading",
          icon: Wallet,
          desc: "Risk-free ₹10L simulated execution",
        },
        {
          label: "AI Quant Recommendations",
          path: "/recommendations",
          icon: Sparkles,
          desc: "Personalized ML stock & mutual fund picks",
        },
      ],
    },
    {
      title: "Planning, Tools & Academy",
      items: [
        {
          label: "Goal Planning & Simulator",
          path: "/goals",
          icon: Target,
          desc: "Milestones, corpus projection & skip-SIP simulation",
        },
        {
          label: "Insurance & Defense Health",
          path: "/health-check",
          icon: HeartPulse,
          desc: "Audit emergency liquidity, term & health coverage",
        },
        {
          label: "Financial Calculators",
          path: "/calculators",
          icon: Calculator,
          desc: "SIP, Step-Up, SWP, Lumpsum & Retirement",
        },
        {
          label: "Learn Academy",
          path: "/learn",
          icon: BookOpen,
          desc: "SEBI investor education & tax rules",
        },
        {
          label: "KYC & Risk Profile",
          path: "/profile",
          icon: UserIcon,
          desc: "Risk tolerance quiz & investor tier",
        },
        {
          label: "Account Settings",
          path: "/settings",
          icon: Settings,
          desc: "Security, password & preferences",
        },
      ],
    },
  ];

  const handleFeatureClick = (item: { path: string }) => {
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4 relative">
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-3 lg:gap-5 shrink min-w-0">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 shrink-0 whitespace-nowrap"
              aria-label="Rupee Mind Home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm ring-1 ring-emerald-700/20 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                ₹
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  Rupee Mind
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (>= lg / 1024px) */}
            <nav
              className="hidden lg:flex items-center space-x-1 shrink-0"
              aria-label="Main Navigation"
            >
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.path ||
                  (link.path !== "/" &&
                    location.pathname.startsWith(`${link.path}/`));

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                      link.className,
                      isActive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/70 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* "All Features" Mega-Menu Trigger */}
              <div ref={megaMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMegaMenuOpen(!megaMenuOpen);
                    setUserDropdownOpen(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer whitespace-nowrap shrink-0",
                    megaMenuOpen
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/70 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                  )}
                  aria-expanded={megaMenuOpen}
                >
                  <Grid className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All Features</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200 shrink-0",
                      megaMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Mega-Menu Panel anchored to max-w-7xl content boundary */}
                {megaMenuOpen && (
                  <div className="absolute left-4 sm:left-6 lg:left-8 top-full mt-2 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[860px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <Grid className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
                            Complete Platform Navigator
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Explore and jump directly to any RupeeMind investment or quant capability
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {featureCategories.map((category) => (
                        <div key={category.title} className="space-y-2">
                          <h5 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono pb-1 border-b border-slate-100">
                            {category.title}
                          </h5>
                          <div className="space-y-1">
                            {category.items.map((item) => {
                              const Icon = item.icon;
                              const isActive = location.pathname === item.path;

                              return (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => handleFeatureClick(item)}
                                  className={cn(
                                    "w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 group cursor-pointer",
                                    isActive
                                      ? "bg-emerald-50/80 text-emerald-800 border border-emerald-200/60"
                                      : "hover:bg-slate-50 text-slate-800 border border-transparent",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "p-1.5 rounded-md shrink-0 mt-0.5 transition-colors",
                                      isActive
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700",
                                    )}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold leading-tight group-hover:text-emerald-700 truncate">
                                      {item.label}
                                    </p>
                                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                                      {item.desc}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>
                        Pro-tip: Press{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold">
                          Ctrl+K
                        </kbd>{" "}
                        to search any page or stock instantly
                      </span>
                      <span className="hidden sm:inline text-slate-400">
                        SEBI-Aligned Educational Architecture
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setMegaMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 sm:px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap shrink-0"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-emerald-200 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-xs font-semibold text-slate-900 leading-tight max-w-[100px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight font-mono">
                      {user.profile?.riskBand || "Investor"}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                        {user.profile?.riskBand || "Moderate"} Investor
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/portfolio"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>Portfolio Summary</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>KYC & Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center whitespace-nowrap shrink-0"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs hover:shadow transition-all flex items-center whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button (< lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Full Feature Navigator Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-50 bg-white border-t border-slate-200 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-5">
              {isAuthenticated && user && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                    {user.profile?.riskBand || "Moderate"}
                  </div>
                </div>
              )}

              {/* Categorized Mobile Navigation Grid */}
              <div className="space-y-4">
                {featureCategories.map((cat) => (
                  <div key={cat.title} className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-mono px-1">
                      {cat.title}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleFeatureClick(item)}
                            className={cn(
                              "w-full p-2.5 rounded-lg text-left flex items-center gap-3 transition-colors border",
                              isActive
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-slate-50/70 border-slate-200/70 text-slate-800 hover:bg-slate-100",
                            )}
                          >
                            <div
                              className={cn(
                                "p-1.5 rounded-md shrink-0",
                                isActive
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white text-slate-500 border border-slate-200",
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-tight truncate">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 my-4 border-t border-slate-200 space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-xs transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
