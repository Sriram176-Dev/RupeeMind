import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'PRICE_ABOVE',
        'PRICE_BELOW',
        'PERCENT_CHANGE',
        'SIGNAL_FLIP',
        'DRIFT_THRESHOLD',
        'SIP_DUE',
      ],
      required: true,
      index: true,
    },
    targetSymbol: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },
    targetName: {
      type: String,
      default: '',
      trim: true,
    },
    targetValue: {
      type: Number,
      default: 0,
    },
    comparator: {
      type: String,
      enum: [
        'GREATER_THAN',
        'LESS_THAN',
        'PERCENT_CHANGE_ABS',
        'FLIPS_TO',
        'DRIFT_EXCEEDED',
        'IS_DUE',
      ],
      default: 'GREATER_THAN',
    },
    targetSignal: {
      type: String,
      enum: ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL', 'ANY_FLIP'],
      default: 'ANY_FLIP',
    },
    deliveryChannels: {
      type: [String],
      enum: ['IN_APP', 'EMAIL', 'PUSH'],
      default: ['IN_APP', 'EMAIL'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'TRIGGERED', 'DISABLED'],
      default: 'ACTIVE',
      index: true,
    },
    triggerCount: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    lastEvaluatedAt: {
      type: Date,
      default: null,
    },
    lastTriggerValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    cooldownMinutes: {
      type: Number,
      default: 60, // 1 hour default suppression after trigger
      min: 1,
      max: 10080, // up to 7 days
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ userId: 1, status: 1 });
alertSchema.index({ type: 1, status: 1 });

export const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
