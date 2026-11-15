import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Sliders,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import {
  getGoalsApi,
  createGoalApi,
  updateGoalApi,
  deleteGoalApi,
  simulateGoalSkipApi,
} from '../../services/goalService';
import type { UserGoal, GoalSkipSimulationResponse } from '../../types';

export const GoalDashboard: React.FC = () => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Wealth creation');
  const [targetAmount, setTargetAmount] = useState<number>(1000000);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [priority, setPriority] = useState<'Critical' | 'Important' | 'Flexible'>('Important');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(10000);

  // Skip Simulator Modal State
  const [skipModalGoal, setSkipModalGoal] = useState<UserGoal | null>(null);
  const [skipCount, setSkipCount] = useState<number>(2);
  const [skipSimulation, setSkipSimulation] = useState<GoalSkipSimulationResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await getGoalsApi();
      setGoals(res);
    } catch (err) {
      console.error('Failed to load goals:', err);
      toast.error('Unable to fetch your financial goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoalId(null);
    setName('');
    setCategory('Wealth creation');
    setTargetAmount(1000000);
    setCurrentAmount(0);
    setHorizonYears(5);
    setPriority('Important');
    setMonthlyContribution(10000);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: UserGoal) => {
    setEditingGoalId(goal._id);
    setName(goal.name);
    setCategory(goal.category);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setHorizonYears(goal.horizonYears);
    setPriority(goal.priority);
    setMonthlyContribution(goal.monthlyContribution);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a goal name');
      return;
    }
    if (targetAmount < 1000) {
      toast.error('Target amount must be at least ₹1,000');
      return;
    }

    try {
      if (editingGoalId) {
        await updateGoalApi(editingGoalId, {
          name,
          category,
          targetAmount,
          currentAmount,
          horizonYears,
          priority,
          monthlyContribution,
        });
        toast.success('Goal updated successfully');
      } else {
        await createGoalApi({
          name,
          category,
          targetAmount,
          currentAmount,
          horizonYears,
          priority,
          monthlyContribution,
        });
        toast.success('Goal created successfully');
      }
      setIsModalOpen(false);
      loadGoals();
    } catch (err) {
      console.error('Failed to save goal:', err);
      toast.error('Failed to save goal. Please check the values.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await deleteGoalApi(id);
      toast.success('Goal deleted');
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete goal');
    }
  };

  const handleOpenSkipSimulator = async (goal: UserGoal) => {
    setSkipModalGoal(goal);
    setSkipCount(2);
    setSimulating(true);
    try {
      const res = await simulateGoalSkipApi(goal._id, 2);
      setSkipSimulation(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleRunSkipSimulation = async (count: number) => {
    if (!skipModalGoal) return;
    setSkipCount(count);
    setSimulating(true);
    try {
      const res = await simulateGoalSkipApi(skipModalGoal._id, count);
      setSkipSimulation(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const formatInr = (val: number) => {
    return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
  };

  if (loading && goals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SkeletonLoader variant="rect" height={100} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader variant="rect" height={260} />
          <SkeletonLoader variant="rect" height={260} />
          <SkeletonLoader variant="rect" height={260} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <SectionHeader
          title="Financial Goal Planning & Simulator"
          subtitle="Track milestones, project future corpus, and simulate the compound impact of skipping SIPs."
        />

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-teal-700 hover:bg-teal-800 transition shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Financial Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const p = goal.projections;
            const isOnTrack = p?.isOnTrack;

            return (
              <div
                key={goal._id}
                className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-stone-300 transition"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                        {goal.category}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-stone-900 mt-0.5">{goal.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="p-1.5 text-stone-400 hover:text-rose-700 rounded-md hover:bg-stone-100 transition cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isOnTrack ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        On Track
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Off Track (Deficit: {formatInr(p?.shortfall || 0)})
                      </span>
                    )}

                    <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                      {goal.horizonYears}Y Horizon
                    </span>
                  </div>

                  {/* Target vs Projected */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 text-xs">
                    <div>
                      <div className="text-stone-500">Target Corpus</div>
                      <div className="text-base font-serif font-bold text-stone-900">
                        {formatInr(goal.targetAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-stone-500">Projected Corpus</div>
                      <div className="text-base font-serif font-bold text-teal-800">
                        {formatInr(p?.projectedCorpus || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>Saved: {formatInr(goal.currentAmount)}</span>
                      <span>{p?.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, p?.progressPercent || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Contribution & Gap */}
                  <div className="text-xs text-stone-600 space-y-1 bg-stone-50 rounded-lg p-3 border border-stone-200">
                    <div className="flex justify-between">
                      <span>Current SIP:</span>
                      <strong className="font-mono">{formatInr(goal.monthlyContribution)}/mo</strong>
                    </div>
                    {!isOnTrack && (p?.extraSipNeeded || 0) > 0 && (
                      <div className="flex justify-between text-amber-800 font-medium">
                        <span>Extra SIP Needed:</span>
                        <strong className="font-mono">+{formatInr(p?.extraSipNeeded || 0)}/mo</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action: Skip Simulator */}
                <button
                  onClick={() => handleOpenSkipSimulator(goal)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  What If I Skip N SIPs?
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center max-w-lg mx-auto">
          <Target className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-900">No Goals Defined Yet</h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            Create your first financial milestone (Retirement, Home, Vacation, Education) to calculate the required monthly SIP and simulate future outcomes.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-700 hover:bg-teal-800 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      )}

      {/* Goal Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                {editingGoalId ? 'Edit Financial Goal' : 'Create Financial Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Retirement Corpus, Dream Apartment"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="Wealth creation">Wealth creation</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Emergency fund">Emergency fund</option>
                    <option value="House purchase">House purchase</option>
                    <option value="Child education">Child education</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Vehicle purchase">Vehicle purchase</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Important">Important</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Target Corpus (INR)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    min={1000}
                    step={10000}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Current Saved (INR)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(Number(e.target.value))}
                    min={0}
                    step={5000}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Time Horizon (Years)</label>
                  <input
                    type="number"
                    value={horizonYears}
                    onChange={(e) => setHorizonYears(Number(e.target.value))}
                    min={1}
                    max={40}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Monthly SIP (INR)</label>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    min={0}
                    step={1000}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:border-teal-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {editingGoalId ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "What If I Skip N SIPs" Simulator Modal */}
      {skipModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">SIP Impact Simulator</span>
                <h3 className="text-lg font-serif font-bold text-stone-900">{skipModalGoal.name}</h3>
              </div>
              <button
                onClick={() => setSkipModalGoal(null)}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Slider */}
            <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-700">Installments to Skip:</span>
                <span className="text-sm font-bold text-teal-800 font-mono">
                  {skipCount} Month{skipCount > 1 ? 's' : ''} (₹{formatInr(skipCount * skipModalGoal.monthlyContribution)})
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={skipCount}
                onChange={(e) => handleRunSkipSimulation(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>1 month</span>
                <span>3 months</span>
                <span>6 months</span>
                <span>12 months</span>
              </div>
            </div>

            {/* Results Grid */}
            {skipSimulation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <div className="text-xs text-rose-800 font-medium">Final Corpus Drop</div>
                    <div className="text-xl font-serif font-bold text-rose-700 mt-1">
                      -{formatInr(skipSimulation.corpusDrop)}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      Lost compounding over remaining {skipModalGoal.horizonYears} years
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="text-xs text-amber-800 font-medium">Estimated Delay</div>
                    <div className="text-xl font-serif font-bold text-amber-700 mt-1">
                      +{skipSimulation.monthsDelayed} Months
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      Additional saving time to reach target
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 text-xs text-stone-700 leading-relaxed">
                  <span className="font-semibold text-stone-900">Compound Effect Insight: </span>
                  {skipSimulation.summary}
                </div>
              </div>
            ) : simulating ? (
              <div className="py-8 text-center">
                <SkeletonLoader variant="rect" height={100} />
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSkipModalGoal(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition cursor-pointer"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDashboard;
