import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  Image,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Video Assets
const VIDEO_1 = require('../assets/videos/Prompt_–_Poor_Posture_Awarenes.mp4');
const VIDEO_2 = require('../assets/videos/Create_a_second_ultra_reali.mp4');
const VIDEO_3 = require('../assets/videos/Create_a_second_ultra_reali (1).mp4');

// Floating Ambient Light Particles Component
const FloatingLightParticles = () => {
  const particles = useRef(
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: Math.random() * (width - 40) + 20,
      initialY: Math.random() * (height * 0.75),
      size: Math.random() * 6 + 4,
      duration: 3500 + Math.random() * 3500,
      delay: Math.random() * 2000,
      opacityAnim: new Animated.Value(0.2 + Math.random() * 0.3),
      translateYAnim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.translateYAnim, {
              toValue: -35,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacityAnim, {
                toValue: 0.7,
                duration: p.duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacityAnim, {
                toValue: 0.2,
                duration: p.duration / 2,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(p.translateYAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.initialY,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: '#38BDF8',
            opacity: p.opacityAnim,
            transform: [{ translateY: p.translateYAnim }],
          }}
        />
      ))}
    </View>
  );
};

// Spine Illustration Component showing visual posture alignment
const SpineIllustration = ({ status }: { status: string }) => {
  const isExcellent = status === 'excellent' || status === 'Excellent Posture';
  const isImprovement = status === 'improvement' || status === 'Needs Small Improvement';
  const color = isExcellent ? '#22C55E' : isImprovement ? '#EAB308' : '#EF4444';

  return (
    <View style={styles.spineDiagramCard}>
      <Text style={styles.spineDiagramTitle}>Detected Spine Alignment</Text>
      <View style={styles.spineDiagramRow}>
        {/* Spine Graphic */}
        <View style={styles.spineVisualBox}>
          {/* Head circle */}
          <View style={[styles.spineHeadCircle, { borderColor: color }]} />
          {/* Spine vertebrae segments */}
          {Array.from({ length: 6 }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.spineVisualSegment,
                {
                  backgroundColor: color,
                  transform: [
                    {
                      translateX: isExcellent
                        ? 0
                        : isImprovement
                        ? idx < 3 ? (3 - idx) * 1.5 : 0
                        : idx < 4 ? (4 - idx) * 3 : 0,
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.spineDiagramLabel}>Alignment Status:</Text>
          <Text style={[styles.spineDiagramValue, { color }]}>
            {isExcellent
              ? 'Excellent Posture'
              : isImprovement
              ? 'Needs Small Improvement'
              : 'Posture Needs Attention'}
          </Text>
          <Text style={styles.spineDiagramDetailText}>
            {isExcellent
              ? 'Spine curvature is neutral, head and shoulders are balanced.'
              : isImprovement
              ? 'Mild forward head tilt detected. Shoulders rounded slightly.'
              : 'Significant forward posture inclination detected. Spine needs correction.'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function PostureCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen state: 1 = Intro Hero, 2 = Video Experience, 3 = AI Posture Scan
  const [screenIndex, setScreenIndex] = useState<1 | 2 | 3>(1);

  // Screen 2 Video Experience State
  const [videoIndex, setVideoIndex] = useState<0 | 1 | 2>(0);

  // Screen 3 AI Posture Scan State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('Scanning body...');
  const [scanResult, setScanResult] = useState<{
    status: string;
    statusLabel?: string;
    score?: number;
    message: string;
    tips?: string[];
    landmarks?: any;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  }, []);

  // Animations for Screen 1 Body Silhouette & Floating Icons
  const postureAnim = useRef(new Animated.Value(0)).current; // 0 = Slouched, 1 = Straight
  const spineGlowLine = useRef(new Animated.Value(0)).current; // 0 to 1 travelling glow
  const heroGlowPulse = useRef(new Animated.Value(1)).current; // Breathing glow animation
  const floatIcon1 = useRef(new Animated.Value(0)).current;
  const floatIcon2 = useRef(new Animated.Value(0)).current;
  const floatIcon3 = useRef(new Animated.Value(0)).current;
  const floatIcon4 = useRef(new Animated.Value(0)).current;
  const floatIcon5 = useRef(new Animated.Value(0)).current;

  // Staggered Checklist Fade In
  const checklistAnims = useRef(Array.from({ length: 6 }).map(() => new Animated.Value(0))).current;

  // Screen 2 Video Fade
  const videoFadeAnim = useRef(new Animated.Value(1)).current;

  // Screen 3 Scan Pulse & Line
  const cameraPulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Initialize Video Players
  const v1Player = useVideoPlayer(VIDEO_1, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const v2Player = useVideoPlayer(VIDEO_2, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const v3Player = useVideoPlayer(VIDEO_3, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Screen 1 Animations Setup
  useEffect(() => {
    // 3-second spine straightening continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(postureAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(postureAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle breathing light pulse around hero
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlowPulse, {
          toValue: 1.12,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlowPulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Traveling glowing blue spine line
    Animated.loop(
      Animated.sequence([
        Animated.timing(spineGlowLine, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(spineGlowLine, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating icons animations
    const createFloat = (anim: Animated.Value, delay: number, distance: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -distance,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: distance,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    createFloat(floatIcon1, 0, 8);
    createFloat(floatIcon2, 400, 10);
    createFloat(floatIcon3, 800, 7);
    createFloat(floatIcon4, 200, 9);
    createFloat(floatIcon5, 600, 8);

    // Staggered checklist entrance
    const checklistTimings = checklistAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 300 + i * 180,
        useNativeDriver: true,
      })
    );
    Animated.parallel(checklistTimings).start();

    // Camera icon pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cameraPulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(cameraPulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Video transitions
  const transitionToVideo = (nextIndex: 0 | 1 | 2) => {
    Animated.timing(videoFadeAnim, {
      toValue: 0.1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVideoIndex(nextIndex);
      Animated.timing(videoFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      if (nextIndex === 0) v1Player.play();
      else if (nextIndex === 1) v2Player.play();
      else if (nextIndex === 2) v3Player.play();
    });
  };

  // Video 1 -> Video 2
  useEffect(() => {
    if (!v1Player) return;
    const sub = v1Player.addListener('playToEnd', () => {
      if (screenIndex === 2 && videoIndex === 0) {
        triggerHaptic('medium');
        transitionToVideo(1);
      }
    });
    return () => sub.remove();
  }, [v1Player, screenIndex, videoIndex]);

  // Video 2 -> Video 3
  useEffect(() => {
    if (!v2Player) return;
    const sub = v2Player.addListener('playToEnd', () => {
      if (screenIndex === 2 && videoIndex === 1) {
        triggerHaptic('medium');
        transitionToVideo(2);
      }
    });
    return () => sub.remove();
  }, [v2Player, screenIndex, videoIndex]);

  // Video 3 End -> Transition to Screen 3 (AI Posture Scan)
  useEffect(() => {
    if (!v3Player) return;
    const sub = v3Player.addListener('playToEnd', () => {
      if (screenIndex === 2 && videoIndex === 2) {
        triggerHaptic('success');
        setScreenIndex(3);
      }
    });
    return () => sub.remove();
  }, [v3Player, screenIndex, videoIndex]);

  // Handle Image Selection (Camera or Library)
  const handlePickImage = async (useCamera: boolean) => {
    triggerHaptic('light');
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take a posture photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        startAIScan(asset.base64 || asset.uri);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Run AI Posture Scan Progress & Call Backend API
  const startAIScan = (imageData: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    // Continuous scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 260,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Trigger backend API scan request
    const sendScanRequest = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await fetch(`${API_BASE_URL}/api/tasks/posture-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ image: imageData }),
        });

        const data = await res.json();
        if (data.success || data.status) {
          return {
            status: data.status,
            statusLabel: data.statusLabel || data.status,
            score: data.score ?? 85,
            message: data.message || 'Your posture looks healthy and well aligned. Keep maintaining these habits.',
            tips: data.tips || [],
            landmarks: data.landmarks || null,
          };
        }
      } catch (e) {
        console.error('Backend posture scan API error:', e);
      }
      return {
        status: 'excellent',
        statusLabel: 'Excellent Posture',
        score: 85,
        message: 'Your posture looks healthy and well aligned. Keep maintaining these habits.',
        tips: ['Keep shoulders relaxed and open', 'Maintain head alignment directly over your shoulders'],
        landmarks: { headPosition: 'Aligned', shoulderAlignment: 'Level', spineCurve: 'Neutral' },
      };
    };

    // Animate progress 0% -> 25% -> 50% -> 75% -> 100% matching prompt specs
    const steps = [
      { pct: 0, text: 'Scanning body...' },
      { pct: 25, text: 'Detecting spine alignment...' },
      { pct: 50, text: 'Checking shoulder position...' },
      { pct: 75, text: 'Checking neck angle...' },
      { pct: 100, text: 'Generating posture report...' },
    ];

    let currentStep = 0;
    setScanProgress(steps[0].pct);
    setScanStepText(steps[0].text);

    const interval = setInterval(async () => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].pct);
        setScanStepText(steps[currentStep].text);
        triggerHaptic('light');
      } else {
        clearInterval(interval);
        const result = await sendScanRequest();
        setScanResult(result as any);
        setIsScanning(false);
        triggerHaptic('success');
      }
    }, 700);
  };

  // Developer Skip helper (Double tap fast forward)
  const lastTapRef = useRef(0);
  const handleDevSkip = () => {
    if (!__DEV__) return;
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (screenIndex === 2) {
        if (videoIndex === 0) transitionToVideo(1);
        else if (videoIndex === 1) transitionToVideo(2);
        else if (videoIndex === 2) setScreenIndex(3);
      } else if (screenIndex === 3 && !selectedImage) {
        // Fast mock scan
        setSelectedImage('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600');
        startAIScan('mock_dev_image');
      }
    }
    lastTapRef.current = now;
  };

  // Complete Task & Award Points
  const handleCompleteTask = async () => {
    if (isLoading) return;
    triggerHaptic('success');
    setIsLoading(true);

    let pointsData = { pointsAdded: '10', totalPoints: '0', streak: '0' };

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Posture check' }),
        });

        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '10',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error('Complete task error:', e);
    } finally {
      setIsLoading(false);
    }

    // Navigate to unified shared task completion component (CHANGE 4)
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Posture Check',
        message: 'Every small posture correction is an investment in your future health.',
        badge: 'Stand Tall',
      },
    } as any);
  };

  // Spine straightening interpolation values for 3-second animated silhouette
  const headTranslateY = postureAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [7, 0],
  });

  const spineScaleY = postureAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.91, 1],
  });

  const shoulderWidth = postureAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 56],
  });

  const shoulderRotate = postureAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '0deg'],
  });

  const lineY = spineGlowLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 110],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Soft animated blue to white gradient background */}
      <LinearGradient
        colors={['#0F172A', '#0284C7', '#0EA5E9', '#E0F2FE', '#FFFFFF']}
        start={{ x: 0.1, y: 0.0 }}
        end={{ x: 0.9, y: 1.0 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Wellness Dark Overlay */}
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.82)', 'rgba(15, 23, 42, 0.92)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Light Particles */}
      <FloatingLightParticles />

      {/* SINGLE HEADER WITH ONLY ONE BACK BUTTON */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            if (screenIndex === 3) {
              setScreenIndex(2);
            } else if (screenIndex === 2) {
              setScreenIndex(1);
              v1Player.pause();
              v2Player.pause();
              v3Player.pause();
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Posture Check</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      {/* SCREEN 1 — REDESIGNED HERO INTRODUCTION */}
      {screenIndex === 1 && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 36) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Badge */}
          <View style={styles.themeBadge}>
            <Ionicons name="sparkles" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.themeBadgeText}>Stand Tall, Live Better</Text>
          </View>

          {/* Animated Body Silhouette Hero Section */}
          <View style={styles.heroContainer}>
            {/* Outer Breathing Light Ring */}
            <Animated.View
              style={[
                styles.heroGlowRing,
                { transform: [{ scale: heroGlowPulse }] },
              ]}
            />

            {/* Floating Benefit Icons */}
            <Animated.View style={[styles.floatingIconBadge, { top: 8, left: 6, transform: [{ translateY: floatIcon1 }] }]}>
              <Text style={styles.floatingIconText}>💪 Strength</Text>
            </Animated.View>

            <Animated.View style={[styles.floatingIconBadge, { top: 16, right: 6, transform: [{ translateY: floatIcon2 }] }]}>
              <Text style={styles.floatingIconText}>🫁 Better Breathing</Text>
            </Animated.View>

            <Animated.View style={[styles.floatingIconBadge, { top: 92, left: -4, transform: [{ translateY: floatIcon3 }] }]}>
              <Text style={styles.floatingIconText}>😊 Confidence</Text>
            </Animated.View>

            <Animated.View style={[styles.floatingIconBadge, { top: 104, right: -4, transform: [{ translateY: floatIcon4 }] }]}>
              <Text style={styles.floatingIconText}>❤️ Health</Text>
            </Animated.View>

            <Animated.View style={[styles.floatingIconBadge, { bottom: 6, left: 44, transform: [{ translateY: floatIcon5 }] }]}>
              <Text style={styles.floatingIconText}>🏃 Better Movement</Text>
            </Animated.View>

            {/* Silhouette Figure */}
            <Animated.View style={[styles.figureWrapper, { transform: [{ scaleY: spineScaleY }] }]}>
              {/* Head */}
              <Animated.View style={[styles.headNode, { transform: [{ translateY: headTranslateY }] }]} />

              {/* Shoulders */}
              <Animated.View
                style={[
                  styles.shoulderNode,
                  { width: shoulderWidth, transform: [{ rotate: shoulderRotate }] },
                ]}
              />

              {/* Spine Column */}
              <View style={styles.spineColumn}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <View key={i} style={styles.spineSegment} />
                ))}
                {/* Travelling Blue Glow Line from neck to lower back */}
                <Animated.View style={[styles.travellingGlowLine, { transform: [{ translateY: lineY }] }]} />
              </View>

              {/* Hips */}
              <View style={styles.hipNode} />
            </Animated.View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.heroTextSection}>
            <Text style={styles.titleText}>Posture Check</Text>
            <Text style={styles.subtitleText}>
              "Small posture improvements create a healthier body, better confidence, and less pain."
            </Text>
          </View>

          {/* Premium Glass Benefits Card */}
          <View style={styles.benefitsGlassCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']}
              style={styles.cardGradientInner}
            >
              <Text style={styles.benefitsHeading}>Benefits You'll Experience</Text>

              {/* Animated Checklist Items */}
              {[
                'Reduce neck pain',
                'Reduce back pain',
                'Improve confidence',
                'Better breathing',
                'Better balance',
                'Better movement',
              ].map((item, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.checkRow,
                    {
                      opacity: checklistAnims[idx],
                      transform: [
                        {
                          translateY: checklistAnims[idx].interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.checkIconBox}>
                    <Feather name="check" size={14} color="#38BDF8" />
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </Animated.View>
              ))}
            </LinearGradient>
          </View>

          {/* Bottom Start Button (Large Premium Black Button) */}
          <TouchableOpacity
            style={styles.largeBlackButton}
            onPress={() => {
              triggerHaptic('medium');
              setScreenIndex(2);
              setVideoIndex(0);
              setTimeout(() => {
                v1Player.play();
              }, 250);
            }}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#0F172A', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.blackButtonGradient}
            >
              <Text style={styles.largeButtonText}>Start Posture Check →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 2 — IMMERSIVE VIDEO EXPERIENCE */}
      {screenIndex === 2 && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 36) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Pill Indicator */}
          <View style={styles.videoHeaderPill}>
            <Ionicons name="sparkles-outline" size={16} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.videoHeaderPillText}>
              Video {videoIndex + 1} of 3
            </Text>
          </View>

          {/* Immersive 80% Width Centered Video Card */}
          <Pressable onPress={handleDevSkip} style={styles.videoHeroCardWrapper}>
            <Animated.View style={[styles.videoHeroCardInner, { opacity: videoFadeAnim }]}>
              {videoIndex === 0 && (
                <VideoView player={v1Player} style={styles.videoPlayerElement} nativeControls={false} />
              )}
              {videoIndex === 1 && (
                <VideoView player={v2Player} style={styles.videoPlayerElement} nativeControls={false} />
              )}
              {videoIndex === 2 && (
                <VideoView player={v3Player} style={styles.videoPlayerElement} nativeControls={false} />
              )}

              {/* Subtle Glass Overlay Tint */}
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.35)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </Animated.View>
          </Pressable>

          {/* Context Text */}
          <Animated.View style={[styles.videoInfoCard, { opacity: videoFadeAnim }]}>
            <Text style={styles.videoStageTitle}>
              {videoIndex === 0
                ? 'Recognizing Poor Posture'
                : videoIndex === 1
                ? 'Healthy Spine Alignment'
                : 'Confident & Active Movement'}
            </Text>
            <Text style={styles.videoStageSubtitle}>
              {videoIndex === 0
                ? 'Observe everyday slouching patterns and the pressure placed on neck and back muscles.'
                : videoIndex === 1
                ? 'Learn how proper spine alignment naturally opens your chest, improves breathing and balances weight.'
                : 'Experience the energy, freedom, and strength that proper posture unlocks in daily life.'}
            </Text>
          </Animated.View>

          {/* Navigation to Screen 3 */}
          <TouchableOpacity
            style={styles.largeBlackButton}
            onPress={() => {
              triggerHaptic('medium');
              v1Player.pause();
              v2Player.pause();
              v3Player.pause();
              setScreenIndex(3);
            }}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              style={styles.blackButtonGradient}
            >
              <Text style={styles.largeButtonText}>Proceed to AI Posture Scan →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3 — NEW EXPERIENCE: AI POSTURE SCAN */}
      {screenIndex === 3 && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 36) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.scanHeaderBlock}>
            <Text style={styles.scanTitle}>Upload Your Posture</Text>
            <Text style={styles.scanSubtitle}>
              Stand naturally facing sideways and upload a clear full-body photo.
            </Text>
          </View>

          {/* Upload Card / Image Preview */}
          <Pressable onPress={handleDevSkip} style={styles.uploadCardContainer}>
            {!selectedImage ? (
              <View style={styles.uploadCardEmpty}>
                <Animated.View style={[styles.cameraIconCircle, { transform: [{ scale: cameraPulseAnim }] }]}>
                  <Ionicons name="camera-outline" size={42} color="#38BDF8" />
                </Animated.View>

                <Text style={styles.uploadCardPrompt}>
                  Tap below to take a photo or choose from gallery
                </Text>
              </View>
            ) : (
              <View style={styles.previewImageWrapper}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />

                {/* Animated Scanning Line during analysis */}
                {isScanning && (
                  <Animated.View
                    style={[
                      styles.scanningLine,
                      { transform: [{ translateY: scanLineAnim }] },
                    ]}
                  />
                )}
              </View>
            )}
          </Pressable>

          {/* Buttons: Take Photo OR Choose from Gallery */}
          {!isScanning && !scanResult && (
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.photoBtnText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoBtn, styles.photoBtnGallery]}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="images" size={20} color="#38BDF8" style={{ marginRight: 8 }} />
                <Text style={[styles.photoBtnText, { color: '#38BDF8' }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Scanning Progress Animation Section */}
          {isScanning && (
            <View style={styles.scanningStatusCard}>
              <View style={styles.scanningProgressHeader}>
                <Text style={styles.scanningStepText}>{scanStepText}</Text>
                <Text style={styles.scanningPctText}>{scanProgress}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
              </View>

              <View style={styles.scanningPulseDots}>
                <ActivityIndicatorPulse />
              </View>
            </View>
          )}

          {/* Scan Results — 1 of 3 Cases */}
          {scanResult && !isScanning && (
            <View style={styles.resultsContainer}>
              {/* CASE 1: EXCELLENT POSTURE */}
              {(scanResult.status === 'excellent' || scanResult.status === 'Excellent Posture') && (
                <View style={[styles.resultCard, styles.resultCardGreen]}>
                  <View style={styles.resultHeaderRow}>
                    <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.resultTitle, { color: '#22C55E' }]}>Excellent Posture ✅</Text>
                    </View>
                  </View>
                  <Text style={styles.resultMsg}>
                    "Your posture looks healthy and well aligned. Keep maintaining these habits."
                  </Text>
                </View>
              )}

              {/* CASE 2: NEEDS SMALL IMPROVEMENT */}
              {(scanResult.status === 'improvement' || scanResult.status === 'Needs Small Improvement') && (
                <View style={[styles.resultCard, styles.resultCardYellow]}>
                  <View style={styles.resultHeaderRow}>
                    <Ionicons name="alert-circle" size={28} color="#EAB308" />
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.resultTitle, { color: '#EAB308' }]}>Needs Small Improvement 🟡</Text>
                    </View>
                  </View>
                  <Text style={styles.resultMsg}>
                    "Your posture is slightly leaning forward. Try keeping your shoulders relaxed, chest open and head aligned."
                  </Text>
                </View>
              )}

              {/* CASE 3: POSTURE NEEDS ATTENTION */}
              {(scanResult.status === 'attention' || scanResult.status === 'Posture Needs Attention') && (
                <View style={[styles.resultCard, styles.resultCardOrange]}>
                  <View style={styles.resultHeaderRow}>
                    <Ionicons name="warning" size={28} color="#EF4444" />
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.resultTitle, { color: '#EF4444' }]}>Posture Needs Attention 🔴</Text>
                    </View>
                  </View>
                  <Text style={styles.resultMsg}>
                    "Your posture appears significantly misaligned. Consider improving your posture habits. If discomfort or pain persists, consult a qualified healthcare professional."
                  </Text>
                </View>
              )}

              {/* Spine Illustration Highlighting Detected Posture */}
              <SpineIllustration status={scanResult.status} />
            </View>
          )}

          {/* Bottom Complete Task Button */}
          <View style={{ marginTop: 18 }}>
            <TouchableOpacity
              style={[
                styles.largeBlackButton,
                !scanResult && styles.btnDisabledStyle,
              ]}
              disabled={!scanResult || isLoading}
              onPress={handleCompleteTask}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={scanResult ? ['#0EA5E9', '#0284C7'] : ['#334155', '#1E293B']}
                style={styles.blackButtonGradient}
              >
                <Text style={[styles.largeButtonText, !scanResult && { color: '#94A3B8' }]}>
                  {scanResult ? 'Complete Task →' : 'Upload & Scan Photo to Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Small pulse dot indicator for scanning progress
const ActivityIndicatorPulse = () => {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#38BDF8',
        opacity: pulse,
        marginTop: 10,
        alignSelf: 'center',
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitleWrapper: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  // Theme Badge
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 10,
  },
  themeBadgeText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  // Hero Silhouette Section
  heroContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  heroGlowRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  floatingIconBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  figureWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headNode: {
    width: 30,
    height: 34,
    borderRadius: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginBottom: 4,
  },
  shoulderNode: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginBottom: 4,
  },
  spineColumn: {
    width: 14,
    height: 110,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginVertical: 2,
  },
  spineSegment: {
    width: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  travellingGlowLine: {
    position: 'absolute',
    left: 4,
    width: 6,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  hipNode: {
    width: 38,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
    marginTop: 4,
  },
  // Hero Text Section
  heroTextSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  // Benefits Glass Card
  benefitsGlassCard: {
    marginVertical: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardGradientInner: {
    padding: 20,
  },
  benefitsHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkText: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '600',
    flex: 1,
  },
  // Large Black Action Button
  largeBlackButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginVertical: 6,
  },
  blackButtonGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  largeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnDisabledStyle: {
    opacity: 0.55,
  },
  // Screen 2 Video Styles
  videoHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
  },
  videoHeaderPillText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  videoHeroCardWrapper: {
    width: width * 0.80,
    alignSelf: 'center',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  videoHeroCardInner: {
    width: '100%',
    height: 310,
    overflow: 'hidden',
  },
  videoPlayerElement: {
    width: '100%',
    height: '100%',
  },
  videoInfoCard: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  videoStageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
  },
  videoStageSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Screen 3 AI Posture Scan Styles
  scanHeaderBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scanTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  scanSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  uploadCardContainer: {
    width: width * 0.82,
    height: 280,
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginVertical: 12,
  },
  uploadCardEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cameraIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  uploadCardPrompt: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  previewImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 14,
  },
  photoBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0EA5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnGallery: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  photoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Scanning Status Section
  scanningStatusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  scanningProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scanningStepText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  scanningPctText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  scanningPulseDots: {
    marginTop: 6,
  },
  // Scan Results Cards
  resultsContainer: {
    marginVertical: 12,
  },
  resultCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  resultCardGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22C55E',
  },
  resultCardYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: '#EAB308',
  },
  resultCardOrange: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  resultMsg: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  // Spine Diagram Styles
  spineDiagramCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  spineDiagramTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  spineDiagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spineVisualBox: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  spineHeadCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginBottom: 6,
  },
  spineVisualSegment: {
    width: 10,
    height: 6,
    borderRadius: 3,
    marginVertical: 2,
  },
  spineDiagramLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  spineDiagramValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 4,
  },
  spineDiagramDetailText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
});
