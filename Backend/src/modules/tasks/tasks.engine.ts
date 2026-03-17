import { LifeCircleParameter, Task } from "@prisma/client";
import {
  LIFE_CIRCLE_PARAMETERS,
  TASK_LEVEL_SEQUENCE,
  TASKS_PER_DAY,
} from "../../constants/tasks";

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function buildDailyTaskSet(
  tasks: Task[],
  recentTaskIds: Set<string>,
): Task[] {
  const available = tasks.filter((task) => !recentTaskIds.has(task.id));
  const pool = available.length >= TASKS_PER_DAY ? available : tasks;

  const selected: Task[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < TASKS_PER_DAY; i += 1) {
    const targetLevel = TASK_LEVEL_SEQUENCE[i];
    const targetParameter = LIFE_CIRCLE_PARAMETERS[
      i % LIFE_CIRCLE_PARAMETERS.length
    ] as LifeCircleParameter;

    const candidates = pool.filter(
      (task) =>
        task.level === targetLevel &&
        task.parameter === targetParameter &&
        !usedIds.has(task.id),
    );

    const fallbackByLevel = pool.filter(
      (task) => task.level === targetLevel && !usedIds.has(task.id),
    );
    const fallbackAny = pool.filter((task) => !usedIds.has(task.id));

    const bucket =
      candidates.length > 0
        ? candidates
        : fallbackByLevel.length > 0
          ? fallbackByLevel
          : fallbackAny;

    if (bucket.length === 0) {
      break;
    }

    const chosen = randomPick(bucket);
    selected.push(chosen);
    usedIds.add(chosen.id);
  }

  return selected;
}
