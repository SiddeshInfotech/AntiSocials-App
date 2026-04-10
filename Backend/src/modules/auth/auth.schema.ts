import { z } from "zod";

const profilePhotoSchema = z
  .string()
  .url("Profile photo must be a valid URL")
  .or(
    z
      .string()
      .min(100, "Profile photo is too small or invalid format")
      .max(10_485_760 * 1.33, "Profile photo exceeds 10MB limit")
      .regex(
        /^data:image\/(png|jpeg|gif|webp);base64,/,
        "Invalid base64 image format. Expected: data:image/type;base64,...",
      ),
  );

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

export const completeSignupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    username: z
      .string()
      .min(1, "Username is required")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscores, and dots",
      ),
    profession: z.string().min(1, "Profession is required"),
    about: z.string().optional(),
    profilePhoto: profilePhotoSchema.optional(),
    timezone: z.string().optional(),
  }),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>["body"];
export type LoginEmailInput = z.infer<typeof loginEmailSchema>["body"];
export type SendOtpInput = z.infer<typeof sendOtpSchema>["body"];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
export type CompleteSignupInput = z.infer<typeof completeSignupSchema>["body"];
