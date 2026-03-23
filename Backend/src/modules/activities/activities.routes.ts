import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  fetchDiscoverController,
  fetchJoinedController,
  joinActivityController,
  leaveActivityController,
} from "./activities.controller";

export const activitiesRouter = Router();

// Protect all /activities routes
activitiesRouter.use(requireAuth);

activitiesRouter.get("/discover", fetchDiscoverController);
activitiesRouter.get("/joined", fetchJoinedController);
activitiesRouter.post("/:id/join", joinActivityController);
activitiesRouter.delete("/:id/leave", leaveActivityController);
