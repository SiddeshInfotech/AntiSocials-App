import { z } from "zod";
import { ACTIVITY_CATEGORY_OPTIONS } from "../../constants/activities";

export const coverImageBase64Schema = z
  .string()
  .min(100, "Cover image is too small or invalid format")
  .max(10_485_760 * 1.33, "Cover image exceeds 10MB limit")
  .regex(
    /^data:image\/(png|jpeg|gif|webp);base64,/,
    "Invalid base64 image format. Expected: data:image/type;base64,...",
  );

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const timeSchema = z
  .string()
  .regex(
    /^(([01]\d|2[0-3]):([0-5]\d))|((0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm))$/,
    "Time must be in HH:mm or h:mm AM/PM format",
  );

export const createActivitySchema = z.object({
  body: z
    .object({
      title: z.string().min(3, "Title is required").max(120),
      description: z.string().max(1000).optional(),
      category: z.enum(ACTIVITY_CATEGORY_OPTIONS),
      customCategory: z.string().trim().min(2).max(80).optional(),
      date: dateSchema.optional(),
      time: timeSchema.optional(),
      location: z.string().trim().min(2, "Location is required").max(200),
      maxMembers: z.number().int().min(1).max(10_000).optional(),
      coverImageBase64: coverImageBase64Schema.optional(),
    })
    .superRefine((value, ctx) => {
      const hasDate = Boolean(value.date);
      const hasTime = Boolean(value.time);

      if (hasDate !== hasTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Both date and time are required together",
          path: hasDate ? ["time"] : ["date"],
        });
      }

      if (value.category === "OTHER" && !value.customCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customCategory is required when category is OTHER",
          path: ["customCategory"],
        });
      }

      if (value.category !== "OTHER" && value.customCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "customCategory can only be sent when category is OTHER",
          path: ["customCategory"],
        });
      }
    }),
});

export type CreateActivityPayload = z.infer<
  typeof createActivitySchema
>["body"];
