import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import StoryCard, { StoryType } from "../../components/StoryCard";
import StoryCommentModal from "../../components/StoryCommentModal";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../../constants/Api";
import { resolveImageUrl } from "../../constants/ImageUtils";

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return "Just now";
    return `${mins}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function StoriesFeed() {
  const isFocused = useIsFocused();
  const [stories, setStories] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comment Modal state
  const [activeCommentStory, setActiveCommentStory] = useState<StoryType | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState<boolean>(false);

  const fetchStories = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const response = await apiFetch("/api/stories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await response.text();
      console.log(`[Stories GET /api/stories] Status: ${response.status}`);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("[Stories JSON Parse Error] Received non-JSON:", text.slice(0, 200));
        return;
      }

      if (response.ok && data.stories) {
        const formattedStories: StoryType[] = (data.stories || []).map((s: any) => ({
          id: s.id.toString(),
          user: {
            name: s.username || "User",
            avatarUrl: resolveImageUrl(s.profile_image),
          },
          time: formatTimeAgo(s.created_at),
          tag: "Story",
          image: resolveImageUrl(s.media_url),
          likes: s.likes_count ?? s.view_count ?? 0,
          likes_count: s.likes_count ?? 0,
          comments_count: s.comments_count ?? 0,
          shares_count: s.shares_count ?? 0,
          isLiked: !!s.is_liked_by_user,
          is_liked_by_user: !!s.is_liked_by_user,
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

  // Optimistic like handler
  const handleLikeToggle = (storyId: string, isLiked: boolean, newCount: number) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              isLiked,
              is_liked_by_user: isLiked,
              likes: newCount,
              likes_count: newCount,
            }
          : s
      )
    );
  };

  // Open comments modal
  const handleOpenComments = (story: StoryType) => {
    setActiveCommentStory(story);
    setCommentModalVisible(true);
  };

  // Comment count update from modal
  const handleCommentsCountChange = (storyId: string, newCount: number) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId ? { ...s, comments_count: newCount } : s
      )
    );
  };

  // Share count update
  const handleShare = (story: StoryType, newShareCount: number) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id ? { ...s, shares_count: newShareCount } : s
      )
    );
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
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onLikeToggle={handleLikeToggle}
            onOpenComments={handleOpenComments}
            onShare={handleShare}
          />
        )}
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

      {/* Story Comments Bottom Sheet Modal */}
      <StoryCommentModal
        visible={commentModalVisible}
        storyId={activeCommentStory?.id || null}
        storyCaption={activeCommentStory?.caption}
        storyAuthor={activeCommentStory?.user.name}
        onClose={() => {
          setCommentModalVisible(false);
          setActiveCommentStory(null);
        }}
        onCommentsCountChange={handleCommentsCountChange}
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
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});


