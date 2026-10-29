import fetch from "node-fetch";
import { ENV } from "../config/env.js";

const ML_API_URL = ENV.ML_API_URL || "http://localhost:8000";
const USE_ML_MODEL = ENV.USE_ML_MODEL;

// Circuit Breaker State
const CIRCUIT = {
  state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
  failureCount: 0,
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  lastFailureTime: 0,
};

let cachedHealth = {
  isHealthy: false,
  checkedAt: 0,
  ttlMs: 15000,
};

function recordSuccess() {
  CIRCUIT.failureCount = 0;
  CIRCUIT.state = "CLOSED";
}

function recordFailure() {
  CIRCUIT.failureCount++;
  CIRCUIT.lastFailureTime = Date.now();
  if (CIRCUIT.failureCount >= CIRCUIT.failureThreshold) {
    CIRCUIT.state = "OPEN";
    console.warn(`[ML Service] Circuit breaker tripped to OPEN. Will retry after ${CIRCUIT.resetTimeoutMs}ms.`);
  }
}

function canAttemptRequest() {
  if (CIRCUIT.state === "CLOSED") return true;
  if (CIRCUIT.state === "OPEN") {
    if (Date.now() - CIRCUIT.lastFailureTime > CIRCUIT.resetTimeoutMs) {
      CIRCUIT.state = "HALF_OPEN";
      console.log("[ML Service] Circuit breaker transitioning to HALF_OPEN trial.");
      return true;
    }
    return false;
  }
  if (CIRCUIT.state === "HALF_OPEN") {
    return true;
  }
  return false;
}

/**
 * Call the Python ML API for stock prediction with circuit breaker
 * @param {Object} features - Feature object with 56 technical indicators
 * @returns {Promise<Object|null>} ML prediction result or null if unavailable
 */
export async function getMLPrediction(features) {
  if (!USE_ML_MODEL) {
    return null;
  }

  if (!canAttemptRequest()) {
    console.warn("[ML Service] Circuit breaker OPEN — fast-failing ML request.");
    return null;
  }

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(features),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    recordSuccess();
    cachedHealth.isHealthy = true;
    cachedHealth.checkedAt = Date.now();
    return result;
  } catch (error) {
    recordFailure();
    cachedHealth.isHealthy = false;
    cachedHealth.checkedAt = Date.now();
    console.warn("[ML Service] Error calling ML API:", error.message);
    return null;
  }
}

/**
 * Check if ML service is available (with short-lived cache)
 */
export async function checkMLServiceHealth(force = false) {
  if (!USE_ML_MODEL) {
    return false;
  }

  const now = Date.now();
  if (!force && now - cachedHealth.checkedAt < cachedHealth.ttlMs) {
    return cachedHealth.isHealthy;
  }

  try {
    const response = await fetch(`${ML_API_URL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    cachedHealth.isHealthy = response.ok;
    cachedHealth.checkedAt = now;
    if (response.ok && CIRCUIT.state === "OPEN") {
      recordSuccess();
    }
    return response.ok;
  } catch {
    cachedHealth.isHealthy = false;
    cachedHealth.checkedAt = now;
    return false;
  }
}

export function getCircuitStatus() {
  return { ...CIRCUIT };
}

