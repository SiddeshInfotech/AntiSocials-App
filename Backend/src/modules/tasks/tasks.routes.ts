import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { taskCompletionRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import {
  completeTaskController,
  getTodayTasksController,
  getTaskSubtasksController,
} from "./tasks.controller";
import { completeTaskSchema, completeTaskPayloadSchema } from "./tasks.schema";

export const tasksRouter = Router();

tasksRouter.get("/today", requireAuth, getTodayTasksController);
tasksRouter.get(
  "/:id/subtasks",
  requireAuth,
  validate(completeTaskSchema),
  getTaskSubtasksController,
);
tasksRouter.post(
  "/:id/complete",
  requireAuth,
  taskCompletionRateLimit,
  validate(completeTaskPayloadSchema),
  completeTaskController,
);
