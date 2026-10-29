import { z } from 'zod';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { calculateRiskScore, calculateFinancialHealthScore } from '../services/scoreService.js';

export const updateProfileSchema = z.object({
  age: z.number().min(18).max(100).optional(),
  occupation: z.string().optional(),
  occupationType: z.string().optional(),
  city: z.string().optional(),
  monthlyIncome: z.number().min(0).optional(),
  monthlyExpenses: z.number().min(0).optional(),
  monthlyEMIs: z.number().min(0).optional(),
  monthlyEMI: z.number().min(0).optional(),
  monthlySavings: z.number().min(0).optional(),
  emergencyFundAmount: z.number().min(0).optional(),
  hasLifeInsurance: z.boolean().optional(),
  hasHealthInsurance: z.boolean().optional(),
  dependentsCount: z.number().min(0).optional(),
  dependents: z.number().min(0).optional(),
  investingExperience: z.string().optional(),
  experienceLevel: z.string().optional(),
  investingHabit: z.string().optional(),
  investingRegularity: z.string().optional(),
  goalType: z.string().optional(),
  targetAmount: z.number().min(0).optional(),
  horizonYears: z.number().min(0).optional(),
  goals: z.array(z.object({
    type: z.string(),
    targetAmount: z.number(),
    horizonYears: z.number(),
  })).optional(),
  quizScores: z.array(z.number()).optional(),
  riskAnswers: z.array(z.number()).optional(),
});

export async function getProfile(req, res, next) {
  try {
    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await Profile.create({ userId: req.user.id });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = req.body;

    // Calculate scores on server
    const risk = calculateRiskScore(data);
    const health = calculateFinancialHealthScore(data);

    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new Profile({ userId: req.user.id });
    }

    // Update profile fields
    if (data.age !== undefined) profile.age = data.age;
    if (data.occupation || data.occupationType) {
      profile.occupation = data.occupation || data.occupationType;
      profile.occupationType = data.occupationType || data.occupation;
    }
    if (data.city !== undefined) profile.city = data.city;
    if (data.monthlyIncome !== undefined) profile.monthlyIncome = data.monthlyIncome;
    if (data.monthlyExpenses !== undefined) profile.monthlyExpenses = data.monthlyExpenses;
    if (data.monthlyEMIs !== undefined || data.monthlyEMI !== undefined) {
      const val = data.monthlyEMIs ?? data.monthlyEMI;
      profile.monthlyEMIs = val;
      profile.monthlyEMI = val;
    }
    if (data.monthlySavings !== undefined) profile.monthlySavings = data.monthlySavings;
    if (data.emergencyFundAmount !== undefined) profile.emergencyFundAmount = data.emergencyFundAmount;
    if (data.hasLifeInsurance !== undefined) profile.hasLifeInsurance = data.hasLifeInsurance;
    if (data.hasHealthInsurance !== undefined) profile.hasHealthInsurance = data.hasHealthInsurance;
    if (data.dependentsCount !== undefined || data.dependents !== undefined) {
      const val = data.dependentsCount ?? data.dependents;
      profile.dependentsCount = val;
      profile.dependents = val;
    }
    if (data.investingExperience || data.experienceLevel) {
      profile.investingExperience = data.investingExperience || data.experienceLevel;
      profile.experienceLevel = data.experienceLevel || data.investingExperience;
    }
    if (data.investingHabit !== undefined || data.investingRegularity !== undefined) {
      const h = data.investingHabit || data.investingRegularity;
      profile.investingHabit = h;
      profile.investingRegularity = h;
    }
    if (data.goalType !== undefined) profile.goalType = data.goalType;
    if (data.targetAmount !== undefined) profile.targetAmount = data.targetAmount;
    if (data.horizonYears !== undefined) profile.horizonYears = data.horizonYears;
    if (data.goals !== undefined) profile.goals = data.goals;
    if (data.quizScores || data.riskAnswers) {
      const answers = data.quizScores || data.riskAnswers;
      profile.quizScores = answers;
      profile.riskAnswers = answers;
    }

    // Set computed scores
    profile.scores = {
      risk: risk.score,
      riskBand: risk.band,
      financialHealth: health.score,
      financialHealthLabel: health.band,
      updatedAt: new Date(),
    };

    // Append to scoreHistory (capped at 50 most recent)
    profile.scoreHistory.push({
      risk: risk.score,
      financialHealth: health.score,
      date: new Date(),
    });
    if (profile.scoreHistory.length > 50) {
      profile.scoreHistory = profile.scoreHistory.slice(-50);
    }

    await profile.save();

    // Mark user's onboarding as done
    await User.findByIdAndUpdate(req.user.id, { onboardingDone: true });

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}
