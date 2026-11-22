import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const MobileTabBar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const handleCopilotToggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-copilot'));
  };

  const isMarketsActive =
    location.pathname === '/markets' ||
    location.pathname === '/market' ||
    location.pathname.startsWith('/market/') ||
    location.pathname.startsWith('/funds') ||
    location.pathname === '/news' ||
    location.pathname === '/recommendations';

  const isPortfolioActive =
    location.pathname === '/portfolio' ||
    location.pathname.startsWith('/portfolio/') ||
    location.pathname === '/analytics' ||
    location.pathname === '/tax' ||
    location.pathname === '/rebalance' ||
    location.pathname === '/goals' ||
    location.pathname === '/alerts' ||
    location.pathname === '/paper-trading';

  const isToolsActive =
    location.pathname === '/tools' ||
    location.pathname === '/calculators';

  const isHomeActive =
    isAuthenticated
      ? location.pathname === '/dashboard'
      : location.pathname === '/';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1 flex items-center justify-around lg:hidden"
      aria-label="Mobile Navigation Bar"
    >
      {/* 1. Home */}
      <NavLink
        to={isAuthenticated ? '/dashboard' : '/'}
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all',
          isHomeActive
            ? 'text-emerald-700 font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <LayoutDashboard className={cn('w-5 h-5 mb-0.5', isHomeActive && 'text-emerald-600')} />
        <span className="text-[10px] tracking-tight">Home</span>
      </NavLink>

      {/* 2. Markets */}
      <NavLink
        to="/markets"
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all',
          isMarketsActive
            ? 'text-emerald-700 font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <TrendingUp className={cn('w-5 h-5 mb-0.5', isMarketsActive && 'text-emerald-600')} />
        <span className="text-[10px] tracking-tight">Markets</span>
      </NavLink>

      {/* 3. Portfolio */}
      <NavLink
        to={isAuthenticated ? '/portfolio' : '/login'}
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all',
          isPortfolioActive
            ? 'text-emerald-700 font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <Briefcase className={cn('w-5 h-5 mb-0.5', isPortfolioActive && 'text-emerald-600')} />
        <span className="text-[10px] tracking-tight">Portfolio</span>
      </NavLink>

      {/* 4. Tools */}
      <NavLink
        to="/tools"
        className={cn(
          'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all',
          isToolsActive
            ? 'text-emerald-700 font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <Calculator className={cn('w-5 h-5 mb-0.5', isToolsActive && 'text-emerald-600')} />
        <span className="text-[10px] tracking-tight">Tools</span>
      </NavLink>

      {/* 5. AI Copilot */}
      <button
        type="button"
        onClick={handleCopilotToggle}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-emerald-700 hover:text-emerald-800 transition-all cursor-pointer group"
        aria-label="Open AI Copilot"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-600 text-white text-[8px] font-bold rounded-full font-mono">
            AI
          </span>
        </div>
        <span className="text-[10px] tracking-tight font-medium mt-0.5">Copilot</span>
      </button>
    </nav>
  );
};
