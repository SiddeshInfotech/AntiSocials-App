import { LifeCircleParameter } from "@prisma/client";

export const TASKS_PER_DAY = 1;
export const RECENT_TASK_EXCLUSION_DAYS = 5;
export const TASKS_PER_LEVEL = 2;
export const STREAK_RECOVERY_DAYS_REQUIRED = 3;

export const MAX_TASK_LEVEL = 5;

export const POINTS_PER_LEVEL: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
  4: 35,
  5: 50,
};

export const LEVEL_POOL_POINTS: Record<number, number> = {
  1: 100,
  2: 200,
  3: 400,
  4: 700,
  5: 1000,
};

export function getPointsPerLevel(level: number): number {
  return POINTS_PER_LEVEL[level] ?? POINTS_PER_LEVEL[1];
}

export function getLevelPoolTarget(level: number): number {
  return LEVEL_POOL_POINTS[level] ?? LEVEL_POOL_POINTS[1];
}

export const LIFE_CIRCLE_PARAMETERS: LifeCircleParameter[] = [
  LifeCircleParameter.AWARENESS,
  LifeCircleParameter.ATTENTION,
  LifeCircleParameter.BODY,
  LifeCircleParameter.EMOTIONAL,
  LifeCircleParameter.CONNECTION,
  LifeCircleParameter.COURAGE,
  LifeCircleParameter.MEANING,
];

export const LIFE_CIRCLE_SCORE_INCREMENT = 3;
export const LIFE_CIRCLE_SCORE_MAX = 100;
