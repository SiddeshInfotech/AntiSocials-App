import { prisma } from "../../lib/prisma";
import {
  getLevelPoolTarget,
  getPointsPerLevel,
  TASKS_PER_LEVEL,
} from "../../constants/tasks";

export const getStreak = async (userId: string) => {
  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    return null;
  }

  const currentLevelTaskPoints = getPointsPerLevel(streak.currentLevel);
  const currentLevelPoolTarget = getLevelPoolTarget(streak.currentLevel);
  const completedTasksInCurrentLevel =
    streak.completedTaskCount % TASKS_PER_LEVEL;
  const currentLevelPoolEarned =
    completedTasksInCurrentLevel * currentLevelTaskPoints;

  return {
    ...streak,
    currentLevelTaskPoints,
    currentLevelPoolTarget,
    completedTasksInCurrentLevel,
    currentLevelPoolEarned,
  };
};
