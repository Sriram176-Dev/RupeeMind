import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Wealth creation',
        'Retirement',
        'Emergency fund',
        'House purchase',
        'Child education',
        'Vacation',
        'Vehicle purchase',
        'Wedding',
        'Other',
      ],
      default: 'Wealth creation',
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1000,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    horizonYears: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 5,
    },
    targetDate: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setFullYear(d.getFullYear() + (this.horizonYears || 5));
        return d;
      },
    },
    priority: {
      type: String,
      enum: ['Critical', 'Important', 'Flexible'],
      default: 'Important',
    },
    monthlyContribution: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedReturnRate: {
      type: Number,
      default: 0.12, // 12% annual CAGR assumed default
      min: 0.01,
      max: 0.30,
    },
    recommendedAllocation: {
      equity: { type: Number, default: 60 },
      debt: { type: Number, default: 30 },
      gold: { type: Number, default: 10 },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACHIEVED', 'PAUSED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ userId: 1, createdAt: -1 });

export const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
