import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Percent,
  Activity,
  Layers,
} from 'lucide-react';
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
  const [showExplainability, setShowExplainability] = useState(false);
  const exp = item.explainability;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs hover:border-[#0F766E]/40 transition-all flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-[#0F766E] text-white font-serif font-bold text-sm flex items-center justify-center">
              #{item.rank}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4F1] text-[#0F766E]">
              {item.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-[#5B6572]">
              {item.fund.category}
            </span>
          </div>

          <div>
            <Link
              to={`/funds/${item.fund.code}`}
              className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220] hover:text-[#0F766E] transition-colors"
            >
              {item.fund.name}
            </Link>
            <p className="text-xs text-[#5B6572] mt-0.5">
              {item.fund.fundHouse} • NAV: ₹{item.fund.nav || '—'} • 3Y CAGR:{' '}
              <span className="font-bold text-emerald-600">+{item.fund.cagr3Y}%</span>
              {item.fund.cagr5Y && (
                <span className="ml-2 text-stone-500">
                  • 5Y CAGR: <span className="font-semibold text-emerald-600">+{item.fund.cagr5Y}%</span>
                </span>
              )}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] text-xs leading-relaxed text-[#0B1220]">
            <strong className="text-[#0F766E]">Why this fund: </strong>
            {item.rationale}
          </div>
        </div>

        {/* Allocation & CTA */}
        <div className="shrink-0 p-5 rounded-2xl bg-[#FAFAF7] border border-[#E7E5DF] text-center space-y-3 min-w-[200px]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5B6572]">
              Suggested Allocation
            </span>
            <p className="font-serif text-3xl font-bold text-[#0F766E] mt-0.5">
              {item.allocationPercent}%
            </p>
            <p className="text-[11px] text-[#5B6572]">
              ~ {formatINR(Math.round(((monthlySavings || 20000) * item.allocationPercent) / 100))} / mo
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              to={`/funds/${item.fund.code}`}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] transition-all flex items-center justify-center gap-1 min-h-[36px]"
            >
              <span>Explore Scheme</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setShowExplainability(!showExplainability)}
              className="w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>{showExplainability ? 'Hide Factors' : 'Explain Factors'}</span>
              {showExplainability ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Explainability Breakdown Panel */}
      {showExplainability && exp && (
        <div className="pt-4 border-t border-stone-200 space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Mathematical Explainability & Peer Group Comparison
            </span>
            <span className="text-[11px] font-mono font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              Fit Score: {exp.categoryFit.fitScore}%
            </span>
          </div>

          {exp.oneLineSummary && (
            <p className="p-2.5 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-900 font-medium">
              💡 {exp.oneLineSummary}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Category Fit */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                Risk Band Alignment
              </span>
              <p className="font-semibold text-stone-900 text-xs">
                {exp.categoryFit.fundRiskLevel} Risk
              </p>
              <p className="text-[11px] text-stone-600 leading-snug">
                {exp.categoryFit.reason}
              </p>
            </div>

            {/* 3Y CAGR vs Category */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                3Y CAGR vs Category
              </span>
              <p className="font-mono font-bold text-stone-900 text-xs">
                {exp.cagrComparison.fund3YCagr}%{' '}
                <span className="font-normal text-stone-500">
                  (Avg: {exp.cagrComparison.categoryAvg3Y}%)
                </span>
              </p>
              <p className="text-[11px] text-stone-600 leading-snug">
                {exp.cagrComparison.reason}
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                Sharpe (Risk-Adjusted)
              </span>
              <p className="font-mono font-bold text-teal-700 text-xs">
                {exp.sharpeRatio.fundSharpe}{' '}
                <span className="font-normal text-stone-500">
                  (Avg: {exp.sharpeRatio.benchmarkSharpe})
                </span>
              </p>
              <p className="text-[11px] text-stone-600 leading-snug">
                {exp.sharpeRatio.reason}
              </p>
            </div>

            {/* Expense Ratio & Drawdown */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                TER & Max Drawdown
              </span>
              <p className="font-mono font-bold text-stone-900 text-xs">
                TER: {exp.expenseRatio.fundExpenseRatio}%{' '}
                <span className="font-normal text-stone-500">
                  • DD: {exp.maxDrawdown.fundDrawdown}%
                </span>
              </p>
              <p className="text-[11px] text-stone-600 leading-snug">
                {exp.expenseRatio.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
