import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getStreak } from "./streak.service";

export const streakRouter = Router();

streakRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const streak = await getStreak(userId);
  res.json({ success: true, data: streak });
});

