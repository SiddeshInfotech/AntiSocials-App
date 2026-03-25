import { Request, Response } from "express";
import { AppError } from "../../middleware/error-handler";
import {
  getActiveDeviceTokens,
  registerDeviceToken,
  unregisterDeviceToken,
} from "./notifications.service";

export async function registerDeviceController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const device = await registerDeviceToken({
    userId: req.userId,
    token: req.body.token,
    platform: req.body.platform,
  });

  res.status(200).json({
    success: true,
    message: "Device registered",
    data: {
      id: device.id,
      platform: device.platform,
      isActive: device.isActive,
    },
  });
}

export async function unregisterDeviceController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  await unregisterDeviceToken({
    userId: req.userId,
    token: req.body.token,
  });

  res.status(200).json({
    success: true,
    message: "Device unregistered",
  });
}

export async function getMyDevicesController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const devices = await getActiveDeviceTokens(req.userId);

  res.status(200).json({
    success: true,
    data: devices,
  });
}
