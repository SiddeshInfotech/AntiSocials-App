import { prisma } from "../../lib/prisma";
import {
  DAYS_PER_LEVEL,
  getLevelPoolTarget,
  getPointsPerLevel,
  TASKS_PER_LEVEL,
  MAX_TASK_LEVEL,
} from "../../constants/tasks";

export const getStreak = async (userId: string) => {
  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    return null;
  }

  const now = new Date();
  const daysSinceJourneyStart = Math.max(
    0,
    Math.floor(
      (new Date(now.toISOString().slice(0, 10)).getTime() -
        new Date(
          streak.journeyStartDate.toISOString().slice(0, 10),
        ).getTime()) /
        86_400_000,
    ),
  );
  const computedLevel = Math.min(
    MAX_TASK_LEVEL,
    Math.floor(daysSinceJourneyStart / DAYS_PER_LEVEL) + 1,
  );
  const cycleDay = (daysSinceJourneyStart % DAYS_PER_LEVEL) + 1;

  const currentLevelTaskPoints = getPointsPerLevel(computedLevel);
  const currentLevelPoolTarget = getLevelPoolTarget(computedLevel);
  const completedTasksInCurrentLevel =
    streak.completedTaskCount % TASKS_PER_LEVEL;
  const currentLevelPoolEarned =
    completedTasksInCurrentLevel * currentLevelTaskPoints;

  return {
    ...streak,
    currentLevel: computedLevel,
    cycleDay,
    currentLevelTaskPoints,
    currentLevelPoolTarget,
    completedTasksInCurrentLevel,
    currentLevelPoolEarned,
  };
};
