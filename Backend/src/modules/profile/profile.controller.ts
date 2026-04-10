import { Request, Response } from "express";
import {
  getUserProfile,
  patchOnboardingInterests,
  patchUserProfile,
  updateUserProfile,
} from "./profile.service";

export async function getProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const result = await getUserProfile(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function updateProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const result = await updateUserProfile(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
}

export async function patchProfileController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const result = await patchUserProfile(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
}

export async function patchOnboardingInterestsController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.userId!;
  const result = await patchOnboardingInterests(userId, req.body);

  res.status(200).json({
    success: true,
    message: "Interests updated successfully",
    data: result,
  });
}
