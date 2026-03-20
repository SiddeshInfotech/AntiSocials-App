import { z } from "zod";

export const registerEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    timezone: z.string().optional(),
  }),
});

export const loginEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, "Phone number must be in E.164 format"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, "Phone number must be in E.164 format"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6 digit code"),
  }),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>["body"];
export type LoginEmailInput = z.infer<typeof loginEmailSchema>["body"];
export type SendOtpInput = z.infer<typeof sendOtpSchema>["body"];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
