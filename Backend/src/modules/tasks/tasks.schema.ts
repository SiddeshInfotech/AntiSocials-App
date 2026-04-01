import { z } from "zod";

export const completeTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

// Base64 image validation schema
// Expects format: "data:image/type;base64,..."
export const photoBase64Schema = z
  .string()
  .min(100, "Photo is too small or invalid format")
  .max(10_485_760 * 1.33, "Photo exceeds 10MB limit") // Base64 inflates ~1.33x
  .regex(
    /^data:image\/(png|jpeg|gif|webp);base64,/,
    "Invalid base64 image format. Expected: data:image/type;base64,...",
  );

// Complete task with subtask and photo
export const completeTaskPayloadSchema = z.object({
  body: z.object({
    subtaskId: z.string().uuid().optional(),
    photoBase64: photoBase64Schema.optional(),
  }),
  params: z
    .object({
      id: z.string().min(1),
    })
    .optional(),
});

export type CompleteTaskPayload = z.infer<
  typeof completeTaskPayloadSchema
>["body"];
