import { ENV } from "./env.js";

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing or invalid
 */
export function validateEnvironment() {
  // Skip validation in test environment
  if (ENV.NODE_ENV === "test") {
    console.log("[Config] Skipping environment validation in test mode");
    return;
  }

  const errors = [];

  // Required variables
  const required = {
    PORT: ENV.PORT,
    MONGODB_URI: ENV.MONGODB_URI,
    JWT_ACCESS_SECRET: ENV.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: ENV.JWT_REFRESH_SECRET,
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      errors.push(`${key} is required`);
    }
  }

  // Validate JWT secrets are at least 32 characters
  if (ENV.JWT_ACCESS_SECRET && ENV.JWT_ACCESS_SECRET.length < 32) {
    errors.push("JWT_ACCESS_SECRET must be at least 32 characters");
  }

  if (ENV.JWT_REFRESH_SECRET && ENV.JWT_REFRESH_SECRET.length < 32) {
    errors.push("JWT_REFRESH_SECRET must be at least 32 characters");
  }

  // Validate PORT is a number
  if (ENV.PORT && isNaN(ENV.PORT)) {
    errors.push("PORT must be a valid number");
  }

  // Validate CLIENT_URL
  if (ENV.CLIENT_URL && !ENV.CLIENT_URL.startsWith("http")) {
    errors.push(
      "CLIENT_URL must be a valid URL starting with http:// or https://",
    );
  }

  // Validate MONGODB_URI format
  if (ENV.MONGODB_URI && !ENV.MONGODB_URI.startsWith("mongodb")) {
    errors.push("MONGODB_URI must be a valid MongoDB connection string");
  }

  if (!ENV.USE_ML_MODEL) {
    errors.push("ML service is required outside the test environment.");
  }
  if (!ENV.ML_API_URL) {
    errors.push("ML_API_URL is required");
  } else if (!ENV.ML_API_URL.startsWith("http")) {
    errors.push("ML_API_URL must be a valid URL");
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  console.log("[Config] Environment variables validated successfully");
}

/**
 * Log environment configuration (without secrets)
 */
export function logEnvironmentConfig() {
  if (ENV.NODE_ENV === "test") {
    return; // Skip logging in test mode
  }

  console.log("[Config] Environment Configuration:");
  console.log(`  NODE_ENV: ${ENV.NODE_ENV}`);
  console.log(`  PORT: ${ENV.PORT}`);
  console.log(`  CLIENT_URL: ${ENV.CLIENT_URL}`);
  console.log(`  MONGODB_URI: ${ENV.MONGODB_URI.replace(/\/\/.*@/, "//***@")}`);
  console.log(`  TRUST_PROXY: ${ENV.TRUST_PROXY}`);
  console.log(`  USE_ML_MODEL: ${ENV.USE_ML_MODEL} (REQUIRED)`);
  if (ENV.USE_ML_MODEL) {
    console.log(`  ML_API_URL: ${ENV.ML_API_URL}`);
  }
}
