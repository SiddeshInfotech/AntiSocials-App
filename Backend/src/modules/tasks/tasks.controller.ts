import { Request, Response } from "express";
import { AppError } from "../../middleware/error-handler";
import { getStreak } from "../streak/streak.service";
import { completeTask, getTodayTasks } from "./tasks.service";
import { prisma } from "../../lib/prisma";
import { CompleteTaskPayload } from "./tasks.schema";

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

export async function getTaskSubtasksController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { id } = req.params;
  const taskId = Array.isArray(id) ? id[0] : id;

  const subtasks = await prisma.subtask.findMany({
    where: {
      taskId,
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
    },
  });

  if (subtasks.length === 0) {
    res.status(200).json({
      success: true,
      message: "No subtasks available for this task",
      data: [],
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Task subtasks retrieved",
    data: subtasks,
  });
}

export async function completeTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const payload: CompleteTaskPayload = {
    subtaskId: req.body.subtaskId,
    photoBase64: req.body.photoBase64,
  };

  const result = await completeTask(req.userId, String(req.params.id), payload);

  res.status(200).json({
    success: true,
    message: "Task completed successfully",
    data: result,
  });
}
