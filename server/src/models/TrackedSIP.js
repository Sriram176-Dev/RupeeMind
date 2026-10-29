import mongoose from 'mongoose';

const trackedSIPSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fundCode: {
      type: String,
      required: true,
      trim: true,
    },
    fundName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
    },
    frequency: {
      type: String,
      enum: ['Monthly', 'Weekly', 'Quarterly'],
      default: 'Monthly',
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    nextDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

trackedSIPSchema.index({ userId: 1, createdAt: -1 });

export const TrackedSIP = mongoose.model('TrackedSIP', trackedSIPSchema);
export default TrackedSIP;
