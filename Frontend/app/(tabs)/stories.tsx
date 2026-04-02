import React from "react";
import { View, Text, StyleSheet, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import StoryCard, { StoryType } from "../../components/StoryCard";

const MOCK_STORIES: StoryType[] = [
  {
    id: "1",
    user: {
      name: "Sarah",
      avatarEmoji: "👱‍♀️",
      avatarBg: "#818CF8",
    },
    time: "2h ago",
    tag: "Connection",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop", // Mountain mist cloud inversion
    likes: 42,
    caption: "Beautiful morning hike! 🌄",
  },
  {
    id: "2",
    user: {
      name: "Mike",
      avatarEmoji: "👱‍♂️",
      avatarBg: "#818CF8",
    },
    time: "4h ago",
    tag: "Connection",
    image:
      "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=1000&auto=format&fit=crop", // Pug looking cute
    likes: 58,
    caption: "Met the cutest friend today 🐕",
  },
  {
    id: "3",
    user: {
      name: "Emma",
      avatarEmoji: "👱‍♀️",
      avatarBg: "#818CF8",
    },
    time: "6h ago",
    tag: "Connection",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop", // Boat on a lake
    likes: 112,
    caption: "Peaceful moments by the water 🛶",
  },
  {
    id: "4",
    user: {
      name: "John",
      avatarEmoji: "👱‍♂️",
      avatarBg: "#818CF8",
    },
    time: "8h ago",
    tag: "Connection",
    image:
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1000&auto=format&fit=crop", // Leaves with water drops
    likes: 34,
    caption: "Nature is amazing 🌿",
  },
];

export default function StoriesFeed() {
  const isFocused = useIsFocused();

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
        <Text style={styles.pointsText}>3393</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {isFocused && <StatusBar style="dark" backgroundColor="#FAFAFA" />}

      <FlatList
        data={MOCK_STORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StoryCard story={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Extremely light neutral background matching design
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
});
