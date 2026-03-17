import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { taskCompletionRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import {
  completeTaskController,
  getTodayTasksController,
} from "./tasks.controller";
import { completeTaskSchema } from "./tasks.schema";

export const tasksRouter = Router();

tasksRouter.get("/today", requireAuth, getTodayTasksController);
tasksRouter.post(
  "/:id/complete",
  requireAuth,
  taskCompletionRateLimit,
  validate(completeTaskSchema),
  completeTaskController,
);
