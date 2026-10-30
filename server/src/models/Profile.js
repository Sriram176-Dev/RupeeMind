import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    type: { type: String, default: 'Wealth creation' },
    category: { type: String, default: 'Wealth creation' },
    targetAmount: { type: Number, default: 0 },
    horizonYears: { type: Number, default: 5 },
    priority: { type: String, default: 'Important' },
    requiredMonthlySIP: { type: Number, default: 0 },
    feasible: { type: Boolean, default: true },
    recommendedAllocation: {
      equity: { type: Number, default: 50 },
      debt: { type: Number, default: 40 },
      gold: { type: Number, default: 10 },
    },
    deficitAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const scoreHistorySchema = new mongoose.Schema(
  {
    risk: { type: Number, required: true },
    financialHealth: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: { type: Number, default: null },
    occupationType: { type: String, default: null },
    occupation: { type: String, default: null }, // compatibility alias
    city: { type: String, default: null },
    monthlyIncome: { type: Number, default: null },
    monthlyExpenses: { type: Number, default: null },
    monthlyEMI: { type: Number, default: 0 },
    monthlyEMIs: { type: Number, default: 0 }, // compatibility alias
    monthlySavings: { type: Number, default: null },
    emergencyFundAmount: { type: Number, default: 0 },
    hasLifeInsurance: { type: Boolean, default: false },
    hasHealthInsurance: { type: Boolean, default: false },
    dependents: { type: Number, default: 0 },
    dependentsCount: { type: Number, default: 0 }, // compatibility alias
    experienceLevel: { type: String, default: null },
    investingHabit: { type: String, default: null },
    investingRegularity: { type: String, default: null }, // compatibility alias
    goalType: { type: String, default: null },
    targetAmount: { type: Number, default: null },
    horizonYears: { type: Number, default: null },
    goals: [goalSchema],
    goalsAssessment: { type: mongoose.Schema.Types.Mixed, default: null },
    // Dual-engine scores & constraints
    riskToleranceScore: { type: Number, default: null },
    riskToleranceBand: { type: String, default: null },
    riskCapacityScore: { type: Number, default: null },
    riskCapacityBand: { type: String, default: null },
    effectiveRiskScore: { type: Number, default: null },
    effectiveRiskBand: { type: String, default: null },
    isRiskConstrained: { type: Boolean, default: false },
    riskConstraintReason: { type: String, default: null },
    riskAnswers: { type: [Number], default: [] },
    quizScores: { type: [Number], default: [] }, // compatibility alias
    scores: {
      risk: { type: Number, default: null },
      riskBand: { type: String, default: null },
      financialHealth: { type: Number, default: null },
      financialHealthLabel: { type: String, default: null },
      updatedAt: { type: Date, default: null },
    },
    scoreHistory: [scoreHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to synchronize aliases
profileSchema.pre('save', function (next) {
  if (this.occupation && !this.occupationType) this.occupationType = this.occupation;
  if (this.occupationType && !this.occupation) this.occupation = this.occupationType;

  if (this.monthlyEMIs !== undefined && this.monthlyEMI === undefined) this.monthlyEMI = this.monthlyEMIs;
  if (this.monthlyEMI !== undefined && this.monthlyEMIs === undefined) this.monthlyEMIs = this.monthlyEMI;

  if (this.dependentsCount !== undefined && this.dependents === undefined) this.dependents = this.dependentsCount;
  if (this.dependents !== undefined && this.dependentsCount === undefined) this.dependentsCount = this.dependents;

  if (this.investingExperience && !this.experienceLevel) this.experienceLevel = this.investingExperience;
  if (this.experienceLevel && !this.investingExperience) this.investingExperience = this.experienceLevel;

  if (this.investingRegularity && !this.investingHabit) this.investingHabit = this.investingRegularity;
  if (this.investingHabit && !this.investingRegularity) this.investingRegularity = this.investingHabit;

  if (this.quizScores && (!this.riskAnswers || this.riskAnswers.length === 0)) this.riskAnswers = this.quizScores;
  if (this.riskAnswers && (!this.quizScores || this.quizScores.length === 0)) this.quizScores = this.riskAnswers;

  if (this.effectiveRiskBand) {
    if (!this.scores) this.scores = {};
    this.scores.riskBand = this.effectiveRiskBand;
    if (this.effectiveRiskScore !== undefined) this.scores.risk = this.effectiveRiskScore;
  }

  if (this.goalType && (!this.goals || this.goals.length === 0)) {
    this.goals = [{
      type: this.goalType,
      targetAmount: this.targetAmount || 0,
      horizonYears: this.horizonYears || 5,
    }];
  }

  next();
});

// Indexes for performance
// Note: userId already has index: true in schema definition, so we don't add duplicate
profileSchema.index({ 'scores.risk': 1 });
profileSchema.index({ 'scores.financialHealth': 1 });
profileSchema.index({ createdAt: -1 });

export const Profile = mongoose.model('Profile', profileSchema);
