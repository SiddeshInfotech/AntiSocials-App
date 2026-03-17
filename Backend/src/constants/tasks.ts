import { LifeCircleParameter } from "@prisma/client";

export const TASKS_PER_DAY = 7;
export const RECENT_TASK_EXCLUSION_DAYS = 5;

export const TASK_LEVEL_SEQUENCE = [1, 1, 2, 2, 3, 4, 5] as const;

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
