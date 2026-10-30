import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFunds } from '../../services/api';
import type { MutualFund, FundCategory, FundRiskLevel } from '../../types';
import { FundCard } from '../../components/funds/FundCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CardGridSkeleton } from '../../components/ui/SkeletonLoader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';

export const Funds: React.FC = () => {
  const navigate = useNavigate();

  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FundCategory | 'All'>('All');
  const [riskLevel, setRiskLevel] = useState<FundRiskLevel | 'All'>('All');
  const [min3YReturn, setMin3YReturn] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'cagr3Y' | 'cagr1Y' | 'cagr5Y' | 'sharpeRatio' | 'volatility' | 'nav'>('cagr3Y');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Compare State (up to 3 funds)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getFunds({
          search: debouncedSearch,
          category,
          riskLevel,
          min3YReturn,
          sortBy,
          sortOrder,
        });
        setFunds(data);
      } catch (err) {
        console.error('Failed to load funds', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedSearch, category, riskLevel, min3YReturn, sortBy, sortOrder]);

  const handleToggleCompare = (code: string) => {
    if (selectedForCompare.includes(code)) {
      setSelectedForCompare(selectedForCompare.filter((c) => c !== code));
    } else {
      if (selectedForCompare.length >= 3) {
        toast.error('You can compare a maximum of 3 funds simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, code]);
      toast.info(`Added to comparison (${selectedForCompare.length + 1}/3)`);
    }
  };

  const categories: (FundCategory | 'All')[] = [
    'All',
    'Flexi Cap',
    'Large Cap Index',
    'Balanced Advantage',
    'Large & Mid Cap',
    'Mid Cap',
    'Small Cap',
    'ELSS',
    'Corporate Bond',
    'Short Duration Debt',
    'Liquid',
  ];

  const riskLevels: (FundRiskLevel | 'All')[] = [
    'All',
    'Low',
    'Moderate',
    'Moderately High',
    'Very High',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <SectionHeader
        eyebrow="DIRECT GROWTH SCHEMES"
        title="Mutual Fund Explorer"
        subtitle="Discover verified direct mutual funds with low expense ratios, risk-adjusted returns, and transparent portfolio holdings."
      />

      {/* Main Filter & Search Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-5">
        
        {/* Row 1: Search & Category Pills */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5B6572] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scheme name, fund house, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs sm:text-sm text-[#0B1220] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5B6572]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs font-semibold text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="cagr3Y">3-Year CAGR (Default)</option>
              <option value="cagr1Y">1-Year CAGR</option>
              <option value="cagr5Y">5-Year CAGR</option>
              <option value="sharpeRatio">Sharpe Ratio (Risk-Adjusted)</option>
              <option value="nav">Current NAV</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E7E5DF]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#FAFAF7] text-[#5B6572] hover:bg-black/5 hover:text-[#0B1220]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 3: Secondary Sliders & Risk Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-[#E7E5DF]">
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#5B6572]">Min 3Y CAGR</span>
              <span className="font-semibold text-[#0B1220]">{min3YReturn}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={35}
              step={2}
              value={min3YReturn}
              onChange={(e) => setMin3YReturn(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-[#5B6572]">Risk Level</span>
              <div className="flex flex-wrap gap-1">
                {riskLevels.map((rl) => (
                  <button
                    key={rl}
                    onClick={() => setRiskLevel(rl)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      riskLevel === rl
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#FAFAF7] text-[#5B6572]'
                    }`}
                  >
                    {rl === 'Moderately High' ? 'Mod-High' : rl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Funds Card Grid */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : funds.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E7E5DF] space-y-3">
          <PieChart className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#0B1220]">No funds matched your filters</h3>
          <p className="text-xs text-[#5B6572]">Try adjusting your search query, risk profile, or CAGR slider.</p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('All');
              setRiskLevel('All');
              setMin3YReturn(0);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund) => (
            <FundCard
              key={fund.code}
              fund={fund}
              isCompared={selectedForCompare.includes(fund.code)}
              onToggleCompare={handleToggleCompare}
              showCompareOption={true}
            />
          ))}
        </div>
      )}

      {/* FLOATING COMPARE BAR (WHEN 2-3 ARE SELECTED) */}
      {selectedForCompare.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom-6 duration-200">
          <div className="p-4 rounded-2xl bg-white text-[#0B1220] shadow-2xl border border-[#E7E5DF] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0F766E] border border-emerald-200 font-bold flex items-center justify-center text-sm">
                {selectedForCompare.length}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight text-[#0B1220]">Compare Schemes</p>
                <p className="text-[11px] text-[#5B6572] truncate max-w-xs">
                  {selectedForCompare.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedForCompare([])}
                className="p-2 rounded-lg text-[#5B6572] hover:text-[#0B1220] hover:bg-black/5"
                title="Clear comparison"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/funds/compare?codes=${selectedForCompare.join(',')}`)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Compare Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner
        type="warning"
        compact={true}
        className="mt-6"
      />

    </div>
  );
};
