import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
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
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Search,
  Bell,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlobalSearch } from '../market/GlobalSearch';
import { NotificationPanel } from '../notifications/NotificationPanel';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Ctrl+K / ⌘+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loggedInLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Market', path: '/market', icon: TrendingUp },
    { label: 'Paper Trading', path: '/paper-trading', icon: Wallet },
    { label: 'Mutual Funds', path: '/funds', icon: PieChart },
    { label: 'Recommendations', path: '/recommendations', icon: Sparkles },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Calculators', path: '/calculators', icon: Calculator },
    { label: 'News', path: '/news', icon: Newspaper },
    { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
  ];

  const loggedOutLinks = [
    { label: 'Market', path: '/market', icon: TrendingUp },
    { label: 'Mutual Funds', path: '/funds', icon: PieChart },
    { label: 'Calculators', path: '/calculators', icon: Calculator },
    { label: 'News', path: '/news', icon: Newspaper },
    { label: 'Learn', path: '/learn', icon: BookOpen },
  ];

  const links = isAuthenticated ? loggedInLinks : loggedOutLinks;

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E7E5DF] dark:border-[#1F2933] glass-panel transition-colors duration-200">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 shrink-0"
            aria-label="Rupee Mind Home"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform duration-200">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2]">
                Rupee Mind
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Main Navigation">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5',
                    isActive
                      ? 'text-[#0F766E] dark:text-emerald-400 bg-[#E6F4F1] dark:bg-emerald-950/50 font-semibold'
                      : 'text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#0F766E] dark:text-emerald-400' : 'text-current opacity-70')} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search Trigger Button (Desktop) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAFAF7] dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] text-xs text-[#5B6572] dark:text-[#8A97A6] hover:border-[#0F766E] dark:hover:border-emerald-500 hover:text-[#0B1220] dark:hover:text-[#E8EDF2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            title="Search stocks, mutual funds (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Search stocks, funds...</span>
            <span className="lg:hidden">Search...</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-[#5B6572]">
              ⌘K
            </kbd>
          </button>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Icon (Mobile) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] border border-[#E7E5DF] dark:border-[#1F2933]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationPanelOpen(!notificationPanelOpen);
                  setUserDropdownOpen(false);
                }}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[#E7E5DF] dark:hover:border-[#1F2933] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F766E] dark:bg-emerald-400"></span>
                  </span>
                )}
              </button>

              {notificationPanelOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationPanelOpen(false)}
                  />
                  <NotificationPanel onClose={() => setNotificationPanelOpen(false)} />
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-[#5B6572] dark:text-[#8A97A6] hover:text-[#0B1220] dark:hover:text-[#E8EDF2] hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[#E7E5DF] dark:hover:border-[#1F2933] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {isAuthenticated && user ? (
              /* User Avatar Dropdown */
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationPanelOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 dark:bg-emerald-500/20 text-[#0F766E] dark:text-emerald-300 font-semibold flex items-center justify-center text-sm border border-emerald-500/20">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] leading-tight max-w-[100px] truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-[#5B6572] dark:text-[#8A97A6] leading-tight">
                      {user.profile?.riskBand || 'Investor'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6572] dark:text-[#8A97A6]" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#121821] rounded-2xl border border-[#E7E5DF] dark:border-[#1F2933] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-[#E7E5DF] dark:border-[#1F2933]">
                        <p className="text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6] truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#0B1220] dark:text-[#E8EDF2] hover:bg-[#FAFAF7] dark:hover:bg-[#1A2330] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#5B6572] dark:text-[#8A97A6]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#0B1220] dark:text-[#E8EDF2] hover:bg-[#FAFAF7] dark:hover:bg-[#1A2330] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#5B6572] dark:text-[#8A97A6]" />
                        <span>Settings</span>
                      </Link>

                      <div className="my-1 border-t border-[#E7E5DF] dark:border-[#1F2933]" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Logged Out Buttons */
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-[#0B1220] dark:text-[#E8EDF2] hover:text-[#0F766E] dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors min-h-[40px] flex items-center"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:shadow hover:scale-[1.02] min-h-[40px] flex items-center"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#0B1220] dark:text-[#E8EDF2] border border-[#E7E5DF] dark:border-[#1F2933]"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-over Full-height Sheet */}
        {mobileMenuOpen && (
          <div className="xl:hidden fixed inset-0 top-16 z-50 bg-white dark:bg-[#0B0F14] border-t border-[#E7E5DF] dark:border-[#1F2933] overflow-y-auto p-6 flex flex-col justify-between">
            <div className="space-y-3">
              {isAuthenticated && user && (
                <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] mb-4">
                  <p className="text-sm font-bold text-[#0B1220] dark:text-[#E8EDF2]">{user.name}</p>
                  <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">{user.email}</p>
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F4F1] dark:bg-emerald-950 text-[#0F766E] dark:text-emerald-300">
                    Risk Band: {user.profile?.riskBand || 'Moderate'}
                  </div>
                </div>
              )}

              <nav className="flex flex-col space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 transition-colors min-h-[48px]',
                        isActive
                          ? 'text-[#0F766E] dark:text-emerald-400 bg-[#E6F4F1] dark:bg-emerald-950/60 font-semibold'
                          : 'text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {isAuthenticated && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5 min-h-[48px]"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 text-[#5B6572] dark:text-[#8A97A6] hover:bg-black/5 min-h-[48px]"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E7E5DF] dark:border-[#1F2933] space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-center text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 min-h-[44px]"
                >
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 px-4 rounded-xl text-center text-sm font-semibold text-[#0B1220] dark:text-[#E8EDF2] border border-[#E7E5DF] dark:border-[#1F2933] min-h-[44px] flex items-center justify-center"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 px-4 rounded-xl text-center text-sm font-semibold text-white bg-[#0F766E] dark:bg-emerald-600 min-h-[44px] flex items-center justify-center"
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
