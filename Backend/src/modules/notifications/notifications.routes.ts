import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  getMyDevicesController,
  registerDeviceController,
  unregisterDeviceController,
} from "./notifications.controller";
import {
  registerDeviceSchema,
  unregisterDeviceSchema,
} from "./notifications.schema";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/devices", getMyDevicesController);
notificationsRouter.post(
  "/devices/register",
  validate(registerDeviceSchema),
  registerDeviceController,
);
notificationsRouter.post(
  "/devices/unregister",
  validate(unregisterDeviceSchema),
  unregisterDeviceController,
);
