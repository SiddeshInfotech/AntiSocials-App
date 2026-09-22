/**
 * AntiSocial Level System Configuration & Types
 * 
 * Exact XP -> Level Mapping (Levels 1 to 50)
 * Max Level: 50 (50,000+ XP)
 */

export interface LevelThreshold {
  level: number;
  xp: number;
}

export interface UserLevelDetails {
  level: number;
  current_level: number;
  currentLevel: number;
  current_xp: number;
  currentXp: number;
  total_xp: number;
  totalXp: number;
  current_level_xp: number;
  currentLevelXp: number;
  next_level: number | null;
  nextLevel: number | null;
  next_level_xp: number | null;
  nextLevelXp: number | null;
  next_level_xp_requirement: number | null;
  nextLevelXpRequirement: number | null;
  xp_to_next_level: number;
  xpToNextLevel: number;
  progress_percentage: number;
  progressPercentage: number;
  progress_percent: number;
  is_max_level: boolean;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xp: 0 },
  { level: 2, xp: 420 },
  { level: 3, xp: 870 },
  { level: 4, xp: 1340 },
  { level: 5, xp: 1840 },
  { level: 6, xp: 2360 },
  { level: 7, xp: 2910 },
  { level: 8, xp: 3480 },
  { level: 9, xp: 4080 },
  { level: 10, xp: 4700 },
  { level: 11, xp: 5350 },
  { level: 12, xp: 6020 },
  { level: 13, xp: 6720 },
  { level: 14, xp: 7440 },
  { level: 15, xp: 8190 },
  { level: 16, xp: 8960 },
  { level: 17, xp: 9760 },
  { level: 18, xp: 10580 },
  { level: 19, xp: 11430 },
  { level: 20, xp: 12300 },
  { level: 21, xp: 13200 },
  { level: 22, xp: 14120 },
  { level: 23, xp: 15070 },
  { level: 24, xp: 16040 },
  { level: 25, xp: 17040 },
  { level: 26, xp: 18060 },
  { level: 27, xp: 19110 },
  { level: 28, xp: 20180 },
  { level: 29, xp: 21280 },
  { level: 30, xp: 22400 },
  { level: 31, xp: 23550 },
  { level: 32, xp: 24720 },
  { level: 33, xp: 25920 },
  { level: 34, xp: 27140 },
  { level: 35, xp: 28390 },
  { level: 36, xp: 29660 },
  { level: 37, xp: 30960 },
  { level: 38, xp: 32280 },
  { level: 39, xp: 33630 },
  { level: 40, xp: 35000 },
  { level: 41, xp: 36400 },
  { level: 42, xp: 37820 },
  { level: 43, xp: 39270 },
  { level: 44, xp: 40740 },
  { level: 45, xp: 42200 },
  { level: 46, xp: 43750 },
  { level: 47, xp: 45300 },
  { level: 48, xp: 46900 },
  { level: 49, xp: 48400 },
  { level: 50, xp: 50000 },
];

export const MAX_LEVEL = 50;
export const MAX_LEVEL_XP = 50000;

export function calculateUserLevel(totalXp: number): number {
  const num = Math.max(0, Math.floor(Number(totalXp) || 0));
  if (num >= MAX_LEVEL_XP) return MAX_LEVEL;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (num >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

export function getUserLevelDetails(totalXp: number): UserLevelDetails {
  const currentXp = Math.max(0, Math.floor(Number(totalXp) || 0));
  const currentLevel = calculateUserLevel(currentXp);

  const currentThreshold =
    LEVEL_THRESHOLDS.find((t) => t.level === currentLevel) || LEVEL_THRESHOLDS[0];
  const currentLevelXp = currentThreshold.xp;

  if (currentLevel >= MAX_LEVEL) {
    return {
      level: MAX_LEVEL,
      current_level: MAX_LEVEL,
      currentLevel: MAX_LEVEL,
      current_xp: currentXp,
      currentXp: currentXp,
      total_xp: currentXp,
      totalXp: currentXp,
      current_level_xp: MAX_LEVEL_XP,
      currentLevelXp: MAX_LEVEL_XP,
      next_level: null,
      nextLevel: null,
      next_level_xp: null,
      nextLevelXp: null,
      next_level_xp_requirement: null,
      nextLevelXpRequirement: null,
      xp_to_next_level: 0,
      xpToNextLevel: 0,
      progress_percentage: 100,
      progressPercentage: 100,
      progress_percent: 100,
      is_max_level: true,
    };
  }

  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1)!;
  const nextLevel = currentLevel + 1;
  const nextLevelXp = nextThreshold.xp;

  const levelXpSpan = nextLevelXp - currentLevelXp;
  const gainedInLevel = currentXp - currentLevelXp;
  const rawPercent = (gainedInLevel / levelXpSpan) * 100;
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round(rawPercent * 100) / 100),
  );

  return {
    level: currentLevel,
    current_level: currentLevel,
    currentLevel: currentLevel,
    current_xp: currentXp,
    currentXp: currentXp,
    total_xp: currentXp,
    totalXp: currentXp,
    current_level_xp: currentLevelXp,
    currentLevelXp: currentLevelXp,
    next_level: nextLevel,
    nextLevel: nextLevel,
    next_level_xp: nextLevelXp,
    nextLevelXp: nextLevelXp,
    next_level_xp_requirement: nextLevelXp,
    nextLevelXpRequirement: nextLevelXp,
    xp_to_next_level: Math.max(0, nextLevelXp - currentXp),
    xpToNextLevel: Math.max(0, nextLevelXp - currentXp),
    progress_percentage: progressPercentage,
    progressPercentage: progressPercentage,
    progress_percent: progressPercentage,
    is_max_level: false,
  };
}
