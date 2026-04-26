import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import TasksJourneySection from "../../components/TasksJourneySection";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { API_BASE_URL } from "../../constants/Api";
import { resolveImageUrl } from "../../constants/ImageUtils";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";


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
      <AnimatedBuddy activeTask={activeTask} />
      {activeTask ? (
        <TouchableOpacity
          style={styles.startHeroBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onStartTask(activeTask);
          }}
        >
          <Text style={styles.startHeroBtnText}>Start {activeTask} ✨</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.buddyTextFlex}>Sitting quietly with you</Text>
      )}
    </View>
  );
};

const AnimatedBuddy = ({ activeTask }: { activeTask: string | null }) => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const blinkAnim = React.useRef(new Animated.Value(1)).current;

  // Interaction animations
  const breathAnim = React.useRef(new Animated.Value(1)).current; // Scale
  const rotateAnim = React.useRef(new Animated.Value(0)).current; // Rotation
  const lookAnimX = React.useRef(new Animated.Value(0)).current; // Eye pos X
  const lookAnimY = React.useRef(new Animated.Value(0)).current; // Eye pos Y
  const eyeSquintAnim = React.useRef(new Animated.Value(1)).current; // Eye scaleY for expression
  const smileOpacity = React.useRef(new Animated.Value(0)).current;
  const flatMouthOpacity = React.useRef(new Animated.Value(1)).current;

  // Master loops to stop them properly
  const breathLoop = React.useRef<Animated.CompositeAnimation | null>(null);
  const lookLoop = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const blink = () => {
      if (activeTask === "Silent") return; // Keep eyes closed
      if (activeTask === "Smile") return; // Keep squint

      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
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
      if (Math.random() > 0.6) {
        setTimeout(blink, 200);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTask]);

  React.useEffect(() => {
    // Reset/Stop Animations
    if (breathLoop.current) {
      breathLoop.current.stop();
      breathLoop.current = null;
    }
    if (lookLoop.current) {
      lookLoop.current.stop();
      lookLoop.current = null;
    }

    Animated.spring(breathAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.spring(rotateAnim, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.spring(lookAnimX, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.spring(lookAnimY, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.spring(eyeSquintAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.timing(smileOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(flatMouthOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (activeTask === "Smile") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(eyeSquintAnim, {
        toValue: 0.3,
        useNativeDriver: true,
      }).start();
      Animated.timing(smileOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(flatMouthOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (activeTask === "Silent") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.spring(eyeSquintAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else if (activeTask === "Reflect") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(rotateAnim, {
        toValue: 12,
        friction: 5,
        useNativeDriver: true,
      }).start();
      Animated.spring(lookAnimX, { toValue: 6, useNativeDriver: true }).start();
      Animated.spring(lookAnimY, {
        toValue: -4,
        useNativeDriver: true,
      }).start();
    } else if (activeTask === "Outside") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      lookLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(lookAnimX, {
            toValue: 8,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(lookAnimX, {
            toValue: -8,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(lookAnimX, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      lookLoop.current.start();
    } else if (activeTask === "Breathe") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      breathLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.05,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 0.98,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      breathLoop.current.start();
    } else if (activeTask === "Stretch") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(breathAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: -8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTask]);

  const rotationInterpolate = rotateAnim.interpolate({
    inputRange: [-15, 15],
    outputRange: ["-15deg", "15deg"],
  });

  return (
    <Animated.View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
        },
        {
          transform: [
            { translateY: floatAnim },
            { scale: breathAnim },
            { rotate: rotationInterpolate },
          ],
        },
      ]}
    >
      <View style={styles.buddyRelative}>
        {/* Soft glow / shadow underneath */}
        <View style={styles.buddySoftGlow} />

        {/* Pointy Cat Ears */}
        <View style={styles.buddyEarLeft}>
          <View style={styles.buddyEarInnerLeft} />
        </View>
        <View style={styles.buddyEarRight}>
          <View style={styles.buddyEarInnerRight} />
        </View>

        {/* Paws */}
        <Animated.View
          style={[
            styles.buddyArmLeft,
            {
              transform: [
                { rotate: activeTask === "Stretch" ? "-25deg" : "0deg" },
              ],
            },
          ]}
        >
          <View style={styles.pawPadLeft} />
        </Animated.View>
        <Animated.View
          style={[
            styles.buddyArmRight,
            {
              transform: [
                { rotate: activeTask === "Stretch" ? "25deg" : "0deg" },
              ],
            },
          ]}
        >
          <View style={styles.pawPadRight} />
        </Animated.View>

        {/* Tail */}
        <Animated.View
          style={[
            styles.catTail,
            {
              transform: [
                {
                  rotate:
                    activeTask === "Smile"
                      ? "15deg"
                      : activeTask === "Stretch"
                        ? "-10deg"
                        : "5deg",
                },
              ],
            },
          ]}
        />

        {/* Main Body */}
        <View style={styles.buddyBody}>
          {/* Belly patch */}
          <View style={styles.catBelly} />

          <View style={styles.buddyFace}>
            {/* Left Eye */}
            <Animated.View
              style={{
                transform: [
                  { translateX: lookAnimX },
                  { translateY: lookAnimY },
                ],
              }}
            >
              <View style={styles.catEyeOuter}>
                <Animated.View
                  style={[
                    styles.buddyEye,
                    {
                      transform: [
                        {
                          scaleY: Animated.multiply(blinkAnim, eyeSquintAnim),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.catPupil} />
                </Animated.View>
              </View>
            </Animated.View>

            <View style={styles.buddyNasalWrap}>
              {/* Small pink cat nose (triangle) */}
              <View style={styles.buddyNose} />

              {/* Whiskers */}
              <View style={styles.whiskersContainer}>
                <View style={[styles.whisker, styles.whiskerTopLeft]} />
                <View style={[styles.whisker, styles.whiskerBottomLeft]} />
                <View style={[styles.whisker, styles.whiskerTopRight]} />
                <View style={[styles.whisker, styles.whiskerBottomRight]} />
              </View>

              <View style={styles.mouthContainer}>
                {/* Flat Mouth — cat "w" shape via two tiny arcs */}
                <Animated.View
                  style={[styles.buddyMouthLine, { opacity: flatMouthOpacity }]}
                >
                  <View style={styles.catMouthLeft} />
                  <View style={styles.catMouthRight} />
                </Animated.View>
                {/* Smile / Happy Mouth */}
                <Animated.View
                  style={[styles.buddyMouthSmile, { opacity: smileOpacity }]}
                />
              </View>
            </View>

            {/* Right Eye */}
            <Animated.View
              style={{
                transform: [
                  { translateX: lookAnimX },
                  { translateY: lookAnimY },
                ],
              }}
            >
              <View style={styles.catEyeOuter}>
                <Animated.View
                  style={[
                    styles.buddyEye,
                    {
                      transform: [
                        {
                          scaleY: Animated.multiply(blinkAnim, eyeSquintAnim),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.catPupil} />
                </Animated.View>
              </View>
            </Animated.View>
          </View>

          {/* Blush */}
          <Animated.View
            style={[styles.buddyBlushLeft, { opacity: smileOpacity }]}
          />
          <Animated.View
            style={[styles.buddyBlushRight, { opacity: smileOpacity }]}
          />
        </View>

        {/* Feet */}
        <View style={styles.buddyLegLeft} />
        <View style={styles.buddyLegRight} />
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [circleSize, setCircleSize] = useState<{ w: number; h: number }>({
    w: 320,
    h: 420,
  });

  const [homeData, setHomeData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingStory, setViewingStory] = useState<any>(null);
  const [previewStoryImage, setPreviewStoryImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isFocused) {
      fetchHomeData();
    }
  }, [isFocused]);

  const fetchHomeData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      console.log('📌 fetchHomeData: token exists:', !!token);
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/home`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📌 fetchHomeData response status:', response.status);
      console.log('📌 fetchHomeData tasks count:', data?.tasks?.length);
      console.log('📌 fetchHomeData total_points:', data?.total_points);
      console.log('📌 fetchHomeData streak:', data?.user?.streak_count);
      if (response.ok) {
        setHomeData(data);
      }
    } catch (e) {
      console.error('❌ fetchHomeData error:', e);
    }
  };

  const handleTaskPress = (label: string) => {
    setActiveTask((prev) => (prev === label ? null : label));
  };

  const completeTaskApi = async (taskName: string) => {
    try {
      console.log('📌 completeTaskApi called with taskName:', taskName);
      console.log('📌 homeData?.tasks:', JSON.stringify(homeData?.tasks?.map((t: any) => ({ id: t.id, title: t.title }))));
      const taskObj = homeData?.tasks?.find((t: any) => t.title === taskName);
      console.log('📌 Found taskObj:', taskObj ? `id=${taskObj.id}, title=${taskObj.title}` : 'NOT FOUND');
      if (!taskObj) {
        console.log('❌ Task not found in homeData.tasks! Cannot complete.');
        return;
      }

      const token = await SecureStore.getItemAsync('token');
      console.log('📌 Token exists:', !!token);
      const url = `${API_BASE_URL}/api/home/tasks/${taskObj.id}/complete`;
      console.log('📌 Calling:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('📌 Response status:', response.status);
      const responseData = await response.json();
      console.log('📌 Response data:', JSON.stringify(responseData));
      if (response.ok) {
        console.log('✅ Task completed successfully! Refreshing home data...');
        fetchHomeData(); 
      } else {
        console.log('❌ Task completion failed:', responseData);
      }
    } catch (e) {
      console.error('❌ completeTaskApi error:', e);
    }
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
      Alert.alert("Add Story", "Choose an option to share your moment", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: openCamera },
        { text: "Upload from Gallery", onPress: pickImage },
      ]);
    }
  };

  const uploadImageToServer = async (uri: string) => {
    try {
      const filename = uri.split('/').pop() || 'story.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type } as any);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Upload Failed", data.error || "Could not upload image");
        return null;
      }
      return data.imageUrl;
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Could not connect to server for image upload.");
      return null;
    }
  };

  const uploadStoryToServer = async () => {
    if (!previewStoryImage) return;
    try {
      setIsUploading(true);
      
      // Step 1: Upload image to get URL
      const imageUrl = await uploadImageToServer(previewStoryImage);
      if (!imageUrl) return;

      // Step 2: Create story record
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/home/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_url: imageUrl,
          media_type: 'image',
          caption: ''
        })
      });

      if (response.ok) {
        fetchHomeData(); 
        setPreviewStoryImage(null);
        Alert.alert("Success", "Story uploaded successfully!");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to upload story");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Network error");
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true
    });
    if (!result.canceled && result.assets) {
      setPreviewStoryImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera roll access!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true
    });
    if (!result.canceled && result.assets) {
      setPreviewStoryImage(result.assets[0].uri);
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
            <Text style={styles.statItem}>🔥 {homeData?.user?.streak_count || 0}</Text>
            <Text style={styles.statItem}>⚡ {homeData?.total_points || 0}</Text>
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
            {/* 1. CURRENT USER STORY (Add Story or View Own Story) */}
            {homeData?.own_stories && homeData.own_stories.length > 0 ? (
              <TouchableOpacity
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={() => setViewingStory(homeData.own_stories[0])}
              >
                <View style={[styles.storyCircle, styles.userStoryBorder]}>
                  <Image source={{ uri: resolveImageUrl(homeData.user?.image_url) }} style={styles.uploadedStoryImage} />
                </View>
                <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={handleAddStory}
              >
                <View style={styles.addStoryProfileWrap}>
                  <Image source={{ uri: resolveImageUrl(homeData?.user?.image_url) }} style={styles.addStoryProfileImage} />
                  <View style={styles.plusIconWrap}>
                    <View style={styles.plusIconBg}>
                      <Feather name="plus" size={12} color="#fff" />
                    </View>
                  </View>
                </View>
                <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
              </TouchableOpacity>
            )}

            {/* 2. OTHER USERS' STORIES */}
            {homeData?.active_stories?.map((story: any) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={() => setViewingStory(story)}
              >
                <LinearGradient
                  colors={["#c026d3", "#f43f5e", "#f59e0b"]}
                  style={styles.storyRing}
                >
                  <Image source={{ uri: resolveImageUrl(story.profile_image) }} style={styles.storyProfileImage} />
                </LinearGradient>
                <Text style={styles.storyName} numberOfLines={1}>{story.username}</Text>
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
                key={`dummy-${story.id}`}
                style={styles.storyItemContainer}
                activeOpacity={0.7}
              >
                <View style={[styles.storyRing, { borderWidth: 2, borderColor: "#c026d3", padding: 2 }]}>
                  <View style={{ width: '100%', height: '100%', borderRadius: 30, backgroundColor: "#fdf2f8", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 30 }}>{story.emoji}</Text>
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

            {/* Cat with animations */}
            <AnimatedBuddyContainer
              activeTask={activeTask}
              onStartTask={(task) => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                completeTaskApi(task);
                Alert.alert(
                  `Completed ${task}`,
                  `You have successfully completed this task. Points added!`,
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

      {/* Story Viewer Modal */}
      <Modal visible={viewingStory !== null} animationType="fade" transparent={true}>
        <View style={styles.storyViewerOverlay}>
          <SafeAreaView style={{ flex: 1, position: 'relative' }}>
            <View style={styles.storyViewerHeader}>
               <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Image source={{ uri: resolveImageUrl(viewingStory?.profile_image || homeData?.user?.image_url) }} style={styles.storyViewerProfilePic} />
                 <Text style={styles.storyViewerUsername}>{viewingStory?.username || 'Your Story'}</Text>
               </View>
               <TouchableOpacity onPress={() => setViewingStory(null)} style={{padding: 10}}>
                 <Feather name="x" size={24} color="#fff" />
               </TouchableOpacity>
            </View>
            <View style={styles.storyViewerContent}>
               <Image source={{ uri: resolveImageUrl(viewingStory?.media_url) }} style={styles.storyViewerImage} resizeMode="contain" />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Story Upload Preview Modal */}
      <Modal visible={previewStoryImage !== null} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <Image source={{ uri: previewStoryImage || '' }} style={{ flex: 1, borderRadius: 10, marginHorizontal: 5 }} resizeMode="cover" />
            
            <View style={{ position: 'absolute', top: 20, left: 15, zIndex: 10 }}>
               <TouchableOpacity onPress={() => !isUploading && setPreviewStoryImage(null)} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
                 <Feather name="x" size={24} color="#fff" />
               </TouchableOpacity>
            </View>

            <View style={{ position: 'absolute', bottom: 30, left: 15, right: 15, flexDirection: 'row', justifyContent: 'flex-start' }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={uploadStoryToServer}
                disabled={isUploading}
                style={{
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 30,
                  opacity: isUploading ? 0.7 : 1,
                }}
              >
                <Image source={{ uri: resolveImageUrl(homeData?.user?.image_url) }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                  {isUploading ? 'Uploading...' : 'Your story'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

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
    width: 72,
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  storyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  userStoryBorder: {
    borderWidth: 2,
    borderColor: "#c026d3",
  },
  storyProfileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadedStoryImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  addStoryProfileWrap: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
  },
  addStoryProfileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  plusIconWrap: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  plusIconBg: {
    backgroundColor: "#3b82f6",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  storyName: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "500",
  },
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    zIndex: 10,
  },
  storyViewerProfilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333'
  },
  storyViewerUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  storyViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  storyViewerImage: {
    width: '100%',
    height: '100%',
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
  buddyWrapFlex: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  buddyRelative: {
    position: "relative",
    width: 180,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  buddySoftGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    backgroundColor: "rgba(245, 228, 200, 0.5)",
    borderRadius: 80,
    shadowColor: "#e8d5b5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    top: 25,
  },
  buddyBody: {
    width: 150,
    height: 150,
    backgroundColor: "#F5E6CC", // Soft cream / light beige cat fur
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
  },
  catBelly: {
    position: "absolute",
    width: 80,
    height: 60,
    backgroundColor: "#FFF8EE", // Lighter cream belly
    borderRadius: 40,
    bottom: 20,
    zIndex: 1,
  },
  buddyFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: -16,
    zIndex: 4,
  },
  catEyeOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  buddyEye: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3A3A3A",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  catPupil: {
    width: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#1a1a1a",
  },
  buddyNasalWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buddyNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFB0B0", // Pink triangle cat nose
    marginBottom: 2,
  },
  whiskersContainer: {
    position: "absolute",
    width: 90,
    height: 30,
    top: 8,
    left: -38,
  },
  whisker: {
    position: "absolute",
    width: 28,
    height: 1.5,
    backgroundColor: "#C9B99A",
    borderRadius: 1,
  },
  whiskerTopLeft: {
    left: 0,
    top: 6,
    transform: [{ rotate: "-15deg" }],
  },
  whiskerBottomLeft: {
    left: 2,
    top: 16,
    transform: [{ rotate: "10deg" }],
  },
  whiskerTopRight: {
    right: 0,
    top: 6,
    transform: [{ rotate: "15deg" }],
  },
  whiskerBottomRight: {
    right: 2,
    top: 16,
    transform: [{ rotate: "-10deg" }],
  },
  mouthContainer: {
    position: "relative",
    width: 24,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buddyMouthLine: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  catMouthLeft: {
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#7A6B5D",
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  catMouthRight: {
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#7A6B5D",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  buddyMouthSmile: {
    position: "absolute",
    top: -4,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderColor: "#7A6B5D",
    borderRadius: 11,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
  },
  buddyBlushLeft: {
    position: "absolute",
    width: 22,
    height: 12,
    borderRadius: 11,
    backgroundColor: "rgba(255, 150, 150, 0.25)",
    top: 75,
    left: 18,
    zIndex: 3,
  },
  buddyBlushRight: {
    position: "absolute",
    width: 22,
    height: 12,
    borderRadius: 11,
    backgroundColor: "rgba(255, 150, 150, 0.25)",
    top: 75,
    right: 18,
    zIndex: 3,
  },
  // Pointy triangular cat ears
  buddyEarLeft: {
    position: "absolute",
    top: -12,
    left: 28,
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 44,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F5E6CC",
    zIndex: 3,
    transform: [{ rotate: "-12deg" }],
  },
  buddyEarInnerLeft: {
    position: "absolute",
    top: 14,
    left: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFCECE", // Pink inner ear
  },
  buddyEarRight: {
    position: "absolute",
    top: -12,
    right: 28,
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderRightWidth: 22,
    borderBottomWidth: 44,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F5E6CC",
    zIndex: 3,
    transform: [{ rotate: "12deg" }],
  },
  buddyEarInnerRight: {
    position: "absolute",
    top: 14,
    left: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFCECE",
  },
  // Paws (arms)
  buddyArmLeft: {
    position: "absolute",
    width: 30,
    height: 36,
    backgroundColor: "#F5E6CC",
    borderRadius: 15,
    top: 100,
    left: 8,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  pawPadLeft: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    width: 16,
    height: 12,
    backgroundColor: "#FFCECE",
    borderRadius: 8,
    left: 7,
  },
  buddyArmRight: {
    position: "absolute",
    width: 30,
    height: 36,
    backgroundColor: "#F5E6CC",
    borderRadius: 15,
    top: 100,
    right: 8,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  pawPadRight: {
    position: "absolute",
    bottom: 4,
    alignSelf: "center",
    width: 16,
    height: 12,
    backgroundColor: "#FFCECE",
    borderRadius: 8,
    right: 7,
  },
  // Tail
  catTail: {
    position: "absolute",
    width: 14,
    height: 60,
    backgroundColor: "#F5E6CC",
    borderRadius: 7,
    bottom: 20,
    right: -5,
    zIndex: 0,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    transform: [{ rotate: "25deg" }],
  },
  // Feet
  buddyLegLeft: {
    position: "absolute",
    width: 34,
    height: 18,
    backgroundColor: "#F5E6CC",
    borderRadius: 17,
    bottom: 2,
    left: 38,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  buddyLegRight: {
    position: "absolute",
    width: 34,
    height: 18,
    backgroundColor: "#F5E6CC",
    borderRadius: 17,
    bottom: 2,
    right: 38,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
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

