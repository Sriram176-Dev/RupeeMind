import mongoose from 'mongoose';

const paperOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionType: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    orderType: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      default: 'MARKET',
    },
    productType: {
      type: String,
      enum: ['DELIVERY', 'INTRADAY'],
      default: 'DELIVERY',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    requestedPrice: {
      type: Number,
      default: null,
    },
    executedPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['EXECUTED', 'PENDING', 'CANCELLED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    charges: {
      brokerage: { type: Number, default: 0 },
      stt: { type: Number, default: 0 },
      exchangeTurnover: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      stampDuty: { type: Number, default: 0 },
      totalCharges: { type: Number, default: 0 },
    },
    realizedPnL: {
      type: Number,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    executedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paperOrderSchema.index({ userId: 1, createdAt: -1 });

export const PaperOrder = mongoose.model('PaperOrder', paperOrderSchema);
