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
import {
  getBucketTasks,
  isBucketComplete as isJourneyBucketComplete,
  isTaskTitleCompleted as isJourneyTaskTitleCompleted,
  getHighestUnlockedBucketIndex,
  MAX_DAY,
  TASKS_PER_BUCKET,
} from "../constants/JourneyTasks";

export default function TasksJourneySection({ completedTasks = [] }: { completedTasks?: string[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("100-Day Journey");
  const [activePrototype, setActivePrototype] = useState(1);

  const prototypeDays = Array.from({ length: MAX_DAY }, (_, index) => index + 1);

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

  // Day-specific task content and unlock mechanics come from the shared
  // JourneyTasks module — the same source of truth used by the Dog/Home widget,
  // so the Task page and the Dog can never disagree on "day N's 7 tasks".
  const isTaskTitleCompleted = React.useCallback(
    (taskTitle: string) => isJourneyTaskTitleCompleted(taskTitle, completedTasks),
    [completedTasks]
  );

  const isBucketComplete = React.useCallback(
    (bucketIndex: number) => isJourneyBucketComplete(bucketIndex, completedTasks),
    [completedTasks]
  );

  const tasksPerBucket = TASKS_PER_BUCKET;
  const activeTaskBucketIndex = Math.floor((activePrototype - 1) / tasksPerBucket);

  // Highest day-bucket reachable given completion of every prior bucket's 7 tasks.
  const highestUnlockedBucketIndex = React.useMemo(
    () => getHighestUnlockedBucketIndex(completedTasks),
    [completedTasks]
  );

  const isDayUnlocked = React.useCallback(
    (day: number) => Math.floor((day - 1) / tasksPerBucket) <= highestUnlockedBucketIndex,
    [highestUnlockedBucketIndex, tasksPerBucket]
  );

  const visibleTasks = React.useMemo(
    () => getBucketTasks(activeTaskBucketIndex),
    [activeTaskBucketIndex]
  );

  const visibleTaskStartDay = activeTaskBucketIndex * tasksPerBucket + 1;
  const visibleTaskEndDay = Math.min(visibleTaskStartDay + 6, MAX_DAY);
  const isActiveDayLocked = activeTaskBucketIndex > highestUnlockedBucketIndex;
  const prevBucketStartDay = Math.max(1, (activeTaskBucketIndex - 1) * tasksPerBucket + 1);
  const prevBucketEndDay = Math.min(prevBucketStartDay + 6, MAX_DAY);

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
          Your 100-Day Journey
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prototypeTabsRow}
        >
          {prototypeDays.map((day) => {
            const isActive = activePrototype === day;
            const unlocked = isDayUnlocked(day);
            const dayBucketIndex = Math.floor((day - 1) / tasksPerBucket);
            const complete = unlocked && isBucketComplete(dayBucketIndex);
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActivePrototype(day)}
                style={[
                  styles.ptTab,
                  {
                    backgroundColor: isActive ? "#dcfce7" : "transparent",
                    borderColor: isActive ? "transparent" : "#e5e7eb",
                    opacity: unlocked ? 1 : 0.6,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ptTabText,
                    {
                      color: isActive ? "#16a34a" : unlocked ? "#9ca3af" : "#c1c5cb",
                    },
                  ]}
                >
                  {complete ? "✓ " : !unlocked ? "🔒 " : ""}Day {day}
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
        <View style={[styles.pickTasksPill, isActiveDayLocked && styles.lockedPill]}>
          <Text style={[styles.pickTasksPillText, isActiveDayLocked && styles.lockedPillText]}>
            {isActiveDayLocked ? "🔒 Locked" : "Pick 1-3 tasks"}
          </Text>
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
        {isActiveDayLocked ? (
          <View style={styles.lockedDayCard}>
            <Feather name="lock" size={30} color="#9ca3af" />
            <Text style={styles.lockedDayTitle}>
              Day {visibleTaskStartDay}
              {visibleTaskStartDay !== visibleTaskEndDay ? `-${visibleTaskEndDay}` : ""} Locked
            </Text>
            <Text style={styles.lockedDaySubtitle}>
              Complete all {tasksPerBucket} Day {prevBucketStartDay}-{prevBucketEndDay} tasks to unlock this day.
            </Text>
          </View>
        ) : (
        visibleTasks.map((task, idx) => {
          const isCompleted = isTaskTitleCompleted(task.title);
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
        })
        )}
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
  lockedPill: {
    backgroundColor: "#f1f5f9",
  },
  lockedPillText: {
    color: "#64748b",
  },

  lockedDayCard: {
    marginHorizontal: 15,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  lockedDayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center",
  },
  lockedDaySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
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
