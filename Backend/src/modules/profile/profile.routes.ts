import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  getProfileController,
  patchProfileController,
  updateProfileController,
} from "./profile.controller";
import { patchProfileSchema, updateProfileSchema } from "./profile.schema";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", getProfileController);
profileRouter.put("/", validate(updateProfileSchema), updateProfileController);
profileRouter.patch("/", validate(patchProfileSchema), patchProfileController);
