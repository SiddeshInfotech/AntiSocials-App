import { DevicePlatform } from "@prisma/client";
import { z } from "zod";

export const registerDeviceSchema = z.object({
  body: z.object({
    token: z.string().min(16),
    platform: z.nativeEnum(DevicePlatform),
  }),
});

export const unregisterDeviceSchema = z.object({
  body: z.object({
    token: z.string().min(16),
  }),
});
