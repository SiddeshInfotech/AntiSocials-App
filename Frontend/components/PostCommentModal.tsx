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
import { resolveAvatarUrl } from "../constants/ImageUtils";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface PostCommentType {
  id: number | string;
  post_id: number | string;
  user_id: number | string;
  comment_text: string;
  created_at: string;
  username: string;
  display_name?: string;
  profile_image?: string | null;
  can_delete?: boolean;
}

interface PostCommentModalProps {
  visible: boolean;
  postId: string | number | null;
  postAuthor?: string;
  onClose: () => void;
  onCommentsCountChange?: (postId: string | number, count: number) => void;
}

export default function PostCommentModal({
  visible,
  postId,
  postAuthor,
  onClose,
  onCommentsCountChange,
}: PostCommentModalProps) {
  const [comments, setComments] = useState<PostCommentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText("");
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const response = await apiFetch(`/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (e) {
      console.error("Error fetching post comments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text || !postId || submitting) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const response = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment_text: text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comment) {
          const newComments = [...comments, data.comment];
          setComments(newComments);
          setCommentText("");

          if (onCommentsCountChange && data.comments_count !== undefined) {
            onCommentsCountChange(postId, data.comments_count);
          }
        }
      } else {
        Alert.alert("Error", "Could not post comment.");
      }
    } catch (e) {
      console.error("Error posting comment:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string | number) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("token");
            if (!token) return;

            const res = await apiFetch(`/api/posts/comments/${commentId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              const data = await res.json();
              const updated = comments.filter((c) => String(c.id) !== String(commentId));
              setComments(updated);

              if (onCommentsCountChange && data.comments_count !== undefined && postId) {
                onCommentsCountChange(postId, data.comments_count);
              }
            }
          } catch (e) {
            console.error("Error deleting comment:", e);
          }
        },
      },
    ]);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.sheetContainer}
      >
        <View style={styles.dragHandleBar}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Comments {comments.length > 0 ? `(${comments.length})` : ""}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ec4899" />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{ uri: resolveAvatarUrl(item.profile_image) }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentBody}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.commentAuthor}>
                      {item.display_name || item.username || "User"}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{item.comment_text}</Text>
                </View>
                {item.can_delete && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(item.id)}
                    style={styles.deleteCommentBtn}
                  >
                    <Feather name="trash-2" size={14} color="#71717a" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={32} color="#52525b" />
                <Text style={styles.emptyText}>No comments yet.</Text>
                <Text style={styles.emptySubText}>Be the first to join the conversation!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#71717a"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!commentText.trim() || submitting) && styles.sendBtnDisabled,
            ]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={16}
                color={commentText.trim() ? "#FFFFFF" : "#71717a"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheetContainer: {
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: "#121215",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dragHandleBar: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#27272a",
    marginRight: 10,
  },
  commentBody: {
    flex: 1,
    backgroundColor: "rgba(24, 24, 27, 0.6)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  commentText: {
    color: "#F4F4F5",
    fontSize: 14,
    lineHeight: 18,
  },
  deleteCommentBtn: {
    padding: 6,
    marginLeft: 6,
  },
  emptyComments: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#F4F4F5",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySubText: {
    color: "#71717A",
    fontSize: 13,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#09090b",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 80,
    backgroundColor: "rgba(24, 24, 27, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(39, 39, 42, 0.8)",
  },
});
