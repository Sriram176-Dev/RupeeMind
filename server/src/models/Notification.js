import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['price_alert', 'signal_alert', 'sip_reminder', 'portfolio', 'system', 'welcome', 'milestone'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'success', 'critical'],
      default: 'info',
    },
    // Optional metadata for linking to a specific page/stock
    meta: {
      symbol: String,
      route: String,
      changePercent: Number,
      oldSignal: String,
      newSignal: String,
      price: Number,
      targetPrice: Number,
      score: Number,
      source: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Unique per-user dedup key to prevent duplicate notifications
    dedupeKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying: unread first, newest first
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Unique sparse index for dedup: one notification per user per dedupeKey
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, sparse: true });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
