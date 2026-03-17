import { z } from "zod";

export const completeTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
