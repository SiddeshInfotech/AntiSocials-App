import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../constants/Api";
import { resolveImageUrl } from "../constants/ImageUtils";
import { formatTimeAgo as formatCommentTime } from "../constants/DateUtils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface StoryCommentType {
  id: number | string;
  story_id: number | string;
  user_id: number | string;
  comment_text: string;
  created_at: string;
  username: string;
  profile_image?: string | null;
  can_delete?: boolean;
}

interface StoryCommentModalProps {
  visible: boolean;
  storyId: string | null;
  storyCaption?: string;
  storyAuthor?: string;
  onClose: () => void;
  onCommentsCountChange?: (storyId: string, count: number) => void;
}

export default function StoryCommentModal({
  visible,
  storyId,
  storyCaption,
  storyAuthor,
  onClose,
  onCommentsCountChange,
}: StoryCommentModalProps) {
  const [comments, setComments] = useState<StoryCommentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<TextInput | null>(null);

  // Fetch comments whenever modal opens with a valid storyId
  useEffect(() => {
    if (visible && storyId) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText("");
    }
  }, [visible, storyId]);

  const fetchComments = async () => {
    if (!storyId) return;
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      const path = `/api/stories/${storyId}/comments`;

      const res = await apiFetch(path, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const text = await res.text();
      console.log(`[Stories GET ${path}] status=${res.status}`);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error(`[Comments JSON Parse Error] Received non-JSON (status ${res.status}):`, text.slice(0, 200));
        return;
      }

      if (res.ok && data.comments) {
        setComments(data.comments);
        if (onCommentsCountChange) {
          onCommentsCountChange(storyId, data.comments.length);
        }
      }
    } catch (err) {
      console.error("fetchComments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !storyId || submitting) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const token = await SecureStore.getItemAsync("token");

      // Optimistic temporary comment
      const tempId = `temp_${Date.now()}`;
      const optimisticComment: StoryCommentType = {
        id: tempId,
        story_id: storyId,
        user_id: 0,
        comment_text: text,
        created_at: new Date().toISOString(),
        username: "You",
        can_delete: true,
      };

      const updatedList = [...comments, optimisticComment];
      setComments(updatedList);
      setCommentText("");
      if (onCommentsCountChange) {
        onCommentsCountChange(storyId, updatedList.length);
      }

      const path = `/api/stories/${storyId}/comments`;
      const res = await apiFetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ text }),
      });

      const resText = await res.text();
      console.log(`[Stories POST ${path}] status=${res.status}`);

      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (parseErr) {
        console.error(`[SendComment JSON Parse Error] Received non-JSON (status ${res.status}):`, resText.slice(0, 200));
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        if (onCommentsCountChange) {
          onCommentsCountChange(storyId, comments.length);
        }
        return;
      }

      if (res.ok && data.comment) {
        // Replace temporary comment with real response
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? data.comment : c))
        );
        if (onCommentsCountChange && typeof data.comments_count === "number") {
          onCommentsCountChange(storyId, data.comments_count);
        }
      } else {
        // Rollback on error
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        if (onCommentsCountChange) {
          onCommentsCountChange(storyId, comments.length);
        }
        Alert.alert("Error", data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("handleSendComment error:", err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: number | string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Optimistic removal
            const previousComments = [...comments];
            const updated = comments.filter((c) => c.id !== commentId);
            setComments(updated);
            if (onCommentsCountChange && storyId) {
              onCommentsCountChange(storyId, updated.length);
            }

            const token = await SecureStore.getItemAsync("token");
            const path = `/api/comments/${commentId}`;
            const res = await apiFetch(path, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token || ""}`,
              },
            });

            const resText = await res.text();
            console.log(`[Stories DELETE ${path}] status=${res.status}`);

            let data: any = {};
            try {
              data = JSON.parse(resText);
            } catch (parseErr) {
              console.error(`[DeleteComment JSON Parse Error] Received non-JSON:`, resText.slice(0, 200));
            }

            if (!res.ok) {
              // Rollback
              setComments(previousComments);
              if (onCommentsCountChange && storyId) {
                onCommentsCountChange(storyId, previousComments.length);
              }
              Alert.alert("Error", data.error || "Failed to delete comment");
            }
          } catch (err) {
            console.error("delete comment error:", err);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetContainer}
        >
          {/* Sheet Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#9333EA" />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="message-circle" size={36} color="#DDD6FE" />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptySubtitle}>Be the first to share your thoughts!</Text>
                </View>
              }
              renderItem={({ item }) => {
                const avatarUri = resolveImageUrl(item.profile_image);
                return (
                  <View style={styles.commentRow}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(item.username || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.commentContent}>
                      <View style={styles.commentTopRow}>
                        <Text style={styles.commentAuthor}>{item.username}</Text>
                        <Text style={styles.commentTime}>
                          {formatCommentTime(item.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{item.comment_text}</Text>
                    </View>

                    {item.can_delete && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteBtn}
                      >
                        <Feather name="trash-2" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendComment}
              disabled={!commentText.trim() || submitting}
              style={[
                styles.sendBtn,
                !commentText.trim() && styles.sendBtnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: SCREEN_HEIGHT * 0.45,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#F3E8FF",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9333EA",
  },
  commentContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 6,
  },
  commentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#6D28D9",
  },
  commentTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  commentText: {
    fontSize: 13.5,
    color: "#374151",
    lineHeight: 19,
  },
  deleteBtn: {
    padding: 6,
    alignSelf: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 90,
    marginRight: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
});
