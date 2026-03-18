import { Router } from "express";
import { authRateLimit } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import {
  loginEmailController,
  registerEmailController,
} from "./auth.controller";
import { loginEmailSchema, registerEmailSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/register-email",
  authRateLimit,
  validate(registerEmailSchema),
  registerEmailController,
);
authRouter.post(
  "/login-email",
  authRateLimit,
  validate(loginEmailSchema),
  loginEmailController,
);

