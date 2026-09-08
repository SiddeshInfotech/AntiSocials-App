import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../constants/Api";
import { LinearGradient } from "expo-linear-gradient";

export default function MonthlyProgressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const fetchMonthlyData = async (monthStr?: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/welcome" as any);
        return;
      }

      const query = monthStr ? `?month=${monthStr}` : "";
      const res = await apiFetch(`/api/home/monthly-progress${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
        if (!selectedMonth && data.selectedMonth) {
          setSelectedMonth(data.selectedMonth);
        }
      }
    } catch (err) {
      console.error("Fetch monthly-progress error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(selectedMonth);
  }, [selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonthlyData(selectedMonth);
  };

  if (loading && !monthlyData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Loading Monthly Progress...</Text>
      </View>
    );
  }

  const availableMonths = monthlyData?.availableMonths || [];
  const tasksCompleted = monthlyData?.tasksCompleted || 0;
  const pointsEarned = monthlyData?.pointsEarned || 0;
  const activeDays = monthlyData?.activeDays || 0;
  const bestStreak = monthlyData?.bestStreak || 0;
  const calendarHistory = monthlyData?.calendarHistory || [];
  const recentTasks = monthlyData?.recentTasks || [];

  // Format month title e.g. "2026-09" -> "September 2026"
  const formatMonthTitle = (mStr: string) => {
    if (!mStr || !mStr.includes("-")) return mStr;
    const [y, m] = mStr.split("-");
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monthly Progress</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#9333ea"]} />
        }
      >
        {/* MONTH SELECTOR BAR */}
        <View style={styles.monthSelectorContainer}>
          <Text style={styles.monthSelectorLabel}>Select Month</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthPillsRow}
          >
            {availableMonths.map((mStr: string) => {
              const isSelected = mStr === selectedMonth;
              return (
                <TouchableOpacity
                  key={mStr}
                  style={[
                    styles.monthPill,
                    isSelected && styles.monthPillActive,
                  ]}
                  onPress={() => setSelectedMonth(mStr)}
                >
                  <Text
                    style={[
                      styles.monthPillText,
                      isSelected && styles.monthPillTextActive,
                    ]}
                  >
                    {formatMonthTitle(mStr)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* HERO MONTH SUMMARY CARD */}
        <LinearGradient
          colors={["#7e22ce", "#9333ea", "#c026d3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroSubtitle}>SUMMARY FOR</Text>
              <Text style={styles.heroTitle}>{formatMonthTitle(selectedMonth)}</Text>
            </View>
            <View style={styles.targetIconCircle}>
              <MaterialCommunityIcons name="target" size={26} color="#ffffff" />
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{tasksCompleted}</Text>
              <Text style={styles.heroStatLabel}>Tasks Done</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{pointsEarned}</Text>
              <Text style={styles.heroStatLabel}>Points Earned</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{activeDays}</Text>
              <Text style={styles.heroStatLabel}>Active Days</Text>
            </View>
          </View>
        </LinearGradient>

        {/* STATS TILES */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <View style={[styles.tileIconPill, { backgroundColor: "#fef3c7" }]}>
              <Feather name="zap" size={18} color="#d97706" />
            </View>
            <Text style={styles.tileValue}>{bestStreak} Days</Text>
            <Text style={styles.tileLabel}>Best Streak</Text>
          </View>

          <View style={styles.statTile}>
            <View style={[styles.tileIconPill, { backgroundColor: "#f3e8ff" }]}>
              <Feather name="award" size={18} color="#9333ea" />
            </View>
            <Text style={styles.tileValue}>{pointsEarned} pts</Text>
            <Text style={styles.tileLabel}>Monthly Points</Text>
          </View>

          <View style={styles.statTile}>
            <View style={[styles.tileIconPill, { backgroundColor: "#f0fdf4" }]}>
              <Feather name="check-square" size={18} color="#16a34a" />
            </View>
            <Text style={styles.tileValue}>{tasksCompleted}</Text>
            <Text style={styles.tileLabel}>Tasks Finished</Text>
          </View>
        </View>

        {/* CALENDAR HISTORY GRID */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Activity Calendar</Text>
          <Text style={styles.sectionSubtitle}>{formatMonthTitle(selectedMonth)}</Text>
        </View>

        <View style={styles.calendarGrid}>
          {calendarHistory.map((dayItem: any) => {
            const { dayNumber, isActive, tasksCompleted: tCount, pointsEarned: pCount } = dayItem;

            return (
              <View
                key={dayNumber}
                style={[
                  styles.calendarCell,
                  isActive ? styles.calendarCellActive : styles.calendarCellInactive,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayNum,
                    isActive ? styles.calendarDayNumActive : styles.calendarDayNumInactive,
                  ]}
                >
                  {dayNumber}
                </Text>

                {isActive ? (
                  <View style={styles.activeDot}>
                    <Text style={styles.activeDotText}>{tCount || "✓"}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* RECENT MONTHLY TASKS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Monthly History Log</Text>
          <Text style={styles.sectionSubtitle}>{tasksCompleted} Tasks Completed</Text>
        </View>

        {recentTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={32} color="#9ca3af" />
            <Text style={styles.emptyText}>No task activity recorded in {formatMonthTitle(selectedMonth)}</Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {recentTasks.map((t: any, idx: number) => {
              const formattedDate = t.completed_at
                ? new Date(t.completed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Completed";

              return (
                <View key={idx} style={styles.taskLogRow}>
                  <View style={styles.taskLogCheck}>
                    <Feather name="check" size={14} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.taskLogTitle}>{t.task_name}</Text>
                    <Text style={styles.taskLogDate}>{formattedDate}</Text>
                  </View>
                  <Text style={styles.taskLogPoints}>+{t.points || 0} pts</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  refreshButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  monthSelectorContainer: {
    marginBottom: 16,
  },
  monthSelectorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  monthPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  monthPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthPillActive: {
    backgroundColor: "#9333ea",
    borderColor: "#9333ea",
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  monthPillTextActive: {
    color: "#ffffff",
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#9333ea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 2,
  },
  targetIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  heroStatItem: {
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  heroStatLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statTile: {
    width: "31%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  tileIconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  tileLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "center",
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  calendarCell: {
    width: "12%",
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  calendarCellInactive: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  calendarDayNum: {
    fontSize: 12,
    fontWeight: "600",
  },
  calendarDayNumActive: {
    color: "#15803d",
  },
  calendarDayNumInactive: {
    color: "#94a3b8",
  },
  activeDot: {
    marginTop: 2,
  },
  activeDotText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#16a34a",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  tasksList: {
    gap: 8,
  },
  taskLogRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  taskLogCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  taskLogTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  taskLogDate: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  taskLogPoints: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#9333ea",
  },
});
