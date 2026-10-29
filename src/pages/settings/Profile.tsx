import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { formatINR, formatCompactINR } from '../../lib/utils';
import {
  User as UserIcon,
  Shield,
  Sparkles,
  RefreshCw,
  History,
  CheckCircle2,
  Edit3,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const { user, saveUserProfile } = useAuth();
  const navigate = useNavigate();

  const profile = user?.profile;
  const [isEditing, setIsEditing] = useState(false);

  const [income, setIncome] = useState(profile?.monthlyIncome || 0);
  const [expenses, setExpenses] = useState(profile?.monthlyExpenses || 0);
  const [emis, setEmis] = useState(profile?.monthlyEMIs || 0);
  const [emergency, setEmergency] = useState(profile?.emergencyFundAmount || 0);
  const [investingRegularity, setInvestingRegularity] = useState<'Regularly' | 'Occasionally' | 'Not yet'>(
    profile?.investingRegularity || (profile as any)?.investingHabit || 'Occasionally'
  );

  const scoreHistory = profile?.scoreHistory || (profile?.calculatedAt ? [{
    date: new Date(profile.calculatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    risk: profile.riskScore || 50,
    financialHealth: profile.financialHealthScore || 50,
    reason: 'Initial Assessment',
  }] : []);

  const handleSaveQuickEdit = async () => {
    if (!profile) return;
    const updated = {
      ...profile,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlyEMIs: emis,
      emergencyFundAmount: emergency,
      investingRegularity,
      investingHabit: investingRegularity,
      monthlySavings: Math.max(0, income - expenses - emis),
    };
    await saveUserProfile(updated);
    setIsEditing(false);
    toast.success('Financial profile parameters updated');
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <SectionHeader
            eyebrow="INVESTOR TELEMETRY"
            title="My Profile & Risk Posture"
            subtitle="View your computed risk scores, cash flow surplus parameters, and score revision trajectory."
            className="mb-0"
          />
        </div>

        <button
          onClick={() => navigate('/onboarding')}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#0B5F58] dark:bg-emerald-600 transition-all flex items-center gap-2 self-start md:self-auto min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retake Full 5-Step Quiz</span>
        </button>
      </div>

      {/* Top Dual Score Gauges Card or Incomplete CTA */}
      {!profile || profile.riskScore == null ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            No Investment Scores Assessed Yet
          </h2>
          <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-md mx-auto leading-relaxed">
            Complete the 5-step risk and cash flow evaluation to calculate your personalized risk tolerance score and financial health index.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Start Onboarding Evaluation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-emerald-400">
                Risk Tolerance Band
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                {profile.riskBand || 'Assessed'}
              </h2>
              <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-[220px]">
                Calibrated for <strong>{profile.horizonYears || 5}-year</strong> compounding.
              </p>
            </div>
            <ScoreGauge score={profile.riskScore} size={130} label={profile.riskBand || 'Assessed'} type="risk" />
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Financial Health Rating
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
                {profile.financialHealthBand || 'Assessed'}
              </h2>
              <p className="text-xs text-[#5B6572] dark:text-[#8A97A6] max-w-[220px]">
                {profile.monthlyIncome && profile.monthlySavings
                  ? `Savings rate: ${(((profile.monthlySavings / profile.monthlyIncome) * 100)).toFixed(0)}%`
                  : 'Calibrated from your monthly cash flow surplus.'}
              </p>
            </div>
            <ScoreGauge score={profile.financialHealthScore ?? 50} size={130} label={profile.financialHealthBand || 'Assessed'} type="health" />
          </div>
        </div>
      )}

      {/* Cash Flow Parameters Summary & Quick Edit */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E5DF] dark:border-[#1F2933] pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
              Monthly Cash Flow & Liquidity Parameters
            </h3>
            <p className="text-xs text-[#5B6572] dark:text-[#8A97A6]">Your baseline financial numbers used to calculate savings rate and emergency buffers.</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E7E5DF] dark:border-[#1F2933] text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] hover:bg-black/5 flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Numbers'}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-150">
            <CurrencyInput label="Monthly Take-Home Income" value={income} onChange={setIncome} min={10000} max={500000} step={5000} />
            <CurrencyInput label="Monthly Expenses" value={expenses} onChange={setExpenses} min={5000} max={300000} step={2500} />
            <CurrencyInput label="Monthly EMIs" value={emis} onChange={setEmis} min={0} max={200000} step={2500} />
            <CurrencyInput label="Emergency Cash Buffer" value={emergency} onChange={setEmergency} min={0} max={2000000} step={25000} />
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#0B1220] dark:text-[#E8EDF2] mb-1.5">
                How regularly do you invest?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Regularly', 'Occasionally', 'Not yet'] as const).map((habit) => (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => setInvestingRegularity(habit)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                      investingRegularity === habit
                        ? 'bg-[#E6F4F1] dark:bg-emerald-950/60 border-[#0F766E] dark:border-emerald-500 text-[#0F766E] dark:text-emerald-300 font-bold shadow-xs'
                        : 'border-[#E7E5DF] dark:border-[#1F2933] text-[#0B1220] dark:text-[#E8EDF2]'
                    }`}
                  >
                    {habit}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E7E5DF]">Cancel</button>
              <button onClick={handleSaveQuickEdit} className="px-6 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white">Save & Recompute Scores</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
              <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Monthly Income</span>
              <p className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">{formatINR(profile?.monthlyIncome || 145000)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
              <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Living Expenses</span>
              <p className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">{formatINR(profile?.monthlyExpenses || 55000)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
              <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Loan EMIs</span>
              <p className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">{formatINR(profile?.monthlyEMIs || 18000)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933]">
              <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Emergency Fund</span>
              <p className="font-serif text-xl font-bold text-[#0F766E] dark:text-emerald-400 mt-0.5">{formatINR(profile?.emergencyFundAmount || 400000)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF7] dark:bg-[#0B0F14] border border-[#E7E5DF] dark:border-[#1F2933] col-span-2 md:col-span-1">
              <span className="text-[10px] text-[#5B6572] uppercase font-semibold">Investing Habit</span>
              <p className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2] mt-0.5">{profile?.investingRegularity || (profile as any)?.investingHabit || 'Occasionally'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Score Revision History Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121821] border border-[#E7E5DF] dark:border-[#1F2933] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#0F766E] dark:text-emerald-400" />
          <h3 className="font-serif text-xl font-bold text-[#0B1220] dark:text-[#E8EDF2]">
            Score Change & Assessment History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF7] dark:bg-[#0B0F14] text-[#5B6572] dark:text-[#8A97A6]">
              <tr>
                <th className="py-3 px-4 font-semibold">Assessment Date</th>
                <th className="py-3 px-4 font-semibold text-center">Risk Score</th>
                <th className="py-3 px-4 font-semibold text-center">Health Score</th>
                <th className="py-3 px-4 font-semibold">Trigger Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5DF] dark:divide-[#1F2933]">
              {scoreHistory.length > 0 ? (
                scoreHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-3 px-4 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5B6572]" />
                      <span>{h.date}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#0F766E] dark:text-emerald-400 tabular-nums">
                      {h.risk} / 100
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {h.financialHealth} / 100
                    </td>
                    <td className="py-3 px-4 text-[#5B6572] dark:text-[#8A97A6]">
                      {h.reason || 'Evaluation'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#5B6572] dark:text-[#8A97A6]">
                    No prior score history. Complete the 5-step evaluation to record your first assessment score.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
