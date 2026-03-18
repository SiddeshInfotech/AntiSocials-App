import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getLifeCircle } from "./lifeCircle.service";

export const lifeCircleRouter = Router();

lifeCircleRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const scores = await getLifeCircle(userId);
  res.json({ success: true, data: scores });
});

