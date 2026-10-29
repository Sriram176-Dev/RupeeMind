import mongoose from 'mongoose';

const paperWalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    cashBalance: {
      type: Number,
      required: true,
      default: 1000000, // ₹10,00,000 initial virtual capital
      min: 0,
    },
    initialCapital: {
      type: Number,
      required: true,
      default: 1000000,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    winningTrades: {
      type: Number,
      default: 0,
    },
    losingTrades: {
      type: Number,
      default: 0,
    },
    resetCount: {
      type: Number,
      default: 0,
    },
    lastResetAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const PaperWallet = mongoose.model('PaperWallet', paperWalletSchema);
