import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Umbrella,
  PiggyBank,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import {
  getInsuranceEmergencyAuditApi,
  updateInsuranceSettingsApi,
} from '../../services/healthCheckService';
import type { InsuranceEmergencyAuditResponse } from '../../types';

export const HealthCheckPage: React.FC = () => {
  const [audit, setAudit] = useState<InsuranceEmergencyAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Drawer/Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [emergencyFundAmount, setEmergencyFundAmount] = useState<number>(0);
  const [emergencyFundMonthsTarget, setEmergencyFundMonthsTarget] = useState<number>(6);
  const [hasLifeInsurance, setHasLifeInsurance] = useState<boolean>(false);
  const [termInsuranceCover, setTermInsuranceCover] = useState<number>(0);
  const [hasHealthInsurance, setHasHealthInsurance] = useState<boolean>(false);
  const [healthInsuranceCover, setHealthInsuranceCover] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const res = await getInsuranceEmergencyAuditApi();
      setAudit(res);
      setEmergencyFundAmount(res.emergencyFund.actualAmount);
      setEmergencyFundMonthsTarget(res.emergencyFund.targetMonths);
      setHasLifeInsurance(res.termInsurance.hasInsurance);
      setTermInsuranceCover(res.termInsurance.actualCover);
      setHasHealthInsurance(res.healthInsurance.hasInsurance);
      setHealthInsuranceCover(res.healthInsurance.actualCover);
    } catch (err) {
      console.error('Failed to load insurance audit:', err);
      toast.error('Unable to evaluate insurance and emergency health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateInsuranceSettingsApi({
        emergencyFundAmount,
        emergencyFundMonthsTarget,
        hasLifeInsurance,
        termInsuranceCover,
        hasHealthInsurance,
        healthInsuranceCover,
      });
      setAudit(updated);
      setIsEditOpen(false);
      toast.success('Insurance and emergency profile updated.');
    } catch (err) {
      console.error('Failed to update:', err);
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const formatInr = (val: number) => {
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  if (loading && !audit) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonLoader variant="rect" height={100} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonLoader variant="rect" height={220} />
          <SkeletonLoader variant="rect" height={220} />
          <SkeletonLoader variant="rect" height={220} />
        </div>
      </div>
    );
  }

  const em = audit?.emergencyFund;
  const term = audit?.termInsurance;
  const health = audit?.healthInsurance;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back to Portfolio Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <SectionHeader
          title="Financial Defense & Insurance Health Check"
          subtitle="Audit your emergency liquidity, pure term life cover, and health insurance adequacy."
        />

        <button
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          Update Policies & Buffer
        </button>
      </div>

      {/* Composite Defense Meter */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase text-stone-500 tracking-wider">
            Composite Defense Score
          </div>
          <h3 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            {audit?.compositeScore}/100
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-sans font-medium ${
                (audit?.compositeScore || 0) >= 80
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : (audit?.compositeScore || 0) >= 50
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {(audit?.compositeScore || 0) >= 80
                ? 'Fortified Defense'
                : (audit?.compositeScore || 0) >= 50
                ? 'Moderate Vulnerability'
                : 'High Risk Shortfall'}
            </span>
          </h3>
          <p className="text-xs text-stone-600 max-w-xl">
            A secure investment plan requires a strong foundation: liquid reserves for disruptions, term insurance to protect dependents, and health cover against medical inflation.
          </p>
        </div>

        <div className="w-full md:w-64 space-y-2 shrink-0">
          <div className="flex justify-between text-xs font-mono text-stone-600">
            <span>Preparedness Level</span>
            <span>{audit?.compositeScore}%</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                (audit?.compositeScore || 0) >= 80
                  ? 'bg-emerald-600'
                  : (audit?.compositeScore || 0) >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${audit?.compositeScore || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Pillar Cards: Emergency Fund, Term Insurance, Health Insurance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: Emergency Fund */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <PiggyBank className="w-5 h-5 text-teal-700" />
                Emergency Reserve
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  em?.isAdequate
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {em?.actualMonths} / {em?.targetMonths} Months
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-stone-500">Current Reserve:</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(em?.actualAmount || 0)}
                </div>
              </div>
              <div>
                <span className="text-stone-500">Target ({em?.targetMonths} Mo):</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(em?.recommendedAmount || 0)}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
              {em?.reason}
            </p>
          </div>

          {!em?.isAdequate && (em?.shortfall || 0) > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-900 border border-amber-200">
              Shortfall: <strong>{formatInr(em?.shortfall || 0)}</strong>
            </div>
          )}
        </div>

        {/* Pillar 2: Term Life Insurance */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <Umbrella className="w-5 h-5 text-teal-700" />
                Term Life Cover
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  term?.isAdequate
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {term?.isAdequate ? 'Sufficient Cover' : 'Shortfall Detected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-stone-500">Current Cover:</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(term?.actualCover || 0)}
                </div>
              </div>
              <div>
                <span className="text-stone-500">12x Target:</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(term?.recommendedCover || 0)}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
              {term?.reason}
            </p>
          </div>

          {!term?.isAdequate && (term?.shortfall || 0) > 0 && (
            <div className="bg-rose-50 rounded-lg p-3 text-xs text-rose-900 border border-rose-200">
              Coverage Gap: <strong>{formatInr(term?.shortfall || 0)}</strong>
            </div>
          )}
        </div>

        {/* Pillar 3: Health Insurance */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <HeartPulse className="w-5 h-5 text-teal-700" />
                Health Insurance
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  health?.isAdequate
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {health?.isAdequate ? 'Comprehensive' : 'Inadequate Cover'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-stone-500">Current Sum Insured:</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(health?.actualCover || 0)}
                </div>
              </div>
              <div>
                <span className="text-stone-500">Recommended:</span>
                <div className="font-serif font-bold text-base text-stone-900">
                  {formatInr(health?.recommendedCover || 0)}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
              {health?.reason}
            </p>
          </div>

          {!health?.isAdequate && (health?.shortfall || 0) > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-900 border border-amber-200">
              Shortfall: <strong>{formatInr(health?.shortfall || 0)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-stone-700">
          Prioritized Action Checklist
        </h4>

        {audit?.actionItems && audit.actionItems.length > 0 ? (
          <div className="divide-y divide-stone-200">
            {audit.actionItems.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                    item.priority === 'HIGH'
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {item.priority} PRIORITY
                </span>

                <div className="space-y-1">
                  <div className="font-semibold text-stone-900 text-sm">{item.title}</div>
                  <p className="text-xs text-stone-600">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-stone-500">
            All insurance and emergency fund benchmarks are satisfied. Your defense is robust.
          </div>
        )}
      </div>

      {/* Edit Drawer/Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Update Insurance & Buffer Details
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Emergency Fund Amount (INR)
                </label>
                <input
                  type="number"
                  value={emergencyFundAmount}
                  onChange={(e) => setEmergencyFundAmount(Number(e.target.value))}
                  min={0}
                  step={10000}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Emergency Fund Target (Months of Expenses)
                </label>
                <input
                  type="number"
                  value={emergencyFundMonthsTarget}
                  onChange={(e) => setEmergencyFundMonthsTarget(Number(e.target.value))}
                  min={1}
                  max={24}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-800">Has Pure Term Life Insurance?</span>
                  <input
                    type="checkbox"
                    checked={hasLifeInsurance}
                    onChange={(e) => setHasLifeInsurance(e.target.checked)}
                    className="w-4 h-4 accent-teal-700 cursor-pointer"
                  />
                </div>

                {hasLifeInsurance && (
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Term Life Sum Assured (INR)
                    </label>
                    <input
                      type="number"
                      value={termInsuranceCover}
                      onChange={(e) => setTermInsuranceCover(Number(e.target.value))}
                      min={0}
                      step={500000}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-800">Has Health Insurance Policy?</span>
                  <input
                    type="checkbox"
                    checked={hasHealthInsurance}
                    onChange={(e) => setHasHealthInsurance(e.target.checked)}
                    className="w-4 h-4 accent-teal-700 cursor-pointer"
                  />
                </div>

                {hasHealthInsurance && (
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Health Insurance Sum Insured (INR)
                    </label>
                    <input
                      type="number"
                      value={healthInsuranceCover}
                      onChange={(e) => setHealthInsuranceCover(Number(e.target.value))}
                      min={0}
                      step={100000}
                      className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCheckPage;
