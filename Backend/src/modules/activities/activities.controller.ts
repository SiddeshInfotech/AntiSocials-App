import { Request, Response } from "express";
import {
  createActivity,
  getDiscoverActivities,
  getJoinedActivities,
  joinActivity,
  leaveActivity,
} from "./activities.service";
import { CreateActivityPayload } from "./activities.schema";

export async function fetchDiscoverController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const data = await getDiscoverActivities(userId);

  res.status(200).json({ success: true, data });
}

export async function fetchJoinedController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const data = await getJoinedActivities(userId);

  res.status(200).json({ success: true, data });
}

export async function joinActivityController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const id = req.params.id as string;

  await joinActivity(userId, id);
  res
    .status(200)
    .json({ success: true, message: "Joined activity successfully" });
}

export async function leaveActivityController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const id = req.params.id as string;

  await leaveActivity(userId, id);
  res
    .status(200)
    .json({ success: true, message: "Left activity successfully" });
}

export async function createActivityController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const payload = req.body as CreateActivityPayload;

  const data = await createActivity(userId, payload);
  res.status(201).json({ success: true, data });
}
