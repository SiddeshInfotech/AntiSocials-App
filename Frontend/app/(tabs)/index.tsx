import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import TasksJourneySection from "../../components/TasksJourneySection";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { API_BASE_URL } from "../../constants/Api";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, G, Line } from "react-native-svg";
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get("window");

// Advanced Draggable Component for Story Overlays
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
  const [previewStoryMedia, setPreviewStoryMedia] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<'image' | 'video'>('image');
  
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
      const token = await SecureStore.getItemAsync('token');
      await fetch(`${API_BASE_URL}/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error("Track view error:", e);
    }
  };

  const fetchViewers = async (storyId: number | string) => {
    if (!storyId) return;
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/views`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStoryViewers(Array.isArray(data.viewers) ? data.viewers : []);
        setShowViewersList(true);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch viewers");
      }
    } catch (e) {
      console.error("Fetch viewers error:", e);
      Alert.alert("Error", "Network error while fetching viewers");
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      fetchHomeData();
      fetchUserSummary();
    }
  }, [isFocused]);

  const fetchUserSummary = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/api/user/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.points !== undefined) {
        setHomeData((prev: any) => ({ ...prev, total_points: data.points }));
      }
    } catch (e) {
      console.error('❌ fetchUserSummary error:', e);
    }
  };

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

  const uploadStoryToServer = async () => {
    if (!previewStoryMedia) return;
    try {
      setIsUploading(true);
      const token = await SecureStore.getItemAsync('token');

      // 1. Upload to server to get public URL (Required for videos, better for images)
      const filename = previewStoryMedia.split('/').pop() || (previewMediaType === 'video' ? 'story.mp4' : 'story.jpg');
      const match = /\.(\w+)$/.exec(filename);
      const type = previewMediaType === 'video' ? 'video/mp4' : (match ? `image/${match[1]}` : `image/jpeg`);

      const formData = new FormData();
      formData.append('image', { uri: previewStoryMedia, name: filename, type } as any);

      const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // 2. Save story metadata
      const response = await fetch(`${API_BASE_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_url: uploadData.imageUrl,
          media_type: previewMediaType,
          text_elements: storyElements,
          text_content: storyElements.length > 0 ? storyElements.map(el => el.content).join(' ') : null,
          text_position: storyElements.length > 0 ? { x: storyElements[0].x, y: storyElements[0].y } : {},
          caption: ''
        })
      });

      if (response.ok) {
        fetchHomeData(); 
        setPreviewStoryMedia(null);
        resetStoryEdits();
      } else {
        const errData = await response.json();
        Alert.alert("Error", errData.error || "Failed to upload story");
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Network error");
    } finally {
      setIsUploading(false);
    }
  };


  const deleteStory = async (storyId: number) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setViewingStory(null);
        fetchHomeData();
      } else {
        Alert.alert("Error", "Failed to delete story");
      }
    } catch (e) {
      console.error("Delete story error:", e);
      Alert.alert("Error", "Network error");
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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
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
            {homeData?.own_stories && homeData?.own_stories.length > 0 ? (
              <TouchableOpacity
                style={styles.storyItemContainer}
                activeOpacity={0.8}
                onPress={() => setViewingStory(homeData?.own_stories[0])}
              >
                <LinearGradient
                  colors={["#c026d3", "#f43f5e", "#f59e0b"]}
                  style={styles.storyRing}
                >
                  <Image source={{ uri: homeData?.user?.image_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.storyProfileImage} />
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
                  <Image source={{ uri: homeData?.user?.image_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.addStoryProfileImage} />
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
                  <Image source={{ uri: story.profile_image || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.storyProfileImage} />
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
      <Modal 
        visible={viewingStory !== null} 
        animationType="fade" 
        transparent={true}
        onShow={() => viewingStory && viewingStory.user_id !== homeData?.user?.id && trackView(viewingStory.id)}
      >
        <View style={styles.storyViewerOverlay}>
          <SafeAreaView style={{ flex: 1, position: 'relative' }}>
             <View style={styles.storyViewerHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Image source={{ uri: viewingStory?.profile_image || homeData?.user?.image_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.storyViewerProfilePic} />
                  <Text style={styles.storyViewerUsername}>{viewingStory?.username || 'Your Story'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {viewingStory?.user_id === homeData?.user?.id && (
                    <TouchableOpacity 
                      onPress={() => {
                        Alert.alert("Delete Story", "Are you sure you want to delete this story?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: () => deleteStory(viewingStory?.id) }
                        ]);
                      }} 
                      style={{ padding: 10, marginRight: 5 }}
                    >
                      <Feather name="trash-2" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setViewingStory(null)} style={{padding: 10}}>
                    <Feather name="x" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
             </View>
             <View style={styles.storyViewerContent}>
                {viewingStory?.media_type === 'video' ? (
                  <Video
                    source={{ uri: viewingStory?.media_url }}
                    style={styles.storyViewerImage}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                    useNativeControls
                  />
                ) : (
                  <Image source={{ uri: viewingStory?.media_url }} style={styles.storyViewerImage} resizeMode="contain" />
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
             </View>

             {/* Views Count at Bottom for Owner */}
             {viewingStory && viewingStory.user_id === homeData?.user?.id && (
               <TouchableOpacity 
                 onPress={() => fetchViewers(viewingStory?.id)}
                 style={{ 
                   position: 'absolute', 
                   bottom: 40, 
                   left: 20, 
                   flexDirection: 'row', 
                   alignItems: 'center',
                   backgroundColor: 'rgba(0,0,0,0.5)',
                   paddingVertical: 8,
                   paddingHorizontal: 15,
                   borderRadius: 20
                 }}
               >
                 <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                 <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                   {viewingStory?.view_count || 0} views
                 </Text>
               </TouchableOpacity>
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
              {Array.isArray(storyViewers) && storyViewers.length > 0 ? storyViewers.map((viewer) => (
                <View key={viewer.user_id || Math.random().toString()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}>
                  <Image 
                    source={{ uri: viewer.profile_image || viewer.image_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} 
                    style={{ width: 44, height: 44, borderRadius: 22, marginRight: 15 }} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{viewer.username || 'User'}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {viewer.viewed_at ? new Date(viewer.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </Text>
                  </View>
                </View>
              )) : (
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
                <Video
                  source={{ uri: previewStoryMedia || '' }}
                  style={{ flex: 1 }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
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
                <Image source={{ uri: homeData?.user?.image_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }} />
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
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
  storyProfileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#fff",
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

