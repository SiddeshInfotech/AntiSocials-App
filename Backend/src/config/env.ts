import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DEFAULT_TIMEZONE: z.string().default("UTC"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(10),
  WHATSAPP_API_BASE_URL: z.string().url().default("https://icpaas.in"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_AUTH_TOKEN: z.string().min(1),
  WHATSAPP_TEMPLATE_NAME: z.string().min(1).default("otpverification"),
  WHATSAPP_TEMPLATE_LANG: z.string().min(1).default("en"),
  WHATSAPP_INCLUDE_BUTTON_COMPONENT: z.coerce.boolean().default(true),
  WHATSAPP_TEMPLATE_BUTTON_VALUE: z.string().optional(),
  WHATSAPP_BIZ_OPAQUE_CALLBACK_DATA: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment configuration",
    parsedEnv.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsedEnv.data;
