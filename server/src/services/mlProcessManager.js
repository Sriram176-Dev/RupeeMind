import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { ENV } from "../config/env.js";
import { checkMLServiceHealth } from "./mlService.js";

const execFileAsync = promisify(execFile);
const mlDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../rupeemind-ml",
);
const virtualEnvPython =
  process.platform === "win32"
    ? join(mlDirectory, ".venv", "Scripts", "python.exe")
    : join(mlDirectory, ".venv", "bin", "python");
const pythonCommand = existsSync(virtualEnvPython)
  ? virtualEnvPython
  : process.platform === "win32"
    ? "python"
    : "python3";

let mlProcess = null;
let mlAvailable = false;

/**
 * Check if uvicorn is available
 */
async function checkUvicorn() {
  try {
    const { stdout } = await execFileAsync(
      pythonCommand,
      ["-m", "uvicorn", "--version"],
      {
        cwd: mlDirectory,
      },
    );
    console.log(`[ML Service] Found ${stdout.trim()} using ${pythonCommand}`);
    return true;
  } catch {
    return false;
  }
}

let restartTimeout = null;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 5;

/**
 * Start the Python ML service as a child process
 * Gracefully degrades if unavailable
 */
export async function startMLService() {
  if (!ENV.USE_ML_MODEL) {
    console.log("[ML Service] ML model disabled via USE_ML_MODEL config.");
    mlAvailable = false;
    return null;
  }

  if (mlProcess) {
    console.log("[ML Service] Already running");
    return mlProcess;
  }

  console.log("[ML Service] Checking dependencies...");

  // Check if uvicorn is available
  const uvicornAvailable = await checkUvicorn();
  if (!uvicornAvailable) {
    console.warn(
      "[ML Service] Uvicorn is not installed in the ML Python environment.\n" +
        "Running in graceful fallback mode using rule-based signals."
    );
    mlAvailable = false;
    return null;
  }

  console.log("[ML Service] Starting Python ML API server...");

  try {
    const args = [
      "-m",
      "uvicorn",
      "src.api.app:app",
      "--host",
      "0.0.0.0",
      "--port",
      "8000",
    ];
    console.log(
      `[ML Service] Starting with: ${pythonCommand} ${args.join(" ")}`,
    );

    const child = spawn(pythonCommand, args, {
      cwd: mlDirectory,
      stdio: "pipe",
    });
    mlProcess = child;
    let processError = null;

    child.stdout.on("data", (data) => {
      console.log(`[ML Service] ${data.toString().trim()}`);
    });

    child.stderr.on("data", (data) => {
      const errorMsg = data.toString().trim();
      console.warn(`[ML Service Output] ${errorMsg}`);
    });

    child.on("close", (code) => {
      console.warn(`[ML Service] Process exited with code ${code}`);
      if (mlProcess === child) mlProcess = null;
      mlAvailable = false;

      // Auto-restart with backoff if it stopped unexpectedly
      if (code !== 0 && code !== null && restartAttempts < MAX_RESTART_ATTEMPTS) {
        restartAttempts++;
        const delay = Math.min(1000 * Math.pow(2, restartAttempts), 30000);
        console.log(`[ML Service] Scheduling auto-restart attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS} in ${delay}ms...`);
        clearTimeout(restartTimeout);
        restartTimeout = setTimeout(() => {
          startMLService().catch((err) => {
            console.warn("[ML Service] Auto-restart attempt failed:", err.message);
          });
        }, delay);
      }
    });

    child.on("error", (error) => {
      console.warn("[ML Service] Failed to spawn:", error.message);
      processError = error;
    });

    // Check health with a reasonable deadline (15s)
    const readyDeadline = Date.now() + 15000;
    while (Date.now() < readyDeadline) {
      if (processError) {
        console.warn(`[ML Service] Startup error: ${processError.message}. Continuing with rule-based fallback.`);
        mlAvailable = false;
        return null;
      }
      if (child.exitCode !== null || child.signalCode !== null) {
        console.warn(`[ML Service] Process exited early (code ${child.exitCode}). Continuing with rule-based fallback.`);
        mlAvailable = false;
        return null;
      }
      if (await checkMLServiceHealth(true)) {
        mlAvailable = true;
        restartAttempts = 0;
        console.log("[ML Service] Healthy (PID: " + child.pid + ")");
        return child;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.warn("[ML Service] ML service did not become healthy within 15 seconds. Continuing in fallback mode.");
    mlAvailable = false;
    return null;
  } catch (error) {
    console.warn("[ML Service] Could not start ML service:", error.message, "- continuing with rule-based fallback.");
    mlAvailable = false;
    if (mlProcess) {
      mlProcess.kill();
      mlProcess = null;
    }
    return null;
  }
}

/**
 * Stop the Python ML service
 */
export function stopMLService() {
  if (mlProcess) {
    console.log("[ML Service] Stopping...");
    mlProcess.kill("SIGTERM");
    mlProcess = null;
    mlAvailable = false;
    console.log("[ML Service] Stopped");
  }
}

/**
 * Check if ML service is running
 */
export function isMLServiceRunning() {
  return mlProcess !== null && mlAvailable;
}

/**
 * Check if ML is available (required)
 */
export function isMLAvailable() {
  return mlAvailable;
}

/**
 * Get ML process info
 */
export function getMLProcessInfo() {
  if (!mlProcess) {
    return { running: false, pid: null, available: mlAvailable };
  }
  return { running: true, pid: mlProcess.pid, available: mlAvailable };
}
