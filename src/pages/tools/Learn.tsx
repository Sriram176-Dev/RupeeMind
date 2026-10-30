import React, { useState } from 'react';
import { SectionHeader } from '../../components/ui/SectionHeader';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';

interface GlossaryTerm {
  term: string;
  category: 'Equities' | 'Mutual Funds' | 'Technical Analysis' | 'Personal Finance';
  definition: string;
  example?: string;
}

export const Learn: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedGuide, setExpandedGuide] = useState<number | null>(0);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const guides = [
    {
      id: 0,
      title: 'The Beginner’s Guide to Systematic Investment Plans (SIP)',
      tag: 'Foundations',
      readTime: '4 min read',
      content: `A Systematic Investment Plan (SIP) is a method of investing fixed amounts periodically (weekly, monthly, or quarterly) into a mutual fund scheme instead of making a one-time lump-sum payment.\n\nKey Advantages:\n1. Rupee Cost Averaging: Automatically buy more units when NAV is low and fewer when NAV is high without trying to time the market.\n2. Power of Compounding: Reinvested earnings generate exponential wealth over 10-20 year horizons.\n3. Eliminates Emotional Biases: Automated debits cultivate unwavering financial discipline.`,
    },
    {
      id: 1,
      title: 'Understanding Algorithmic Stock Signals (RSI, MACD, & Moving Averages)',
      tag: 'Technical Analysis',
      readTime: '6 min read',
      content: `Technical indicators synthesize price momentum, volume accumulation, and statistical trendlines into probability-weighted signals.\n\nCore Indicator Framework:\n- RSI (Relative Strength Index): Measures velocity of price changes on a 0-100 scale. Below 30 suggests oversold accumulation, above 70 suggests overbought consolidation.\n- 50 & 200 DMA (Daily Moving Averages): A Golden Cross occurs when the 50-DMA crosses above the 200-DMA, confirming strong long-term institutional momentum.\n- MACD: Identifies trend direction and momentum shifts via moving average convergence and divergence.`,
    },
    {
      id: 2,
      title: 'Direct vs. Regular Mutual Funds: Saving 1% Compounding Drag',
      tag: 'Fund Selection',
      readTime: '5 min read',
      content: `Direct plans are purchased directly from the Asset Management Company (AMC) with zero distributor or broker commissions. Regular plans include an annual trail commission of 0.5% to 1.5% deducted permanently from your NAV.\n\nOver a 20-year investing journey on a ₹20,000 monthly SIP, that 1% difference in expense ratio compounds into over ₹35-40 Lakhs of extra wealth in your pocket!`,
    },
  ];

  const glossary: GlossaryTerm[] = [
    {
      term: 'NAV (Net Asset Value)',
      category: 'Mutual Funds',
      definition: 'The per-unit market value of a mutual fund scheme calculated by dividing total assets minus liabilities by the total number of outstanding units.',
      example: 'If a fund has net assets of ₹1,000 Cr and 10 Cr units, its NAV is ₹100.',
    },
    {
      term: 'CAGR (Compound Annual Growth Rate)',
      category: 'Personal Finance',
      definition: 'The annualized rate of return that an investment provides over an extended holding period longer than one year, smoothing out volatile annual fluctuations.',
    },
    {
      term: 'Expense Ratio (TER)',
      category: 'Mutual Funds',
      definition: 'The percentage of a fund’s total assets deducted annually to pay for fund management, administrative overhead, and regulatory expenses.',
    },
    {
      term: 'RSI (Relative Strength Index)',
      category: 'Technical Analysis',
      definition: 'A momentum oscillator that measures the speed and change of price movements between 0 and 100 to identify oversold (<30) and overbought (>70) levels.',
    },
    {
      term: 'MACD (Moving Average Convergence Divergence)',
      category: 'Technical Analysis',
      definition: 'A trend-following momentum indicator that shows the relationship between two exponential moving averages (typically 12-day and 26-day EMA) of a security’s price.',
    },
    {
      term: '50-DMA / 200-DMA',
      category: 'Technical Analysis',
      definition: 'Daily Moving Averages representing the average closing price over the last 50 or 200 trading sessions, acting as critical institutional support/resistance baselines.',
    },
    {
      term: 'Volatility (Standard Deviation)',
      category: 'Equities',
      definition: 'A statistical measure of the dispersion of returns for a given security or fund. Lower volatility indicates smoother and more predictable compounding.',
    },
    {
      term: 'Maximum Drawdown',
      category: 'Personal Finance',
      definition: 'The maximum observed loss from a peak to a trough of a portfolio before a new peak is attained. Used to evaluate historical downside capital protection.',
    },
    {
      term: 'ELSS (Equity Linked Savings Scheme)',
      category: 'Mutual Funds',
      definition: 'A diversified equity mutual fund offering tax deductions up to ₹1.5 Lakhs under Section 80C of the Income Tax Act with a mandatory 3-year lock-in period.',
    },
    {
      term: 'Emergency Fund',
      category: 'Personal Finance',
      definition: 'A dedicated pool of safe, highly liquid cash (in savings bank or liquid mutual funds) covering 3 to 6 months of mandatory living expenses for crisis resilience.',
    },
    {
      term: 'STP (Systematic Transfer Plan)',
      category: 'Mutual Funds',
      definition: 'An automated mechanism allowing investors to transfer a fixed sum periodically from one mutual fund scheme (typically liquid/debt) to an equity fund.',
    },
    {
      term: 'SWP (Systematic Withdrawal Plan)',
      category: 'Mutual Funds',
      definition: 'A disciplined facility allowing investors to withdraw a fixed sum regularly from their mutual fund corpus, generating tax-efficient cash flow during retirement.',
    },
  ];

  const categories = ['All', 'Mutual Funds', 'Technical Analysis', 'Personal Finance', 'Equities'];

  const filteredGlossary = glossary.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-12 animate-in fade-in duration-200">
      
      <SectionHeader
        eyebrow="KNOWLEDGE REPOSITORY"
        title="Investor Education & Financial Glossary"
        subtitle="Demystifying Indian capital market terminologies, technical indicators, and compounding fundamentals."
      />

      {/* 1. BEGINNER GUIDES ACCORDION SECTION */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-[#0B1220]">
          Essential Investor Guides
        </h2>

        <div className="space-y-3">
          {guides.map((g) => {
            const isExpanded = expandedGuide === g.id;
            return (
              <div
                key={g.id}
                className="rounded-3xl bg-white border border-[#E7E5DF] overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setExpandedGuide(isExpanded ? null : g.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#0F766E]">
                        {g.tag}
                      </span>
                      <span className="text-xs text-[#5B6572]">{g.readTime}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0B1220]">
                      {g.title}
                    </h3>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-[#FAFAF7] flex items-center justify-center text-[#5B6572] shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#E7E5DF] text-xs sm:text-sm text-[#5B6572] leading-relaxed whitespace-pre-line animate-in fade-in duration-150">
                    {g.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SEARCHABLE GLOSSARY GRID */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0B1220]">
              Interactive Financial Glossary
            </h2>
            <p className="text-xs text-[#5B6572]">Plain-English definitions for financial jargon and technical indicators.</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-[#5B6572] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search glossary terms..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E7E5DF] text-xs text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-white border border-[#E7E5DF] text-[#5B6572] hover:bg-black/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Glossary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGlossary.map((item) => (
            <div
              key={item.term}
              className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs flex flex-col justify-between hover:border-[#0F766E]/40 transition-all space-y-3"
            >
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4F1] text-[#0F766E]">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#0B1220] mt-2">
                  {item.term}
                </h3>
                <p className="text-xs text-[#5B6572] leading-relaxed mt-1">
                  {item.definition}
                </p>
              </div>

              {item.example && (
                <div className="pt-3 border-t border-[#E7E5DF] text-[11px] text-[#5B6572] italic">
                  <strong>Example:</strong> {item.example}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
