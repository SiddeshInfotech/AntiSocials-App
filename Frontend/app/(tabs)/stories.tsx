import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import StoryCard, { StoryType } from "../../components/StoryCard";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../../constants/Api";
import { resolveImageUrl } from "../../constants/ImageUtils";

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m ago`;
  }
  return `${hours}h ago`;
};

export default function StoriesFeed() {
  const isFocused = useIsFocused();
  const [stories, setStories] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStories = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const formattedStories: StoryType[] = (data.stories || []).map((s: any) => ({
          id: s.id.toString(),
          user: {
            name: s.username || "User",
            avatarUrl: resolveImageUrl(s.profile_image),
          },
          time: formatTimeAgo(s.created_at),
          tag: "Story",
          image: resolveImageUrl(s.media_url),
          likes: s.view_count || 0,
          caption: s.caption || s.text_content || "",
        }));
        setStories(formattedStories);
      }
    } catch (e) {
      console.error("Fetch stories error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchStories();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStories();
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerTitle}>Stories Feed</Text>
        <Text style={styles.headerSubtitle}>From your connections</Text>
      </View>
      <View style={styles.pointsBadge}>
        <Feather
          name="trending-down"
          size={16}
          color="#9333EA"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.pointsText}>Trending</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {isFocused && <StatusBar style="dark" backgroundColor="#FAFAFA" />}

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StoryCard story={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stories right now.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#6D28D9",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#A855F7",
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9333EA",
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  }
});

