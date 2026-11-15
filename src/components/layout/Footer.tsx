import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config';
import { Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Top 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-slate-100">
          {/* Column 1: Brand & Mission */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm ring-1 ring-emerald-700/20 shadow-xs">
                ₹
              </div>
              <span className="font-sans text-base font-bold tracking-tight text-slate-900">
                Rupee Mind
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-[280px] text-slate-500">
              Empowering Indian investors with transparent algorithmic stock signals, risk-aligned fund matching, and mathematical compounding tools.
            </p>
            <div className="flex flex-col gap-1 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-700 font-mono text-[10px] uppercase tracking-wider">Data Transparency</span>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Market data: NSE/BSE delayed ~15 min. Mutual fund data: AMFI via mfapi.in. News: Public RSS feeds.
              </p>
            </div>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
              Products & Markets
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/market" className="text-slate-500 hover:text-emerald-700 transition-colors">NSE Live Market</Link></li>
              <li><Link to="/funds" className="text-slate-500 hover:text-emerald-700 transition-colors">Mutual Fund Explorer</Link></li>
              <li><Link to="/funds/compare" className="text-slate-500 hover:text-emerald-700 transition-colors">Fund Comparison</Link></li>
              <li><Link to="/paper-trading" className="text-slate-500 hover:text-emerald-700 transition-colors">Paper Trading Terminal</Link></li>
              <li><Link to="/recommendations" className="text-slate-500 hover:text-emerald-700 transition-colors">AI Recommendations</Link></li>
              <li><Link to="/portfolio" className="text-slate-500 hover:text-emerald-700 transition-colors">Portfolio & SIP Tracker</Link></li>
            </ul>
          </div>

          {/* Column 3: Tools & Analytics */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
              Analytics & Tools
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/analytics" className="text-slate-500 hover:text-emerald-700 transition-colors">Stress Testing & VaR</Link></li>
              <li><Link to="/calculators" className="text-slate-500 hover:text-emerald-700 transition-colors">SIP & Lumpsum Calculator</Link></li>
              <li><Link to="/calculators" className="text-slate-500 hover:text-emerald-700 transition-colors">Step-Up SIP Planner</Link></li>
              <li><Link to="/calculators" className="text-slate-500 hover:text-emerald-700 transition-colors">Retirement & Tax Tools</Link></li>
              <li><Link to="/news" className="text-slate-500 hover:text-emerald-700 transition-colors">Market & Economy News</Link></li>
              <li><Link to="/learn" className="text-slate-500 hover:text-emerald-700 transition-colors">Learn Academy & Glossary</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
              Legal & Compliance
            </h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/disclaimer" className="text-slate-500 hover:text-emerald-700 transition-colors">Disclaimer & Risk Disclosure</Link></li>
              <li><Link to="/disclaimer" className="text-slate-500 hover:text-emerald-700 transition-colors">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="text-slate-500 hover:text-emerald-700 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/onboarding" className="text-slate-500 hover:text-emerald-700 transition-colors">Risk Profile Assessment</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="pt-8 space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] leading-relaxed text-amber-900/90 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold text-amber-950">Important Regulatory Notice:</strong> {APP_CONFIG.disclaimer} All calculations and technical indicators provided are based on mathematical formulas for educational exploration and do not constitute financial advice or SEBI-registered investment advisory recommendations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Rupee Mind Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              Crafted for Indian Investors
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
