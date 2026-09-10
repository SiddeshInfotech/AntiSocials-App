import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import TasksJourneySection from "../../components/TasksJourneySection";
import CircularHabitDashboard from "../../components/CircularHabitDashboard";
import StoryCard, { StoryType } from "../../components/StoryCard";
import StoryCommentModal from "../../components/StoryCommentModal";
import PostCard, { PostType } from "../../components/PostCard";
import PostCommentModal from "../../components/PostCommentModal";
import { appendFileToFormData } from "../create-post";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
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
  Modal,
  KeyboardAvoidingView,
  TextInput,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
  AppState,
  AppStateStatus,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { apiFetch, API_BASE_URL } from "../../constants/Api";
import { resolveImageUrl, resolveAvatarUrl, resolveStoryMediaUrl, DEFAULT_AVATAR } from "../../constants/ImageUtils";
import { formatTimeAgo, formatViewerTime, isStoryExpired } from "../../constants/DateUtils";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, G, Line } from "react-native-svg";
import { useVideoPlayer, VideoView } from 'expo-video';

function StoryViewerVideo({ uri, isPaused, style }: { uri: string; isPaused: boolean; style: any }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    if (!isPaused) player.play();
    else player.pause();
  });

  useEffect(() => {
    if (!isPaused) player.play();
    else player.pause();
  }, [isPaused, player]);

  return (
    <VideoView player={player} style={style} contentFit="contain" nativeControls={false} />
  );
}

function PreviewStoryVideo({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  return (
    <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />
  );
}

const { width, height } = Dimensions.get("window");

// Advanced Draggable Component for Story Overlays
const DraggableElement = ({ element, onUpdate, isSelected, onSelect, onDelete, onDrag }: any) => {
  const pan = useRef(new Animated.ValueXY({ x: element.x, y: element.y })).current;
  const lastOffset = useRef({ x: element.x, y: element.y });
  const isDragging = useRef(false);
  
  useEffect(() => {
    pan.setValue({ x: element.x, y: element.y });
    lastOffset.current = { x: element.x, y: element.y };
  }, [element.x, element.y]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y
        });
        pan.setValue({ x: 0, y: 0 });
        onSelect(element.id);
        isDragging.current = true;
      },
      onPanResponderMove: (e, gestureState) => {
        // Update position
        pan.x.setValue(gestureState.dx);
        pan.y.setValue(gestureState.dy);
        
        // Notify parent about current position for delete detection
        if (onDrag) {
          onDrag(gestureState.moveX, gestureState.moveY);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        isDragging.current = false;
        
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;
        lastOffset.current = { x: finalX, y: finalY };

        // Extremely robust drop detection
        const threshold = height - 250; // Generous fallback
        const isOverDelete = gestureState.moveY > threshold || (gestureState.moveY > 0 && gestureState.moveY > height * 0.75);
        
        if (onDrag) onDrag(0, 0); // Reset hovering state

        if (isOverDelete) {
          onDelete(element.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          onUpdate(element.id, finalX, finalY);
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${element.rotation || 0}deg` },
            { scale: element.scale || 1 }
          ],
          zIndex: isSelected ? 100 : 10,
        },
      ]}
    >
      <Pressable 
        onPress={() => onSelect(element.id)}
        style={{ position: 'relative', padding: 10 }}
      >
        <View style={{
          backgroundColor: element.hasBackground ? element.color === '#FFFFFF' ? '#000' : '#FFFFFF' : 'transparent',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: isSelected ? 1 : 0,
          borderColor: 'rgba(255,255,255,0.5)',
        }}>
          <Text style={{
            color: element.color,
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            textShadowColor: element.hasBackground ? 'transparent' : 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2
          }}>
            {element.content}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

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
      if (activeTask === "Eye Rest") return; // Keep eyes relaxed
      if (activeTask === "Confirm") return; // Keep calm blinking

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
    } else if (activeTask === "Eye Rest") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      // Eye squint with subtle relaxed expression
      Animated.spring(eyeSquintAnim, {
        toValue: 0.4,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else if (activeTask === "Confirm") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      // Calm blinking for presence confirmation
      Animated.spring(eyeSquintAnim, {
        toValue: 0.3,
        friction: 6,
        useNativeDriver: true,
      }).start();
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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [myStories, setMyStories] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const { updatedPoints, updatedStreak } = useLocalSearchParams<{ updatedPoints?: string, updatedStreak?: string }>();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [circleSize, setCircleSize] = useState<{ w: number; h: number }>({
    w: 320,
    h: 420,
  });

  const [homeData, setHomeData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewStoryMedia, setPreviewStoryMedia] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<'image' | 'video'>('image');

  // Active Feed State
  const [feedPosts, setFeedPosts] = useState<PostType[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(true);
  const [feedPage, setFeedPage] = useState<number>(1);
  const [feedHasMore, setFeedHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [activeCommentPost, setActiveCommentPost] = useState<PostType | null>(null);
  const [postCommentModalVisible, setPostCommentModalVisible] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);

  // Feed Scrolling Time & Deduction Tracking State
  const feedSectionYRef = useRef<number>(0);
  const isInFeedSectionRef = useRef<boolean>(false);
  const lastFeedInteractionRef = useRef<number>(0);
  const activeFeedSecondsRef = useRef<number>(0);
  const highestDeductedMilestoneRef = useRef<number>(0);
  const isDeductingRef = useRef<boolean>(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Multi-Story Viewer State & Controls
  const [activeStoryList, setActiveStoryList] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isStoryPaused, setIsStoryPaused] = useState<boolean>(false);
  const [viewerMediaLoading, setViewerMediaLoading] = useState<boolean>(true);
  const [viewerMediaError, setViewerMediaError] = useState<boolean>(false);
  const storyProgressAnim = useRef(new Animated.Value(0)).current;
  const storyAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedProgressVal = useRef<number>(0);

  // Derived current active story in viewer
  const viewingStory = (activeStoryList.length > 0 && activeStoryIndex >= 0 && activeStoryIndex < activeStoryList.length)
    ? activeStoryList[activeStoryIndex]
    : null;

  // Group active unexpired stories by user for Home horizontal bar
  const groupedActiveStories = useMemo(() => {
    if (!homeData?.active_stories || !Array.isArray(homeData.active_stories)) return [];
    const map: Record<string, any[]> = {};
    homeData.active_stories
      .filter((story: any) => story && story.media_url && typeof story.media_url === "string" && story.media_url.trim() !== "")
      .forEach((story: any) => {
        const uid = String(story.user_id);
        if (!map[uid]) map[uid] = [];
        map[uid].push(story);
      });
    return Object.values(map).map((list: any[]) => 
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    );
  }, [homeData?.active_stories]);

  const openOwnStories = (startIndex = 0) => {
    const stories = (homeData?.own_stories || []).filter((s: any) => s && s.media_url && typeof s.media_url === "string" && s.media_url.trim() !== "");
    if (stories.length > 0) {
      setActiveStoryList(stories);
      setActiveStoryIndex(Math.min(startIndex, stories.length - 1));
    }
  };

  const openUserStories = (userStories: any[], startIndex = 0) => {
    const stories = (userStories || []).filter((s: any) => s && s.media_url && typeof s.media_url === "string" && s.media_url.trim() !== "");
    if (stories.length > 0) {
      setActiveStoryList(stories);
      setActiveStoryIndex(Math.min(startIndex, stories.length - 1));
    }
  };

  const closeStoryViewer = () => {
    if (storyAnimRef.current) {
      storyAnimRef.current.stop();
    }
    storyProgressAnim.setValue(0);
    pausedProgressVal.current = 0;
    setIsStoryPaused(false);
    setActiveStoryList([]);
    setActiveStoryIndex(0);
  };

  const startStoryProgress = (fromValue = 0) => {
    if (storyAnimRef.current) {
      storyAnimRef.current.stop();
    }
    storyProgressAnim.setValue(fromValue);
    const duration = (viewingStory?.media_type === 'video' ? 10000 : 5000) * (1 - fromValue);

    const anim = Animated.timing(storyProgressAnim, {
      toValue: 1,
      duration: Math.max(duration, 100),
      useNativeDriver: false,
    });
    storyAnimRef.current = anim;

    anim.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });
  };

  const goToNextStory = () => {
    if (activeStoryIndex < activeStoryList.length - 1) {
      pausedProgressVal.current = 0;
      storyProgressAnim.setValue(0);
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      closeStoryViewer();
    }
  };

  const goToPreviousStory = () => {
    if (activeStoryIndex > 0) {
      pausedProgressVal.current = 0;
      storyProgressAnim.setValue(0);
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      pausedProgressVal.current = 0;
      storyProgressAnim.setValue(0);
      startStoryProgress(0);
    }
  };

  const handlePauseStory = () => {
    setIsStoryPaused(true);
    if (storyAnimRef.current) {
      storyAnimRef.current.stop();
    }
  };

  const handleResumeStory = () => {
    setIsStoryPaused(false);
    startStoryProgress(pausedProgressVal.current);
  };

  useEffect(() => {
    const listenerId = storyProgressAnim.addListener(({ value }) => {
      pausedProgressVal.current = value;
    });
    return () => {
      storyProgressAnim.removeListener(listenerId);
    };
  }, []);

  useEffect(() => {
    if (activeStoryList.length > 0 && activeStoryIndex >= 0 && activeStoryIndex < activeStoryList.length) {
      setViewerMediaLoading(true);
      setViewerMediaError(false);
      pausedProgressVal.current = 0;
      startStoryProgress(0);
    }
  }, [activeStoryIndex, activeStoryList.length]);
  
  // Advanced Story Editing State
  const [activeEditorMode, setActiveEditorMode] = useState<'none' | 'text'>('none');
  const [storyElements, setStoryElements] = useState<any[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const [deleteAreaLayout, setDeleteAreaLayout] = useState<any>(null);
  const [deleteAreaAbsoluteY, setDeleteAreaAbsoluteY] = useState<number | null>(null);
  const deleteAreaRef = useRef<View>(null);
  
  // Viewers List State
  const [showViewersList, setShowViewersList] = useState(false);
  const [storyViewers, setStoryViewers] = useState<any[]>([]);

  // Temporary state for text entry
  const [tempText, setTempText] = useState("");
  const [tempTextColor, setTempTextColor] = useState("#FFFFFF");
  const [tempTextBg, setTempTextBg] = useState(false);
  const [tempFontType, setTempFontType] = useState("System");

  const resetStoryEdits = () => {
    setStoryElements([]);
    setTempText("");
    setActiveEditorMode('none');
  };

  const addTextElement = () => {
    if (!tempText.trim()) {
      setActiveEditorMode('none');
      return;
    }
    const newEl = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: tempText,
      x: width / 2 - 100,
      y: height / 2 - 50,
      color: tempTextColor,
      hasBackground: tempTextBg,
      fontType: tempFontType,
      scale: 1,
      rotation: 0
    };
    setStoryElements([...storyElements, newEl]);
    setTempText("");
    setActiveEditorMode('none');
  };

  const updateElementPos = (id: string, x: number, y: number) => {
    setStoryElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  };

  const deleteElement = (id: string) => {
    setStoryElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const trackView = async (storyId: number) => {
    try {
      console.log(`👀 [Story View] Tracking view for storyId: ${storyId}`);
      const token = await SecureStore.getItemAsync('token');
      await apiFetch(`/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error("❌ Track view error:", e);
    }
  };

  useEffect(() => {
    if (viewingStory && homeData?.user?.id && Number(viewingStory.user_id) !== Number(homeData.user.id)) {
      trackView(viewingStory.id);
    }
  }, [viewingStory?.id]);

  const fetchViewers = async (storyId: number | string) => {
    if (!storyId) return;
    try {
      console.log(`👀 [Fetch Viewers] Fetching viewers for storyId: ${storyId}`);
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch(`/api/stories/${storyId}/views`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStoryViewers(Array.isArray(data.viewers) ? data.viewers : []);
        setShowViewersList(true);
      } else {
        Alert.alert("Notice", data.error || "Unable to load viewers");
      }
    } catch (e) {
      console.error("❌ Fetch viewers error:", e);
      Alert.alert("Notice", "Unable to load viewers at this time.");
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      console.log('📌 [Home] isFocused triggered. updatedPoints:', updatedPoints, 'updatedStreak:', updatedStreak);
      if (updatedPoints !== undefined || updatedStreak !== undefined) {
        const parsedPts = (updatedPoints && !isNaN(parseInt(updatedPoints, 10))) ? parseInt(updatedPoints, 10) : undefined;
        const parsedStk = (updatedStreak && !isNaN(parseInt(updatedStreak, 10))) ? parseInt(updatedStreak, 10) : undefined;
        setHomeData((prev: any) => ({ 
          ...(prev || {}), 
          total_points: parsedPts !== undefined ? parsedPts : (prev?.total_points ?? 0),
          user: {
            ...(prev?.user || {}),
            points: parsedPts !== undefined ? parsedPts : (prev?.user?.points ?? 0),
            streak_count: parsedStk !== undefined ? parsedStk : (prev?.user?.streak_count ?? 0)
          }
        }));
      }
      fetchHomeData();
      fetchUserSummary();
      fetchFeedPosts();
    }
  }, [isFocused, updatedPoints, updatedStreak]);

  const fetchFeedPosts = async (pageToFetch: number = 1, isRefreshing: boolean = false) => {
    try {
      if (pageToFetch === 1 && !isRefreshing) {
        setFeedLoading(true);
      } else if (pageToFetch > 1) {
        setIsLoadingMore(true);
      }

      const token = await SecureStore.getItemAsync("token");
      let storedUserId = await SecureStore.getItemAsync("userId");
      if (storedUserId) {
        setCurrentUserId(storedUserId);
      }
      if (!token) return;

      const response = await apiFetch(`/api/posts/feed?page=${pageToFetch}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.posts)) {
          if (pageToFetch === 1) {
            setFeedPosts(data.posts);
          } else {
            setFeedPosts((prev) => {
              const existingIds = new Set(prev.map((p) => String(p.id)));
              const newUniquePosts = data.posts.filter((p: any) => !existingIds.has(String(p.id)));
              return [...prev, ...newUniquePosts];
            });
          }
          setFeedPage(pageToFetch);
          setFeedHasMore(Boolean(data.hasMore));
        }
      }
    } catch (e) {
      console.error("fetchFeedPosts error:", e);
    } finally {
      setFeedLoading(false);
      setIsLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMorePosts = () => {
    if (!feedLoading && !isLoadingMore && feedHasMore) {
      fetchFeedPosts(feedPage + 1);
    }
  };

  const handlePostLikeToggle = (postId: string | number, isLiked: boolean, newCount: number) => {
    setFeedPosts((prev) =>
      prev.map((item) =>
        String(item.id) === String(postId)
          ? { ...item, is_liked_by_user: isLiked, likes_count: newCount }
          : item
      )
    );
  };

  const handleOpenPostComments = (post: PostType) => {
    setActiveCommentPost(post);
    setPostCommentModalVisible(true);
  };

  const handlePostCommentsCountChange = (postId: string | number, count: number) => {
    setFeedPosts((prev) =>
      prev.map((item) =>
        String(item.id) === String(postId) ? { ...item, comments_count: count } : item
      )
    );
  };

  const handlePostDeleteSuccess = (postId: string | number) => {
    setFeedPosts((prev) => prev.filter((item) => String(item.id) !== String(postId)));
  };

  const handleNavigateToAddPost = () => {
    router.push("/create-post");
  };

  // --- Feed Scrolling Time Points Deduction Logic (TESTING: 10s milestone interval) ---
  const FEED_DEDUCTION_INTERVAL_SECONDS = 10;

  const deductFeedPoints = async (milestoneIdx: number) => {
    if (isDeductingRef.current || milestoneIdx <= highestDeductedMilestoneRef.current) {
      return;
    }
    isDeductingRef.current = true;
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;

      const res = await apiFetch("/api/user/feed-deduct", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestoneIndex: milestoneIdx }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        highestDeductedMilestoneRef.current = Math.max(highestDeductedMilestoneRef.current, milestoneIdx);
        await SecureStore.setItemAsync("feed_deducted_milestone", String(highestDeductedMilestoneRef.current));

        if (data.totalPoints !== undefined || data.total_points !== undefined) {
          const newPts = Number(data.totalPoints ?? data.total_points ?? 0);
          console.log(`⏱️ [Feed Scrolling Time Deduction] Milestone ${milestoneIdx} hit (${milestoneIdx * FEED_DEDUCTION_INTERVAL_SECONDS}s): -${data.pointsDeducted} pts. New total: ${newPts}`);
          setHomeData((prev: any) => ({
            ...(prev || {}),
            total_points: newPts,
            user: {
              ...(prev?.user || {}),
              points: newPts,
            },
          }));
        }
      }
    } catch (err) {
      console.error("❌ Error deducting feed points:", err);
    } finally {
      isDeductingRef.current = false;
    }
  };

  const handleMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const feedTop = feedSectionYRef.current;

    if (feedTop > 0 && scrollY >= feedTop - 120) {
      isInFeedSectionRef.current = true;
      lastFeedInteractionRef.current = Date.now();
    } else {
      isInFeedSectionRef.current = false;
    }
  };

  // Sync deduction status & restore accumulated feed browsing seconds on load
  useEffect(() => {
    const initFeedTracking = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return;

        const res = await apiFetch("/api/user/feed-deduct", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.maxMilestone !== undefined) {
          const serverMax = Number(data.maxMilestone);
          highestDeductedMilestoneRef.current = Math.max(highestDeductedMilestoneRef.current, serverMax);

          const savedSecStr = await SecureStore.getItemAsync("feed_active_seconds");
          let savedSec = savedSecStr ? parseInt(savedSecStr, 10) : 0;
          if (isNaN(savedSec) || savedSec < serverMax * FEED_DEDUCTION_INTERVAL_SECONDS) {
            savedSec = serverMax * FEED_DEDUCTION_INTERVAL_SECONDS;
          }
          activeFeedSecondsRef.current = savedSec;
          console.log(`⏱️ [Feed Tracking Initialized] Server Max Milestone: ${serverMax}, Active Seconds: ${savedSec}`);
        }
      } catch (e) {
        console.error("Error initializing feed tracking:", e);
      }
    };

    initFeedTracking();
  }, []);

  // Listen for AppState changes to pause tracking when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Active Feed Scrolling Timer:
  // Starts ONLY when user has reached the Feed section and is actively browsing/scrolling.
  // Pauses when user leaves Feed, scrolls up to Tasks/other sections, switches tabs, or leaves app.
  useEffect(() => {
    const interval = setInterval(() => {
      const isActivelyBrowsing =
        isFocused &&
        appStateRef.current === "active" &&
        isInFeedSectionRef.current &&
        viewingStory === null &&
        !postCommentModalVisible &&
        Date.now() - lastFeedInteractionRef.current < 25000;

      if (!isActivelyBrowsing) return;

      activeFeedSecondsRef.current += 1;
      const currentSeconds = activeFeedSecondsRef.current;

      const milestone = Math.floor(currentSeconds / FEED_DEDUCTION_INTERVAL_SECONDS);
      if (milestone > highestDeductedMilestoneRef.current && milestone >= 1) {
        deductFeedPoints(milestone);
      }

      if (currentSeconds % 10 === 0) {
        SecureStore.setItemAsync("feed_active_seconds", String(currentSeconds)).catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFocused, viewingStory, postCommentModalVisible]);

  const fetchUserSummary = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const response = await apiFetch('/api/user/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📌 [Home] fetchUserSummary received:', data?.points, 'streak:', data?.streak);
      if (response.ok && data && (data.points !== undefined || data.total_points !== undefined || data.totalPoints !== undefined)) {
        const pts = Number(data.points ?? data.total_points ?? data.totalPoints ?? 0);
        const stk = Number(data.streak ?? data.currentStreak ?? data.current_streak ?? 0);
        setHomeData((prev: any) => ({ 
          ...(prev || {}), 
          total_points: pts, 
          completedTasks: data.completedTasks || prev?.completedTasks || [],
          user: {
            ...(prev?.user || {}),
            points: pts,
            streak_count: stk
          }
        }));
      }
    } catch (e) {
      console.error('❌ [Home] fetchUserSummary error:', e);
    }
  };

  const fetchHomeData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const response = await apiFetch('/api/home', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📌 [Home] fetchHomeData received total_points:', data?.total_points, 'user points:', data?.user?.points, 'streak:', data?.streak_count);
      if (response.ok && data) {
        setHomeData((prev: any) => {
          const finalPoints = (data.total_points !== undefined && data.total_points !== null) 
            ? Number(data.total_points) 
            : ((data.user?.points !== undefined && data.user?.points !== null) ? Number(data.user.points) : (prev?.total_points ?? 0));
          const finalStreak = (data.streak_count !== undefined && data.streak_count !== null)
            ? Number(data.streak_count)
            : ((data.user?.streak_count !== undefined && data.user?.streak_count !== null) ? Number(data.user.streak_count) : (prev?.user?.streak_count ?? 0));

          return {
            ...(prev || {}),
            ...data,
            own_stories: data.own_stories || [],
            active_stories: data.active_stories || [],
            total_points: finalPoints,
            user: {
              ...(prev?.user || {}),
              ...data.user,
              points: finalPoints,
              streak_count: finalStreak
            }
          };
        });
      }
    } catch (e) {
      console.error('❌ [Home] fetchHomeData error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
    fetchUserSummary();
    fetchFeedPosts(1, true);
  };

  const handleTaskPress = (label: string) => {
    setActiveTask((prev) => (prev === label ? null : label));
  };

  const completeTaskApi = async (taskName: string) => {
    try {
      const taskMap: Record<string, string> = {
        'Gratitude': 'Gratitude for Body',
        'Reflect': 'Write 1 word about how you feel',
        'Smile': 'Smile intentionally',
        'Breathe': 'Breathe consciously for 3 minutes',
        'Stretch': 'Stretch neck & shoulders',
        'Silent': 'Sit without phone for 2 minutes',
        'Outside': 'Look outside for 2 minutes',
        'Focus': 'Focus on one task (10 min)',
        'Notifications': 'Turn off notifications (30 min)',
        'Observe': 'Observe urge to check phone',
        'Distraction': 'Write one distraction',
        'Eat': 'Eat one bite consciously',
        'Heartbeat': 'Notice heartbeat',
        'Posture': 'Posture check'
      };
      const fullTaskName = taskMap[taskName] || taskName;

      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ task_name: fullTaskName })
      });
      const data = await response.json();
      
      if (response.ok || data.success) {
        const nextPoints = data.totalPoints !== undefined ? data.totalPoints : (data.total_points !== undefined ? data.total_points : undefined);
        const nextStreak = data.currentStreak !== undefined ? data.currentStreak : (data.streak !== undefined ? data.streak : undefined);
        
        setHomeData((prev: any) => ({ 
          ...prev, 
          total_points: nextPoints !== undefined ? nextPoints : prev?.total_points,
          completedTasks: data.completedTasks || prev?.completedTasks,
          user: {
            ...prev?.user,
            points: nextPoints !== undefined ? nextPoints : prev?.user?.points,
            streak_count: nextStreak !== undefined ? nextStreak : prev?.user?.streak_count
          }
        }));
        fetchHomeData(); 
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
      Alert.alert("Add Your Post", "Choose an option to share your moment with the community", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: openCamera },
        { text: "Upload from Gallery", onPress: pickImage },
      ]);
    }
  };

  const uploadStoryToServer = async () => {
    if (!previewStoryMedia) return;
    try {
      setIsUploading(true);
      console.log('🚀 [Story Upload] Starting upload flow for media:', previewStoryMedia, 'type:', previewMediaType);
      const token = await SecureStore.getItemAsync('token');

      // 1. Upload to server to get public URL (Required for videos, better for images)
      const filename = previewStoryMedia.split('/').pop() || (previewMediaType === 'video' ? 'story.mp4' : 'story.jpg');
      const match = /\.(\w+)$/.exec(filename);
      const type = previewMediaType === 'video' ? 'video/mp4' : (match ? `image/${match[1]}` : `image/jpeg`);

      const formData = new FormData();
      await appendFileToFormData(formData, 'image', previewStoryMedia, filename, type);

      console.log('📤 [Story Upload] Sending media to /upload...');
      const uploadRes = await apiFetch('/upload', {
        method: "POST",
        body: formData,
        timeoutMs: 30000,
      });

      const uploadData = await uploadRes.json();
      console.log(`📥 [Story Upload] /upload status=${uploadRes.status}, imageUrl=${uploadData?.imageUrl}`);
      if (!uploadRes.ok || !uploadData?.imageUrl) {
        throw new Error(uploadData?.error || "Media upload failed on server");
      }

      // 2. Save story metadata
      const storyPayload = {
        media_url: uploadData.imageUrl,
        media_type: previewMediaType,
        text_elements: storyElements,
        text_content: storyElements.length > 0 ? storyElements.map(el => el.content).join(' ') : null,
        text_position: storyElements.length > 0 ? { x: storyElements[0].x, y: storyElements[0].y } : {},
        caption: ''
      };

      console.log('📤 [Story Upload] Creating story record via POST /api/stories with payload:', storyPayload);
      const response = await apiFetch('/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyPayload)
      });

      const data = await response.json();
      console.log(`📥 [Story Upload] POST /api/stories status=${response.status}`, data);

      if (response.ok && data.story) {
        const createdStory = data.story;
        console.log(`✅ [Story Upload Success] Story ID: ${createdStory.id}, User ID: ${createdStory.user_id}, URL: ${createdStory.media_url}`);

        // IMMEDIATELY update local state with the single active story
        setHomeData((prev: any) => ({
          ...(prev || {}),
          own_stories: [createdStory],
        }));

        // Set activeStoryList in viewer if currently open
        setActiveStoryList([createdStory]);
        setActiveStoryIndex(0);

        // Close editor preview and reset
        setPreviewStoryMedia(null);
        resetStoryEdits();

        // Background sync to ensure all data is fresh
        fetchHomeData().catch((syncErr) => console.error("Error refreshing home data after upload:", syncErr));
        fetchFeedPosts().catch((syncErr) => console.error("Error refreshing feed posts after upload:", syncErr));

        Alert.alert("Success", "Story uploaded successfully!");
      } else {
        Alert.alert("Upload Blocked", data?.error || "Failed to create story record.");
      }
    } catch (e: any) {
      console.error('❌ [Story Upload Exception]:', e);
      const userMessage = e?.message && !e.message.toLowerCase().includes('network request failed')
        ? e.message
        : "Unable to upload story. Please check your connection and try again.";
      Alert.alert("Upload Failed", userMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteStory = async (storyId: number) => {
    try {
      console.log(`🗑️ [Story Delete] Deleting storyId: ${storyId}`);
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log(`✅ [Story Delete Success] storyId: ${storyId}`);
        setHomeData((prev: any) => ({
          ...(prev || {}),
          own_stories: (prev?.own_stories || []).filter((s: any) => s.id !== storyId),
        }));

        setActiveStoryList((prevList) => {
          const remaining = prevList.filter((s: any) => s.id !== storyId);
          if (remaining.length === 0) {
            closeStoryViewer();
          } else {
            setActiveStoryIndex((prevIdx) => Math.min(prevIdx, remaining.length - 1));
          }
          return remaining;
        });

        fetchHomeData().catch((e) => console.error("Error refreshing home data after story deletion:", e));
      } else {
        const data = await response.json().catch(() => ({}));
        Alert.alert("Error", data.error || "Failed to delete story");
      }
    } catch (e) {
      console.error("❌ Delete story error:", e);
      Alert.alert("Error", "Unable to delete story. Please check your connection.");
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPreviewMediaType(asset.type === 'video' ? 'video' : 'image');
      setPreviewStoryMedia(asset.uri);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera roll access!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPreviewMediaType(asset.type === 'video' ? 'video' : 'image');
      setPreviewStoryMedia(asset.uri);
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
      {isFocused && <StatusBar style="dark" />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEventThrottle={32}
        onScroll={handleMainScroll}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 25) }]}>
          <View style={styles.stats}>
            <Text style={styles.statItem}>🔥 {homeData?.user?.streak_count ?? homeData?.streak_count ?? 0}</Text>
            <Text style={styles.statItem}>⚡ {homeData?.total_points ?? homeData?.user?.points ?? 0}</Text>
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
            {homeData?.own_stories && (homeData.own_stories.filter((s: any) => s && s.media_url && typeof s.media_url === "string" && s.media_url.trim() !== "").length > 0) ? (
              <TouchableOpacity
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={() => openOwnStories(0)}
              >
                <LinearGradient
                  colors={["#c026d3", "#f43f5e", "#f59e0b"]}
                  style={styles.storyRing}
                >
                  <Image source={{ uri: resolveAvatarUrl(homeData?.user?.image_url) }} style={styles.storyProfileImage} />
                </LinearGradient>
                <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={handleAddStory}
              >
                <View style={styles.addStoryProfileWrap}>
                  <Image source={{ uri: resolveAvatarUrl(homeData?.user?.image_url) }} style={styles.addStoryProfileImage} />
                  <View style={styles.plusIconWrap}>
                    <View style={styles.plusIconBg}>
                      <Feather name="plus" size={12} color="#fff" />
                    </View>
                  </View>
                </View>
                <Text style={styles.storyName} numberOfLines={1}>Your Story</Text>
              </TouchableOpacity>
            )}

            {/* 2. OTHER USERS' STORIES (Grouped by user) */}
            {groupedActiveStories.map((userStories: any[]) => {
              const firstStory = userStories[0];
              if (!firstStory) return null;
              return (
                <TouchableOpacity
                  key={`user-story-${firstStory.user_id}`}
                  style={styles.storyItemContainer}
                  activeOpacity={0.8}
                  onPress={() => openUserStories(userStories, 0)}
                >
                  <LinearGradient
                    colors={["#c026d3", "#f43f5e", "#f59e0b"]}
                    style={styles.storyRing}
                  >
                    <Image source={{ uri: resolveAvatarUrl(firstStory.profile_image) }} style={styles.storyProfileImage} />
                  </LinearGradient>
                  <Text style={styles.storyName} numberOfLines={1}>{firstStory.display_name || firstStory.username || "User"}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* AntiSocial Dog Growth & Circular Habit Dashboard — shows the current
            unlocked day's 7 tasks around the Dog, tapping one navigates straight
            to that task's real screen (same screens the Task page below uses). */}
        <CircularHabitDashboard
          completedTasks={homeData?.completedTasks || []}
        />

        <TasksJourneySection completedTasks={homeData?.completedTasks || []} />

        {/* --- Active Feed Section --- */}
        <View
          style={styles.feedSectionContainer}
          onLayout={(e) => {
            feedSectionYRef.current = e.nativeEvent.layout.y;
          }}
          onTouchStart={() => {
            if (isInFeedSectionRef.current) {
              lastFeedInteractionRef.current = Date.now();
            }
          }}
        >
          {/* Feed Header */}
          <View style={styles.feedHeaderRow}>
            <View style={styles.feedTitleGroup}>
              <Text style={styles.feedTitleText}>Feed</Text>
              <View style={styles.feedLiveDot} />
            </View>

            {feedPosts && feedPosts.length > 0 ? (
              <TouchableOpacity
                style={styles.createPostHeaderBtn}
                activeOpacity={0.8}
                onPress={handleNavigateToAddPost}
              >
                <LinearGradient
                  colors={["#a855f7", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createPostHeaderGradient}
                >
                  <Feather name="plus" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.createPostHeaderBtnText}>Create a Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
          </View>


          {/* Community Feed Posts */}
          {feedLoading && feedPosts.length === 0 ? (
            <View style={styles.feedLoadingContainer}>
              <ActivityIndicator size="small" color="#ec4899" />
            </View>
          ) : feedPosts && feedPosts.length > 0 ? (
            <View style={styles.feedListContainer}>
              {feedPosts.map((postItem) => (
                <PostCard
                  key={postItem.id}
                  post={postItem}
                  currentUserId={currentUserId || homeData?.user?.id}
                  onLikeToggle={handlePostLikeToggle}
                  onOpenComments={handleOpenPostComments}
                  onDeleteSuccess={handlePostDeleteSuccess}
                />
              ))}

              {feedHasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMorePosts}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#a855f7" />
                  ) : (
                    <Text style={styles.loadMoreBtnText}>Load Older Posts</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyFeedContainer}>
              <Feather name="rss" size={38} color="#64748B" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyFeedTitle}>No Posts in Your Feed Yet</Text>
              <Text style={styles.emptyFeedSubtitle}>
                Follow members of the community or share your first post!
              </Text>
              <TouchableOpacity
                style={styles.emptyFeedActionBtn}
                onPress={handleNavigateToAddPost}
              >
                <Text style={styles.emptyFeedActionBtnText}>Create a Post ✨</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Story Viewer Modal */}
      <Modal 
        visible={viewingStory !== null} 
        animationType="fade" 
        transparent={true}
        onRequestClose={closeStoryViewer}
      >
        <View style={styles.storyViewerOverlay}>
          <SafeAreaView style={{ flex: 1, position: 'relative' }}>
             {/* 1. Multi-Story Segmented Progress Bar */}
             <View style={styles.storyProgressContainer}>
               {activeStoryList.map((st: any, idx: number) => (
                 <View key={st.id || idx} style={styles.storyProgressBarTrack}>
                   {idx < activeStoryIndex ? (
                     <View style={[styles.storyProgressBarFill, { width: '100%' }]} />
                   ) : idx === activeStoryIndex ? (
                     <Animated.View 
                       style={[
                         styles.storyProgressBarFill, 
                         { 
                           width: storyProgressAnim.interpolate({
                             inputRange: [0, 1],
                             outputRange: ['0%', '100%']
                           })
                         }
                       ]} 
                     />
                   ) : (
                     <View style={[styles.storyProgressBarFill, { width: '0%' }]} />
                   )}
                 </View>
               ))}
             </View>

             {/* 2. Story Header */}
             <View style={styles.storyViewerHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image source={{ uri: resolveAvatarUrl(viewingStory?.profile_image || homeData?.user?.image_url) }} style={styles.storyViewerProfilePic} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.storyViewerUsername}>{viewingStory?.display_name || viewingStory?.username || 'Your Story'}</Text>
                    {viewingStory?.created_at && (
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' }}>
                        {formatTimeAgo(viewingStory.created_at)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {viewingStory && homeData?.user?.id && Number(viewingStory.user_id) === Number(homeData.user.id) && (
                    <TouchableOpacity 
                      onPress={() => {
                        handlePauseStory();
                        Alert.alert("Delete Story", "Are you sure you want to delete this story?", [
                          { text: "Cancel", style: "cancel", onPress: handleResumeStory },
                          { text: "Delete", style: "destructive", onPress: () => deleteStory(viewingStory?.id) }
                        ]);
                      }} 
                      style={{ padding: 10, marginRight: 5 }}
                    >
                      <Feather name="trash-2" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={closeStoryViewer} style={{padding: 10}}>
                    <Feather name="x" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
             </View>

             {/* 3. Media Content & Touch Zones */}
             <View style={styles.storyViewerContent}>
                {(() => {
                  const resolvedMedia = resolveStoryMediaUrl(viewingStory?.media_url);
                  const isVideo = viewingStory?.media_type === 'video' || (typeof viewingStory?.media_url === 'string' && viewingStory.media_url.toLowerCase().endsWith('.mp4'));

                  if (!resolvedMedia || viewerMediaError) {
                    return (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Feather name={isVideo ? "video-off" : "image"} size={48} color="rgba(255,255,255,0.6)" />
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
                          {viewerMediaError ? (isVideo ? "Video playback error" : "Story image unavailable") : "No media available"}
                        </Text>
                      </View>
                    );
                  }

                  return isVideo ? (
                    <StoryViewerVideo
                      uri={resolvedMedia}
                      isPaused={isStoryPaused}
                      style={styles.storyViewerImage}
                    />
                  ) : (
                    <Image
                      source={{ uri: resolvedMedia }}
                      style={styles.storyViewerImage}
                      resizeMode="contain"
                      onLoadStart={() => setViewerMediaLoading(true)}
                      onLoadEnd={() => setViewerMediaLoading(false)}
                      onError={(e) => {
                        console.log(`❌ [StoryViewer] Image error for ${resolvedMedia}:`, e?.nativeEvent || e);
                        setViewerMediaLoading(false);
                        setViewerMediaError(true);
                      }}
                    />
                  );
                })()}

                {/* Loading Indicator */}
                {viewerMediaLoading && !viewerMediaError && (
                  <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}

                {/* Overlays in Viewer (Instagram Style) */}
                {(Array.isArray(viewingStory?.text_elements) ? viewingStory.text_elements : []).map((el: any) => (
                  <View 
                    key={el.id}
                    style={{ 
                      position: 'absolute', 
                      left: el.x, 
                      top: el.y,
                      transform: [{ rotate: `${el.rotation || 0}deg` }, { scale: el.scale || 1 }]
                    }}
                  >
                    <View style={{
                      backgroundColor: el.hasBackground ? el.color === '#FFFFFF' ? '#000' : '#FFFFFF' : 'transparent',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}>
                      <Text style={{ 
                        color: el.color || '#fff', 
                        fontSize: 24, 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadowColor: el.hasBackground ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
                        textShadowOffset: {width: 1, height: 1},
                        textShadowRadius: 5
                      }}>
                        {el.content}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Left & Right Tap Zones for Navigation */}
                <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPress={goToPreviousStory}
                      onPressIn={handlePauseStory}
                      onPressOut={handleResumeStory}
                      style={{ width: '35%', height: '100%' }}
                    />
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPressIn={handlePauseStory}
                      onPressOut={handleResumeStory}
                      style={{ width: '30%', height: '100%' }}
                    />
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPress={goToNextStory}
                      onPressIn={handlePauseStory}
                      onPressOut={handleResumeStory}
                      style={{ width: '35%', height: '100%' }}
                    />
                  </View>
                </View>
             </View>

             {/* 4. Bottom Action Bar for Own Story: Views */}
             {viewingStory && homeData?.user?.id && Number(viewingStory.user_id) === Number(homeData.user.id) && (
               <View style={styles.storyViewerBottomBar}>
                 <TouchableOpacity 
                   onPress={() => {
                     handlePauseStory();
                     fetchViewers(viewingStory?.id);
                   }}
                   style={styles.storyViewersButton}
                   activeOpacity={0.8}
                 >
                   <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                   <Text style={styles.storyViewersText}>
                     {viewingStory?.view_count || 0} views
                   </Text>
                 </TouchableOpacity>
               </View>
             )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Viewers List Modal */}
      <Modal visible={showViewersList} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: '60%' }}>
            <View style={{ width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 5, alignSelf: 'center', marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Viewers</Text>
              <TouchableOpacity onPress={() => setShowViewersList(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.isArray(storyViewers) && storyViewers.length > 0 ? storyViewers.map((viewer) => {
                const rawAvatar = viewer.profile_image || viewer.image_url || viewer.avatar_url;
                const avatarUri = resolveImageUrl(rawAvatar);
                return (
                  <View key={viewer.user_id || Math.random().toString()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}>
                    <Image 
                      source={{ uri: avatarUri }} 
                      style={{ width: 44, height: 44, borderRadius: 22, marginRight: 15, backgroundColor: '#f0f0f0' }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{viewer.username || 'User'}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        {viewer.viewed_at ? formatViewerTime(viewer.viewed_at) : 'Just now'}
                      </Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                   <Text style={{ color: '#666' }}>No views yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Story Upload Preview Modal (Full Instagram Editor) */}
      <Modal visible={previewStoryMedia !== null} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Immersive Media Preview */}
            <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', marginHorizontal: 0, marginTop: 0 }}>
              {previewMediaType === 'video' ? (
                <PreviewStoryVideo
                  uri={previewStoryMedia || ''}
                  style={{ flex: 1 }}
                />
              ) : (
                <Image source={{ uri: previewStoryMedia || '' }} style={{ flex: 1 }} resizeMode="cover" />
              )}
            </View>

            {/* Draggable Overlays */}
            {storyElements.map(el => (
              <DraggableElement 
                key={el.id} 
                element={el} 
                isSelected={selectedElementId === el.id}
                onSelect={setSelectedElementId}
                onUpdate={updateElementPos}
                onDelete={deleteElement}
                onDrag={(moveX: number, moveY: number) => {
                  if (moveY === 0) {
                    setIsHoveringDelete(false);
                  } else {
                    // Extremely robust collision detection
                    // Check against absolute measured Y, with a fallback to screen height percentage
                    const threshold = deleteAreaAbsoluteY ? deleteAreaAbsoluteY - 50 : height - 250;
                    const isOver = moveY > threshold;
                    setIsHoveringDelete(isOver);
                  }
                }}
              />
            ))}

            {/* Delete Area Overlay (Visual hint when dragging) */}
            {selectedElementId && (
              <View 
                ref={deleteAreaRef}
                onLayout={(e) => {
                  setDeleteAreaLayout(e.nativeEvent.layout);
                  deleteAreaRef.current?.measureInWindow((x, y, w, h) => {
                    if (y > 0) setDeleteAreaAbsoluteY(y);
                  });
                }}
                style={{ position: 'absolute', bottom: 100, alignSelf: 'center', alignItems: 'center', zIndex: 1000 }}
              >
                <View style={{ 
                  backgroundColor: isHoveringDelete ? 'rgba(255,0,0,0.6)' : 'rgba(255,0,0,0.3)', 
                  padding: isHoveringDelete ? 20 : 15, 
                  borderRadius: 60, 
                  borderWidth: 2, 
                  borderColor: isHoveringDelete ? '#fff' : 'rgba(255,255,255,0.2)',
                  transform: [{ scale: isHoveringDelete ? 1.2 : 1 }]
                }}>
                  <Feather name="trash-2" size={isHoveringDelete ? 40 : 32} color="#fff" />
                </View>
                <Text style={{ color: '#fff', fontSize: 12, marginTop: 8, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 4 }}>
                  {isHoveringDelete ? 'RELEASE TO DELETE' : 'DRAG HERE TO DELETE'}
                </Text>
              </View>
            )}

            {/* TOP BAR TOOLS */}
            <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 }}>
               <TouchableOpacity onPress={() => !isUploading && setPreviewStoryMedia(null)} style={{ padding: 8 }}>
                 <Feather name="chevron-left" size={32} color="#fff" />
               </TouchableOpacity>

               <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setActiveEditorMode('text')}>
                    <MaterialCommunityIcons name="format-text" size={36} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: '600' }}>Aa</Text>
                  </TouchableOpacity>
               </View>
            </View>

            {/* BOTTOM BAR ACTION */}
            <View style={{ position: 'absolute', bottom: 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={uploadStoryToServer}
                disabled={isUploading}
                style={{
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 30,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Image source={{ uri: resolveAvatarUrl(homeData?.user?.image_url) }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>
                  {isUploading ? 'Sharing...' : 'Your story'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 30 }}>
                <Feather name="arrow-right" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* FULL SCREEN TEXT EDITOR OVERLAY */}
          <Modal visible={activeEditorMode === 'text'} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 15 }}>
                  <TouchableOpacity onPress={() => setTempTextBg(!tempTextBg)} style={{ padding: 10, backgroundColor: tempTextBg ? '#fff' : 'transparent', borderRadius: 10, borderWidth: 1, borderColor: '#fff' }}>
                    <MaterialCommunityIcons name="format-color-highlight" size={24} color={tempTextBg ? '#000' : '#fff'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addTextElement}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', padding: 10 }}>Done</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <TextInput
                    autoFocus
                    style={{ 
                      color: tempTextColor, 
                      fontSize: 42, 
                      fontWeight: 'bold', 
                      textAlign: 'center', 
                      width: '90%',
                      backgroundColor: tempTextBg ? tempTextColor === '#FFFFFF' ? '#000' : '#FFFFFF' : 'transparent',
                      paddingHorizontal: 20,
                      borderRadius: 15
                    }}
                    placeholder="Type something..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={tempText}
                    onChangeText={setTempText}
                    multiline
                  />
                </View>

                {/* Color Picker */}
                <View style={{ paddingBottom: 20 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}>
                    {['#FFFFFF', '#000000', '#FF5757', '#57FF57', '#5757FF', '#FFFF57', '#FF57FF', '#57FFFF', '#FFA500'].map(color => (
                      <TouchableOpacity 
                        key={color} 
                        onPress={() => setTempTextColor(color)}
                        style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: color, borderWidth: 3, borderColor: tempTextColor === color ? '#fff' : 'rgba(255,255,255,0.3)' }} 
                      />
                    ))}
                  </ScrollView>
                </View>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </Modal>

      {/* Post Comment Modal */}
      <PostCommentModal
        visible={postCommentModalVisible}
        postId={activeCommentPost?.id || null}
        postAuthor={activeCommentPost?.display_name || activeCommentPost?.username}
        onClose={() => {
          setPostCommentModalVisible(false);
          setActiveCommentPost(null);
        }}
        onCommentsCountChange={handlePostCommentsCountChange}
      />

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
  storyProgressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    zIndex: 20,
  },
  storyProgressBarTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  storyProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  storyViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  storyViewerBottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 30,
  },
  storyViewersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  storyViewersText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  storyAddMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  storyAddMoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  feedSectionContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  feedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  feedTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedTitleText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  feedLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginLeft: 8,
  },
  createPostHeaderBtn: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createPostHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  createPostHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  feedLoadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  feedListContainer: {
    gap: 16,
  },
  loadMoreBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A855F7",
  },
  emptyFeedContainer: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyFeedSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyFeedActionBtn: {
    backgroundColor: "#9333EA",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyFeedActionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

