/**
 * Internal Job Routes
 * POST /api/internal/jobs/:name   — Trigger background job manually
 * GET  /api/internal/jobs/status  — Get health/status of all background jobs
 * GET  /api/internal/jobs/logs    — Get execution history logs
 * Protected by timing-safe CRON_SECRET comparison.
 */
import { Router } from "express";
import crypto from "crypto";
import { runSignalHistoryJob } from "../jobs/signalHistoryJob.js";
import { runSyncFundsJob } from "../jobs/syncFundsJob.js";
import { executeJob, getJobStatus, getJobLogs } from "../services/jobRunner.js";

const router = Router();

const JOB_MAP = {
  "signal-history": runSignalHistoryJob,
  "sync-funds": runSyncFundsJob,
  "funds-sync": runSyncFundsJob,
};

/**
 * Timing-safe comparison for CRON_SECRET
 */
function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(
      "[InternalJobs] CRON_SECRET not set — all job invocations denied.",
    );
    return false;
  }

  const provided = req.headers["x-cron-secret"] || "";
  if (!provided || provided.length !== secret.length) {
    const padded = provided.padEnd(secret.length, "\0");
    crypto.timingSafeEqual(Buffer.from(padded), Buffer.from(secret));
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}

// Status endpoint
router.get("/jobs/status", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const status = await getJobStatus();
    return res.json({
      success: true,
      jobs: status,
      availableJobs: Object.keys(JOB_MAP),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Logs endpoint
router.get("/jobs/logs", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const { jobName, limit = 50 } = req.query;
    const logs = await getJobLogs({ jobName, limit: parseInt(limit, 10) });
    return res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger endpoint
router.post("/jobs/:name", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { name } = req.params;
  const jobFn = JOB_MAP[name];

  if (!jobFn) {
    return res.status(404).json({
      success: false,
      message: `Unknown job: ${name}`,
      available: Object.keys(JOB_MAP),
    });
  }

  try {
    const execution = await executeJob(name, jobFn, {
      trigger: "manual",
      maxAttempts: 2,
    });

    if (execution.skipped) {
      return res.status(409).json({
        success: false,
        message: `Job "${name}" is already running.`,
      });
    }

    if (!execution.success) {
      return res.status(500).json({
        success: false,
        job: name,
        error: execution.error,
        durationMs: execution.durationMs,
      });
    }

    return res.status(200).json({
      success: true,
      job: name,
      durationMs: execution.durationMs,
      result: execution.result,
    });
  } catch (err) {
    console.error(
      `[InternalJobs] Unexpected error for "${name}":`,
      err.message,
    );
    return res.status(500).json({
      success: false,
      job: name,
      error: err.message,
    });
  }
});

export default router;
