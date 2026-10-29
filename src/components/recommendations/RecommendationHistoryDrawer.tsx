import React from 'react';
import { History, GitCompare, X, Calendar, Archive } from 'lucide-react';
import type { FundRecommendationResponse } from '../../types';

interface RecommendationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: FundRecommendationResponse[];
  historyLoading: boolean;
  selectedForCompare: string[];
  currentRecommendationId?: string;
  comparing: boolean;
  onToggleCompareSelection: (id: string) => void;
  onRunComparison: () => void;
  onSelectHistoryItem: (item: FundRecommendationResponse) => void;
  onArchive: (id: string) => void;
}

export const RecommendationHistoryDrawer: React.FC<RecommendationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
  historyLoading,
  selectedForCompare,
  currentRecommendationId,
  comparing,
  onToggleCompareSelection,
  onRunComparison,
  onSelectHistoryItem,
  onArchive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#0F766E] dark:text-emerald-400" />
          <h2 className="font-serif text-lg font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Recommendation History & Strategy Comparison
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {selectedForCompare.length === 2 && (
            <button
              onClick={onRunComparison}
              disabled={comparing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{comparing ? 'Comparing...' : 'Compare 2 Selected'}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">
        Select any two past strategy snapshots to see a side-by-side asset allocation and scheme performance comparison.
      </p>

      {historyLoading ? (
        <div className="py-8 text-center text-xs text-gray-500">Loading history...</div>
      ) : historyItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-500">No past recommendations saved yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {historyItems.map((item) => {
            const itemId = item._id || item.id || '';
            const isSelected = selectedForCompare.includes(itemId);
            const isCurrent = currentRecommendationId === itemId;

            return (
              <div
                key={itemId}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : isCurrent
                    ? 'border-[#0F766E] bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-[#E7E5DF] dark:border-[#1F2933] bg-[#FAFAF7] dark:bg-[#0B0F14]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#0F766E] dark:text-emerald-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.generatedAt || item.createdAt || '').toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.confidenceScore && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          {item.confidenceScore}% fit
                        </span>
                      )}
                      {item.status === 'archived' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2]">
                    {item.profileSnapshot?.riskBand} • {item.recommendations?.length || 0} Schemes
                  </p>
                  <p className="text-[11px] text-[#5B6572] dark:text-[#8A97A6]">
                    Eq {item.assetAllocation?.equity}% / Debt {item.assetAllocation?.debt}% / Gold {item.assetAllocation?.gold}%
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E7E5DF] dark:border-[#1F2933] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onToggleCompareSelection(itemId)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-[#1A222D] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select for compare'}
                  </button>

                  <div className="flex items-center gap-1">
                    {!isCurrent && (
                      <button
                        onClick={() => onSelectHistoryItem(item)}
                        className="text-[11px] font-bold text-[#0F766E] dark:text-emerald-400 hover:underline px-2 py-1"
                      >
                        View
                      </button>
                    )}
                    {item.status !== 'archived' && (
                      <button
                        onClick={() => onArchive(itemId)}
                        title="Archive strategy"
                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
