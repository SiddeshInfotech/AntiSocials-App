import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getWallet, getTransactions } from "./wallet.service";

export const walletRouter = Router();

walletRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const wallet = await getWallet(userId);
  res.json({ success: true, data: wallet });
});

walletRouter.get("/transactions", requireAuth, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const transactions = await getTransactions(userId);
  res.json({ success: true, data: transactions });
});
