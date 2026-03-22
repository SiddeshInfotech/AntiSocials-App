import { z } from "zod";

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
    profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
    interests: z.array(z.string()).min(3, "Please select at least 3 interests").default([]),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
