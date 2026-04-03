import { Task, TaskDifficulty } from "@prisma/client";

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickTaskForLevel(
  tasks: Task[],
  level: number,
  recentTaskIds: Set<string>,
): Task {
  const exactLevel = tasks.filter((task) => task.level === level);
  const exactWithoutRecent = exactLevel.filter(
    (task) => !recentTaskIds.has(task.id),
  );

  if (exactWithoutRecent.length > 0) {
    return randomPick(exactWithoutRecent);
  }

  if (exactLevel.length > 0) {
    return randomPick(exactLevel);
  }

  const sortedByLevelDistance = [...tasks].sort((a, b) => {
    const aDistance = Math.abs(a.level - level);
    const bDistance = Math.abs(b.level - level);
    return aDistance - bDistance;
  });

  const nearestWithoutRecent = sortedByLevelDistance.filter(
    (task) => !recentTaskIds.has(task.id),
  );

  if (nearestWithoutRecent.length > 0) {
    return randomPick(nearestWithoutRecent);
  }

  return randomPick(sortedByLevelDistance);
}

function pickWithPriority(
  tasks: Task[],
  level: number,
  recentTaskIds: Set<string>,
  excludedTaskIds: Set<string>,
): Task | null {
  const available = tasks.filter((task) => !excludedTaskIds.has(task.id));
  if (available.length === 0) {
    return null;
  }

  const exactLevel = available.filter((task) => task.level === level);
  const exactWithoutRecent = exactLevel.filter(
    (task) => !recentTaskIds.has(task.id),
  );

  if (exactWithoutRecent.length > 0) {
    return randomPick(exactWithoutRecent);
  }

  if (exactLevel.length > 0) {
    return randomPick(exactLevel);
  }

  const sortedByLevelDistance = [...available].sort((a, b) => {
    const aDistance = Math.abs(a.level - level);
    const bDistance = Math.abs(b.level - level);
    return aDistance - bDistance;
  });

  const nearestWithoutRecent = sortedByLevelDistance.filter(
    (task) => !recentTaskIds.has(task.id),
  );

  if (nearestWithoutRecent.length > 0) {
    return randomPick(nearestWithoutRecent);
  }

  return randomPick(sortedByLevelDistance);
}

export function pickTasksForToday(input: {
  tasks: Task[];
  level: number;
  recentTaskIds: Set<string>;
  totalCount: number;
  hardCountTarget: number;
}): Task[] {
  const selected: Task[] = [];
  const excludedTaskIds = new Set<string>();

  const hardTasks = input.tasks.filter(
    (task) => task.difficulty === TaskDifficulty.HARD,
  );
  const nonHardTasks = input.tasks.filter(
    (task) => task.difficulty !== TaskDifficulty.HARD,
  );

  const hardCount = Math.min(input.hardCountTarget, input.totalCount);
  const nonHardCount = input.totalCount - hardCount;

  for (let index = 0; index < hardCount; index++) {
    const picked = pickWithPriority(
      hardTasks,
      input.level,
      input.recentTaskIds,
      excludedTaskIds,
    );

    if (!picked) {
      break;
    }

    selected.push(picked);
    excludedTaskIds.add(picked.id);
  }

  for (let index = 0; index < nonHardCount; index++) {
    const picked = pickWithPriority(
      nonHardTasks,
      input.level,
      input.recentTaskIds,
      excludedTaskIds,
    );

    if (!picked) {
      break;
    }

    selected.push(picked);
    excludedTaskIds.add(picked.id);
  }

  while (selected.length < input.totalCount) {
    const picked = pickWithPriority(
      input.tasks,
      input.level,
      input.recentTaskIds,
      excludedTaskIds,
    );
    if (!picked) {
      break;
    }

    selected.push(picked);
    excludedTaskIds.add(picked.id);
  }

  return selected;
}
