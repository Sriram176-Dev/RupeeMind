import React from 'react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { APP_CONFIG } from '../../config';
import { Shield, AlertTriangle, FileText, Lock } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <SectionHeader
        eyebrow="LEGAL, COMPLIANCE & TRANSPARENCY"
        title="Terms, Disclaimer & Risk Disclosures"
        subtitle="Please review our educational terms, algorithmic methodology, and regulatory risk disclosures carefully."
      />

      {/* Main Alert Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
          <AlertTriangle className="w-5 h-5" />
          <span>Statutory Disclaimer & Non-Advisory Notice</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
          {APP_CONFIG.disclaimer}
        </p>
      </div>

      {/* Section 1: Nature of Service */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#0F766E]" />
          <h2 className="font-serif text-xl font-bold text-[#0B1220]">
            1. Nature of Platform & Educational Scope
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-[#5B6572] leading-relaxed space-y-3">
          <p>
            Rupee Mind is a financial analytics, algorithmic signal synthesis, and compounding simulation software platform designed strictly for informational and educational enrichment.
          </p>
          <p>
            The software does not act as a SEBI-registered Investment Advisor (RIA), Research Analyst (RA), or Mutual Fund Distributor (MFD). Nothing on this website constitutes an offer, solicitation, or recommendation to buy or sell any security, financial instrument, or mutual fund unit.
          </p>
        </div>
      </div>

      {/* Section 2: Algorithmic Signals & Technical Indicators */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#0F766E]" />
          <h2 className="font-serif text-xl font-bold text-[#0B1220]">
            2. Algorithmic Signals & Mathematical Models
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-[#5B6572] leading-relaxed space-y-3">
          <p>
            All Buy, Sell, and Hold signals, RSI calculations, MACD indicators, and Moving Average Golden/Death Crosses are derived purely through quantitative mathematical formulas applied to historical market data.
          </p>
          <p>
            Past performance and backtested historical win rates are not guarantees of future profitability. Markets involve substantial risk of capital loss. Users are solely responsible for all personal financial decisions and execution trades.
          </p>
        </div>
      </div>

      {/* Section 3: Privacy & Data Security */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#0F766E]" />
          <h2 className="font-serif text-xl font-bold text-[#0B1220]">
            3. Client Privacy & Storage Policy
          </h2>
        </div>
        <div className="text-xs sm:text-sm text-[#5B6572] leading-relaxed space-y-3">
          <p>
            Rupee Mind operates a privacy-centric client architecture. Your onboarding questionnaire answers, risk scores, and simulated holding portfolios are stored in client-side storage (`localStorage`) on your personal browser unless explicit cloud synchronization is enabled.
          </p>
          <p>
            We do not monetize or sell your personally identifiable data to third-party telemarketers or predatory loan distributors.
          </p>
        </div>
      </div>

    </div>
  );
};
