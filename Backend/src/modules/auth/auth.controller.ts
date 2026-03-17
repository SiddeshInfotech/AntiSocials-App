import { Request, Response } from "express";
import { loginWithEmail, registerWithEmail } from "./auth.service";

export async function registerEmailController(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await registerWithEmail(req.body);

  res.status(201).json({
    success: true,
    message: "Email registration successful",
    data: result,
  });
}

export async function loginEmailController(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await loginWithEmail(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
}
