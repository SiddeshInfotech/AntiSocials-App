import { z } from "zod";

const profilePhotoBase64Schema = z
  .string()
  .min(100, "Profile photo is too small or invalid format")
  .max(10_485_760 * 1.33, "Profile photo exceeds 10MB limit")
  .regex(
    /^data:image\/(png|jpeg|gif|webp);base64,/,
    "Invalid base64 image format. Expected: data:image/type;base64,...",
  );

export const updateProfileSchema = z.object({
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
    profilePhoto: z
      .string()
      .url("Profile photo must be a valid URL")
      .optional(),
    interests: z
      .array(z.string())
      .min(3, "Please select at least 3 interests")
      .default([]),
  }),
});

export const patchProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name cannot be empty").optional(),
      username: z
        .string()
        .min(1, "Username cannot be empty")
        .regex(
          /^[a-zA-Z0-9_.]+$/,
          "Username can only contain letters, numbers, underscores, and dots",
        )
        .optional(),
      profession: z.string().min(1, "Profession cannot be empty").optional(),
      about: z.string().optional(),
      profilePhoto: profilePhotoBase64Schema.optional(),
      isPrivate: z.boolean().optional(),
      emailNotificationsEnabled: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field is required to update profile",
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
export type PatchProfileInput = z.infer<typeof patchProfileSchema>["body"];
