import dotenv from "dotenv";
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// Production safety validations
if (isProduction) {
  if (!process.env.CLIENT_URL) {
    throw new Error(
      "[FATAL] CLIENT_URL environment variable is required in production mode.",
    );
  }
  if (
    !process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_ACCESS_SECRET.length < 32
  ) {
    throw new Error(
      "[FATAL] JWT_ACCESS_SECRET must be at least 32 characters in production mode.",
    );
  }
  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET.length < 32
  ) {
    throw new Error(
      "[FATAL] JWT_REFRESH_SECRET must be at least 32 characters in production mode.",
    );
  }
}

function parseTrustProxy() {
  const val = process.env.TRUST_PROXY;
  if (val === undefined || val === "") {
    return isProduction ? 1 : false;
  }
  if (val === "true") return true;
  if (val === "false") return false;
  const num = Number(val);
  return isNaN(num) ? val : num;
}

function getMongoUri() {
  if (NODE_ENV === "test") {
    if (process.env.TEST_MONGODB_URI) return process.env.TEST_MONGODB_URI;
    const base =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rupeemind";
    if (!base.endsWith("_test") && !base.includes("test")) {
      return base.replace(/\/([^/?]+)(\?.*)?$/, "/$1_test$2");
    }
    return base;
  }
  return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rupeemind";
}

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  MONGODB_URI: getMongoUri(),
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "dev_access_fallback_secret_32chars_min",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "dev_refresh_fallback_secret_32chars_min",
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  TRUST_PROXY: parseTrustProxy(),
  USE_ML_MODEL: NODE_ENV !== "test",
  ML_API_URL: process.env.ML_API_URL || "http://localhost:8000",
};
