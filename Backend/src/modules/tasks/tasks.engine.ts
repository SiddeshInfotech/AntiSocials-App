import { Task } from "@prisma/client";

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
