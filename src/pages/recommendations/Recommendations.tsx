import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  generateRecommendationsApi,
  getLatestRecommendationApi,
  getRecommendationHistoryApi,
  compareRecommendationsApi,
  archiveRecommendationApi,
} from '../../services/api';
import type {
  FundRecommendationResponse,
  RecommendationComparison,
} from '../../types';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCompactINR } from '../../lib/utils';
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Compass,
  History,
  Target,
  BarChart3,
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  RecommendationLoadingStepper,
  AssetAllocationChart,
  FundRecommendationCard,
  RecommendationHistoryDrawer,
  RecommendationComparisonModal,
} from '../../components/recommendations';

export const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<FundRecommendationResponse | null>(null);

  // History & Comparison state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<FundRecommendationResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<RecommendationComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  const loadingSteps = [
    'Analyzing risk tolerance posture & cash flow surplus...',
    'Reviewing current portfolio holdings & watchlist exposure...',
    'Scanning 14 direct mutual fund categories & tracking metrics...',
    'Synthesizing asset-allocation weights (Equity / Debt / Gold)...',
    'Writing personalized algorithmic fund rationales & thesis...',
  ];

  const profile = user?.profile;

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getRecommendationHistoryApi({ limit: 15 });
      setHistoryItems(res.items);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!profile) return;
    setLoading(true);
    setLoadingStepIndex(0);

    const stepInterval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 500);

    try {
      const res = await generateRecommendationsApi();
      clearInterval(stepInterval);
      setRecommendations(res);
      toast.success('Algorithmic portfolio allocation generated from live profile & holdings!');
      loadHistory();
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : 'Failed to generate recommendations';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.riskBand) {
      getLatestRecommendationApi()
        .then((data) => {
          if (data) setRecommendations(data);
        })
        .catch(() => {});
      loadHistory();
    }
  }, [profile?.riskBand]);

  const handleToggleCompareSelection = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 2) {
        toast.info('You can compare exactly 2 recommendation runs. Deselect one first.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRunComparison = async () => {
    if (selectedForCompare.length !== 2) return;
    setComparing(true);
    try {
      const res = await compareRecommendationsApi(selectedForCompare[0], selectedForCompare[1]);
      setComparisonData(res);
      setComparisonModalOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not compare strategy runs';
      toast.error(message);
    } finally {
      setComparing(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveRecommendationApi(id);
      toast.success('Strategy snapshot archived.');
      loadHistory();
      if (recommendations?._id === id || recommendations?.id === id) {
        setRecommendations((prev) => (prev ? { ...prev, status: 'archived' } : prev));
      }
    } catch {
      toast.error('Failed to archive recommendation');
    }
  };

  const handleSelectHistoryItem = (item: FundRecommendationResponse) => {
    setRecommendations(item);
    toast.info(`Viewing snapshot from ${new Date(item.generatedAt || item.createdAt || '').toLocaleDateString()}`);
  };

  if (!profile || !profile.riskBand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <EmptyState
          icon={Compass}
          title="Complete Profile & Risk Assessment First"
          description="We need your financial baseline, goal horizon, and risk tolerance before calculating an optimal asset allocation and selecting funds."
          actionText="Take 2-Minute Risk Assessment"
          onAction={() => navigate('/onboarding')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
              Algorithmic Allocation
            </span>
            {recommendations?.confidenceScore && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {recommendations.confidenceScore}% Model Fit
              </span>
            )}
            {recommendations?.status === 'archived' && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                Archived
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            {profile.riskBand} Strategy
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Goal: <strong className="text-slate-800 font-semibold">{profile.goalType}</strong> • Horizon: <strong className="text-slate-800 font-semibold">{profile.horizonYears} Years</strong> • Target: <strong className="text-slate-800 font-semibold">{formatCompactINR(profile.targetAmount)}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>History ({historyItems.length})</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing...' : 'Regenerate Strategy'}</span>
          </button>
        </div>
      </div>

      {/* Dual Assessment & Fiduciary Constraint Explainer */}
      {(profile.riskToleranceBand || profile.riskCapacityBand || profile.isRiskConstrained) && (
        <div className={`p-4 sm:p-5 rounded-xl border ${
          profile.isRiskConstrained
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {profile.isRiskConstrained ? (
                  <Lock className="w-4 h-4 text-amber-700" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
                  {profile.isRiskConstrained ? 'Fiduciary Capacity Constraint Applied' : 'Risk Tolerance & Capacity Aligned'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                {profile.riskConstraintReason ||
                  `Portfolio risk is calibrated directly to your ${profile.riskToleranceBand || profile.riskBand} willingness and ${profile.riskCapacityBand || 'Moderate'} financial capacity.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 font-mono">
              <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                Tolerance: <strong className="text-[#0B1220]">{profile.riskToleranceBand || profile.riskBand}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white border border-[#E7E5DF] text-[#5B6572]">
                Capacity: <strong className="text-[#0B1220]">{profile.riskCapacityBand || 'Moderate'}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-[#E6F4F1] border border-[#0F766E]/30 text-[#0F766E] font-bold">
                Effective: {profile.effectiveRiskBand || profile.riskBand}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* History & Compare Drawer (collapsible) */}
      <RecommendationHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        historyItems={historyItems}
        historyLoading={historyLoading}
        selectedForCompare={selectedForCompare}
        currentRecommendationId={recommendations?._id || recommendations?.id}
        comparing={comparing}
        onToggleCompareSelection={handleToggleCompareSelection}
        onRunComparison={handleRunComparison}
        onSelectHistoryItem={handleSelectHistoryItem}
        onArchive={handleArchive}
      />

      {/* AI LOADING PROGRESS SEQUENCE */}
      {loading ? (
        <RecommendationLoadingStepper
          loadingSteps={loadingSteps}
          loadingStepIndex={loadingStepIndex}
        />
      ) : recommendations ? (
        <div className="space-y-8">
          {/* AI Thesis & Reasoning Deep Dive Card */}
          {recommendations.aiReasoning && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E5DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-serif text-xl font-bold text-[#0B1220]">
                  Algorithmic Investment Thesis & Portfolio Reasoning
                </h3>
              </div>

              <p className="text-sm text-[#0B1220] font-medium leading-relaxed bg-[#FAFAF7] p-4 rounded-2xl border border-[#E7E5DF]">
                {recommendations.aiReasoning.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Key Strategic Drivers
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#5B6572]">
                    {recommendations.aiReasoning.keyDrivers?.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#0F766E] mt-0.5">•</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-500/20 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Portfolio Alignment
                  </span>
                  <p className="text-xs text-[#5B6572] leading-relaxed">
                    {recommendations.aiReasoning.portfolioAlignment}
                  </p>
                  {recommendations.holdingsSnapshot && recommendations.holdingsSnapshot.length > 0 && (
                    <p className="text-[11px] text-[#0F766E] font-medium">
                      ✓ Analyzed {recommendations.holdingsSnapshot.length} existing holding(s) to prevent overlap.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Target Asset Split Donut Card */}
          <AssetAllocationChart
            equity={recommendations.assetAllocation.equity}
            debt={recommendations.assetAllocation.debt}
            gold={recommendations.assetAllocation.gold}
            marketContextNote={recommendations.marketContextNote}
          />

          {/* 3-5 Tailored Recommendation Cards */}
          <div className="space-y-4">
            <SectionHeader
              eyebrow="HIGH CONVICTION SCHEMES"
              title="Specific Scheme Recommendations"
              subtitle="Direct plan mutual funds curated to execute your exact target asset split."
              className="mb-2"
            />

            <div className="space-y-4">
              {recommendations.recommendations.map((item) => (
                <FundRecommendationCard
                  key={item.fund.code}
                  item={item}
                  monthlySavings={profile.monthlySavings || 20000}
                />
              ))}
            </div>
          </div>

          <DisclaimerBanner
            type="warning"
            customText="Recommendations are algorithmically generated based on your stated risk capacity, horizon, and historical scheme returns. Rupee Mind is an educational platform and does not execute distributor transactions or charge advisory commissions."
          />
        </div>
      ) : null}

      {/* Comparison Modal */}
      <RecommendationComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        comparisonData={comparisonData}
      />
    </div>
  );
};

export default Recommendations;
