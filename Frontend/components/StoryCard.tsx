import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

export type StoryType = {
  id: string;
  user: {
    name: string;
    avatarEmoji: string;
    avatarBg: string;
  };
  time: string;
  tag: string;
  image: string;
  likes: number;
  caption: string;
};

interface StoryCardProps {
  story: StoryType;
}

export default function StoryCard({ story }: StoryCardProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
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
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: story.user.avatarBg },
              ]}
            >
              <Text style={styles.avatarEmoji}>{story.user.avatarEmoji}</Text>
            </View>
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
        <Image
          source={{ uri: story.image }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        {/* Footer actions */}
        <View style={styles.footerContainer}>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="heart" size={24} color="#A855F7" />
              <Text style={styles.actionText}>{story.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="message-circle" size={24} color="#A855F7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="share-2" size={24} color="#A855F7" />
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <Text style={styles.captionContainer}>
            <Text style={styles.captionUser}>{story.user.name}</Text>{" "}
            <Text style={styles.captionText}>{story.caption}</Text>
          </Text>
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
    color: "#6D28D9", // Deep purple as per design
  },
  postTime: {
    fontSize: 13,
    color: "#C084FC", // Lighter purple
    marginTop: 2,
  },
  tagBadge: {
    backgroundColor: "#F3E8FF", // Light purple pill
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
    height: width * 1.1, // Aspect ratio roughly 4:5
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
  },
  actionText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "500",
    color: "#A855F7",
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
