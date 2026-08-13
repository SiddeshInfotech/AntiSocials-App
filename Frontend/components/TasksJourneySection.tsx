import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function TasksJourneySection({ completedTasks = [] }: { completedTasks?: string[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("100-Day Journey");
  const [activePrototype, setActivePrototype] = useState(1);

  const prototypeDays = Array.from({ length: 100 }, (_, index) => index + 1);

  const stageLabels = [
    { title: "Habits", icon: "calendar", color: "#16a34a" },            // Stage 1 (Day 1-7)
    { title: "Social Presence", icon: "heart", color: "#2563eb" },     // Stage 2 (Day 8-14)
    { title: "Courage", icon: "zap", color: "#dc2626" },              // Stage 3 (Day 15-21)
    { title: "Authentic Voice", icon: "message-circle", color: "#9333ea" }, // Stage 4 (Day 22-28)
    { title: "Community", icon: "users", color: "#0891b2" },           // Stage 5 (Day 29-35)
    { title: "Discomfort Lab", icon: "shield", color: "#d97706" },     // Stage 6 (Day 36-42)
    { title: "Group Rhythm", icon: "eye", color: "#4f46e5" },          // Stage 7 (Day 43-49)
    { title: "Leadership", icon: "compass", color: "#ea580c" },        // Stage 8 (Day 50-56)
    { title: "Deep Curiosity", icon: "globe", color: "#0284c7" },      // Stage 9 (Day 57-63)
    { title: "Emotion Mastery", icon: "anchor", color: "#059669" },    // Stage 10 (Day 64-70)
    { title: "Focus & Presence", icon: "sun", color: "#b45309" },      // Stage 11 (Day 71-77)
    { title: "Inspiring Others", icon: "star", color: "#c026d3" },     // Stage 12 (Day 78-84)
    { title: "Real Impact", icon: "award", color: "#15803d" },         // Stage 13 (Day 85-91)
    { title: "Transformation", icon: "feather", color: "#7c3aed" },    // Stage 14 (Day 92-98)
    { title: "Mastery", icon: "check-circle", color: "#eab308" },      // Stage 15 (Day 99-100)
  ] as const;

  const getStageForDay = (day: number) => {
    const stageIndex = Math.min(Math.floor((day - 1) / 7), stageLabels.length - 1);
    const startDay = stageIndex * 7 + 1;
    const endDay = Math.min(startDay + 6, 100);
    const stage = stageLabels[stageIndex];

    return {
      stageNumber: stageIndex + 1,
      title: `Stage ${stageIndex + 1}: ${stage.title}`,
      label: stage.title,
      icon: stage.icon,
      color: stage.color,
      range: `Day ${startDay}-${endDay}`,
    };
  };

  const activeStage = getStageForDay(activePrototype);
  const stageTabs = Array.from({ length: Math.ceil(100 / 7) }, (_, index) => {
    const startDay = index * 7 + 1;
    const endDay = Math.min(startDay + 6, 100);
    const stageIndex = Math.min(index, stageLabels.length - 1);

    return {
      key: `${startDay}-${endDay}`,
      startDay,
      endDay,
      label: stageLabels[stageIndex].title,
      icon: stageLabels[stageIndex].icon,
      color: stageLabels[stageIndex].color,
    };
  });

  const tasksData = [
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
  const sortedTasksData = React.useMemo(() => {
    return [...tasksData].sort((a, b) => {
      const diffA = (a.difficulty || "easy").toString().toLowerCase().trim();
      const diffB = (b.difficulty || "easy").toString().toLowerCase().trim();
      const orderA = difficultyMap[diffA] ?? 4;
      const orderB = difficultyMap[diffB] ?? 4;
      if (orderA !== orderB) return orderA - orderB;
      return 0; // Preserves original relative order within same difficulty
    });
  }, []);

  const activeTaskBucketIndex = Math.floor((activePrototype - 1) / 7);
  const tasksPerBucket = 7;
  const totalTasks = sortedTasksData.length;

  const visibleTasks = React.useMemo(() => {
    if (totalTasks === 0) return [];
    const startIndex = (activeTaskBucketIndex * tasksPerBucket) % totalTasks;
    const items: typeof tasksData = [];
    for (let i = 0; i < tasksPerBucket; i++) {
      items.push(sortedTasksData[(startIndex + i) % totalTasks]);
    }
    return items;
  }, [sortedTasksData, activeTaskBucketIndex, totalTasks]);

  const visibleTaskStartDay = activeTaskBucketIndex * 7 + 1;
  const visibleTaskEndDay = Math.min(visibleTaskStartDay + 6, 100);

  return (
    <View style={styles.container}>
      {/* TOP TAB BAR */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topTabBar}
      >
        {["100-Day Journey", "Monthly Buckets", "Lifetime"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.topTabItem,
              activeTab === tab && styles.topTabItemActive,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            {tab === "100-Day Journey" && (
              <Feather
                name="calendar"
                size={14}
                color={activeTab === tab ? "#fff" : "#6b7280"}
                style={{ marginRight: 6 }}
              />
            )}
            {tab === "Monthly Buckets" && (
              <MaterialCommunityIcons
                name="target"
                size={14}
                color={activeTab === tab ? "#fff" : "#6b7280"}
                style={{ marginRight: 6 }}
              />
            )}
            {tab === "Lifetime" && (
              <Ionicons
                name="infinite"
                size={16}
                color={activeTab === tab ? "#fff" : "#6b7280"}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              style={[
                styles.topTabLabel,
                activeTab === tab && styles.topTabLabelActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* STREAK WARNING CARD */}
      <View style={styles.streakWarningCard}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="alert-circle" size={18} color="#ea580c" />
            <Text style={styles.streakWarningTitle}>
              Complete 1 task to maintain streak
            </Text>
          </View>
          <Text style={styles.streakCount}>0/3</Text>
        </View>

        <View style={styles.streakBarsRow}>
          <View style={styles.streakBarItem} />
          <View style={styles.streakBarItem} />
          <View style={styles.streakBarItem} />
        </View>

        <Text style={styles.streakSubtext}>
          Complete at least 1 task. Up to 3 tasks for bonus points.
        </Text>
      </View>

      {/* PROTOTYPE TABS */}
      <View style={styles.prototypeContainer}>
        <Text style={styles.prototypeLabel}>
          Prototype: Test Different Days
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prototypeTabsRow}
        >
          {prototypeDays.map((day) => {
            const isActive = activePrototype === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActivePrototype(day)}
                style={[
                  styles.ptTab,
                  {
                    backgroundColor: isActive ? "#dcfce7" : "transparent",
                    borderColor: isActive ? "transparent" : "#e5e7eb",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ptTabText,
                    {
                      color: isActive ? "#16a34a" : "#9ca3af",
                    },
                  ]}
                >
                  Day {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* DAY 1 OF 100 CARD */}
      <View style={styles.dayBigCard}>
        <View style={styles.dayBigRow}>
          <View style={styles.dayBigCircle}>
            <Text style={styles.dayBigCircleText}>{activePrototype}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.dayBigTitle}>Day {activePrototype} of 100</Text>
            <Text style={styles.dayBigSubtitle}>{activeStage.title}</Text>
            <View style={styles.dayBigProgressBg}>
              <View
                style={[
                  styles.dayBigProgressFill,
                  { width: `${Math.max((activePrototype / 100) * 100, 2)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsRow}
        >
          {stageTabs.map((stageTab) => {
            const isActive =
              activePrototype >= stageTab.startDay &&
              activePrototype <= stageTab.endDay;

            return (
              <TouchableOpacity
                key={stageTab.key}
                activeOpacity={0.75}
                onPress={() => setActivePrototype(stageTab.startDay)}
                style={[
                  styles.stageTabInactive,
                  isActive && styles.stageTabActive,
                  { minWidth: 92 },
                ]}
              >
                <Feather
                  name={stageTab.icon as keyof typeof Feather.glyphMap}
                  size={16}
                  color={isActive ? stageTab.color : "#d1d5db"}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={
                    isActive
                      ? styles.stageTabActiveTitle
                      : styles.stageTabInactiveTitle
                  }
                >
                  Day {stageTab.startDay}-{stageTab.endDay}
                </Text>
                <Text
                  style={
                    isActive
                      ? styles.stageTabActiveDesc
                      : styles.stageTabInactiveDesc
                  }
                >
                  {stageTab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* TODAY'S TASKS HEADER */}
      <View style={styles.tasksHeaderRow}>
        <View>
          <Text style={styles.tasksHeaderTitle}>Today's Tasks</Text>
          <Text style={styles.tasksHeaderSubtext}>
            Day {visibleTaskStartDay}-{visibleTaskEndDay}
          </Text>
        </View>
        <View style={styles.pickTasksPill}>
          <Text style={styles.pickTasksPillText}>Pick 1-3 tasks</Text>
        </View>
      </View>

      {/* STAGE INFO BOX */}
      <View style={styles.stageInfoBox}>
        <Text style={styles.stageInfoTitle}>{activeStage.title}</Text>
        <Text style={styles.stageInfoDesc}>
          Build momentum one 7-day block at a time. Each bucket keeps the same
          focus for a week, then moves forward to the next range.
        </Text>
      </View>
      <View style={styles.tasksListContainer}>
        {visibleTasks.map((task, idx) => {
          const isCompleted = Array.isArray(completedTasks) && completedTasks.some(
            (t) => {
              if (!t) return false;
              const ct = String(t).toLowerCase().trim();
              const tt = String(task.title).toLowerCase().trim();
              return ct === tt ||
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
                (ct.includes("walk") && tt.includes("walk"));
            }
          );
          const level = (task.difficulty || "").toString().toLowerCase().trim();
          const isHard = level === "hard";
          const isMedium = level === "medium";

          let badgeBgColor = "#dcfce7";
          let badgeTextColor = "#16a34a";

          if (level === "medium") {
            badgeBgColor = "#fef9c3";
            badgeTextColor = "#ca8a04";
          } else if (level === "hard") {
            badgeBgColor = "#fee2e2";
            badgeTextColor = "#dc2626";
          } else if (level === "easy") {
            badgeBgColor = "#dcfce7";
            badgeTextColor = "#16a34a";
          }

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              disabled={isCompleted}
              style={styles.cardTouch}
              onPress={() => {
                if (task.route) {
                  router.push(task.route as any);
                } else if (task.title.includes("Volunteer")) {
                  router.push("/volunteer-interest" as any);
                } else if (task.title.includes("Help someone")) {
                  router.push("/help-intro" as any);
                }
              }}
            >
              {isHard && !isCompleted ? (
                <LinearGradient
                  colors={['#fffbf0', '#fff3eb', '#fff0f0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.taskCard, styles.hardTaskCard]}
                >
                  <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  <View style={styles.taskCardContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.difficultyPill, styles.hardDifficultyPill]}>
                        <Text style={[styles.difficultyText, styles.hardDifficultyText]}>
                          🔥 {task.difficulty.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.hardBadgeRight}>
                        <Feather name="award" size={11} color="#ea580c" />
                        <Text style={styles.hardPointsText}>{task.points}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                    <View style={styles.taskBottomRow}>
                      <Text style={styles.hardDurationText}>
                        🕒 {task.title.includes("10 min") || task.title === "Do One Uncomfortable Thing" ? "10 min" : task.subtitle.includes("hour") || task.title.includes("hour") ? "1 hour" : "Flexible"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              ) : isMedium && !isCompleted ? (
                <LinearGradient
                  colors={['#fffdf0', '#fefce8', '#fef9c3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.taskCard, styles.mediumTaskCard]}
                >
                  <Text style={styles.taskEmoji}>{task.emoji}</Text>
                  <View style={styles.taskCardContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.difficultyPill, styles.mediumDifficultyPill]}>
                        <Text style={[styles.difficultyText, styles.mediumDifficultyText]}>
                          ⚡ {task.difficulty.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.mediumBadgeRight}>
                        <Feather name="award" size={11} color="#ca8a04" />
                        <Text style={styles.mediumPointsText}>{task.points}</Text>
                      </View>
                    </View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                    <View style={styles.taskBottomRow}>
                      <Text style={styles.mediumDurationText}>
                        🕒 {task.title.includes("10 min") || task.title === "Do One Uncomfortable Thing" ? "10 min" : task.subtitle.includes("hour") || task.title.includes("hour") ? "1 hour" : "Flexible"}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.taskCard, isCompleted && { opacity: 0.75, backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1 }]}>
                  <Text style={styles.taskEmoji}>{isCompleted ? "✅" : task.emoji}</Text>
                  <View style={styles.taskCardContent}>
                    <View
                      style={[
                        styles.difficultyPill,
                        isCompleted ? { backgroundColor: '#dcfce7' } : { backgroundColor: badgeBgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          isCompleted ? { color: '#16a34a' } : { color: badgeTextColor },
                        ]}
                      >
                        {isCompleted ? "COMPLETED" : task.difficulty}
                      </Text>
                    </View>
                    <Text style={[styles.taskTitle, isCompleted && { color: '#15803d', fontWeight: 'bold' }]}>{task.title}</Text>
                    <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                    <View style={styles.taskBottomRow}>
                      <Text style={[styles.taskPoints, isCompleted && { color: '#16a34a', fontWeight: 'bold' }]}>
                        {isCompleted ? "✅ Completed" : task.points}
                      </Text>
                      {!task.route && !isCompleted && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>🔒 Coming Soon</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fafafa" },

  topTabBar: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    alignItems: "center",
  },
  topTabItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  topTabItemActive: {
    backgroundColor: "#9333ea",
  },
  topTabLabel: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  topTabLabelActive: {
    color: "#ffffff",
  },

  streakWarningCard: {
    marginHorizontal: 15,
    backgroundColor: "#fffaf5",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  streakWarningTitle: {
    color: "#ea580c",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  streakCount: {
    color: "#ea580c",
    fontWeight: "bold",
    fontSize: 14,
  },
  streakBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  streakBarItem: {
    flex: 1,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    marginHorizontal: 2,
  },
  streakSubtext: {
    color: "#6b7280",
    fontSize: 11,
  },

  prototypeContainer: {
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 25,
  },
  prototypeLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 10,
  },
  prototypeTabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ptTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  ptTabText: {
    fontSize: 12,
    fontWeight: "600",
  },

  dayBigCard: {
    marginHorizontal: 15,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dayBigRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  dayBigCircle: {
    width: 60,
    height: 60,
    backgroundColor: "#22c55e",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBigCircleText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  dayBigTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  dayBigSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  dayBigProgressBg: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    width: "100%",
  },
  dayBigProgressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 3,
  },

  stageTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  stageTabActive: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    flex: 1,
  },
  stageTabActiveTitle: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  stageTabActiveDesc: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "bold",
    textAlign: "center",
  },
  stageTabInactive: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    flex: 1,
  },
  stageTabInactiveTitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
    textAlign: "center",
  },
  stageTabInactiveDesc: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  tasksHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  tasksHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  tasksHeaderSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  pickTasksPill: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pickTasksPillText: {
    color: "#9333ea",
    fontSize: 12,
    fontWeight: "600",
  },

  stageInfoBox: {
    marginHorizontal: 15,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  stageInfoTitle: {
    color: "#166534",
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 15,
  },
  stageInfoDesc: {
    color: "#15803d",
    fontSize: 13,
    lineHeight: 20,
  },

  tasksListContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  taskEmoji: {
    fontSize: 34,
    marginRight: 15,
  },
  taskCardContent: {
    flex: 1,
  },
  difficultyPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  taskSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  taskPoints: {
    color: "#9333ea",
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
  },
  taskBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    flexWrap: "wrap",
    gap: 8,
  },
  comingSoonBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  comingSoonText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },
  cardTouch: {
    width: "100%",
  },
  hardTaskCard: {
    borderWidth: 1.5,
    borderColor: "#ffe4e6",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hardDifficultyPill: {
    backgroundColor: "#ffe4e6",
    borderColor: "#fca5a5",
    borderWidth: 1,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 0,
  },
  hardDifficultyText: {
    color: "#dc2626",
    fontWeight: "800",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  hardBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
    gap: 4,
  },
  hardPointsText: {
    color: '#ea580c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hardDurationText: {
    color: '#ea580c',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  mediumTaskCard: {
    borderWidth: 1.5,
    borderColor: "#fde047",
    shadowColor: "#eab308",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  mediumDifficultyPill: {
    backgroundColor: "#fef08a",
    borderColor: "#facc15",
    borderWidth: 1,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 0,
  },
  mediumDifficultyText: {
    color: "#a16207",
    fontWeight: "800",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  mediumBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef08a',
    gap: 4,
  },
  mediumPointsText: {
    color: '#ca8a04',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mediumDurationText: {
    color: '#a16207',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
