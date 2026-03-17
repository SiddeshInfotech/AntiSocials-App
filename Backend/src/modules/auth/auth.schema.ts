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

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>["body"];
export type LoginEmailInput = z.infer<typeof loginEmailSchema>["body"];
