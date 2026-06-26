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

export default function TasksJourneySection({ completedTasks = [] }: { completedTasks?: string[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("100-Day Journey");
  const [activePrototype, setActivePrototype] = useState(1);

  const prototypeDays = Array.from({ length: 100 }, (_, index) => index + 1);

  const stageLabels = [
    { title: "Habits", icon: "calendar", color: "#16a34a" },
    { title: "Social", icon: "heart", color: "#2563eb" },
    { title: "Community", icon: "users", color: "#9333ea" },
    { title: "Leadership", icon: "sun", color: "#ea580c" },
  ] as const;

  const getStageForDay = (day: number) => {
    const stageIndex = Math.min(Math.floor((day - 1) / 7), stageLabels.length - 1);
    const startDay = stageIndex * 7 + 1;
    const endDay = Math.min(startDay + 6, 100);
    const stage = stageLabels[stageIndex];

    return {
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
      emoji: "🫁",
      difficulty: "easy",
      title: "Breathe consciously for 3 minutes",
      subtitle: "Guided breathing animation + timer",
      points: "+100 points",
      route: "/breath-task",
    },
    {
      emoji: "💧",
      difficulty: "easy",
      title: "Drink a glass of water mindfully",
      subtitle: "60s timer + confirm",
      points: "+150 points",
      route: "/drink-task",
    },
    {
      emoji: "🤫",
      difficulty: "medium",
      title: "Sit without phone for 2 minutes",
      subtitle: "Lock-screen mode",
      points: "+200 points",
      route: "/start-task",
    },
    {
      emoji: "🧘‍♀️",
      difficulty: "medium",
      title: "Stretch neck & shoulders",
      subtitle: "Animation + timer",
      points: "+250 points",
      route: "/start-exercise",
    },
    {
      emoji: "👀",
      difficulty: "easy",
      title: "Look outside for 2 minutes",
      subtitle: "Timer",
      points: "+150 points",
      route: "/outside-task",
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
      points: "+400 points",
      route: "/call-friend",
    },
    {
      emoji: "🤝",
      difficulty: "medium",
      title: "Spend 20 minutes offline with someone",
      subtitle: "Be present with a real person",
      points: "+500 points",
      route: "/offline-time",
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
      points: "+700 points",
      route: "/meet-task",
    },
    {
      emoji: "🤝",
      difficulty: "hard",
      title: "Help someone offline",
      subtitle: "Uplift",
      points: "+200 points",
      route: "/help-intro",
    },
    {
      emoji: "🫂",
      difficulty: "hard",
      title: "Volunteer for 1 hour",
      subtitle: "Dedicate",
      points: "+200 points",
      route: "/volunteer-interest",
    },
    {
      emoji: "🌍",
      difficulty: "ultra",
      title: "Organise a cleanup drive",
      subtitle: "Local Impact",
      points: "+1000 points",
      route: "/cleanup-task",
    },
    {
      emoji: "🚗",
      difficulty: "ultra",
      title: "Plan one day group trip",
      subtitle: "Adventure Time",
      points: "+1200 points",
      route: "/group-trip",
    },
  ];

  const activeTaskBucketIndex = Math.floor((activePrototype - 1) / 7);
  const activeTaskStart = activeTaskBucketIndex * 7;
  const activeTaskEnd = activeTaskStart + 7;
  const visibleTasks = tasksData.slice(activeTaskStart, activeTaskEnd);
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

      {/* TASKS LIST */}
      <View style={styles.tasksListContainer}>
        {visibleTasks.map((task, idx) => {
          const isCompleted = completedTasks.includes(task.title);
          return (
            <TouchableOpacity
              key={`${visibleTaskStartDay}-${idx}`}
              style={[styles.taskCard, isCompleted && { opacity: 0.6, backgroundColor: '#f9fafb' }]}
              activeOpacity={0.7}
              disabled={isCompleted}
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
              <Text style={styles.taskEmoji}>{task.emoji}</Text>
              <View style={styles.taskCardContent}>
                <View
                  style={[
                    styles.difficultyPill,
                    {
                      backgroundColor:
                        task.difficulty === "easy"
                          ? "#dcfce7"
                          : task.difficulty === "hard"
                            ? "#fee2e2"
                            : "#fef08a",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          task.difficulty === "easy"
                            ? "#16a34a"
                            : task.difficulty === "hard"
                              ? "#dc2626"
                              : "#ca8a04",
                      },
                    ]}
                  >
                    {task.difficulty}
                  </Text>
                </View>
                <Text style={[styles.taskTitle, isCompleted && { textDecorationLine: 'line-through', color: '#9ca3af' }]}>{task.title}</Text>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                <View style={styles.taskBottomRow}>
                  <Text style={[styles.taskPoints, isCompleted && { color: '#16a34a', fontWeight: 'bold' }]}>
                    {isCompleted ? "✓ Completed" : task.points}
                  </Text>
                  {!task.route && !isCompleted && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>🔒 Coming Soon</Text>
                    </View>
                  )}
                </View>
              </View>
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
});
