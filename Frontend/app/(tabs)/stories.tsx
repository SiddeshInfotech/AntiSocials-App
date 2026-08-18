import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import StoryCard, { StoryType } from "../../components/StoryCard";
import StoryCommentModal from "../../components/StoryCommentModal";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../../constants/Api";
import { resolveImageUrl, resolveAvatarUrl, resolveStoryMediaUrl } from "../../constants/ImageUtils";
import { formatTimeAgo, isStoryExpired } from "../../constants/DateUtils";

export default function StoriesFeed() {
  const isFocused = useIsFocused();
  const [stories, setStories] = useState<StoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasOwnStory, setHasOwnStory] = useState(false);

  // Comment Modal state
  const [activeCommentStory, setActiveCommentStory] = useState<StoryType | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState<boolean>(false);

  const fetchStories = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      let currentUserIdStr = await SecureStore.getItemAsync("userId");
      let currentUserId = currentUserIdStr ? parseInt(currentUserIdStr, 10) : null;
      if (!token) return;

      // Fallback: If userId is missing from SecureStore, fetch from /api/profile/me and persist
      if (!currentUserId) {
        try {
          const meRes = await apiFetch("/api/profile/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const retrievedId = meData?.user?.id || meData?.id;
            if (retrievedId) {
              currentUserId = parseInt(retrievedId, 10);
              await SecureStore.setItemAsync("userId", currentUserId.toString());
            }
          }
        } catch (meErr) {
          console.log("Could not fetch /api/profile/me for userId fallback:", meErr);
        }
      }

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

      if (response.ok && Array.isArray(data.stories)) {
        // Filter out stories with missing media URLs
        const validStories = data.stories.filter(
          (s: any) => s && s.media_url && typeof s.media_url === "string" && s.media_url.trim() !== ""
        );

        const userHasActive = currentUserId 
          ? validStories.some((s: any) => Number(s.user_id) === currentUserId)
          : false;
        setHasOwnStory(userHasActive);

        const formattedStories: StoryType[] = validStories.map((s: any) => {
          const resolvedMedia = resolveStoryMediaUrl(s.media_url) || "";
          const resolvedAvatar = resolveAvatarUrl(s.profile_image);
          const isVideo = s.media_type === "video" || (typeof s.media_url === "string" && s.media_url.toLowerCase().endsWith(".mp4"));
          const mediaTypeVal = isVideo ? "video" : "image";

          return {
            id: s.id.toString(),
            user: {
              name: s.display_name || s.username || "User",
              avatarUrl: resolvedAvatar,
            },
            time: formatTimeAgo(s.created_at),
            tag: "Story",
            image: resolvedMedia,
            media_type: mediaTypeVal,
            mediaType: mediaTypeVal,
            likes: s.likes_count ?? s.view_count ?? 0,
            likes_count: s.likes_count ?? 0,
            comments_count: s.comments_count ?? 0,
            shares_count: s.shares_count ?? 0,
            isLiked: !!s.is_liked_by_user,
            is_liked_by_user: !!s.is_liked_by_user,
            caption: s.caption || s.text_content || "",
          };
        });
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

  const handleAddStory = async () => {
    if (hasOwnStory) {
      Alert.alert("Active Story Exists", "You already have an active story.");
      return;
    }
    if (Platform.OS === "web") {
      const choice = window.confirm(
        "Press OK to Upload from Gallery, or Cancel to open Camera.",
      );
      if (choice) {
        pickImage();
      } else {
        openCamera();
      }
    } else {
      Alert.alert("Add Story", "Choose an option to share your moment", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: openCamera },
        { text: "Upload from Gallery", onPress: pickImage },
      ]);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadStory(asset.uri, asset.type === "video" ? "video" : "image");
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera roll access!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      uploadStory(asset.uri, asset.type === "video" ? "video" : "image");
    }
  };

  const uploadStory = async (uri: string, mediaType: "image" | "video") => {
    try {
      setIsUploading(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const filename =
        uri.split("/").pop() || (mediaType === "video" ? "story.mp4" : "story.jpg");
      const match = /\.(\w+)$/.exec(filename);
      const type =
        mediaType === "video"
          ? "video/mp4"
          : match
          ? `image/${match[1]}`
          : `image/jpeg`;

      const formData = new FormData();
      formData.append("image", { uri, name: filename, type } as any);

      console.log("📤 [Stories Tab Upload] Uploading media...");
      const uploadRes = await apiFetch("/upload", {
        method: "POST",
        body: formData,
        timeoutMs: 30000,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.imageUrl) {
        throw new Error(uploadData?.error || "Media upload failed on server");
      }

      const storyPayload = {
        media_url: uploadData.imageUrl,
        media_type: mediaType,
        text_elements: [],
        text_content: null,
        text_position: {},
        caption: "",
      };

      console.log("📤 [Stories Tab Upload] Creating story...");
      const res = await apiFetch("/api/stories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storyPayload),
      });

      const data = await res.json();
      if (res.ok && data.story) {
        const s = data.story;
        const resolvedMedia = resolveStoryMediaUrl(s.media_url) || "";
        const resolvedAvatar = resolveAvatarUrl(s.profile_image);
        const isVideo = s.media_type === "video" || mediaType === "video" || (typeof s.media_url === "string" && s.media_url.toLowerCase().endsWith(".mp4"));
        const mediaTypeVal = isVideo ? "video" : "image";

        const newStory: StoryType = {
          id: s.id.toString(),
          user: {
            name: s.display_name || s.username || "User",
            avatarUrl: resolvedAvatar,
          },
          time: "Just now",
          tag: "Story",
          image: resolvedMedia,
          media_type: mediaTypeVal,
          mediaType: mediaTypeVal,
          likes: 0,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          isLiked: false,
          is_liked_by_user: false,
          caption: s.caption || s.text_content || "",
        };

        // Immediately mark hasOwnStory and prepend newly uploaded story to feed
        setHasOwnStory(true);
        setStories((prev) => [newStory, ...prev.filter((item) => item.id !== newStory.id)]);
        Alert.alert("Success", "Story uploaded successfully!");
        // Refresh feed in background to ensure sync
        fetchStories();
      } else {
        Alert.alert("Upload Blocked", data?.error || "Failed to create story.");
      }
    } catch (e: any) {
      console.error("❌ [Stories Tab Upload Error]:", e);
      Alert.alert("Upload Failed", e?.message || "Failed to upload story.");
    } finally {
      setIsUploading(false);
    }
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
      <View style={styles.headerRightActions}>
        {!hasOwnStory && (
          <TouchableOpacity
            style={styles.addStoryHeaderBtn}
            onPress={handleAddStory}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="plus" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.addStoryHeaderBtnText}>Add Story</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <View style={styles.pointsBadge}>
          <Feather
            name="trending-down"
            size={15}
            color="#9333EA"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.pointsText}>Trending</Text>
        </View>
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
              <Text style={styles.emptyText}>No stories from your network yet.</Text>
              <Text style={styles.emptySubtext}>Connect with people to see what they're sharing.</Text>
              {!hasOwnStory && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={handleAddStory}
                  activeOpacity={0.8}
                >
                  <Feather name="plus-circle" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Share your first story</Text>
                </TouchableOpacity>
              )}
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
    marginBottom: 20,
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
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addStoryHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  addStoryHeaderBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9333EA",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7C3AED",
  },
});


