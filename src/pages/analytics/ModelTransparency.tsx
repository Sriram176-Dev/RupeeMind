import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { getModelTransparencyReportApi } from '../../services/modelTransparencyService';
import type { ModelTransparencyReport } from '../../types';

export const ModelTransparency: React.FC = () => {
  const [report, setReport] = useState<ModelTransparencyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getModelTransparencyReportApi();
      setReport(res);
    } catch (err: any) {
      toast.error('Failed to load model transparency report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const overall = report?.overallMetrics;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <SectionHeader
          title="Signal Model Transparency & Walk-Forward Audit"
          subtitle="Full disclosure on quantitative ML signal models: zero price-level leakage, scale-free features, walk-forward validation folds, and majority baseline comparisons."
        />
        <div className="mt-3">
          <DisclaimerBanner
            type="info"
            customText="In compliance with transparent quantitative governance, RupeeMind evaluates models against temporal walk-forward splits. If a machine-learning model fails to statistically surpass majority class baseline, rule-based heuristics remain default."
          />
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : report ? (
        <>
          {/* Baseline Beat Banner */}
          <div
            className={`p-5 rounded-3xl border ${
              overall?.beatsBaseline
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900'
                : 'bg-amber-500/5 border-amber-500/20 text-amber-900'
            } flex items-start gap-4`}
          >
            {overall?.beatsBaseline ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-base font-semibold">
                {overall?.beatsBaseline
                  ? 'Active Model Passes Walk-Forward Baseline Gate'
                  : 'Model Below Majority Baseline — Rule-Based Default Active'}
              </h3>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                {overall?.beatsBaseline
                  ? `The scale-free regularized logistic model achieved ${(
                      (overall.accuracy || 0) * 100
                    ).toFixed(2)}% out-of-sample accuracy across ${report.nSplits} temporal folds, surpassing the majority class baseline of ${(
                      (overall.majorityClassBaseline || 0) * 100
                    ).toFixed(2)}%.`
                  : 'Because this model did not beat the historical majority baseline out-of-sample, RupeeMind keeps rule-based technical signals as the default execution mechanism.'}
              </p>
            </div>
          </div>

          {/* Model Specification Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Model Architecture
              </span>
              <p className="text-sm font-semibold text-stone-900 mt-1 line-clamp-2">
                {report.modelType}
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Model Footprint
              </span>
              <p className="text-lg font-mono font-bold text-teal-700 mt-1">
                {report.modelSizeMb} MB
              </p>
              <span className="text-[11px] text-stone-500 font-sans">
                Target: &lt; 20 MB (Lightweight)
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Validated Bars
              </span>
              <p className="text-lg font-mono font-bold text-stone-900 mt-1">
                {report.totalValidatedBars.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-stone-500 font-sans">
                {report.nSplits} Walk-Forward Folds
              </span>
            </div>

            <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Features Extracted
              </span>
              <p className="text-lg font-mono font-bold text-stone-900 mt-1">
                {report.featureCount} Features
              </p>
              <span className="text-[11px] text-stone-500 font-sans">
                100% Scale-Free Normalized
              </span>
            </div>
          </div>

          {/* Scale-Free Feature Registry */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Scale-Free Feature Space (No Price-Level Leakage)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              All raw price levels are converted to stationarized, unit-less ratios to prevent lookahead and regime distortion.
            </p>
            <div className="flex flex-wrap gap-2">
              {report.featuresList.map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-xl text-xs font-mono font-medium text-stone-800"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Temporal Walk-Forward Folds Table */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-stone-900 mb-2">
              Out-of-Sample Walk-Forward Validation Metrics
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Testing on strict forward time blocks with expanding historical training sets to guarantee zero future leakage.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Fold</th>
                    <th className="py-2.5 px-3">Train Bars</th>
                    <th className="py-2.5 px-3">Test Bars</th>
                    <th className="py-2.5 px-3">Fold Accuracy</th>
                    <th className="py-2.5 px-3">Majority Baseline</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">F1 Score</th>
                    <th className="py-2.5 px-3">Strategy Return</th>
                    <th className="py-2.5 px-3">B&H Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {report.folds.map((fold) => {
                    const beat = fold.accuracy >= fold.majorityBaselineAccuracy;
                    return (
                      <tr key={fold.fold} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          Fold {fold.fold}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{fold.trainBars}</td>
                        <td className="py-2.5 px-3 text-stone-600">{fold.testBars}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              beat
                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {(fold.accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-500">
                          {(fold.majorityBaselineAccuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {(fold.precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {(fold.f1 * 100).toFixed(1)}%
                        </td>
                        <td
                          className={`py-2.5 px-3 font-semibold ${
                            fold.strategyReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {(fold.strategyReturn * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-stone-500">
                          {(fold.buyAndHoldReturn * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodological Transparency Notes */}
          {report.transparencyNotes && (
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-stone-600" />
                Methodological Safeguards & Data Integrity Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-600 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">
                    Lookahead Bias Prevention
                  </span>
                  <p>{report.transparencyNotes.lookaheadBiasPrevention}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">
                    Scale-Free Normalization
                  </span>
                  <p>{report.transparencyNotes.scaleFreeNormalization}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">
                    Walk-Forward Temporal Split
                  </span>
                  <p>{report.transparencyNotes.walkForwardTemporalSplit}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-800 block mb-1">
                    Rule-Based Fallback Policy
                  </span>
                  <p>{report.transparencyNotes.fallbackRulePolicy}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ModelTransparency;
