import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createActivityController,
  fetchDiscoverController,
  fetchJoinedController,
  joinActivityController,
  leaveActivityController,
} from "./activities.controller";
import { createActivitySchema } from "./activities.schema";

export const activitiesRouter = Router();

// Protect all /activities routes
activitiesRouter.use(requireAuth);

activitiesRouter.post(
  "/",
  validate(createActivitySchema),
  createActivityController,
);
activitiesRouter.get("/discover", fetchDiscoverController);
activitiesRouter.get("/joined", fetchJoinedController);
activitiesRouter.post("/:id/join", joinActivityController);
activitiesRouter.delete("/:id/leave", leaveActivityController);
