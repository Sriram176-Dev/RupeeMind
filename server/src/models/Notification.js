import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['PRICE', 'SIGNAL', 'DRIFT', 'SIP', 'SYSTEM'],
      default: 'SYSTEM',
      index: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'],
      default: 'INFO',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      inApp: {
        sent: { type: Boolean, default: true },
        sentAt: { type: Date, default: Date.now },
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date, default: null },
        error: { type: String, default: null },
        skipped: { type: Boolean, default: false },
      },
      push: {
        // Web Push Notification support marker
        // TODO: Register service-worker VAPID credentials and Web Push endpoint delivery
        status: { type: String, default: 'TODO' },
        note: { type: String, default: 'Web push client subscription pending' },
      },
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
