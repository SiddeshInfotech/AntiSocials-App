import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import TasksJourneySection from "../../components/TasksJourneySection";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, G, Line } from "react-native-svg";

const { width } = Dimensions.get("window");

// No longer using trigonometry, fully refactored to responsive Flexbox layout!

const InteractiveTaskItem = ({
  label,
  emoji,
  isActive,
  hasActiveTask,
  onPress,
}: {
  label: string;
  emoji: string;
  isActive: boolean;
  hasActiveTask: boolean;
  onPress: () => void;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: hasActiveTask && !isActive ? 0.4 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(scale, {
      toValue: isActive ? 1.15 : 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isActive, hasActiveTask]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isActive ? 1.15 : 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.taskButtonWrapFlex, { opacity, transform: [{ scale }] }]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <View
          style={[
            styles.taskIconWrapperFlex,
            isActive && styles.taskIconActive,
          ]}
        >
          <Text style={styles.taskEmojiFlex}>{emoji}</Text>
        </View>
      </Pressable>
      <Text style={[styles.taskLabelFlex, isActive && styles.taskLabelActive]}>
        {label}
      </Text>
    </Animated.View>
  );
};

const AnimatedBuddyContainer = ({
  activeTask,
  onStartTask,
}: {
  activeTask: string | null;
  onStartTask: (task: string) => void;
}) => {
  return (
    <View style={styles.buddyCenter}>
      <AnimatedBuddy />
      {activeTask ? (
        <TouchableOpacity
          style={styles.startHeroBtn}
          onPress={() => onStartTask(activeTask)}
        >
          <Text style={styles.startHeroBtnText}>Start {activeTask} ✨</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.buddyTextFlex}>Sitting quietly with you</Text>
      )}
    </View>
  );
};

const AnimatedBuddy = () => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const blinkAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const interval = setInterval(() => {
      blink();
      if (Math.random() > 0.7) {
        setTimeout(blink, 150);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
        },
        { transform: [{ translateY: floatAnim }] },
      ]}
    >
      <View style={styles.buddyRelative}>
        <View style={styles.buddyEarLeft} />
        <View style={styles.buddyEarRight} />
        <View style={styles.buddyArmLeft} />
        <View style={styles.buddyArmRight} />
        <View style={styles.buddyBody}>
          <View style={styles.buddyFace}>
            <Animated.View
              style={[styles.buddyEye, { transform: [{ scaleY: blinkAnim }] }]}
            />
            <View style={styles.buddyNasalWrap}>
              <View style={styles.buddyNose} />
              <View style={styles.buddyMouthLine} />
            </View>
            <Animated.View
              style={[styles.buddyEye, { transform: [{ scaleY: blinkAnim }] }]}
            />
          </View>
        </View>
        <View style={styles.buddyLegLeft} />
        <View style={styles.buddyLegRight} />
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [myStories, setMyStories] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [circleSize, setCircleSize] = useState<{ w: number; h: number }>({
    w: 320,
    h: 420,
  });

  const handleTaskPress = (label: string) => {
    setActiveTask((prev) => (prev === label ? null : label));
  };
  const handleAddStory = async () => {
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
      Alert.alert("Add Story", "How would you like to add a story?", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: openCamera },
        { text: "Upload from Gallery", onPress: pickImage },
      ]);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert("Permission required", "Please allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setMyStories([result.assets[0].uri, ...myStories]);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert("Permission required", "Please allow camera roll access!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setMyStories([result.assets[0].uri, ...myStories]);
    }
  };

  const renderTaskItemFlex = (label: string, emoji: string) => {
    return (
      <InteractiveTaskItem
        key={label}
        label={label}
        emoji={emoji}
        isActive={activeTask === label}
        hasActiveTask={activeTask !== null}
        onPress={() => handleTaskPress(label)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && <StatusBar style="dark" backgroundColor="#ffffff" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 25) }]}>
          <View style={styles.stats}>
            <Text style={styles.statItem}>🔥 12</Text>
            <Text style={styles.statItem}>⚡ 3450</Text>
          </View>
          <Text style={styles.appName}>AntiSocial</Text>
        </View>

        {/* Stories Section */}
        <View style={styles.storiesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScroll}
          >
            {/* Add Story Button triggers the Action Sheet */}
            <TouchableOpacity
              style={styles.storyItemContainer}
              activeOpacity={0.7}
              onPress={handleAddStory}
            >
              <LinearGradient
                colors={["#8b5cf6", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.storyCircle, styles.addStoryCircle]}
              >
                <Text style={styles.addStoryIcon}>+</Text>
              </LinearGradient>
              <Text style={styles.storyName}>Add Story</Text>
            </TouchableOpacity>

            {/* Uploaded Photos from Gallery or Camera map to Stories! */}
            {myStories.map((uri, index) => (
              <TouchableOpacity
                key={`my-story-${index}`}
                style={styles.storyItemContainer}
                activeOpacity={0.7}
              >
                <View style={[styles.storyCircle, styles.userStoryBorder]}>
                  <Image source={{ uri }} style={styles.uploadedStoryImage} />
                </View>
                <Text style={styles.storyName}>My Story</Text>
              </TouchableOpacity>
            ))}

            {/* Dummy Default Stories */}
            {[
              { id: "1", name: "Sarah", emoji: "👱‍♀️" },
              { id: "2", name: "Mike", emoji: "👱‍♂️" },
              { id: "3", name: "Emma", emoji: "👩" },
              { id: "4", name: "John", emoji: "👨" },
            ].map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItemContainer}
                activeOpacity={0.7}
              >
                <View style={[styles.storyCircle, styles.userStoryBorder]}>
                  <View style={styles.userStoryInner}>
                    <Text style={styles.emojiText}>{story.emoji}</Text>
                  </View>
                </View>
                <Text style={styles.storyName}>{story.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Dashboard Box */}
        <View style={styles.dashboardContainer}>
          <View
            style={styles.tasksCircleAreaFlex}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              // store for polar math — safe to call setState here
              setCircleSize({ w, h });
            }}
          >
            {/* Circular emoji buttons — polar coordinates around TRUE container center */}
            {(() => {
              const ITEMS = [
                { label: "Reflect", emoji: "✍️" },
                { label: "Smile", emoji: "😊" },
                { label: "Breathe", emoji: "🫁" },
                { label: "Stretch", emoji: "🧘" },
                { label: "Silent", emoji: "🤫" },
                { label: "Outside", emoji: "👀" },
              ];
              const BUTTON_SIZE = 70;
              // Circle is always centered on the full container dimensions
              const cx = circleSize.w / 2;
              const cy = circleSize.h / 2;
              const radius = Math.min(cx, cy) * 0.82;
              const COUNT = ITEMS.length;
              const START_ANGLE = -120 * (Math.PI / 180);

              return ITEMS.map((item, i) => {
                const angle = START_ANGLE + (i * 2 * Math.PI) / COUNT;
                const x = cx + radius * Math.cos(angle) - BUTTON_SIZE / 2;
                const y = cy + radius * Math.sin(angle) - BUTTON_SIZE / 2;
                return (
                  <View
                    key={item.label}
                    style={[
                      styles.circularItemWrapper,
                      { left: x, top: y, width: BUTTON_SIZE },
                    ]}
                  >
                    {renderTaskItemFlex(item.label, item.emoji)}
                  </View>
                );
              });
            })()}

            {/* Bear with animations */}
            <AnimatedBuddyContainer
              activeTask={activeTask}
              onStartTask={(task) => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                Alert.alert(
                  `Started ${task}`,
                  `You are now focusing on this moment. Have a peaceful time!`,
                );
                setActiveTask(null);
              }}
            />
          </View>
        </View>

        <TasksJourneySection />

        {/* --- Feed Locked Section --- */}
        <View style={styles.feedLockedContainer}>
          <View style={styles.lockOutline}>
            <Feather name="lock" size={40} color="#a1a1aa" />
          </View>
          <Text style={styles.feedLockedTitle}>Feed Locked</Text>
          <Text style={styles.feedLockedSub}>
            Complete at least 1 task to unlock the community feed
          </Text>
          <TouchableOpacity style={styles.greyButton} activeOpacity={0.7}>
            <Text style={styles.greyButtonText}>
              Show up for yourself first
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Layout Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  statItem: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  storiesWrapper: {
    paddingVertical: 15,
    backgroundColor: "#ffffff",
  },
  storiesScroll: {
    paddingHorizontal: 15,
    gap: 20,
    alignItems: "center",
  },
  storyItemContainer: {
    alignItems: "center",
    width: 65,
  },
  storyCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  addStoryCircle: {
    // Note: Background removed as we use LinearGradient locally now
  },
  addStoryIcon: {
    color: "white",
    fontSize: 28,
    fontWeight: "400",
  },
  userStoryBorder: {
    borderWidth: 2,
    borderColor: "#c026d3",
    padding: 2,
  },
  userStoryInner: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "#fdf2f8",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedStoryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  emojiText: {
    fontSize: 30,
  },
  storyName: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "500",
  },
  dashboardContainer: {
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: "#fff7e8",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#fef0c8",
    overflow: "hidden",
  },
  tasksCircleAreaFlex: {
    width: "100%",
    minHeight: 480,
    flex: 1,
    paddingTop: 30,
    paddingBottom: 40,
  },
  taskButtonWrapFlex: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
  },
  taskIconWrapperFlex: {
    backgroundColor: "#ffffff",
    borderRadius: 35,
    width: 66,
    height: 66,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  taskIconActive: {
    borderColor: "#8b5cf6",
    borderWidth: 2,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  taskEmojiFlex: {
    fontSize: 26,
  },
  taskLabelFlex: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 8,
    fontWeight: "500",
    textAlign: "center",
  },
  taskLabelActive: {
    color: "#8b5cf6",
    fontWeight: "700",
  },

  // Circular dashboard styles
  circularItemWrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 10,
  },
  buddyBottomRight: {
    position: "absolute",
    bottom: -5, // thoda niche push
    right: -5, // thoda bahar push
    alignItems: "center",
    zIndex: 0, // IMPORTANT (peeche rahe)
  },
  // buddyCenter kept for backwards compat but no longer used
  buddyCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  // Legacy row styles kept for reference but no longer rendered
  flexRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "12%",
    marginBottom: 20,
    flex: 0.8,
  },
  leftTaskWrapperTop: {
    alignSelf: "flex-end",
    marginRight: 20,
  },
  rightTaskWrapperTop: {
    alignSelf: "flex-start",
  },

  flexRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "8%",
    marginBottom: 20,
    flex: 1,
  },
  leftTaskWrapperMid: {
    alignSelf: "center",
  },
  rightTaskWrapperMid: {
    alignSelf: "flex-end",
    marginRight: "2%",
  },

  flexRow3: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1.5,
    paddingLeft: "8%",
    paddingRight: "5%",
  },
  leftTaskWrapperBot: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%",
    paddingBottom: 10,
  },
  stretchWrap: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  silentWrap: {
    alignSelf: "center",
  },

  buddyWrapFlex: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  buddyRelative: {
    position: "relative",
    width: 160,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  buddyBody: {
    width: 160,
    height: 180,
    backgroundColor: "#d4a574",
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  buddyFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: -5,
  },
  buddyEye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1a1a1a",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buddyNasalWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buddyNose: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    marginBottom: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buddyMouthLine: {
    width: 24,
    height: 3,
    backgroundColor: "#1a1a1a",
    borderRadius: 1.5,
    marginTop: 4,
  },
  buddyEarLeft: {
    position: "absolute",
    width: 36,
    height: 36,
    backgroundColor: "#d4a574",
    borderRadius: 18,
    top: -8,
    left: 20,
    zIndex: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buddyEarRight: {
    position: "absolute",
    width: 36,
    height: 36,
    backgroundColor: "#d4a574",
    borderRadius: 18,
    top: -8,
    right: 20,
    zIndex: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buddyArmLeft: {
    position: "absolute",
    width: 24,
    height: 28,
    backgroundColor: "#d4a574",
    borderRadius: 12,
    top: 90,
    left: -8,
    zIndex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buddyArmRight: {
    position: "absolute",
    width: 24,
    height: 28,
    backgroundColor: "#d4a574",
    borderRadius: 12,
    top: 90,
    right: -8,
    zIndex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buddyLegLeft: {
    position: "absolute",
    width: 22,
    height: 32,
    backgroundColor: "#d4a574",
    borderRadius: 11,
    bottom: -10,
    left: 40,
    zIndex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buddyLegRight: {
    position: "absolute",
    width: 22,
    height: 32,
    backgroundColor: "#d4a574",
    borderRadius: 11,
    bottom: -10,
    right: 40,
    zIndex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buddyTextFlex: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 15,
    width: 200,
    textAlign: "center",
  },
  startHeroBtn: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startHeroBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  instructionText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 20,
  },
  feedLockedContainer: {
    alignItems: "center",
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  lockOutline: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#d4d4d8",
    marginBottom: 15,
  },
  feedLockedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#3f3f46",
    marginBottom: 8,
  },
  feedLockedSub: {
    fontSize: 14,
    color: "#52525b",
    textAlign: "center",
    marginBottom: 20,
  },
  greyButton: {
    backgroundColor: "#f4f4f5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  greyButtonText: {
    color: "#52525b",
    fontWeight: "600",
    fontSize: 14,
  },
});

