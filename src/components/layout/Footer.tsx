import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config';
import { Shield, Sparkles, TrendingUp, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#0B0F14] text-[#5B6572] dark:text-[#8A97A6] transition-colors duration-200">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Top 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-[#E7E5DF] dark:border-[#1F2933]">
          {/* Column 1: Brand & Mission */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
                ₹
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-[#0B1220] dark:text-[#E8EDF2]">
                Rupee Mind
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-[280px]">
              Empowering Indian investors with transparent algorithmic stock signals, risk-aligned fund matching, and mathematical compounding tools.
            </p>
            <div className="flex flex-col gap-1 text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
              <span className="font-semibold text-[#0F766E] dark:text-emerald-400">Data Sources:</span>
              <p className="text-[10px] leading-relaxed">
                Market data: Yahoo Finance (delayed ~15 min). Mutual fund data: AMFI via mfapi.in. News: public RSS feeds.
              </p>
            </div>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#E8EDF2]">
              Products
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/market" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">NSE Live Market</Link></li>
              <li><Link to="/market" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Technical Signals</Link></li>
              <li><Link to="/funds" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Mutual Fund Explorer</Link></li>
              <li><Link to="/funds/compare" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Fund Comparison</Link></li>
              <li><Link to="/recommendations" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">AI Fund Recommendation</Link></li>
              <li><Link to="/portfolio" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Portfolio & SIP Tracker</Link></li>
            </ul>
          </div>

          {/* Column 3: Tools & Learn */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#E8EDF2]">
              Calculators & Learn
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/calculators" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">SIP Calculator</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Step-Up SIP Planner</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Goal Planner</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Inflation Adjusted Math</Link></li>
              <li><Link to="/learn" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Financial Glossary</Link></li>
              <li><Link to="/news" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Market & Economy News</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#E8EDF2]">
              Legal & Trust
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Disclaimer & Risk Disclosure</Link></li>
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/onboarding" className="hover:text-[#0F766E] dark:hover:text-emerald-400 transition-colors">Risk Profile Assessment</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="pt-8 space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Important Disclaimer:</strong> {APP_CONFIG.disclaimer} All calculations and technical indicators provided are based on mathematical formulas for educational exploration and do not constitute financial advice or investment recommendations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Rupee Mind Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1 text-[11px]">
              Crafted with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Indian Investors
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
