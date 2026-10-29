/**
 * Generic job runner with retry logic, execution logging, and failure handling.
 * Wraps any async job function with:
 *   - Configurable retries with exponential backoff
 *   - Persistent execution logs (JobLog model)
 *   - Concurrency locking (one instance per job)
 *   - Structured console logging
 */
import { JobLog } from '../models/JobLog.js';

const runningJobs = new Set();

/**
 * Execute a job function with retry and logging.
 *
 * @param {string} jobName - Unique name for the job (e.g. 'signal-alerts')
 * @param {Function} jobFn - Async function to execute
 * @param {Object} options
 * @param {number} options.maxAttempts - Max retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Base delay for exponential backoff (default: 2000)
 * @param {string} options.trigger - How job was triggered: 'cron' | 'manual' | 'startup'
 * @returns {Promise<Object>} - Execution result
 */
export async function executeJob(jobName, jobFn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 2000,
    trigger = 'cron',
  } = options;

  // Concurrency guard
  if (runningJobs.has(jobName)) {
    console.warn(`[JobRunner] Job "${jobName}" is already running — skipping.`);
    return { skipped: true, reason: 'already_running' };
  }

  runningJobs.add(jobName);
  const startTime = Date.now();
  let lastError = null;
  let attempt = 0;
  let logEntry = null;

  try {
    // Create initial log entry
    logEntry = await JobLog.create({
      jobName,
      status: 'running',
      trigger,
      startedAt: new Date(startTime),
      maxAttempts,
    });
  } catch (err) {
    console.warn(`[JobRunner] Failed to create job log for "${jobName}":`, err.message);
  }

  try {
    while (attempt < maxAttempts) {
      attempt++;

      try {
        console.log(`[JobRunner] "${jobName}" attempt ${attempt}/${maxAttempts} (trigger: ${trigger})...`);

        const result = await jobFn();
        const durationMs = Date.now() - startTime;

        console.log(`[JobRunner] "${jobName}" completed in ${durationMs}ms on attempt ${attempt}.`);

        // Update log entry
        if (logEntry) {
          try {
            await JobLog.findByIdAndUpdate(logEntry._id, {
              status: 'completed',
              completedAt: new Date(),
              durationMs,
              attempt,
              result: result || {},
              error: null,
            });
          } catch (err) {
            console.warn(`[JobRunner] Failed to update job log:`, err.message);
          }
        }

        return { success: true, jobName, attempt, durationMs, result: result || {} };
      } catch (err) {
        lastError = err;
        console.error(`[JobRunner] "${jobName}" attempt ${attempt} failed:`, err.message);

        // Update log as retrying
        if (logEntry && attempt < maxAttempts) {
          try {
            await JobLog.findByIdAndUpdate(logEntry._id, {
              status: 'retrying',
              attempt,
              error: err.message,
            });
          } catch (updateErr) {
            console.warn(`[JobRunner] Failed to update job log:`, updateErr.message);
          }
        }

        // Exponential backoff before retry
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          console.log(`[JobRunner] Retrying "${jobName}" in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts exhausted
    const durationMs = Date.now() - startTime;
    console.error(`[JobRunner] "${jobName}" FAILED after ${maxAttempts} attempts (${durationMs}ms). Last error: ${lastError?.message}`);

    if (logEntry) {
      try {
        await JobLog.findByIdAndUpdate(logEntry._id, {
          status: 'failed',
          completedAt: new Date(),
          durationMs,
          attempt: maxAttempts,
          error: lastError?.message || 'Unknown error',
          errorStack: lastError?.stack?.slice(0, 2000) || null,
        });
      } catch (err) {
        console.warn(`[JobRunner] Failed to update job log:`, err.message);
      }
    }

    return { success: false, jobName, attempts: maxAttempts, durationMs, error: lastError?.message };
  } finally {
    runningJobs.delete(jobName);
  }
}

/**
 * Get recent job execution logs.
 * @param {Object} options
 * @param {string} options.jobName - Filter by job name (optional)
 * @param {number} options.limit - Max results (default: 50)
 * @returns {Promise<Array>}
 */
export async function getJobLogs({ jobName, limit = 50 } = {}) {
  const filter = {};
  if (jobName) filter.jobName = jobName;

  return JobLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get summary status of all known jobs.
 * @returns {Promise<Object>}
 */
export async function getJobStatus() {
  const jobNames = await JobLog.distinct('jobName');
  const statusMap = {};

  for (const name of jobNames) {
    const lastRun = await JobLog.findOne({ jobName: name })
      .sort({ createdAt: -1 })
      .lean();

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRuns = await JobLog.countDocuments({
      jobName: name,
      createdAt: { $gte: last24h },
    });
    const recentFailures = await JobLog.countDocuments({
      jobName: name,
      status: 'failed',
      createdAt: { $gte: last24h },
    });

    statusMap[name] = {
      isRunning: runningJobs.has(name),
      lastRun: lastRun ? {
        status: lastRun.status,
        startedAt: lastRun.startedAt,
        completedAt: lastRun.completedAt,
        durationMs: lastRun.durationMs,
        trigger: lastRun.trigger,
        attempt: lastRun.attempt,
      } : null,
      last24h: {
        totalRuns: recentRuns,
        failures: recentFailures,
      },
    };
  }

  return statusMap;
}

/**
 * Check if a job is currently running.
 */
export function isJobRunning(jobName) {
  return runningJobs.has(jobName);
}

/**
 * Clear the running lock for a job (used on cleanup / restart).
 */
export function clearJobLock(jobName) {
  runningJobs.delete(jobName);
}
