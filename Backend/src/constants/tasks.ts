import { LifeCircleParameter } from "@prisma/client";

export const TASKS_PER_DAY = 7;
export const RECENT_TASK_EXCLUSION_DAYS = 5;
export const DAYS_PER_LEVEL = 21;
export const TASKS_PER_LEVEL = TASKS_PER_DAY * DAYS_PER_LEVEL;
export const STREAK_RECOVERY_DAYS_REQUIRED = 3;

export const MAX_TASK_LEVEL = 5;

export const HARD_TASKS_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
};

export function getHardTaskTarget(level: number): number {
  return HARD_TASKS_BY_LEVEL[level] ?? HARD_TASKS_BY_LEVEL[MAX_TASK_LEVEL];
}

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
