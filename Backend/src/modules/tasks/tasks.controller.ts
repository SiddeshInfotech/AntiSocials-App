import { Request, Response } from "express";
import { AppError } from "../../middleware/error-handler";
import { completeTask, getTodayTasks } from "./tasks.service";

export async function getTodayTasksController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const tasks = await getTodayTasks(req.userId);

  res.status(200).json({
    success: true,
    message: "Today's tasks",
    data: tasks,
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
