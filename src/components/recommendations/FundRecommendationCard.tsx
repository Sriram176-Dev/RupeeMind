import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatINR } from '../../lib/utils';
import type { RecommendationItem } from '../../types';

interface FundRecommendationCardProps {
  item: RecommendationItem;
  monthlySavings: number;
}

export const FundRecommendationCard: React.FC<FundRecommendationCardProps> = ({
  item,
  monthlySavings,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs hover:border-[#0F766E]/40 transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="space-y-3 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#0F766E] text-white font-serif font-bold text-sm flex items-center justify-center">
            #{item.rank}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4F1] dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-300">
            {item.role}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-[#5B6572]">
            {item.fund.category}
          </span>
        </div>

        <div>
          <Link
            to={`/funds/${item.fund.code}`}
            className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2] hover:text-[#0F766E] transition-colors"
          >
            {item.fund.name}
          </Link>
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] mt-0.5">
            {item.fund.fundHouse} • Nav: ₹{item.fund.nav || '—'} • 3Y CAGR:{' '}
            <span className="font-bold text-emerald-600">+{item.fund.cagr3Y}%</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-xs leading-relaxed text-[#0B1220] dark:text-[#E8EDF2]">
          <strong className="text-[#0F766E] dark:text-emerald-400">Why this fund: </strong>
          {item.rationale}
        </div>
      </div>

      {/* Allocation & CTA */}
      <div className="shrink-0 p-5 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] text-center space-y-3 min-w-[200px]">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#5B6572] dark:text-[#8A97A6]">
            Suggested Allocation
          </span>
          <p className="font-serif text-3xl font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">
            {item.allocationPercent}%
          </p>
          <p className="text-[11px] text-[#5B6572]">
            ~ {formatINR(Math.round(((monthlySavings || 20000) * item.allocationPercent) / 100))} / mo
          </p>
        </div>

        <Link
          to={`/funds/${item.fund.code}`}
          className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center justify-center gap-1 min-h-[36px]"
        >
          <span>Explore Scheme</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
