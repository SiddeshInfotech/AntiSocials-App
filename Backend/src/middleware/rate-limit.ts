import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const taskCompletionRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(10, Math.floor(env.RATE_LIMIT_MAX / 2)),
  message: {
    success: false,
    message: "Too many completion attempts. Slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(5, Math.floor(env.RATE_LIMIT_MAX / 4)),
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
