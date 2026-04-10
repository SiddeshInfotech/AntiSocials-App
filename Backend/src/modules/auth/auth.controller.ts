import { Request, Response } from "express";
import { AppError } from "../../middleware/error-handler";
import {
  completeSignupAfterAuth,
  loginWithEmail,
  logoutCurrentSession,
  registerWithEmail,
  sendOtpForPhoneLogin,
  verifyPhoneOtpAndLogin,
} from "./auth.service";

export async function registerEmailController(
  req: Request,
  res: Response,
): Promise<void> {
  const { email, password, timezone } = req.body;
  const result = await registerWithEmail({ email, password, timezone });

  res.status(201).json({
    success: true,
    message: "Email registration successful",
    data: result,
  });
}

export async function loginEmailController(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await loginWithEmail(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
}

export async function sendOtpController(
  req: Request,
  res: Response,
): Promise<void> {
  const { phone } = req.body;
  const result = await sendOtpForPhoneLogin({ phone });

  res.status(200).json({
    success: true,
    message: "OTP sent successfully on WhatsApp",
    data: result,
  });
}

export async function verifyOtpController(
  req: Request,
  res: Response,
): Promise<void> {
  const { phone, otp } = req.body;
  const result = await verifyPhoneOtpAndLogin({ phone, otp });

  res.status(200).json({
    success: true,
    message: "Phone login successful",
    data: result,
  });
}

export async function completeSignupController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const result = await completeSignupAfterAuth(req.userId, req.body);

  res.status(200).json({
    success: true,
    message: "Signup completed successfully",
    data: result,
  });
}

export async function logoutController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId || !req.tokenJti || !req.tokenExp) {
    throw new AppError("Unauthorized", 401);
  }

  await logoutCurrentSession({
    userId: req.userId,
    tokenJti: req.tokenJti,
    tokenExp: req.tokenExp,
  });

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}
