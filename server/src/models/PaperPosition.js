import mongoose from 'mongoose';

const paperPositionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    yahooSymbol: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    averageBuyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productType: {
      type: String,
      enum: ['DELIVERY', 'INTRADAY'],
      default: 'DELIVERY',
    },
  },
  {
    timestamps: true,
  }
);

// Unique position per user, symbol and productType
paperPositionSchema.index({ userId: 1, symbol: 1, productType: 1 }, { unique: true });

export const PaperPosition = mongoose.model('PaperPosition', paperPositionSchema);
