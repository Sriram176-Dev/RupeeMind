import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileSnapshot: {
      riskBand: String,
      riskScore: Number,
      horizonYears: Number,
      goalType: String,
      monthlySavings: Number,
    },
    assetAllocation: {
      equity: Number,
      debt: Number,
      gold: Number,
    },
    recommendations: [
      {
        rank: Number,
        schemeCode: String,
        fundCode: String,
        fundName: String,
        fundHouse: String,
        category: String,
        riskLevel: String,
        nav: Number,
        cagr3Y: Number,
        cagr5Y: Number,
        allocationPercent: Number,
        role: String,
        rationale: String,
      },
    ],
    holdingsSnapshot: [
      {
        assetType: String,
        symbol: String,
        name: String,
        currentVal: Number,
        allocationPercent: Number,
      },
    ],
    confidenceScore: {
      type: Number,
      default: 85,
    },
    aiReasoning: {
      summary: String,
      keyDrivers: [String],
      portfolioAlignment: String,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    comparedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recommendation',
      },
    ],
    marketContextNote: String,
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ userId: 1, createdAt: -1 });

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
export default Recommendation;
