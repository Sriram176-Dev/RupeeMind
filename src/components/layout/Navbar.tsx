import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  TrendingUp,
  Calculator,
  Briefcase,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Search,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { GlobalSearch } from "../market/GlobalSearch";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K (Search) & Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const isMac =
    typeof window !== "undefined" &&
    /Mac|iPhone|iPod|iPad/.test(navigator.platform || "");

  // 4 Core Task-Oriented Navigation Zones
  const primaryLinks: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    matches: (pathname: string) => boolean;
  }> = isAuthenticated
    ? [
        {
          label: "Home",
          path: "/dashboard",
          icon: LayoutDashboard,
          matches: (p) => p === "/dashboard",
        },
        {
          label: "Markets",
          path: "/markets",
          icon: TrendingUp,
          matches: (p) =>
            p === "/markets" ||
            p === "/market" ||
            p.startsWith("/market/") ||
            p.startsWith("/funds") ||
            p === "/news" ||
            p === "/recommendations",
        },
        {
          label: "My Portfolio",
          path: "/portfolio",
          icon: Briefcase,
          matches: (p) =>
            p === "/portfolio" ||
            p.startsWith("/portfolio/") ||
            p === "/analytics" ||
            p === "/tax" ||
            p === "/rebalance" ||
            p === "/goals" ||
            p === "/alerts" ||
            p === "/paper-trading" ||
            p === "/backtest" ||
            p === "/optimize",
        },
        {
          label: "Tools",
          path: "/tools",
          icon: Calculator,
          matches: (p) => p === "/tools" || p === "/calculators",
        },
      ]
    : [
        {
          label: "Markets",
          path: "/markets",
          icon: TrendingUp,
          matches: (p) =>
            p === "/markets" ||
            p === "/market" ||
            p.startsWith("/market/") ||
            p.startsWith("/funds") ||
            p === "/news",
        },
        {
          label: "Tools",
          path: "/tools",
          icon: Calculator,
          matches: (p) => p === "/tools" || p === "/calculators",
        },
      ];

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleCopilotToggle = () => {
    window.dispatchEvent(new CustomEvent("toggle-copilot"));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4 relative">
          
          {/* Left: Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 shrink-0"
              aria-label="Rupee Mind Home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm ring-1 ring-emerald-700/20 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                ₹
              </div>
              <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Rupee Mind
              </span>
            </Link>

            {/* Desktop Navigation Links (>= lg / 1024px) */}
            <nav
              className="hidden lg:flex items-center space-x-1 shrink-0"
              aria-label="Main Navigation"
            >
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.matches(location.pathname);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0",
                      isActive
                        ? "text-emerald-800 bg-emerald-50/90 border border-emerald-200/70 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* 1-Click Search & All Features Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs transition-colors border border-slate-200/60 font-semibold cursor-pointer"
              title={`Explore All Features & Search (${isMac ? "⌘K" : "Ctrl+K"})`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline">All Features</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-500 shadow-2xs">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </button>

            {/* AI Copilot Quick Launcher Button */}
            <button
              type="button"
              onClick={handleCopilotToggle}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 text-xs font-semibold transition-colors cursor-pointer"
              title="Open RupeeBot AI Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">AI Copilot</span>
            </button>

            {/* User Profile / Auth State */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap shrink-0 cursor-pointer"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-emerald-200 shrink-0 font-mono">
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
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {user.email}
                      </p>
                      <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
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
                        <span>My Portfolio</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>KYC & Risk Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>Account Settings</span>
                      </Link>

                      <Link
                        to="/model-transparency"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>Model Governance</span>
                      </Link>
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center whitespace-nowrap shrink-0"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow transition-all flex items-center whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button (< lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
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

        {/* Mobile Slide-down Quick Drawer (< lg) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-50 bg-white border-t border-slate-200 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              {isAuthenticated && user && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
                    {user.profile?.riskBand || "Moderate"}
                  </div>
                </div>
              )}

              {/* Mobile Quick Nav Links */}
              <div className="space-y-1">
                {primaryLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = link.matches(location.pathname);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-semibold border",
                        isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50/70 border-slate-200/70 text-slate-800 hover:bg-slate-100"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? "text-emerald-700" : "text-slate-500")} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Extra tools / user links */}
              {isAuthenticated && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>KYC & Risk Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    to="/model-transparency"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Model Transparency & Benchmarks</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-6 my-4 border-t border-slate-200 space-y-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl text-center text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-xs transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Dialog Modal (1-Click or Ctrl+K) */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
