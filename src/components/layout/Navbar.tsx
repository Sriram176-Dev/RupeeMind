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
          desc: "Asset allocation, holdings & tax lots",
        },
        {
          label: "Stress Test & VaR Analytics",
          path: "/analytics",
          icon: BarChart3,
          desc: "Basel III VaR, Monte Carlo & crisis replay",
        },
        {
          label: "Executive Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          desc: "High-level net worth & portfolio health",
        },
        {
          label: "Institutional Audit Dossier",
          path: "/portfolio",
          icon: FileText,
          desc: "Full tax, risk & portfolio health audit",
        },
      ],
    },
    {
      title: "Trading & AI Engine",
      items: [
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
      <header className="sticky top-0 z-40 w-full border-b border-[#E7E5DF] bg-white/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4 relative">
          {/* Left: Brand Logo & Navigation */}
          <div className="flex items-center gap-3 lg:gap-5 shrink min-w-0">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 shrink-0 whitespace-nowrap"
              aria-label="Rupee Mind Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
                ₹
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#0B1220] whitespace-nowrap">
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
                      "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap shrink-0",
                      link.className,
                      isActive
                        ? "text-[#0F766E] bg-[#E6F4F1] font-semibold shadow-2xs"
                        : "text-[#5B6572] hover:text-[#0B1220] hover:bg-black/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-[#0F766E]" : "text-current opacity-70",
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
                    "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-1.5 focus:outline-none cursor-pointer whitespace-nowrap shrink-0",
                    megaMenuOpen
                      ? "text-[#0F766E] bg-[#E6F4F1] font-semibold"
                      : "text-[#5B6572] hover:text-[#0B1220] hover:bg-black/5",
                  )}
                  aria-expanded={megaMenuOpen}
                >
                  <Grid className="w-4 h-4 text-[#0F766E] shrink-0" />
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
                  <div className="absolute left-4 sm:left-6 lg:left-8 top-full mt-2 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[860px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-[#E7E5DF] shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E7E5DF]">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#E6F4F1] text-[#0F766E]">
                          <Grid className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0B1220] uppercase tracking-wider font-mono">
                            Complete Platform Navigator
                          </h4>
                          <p className="text-[11px] text-[#5B6572]">
                            Explore and jump directly to any RupeeMind
                            investment or quant capability
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {featureCategories.map((category) => (
                        <div key={category.title} className="space-y-2">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] font-mono pb-1 border-b border-[#E7E5DF]/70">
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
                                    "w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 group cursor-pointer",
                                    isActive
                                      ? "bg-[#E6F4F1] text-[#0F766E]"
                                      : "hover:bg-[#FAFAF7] text-[#0B1220]",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors",
                                      isActive
                                        ? "bg-[#0F766E] text-white"
                                        : "bg-[#FAFAF7] text-[#5B6572] border border-[#E7E5DF] group-hover:border-[#0F766E]/40 group-hover:text-[#0F766E]",
                                    )}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold leading-tight group-hover:text-[#0F766E] truncate">
                                      {item.label}
                                    </p>
                                    <p className="text-[10px] text-[#5B6572] leading-snug line-clamp-2 mt-0.5">
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

                    <div className="mt-4 pt-3 border-t border-[#E7E5DF] flex items-center justify-between text-[11px] text-[#5B6572] font-mono">
                      <span>
                        Pro-tip: Press{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-[#FAFAF7] border border-[#E7E5DF] text-[#0B1220]">
                          Ctrl+K
                        </kbd>{" "}
                        to search any page or stock instantly
                      </span>
                      <span className="hidden sm:inline">
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
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl border border-[#E7E5DF] hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap shrink-0"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0F766E]/10 text-[#0F766E] font-bold flex items-center justify-center text-xs sm:text-sm border border-emerald-500/20 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-xs font-semibold text-[#0B1220] leading-tight max-w-[100px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-[#5B6572] leading-tight">
                      {user.profile?.riskBand || "Investor"}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6572] shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E7E5DF] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#E7E5DF]">
                      <p className="text-xs font-semibold text-[#0B1220] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#5B6572] truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F4F1] text-[#0F766E]">
                        {user.profile?.riskBand || "Moderate"} Investor
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#5B6572]" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/portfolio"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-[#5B6572]" />
                        <span>Portfolio Summary</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#5B6572]" />
                        <span>KYC & Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#0B1220] hover:bg-[#FAFAF7] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#5B6572]" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="my-1 border-t border-[#E7E5DF]" />

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
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0B1220] hover:text-[#0F766E] hover:bg-black/5 rounded-xl transition-colors flex items-center whitespace-nowrap shrink-0"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button (< lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#0B1220] border border-[#E7E5DF] hover:bg-black/5 transition-colors"
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
          <div className="lg:hidden fixed inset-0 top-16 z-50 bg-white border-t border-[#E7E5DF] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-5">
              {isAuthenticated && user && (
                <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0B1220]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#5B6572]">{user.email}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E6F4F1] text-[#0F766E]">
                    {user.profile?.riskBand || "Moderate"}
                  </div>
                </div>
              )}

              {/* Categorized Mobile Navigation Grid */}
              <div className="space-y-4">
                {featureCategories.map((cat) => (
                  <div key={cat.title} className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] font-mono px-1">
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
                              "w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors border",
                              isActive
                                ? "bg-[#E6F4F1] border-emerald-300 text-[#0F766E]"
                                : "bg-[#FAFAF7] border-[#E7E5DF] text-[#0B1220] hover:bg-white",
                            )}
                          >
                            <div
                              className={cn(
                                "p-1.5 rounded-lg shrink-0",
                                isActive
                                  ? "bg-[#0F766E] text-white"
                                  : "bg-white text-[#5B6572] border border-[#E7E5DF]",
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-tight truncate">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-[#5B6572] truncate mt-0.5">
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

            <div className="pt-6 my-4 border-t border-[#E7E5DF] space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-[#0B1220] border border-[#E7E5DF] flex items-center justify-center"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-white bg-[#0F766E] flex items-center justify-center shadow-xs"
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
