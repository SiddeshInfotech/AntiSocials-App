import { Router } from "express";
import { authRateLimit, otpRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import {
  loginEmailController,
  registerEmailController,
  sendOtpController,
  verifyOtpController,
} from "./auth.controller";
import {
  loginEmailSchema,
  registerEmailSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/register-email",
  authRateLimit,
  validate(registerEmailSchema),
  registerEmailController,
);
authRouter.post(
  "/login-email",
  authRateLimit,
  validate(loginEmailSchema),
  loginEmailController,
);

authRouter.post(
  "/send-otp",
  otpRateLimit,
  validate(sendOtpSchema),
  sendOtpController,
);
authRouter.post(
  "/verify-otp",
  otpRateLimit,
  validate(verifyOtpSchema),
  verifyOtpController,
);
