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

export default function LifetimeProgressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lifetimeData, setLifetimeData] = useState<any>(null);

  const fetchLifetimeData = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/welcome" as any);
        return;
      }

      const res = await apiFetch("/api/home/lifetime-progress", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLifetimeData(data);
      }
    } catch (err) {
      console.error("Fetch lifetime-progress error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLifetimeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLifetimeData();
  };

  if (loading && !lifetimeData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Lifetime Progress...</Text>
      </View>
    );
  }

  const totalTasksCompleted = lifetimeData?.totalTasksCompleted || 0;
  const totalPointsEarned = lifetimeData?.totalPointsEarned || 0;
  const totalActiveDays = lifetimeData?.totalActiveDays || 0;
  const longestStreak = lifetimeData?.longestStreak || 0;
  const totalBadgesEarned = lifetimeData?.totalBadgesEarned || 0;
  const communitiesJoined = lifetimeData?.communitiesJoined || 0;
  const badges = lifetimeData?.badges || [];
  const joinedActivities = lifetimeData?.joinedActivities || [];

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
        <Text style={styles.headerTitle}>Lifetime Progress</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
      >
        {/* HERO LIFETIME CARD */}
        <LinearGradient
          colors={["#1e40af", "#2563eb", "#3b82f6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroSubtitle}>ALL-TIME ACHIEVEMENTS</Text>
              <Text style={styles.heroTitle}>Lifetime Journey</Text>
            </View>
            <View style={styles.infiniteIconCircle}>
              <Ionicons name="infinite" size={30} color="#ffffff" />
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalTasksCompleted.toLocaleString()}</Text>
              <Text style={styles.heroStatLabel}>Tasks</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalPointsEarned.toLocaleString()}</Text>
              <Text style={styles.heroStatLabel}>Points</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{totalActiveDays.toLocaleString()}</Text>
              <Text style={styles.heroStatLabel}>Active Days</Text>
            </View>
          </View>
        </LinearGradient>

        {/* METRICS GRID */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#fff7ed" }]}>
              <Feather name="zap" size={18} color="#ea580c" />
            </View>
            <Text style={styles.metricValue}>{longestStreak} Days</Text>
            <Text style={styles.metricLabel}>Longest Streak</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#fef3c7" }]}>
              <Feather name="award" size={18} color="#d97706" />
            </View>
            <Text style={styles.metricValue}>{totalBadgesEarned}</Text>
            <Text style={styles.metricLabel}>Badges Earned</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#eff6ff" }]}>
              <Feather name="users" size={18} color="#2563eb" />
            </View>
            <Text style={styles.metricValue}>{communitiesJoined}</Text>
            <Text style={styles.metricLabel}>Communities Joined</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconPill, { backgroundColor: "#f0fdf4" }]}>
              <Feather name="shield" size={18} color="#16a34a" />
            </View>
            <Text style={styles.metricValue}>{totalActiveDays} Days</Text>
            <Text style={styles.metricLabel}>Consistency</Text>
          </View>
        </View>

        {/* BADGES & ACHIEVEMENTS */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.sectionTitle}>Badges & Achievements</Text>
              <Text style={styles.sectionSubtitle}>{totalBadgesEarned} Badges Unlocked</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/badges" as any)}>
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {badges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="award" size={32} color="#9ca3af" />
            <Text style={styles.emptyText}>Complete tasks and maintain streaks to earn badges!</Text>
          </View>
        ) : (
          <View style={styles.badgesGrid}>
            {badges.map((b: any, idx: number) => {
              const unlockedDate = b.unlocked_at
                ? new Date(b.unlocked_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                : "Unlocked";

              return (
                <View key={idx} style={styles.badgeItemCard}>
                  <View style={styles.badgeIconCircle}>
                    <Text style={{ fontSize: 24 }}>🏆</Text>
                  </View>
                  <Text style={styles.badgeName}>{b.badge_id || "Achievement"}</Text>
                  <Text style={styles.badgeDate}>{unlockedDate}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* JOINED COMMUNITIES / ACTIVITIES */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Communities & Activities</Text>
          <Text style={styles.sectionSubtitle}>{communitiesJoined} Joined</Text>
        </View>

        {joinedActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={32} color="#9ca3af" />
            <Text style={styles.emptyText}>You haven't joined any community activities yet.</Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {joinedActivities.map((act: any, idx: number) => (
              <View key={idx} style={styles.activityCardRow}>
                <Text style={styles.activityEmoji}>{act.emoji || "🤝"}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityTitle}>{act.title}</Text>
                  <Text style={styles.activityMeta}>{act.category} • {act.location || "Local"}</Text>
                </View>
                <View style={styles.joinedPill}>
                  <Text style={styles.joinedPillText}>Joined</Text>
                </View>
              </View>
            ))}
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
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#2563eb",
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 2,
  },
  infiniteIconCircle: {
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
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
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
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeItemCard: {
    width: "31%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  badgeIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  badgeDate: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  activitiesList: {
    gap: 8,
  },
  activityCardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activityEmoji: {
    fontSize: 26,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  activityMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  joinedPill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
});
