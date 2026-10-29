import mongoose from 'mongoose';

/**
 * Persistent log of background job executions.
 * Tracks run time, status, retries, errors, and result summaries.
 */
const jobLogSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'retrying'],
      default: 'running',
    },
    trigger: {
      type: String,
      enum: ['cron', 'manual', 'startup'],
      default: 'cron',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    errorStack: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete logs older than 30 days
jobLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });
jobLogSchema.index({ jobName: 1, createdAt: -1 });
jobLogSchema.index({ status: 1 });

export const JobLog = mongoose.model('JobLog', jobLogSchema);
export default JobLog;
