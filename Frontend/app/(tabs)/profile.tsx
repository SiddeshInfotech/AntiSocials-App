import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import * as SecureStore from 'expo-secure-store';
import LifeDomainsChart from "../../components/LifeDomainsChart";
import { API_BASE_URL } from "../../constants/Api";

export default function ProfileScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isFocused) return; // 👈 Critical: Stop background tabs from redirecting!

      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          console.log("No token found, redirecting to Welcome...");
          router.replace("/welcome" as any);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          await SecureStore.setItemAsync('userId', data.id.toString());
        } else {
          console.error("Profile fetch failed. Status:", response.status);
          if (response.status === 401 || response.status === 403) {
            console.warn("Session expired. Please log out and log in again manually.");
          }
        }
      } catch (err) {
        console.error("Profile network error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isFocused]);

  const handleLogout = async () => {
    console.log("Logout button pressed");
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            console.log("Executing logout cleanup...");
            try {
              await SecureStore.deleteItemAsync('token');
              await SecureStore.deleteItemAsync('userId');
              console.log("Storage cleared, forcing redirect to unique welcome screen...");
              
              // Use a slight timeout to ensure SecureStore finishes
              setTimeout(() => {
                router.replace("/welcome" as any);
              }, 100);
            } catch (err) {
              console.error("Logout storage error:", err);
              // Fallback redirect even if storage clearing fails
              router.replace("/" as any);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B00FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {isFocused && <StatusBar style="light" />}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Purple Header Section */}
        <View style={styles.headerBackground}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              {userData?.image_url ? (
                <Image 
                  source={{ uri: userData.image_url }} 
                  style={{ width: '100%', height: '100%', borderRadius: 45 }} 
                />
              ) : (
                <Feather name="user" size={40} color="#4B2488" />
              )}
            </View>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={12} color="#FFF" />
            </View>
          </View>

          <Text style={styles.userName}>{userData?.username || "Guest User"}</Text>
          <Text style={styles.userHandle}>{userData?.email ? `@${userData.email.split('@')[0]}` : "@handle"}</Text>
          <Text style={styles.userTitle}>{userData?.profession || "Life Explorer"}</Text>
          <Text style={styles.userBio}>{userData?.about || "Taking steps towards a more mindful life."}</Text>
          <Text style={styles.memberSince}>Member since 2025</Text>
        </View>

        <View style={styles.contentContainer}>
          {/* Life Living Rank Card (Overlapping) */}
          <View style={styles.rankCard}>
            <View style={styles.rankHeader}>
              <View>
                <Text style={styles.rankLabel}>Life Living Rank</Text>
                <View style={styles.rankTitleRow}>
                  <Feather
                    name="award"
                    size={24}
                    color="#D97706"
                    style={styles.crownIcon}
                  />
                  <Text style={styles.rankName}>Connector</Text>
                </View>
                <Text style={styles.rankSubtitle}>Real relationships</Text>
              </View>
              <Text style={styles.levelText}>Lvl 4</Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>
              Next: Contributor • Giving back
            </Text>
          </View>

          {/* Your Streaks */}
          <Text style={styles.sectionTitle}>Your Streaks</Text>
          <View style={styles.streaksRow}>
            <View style={[styles.streakBox, { borderColor: "#FED7AA" }]}>
              <Feather
                name="droplet"
                size={24}
                color="#EA580C"
                style={styles.streakIcon}
              />
              <Text style={styles.streakValue}>26</Text>
              <Text style={styles.streakLabel}>Current</Text>
            </View>
            <View style={[styles.streakBox, { borderColor: "#FEF08A" }]}>
              <Feather
                name="award"
                size={24}
                color="#D97706"
                style={styles.streakIcon}
              />
              <Text style={styles.streakValue}>61</Text>
              <Text style={styles.streakLabel}>Best Ever</Text>
            </View>
            <View style={[styles.streakBox, { borderColor: "#BBF7D0" }]}>
              <Feather
                name="trending-up"
                size={24}
                color="#16A34A"
                style={styles.streakIcon}
              />
              <Text style={styles.streakValue}>92%</Text>
              <Text style={styles.streakLabel}>Monthly</Text>
            </View>
          </View>

          {/* Streak Ring Card */}
          <View style={styles.streakRingCard}>
            <View style={styles.ringContainer}>
              {/* Approximating the partial ring with a styled border view */}
              <View style={styles.ringOuter}>
                <Feather name="droplet" size={28} color="#EA580C" />
              </View>
            </View>
            <Text style={styles.ringTitle}>
              <Text style={styles.ringTitleBold}>Consistent</Text> • Gold Ring
            </Text>
            <Text style={styles.ringSubtitle}>
              +25% point bonus • Keep it going!
            </Text>
          </View>

          <LifeDomainsChart />

          {/* Your Activity */}
          <View style={styles.activityCard}>
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 0, paddingHorizontal: 0 },
              ]}
            >
              Your Activity
            </Text>

            <View style={styles.activityRow}>
              <View style={styles.activityRowLeft}>
                <Feather
                  name="calendar"
                  size={20}
                  color="#EA580C"
                  style={styles.activityIcon}
                />
                <Text style={styles.activityText}>Activities Joined</Text>
              </View>
              <Text style={styles.activityValue}>15</Text>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityRowLeft}>
                <Feather
                  name="disc"
                  size={20}
                  color="#16A34A"
                  style={styles.activityIcon}
                />
                <Text style={styles.activityText}>Tasks Completed</Text>
              </View>
              <Text style={styles.activityValue}>127</Text>
            </View>

            <View style={styles.activityRow}>
              <View style={styles.activityRowLeft}>
                <Feather
                  name="users"
                  size={20}
                  color="#3B82F6"
                  style={styles.activityIcon}
                />
                <Text style={styles.activityText}>Connections</Text>
              </View>
              <Text style={styles.activityValue}>48</Text>
            </View>

            <View
              style={[
                styles.activityRow,
                { borderBottomWidth: 0, paddingBottom: 0 },
              ]}
            >
              <View style={styles.activityRowLeft}>
                <Feather
                  name="award"
                  size={20}
                  color="#9333EA"
                  style={styles.activityIcon}
                />
                <Text style={styles.activityText}>Total Points</Text>
              </View>
              <Text style={styles.activityValue}>1,250</Text>
            </View>
          </View>

          {/* Badges */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>🏗️</Text>
              <Text style={styles.badgeText}>21-Day Builder</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>⚔️</Text>
              <Text style={styles.badgeText}>30-Day Warrior</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>🤝</Text>
              <Text style={styles.badgeText}>First Meet</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>👥</Text>
              <Text style={styles.badgeText}>Community\nMember</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>🎯</Text>
              <Text style={styles.badgeText}>Bucket Starter</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>✅</Text>
              <Text style={styles.badgeText}>Verified Human</Text>
            </View>
            <View style={[styles.badgeItem, styles.badgeItemFaded]}>
              <Text style={styles.badgeEmoji}>🦋</Text>
            </View>
            <View style={[styles.badgeItem, styles.badgeItemFaded]}>
              <Text style={styles.badgeEmoji}>🎪</Text>
            </View>
            <View style={[styles.badgeItem, styles.badgeItemFaded]}>
              <Text style={styles.badgeEmoji}>🗺️</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewAllBadges}>
            <Text style={styles.viewAllBadgesText}>View all badges</Text>
            <Feather name="chevron-right" size={16} color="#9333EA" />
          </TouchableOpacity>

          {/* Your Habits */}
          <Text style={styles.sectionTitle}>Your Habits</Text>
          <View style={styles.pillsContainer}>
            {[
              "Morning walks",
              "Meditation",
              "Reading",
              "Gym",
              "Digital detox",
              "Early riser",
              "Healthy eating",
            ].map((habit, index) => (
              <View key={index} style={styles.habitPill}>
                <Text style={styles.habitPillText}>{habit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.visibilityNote}>
            Visible to Tier 1 & 2 connections
          </Text>

          {/* Your Interests */}
          <Text style={styles.sectionTitle}>Your Interests</Text>
          <View style={styles.pillsContainer}>
            {["Cycling", "Cricket", "Meditation & Mindfulness"].map(
              (interest, index) => (
                <View key={index} style={styles.interestPill}>
                  <Text style={styles.interestPillText}>{interest}</Text>
                </View>
              ),
            )}
          </View>

          {/* Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push("/edit-profile" as any)}
            >
              <View style={styles.settingsRowLeft}>
                <Feather
                  name="settings"
                  size={20}
                  color="#6B7280"
                  style={styles.settingsIcon}
                />
                <Text style={styles.settingsText}>Edit Profile</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push("/your-interests" as any)}
            >
              <View style={styles.settingsRowLeft}>
                <Feather
                  name="disc"
                  size={20}
                  color="#6B7280"
                  style={styles.settingsIcon}
                />
                <Text style={styles.settingsText}>Your Interests</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => router.push("/privacy-settings" as any)}
            >
              <View style={styles.settingsRowLeft}>
                <Feather
                  name="settings"
                  size={20}
                  color="#6B7280"
                  style={styles.settingsIcon}
                />
                <Text style={styles.settingsText}>Privacy Settings</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsRow, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/notifications" as any)}
            >
              <View style={styles.settingsRowLeft}>
                <Feather
                  name="settings"
                  size={20}
                  color="#6B7280"
                  style={styles.settingsIcon}
                />
                <Text style={styles.settingsText}>Notifications</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Feather
              name="log-out"
              size={20}
              color="#EF4444"
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerVersion}>AntiSocial v1.0</Text>
            <Text style={styles.footerTagline}>
              Less scrolling. More living.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#8B00FF", // Match header purple to extend to status bar appropriately
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFB",
  },
  headerBackground: {
    backgroundColor: "#8B00FF", // Deep purple
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 80, // Extra padding for overlapping card
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#A855F7",
    borderWidth: 3,
    borderColor: "#C084FC",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#8B00FF",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: "#E9D5FF",
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 14,
    color: "#E9D5FF",
    marginBottom: 12,
  },
  userBio: {
    fontSize: 14,
    color: "#FFFFFF",
    fontStyle: "italic",
    marginBottom: 16,
  },
  memberSince: {
    fontSize: 12,
    color: "#D8B4FE",
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -50, // Overlap the purple header
  },
  rankCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  rankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  rankLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  rankTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  crownIcon: {
    marginRight: 6,
  },
  rankName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  rankSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  levelText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#111827",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    width: "60%",
    height: "100%",
    backgroundColor: "#A855F7",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 16,
    marginTop: 8,
  },
  streaksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  streakBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakIcon: {
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "400",
    color: "#111827",
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  streakRingCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginBottom: 32,
  },
  ringContainer: {
    marginBottom: 12,
  },
  ringOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#EA580C",
    borderTopColor: "#FDBA74",
    justifyContent: "center",
    alignItems: "center",
  },
  ringTitle: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 4,
  },
  ringTitleBold: {
    fontWeight: "600",
  },
  ringSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 24,
    marginRight: 12,
  },
  activityText: {
    fontSize: 16,
    color: "#111827",
  },
  activityValue: {
    fontSize: 18,
    fontWeight: "400",
    color: "#111827",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  badgeItem: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeItemFaded: {
    opacity: 0.5,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: "#111827",
    textAlign: "center",
  },
  viewAllBadges: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  viewAllBadgesText: {
    color: "#9333EA",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  habitPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 12,
  },
  habitPillText: {
    color: "#3B82F6",
    fontSize: 14,
  },
  visibilityNote: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 32,
  },
  interestPill: {
    backgroundColor: "#FAF5FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 12,
  },
  interestPillText: {
    color: "#9333EA",
    fontSize: 14,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsText: {
    fontSize: 16,
    color: "#111827",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerVersion: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});

