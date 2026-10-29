import mongoose from 'mongoose';

const fundSchema = new mongoose.Schema(
  {
    schemeCode: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fundHouse: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    rawCategory: String,
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderately Low', 'Moderate', 'Moderately High', 'Very High'],
      default: 'Very High',
    },
    nav: {
      type: Number,
      required: true,
    },
    navDate: {
      type: String,
      required: true,
    },
    cagr1Y: {
      type: Number,
      default: null,
    },
    cagr3Y: {
      type: Number,
      default: null,
    },
    cagr5Y: {
      type: Number,
      default: null,
    },
    volatility: {
      type: Number,
      default: null,
    },
    maxDrawdown: {
      type: Number,
      default: null,
    },
    sharpeRatio: {
      type: Number,
      default: null,
    },
    // Expense Ratio and AUM have no free source in AMFI/mfapi -> null
    expenseRatio: {
      type: Number,
      default: null,
    },
    aum: {
      type: Number,
      default: null,
    },
    // Recent NAV history for charts (e.g. past 1 year, sampled)
    navHistory: [
      {
        date: String,
        nav: Number,
      },
    ],
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Search index
fundSchema.index({ name: 'text', fundHouse: 'text', category: 'text' });
fundSchema.index({ category: 1, cagr3Y: -1 });
fundSchema.index({ code: 1 });
fundSchema.index({ fundHouse: 1 });

export const Fund = mongoose.model('Fund', fundSchema);
export default Fund;
