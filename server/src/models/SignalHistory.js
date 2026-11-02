import mongoose from "mongoose";

/**
 * Tracks the last-known signal for each symbol per user.
 * Updated by the signalHistoryJob when a user's tracked stock signal changes.
 */
const signalHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    previousSignal: {
      type: String,
      enum: ["BUY", "SELL", "HOLD"],
      default: "HOLD",
    },
    currentSignal: {
      type: String,
      enum: ["BUY", "SELL", "HOLD"],
      default: "HOLD",
    },
    previousScore: {
      type: Number,
      default: 0,
    },
    currentScore: {
      type: Number,
      default: 0,
    },
    mlUsed: {
      type: Boolean,
      default: false,
    },
    mlConfidence: {
      type: Number,
      default: null,
    },
    flippedAt: {
      type: Date,
      default: null,
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// One record per user+symbol
signalHistorySchema.index({ userId: 1, symbol: 1 }, { unique: true });
signalHistorySchema.index({ checkedAt: -1 });

export const SignalHistory = mongoose.model(
  "SignalHistory",
  signalHistorySchema,
);
export default SignalHistory;
