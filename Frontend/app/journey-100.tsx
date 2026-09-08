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
import { Feather, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../constants/Api";
import { LinearGradient } from "expo-linear-gradient";

export default function Journey100Screen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const fetchJourneyData = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/welcome" as any);
        return;
      }

      const res = await apiFetch("/api/home/journey-100", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setJourneyData(data);
      }
    } catch (err) {
      console.error("Fetch journey-100 error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJourneyData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading 100 Days Journey...</Text>
      </View>
    );
  }

  const days = journeyData?.days || [];
  const currentDay = journeyData?.currentDay || 1;
  const progressPercent = journeyData?.progressPercent || 0;
  const totalTasksCompleted = journeyData?.totalTasksCompleted || 0;
  const totalPointsEarned = journeyData?.totalPointsEarned || 0;
  const currentStreak = journeyData?.currentStreak || 0;
  const completedDaysCount = journeyData?.completedDaysCount || 0;

  const filteredDays = selectedStage
    ? days.filter((d: any) => d.stageNumber === selectedStage)
    : days;

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
        <Text style={styles.headerTitle}>100 Days Journey</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
        }
      >
        {/* HERO PROGRESS CARD */}
        <LinearGradient
          colors={["#15803d", "#16a34a", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroBadgeText}>YOUR ROADMAP</Text>
              <Text style={styles.heroDayTitle}>Day {currentDay} of 100</Text>
            </View>
            <View style={styles.heroPercentCircle}>
              <Text style={styles.heroPercentText}>{progressPercent}%</Text>
              <Text style={styles.heroPercentSub}>Progress</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(progressPercent, 3)}%` }]} />
          </View>

          <Text style={styles.heroSubtext}>
            {completedDaysCount} Days completed • {100 - currentDay} Days remaining
          </Text>
        </LinearGradient>

        {/* METRICS GRID */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#fff7ed" }]}>
              <Feather name="zap" size={18} color="#ea580c" />
            </View>
            <Text style={styles.metricValue}>{currentStreak} Days</Text>
            <Text style={styles.metricLabel}>Current Streak</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#f0fdf4" }]}>
              <Feather name="check-circle" size={18} color="#16a34a" />
            </View>
            <Text style={styles.metricValue}>{totalTasksCompleted}</Text>
            <Text style={styles.metricLabel}>Tasks Completed</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#f3e8ff" }]}>
              <Feather name="award" size={18} color="#9333ea" />
            </View>
            <Text style={styles.metricValue}>{totalPointsEarned}</Text>
            <Text style={styles.metricLabel}>Points Earned</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#eff6ff" }]}>
              <Feather name="calendar" size={18} color="#2563eb" />
            </View>
            <Text style={styles.metricValue}>{completedDaysCount}</Text>
            <Text style={styles.metricLabel}>Active Days</Text>
          </View>
        </View>

        {/* STAGE SELECTOR */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Journey Timeline</Text>
          <Text style={styles.sectionSubtitle}>100 Days Chronological</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageFilterBar}
        >
          <TouchableOpacity
            style={[
              styles.stageFilterPill,
              selectedStage === null && styles.stageFilterPillActive,
            ]}
            onPress={() => setSelectedStage(null)}
          >
            <Text
              style={[
                styles.stageFilterText,
                selectedStage === null && styles.stageFilterTextActive,
              ]}
            >
              All Days (100)
            </Text>
          </TouchableOpacity>

          {Array.from({ length: 15 }, (_, i) => i + 1).map((stageNum) => (
            <TouchableOpacity
              key={stageNum}
              style={[
                styles.stageFilterPill,
                selectedStage === stageNum && styles.stageFilterPillActive,
              ]}
              onPress={() => setSelectedStage(stageNum)}
            >
              <Text
                style={[
                  styles.stageFilterText,
                  selectedStage === stageNum && styles.stageFilterTextActive,
                ]}
              >
                Stage {stageNum}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* DAY BY DAY LIST */}
        <View style={styles.daysContainer}>
          {filteredDays.map((dayItem: any) => {
            const { day, stageTitle, isUnlocked, isCompleted, isCurrent } = dayItem;

            let cardBg = "#ffffff";
            let borderColor = "#e5e7eb";
            let statusBadgeBg = "#f3f4f6";
            let statusBadgeText = "#6b7280";
            let statusLabel = "Locked";
            let statusIcon = "lock";

            if (isCompleted) {
              cardBg = "#f0fdf4";
              borderColor = "#bbf7d0";
              statusBadgeBg = "#dcfce7";
              statusBadgeText = "#15803d";
              statusLabel = "Completed";
              statusIcon = "check-circle";
            } else if (isCurrent) {
              cardBg = "#fefce8";
              borderColor = "#fef08a";
              statusBadgeBg = "#fef9c3";
              statusBadgeText = "#ca8a04";
              statusLabel = "Current Day";
              statusIcon = "play";
            } else if (isUnlocked) {
              cardBg = "#ffffff";
              borderColor = "#cbd5e1";
              statusBadgeBg = "#e2e8f0";
              statusBadgeText = "#334155";
              statusLabel = "Unlocked";
              statusIcon = "unlock";
            }

            return (
              <View
                key={day}
                style={[
                  styles.dayRowCard,
                  { backgroundColor: cardBg, borderColor },
                  isCurrent && styles.currentDayHighlight,
                ]}
              >
                <View style={styles.dayCircle}>
                  <Text style={[styles.dayCircleNumber, isCompleted && { color: "#16a34a" }]}>
                    {day}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.dayItemTitle}>Day {day}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
                      <Feather name={statusIcon as any} size={11} color={statusBadgeText} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusBadgeText, { color: statusBadgeText }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.stageTitleText}>{stageTitle}</Text>
                </View>
              </View>
            );
          })}
        </View>
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
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroDayTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  heroPercentCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  heroPercentText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  heroPercentSub: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  heroSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
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
  stageFilterBar: {
    flexDirection: "row",
    paddingBottom: 12,
    gap: 8,
  },
  stageFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  stageFilterPillActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  stageFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  stageFilterTextActive: {
    color: "#ffffff",
  },
  daysContainer: {
    gap: 10,
    marginTop: 6,
  },
  dayRowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  currentDayHighlight: {
    borderWidth: 2,
    borderColor: "#eab308",
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleNumber: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#334155",
  },
  dayItemTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  stageTitleText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
