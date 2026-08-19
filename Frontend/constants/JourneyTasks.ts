// Single source of truth for the 100-day journey's task content and day/bucket
// unlock mechanics. Both the Task page (TasksJourneySection) and the Dog/Home
// experience (CircularHabitDashboard) read from this module so they can never
// drift apart on "which 7 tasks belong to the current day" or "is day N unlocked".

export interface JourneyTask {
  emoji: string;
  difficulty: "easy" | "medium" | "hard" | string;
  title: string;
  subtitle: string;
  points: string;
  route?: string;
}

// The 7 AntiSocial life dimensions. Position i in a day's 7-task bucket is
// presented as dimension LIFE_DIMENSIONS[i] around the Dog — purely a label
// for *where* a task sits, never a substitute for the task's real content.
export const LIFE_DIMENSIONS = [
  "Awareness",
  "Attention Control",
  "Body & Health",
  "Emotional Intelligence",
  "Connection",
  "Growth & Courage",
  "Meaning & Contribution",
] as const;

export const TASKS_PER_BUCKET = 7;
export const MAX_DAY = 100;

export const tasksData: JourneyTask[] = [
  {
    emoji: "🧭",
    difficulty: "hard",
    title: "Lead a Short Interaction (2–3 Minutes)",
    subtitle: "Gently take the initiative & guide a 2-3 minute interaction",
    points: "+600 points",
    route: "/lead-short-interaction-task",
  },
  {
    emoji: "🌟",
    difficulty: "hard",
    title: "Welcome a New Participant",
    subtitle: "Help a newcomer feel comfortable & ignite the community light",
    points: "+600 points",
    route: "/welcome-newcomer-task",
  },
  {
    emoji: "🔥",
    difficulty: "hard",
    title: "Stay 45+ Minutes",
    subtitle: "Gather around the campfire circle & stay present for 45 minutes",
    points: "+600 points",
    route: "/stay-45m-task",
  },
  {
    emoji: "🧩",
    difficulty: "hard",
    title: "Help Organize Small Part",
    subtitle: "Fulfill one small responsibility at an event & complete the puzzle",
    points: "+600 points",
    route: "/help-organize-task",
  },
  {
    emoji: "🤝",
    difficulty: "hard",
    title: "Join Local Group (Sports / Hobby)",
    subtitle: "Join a real sports or hobby group & verify with AI photo + GPS",
    points: "+600 points",
    route: "/join-group-activity-task",
  },
  {
    emoji: "📸",
    difficulty: "medium",
    title: "Photo Proof (Context-Based)",
    subtitle: "Capture a real social moment & save it to your Journey Album",
    points: "+300 points",
    route: "/photo-proof-task",
  },
  {
    emoji: "🎪",
    difficulty: "hard",
    title: "Join a Group Event (Verified)",
    subtitle: "Discover live nearby community events & verify 15m presence",
    points: "+600 points",
    route: "/join-event-verified-task",
  },
  {
    emoji: "🫁",
    difficulty: "easy",
    title: "Breathe consciously for 3 minutes",
    subtitle: "Guided breathing animation + timer",
    points: "+100 points",
    route: "/breath-task",
  },
  {
    emoji: "🌬️",
    difficulty: "medium",
    title: "Grounding Breath",
    subtitle: "5m guided grounding breathing with immersive video",
    points: "+300 points",
    route: "/groundingBreath",
  },
  {
    emoji: "✨",
    difficulty: "medium",
    title: "Observe Group Energy",
    subtitle: "Learn to quietly observe the emotional atmosphere around you",
    points: "+300 points",
    route: "/groupEnergy",
  },
  {
    emoji: "👁️",
    difficulty: "hard",
    title: "Notice Fear",
    subtitle: "Observe and acknowledge fear as a quiet visitor",
    points: "+600 points",
    route: "/fear",
  },
  {
    emoji: "🪶",
    difficulty: "medium",
    title: "Release",
    subtitle: "Release tension and feel lighter with breathing",
    points: "+300 points",
    route: "/release",
  },
  {
    emoji: "🚀",
    difficulty: "hard",
    title: "Start Hardest Task",
    subtitle: "Begin with the task you have been avoiding",
    points: "+600 points",
    route: "/hardest",
  },
  {
    emoji: "🧠",
    difficulty: "medium",
    title: "Remove Distraction",
    subtitle: "Lock your distracting apps before starting your focus session",
    points: "+300 points",
    route: "/deep",
  },
  {
    emoji: "🐶",
    difficulty: "easy",
    title: "Observe One Emotion for 5 Minutes",
    subtitle: "Calming 5m timer with cute puppy companion",
    points: "+100 points",
    route: "/observe-emotion",
  },
  {
    emoji: "💧",
    difficulty: "easy",
    title: "Drink a glass of water mindfully",
    subtitle: "60s timer + confirm",
    points: "+100 points",
    route: "/drink-task",
  },
  {
    emoji: "👀",
    difficulty: "easy",
    title: "Eye Rest",
    subtitle: "Give your eyes a short break from screens.",
    points: "+100 points",
    route: "/eye-rest-task",
  },
  {
    emoji: "🤫",
    difficulty: "medium",
    title: "Sit without phone for 2 minutes",
    subtitle: "Lock-screen mode",
    points: "+300 points",
    route: "/start-task",
  },
  {
    emoji: "🐕",
    difficulty: "medium",
    title: "Focus on one task (10 min)",
    subtitle: "For the next 10 minutes, focus on only one task.",
    points: "+300 points",
    route: "/focus-task",
  },
  {
    emoji: "🔕",
    difficulty: "easy",
    title: "Turn off notifications (30 min)",
    subtitle: "Turn off your phone notifications for the next 30 minutes.",
    points: "+100 points",
    route: "/notifications-task",
  },
  {
    emoji: "👀",
    difficulty: "easy",
    title: "Observe urge to check phone",
    subtitle: "Simply notice whenever you feel the urge to check your phone.",
    points: "+100 points",
    route: "/observe-task",
  },
  {
    emoji: "📝",
    difficulty: "easy",
    title: "Write one distraction",
    subtitle: "Write down the biggest distraction that pulled you away today.",
    points: "+100 points",
    route: "/distraction-task",
  },
  {
    emoji: "🍽️",
    difficulty: "easy",
    title: "Eat one bite consciously",
    subtitle: "Before rushing through your meal, take one bite slowly and mindfully.",
    points: "+100 points",
    route: "/eat-task",
  },
  {
    emoji: "❤️",
    difficulty: "easy",
    title: "Notice heartbeat",
    subtitle: "Pause for a moment and gently notice your heartbeat.",
    points: "+100 points",
    route: "/heartbeat-task",
  },
  {
    emoji: "🧍",
    difficulty: "easy",
    title: "Posture check",
    subtitle: "Take a moment to check your posture and align your body.",
    points: "+100 points",
    route: "/posture-task",
  },
  {
    emoji: "🧘‍♀️",
    difficulty: "medium",
    title: "Stretch neck & shoulders",
    subtitle: "Animation + timer",
    points: "+300 points",
    route: "/start-exercise",
  },
  {
    emoji: "🌬️",
    difficulty: "medium",
    title: "Calm Breath",
    subtitle: "Slow your mind with a guided breathing rhythm.",
    points: "+300 points",
    route: "/calm-breath-task",
  },
  {
    emoji: "⏳",
    difficulty: "medium",
    title: "Stay for at Least 15 Minutes",
    subtitle: "Remain comfortably present in a social space",
    points: "+300 points",
    route: "/stay-15m-task",
  },
  {
    emoji: "🎭👥",
    difficulty: "medium",
    title: "Observe Group Dynamics",
    subtitle: "Understand natural communication & group rhythm",
    points: "+300 points",
    route: "/social-observer-task",
  },
  {
    emoji: "📍🧭",
    difficulty: "medium",
    title: "Location Check-in",
    subtitle: "Physically visit & check in at a social place",
    points: "+300 points",
    route: "/location-checkin-task",
  },
  {
    emoji: "🎟️👋",
    difficulty: "hard",
    title: "Introduce Yourself (Name + 1 Line)",
    subtitle: "Introduce yourself naturally with name & 1 line",
    points: "+600 points",
    route: "/name-badge-task",
  },
  {
    emoji: "🪞🤝",
    difficulty: "hard",
    title: "Join a Small Group Activity",
    subtitle: "Comfortably join an existing small group",
    points: "+600 points",
    route: "/join-group-task",
  },
  {
    emoji: "🌊💙",
    difficulty: "hard",
    title: "Observe and Regulate Emotions",
    subtitle: "Notice feelings & allow emotional waves to settle",
    points: "+600 points",
    route: "/emotion-tide-task",
  },
  {
    emoji: "🚪✨",
    difficulty: "hard",
    title: "Final Reflection (Stage 2)",
    subtitle: "Re-enter the social world. Grand Finale of Stage 2",
    points: "+600 points",
    route: "/stage2-final-task",
  },
  {
    emoji: "🪞✨",
    difficulty: "hard",
    title: "Share Something Real About Yourself",
    subtitle: "Reveal one authentic part of who you are",
    points: "+600 points",
    route: "/authenticity-task",
  },
  {
    emoji: "🔭",
    difficulty: "hard",
    title: "Express Genuine Curiosity",
    subtitle: "Develop genuine interest in another person's world",
    points: "+600 points",
    route: "/curiosity-task",
  },
  {
    emoji: "🍃💬",
    difficulty: "hard",
    title: "Initiate Conversation Naturally",
    subtitle: "Recognize & welcome organic conversation moments",
    points: "+600 points",
    route: "/initiate-naturally-task",
  },
  {
    emoji: "📱🔒",
    difficulty: "hard",
    title: "No Escape Behavior (Phone Avoidance)",
    subtitle: "5 Min Temptation Lab psychological challenge",
    points: "+600 points",
    route: "/no-escape-task",
  },
  {
    emoji: "🛂🌍",
    difficulty: "hard",
    title: "Initiate Conversation in Unfamiliar Setting",
    subtitle: "Confidently start one genuine conversation in an unfamiliar environment.",
    points: "+600 points",
    route: "/unfamiliar-setting-task",
  },
  {
    emoji: "🔑",
    difficulty: "hard",
    title: "Ask Meaningful Question",
    subtitle: "Ask one thoughtful open-ended question that unlocks a deeper story.",
    points: "+600 points",
    route: "/ask-meaningful-question-task",
  },
  {
    emoji: "🌼💛",
    difficulty: "hard",
    title: "Ask Someone About Their Day",
    subtitle: "Genuinely ask someone about their day & listen with empathy.",
    points: "+600 points",
    route: "/ask-about-day-task",
  },
  {
    emoji: "🌑",
    difficulty: "hard",
    title: "Observe Inner Fear",
    subtitle: "Stop running from fear & observe it with quiet awareness.",
    points: "+600 points",
    route: "/observe-fear-task",
  },
  {
    emoji: "🗝️📦",
    difficulty: "hard",
    title: "Share Something Personal",
    subtitle: "Gently share one small genuine personal story with someone you trust.",
    points: "+600 points",
    route: "/share-personal-task",
  },
  {
    emoji: "🎼🤍",
    difficulty: "hard",
    title: "Handle Awkward Silence",
    subtitle: "Experience natural silence in conversation without trying to escape it.",
    points: "+600 points",
    route: "/handle-silence-task",
  },
  {
    emoji: "🗣️✍️",
    difficulty: "hard",
    title: "Share Honest Opinion",
    subtitle: "Express your genuine perspective respectfully and authentically.",
    points: "+600 points",
    route: "/share-honest-opinion-task",
  },
  {
    emoji: "🔥",
    difficulty: "hard",
    title: "Hold Conversation (5 Minutes)",
    subtitle: "Comfortably maintain a meaningful conversation for 5 minutes.",
    points: "+600 points",
    route: "/hold-conversation-5min-task",
  },
  {
    emoji: "🪐",
    difficulty: "hard",
    title: "Talk to 2 New People",
    subtitle: "Step outside your comfort zone and connect with 2 new people.",
    points: "+600 points",
    route: "/talk-to-2-new-people-task",
  },
  {
    emoji: "🌊💬",
    difficulty: "hard",
    title: "Initiate Short Conversation",
    subtitle: "Start & naturally continue a short conversation (30–90s).",
    points: "+600 points",
    route: "/initiate-short-conversation-task",
  },
  {
    emoji: "💎",
    difficulty: "hard",
    title: "Compliment Someone",
    subtitle: "Discover hidden value in people & express genuine appreciation.",
    points: "+600 points",
    route: "/compliment-someone-task",
  },
  {
    emoji: "🗝️",
    difficulty: "hard",
    title: "Courage Unlock",
    subtitle: "Face a fear and unlock a stronger version of yourself.",
    points: "+600 points",
    route: "/courage-unlock-task",
  },
  {
    emoji: "🏔️",
    difficulty: "hard",
    title: "Reflect on 21 Days",
    subtitle: "Pause and look back on your growth across 21 days.",
    points: "+600 points",
    route: "/reflection-milestone-task",
  },
  {
    emoji: "🦋",
    difficulty: "hard",
    title: "Write 3 Internal Changes",
    subtitle: "Discover how you've changed from within.",
    points: "+600 points",
    route: "/evolution-task",
  },
  {
    emoji: "🤲",
    difficulty: "hard",
    title: "Thank Yourself",
    subtitle: "Take a quiet moment to recognize your effort.",
    points: "+600 points",
    route: "/thank-yourself-task",
  },
  {
    emoji: "🏮",
    difficulty: "hard",
    title: "Share Insight",
    subtitle: "Choose one lesson learned and share it.",
    points: "+600 points",
    route: "/share-insight-task",
  },
  {
    emoji: "📜",
    difficulty: "hard",
    title: "Commit to Habit",
    subtitle: "Make a serious promise to your future self.",
    points: "+600 points",
    route: "/commitment-task",
  },
  {
    emoji: "🗝️",
    difficulty: "hard",
    title: "Life Path Unlock",
    subtitle: "Unlock the next chapter of your growth journey.",
    points: "+600 points",
    route: "/finale-task",
  },
  {
    emoji: "👀",
    difficulty: "easy",
    title: "Look outside for 2 minutes",
    subtitle: "Timer",
    points: "+100 points",
    route: "/outside-task",
  },
  {
    emoji: "🧘‍♀️",
    difficulty: "medium",
    title: "Gratitude for Body",
    subtitle: "Premium body appreciation journey",
    points: "+300 points",
    route: "/gratitude",
  },
  {
    emoji: "✍️",
    difficulty: "medium",
    title: "Write 1 word about how you feel",
    subtitle: "Text input",
    points: "+300 points",
    route: "/write-task",
  },
  {
    emoji: "🌿",
    difficulty: "easy",
    title: "Confirm Presence",
    subtitle: "Pause for a moment and notice where you are.",
    points: "+100 points",
    route: "/confirm-presence-task",
  },
  {
    emoji: "🧘",
    difficulty: "medium",
    title: "Silent Sitting",
    subtitle: "Find a quiet place and sit comfortably.",
    points: "+300 points",
    route: "/stillness",
  },
  {
    emoji: "📝",
    difficulty: "medium",
    title: "Reflect on Week",
    subtitle: "Review your week and plan ahead.",
    points: "+300 points",
    route: "/reflect",
  },
  {
    emoji: "🌳",
    difficulty: "easy",
    title: "Write 3 Learnings",
    subtitle: "Reflect on today's lessons and grow your Wisdom Tree",
    points: "+100 points",
    route: "/learning2",
  },
  {
    emoji: "📵",
    difficulty: "medium",
    title: "No Media",
    subtitle: "Take a one-hour break from all forms of digital media.",
    points: "+300 points",
    route: "/no-media-task",
  },
  {
    emoji: "😊",
    difficulty: "easy",
    title: "Smile intentionally",
    subtitle: "Self-confirm button",
    points: "+100 points",
    route: "/smile-task",
  },
  {
    emoji: "📞",
    difficulty: "medium",
    title: "Call an old friend",
    subtitle: "Reconnect with someone meaningful",
    points: "+300 points",
    route: "/call-friend",
  },
  {
    emoji: "👋",
    difficulty: "medium",
    title: "Say Hello to 2 People",
    subtitle: "Greet 2 people & reflect",
    points: "+300 points",
    route: "/say-hello-task",
  },
  {
    emoji: "👋",
    difficulty: "medium",
    title: "Say Hello to 3 People",
    subtitle: "Greet 3 people & reflect",
    points: "+300 points",
    route: "/say-hello-to-3-people-task",
  },
  {
    emoji: "💝",
    difficulty: "medium",
    title: "Send a Thoughtful Message",
    subtitle: "Write a heartfelt message & reflect",
    points: "+300 points",
    route: "/thoughtful-message-task",
  },
  {
    emoji: "🥾",
    difficulty: "medium",
    title: "Walk Outside for 10 Minutes",
    subtitle: "Stepping outside walk & reflection",
    points: "+300 points",
    route: "/walk-outside-task",
  },
  {
    emoji: "👁️🗨️",
    difficulty: "medium",
    title: "Make Eye Contact Once",
    subtitle: "Connect with eyes & reflect",
    points: "+300 points",
    route: "/eye-contact-task",
  },
  {
    emoji: "🥣",
    difficulty: "medium",
    title: "Eat One Meal Without Phone",
    subtitle: "Mindful eating experience",
    points: "+300 points",
    route: "/eat-meal-task",
  },
  {
    emoji: "💌",
    difficulty: "medium",
    title: "Message Someone You Know",
    subtitle: "Send a heartfelt message",
    points: "+300 points",
    route: "/message-task",
  },
  {
    emoji: "🪑",
    difficulty: "medium",
    title: "Sit Near People",
    subtitle: "Be present in a shared space",
    points: "+300 points",
    route: "/sit-near-people-task",
  },
  {
    emoji: "🌌",
    difficulty: "medium",
    title: "Reflection: How Did It Feel?",
    subtitle: "Observe and reflect on experience",
    points: "+300 points",
    route: "/reflection-feel-task",
  },
  {
    emoji: "🤝",
    difficulty: "medium",
    title: "Spend 20 minutes offline with someone",
    subtitle: "Be present with a real person",
    points: "+300 points",
    route: "/ask",
  },
  {
    emoji: "✨",
    difficulty: "hard",
    title: "Today's Connection",
    subtitle: "A premium 6-step cinematic conversation journey",
    points: "+600 points",
    route: "/ask",
  },
  {
    emoji: "🪞",
    difficulty: "medium",
    title: "Encourage Self-Talk",
    subtitle: "Choose positive words and encourage yourself.",
    points: "+300 points",
    route: "/self-talk-task",
  },
  {
    emoji: "🪶",
    difficulty: "medium",
    title: "Write Courage Moment",
    subtitle: "Write about a moment you showed courage and reflect.",
    points: "+300 points",
    route: "/courage-task",
  },
  {
    emoji: "🌉",
    difficulty: "hard",
    title: "Ask Someone a Simple Question",
    subtitle: "Ask a simple question & reflect",
    points: "+600 points",
    route: "/ask-question-task",
  },
  {
    emoji: "✨💬",
    difficulty: "hard",
    title: "Initiate 2 Conversations",
    subtitle: "Start 2 real conversations with 2 people",
    points: "+600 points",
    route: "/initiate-conversations-task",
  },
  {
    emoji: "⚓",
    difficulty: "hard",
    title: "Stay in Social Space (15 Minutes)",
    subtitle: "Remain present in public space for 15 mins",
    points: "+600 points",
    route: "/stay-in-social-space-task",
  },
  {
    emoji: "🫂",
    difficulty: "hard",
    title: "Sit with Someone for 5 Minutes",
    subtitle: "Share quiet space together & reflect",
    points: "+600 points",
    route: "/presence-task",
  },
  {
    emoji: "👣",
    difficulty: "medium",
    title: "Walk Slowly",
    subtitle: "Mindful 10m walking journey with calming video",
    points: "+300 points",
    route: "/walk",
  },
  {
    emoji: "🧘",
    difficulty: "easy",
    title: "Morning Stretch",
    subtitle: "Wake your body gently with 5 mindful exercises",
    points: "+100 points",
    route: "/stretch",
  },
  {
    emoji: "🧠",
    difficulty: "medium",
    title: "Replace One Negative Thought",
    subtitle: "Transform a limiting belief into a powerful mindset",
    points: "+300 points",
    route: "/negativeThought",
  },
  {
    emoji: "👁️",
    difficulty: "medium",
    title: "Observe Thoughts",
    subtitle: "Relax, observe your thoughts, and find mental calm",
    points: "+300 points",
    route: "/positiveThought",
  },
  {
    emoji: "🍂",
    difficulty: "medium",
    title: "Silence Mind",
    subtitle: "Watch every thought drift away like a leaf in the wind",
    points: "+300 points",
    route: "/silent",
  },
  {
    emoji: "📝",
    difficulty: "medium",
    title: "Write Recurring Thought",
    subtitle: "Pen down persistent thoughts to uncover supportive AI insights",
    points: "+300 points",
    route: "/recurringThought",
  },
  {
    emoji: "🏷️",
    difficulty: "medium",
    title: "Label a Thought",
    subtitle: "Name and categorise your thoughts to establish mindful spacing",
    points: "+300 points",
    route: "/label",
  },
  {
    emoji: "📷",
    difficulty: "medium",
    title: "Brain vs Camera",
    subtitle: "Separate objective observation facts from narrative brain stories",
    points: "+300 points",
    route: "/imagnimation",
  },
  {
    emoji: "🌙",
    difficulty: "hard",
    title: "Take an hour tech-free break",
    subtitle: "No screens. Just you and the moment.",
    points: "+600 points",
    route: "/tech-break-task",
  },
  {
    emoji: "🧑‍🤝‍🧑",
    difficulty: "hard",
    title: "Meet one friend in real life",
    subtitle: "A walk, a coffee — in person counts.",
    points: "+600 points",
    route: "/meet-task",
  },
  {
    emoji: "🤝",
    difficulty: "hard",
    title: "Help someone offline",
    subtitle: "Uplift",
    points: "+600 points",
    route: "/help-intro",
  },
  {
    emoji: "🫂",
    difficulty: "hard",
    title: "Volunteer for 1 hour",
    subtitle: "Dedicate",
    points: "+600 points",
    route: "/volunteer-interest",
  },
  {
    emoji: "🦁",
    difficulty: "hard",
    title: "Do One Uncomfortable Thing",
    subtitle: "Growth happens outside your comfort zone.",
    points: "+600 points",
    route: "/uncomfortable-task",
  },
  {
    emoji: "🪨",
    difficulty: "hard",
    title: "Sit with Discomfort",
    subtitle: "Instead of reaching for your phone, sit with whatever you're feeling.",
    points: "+600 points",
    route: "/discomfort-task",
  },
  {
    emoji: "👁️",
    difficulty: "hard",
    title: "Observe Fear Response",
    subtitle: "Fear is a natural emotion. Instead of reacting immediately, learn to observe it.",
    points: "+600 points",
    route: "/fear-task",
  },
  {
    emoji: "🌍",
    difficulty: "hard",
    title: "Organise a cleanup drive",
    subtitle: "Local Impact",
    points: "+600 points",
    route: "/cleanup-task",
  },
  {
    emoji: "🚗",
    difficulty: "hard",
    title: "Plan one day group trip",
    subtitle: "Adventure Time",
    points: "+600 points",
    route: "/group-trip",
  },
];

const difficultyMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

// Sorted once at module load — every consumer (Task page, Dog widget) shares
// this exact ordering, which is what the bucket math below is built on.
export const sortedTasksData: JourneyTask[] = [...tasksData].sort((a, b) => {
  const diffA = (a.difficulty || "easy").toString().toLowerCase().trim();
  const diffB = (b.difficulty || "easy").toString().toLowerCase().trim();
  const orderA = difficultyMap[diffA] ?? 4;
  const orderB = difficultyMap[diffB] ?? 4;
  if (orderA !== orderB) return orderA - orderB;
  return 0; // Preserves original relative order within same difficulty
});

const totalTasks = sortedTasksData.length;
export const maxBucketIndex = Math.floor((MAX_DAY - 1) / TASKS_PER_BUCKET);

// Same fuzzy-match rules used across the app to decide "is this task done" from
// the backend's completedTasks title list (the single source of truth from
// pointsStreakService / /api/home).
export function isTaskTitleCompleted(taskTitle: string, completedTasks: string[] | undefined | null): boolean {
  if (!Array.isArray(completedTasks)) return false;
  const tt = String(taskTitle).toLowerCase().trim();
  return completedTasks.some((t) => {
    if (!t) return false;
    const ct = String(t).toLowerCase().trim();
    return (
      ct === tt ||
      (ct.includes("drink") && tt.includes("drink")) ||
      (ct.includes("water") && tt.includes("water")) ||
      (ct.includes("grounding") && tt.includes("grounding")) ||
      (ct.includes("breathe") && tt.includes("breathe") && !tt.includes("grounding") && !ct.includes("grounding")) ||
      (ct.includes("stretch") && tt.includes("stretch")) ||
      (ct.includes("smile") && tt.includes("smile")) ||
      (ct.includes("silent") && tt.includes("silent")) ||
      (ct.includes("reflect") && tt.includes("reflect")) ||
      (ct.includes("courage") && tt.includes("courage")) ||
      (ct.includes("fear") && tt.includes("fear")) ||
      (ct.includes("distraction") && tt.includes("distraction")) ||
      (ct.includes("eye") && tt.includes("eye")) ||
      (ct.includes("rest") && tt.includes("rest")) ||
      (ct.includes("walk") && tt.includes("walk"))
    );
  });
}

// Returns the 7 tasks belonging to a given day-bucket (bucket 0 = Day 1-7,
// bucket 1 = Day 8-14, ...). Wraps via modulo once the flat task list is
// exhausted, matching the journey's existing 100-day bucket math.
export function getBucketTasks(bucketIndex: number): JourneyTask[] {
  if (totalTasks === 0) return [];
  const startIndex = (bucketIndex * TASKS_PER_BUCKET) % totalTasks;
  const items: JourneyTask[] = [];
  for (let i = 0; i < TASKS_PER_BUCKET; i++) {
    items.push(sortedTasksData[(startIndex + i) % totalTasks]);
  }
  return items;
}

// A bucket (day) is complete only when ALL 7 of its tasks are completed.
export function isBucketComplete(bucketIndex: number, completedTasks: string[] | undefined | null): boolean {
  const bucketTasks = getBucketTasks(bucketIndex);
  if (bucketTasks.length === 0) return false;
  return bucketTasks.every((t) => isTaskTitleCompleted(t.title, completedTasks));
}

// Highest day-bucket reachable given completion of every prior bucket's 7 tasks.
// Bucket 0 (Day 1) is always unlocked. This is the one generic mechanism that
// drives "current day" everywhere in the app — the Task page, the Dog widget,
// and progress displays all call this instead of hardcoding per-day logic.
export function getHighestUnlockedBucketIndex(completedTasks: string[] | undefined | null): number {
  let idx = 0;
  while (idx < maxBucketIndex && isBucketComplete(idx, completedTasks)) {
    idx++;
  }
  return idx;
}

export function isDayUnlocked(day: number, completedTasks: string[] | undefined | null): boolean {
  return Math.floor((day - 1) / TASKS_PER_BUCKET) <= getHighestUnlockedBucketIndex(completedTasks);
}
