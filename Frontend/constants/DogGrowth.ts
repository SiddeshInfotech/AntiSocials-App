export interface DogStageConfig {
  stage: number;
  name: string;
  emoji: string;
  subtitle: string;
  minTasks: number;
  maxTasks: number;
  asset: any;
  speechPrompts: string[];
}

export const DOG_STAGES: DogStageConfig[] = [
  {
    stage: 1,
    name: "Asleep",
    emoji: "😴",
    subtitle: "Resting peacefully while you build your foundation.",
    minTasks: 0,
    maxTasks: 14,
    asset: require("../assets/images/dog/1.png"),
    speechPrompts: [
      "Zzz... resting peacefully with you.",
      "Every small habit helps me wake up!",
      "I feel safe and calm by your side.",
      "Reach 15 tasks to see me wake up!"
    ],
  },
  {
    stage: 2,
    name: "Wake Up",
    emoji: "☀️",
    subtitle: "Alert, curious, and watching you make progress.",
    minTasks: 15,
    maxTasks: 28,
    asset: require("../assets/images/dog/2.png"),
    speechPrompts: [
      "I'm awake and ready to explore with you!",
      "Good morning to a brand new mindful habit!",
      "Look at that consistency — I'm so proud of you!",
      "Reach 29 tasks to see me sit tall!"
    ],
  },
  {
    stage: 3,
    name: "Sit Tall",
    emoji: "🐶",
    subtitle: "Sitting proud, attentive, and celebrating your momentum.",
    minTasks: 29,
    maxTasks: 42,
    asset: require("../assets/images/dog/3.png"),
    speechPrompts: [
      "Sitting tall and focused with you!",
      "Over 28 habits completed — you're unstoppable!",
      "Spending time offline together feels wonderful.",
      "Reach 43 tasks to watch me begin meditating!"
    ],
  },
  {
    stage: 4,
    name: "Meditate",
    emoji: "🧘",
    subtitle: "Centered in stillness, breathing in deep mindfulness.",
    minTasks: 43,
    maxTasks: 56,
    asset: require("../assets/images/dog/4.png"),
    speechPrompts: [
      "Inhale peace, exhale noise... we are grounded.",
      "Mindfulness is our superpower.",
      "Notice how calm the mind feels right now.",
      "Reach 57 tasks to enter deep calm!"
    ],
  },
  {
    stage: 5,
    name: "Deep Calm",
    emoji: "😌",
    subtitle: "Glowing with radiant presence, peace, and serenity.",
    minTasks: 57,
    maxTasks: 70,
    asset: require("../assets/images/dog/5.png"),
    speechPrompts: [
      "Deep inner peace radiates from within.",
      "Over halfway to 100 days of mindfulness!",
      "You've transformed your daily connection with life.",
      "Reach 71 tasks to watch me rise and levitate!"
    ],
  },
  {
    stage: 6,
    name: "Levitate",
    emoji: "🧘‍♂️✨",
    subtitle: "Rising weightlessly above digital noise in true harmony.",
    minTasks: 71,
    maxTasks: 85,
    asset: require("../assets/images/dog/6.png"),
    speechPrompts: [
      "Weightless and free from digital overload!",
      "Look how far we've elevated together.",
      "The final master stage is within reach!",
      "Reach 86 tasks to achieve full mastery!"
    ],
  },
  {
    stage: 7,
    name: "Master",
    emoji: "👑",
    subtitle: "Crown of enlightenment — a true master of presence.",
    minTasks: 86,
    maxTasks: 100,
    asset: require("../assets/images/dog/7.png"),
    speechPrompts: [
      "Master of mindfulness and real connection!",
      "Crowned champion! You have completed the 100-day journey.",
      "A master companion — present, grounded, and free.",
      "Thank you for taking care of both of us on this journey!"
    ],
  },
];

export interface DogStageResult {
  stage: number;
  stageName: string;
  emoji: string;
  stageSubtitle: string;
  minTasks: number;
  maxTasks: number;
  nextThreshold: number;
  tasksCompleted: number;
  progressInStage: number; // 0 to 1
  totalProgress: number;   // 0 to 1
  asset: any;
  speechPrompt: string;
  isFinalStage: boolean;
  isCompleted100: boolean;
}

/**
 * Derives the dog's stage, progress metrics, and asset from the real completed task count.
 * @param completedTasks Count of completed tasks (number) or array of task names (string[])
 */
export function getDogStage(completedTasks: number | string[] = 0): DogStageResult {
  const count = typeof completedTasks === "number"
    ? Math.max(0, completedTasks)
    : (Array.isArray(completedTasks) ? completedTasks.length : 0);

  let matchedStage = DOG_STAGES[0];

  for (const stageConfig of DOG_STAGES) {
    if (count >= stageConfig.minTasks && count <= stageConfig.maxTasks) {
      matchedStage = stageConfig;
      break;
    }
  }

  // If count is beyond 100, cap at stage 7
  if (count > 100) {
    matchedStage = DOG_STAGES[DOG_STAGES.length - 1];
  }

  const stageSpan = Math.max(1, matchedStage.maxTasks - matchedStage.minTasks + 1);
  const tasksInStage = Math.max(0, count - matchedStage.minTasks);
  const progressInStage = Math.min(1, tasksInStage / stageSpan);
  const totalProgress = Math.min(1, count / 100);

  const nextThreshold = matchedStage.stage < 7
    ? DOG_STAGES[matchedStage.stage].minTasks
    : 100;

  const randomPrompt = matchedStage.speechPrompts[
    Math.floor(Math.random() * matchedStage.speechPrompts.length)
  ];

  return {
    stage: matchedStage.stage,
    stageName: matchedStage.name,
    emoji: matchedStage.emoji,
    stageSubtitle: matchedStage.subtitle,
    minTasks: matchedStage.minTasks,
    maxTasks: matchedStage.maxTasks,
    nextThreshold,
    tasksCompleted: count,
    progressInStage,
    totalProgress,
    asset: matchedStage.asset,
    speechPrompt: randomPrompt,
    isFinalStage: matchedStage.stage === 7,
    isCompleted100: count >= 100,
  };
}
