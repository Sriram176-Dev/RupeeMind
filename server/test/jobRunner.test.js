import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeJob, isJobRunning, clearJobLock } from '../src/services/jobRunner.js';

describe('JobRunner Service', () => {
  beforeEach(() => {
    clearJobLock('test-job');
    clearJobLock('retry-job');
    clearJobLock('failing-job');
  });

  it('successfully executes a job on the first attempt', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      return { processed: 5 };
    };

    const res = await executeJob('test-job', task, {
      maxAttempts: 2,
      baseDelayMs: 10,
      trigger: 'manual',
    });

    expect(res.success).toBe(true);
    expect(res.attempt).toBe(1);
    expect(res.result).toEqual({ processed: 5 });
    expect(callCount).toBe(1);
    expect(isJobRunning('test-job')).toBe(false);
  });

  it('retries up to maxAttempts on failure and succeeds if a later attempt passes', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error('Temporary glitch');
      }
      return { recovered: true };
    };

    const res = await executeJob('retry-job', task, {
      maxAttempts: 3,
      baseDelayMs: 20,
      trigger: 'manual',
    });

    expect(res.success).toBe(true);
    expect(res.attempt).toBe(2);
    expect(res.result).toEqual({ recovered: true });
    expect(callCount).toBe(2);
    expect(isJobRunning('retry-job')).toBe(false);
  });

  it('exhausts all attempts and records failure if task never succeeds', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      throw new Error('Persistent database timeout');
    };

    const res = await executeJob('failing-job', task, {
      maxAttempts: 2,
      baseDelayMs: 10,
      trigger: 'cron',
    });

    expect(res.success).toBe(false);
    expect(res.attempts).toBe(2);
    expect(res.error).toBe('Persistent database timeout');
    expect(callCount).toBe(2);
    expect(isJobRunning('failing-job')).toBe(false);
  });

  it('prevents concurrent execution of the same job', async () => {
    let resolveFirst;
    const blocker = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const longRunningTask = async () => {
      await blocker;
      return { done: true };
    };

    // Start first job in background
    const firstPromise = executeJob('concurrent-job', longRunningTask, { maxAttempts: 1 });

    // Give it a brief tick to register into runningJobs
    await new Promise((r) => setTimeout(r, 10));

    // Try starting identical job simultaneously
    const secondRes = await executeJob('concurrent-job', async () => ({ second: true }), {
      maxAttempts: 1,
    });

    expect(secondRes.skipped).toBe(true);
    expect(secondRes.reason).toBe('already_running');

    // Finish first
    resolveFirst();
    await firstPromise;

    expect(isJobRunning('concurrent-job')).toBe(false);
  });
});
