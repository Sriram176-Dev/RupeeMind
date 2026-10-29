import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Recommendation } from '../src/models/Recommendation.js';
import {
  getRecommendationHistory,
  getRecommendationById,
  compareRecommendations,
  archiveRecommendation,
} from '../src/services/recommendationService.js';

describe('Recommendation History & Comparison Service', () => {
  const testUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Recommendation.deleteMany({ userId: testUserId });
  });

  it('retrieves recommendation history with pagination and status filtering', async () => {
    // Seed 3 recommendations
    await Recommendation.create([
      {
        userId: testUserId,
        profileSnapshot: { riskBand: 'Moderate', riskScore: 50 },
        assetAllocation: { equity: 60, debt: 30, gold: 10 },
        recommendations: [
          {
            rank: 1,
            fundName: 'Parag Parikh Flexi Cap Fund',
            schemeCode: '122639',
            allocationPercent: 60,
            role: 'Core Wealth Builder',
          },
        ],
        status: 'active',
      },
      {
        userId: testUserId,
        profileSnapshot: { riskBand: 'Aggressive', riskScore: 75 },
        assetAllocation: { equity: 80, debt: 15, gold: 5 },
        recommendations: [
          {
            rank: 1,
            fundName: 'Quant Mid Cap Fund',
            schemeCode: '120503',
            allocationPercent: 80,
            role: 'Growth Accelerator',
          },
        ],
        status: 'active',
      },
      {
        userId: testUserId,
        profileSnapshot: { riskBand: 'Conservative', riskScore: 30 },
        assetAllocation: { equity: 30, debt: 60, gold: 10 },
        recommendations: [
          {
            rank: 1,
            fundName: 'HDFC Short Term Debt Fund',
            schemeCode: '118989',
            allocationPercent: 60,
            role: 'Stability & Hedge',
          },
        ],
        status: 'archived',
      },
    ]);

    const activeHistory = await getRecommendationHistory(testUserId, { status: 'active', limit: 10 });
    expect(activeHistory.items.length).toBe(2);
    expect(activeHistory.pagination.total).toBe(2);

    const allHistory = await getRecommendationHistory(testUserId, { limit: 10 });
    expect(allHistory.items.length).toBe(3);
    expect(allHistory.pagination.total).toBe(3);
  });

  it('compares two recommendations and computes diffs', async () => {
    const doc1 = await Recommendation.create({
      userId: testUserId,
      profileSnapshot: { riskBand: 'Moderate', riskScore: 50 },
      assetAllocation: { equity: 60, debt: 30, gold: 10 },
      confidenceScore: 85,
      recommendations: [
        {
          rank: 1,
          fundName: 'Parag Parikh Flexi Cap Fund',
          schemeCode: '122639',
          allocationPercent: 60,
          cagr3Y: 18.5,
          role: 'Core Wealth Builder',
        },
      ],
      status: 'active',
    });

    const doc2 = await Recommendation.create({
      userId: testUserId,
      profileSnapshot: { riskBand: 'Aggressive', riskScore: 80 },
      assetAllocation: { equity: 80, debt: 10, gold: 10 },
      confidenceScore: 92,
      recommendations: [
        {
          rank: 1,
          fundName: 'Parag Parikh Flexi Cap Fund',
          schemeCode: '122639',
          allocationPercent: 50,
          cagr3Y: 18.5,
          role: 'Core Wealth Builder',
        },
        {
          rank: 2,
          fundName: 'Quant Small Cap Fund',
          schemeCode: '120828',
          allocationPercent: 30,
          cagr3Y: 28.0,
          role: 'Growth Accelerator',
        },
      ],
      status: 'active',
    });

    const comparison = await compareRecommendations(testUserId, doc1._id, doc2._id);
    expect(comparison).toBeDefined();
    expect(comparison.comparisonSummary.commonFundsCount).toBe(1);
    expect(comparison.comparisonSummary.equityAllocationDiff).toBe(20); // 80 - 60
    expect(comparison.comparisonSummary.debtAllocationDiff).toBe(-20); // 10 - 30
    expect(comparison.comparisonSummary.confidenceDiff).toBe(7); // 92 - 85
    expect(comparison.rec1.riskBand).toBe('Moderate');
    expect(comparison.rec2.riskBand).toBe('Aggressive');
  });

  it('archives a recommendation successfully', async () => {
    const doc = await Recommendation.create({
      userId: testUserId,
      profileSnapshot: { riskBand: 'Moderate', riskScore: 50 },
      assetAllocation: { equity: 60, debt: 30, gold: 10 },
      recommendations: [],
      status: 'active',
    });

    const archived = await archiveRecommendation(testUserId, doc._id);
    expect(archived.status).toBe('archived');

    const fetched = await getRecommendationById(testUserId, doc._id);
    expect(fetched.status).toBe('archived');
  });
});
