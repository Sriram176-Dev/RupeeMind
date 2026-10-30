import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config';
import { Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E7E5DF] bg-[#FAFAF7] text-[#5B6572] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Top 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-[#E7E5DF]">
          {/* Column 1: Brand & Mission */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold text-base">
                ₹
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-[#0B1220]">
                Rupee Mind
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-[280px]">
              Empowering Indian investors with transparent algorithmic stock signals, risk-aligned fund matching, and mathematical compounding tools.
            </p>
            <div className="flex flex-col gap-1 text-[11px] text-[#5B6572]">
              <span className="font-semibold text-[#0F766E]">Data Sources:</span>
              <p className="text-[10px] leading-relaxed">
                Market data: Yahoo Finance (delayed ~15 min). Mutual fund data: AMFI via mfapi.in. News: public RSS feeds.
              </p>
            </div>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220]">
              Products & Markets
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/market" className="hover:text-[#0F766E] transition-colors">NSE Live Market</Link></li>
              <li><Link to="/funds" className="hover:text-[#0F766E] transition-colors">Mutual Fund Explorer</Link></li>
              <li><Link to="/funds/compare" className="hover:text-[#0F766E] transition-colors">Fund Comparison</Link></li>
              <li><Link to="/paper-trading" className="hover:text-[#0F766E] transition-colors">Paper Trading Terminal</Link></li>
              <li><Link to="/recommendations" className="hover:text-[#0F766E] transition-colors">AI Recommendations</Link></li>
              <li><Link to="/portfolio" className="hover:text-[#0F766E] transition-colors">Portfolio & SIP Tracker</Link></li>
            </ul>
          </div>

          {/* Column 3: Tools & Analytics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220]">
              Analytics & Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/analytics" className="hover:text-[#0F766E] transition-colors">Stress Testing & VaR</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] transition-colors">SIP & Lumpsum Calculator</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] transition-colors">Step-Up SIP Planner</Link></li>
              <li><Link to="/calculators" className="hover:text-[#0F766E] transition-colors">Retirement & Tax Tools</Link></li>
              <li><Link to="/news" className="hover:text-[#0F766E] transition-colors">Market & Economy News</Link></li>
              <li><Link to="/learn" className="hover:text-[#0F766E] transition-colors">Learn Academy & Glossary</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220]">
              Legal & Compliance
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] transition-colors">Disclaimer & Risk Disclosure</Link></li>
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-[#0F766E] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/onboarding" className="hover:text-[#0F766E] transition-colors">Risk Profile Assessment</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="pt-8 space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] leading-relaxed text-amber-900/80 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
