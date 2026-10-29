import { ENV } from '../config/env.js';
import { isMLAvailable, getMLProcessInfo } from '../services/mlProcessManager.js';
import mongoose from 'mongoose';

// Skip ML check in test environment
const shouldCheckML = ENV.NODE_ENV !== 'test';

/**
 * Comprehensive health check endpoint
 */
export async function getHealth(req, res) {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Rupee Mind API',
    version: '1.0.0',
    environment: ENV.NODE_ENV,
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'unknown',
        responseTime: 0,
      },
      mlService: {
        status: 'unknown',
        running: false,
        pid: null,
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        rss: process.memoryUsage().rss / 1024 / 1024,
      },
    },
  };

  // Check database connection
  const dbStart = Date.now();
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      healthCheck.checks.database.status = 'healthy';
      healthCheck.checks.database.responseTime = Date.now() - dbStart;
    } else {
      healthCheck.checks.database.status = 'disconnected';
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.database.status = 'unhealthy';
    healthCheck.checks.database.responseTime = Date.now() - dbStart;
    healthCheck.status = 'degraded';
  }

  // Check ML service (optional with graceful fallback)
  if (shouldCheckML) {
    const mlInfo = getMLProcessInfo();
    healthCheck.checks.mlService.running = mlInfo.running;
    healthCheck.checks.mlService.pid = mlInfo.pid;
    healthCheck.checks.mlService.status = mlInfo.available ? 'healthy' : 'degraded';

    if (ENV.USE_ML_MODEL && !mlInfo.available) {
      if (healthCheck.status !== 'unhealthy') {
        healthCheck.status = 'degraded';
      }
    }
  } else {
    healthCheck.checks.mlService.status = 'skipped';
    healthCheck.checks.mlService.running = false;
  }

  // Overall status
  if (healthCheck.checks.database.status === 'unhealthy' || healthCheck.checks.database.status === 'disconnected') {
    healthCheck.status = 'unhealthy';
  }

  // 200 for 'ok' and 'degraded' (functional with fallback), 503 only when core DB is down
  const statusCode = healthCheck.status === 'unhealthy' ? 503 : 200;

  return res.status(statusCode).json(healthCheck);
}

/**
 * Simple health check (for load balancers)
 */
export async function getSimpleHealth(req, res) {
  const dbHealthy = mongoose.connection.readyState === 1;
  const mlHealthy = shouldCheckML ? isMLAvailable() : true;

  // DB is critical, ML is resilient with fallback
  const statusCode = dbHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: dbHealthy ? (mlHealthy ? 'ok' : 'degraded') : 'error',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'ok' : 'error',
    mlService: shouldCheckML ? (mlHealthy ? 'ok' : 'degraded') : 'skipped',
  });
}
