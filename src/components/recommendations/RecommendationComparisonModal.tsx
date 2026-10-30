import React from 'react';
import { GitCompare, X } from 'lucide-react';
import type { RecommendationComparison } from '../../types';

interface RecommendationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonData: RecommendationComparison | null;
}

export const RecommendationComparisonModal: React.FC<RecommendationComparisonModalProps> = ({
  isOpen,
  onClose,
  comparisonData,
}) => {
  if (!isOpen || !comparisonData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E7E5DF] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5DF]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-indigo-600" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B1220]">
              Strategy Comparison Analysis
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Top comparison summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Common Schemes</span>
            <p className="font-serif text-xl font-bold text-[#0B1220] mt-0.5">
              {comparisonData.comparisonSummary.commonFundsCount}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Equity Shift</span>
            <p className={`font-serif text-xl font-bold mt-0.5 ${
              comparisonData.comparisonSummary.equityAllocationDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {comparisonData.comparisonSummary.equityAllocationDiff >= 0 ? '+' : ''}
              {comparisonData.comparisonSummary.equityAllocationDiff}%
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Debt Shift</span>
            <p className={`font-serif text-xl font-bold mt-0.5 ${
              comparisonData.comparisonSummary.debtAllocationDiff >= 0 ? 'text-indigo-600' : 'text-amber-600'
            }`}>
              {comparisonData.comparisonSummary.debtAllocationDiff >= 0 ? '+' : ''}
              {comparisonData.comparisonSummary.debtAllocationDiff}%
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Weighted 3Y CAGR Diff</span>
            <p className={`font-serif text-xl font-bold mt-0.5 ${
              comparisonData.comparisonSummary.weightedCagr3YDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {comparisonData.comparisonSummary.weightedCagr3YDiff >= 0 ? '+' : ''}
              {comparisonData.comparisonSummary.weightedCagr3YDiff}%
            </p>
          </div>
        </div>

        {/* Side by Side cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strategy A */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-[#FAFAF7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F766E]">
                Strategy A ({new Date(comparisonData.rec1.generatedAt).toLocaleDateString()})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {comparisonData.rec1.confidenceScore}% Fit
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Risk Band: <strong>{comparisonData.rec1.riskBand}</strong> • Weighted 3Y CAGR: <strong>+{comparisonData.rec1.weightedCagr3Y}%</strong>
            </p>
            <div className="text-[11px] space-y-1">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Asset Split:</span>
              <p>Equity: {comparisonData.rec1.assetAllocation.equity}% | Debt: {comparisonData.rec1.assetAllocation.debt}% | Gold: {comparisonData.rec1.assetAllocation.gold}%</p>
            </div>
            <div className="space-y-1 pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Schemes ({comparisonData.rec1.recommendations.length}):</span>
              {comparisonData.rec1.recommendations.map((r, idx) => (
                <div key={idx} className="text-xs flex items-center justify-between">
                  <span className="truncate pr-2">{r.fundName}</span>
                  <span className="font-bold text-[#0F766E]">{r.allocationPercent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy B */}
          <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700">
                Strategy B ({new Date(comparisonData.rec2.generatedAt).toLocaleDateString()})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {comparisonData.rec2.confidenceScore}% Fit
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Risk Band: <strong>{comparisonData.rec2.riskBand}</strong> • Weighted 3Y CAGR: <strong>+{comparisonData.rec2.weightedCagr3Y}%</strong>
            </p>
            <div className="text-[11px] space-y-1">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Asset Split:</span>
              <p>Equity: {comparisonData.rec2.assetAllocation.equity}% | Debt: {comparisonData.rec2.assetAllocation.debt}% | Gold: {comparisonData.rec2.assetAllocation.gold}%</p>
            </div>
            <div className="space-y-1 pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-500 uppercase text-[10px]">Schemes ({comparisonData.rec2.recommendations.length}):</span>
              {comparisonData.rec2.recommendations.map((r, idx) => (
                <div key={idx} className="text-xs flex items-center justify-between">
                  <span className="truncate pr-2">{r.fundName}</span>
                  <span className="font-bold text-indigo-600">{r.allocationPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58]"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
