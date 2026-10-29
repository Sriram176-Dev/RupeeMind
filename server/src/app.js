import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ENV } from "./config/env.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders, requestId } from "./middleware/security.js";
import apiRouter from "./routes/index.js";
import internalRoutes from "./routes/internalRoutes.js";
import { mongoSanitize } from "./middleware/mongoSanitize.js";

const app = express();

app.set("trust proxy", ENV.TRUST_PROXY);
app.use(helmet());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(mongoSanitize);
app.use(cookieParser());
app.use(securityHeaders);
app.use(requestId);
app.use("/api", apiRateLimiter);
app.use("/api", apiRouter);
app.use("/api/internal", internalRoutes);
app.use(errorHandler);

export { app };
export default app;
