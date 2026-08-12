import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { resolveImageUrl } from "../constants/ImageUtils";
import { apiFetch, API_BASE_URL } from "../constants/Api";

export type StoryType = {
  id: string;
  user: {
    name: string;
    avatarEmoji?: string;
    avatarBg?: string;
    avatarUrl?: string;
  };
  time: string;
  tag: string;
  image: string;
  likes: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  isLiked?: boolean;
  is_liked_by_user?: boolean;
  caption: string;
};

interface StoryCardProps {
  story: StoryType;
  onLikeToggle?: (storyId: string, isLiked: boolean, newCount: number) => void;
  onOpenComments?: (story: StoryType) => void;
  onShare?: (story: StoryType, newShareCount: number) => void;
}

export default function StoryCard({
  story,
  onLikeToggle,
  onOpenComments,
  onShare,
}: StoryCardProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const [avatarError, setAvatarError] = useState(false);

  // Local optimistic state for likes, comments, and shares
  const initialLiked = !!(story.isLiked ?? story.is_liked_by_user);
  const initialLikesCount = story.likes_count ?? story.likes ?? 0;
  const initialCommentsCount = story.comments_count ?? 0;
  const initialSharesCount = story.shares_count ?? 0;

  const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState<number>(initialCommentsCount);
  const [sharesCount, setSharesCount] = useState<number>(initialSharesCount);
  const [likeInProgress, setLikeInProgress] = useState<boolean>(false);

  // Sync state when story props update (e.g. after refresh or comment modal update)
  useEffect(() => {
    setIsLiked(!!(story.isLiked ?? story.is_liked_by_user));
    setLikesCount(story.likes_count ?? story.likes ?? 0);
    setCommentsCount(story.comments_count ?? 0);
    setSharesCount(story.shares_count ?? 0);
  }, [
    story.isLiked,
    story.is_liked_by_user,
    story.likes_count,
    story.likes,
    story.comments_count,
    story.shares_count,
  ]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  // Like / Unlike action with spring animation
  const handleToggleLike = async () => {
    if (likeInProgress) return;

    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

    // Haptic feedback & Bounce animation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Optimistic UI Update
    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    if (onLikeToggle) {
      onLikeToggle(story.id, nextLiked, nextCount);
    }

    try {
      setLikeInProgress(true);
      const token = await SecureStore.getItemAsync("token");
      const path = `/api/stories/${story.id}/like`;
      const method = nextLiked ? "POST" : "DELETE";

      const res = await apiFetch(path, {
        method,
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const text = await res.text();
      console.log(`[Stories ${method} ${path}] status=${res.status}`);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error(`[Like JSON Parse Error] Received non-JSON (status ${res.status}):`, text.slice(0, 200));
        // Rollback
        setIsLiked(!nextLiked);
        setLikesCount(likesCount);
        if (onLikeToggle) {
          onLikeToggle(story.id, !nextLiked, likesCount);
        }
        return;
      }

      if (!res.ok) {
        // Rollback on failure
        setIsLiked(!nextLiked);
        setLikesCount(likesCount);
        if (onLikeToggle) {
          onLikeToggle(story.id, !nextLiked, likesCount);
        }
      } else if (typeof data.likes_count === "number") {
        setLikesCount(data.likes_count);
        if (onLikeToggle) {
          onLikeToggle(story.id, nextLiked, data.likes_count);
        }
      }
    } catch (e) {
      console.error("Like toggle error:", e);
      // Rollback
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
      if (onLikeToggle) {
        onLikeToggle(story.id, !nextLiked, likesCount);
      }
    } finally {
      setLikeInProgress(false);
    }
  };

  // Comment button action
  const handleOpenComments = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onOpenComments) {
      onOpenComments(story);
    }
  };

  // Share button action
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const shareMessage = `${story.user.name}'s AntiSocial story: "${story.caption || "Check out this mindful moment"}"\n\nJoin the AntiSocial community to stay mindful and connected!`;

      const result = await Share.share({
        message: shareMessage,
        title: `Story by ${story.user.name}`,
      });

      if (result.action === Share.sharedAction) {
        // Optimistic share count increase
        const nextShareCount = sharesCount + 1;
        setSharesCount(nextShareCount);
        if (onShare) {
          onShare(story, nextShareCount);
        }

        // Track share on backend
        const token = await SecureStore.getItemAsync("token");
        const path = `/api/stories/${story.id}/share`;
        const res = await apiFetch(path, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        });

        const text = await res.text();
        console.log(`[Stories POST ${path}] status=${res.status}`);

        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error(`[Share JSON Parse Error] Received non-JSON (status ${res.status}):`, text.slice(0, 200));
          return;
        }

        if (res.ok && typeof data.shares_count === "number") {
          setSharesCount(data.shares_count);
          if (onShare) {
            onShare(story, data.shares_count);
          }
        }
      }
    } catch (error: any) {
      console.error("Share story error:", error);
    }
  };
  const resolvedAvatar = resolveImageUrl(story.user.avatarUrl);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardInner}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {story.user.avatarUrl && !avatarError ? (
              <Image
                source={{ uri: resolvedAvatar }}
                style={[styles.avatarCircle, { borderWidth: 0 }]}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: story.user.avatarBg || "#F3E8FF" },
                ]}
              >
                <Text style={styles.avatarEmoji}>
                  {story.user.avatarEmoji || "👤"}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{story.user.name}</Text>
              <Text style={styles.postTime}>{story.time}</Text>
            </View>
          </View>

          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{story.tag}</Text>
          </View>
        </View>

        {/* Story Image */}
        {story.image &&
        !story.image.startsWith("file://") &&
        !story.image.startsWith("data:image") ? (
          <Image
            source={{ uri: story.image }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.storyImage,
              {
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#F3E8FF",
              },
            ]}
          >
            <Feather name="image" size={40} color="#A855F7" />
            <Text style={{ marginTop: 10, color: "#A855F7" }}>
              Update needed
            </Text>
          </View>
        )}

        {/* Footer actions */}
        <View style={styles.footerContainer}>
          <View style={styles.actionsRow}>
            {/* Like Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleLike}
              style={styles.actionBtn}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                {isLiked ? (
                  <Ionicons name="heart" size={24} color="#EF4444" />
                ) : (
                  <Feather name="heart" size={24} color="#A855F7" />
                )}
              </Animated.View>
              <Text
                style={[
                  styles.actionText,
                  isLiked && styles.actionTextLiked,
                ]}
              >
                {likesCount}
              </Text>
            </TouchableOpacity>

            {/* Comment Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenComments}
              style={styles.actionBtn}
            >
              <Feather name="message-circle" size={24} color="#A855F7" />
              {commentsCount > 0 && (
                <Text style={styles.actionText}>{commentsCount}</Text>
              )}
            </TouchableOpacity>

            {/* Share Action */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              style={styles.actionBtn}
            >
              <Feather name="share-2" size={24} color="#A855F7" />
              {sharesCount > 0 && (
                <Text style={styles.actionText}>{sharesCount}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {!!story.caption && (
            <Text style={styles.captionContainer}>
              <Text style={styles.captionUser}>{story.user.name}</Text>{" "}
              <Text style={styles.captionText}>{story.caption}</Text>
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    width: "100%",
  },
  cardInner: {
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6D28D9",
  },
  postTime: {
    fontSize: 13,
    color: "#C084FC",
    marginTop: 2,
  },
  tagBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A855F7",
  },
  storyImage: {
    width: "100%",
    height: width * 1.1,
    backgroundColor: "#F3E8FF",
  },
  footerContainer: {
    padding: 16,
    paddingTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#A855F7",
  },
  actionTextLiked: {
    color: "#EF4444",
  },
  captionContainer: {
    lineHeight: 22,
  },
  captionUser: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6D28D9",
  },
  captionText: {
    fontSize: 15,
    color: "#A855F7",
  },
});

