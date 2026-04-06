import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";
import { streakRouter } from "./modules/streak/streak.routes";
import { lifeCircleRouter } from "./modules/lifeCircle/lifeCircle.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import { activitiesRouter } from "./modules/activities/activities.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

export const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "15mb" }));
app.use(express.json({ limit: "15mb" }));
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
  });
});

app.use("/auth", authRouter);
app.use("/tasks", tasksRouter);
app.use("/wallet", walletRouter);
app.use("/streak", streakRouter);
app.use("/life-circle", lifeCircleRouter);
app.use("/profile", profileRouter);
app.use("/activities", activitiesRouter);
app.use("/notifications", notificationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
