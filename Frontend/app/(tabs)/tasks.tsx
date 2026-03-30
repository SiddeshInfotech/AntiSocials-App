import React, { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("100-Day Journey");
  const [activePrototype, setActivePrototype] = useState("Day 1");

  const tasksData = [
    {
      emoji: "🫁",
      difficulty: "easy",
      title: "Breathe consciously for 3 minutes",
      subtitle: "Guided breathing animation + timer",
      points: "+100 points",
      route: "/task-detail",
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
      route: "",
    },
    {
      emoji: "🧑‍🤝‍🧑",
      difficulty: "hard",
      title: "Meet one friend in real life",
      subtitle: "A walk, a coffee — in person counts.",
      points: "+700 points",
      route: "",
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
  ];

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" />}

      {/* HEADER SECTION WITH GRADIENT */}
      <View style={{ width: "100%", backgroundColor: "#fafafa" }}>
        <LinearGradient
          colors={["#4f46e5", "#9333ea"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingHorizontal: 20,
            paddingBottom: 25,
          }}
        >
          <Text style={styles.headerTitle}>Your Journey</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame-outline" size={24} color="#FBBF24" style={{ marginBottom: 5 }} />
              <Text style={styles.statValue}>1 day</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy-outline" size={24} color="#FBBF24" style={{ marginBottom: 5 }} />
              <Text style={styles.statValue}>200</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>

          {/* Unlock Progress */}
          <View style={styles.unlockCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={styles.unlockTitle}>Next Unlock: Join Events</Text>
              <Feather name="lock" size={14} color="#ffffff" />
            </View>
            <View style={styles.unlockProgressBarBg}>
              <View style={[styles.unlockProgressBarFill, { width: "5%" }]} />
            </View>
            <Text style={styles.unlockSubtitle}>4,800 points needed • ~20 days with streaks</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, backgroundColor: "#fafafa" }}>
        
        {/* TOP TAB BAR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topTabBar}>
          {["100-Day Journey", "Monthly Buckets", "Lifetime"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.topTabItem, activeTab === tab && styles.topTabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
               {tab === "100-Day Journey" && <Feather name="calendar" size={14} color={activeTab === tab ? "#fff" : "#6b7280"} style={{marginRight: 6}}/>}
               {tab === "Monthly Buckets" && <MaterialCommunityIcons name="target" size={14} color={activeTab === tab ? "#fff" : "#6b7280"} style={{marginRight: 6}}/>}
               {tab === "Lifetime" && <Ionicons name="infinite" size={16} color={activeTab === tab ? "#fff" : "#6b7280"} style={{marginRight: 6}}/>}
               <Text style={[styles.topTabLabel, activeTab === tab && styles.topTabLabelActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* STREAK WARNING CARD */}
        <View style={styles.streakWarningCard}>
           <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
             <View style={{ flexDirection: "row", alignItems: "center" }}>
               <Feather name="alert-circle" size={18} color="#ea580c" />
               <Text style={styles.streakWarningTitle}>Complete 1 task to maintain streak</Text>
             </View>
             <Text style={styles.streakCount}>0/3</Text>
           </View>
           
           <View style={styles.streakBarsRow}>
             <View style={styles.streakBarItem} />
             <View style={styles.streakBarItem} />
             <View style={styles.streakBarItem} />
           </View>
           
           <Text style={styles.streakSubtext}>Complete at least 1 task. Up to 3 tasks for bonus points.</Text>
        </View>

        {/* PROTOTYPE TABS */}
        <View style={styles.prototypeContainer}>
          <Text style={styles.prototypeLabel}>Prototype: Test Different Days</Text>
          <View style={styles.prototypeTabsRow}>
             {[
               { name: "Day 1", colorbg: "#dcfce7", colortxt: "#16a34a" },
               { name: "Day 25", colorbg: "#dbeafe", colortxt: "#2563eb" },
               { name: "Day 45", colorbg: "#f3e8ff", colortxt: "#9333ea" },
               { name: "Day 75", colorbg: "#ffedd5", colortxt: "#ea580c" }
             ].map(pt => (
               <TouchableOpacity 
                  key={pt.name} 
                  onPress={() => setActivePrototype(pt.name)} 
                  style={[
                    styles.ptTab, 
                    { 
                      backgroundColor: activePrototype === pt.name ? pt.colorbg : "transparent", 
                      borderColor: activePrototype === pt.name ? "transparent" : "#e5e7eb" 
                    }
                  ]}
                >
                 <Text style={[styles.ptTabText, { color: activePrototype === pt.name ? pt.colortxt : "#9ca3af" }]}>{pt.name}</Text>
               </TouchableOpacity>
             ))}
          </View>
        </View>

        {/* DAY 1 OF 100 CARD */}
        <View style={styles.dayBigCard}>
           <View style={styles.dayBigRow}>
             <View style={styles.dayBigCircle}>
               <Text style={styles.dayBigCircleText}>1</Text>
             </View>
             <View style={{ flex: 1, marginLeft: 16 }}>
               <Text style={styles.dayBigTitle}>Day 1 of 100</Text>
               <Text style={styles.dayBigSubtitle}>Stage 1: Habit Foundation</Text>
               <View style={styles.dayBigProgressBg}>
                 <View style={[styles.dayBigProgressFill, { width: "2%" }]} />
               </View>
             </View>
           </View>
           
           <View style={styles.stageTabsRow}>
             <View style={styles.stageTabActive}>
                <Feather name="calendar" size={16} color="#16a34a" style={{marginBottom:4}} />
                <Text style={styles.stageTabActiveTitle}>Day 1-21</Text>
                <Text style={styles.stageTabActiveDesc}>Habits</Text>
             </View>
             <View style={styles.stageTabInactive}>
                <Feather name="heart" size={16} color="#d1d5db" style={{marginBottom:4}} />
                <Text style={styles.stageTabInactiveTitle}>Day 22-40</Text>
                <Text style={styles.stageTabInactiveDesc}>Social</Text>
             </View>
             <View style={styles.stageTabInactive}>
                <Feather name="users" size={16} color="#d1d5db" style={{marginBottom:4}} />
                <Text style={styles.stageTabInactiveTitle}>Day 41-70</Text>
                <Text style={styles.stageTabInactiveDesc}>Community</Text>
             </View>
             <View style={styles.stageTabInactive}>
                <Feather name="sun" size={16} color="#d1d5db" style={{marginBottom:4}} />
                <Text style={styles.stageTabInactiveTitle}>Day 71-100</Text>
                <Text style={styles.stageTabInactiveDesc}>Leadership</Text>
             </View>
           </View>
        </View>

        {/* TODAY'S TASKS HEADER */}
        <View style={styles.tasksHeaderRow}>
          <Text style={styles.tasksHeaderTitle}>Today's Tasks</Text>
          <View style={styles.pickTasksPill}>
            <Text style={styles.pickTasksPillText}>Pick 1-3 tasks</Text>
          </View>
        </View>

        {/* STAGE INFO BOX */}
        <View style={styles.stageInfoBox}>
          <Text style={styles.stageInfoTitle}>Stage 1: Habit Foundation</Text>
          <Text style={styles.stageInfoDesc}>
            Build self-awareness and discipline through simple daily actions. No photos, no social pressure—just you showing up for yourself.
          </Text>
        </View>

        {/* TASKS LIST */}
        <View style={styles.tasksListContainer}>
          {tasksData.map((task, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.taskCard}
              activeOpacity={0.7}
              onPress={() => {
                if (task.route) {
                  router.push(task.route as any);
                }
                else if (task.title.includes('Volunteer')) {
                  router.push("/volunteer-interest" as any);
                }
                else if (task.title.includes('Help someone')) {
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
                        task.difficulty === "easy" ? "#dcfce7" :
                        task.difficulty === "hard" ? "#fee2e2" : "#fef08a",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          task.difficulty === "easy" ? "#16a34a" :
                          task.difficulty === "hard" ? "#dc2626" : "#ca8a04",
                      },
                    ]}
                  >
                    {task.difficulty}
                  </Text>
                </View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                <View style={styles.taskBottomRow}>
                  <Text style={styles.taskPoints}>{task.points}</Text>
                  {!task.route && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>🔒 Coming Soon</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },

  unlockCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
  },
  unlockTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  unlockProgressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginVertical: 10,
  },
  unlockProgressBarFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  unlockSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
  },

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
    textAlign: "center"
  },
  stageTabActiveDesc: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "bold",
    textAlign: "center"
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
    textAlign: "center"
  },
  stageTabInactiveDesc: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center"
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
    color: "#111827"
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
    color: "#111827"
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
    fontWeight: "500"
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
