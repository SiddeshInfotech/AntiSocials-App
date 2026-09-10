import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../constants/Api";
import { resolveAvatarUrl, resolveStoryMediaUrl } from "../constants/ImageUtils";
import { useVideoPlayer, VideoView } from "expo-video";

function PostVideoPlayer({ uri, isSquare }: { uri: string; isSquare?: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  return (
    <VideoView
      style={{
        width: "100%",
        aspectRatio: isSquare ? 1 : 4 / 5,
        borderRadius: 14,
      }}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export interface PostType {
  id: string | number;
  user_id: string | number;
  username: string;
  display_name?: string;
  profile_image?: string | null;
  main_category: string;
  subcategory: string;
  caption?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  media_format?: "portrait" | "square" | string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked_by_user?: boolean;
}

interface PostCardProps {
  post: PostType;
  currentUserId?: string | number | null;
  onLikeToggle?: (postId: string | number, isLiked: boolean, newCount: number) => void;
  onOpenComments?: (post: PostType) => void;
  onDeleteSuccess?: (postId: string | number) => void;
}

export default function PostCard({
  post,
  currentUserId,
  onLikeToggle,
  onOpenComments,
  onDeleteSuccess,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState<boolean>(!!post.is_liked_by_user);
  const [likesCount, setLikesCount] = useState<number>(post.likes_count ?? 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count ?? 0);
  const [sharesCount, setSharesCount] = useState<number>(post.shares_count ?? 0);
  const [likeInProgress, setLikeInProgress] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isOwner = currentUserId && String(currentUserId) === String(post.user_id);

  const [mediaError, setMediaError] = useState<boolean>(false);

  useEffect(() => {
    setIsLiked(!!post.is_liked_by_user);
    setLikesCount(post.likes_count ?? 0);
    setCommentsCount(post.comments_count ?? 0);
    setSharesCount(post.shares_count ?? 0);
    setMediaError(false);
  }, [post.is_liked_by_user, post.likes_count, post.comments_count, post.shares_count, post.media_url]);

  const handleLikePress = async () => {
    if (likeInProgress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextLiked = !isLiked;
      const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

      setIsLiked(nextLiked);
      setLikesCount(nextCount);
      setLikeInProgress(true);

      if (onLikeToggle) {
        onLikeToggle(post.id, nextLiked, nextCount);
      }

      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const res = await apiFetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(!!data.is_liked);
        setLikesCount(data.likes_count);
      }
    } catch (e) {
      console.error("Error liking post:", e);
    } finally {
      setLikeInProgress(false);
    }
  };

  const handleSharePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const shareMessage = `${post.caption ? post.caption + " - " : ""}AntiSocials Community (${post.main_category} · ${post.subcategory})`;
      const result = await Share.share({
        message: shareMessage,
      });

      if (result.action === Share.sharedAction) {
        const newCount = sharesCount + 1;
        setSharesCount(newCount);

        const token = await SecureStore.getItemAsync("token");
        if (token) {
          apiFetch(`/api/posts/${post.id}/share`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch((err) => console.error("Share record error:", err));
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const confirmDeletePost = () => {
    setShowMoreMenu(false);
    Alert.alert("Delete post?", "This post will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: executeDeletePost,
      },
    ]);
  };

  const executeDeletePost = async () => {
    try {
      setIsDeleting(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const res = await apiFetch(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (onDeleteSuccess) {
          onDeleteSuccess(post.id);
        }
      } else {
        const data = await res.json();
        Alert.alert("Delete Failed", data.error || "Could not delete post.");
      }
    } catch (e) {
      console.error("Error deleting post:", e);
      Alert.alert("Error", "Could not delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Row: User Avatar, Name, Time, Category, More Menu */}
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: resolveAvatarUrl(post.profile_image) }}
          style={styles.authorAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{post.display_name || post.username || "User"}</Text>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {post.main_category} · {post.subcategory}
              </Text>
            </View>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
          </View>
        </View>

        {/* 3-Dot More Menu Button (ONLY for Owner) */}
        {isOwner && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setShowMoreMenu(true)}
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Caption Content */}
      {post.caption && post.caption.trim().length > 0 && (
        <Text style={styles.captionText}>{post.caption}</Text>
      )}

      {/* Attached Media Image / Video */}
      {(() => {
        if (mediaError) return null;
        const resolvedMedia = resolveStoryMediaUrl(post.media_url);
        if (!resolvedMedia) return null;
        const isVideo =
          post.media_type === "video" ||
          (typeof post.media_url === "string" &&
            (post.media_url.toLowerCase().endsWith(".mp4") || post.media_url.toLowerCase().endsWith(".mov")));

        const isSquare = post.media_format === "square";

        return (
          <View style={styles.mediaWrap}>
            {isVideo ? (
              <PostVideoPlayer uri={resolvedMedia} isSquare={isSquare} />
            ) : (
              <Image
                source={{ uri: resolvedMedia }}
                style={isSquare ? styles.mediaImageSquare : styles.mediaImagePortrait}
                resizeMode="cover"
                onError={() => {
                  console.warn(`[PostCard] Failed to load image at: ${resolvedMedia}`);
                  setMediaError(true);
                }}
              />
            )}
          </View>
        );
      })()}

      {/* Interactive Action Bar: Like, Comment, Share */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#f43f5e" : "#a1a1aa"}
          />
          <Text style={[styles.actionCountText, isLiked && styles.actionCountLiked]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onOpenComments && onOpenComments(post)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={19} color="#a1a1aa" />
          <Text style={styles.actionCountText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSharePress}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#a1a1aa" />
          <Text style={styles.actionCountText}>{sharesCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Owner More Options Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.moreMenuCard}>
            <TouchableOpacity
              style={styles.deleteOptionBtn}
              activeOpacity={0.8}
              onPress={confirmDeletePost}
            >
              <Feather name="trash-2" size={18} color="#ef4444" style={{ marginRight: 10 }} />
              <Text style={styles.deleteOptionText}>Delete Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelOptionBtn}
              onPress={() => setShowMoreMenu(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "rgba(24, 24, 27, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272a",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    borderColor: "rgba(236, 72, 153, 0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: "#ec4899",
    fontSize: 11,
    fontWeight: "600",
  },
  dotSeparator: {
    color: "#71717a",
    fontSize: 12,
    marginHorizontal: 6,
  },
  timeText: {
    color: "#71717a",
    fontSize: 12,
  },
  moreBtn: {
    padding: 6,
  },
  captionText: {
    color: "#F4F4F5",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    width: "100%",
    backgroundColor: "#09090b",
  },
  mediaImagePortrait: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 14,
  },
  mediaImageSquare: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionCountText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  actionCountLiked: {
    color: "#f43f5e",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  moreMenuCard: {
    width: "90%",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
  },
  deleteOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  deleteOptionText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelOptionBtn: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelOptionText: {
    color: "#a1a1aa",
    fontSize: 15,
    fontWeight: "600",
  },
});
