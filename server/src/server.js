import http from "http";
import cron from "node-cron";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import {
  validateEnvironment,
  logEnvironmentConfig,
} from "./config/validateEnv.js";
import app from "./app.js";
import { initSocket } from "./socket.js";
import { syncMutualFunds } from "./scripts/syncFunds.js";
import { runSipRemindersJob } from "./jobs/sipRemindersJob.js";
import { runSignalAlertsJob } from "./jobs/signalAlertsJob.js";
import { startMLService, stopMLService } from "./services/mlProcessManager.js";

import { executeJob } from "./services/jobRunner.js";

const httpServer = http.createServer(app);
initSocket(httpServer);

// Scheduled background tasks — only run when ENABLE_INTERNAL_CRON is set
const enableInternalCron = process.env.ENABLE_INTERNAL_CRON === "true";

if (enableInternalCron) {
  // Nightly fund sync at 02:00 AM IST (20:30 UTC)
  cron.schedule("30 20 * * *", async () => {
    console.log(
      "[Cron] Running scheduled nightly mutual funds sync at 02:00 IST...",
    );
    await executeJob("sync-funds", () => syncMutualFunds(), { trigger: "cron", maxAttempts: 3 });
  });

  // Daily SIP reminders at 08:00 AM IST (02:30 UTC)
  cron.schedule("30 2 * * *", async () => {
    console.log("[Cron] Running daily SIP reminders job...");
    await executeJob("sip-reminders", () => runSipRemindersJob(), { trigger: "cron", maxAttempts: 2 });
  });

  // Watchlist signal alerts at 06:00 PM IST (12:30 UTC) — after market close
  cron.schedule("30 12 * * 1-5", async () => {
    console.log("[Cron] Running watchlist signal alerts job...");
    await executeJob("signal-alerts", () => runSignalAlertsJob(), { trigger: "cron", maxAttempts: 2 });
  });

  console.log("[Cron] Internal cron jobs enabled with resilient job runner.");
} else {
  console.log(
    "[Cron] Internal cron disabled (ENABLE_INTERNAL_CRON != true). Use POST /api/internal/jobs/:name with CRON_SECRET for external scheduling.",
  );
}

// Start server and connect to MongoDB
async function bootstrap() {
  // Validate environment variables
  validateEnvironment();
  logEnvironmentConfig();

  await connectDB();

  // Start ML service — gracefully degrades to rule-based signals if unavailable
  if (ENV.NODE_ENV !== "test") {
    console.log("[ML Setup] Starting ML service...");
    try {
      const mlChild = await startMLService();
      if (mlChild) {
        console.log("[ML Setup] ML service is healthy and online.");
      } else {
        console.warn("[ML Setup] ML service unavailable; running with rule-based fallback signals.");
      }
    } catch (error) {
      console.warn("[ML Setup] ML startup error:", error.message);
      console.warn("[ML Setup] Server operating with rule-based fallback signals.");
    }
  } else if (ENV.NODE_ENV === "test") {
    console.log("[ML Setup] Skipping ML service startup in test environment");
  }

  const server = httpServer.listen(ENV.PORT, () => {
    console.log(
      `[Rupee Mind Server] Running on http://localhost:${ENV.PORT} (${ENV.NODE_ENV})`,
    );
    if (ENV.NODE_ENV !== "test") {
      console.log("[ML Service] ML target at http://localhost:8000 (with automatic rule fallback)");
    }
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    stopMLService();

    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

if (process.env.NODE_ENV !== "test") {
  bootstrap();
}

export { app, httpServer };
export default app;
