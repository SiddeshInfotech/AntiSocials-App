import { Request, Response } from "express";
import { AppError } from "../../middleware/error-handler";
import { getStreak } from "../streak/streak.service";
import { completeTask, getTodayTasks } from "./tasks.service";

export async function getTodayTasksController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const [tasks, streak] = await Promise.all([
    getTodayTasks(req.userId),
    getStreak(req.userId),
  ]);

  const progress = streak
    ? {
      currentLevel: streak.currentLevel,
      currentLevelTaskPoints: streak.currentLevelTaskPoints,
      currentLevelPoolTarget: streak.currentLevelPoolTarget,
      currentLevelPoolEarned: streak.currentLevelPoolEarned,
      completedTasksInCurrentLevel: streak.completedTasksInCurrentLevel,
    }
    : null;

  res.status(200).json({
    success: true,
    message: "Today's tasks",
    data: tasks,
    progress,
  });
}

export async function completeTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const result = await completeTask(req.userId, String(req.params.id));

  res.status(200).json({
    success: true,
    message: "Task completed",
    data: result,
  });
}
