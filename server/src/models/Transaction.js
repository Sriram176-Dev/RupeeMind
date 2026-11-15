import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    holdingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Holding',
      default: null,
      index: true,
    },
    folio: {
      type: String,
      default: '',
      trim: true,
    },
    schemeName: {
      type: String,
      required: true,
      trim: true,
    },
    schemeCode: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['PURCHASE', 'SIP', 'REDEMPTION', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND_REINVESTMENT'],
      required: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    units: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ['CAS_CAMS', 'CAS_KFINTECH', 'BROKER_CSV', 'MANUAL'],
      default: 'MANUAL',
    },
    unmatched: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, schemeCode: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
