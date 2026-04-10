import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRateLimit, otpRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import {
  completeSignupController,
  loginEmailController,
  logoutController,
  registerEmailController,
  sendOtpController,
  verifyOtpController,
} from "./auth.controller";
import {
  completeSignupSchema,
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

authRouter.post(
  "/complete-signup",
  requireAuth,
  authRateLimit,
  validate(completeSignupSchema),
  completeSignupController,
);

authRouter.post("/logout", requireAuth, logoutController);
