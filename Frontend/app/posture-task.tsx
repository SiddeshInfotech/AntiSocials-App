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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Local Video Assets (verified inside Frontend/assets/videos)
const VIDEO_1 = require('../assets/videos/Prompt_–_Poor_Posture_Awarenes.mp4');
const VIDEO_2 = require('../assets/videos/Create_a_second_ultra_reali.mp4');
const VIDEO_3 = require('../assets/videos/Create_a_second_ultra_reali (1).mp4');

// Celebration Confetti Particles for Page 4
const CONFETTI_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  color: ['#10b981', '#3b82f6', '#34d399', '#60a5fa', '#f59e0b', '#ec4899'][i % 6],
  size: 6 + Math.random() * 7,
  delay: (i % 7) * 140,
  duration: 2200 + Math.random() * 800,
}));

// Floating Light Particles for ambient wellness atmosphere
const AMBIENT_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * (width - 40) + 20,
  y: Math.random() * (height * 0.7),
  size: 4 + Math.random() * 5,
  color: i % 2 === 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(52, 211, 153, 0.45)',
  duration: 4000 + Math.random() * 3000,
}));

interface PostureScanResult {
  status: 'excellent' | 'improvement' | 'attention' | string;
  statusLabel: string;
  score: number;
  message: string;
  tips: string[];
  landmarks?: {
    headPosition?: string;
    shoulderAlignment?: string;
    spineCurve?: string;
  };
}

export default function PostureTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ----------------------------------------------------
  // EXACTLY 4 PAGES:
  // 1: Cinematic Posture Intro
  // 2: Posture Education Videos
  // 3: AI Posture Scan
  // 4: Completion + Claim 100 Points
  // ----------------------------------------------------
  const [page, setPage] = useState<1 | 2 | 3 | 4>(1);

  // Safe Haptics
  const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  // ----------------------------------------------------
  // ANIMATION REFS
  // ----------------------------------------------------
  // Page Transitions
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;

  // Background Ambience
  const bgAuraScale = useRef(new Animated.Value(1)).current;
  const bgAuraShift = useRef(new Animated.Value(0)).current;

  // PAGE 1: Sequential Cinematic Silhouette Animations
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.92)).current;
  const postureMorphAnim = useRef(new Animated.Value(0)).current; // 0 = Slouched, 1 = Upright
  const spineLineAnim = useRef(new Animated.Value(0)).current;
  const markerHeadAnim = useRef(new Animated.Value(0)).current;
  const markerShouldersAnim = useRef(new Animated.Value(0)).current;
  const markerSpineAnim = useRef(new Animated.Value(0)).current;
  const markerHipsAnim = useRef(new Animated.Value(0)).current;
  const alignmentBeamAnim = useRef(new Animated.Value(0)).current;
  const introTextAnim = useRef(new Animated.Value(0)).current;
  const startButtonSpringAnim = useRef(new Animated.Value(0)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0.7)).current;

  // PAGE 3: AI Scan Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanPulseAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const resultCardSlideAnim = useRef(new Animated.Value(20)).current;

  // PAGE 4: Celebration Animations
  const celebrationScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationAuraAnim = useRef(new Animated.Value(0)).current;
  const rewardCardSlideAnim = useRef(new Animated.Value(25)).current;
  const rewardCardOpacityAnim = useRef(new Animated.Value(0)).current;
  const confettiFallAnims = useRef(CONFETTI_PARTICLES.map(() => new Animated.Value(0))).current;

  // ----------------------------------------------------
  // PAGE 2: VIDEO STATES & COMPLETION TRACKING
  // ----------------------------------------------------
  const [video1Completed, setVideo1Completed] = useState(false);
  const [video2Completed, setVideo2Completed] = useState(false);
  const [video3Completed, setVideo3Completed] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

  // Set up expo-video players
  const player1 = useVideoPlayer(VIDEO_1, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const player2 = useVideoPlayer(VIDEO_2, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const player3 = useVideoPlayer(VIDEO_3, (player) => {
    player.loop = false;
    player.muted = false;
  });

  // Track video completion via playToEnd listeners
  useEffect(() => {
    const sub1 = player1.addListener('playToEnd', () => {
      setVideo1Completed(true);
      triggerHaptic('success');
    });
    const sub2 = player2.addListener('playToEnd', () => {
      setVideo2Completed(true);
      triggerHaptic('success');
    });
    const sub3 = player3.addListener('playToEnd', () => {
      setVideo3Completed(true);
      triggerHaptic('success');
    });

    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, [player1, player2, player3]);

  // Pause all players when leaving Page 2
  useEffect(() => {
    if (page !== 2) {
      player1.pause();
      player2.pause();
      player3.pause();
    }
  }, [page, player1, player2, player3]);

  const allVideosCompleted = video1Completed && video2Completed && video3Completed;

  // ----------------------------------------------------
  // PAGE 3: AI POSTURE SCAN STATES
  // ----------------------------------------------------
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStepText, setScanningStepText] = useState('Initializing scan...');
  const [scanResult, setScanResult] = useState<PostureScanResult | null>(null);

  // ----------------------------------------------------
  // PAGE 4: COMPLETION & BACKEND POINTS STATES
  // ----------------------------------------------------
  const [isClaimingPoints, setIsClaimingPoints] = useState(false);
  const hasClaimedRef = useRef(false);

  // ----------------------------------------------------
  // INITIAL PAGE 1 ANIMATION SEQUENCE
  // ----------------------------------------------------
  useEffect(() => {
    // Ambient aura breathing loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAuraScale, {
          toValue: 1.05,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgAuraScale, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlowAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cinematic Entrance Sequence
    // 1. Background & Human posture fades/scales in
    Animated.parallel([
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(heroScaleAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Spine line appears
      Animated.timing(spineLineAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // 3. Morph from slouched to upright
        Animated.timing(postureMorphAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();

        // 4. Sequential alignment markers appear
        Animated.stagger(220, [
          Animated.spring(markerHeadAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.spring(markerShouldersAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.spring(markerSpineAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.spring(markerHipsAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        ]).start(() => {
          // 5. Alignment glow beam passes upward through the body
          Animated.timing(alignmentBeamAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            // 6. Title and info animate upward
            Animated.timing(introTextAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start(() => {
              // 7. Start button appears last with smooth spring
              Animated.spring(startButtonSpringAnim, {
                toValue: 1,
                friction: 6,
                tension: 55,
                useNativeDriver: true,
              }).start();
            });
          });
        });
      });
    });
  }, []);

  // ----------------------------------------------------
  // PAGE TRANSITION HELPER
  // ----------------------------------------------------
  const transitionToPage = useCallback((nextPage: 1 | 2 | 3 | 4) => {
    triggerHaptic('light');
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: -12,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPage(nextPage);
      pageSlideAnim.setValue(12);

      Animated.parallel([
        Animated.timing(pageFadeAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(pageSlideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // ----------------------------------------------------
  // PAGE 1 -> PAGE 2
  // ----------------------------------------------------
  const handleStartPostureCheck = () => {
    transitionToPage(2);
  };

  // ----------------------------------------------------
  // PAGE 2 -> PAGE 3
  // ----------------------------------------------------
  const handleContinueToScan = () => {
    if (!allVideosCompleted) {
      triggerHaptic('warning');
      Alert.alert('Watch Guides', 'Please watch all 3 posture videos to unlock your AI Posture Scan.');
      return;
    }
    transitionToPage(3);
  };

  // ----------------------------------------------------
  // PAGE 3: IMAGE PICKING & AI ANALYSIS
  // ----------------------------------------------------
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library permission is required to select your posture photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setScanResult(null);
        triggerHaptic('light');
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
      Alert.alert('Error', 'Unable to load selected photo. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera permission is required to capture your posture photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setScanResult(null);
        triggerHaptic('light');
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Unable to capture photo. Please try again.');
    }
  };

  // Run Real AI Posture Analysis via Backend POST /api/tasks/posture-scan
  const handleAnalyzePosture = async () => {
    if (!selectedImageUri) {
      Alert.alert('Upload Photo', 'Please upload or capture a photo first.');
      return;
    }

    setIsScanning(true);
    triggerHaptic('medium');

    // Scanning beam animation loop
    scanLineAnim.setValue(0);
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    // Guided step messages
    setScanningStepText('Detecting posture landmarks...');
    const stepTimer1 = setTimeout(() => {
      setScanningStepText('Evaluating spinal alignment & shoulder level...');
    }, 1400);
    const stepTimer2 = setTimeout(() => {
      setScanningStepText('Computing posture score & personalized tips...');
    }, 2800);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        throw new Error('No authorization token found. Please log in again.');
      }

      // Payload: send base64 or photo identifier
      const imagePayload = imageBase64
        ? `data:image/jpeg;base64,${imageBase64}`
        : selectedImageUri;

      const response = await apiFetch('/api/tasks/posture-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: imagePayload,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status)) {
        triggerHaptic('success');
        setScanResult({
          status: data.status || 'excellent',
          statusLabel: data.statusLabel || (data.status === 'excellent' ? 'Good Posture' : 'Needs Improvement'),
          score: typeof data.score === 'number' ? data.score : 85,
          message: data.message || 'Your posture looks healthy and well aligned. Keep maintaining these habits.',
          tips: Array.isArray(data.tips) ? data.tips : [
            'Keep your shoulders relaxed and open',
            'Maintain head alignment directly over your shoulders',
            'Take periodic stretch breaks during prolonged sitting'
          ],
          landmarks: data.landmarks || {
            headPosition: 'Aligned with shoulders',
            shoulderAlignment: 'Level and relaxed',
            spineCurve: 'Neutral natural curve'
          }
        });

        // Animate result presentation
        Animated.parallel([
          Animated.timing(resultFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(resultCardSlideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        throw new Error(data.error || 'Failed to analyze posture. Please ensure the full body is visible.');
      }
    } catch (err: any) {
      console.error('Posture analysis error:', err);
      triggerHaptic('warning');
      Alert.alert(
        'Scan Notice',
        err.message || 'Please upload a clearer full-body photo so your posture can be assessed accurately.'
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      scanLoop.stop();
      setIsScanning(false);
    }
  };

  const handleScanAgain = () => {
    setSelectedImageUri(null);
    setImageBase64(null);
    setScanResult(null);
    resultFadeAnim.setValue(0);
    resultCardSlideAnim.setValue(20);
    triggerHaptic('light');
  };

  // ----------------------------------------------------
  // PAGE 3 -> PAGE 4
  // ----------------------------------------------------
  const handleProceedToCompletion = () => {
    transitionToPage(4);
  };

  // ----------------------------------------------------
  // PAGE 4: CELEBRATION & AUTHENTICATED POINTS CLAIM
  // ----------------------------------------------------
  useEffect(() => {
    if (page === 4) {
      Animated.spring(celebrationScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      Animated.timing(celebrationAuraAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.timing(rewardCardOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rewardCardSlideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti cascade
      confettiFallAnims.forEach((anim, i) => {
        anim.setValue(0);
        Animated.sequence([
          Animated.delay(CONFETTI_PARTICLES[i].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: CONFETTI_PARTICLES[i].duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [page]);

  const handleClaimPoints = async () => {
    if (isClaimingPoints || hasClaimedRef.current) return;
    hasClaimedRef.current = true;
    setIsClaimingPoints(true);
    triggerHaptic('medium');

    let pointsData = {
      pointsAdded: '100',
      totalPoints: '0',
      streak: '0',
    };

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        // Authenticated task completion request
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Posture check',
          }),
        });

        const data = await response.json();

        if (response.ok || data.success) {
          triggerHaptic('success');
          const earned = data.pointsEarned ?? data.pointsAdded ?? data.points_earned ?? 100;
          const total = data.totalPoints ?? data.total_points ?? 0;
          const streakNum = data.currentStreak ?? data.current_streak ?? data.streak ?? 0;

          pointsData = {
            pointsAdded: earned.toString(),
            totalPoints: total.toString(),
            streak: streakNum.toString(),
          };
        } else {
          hasClaimedRef.current = false;
          Alert.alert('Error', data.error || 'Failed to submit task completion. Please try again.');
          setIsClaimingPoints(false);
          return;
        }
      } else {
        hasClaimedRef.current = false;
        Alert.alert('Authorization Error', 'No authorization token found. Please log in again.');
        setIsClaimingPoints(false);
        return;
      }
    } catch (e) {
      console.error('Error claiming points:', e);
      hasClaimedRef.current = false;
      Alert.alert('Connection Error', 'Network request failed. Please check your connection and try again.');
      setIsClaimingPoints(false);
      return;
    } finally {
      setIsClaimingPoints(false);
    }

    // Navigate to existing task-success route
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Posture check',
        task_name: 'Posture check',
        difficulty: 'Easy',
        message: 'You took a moment to understand and improve your posture.',
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Ambient Breathing Light Wellness Background */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: bgAuraScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#fdfcf7', '#f0fdf4']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Floating Ambient Wellness Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {AMBIENT_PARTICLES.map((p) => (
          <View
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
            }}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              if (page > 1) {
                transitionToPage((page - 1) as 1 | 2 | 3);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)');
              }
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          {/* Step Pill Indicator */}
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Page {page} of 4</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Dynamic Animated Content Container */}
        <Animated.View
          style={[
            styles.pageContainer,
            {
              opacity: pageFadeAnim,
              transform: [{ translateY: pageSlideAnim }],
            },
          ]}
        >
          {/* ==================================================== */}
          {/* PAGE 1 — CINEMATIC POSTURE INTRO */}
          {/* ==================================================== */}
          {page === 1 && (
            <ScrollView
              contentContainerStyle={styles.page1Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Hero Animated Silhouette Visual */}
              <Animated.View
                style={[
                  styles.heroSilhouetteCard,
                  {
                    opacity: heroFadeAnim,
                    transform: [{ scale: heroScaleAnim }],
                  },
                ]}
              >
                <View style={styles.silhouetteWrapper}>
                  <Svg width={180} height={210} viewBox="0 0 180 210">
                    <Defs>
                      <SvgLinearGradient id="spineGlow" x1="0%" y1="100%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <Stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </SvgLinearGradient>
                      <SvgLinearGradient id="bodyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.9" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Subtle aura behind silhouette */}
                    <Circle cx="90" cy="105" r="75" fill="rgba(16, 185, 129, 0.07)" />

                    {/* Body Silhouette Geometry (Head, Torso, Hips) */}
                    {/* Head */}
                    <Circle cx="90" cy="38" r="18" fill="url(#bodyGlow)" stroke="#94a3b8" strokeWidth="1.5" />

                    {/* Torso / Upper Body */}
                    <Path
                      d="M 64 68 Q 90 62 116 68 L 112 145 Q 90 148 68 145 Z"
                      fill="url(#bodyGlow)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />

                    {/* Hips */}
                    <Path
                      d="M 66 145 Q 90 148 114 145 L 110 175 Q 90 178 70 175 Z"
                      fill="url(#bodyGlow)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />

                    {/* Glowing Spinal Alignment Line */}
                    <Line
                      x1="90"
                      y1="56"
                      x2="90"
                      y2="162"
                      stroke="url(#spineGlow)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Subtle Vertebrae Nodes */}
                    <Circle cx="90" cy="62" r="3" fill="#10b981" />
                    <Circle cx="90" cy="84" r="3" fill="#10b981" />
                    <Circle cx="90" cy="108" r="3" fill="#10b981" />
                    <Circle cx="90" cy="132" r="3" fill="#10b981" />
                    <Circle cx="90" cy="154" r="3" fill="#10b981" />
                  </Svg>

                  {/* Sequential Alignment Markers overlay */}
                  <Animated.View
                    style={[
                      styles.alignmentMarker,
                      { top: 28, left: 130, opacity: markerHeadAnim, transform: [{ scale: markerHeadAnim }] },
                    ]}
                  >
                    <View style={styles.markerDot} />
                    <Text style={styles.markerText}>Head</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.alignmentMarker,
                      { top: 64, left: 8, opacity: markerShouldersAnim, transform: [{ scale: markerShouldersAnim }] },
                    ]}
                  >
                    <Text style={styles.markerText}>Shoulders</Text>
                    <View style={styles.markerDot} />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.alignmentMarker,
                      { top: 104, left: 132, opacity: markerSpineAnim, transform: [{ scale: markerSpineAnim }] },
                    ]}
                  >
                    <View style={styles.markerDot} />
                    <Text style={styles.markerText}>Spine</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.alignmentMarker,
                      { top: 148, left: 18, opacity: markerHipsAnim, transform: [{ scale: markerHipsAnim }] },
                    ]}
                  >
                    <Text style={styles.markerText}>Hips</Text>
                    <View style={styles.markerDot} />
                  </Animated.View>
                </View>

                {/* Subtle Alignment Status Indicator */}
                <View style={styles.alignmentStatusPill}>
                  <Feather name="check-circle" size={14} color="#10b981" />
                  <Text style={styles.alignmentStatusText}>Dynamic Biomechanical Alignment</Text>
                </View>
              </Animated.View>

              {/* Title and Short Explanation */}
              <Animated.View
                style={[
                  styles.page1ContentWrapper,
                  {
                    opacity: introTextAnim,
                    transform: [
                      {
                        translateY: introTextAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [18, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.taskTitle}>Posture Check</Text>
                <Text style={styles.taskSubtitle}>
                  Small alignment changes can make a big difference.
                </Text>

                {/* Short Premium Explanation */}
                <View style={styles.explanationCard}>
                  <Text style={styles.explanationText}>
                    Take a moment to understand your posture, then use the camera to check your alignment.
                  </Text>
                </View>

                {/* Badges: 5 min, Easy, +100 Points */}
                <View style={styles.badgeRow}>
                  <View style={[styles.badgePill, styles.badgeTime]}>
                    <Feather name="clock" size={13} color="#0284c7" />
                    <Text style={[styles.badgeText, { color: '#0284c7' }]}>5 min</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeDifficulty]}>
                    <Feather name="feather" size={13} color="#059669" />
                    <Text style={[styles.badgeText, { color: '#059669' }]}>Easy</Text>
                  </View>

                  <View style={[styles.badgePill, styles.badgeReward]}>
                    <Ionicons name="sparkles" size={13} color="#d97706" />
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>+100 Points</Text>
                  </View>
                </View>

                {/* Small Animated Prompt Indicator */}
                <View style={styles.promptIndicatorRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.promptIndicatorText}>Ready to check your posture?</Text>
                </View>
              </Animated.View>

              {/* Primary Action Button: "Start Posture Check" */}
              <Animated.View
                style={[
                  styles.ctaContainer,
                  {
                    transform: [{ scale: startButtonSpringAnim }],
                    opacity: startButtonSpringAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleStartPostureCheck}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Start Posture Check</Text>
                    <Feather name="arrow-right" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 2 — POSTURE EDUCATION VIDEOS */}
          {/* ==================================================== */}
          {page === 2 && (
            <ScrollView
              contentContainerStyle={styles.page2Scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pageHeader}>
                <Text style={styles.pageHeaderTitle}>Understand Your Posture</Text>
                <Text style={styles.pageHeaderSubtitle}>
                  Watch these short guides before your posture scan.
                </Text>

                {/* Video Completion Progress Pill */}
                <View style={styles.progressPill}>
                  <Ionicons
                    name={allVideosCompleted ? 'checkmark-circle' : 'time-outline'}
                    size={16}
                    color={allVideosCompleted ? '#10b981' : '#64748b'}
                  />
                  <Text style={styles.progressPillText}>
                    Completed: {[video1Completed, video2Completed, video3Completed].filter(Boolean).length} of 3 Guides
                  </Text>
                </View>
              </View>

              {/* VIDEO 1: Recognize Poor Posture */}
              <View style={styles.videoCard}>
                <View style={styles.videoCardHeader}>
                  <View style={styles.videoNumberBadge}>
                    <Text style={styles.videoNumberText}>1</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.videoTitle}>1. Recognize Poor Posture</Text>
                    <Text style={styles.videoSubtitle}>Identify rounded shoulders and forward neck tilt.</Text>
                  </View>
                  {video1Completed && (
                    <View style={styles.completedCheckBadge}>
                      <Feather name="check" size={14} color="#ffffff" />
                    </View>
                  )}
                </View>

                <View style={styles.videoWrapper}>
                  <VideoView
                    player={player1}
                    style={styles.videoPlayer}
                    contentFit="cover"
                    nativeControls
                  />
                </View>

                <View style={styles.videoFooterRow}>
                  <TouchableOpacity
                    style={styles.playTriggerButton}
                    onPress={() => {
                      triggerHaptic('light');
                      player1.play();
                    }}
                  >
                    <Feather name="play" size={14} color="#059669" />
                    <Text style={styles.playTriggerText}>Play Guide</Text>
                  </TouchableOpacity>

                  {video1Completed ? (
                    <Text style={styles.watchedStatusText}>Completed ✓</Text>
                  ) : (
                    <Text style={styles.unwatchedStatusText}>Watch to complete</Text>
                  )}
                </View>
              </View>

              {/* VIDEO 2: Understand Proper Alignment */}
              <View style={styles.videoCard}>
                <View style={styles.videoCardHeader}>
                  <View style={styles.videoNumberBadge}>
                    <Text style={styles.videoNumberText}>2</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.videoTitle}>2. Understand Proper Alignment</Text>
                    <Text style={styles.videoSubtitle}>Learn the neutral spine position and chest opening.</Text>
                  </View>
                  {video2Completed && (
                    <View style={styles.completedCheckBadge}>
                      <Feather name="check" size={14} color="#ffffff" />
                    </View>
                  )}
                </View>

                <View style={styles.videoWrapper}>
                  <VideoView
                    player={player2}
                    style={styles.videoPlayer}
                    contentFit="cover"
                    nativeControls
                  />
                </View>

                <View style={styles.videoFooterRow}>
                  <TouchableOpacity
                    style={styles.playTriggerButton}
                    onPress={() => {
                      triggerHaptic('light');
                      player2.play();
                    }}
                  >
                    <Feather name="play" size={14} color="#059669" />
                    <Text style={styles.playTriggerText}>Play Guide</Text>
                  </TouchableOpacity>

                  {video2Completed ? (
                    <Text style={styles.watchedStatusText}>Completed ✓</Text>
                  ) : (
                    <Text style={styles.unwatchedStatusText}>Watch to complete</Text>
                  )}
                </View>
              </View>

              {/* VIDEO 3: Build Better Posture Awareness */}
              <View style={styles.videoCard}>
                <View style={styles.videoCardHeader}>
                  <View style={styles.videoNumberBadge}>
                    <Text style={styles.videoNumberText}>3</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.videoTitle}>3. Build Better Posture Awareness</Text>
                    <Text style={styles.videoSubtitle}>Integrate regular alignment checks into daily life.</Text>
                  </View>
                  {video3Completed && (
                    <View style={styles.completedCheckBadge}>
                      <Feather name="check" size={14} color="#ffffff" />
                    </View>
                  )}
                </View>

                <View style={styles.videoWrapper}>
                  <VideoView
                    player={player3}
                    style={styles.videoPlayer}
                    contentFit="cover"
                    nativeControls
                  />
                </View>

                <View style={styles.videoFooterRow}>
                  <TouchableOpacity
                    style={styles.playTriggerButton}
                    onPress={() => {
                      triggerHaptic('light');
                      player3.play();
                    }}
                  >
                    <Feather name="play" size={14} color="#059669" />
                    <Text style={styles.playTriggerText}>Play Guide</Text>
                  </TouchableOpacity>

                  {video3Completed ? (
                    <Text style={styles.watchedStatusText}>Completed ✓</Text>
                  ) : (
                    <Text style={styles.unwatchedStatusText}>Watch to complete</Text>
                  )}
                </View>
              </View>

              {/* Bottom CTA to Continue to Page 3 */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    !allVideosCompleted && styles.disabledActionButton,
                  ]}
                  onPress={handleContinueToScan}
                  activeOpacity={allVideosCompleted ? 0.88 : 1}
                  disabled={!allVideosCompleted}
                >
                  <LinearGradient
                    colors={
                      allVideosCompleted
                        ? ['#10b981', '#059669']
                        : ['#cbd5e1', '#94a3b8']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <Text style={styles.primaryButtonText}>Continue to AI Posture Scan</Text>
                    <Feather
                      name={allVideosCompleted ? 'arrow-right' : 'lock'}
                      size={18}
                      color="#ffffff"
                      style={{ marginLeft: 8 }}
                    />
                  </LinearGradient>
                </TouchableOpacity>

                {!allVideosCompleted && (
                  <Text style={styles.unlockHintText}>
                    Finish all 3 video guides above to unlock the AI Posture Scan
                  </Text>
                )}
              </View>
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 3 — AI POSTURE SCAN */}
          {/* ==================================================== */}
          {page === 3 && (
            <ScrollView
              contentContainerStyle={styles.page3Scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pageHeader}>
                <Text style={styles.pageHeaderTitle}>AI Posture Scan</Text>
                <Text style={styles.pageHeaderSubtitle}>
                  Upload a clear photo of yourself standing naturally and let the posture analysis check your alignment.
                </Text>
              </View>

              {/* Photo Area / Preview */}
              {!selectedImageUri ? (
                <View style={styles.uploadPlaceholderCard}>
                  {/* Subtle animated scan beam indicator */}
                  <View style={styles.cameraGraphicBox}>
                    <Ionicons name="body-outline" size={54} color="#10b981" />
                    <View style={styles.scanLineGraphic} />
                  </View>

                  <Text style={styles.uploadCardTitle}>Upload Posture Photo</Text>
                  <Text style={styles.uploadCardSubtitle}>
                    Use a clear full-body photo standing naturally
                  </Text>

                  {/* Guidance Box */}
                  <View style={styles.guidanceBox}>
                    <Ionicons name="information-circle-outline" size={18} color="#0284c7" />
                    <Text style={styles.guidanceText}>
                      For the most useful result, stand naturally and make sure your head, shoulders, back and hips are visible.
                    </Text>
                  </View>

                  {/* Upload Action Buttons: Camera & Gallery */}
                  <View style={styles.uploadButtonsRow}>
                    <TouchableOpacity
                      style={styles.uploadChoiceButton}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <Feather name="camera" size={18} color="#059669" />
                      <Text style={styles.uploadChoiceText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.uploadChoiceButton, styles.uploadChoiceButtonPrimary]}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <Feather name="image" size={18} color="#ffffff" />
                      <Text style={[styles.uploadChoiceText, { color: '#ffffff' }]}>From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.previewCard}>
                  <View style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={styles.postureImagePreview}
                      resizeMode="cover"
                    />

                    {/* Animated Scanning Beam during analysis */}
                    {isScanning && (
                      <Animated.View
                        style={[
                          styles.activeScanBeam,
                          {
                            transform: [
                              {
                                translateY: scanLineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 254],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={['rgba(56, 189, 248, 0)', 'rgba(56, 189, 248, 0.85)', 'rgba(56, 189, 248, 0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.scanBeamGradient}
                        />
                      </Animated.View>
                    )}
                  </View>

                  {/* Scanning Loading State */}
                  {isScanning && (
                    <View style={styles.scanningStatusBox}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={styles.scanningStatusText}>{scanningStepText}</Text>
                    </View>
                  )}

                  {/* Retake / Change Photo button */}
                  {!isScanning && !scanResult && (
                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.retakeButton}
                        onPress={handleScanAgain}
                        activeOpacity={0.8}
                      >
                        <Feather name="rotate-ccw" size={16} color="#64748b" />
                        <Text style={styles.retakeButtonText}>Retake Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={handleAnalyzePosture}
                        activeOpacity={0.88}
                      >
                        <LinearGradient
                          colors={['#10b981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.analyzeGradient}
                        >
                          <Text style={styles.analyzeButtonText}>Analyze My Posture</Text>
                          <Feather name="zap" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* POSTURE REPORT DISPLAY (When AI analysis finishes) */}
              {scanResult && (
                <Animated.View
                  style={[
                    styles.resultReportCard,
                    {
                      opacity: resultFadeAnim,
                      transform: [{ translateY: resultCardSlideAnim }],
                    },
                  ]}
                >
                  <View style={styles.resultHeaderRow}>
                    <View>
                      <Text style={styles.resultHeaderLabel}>Posture Analysis</Text>
                      <Text
                        style={[
                          styles.resultStatusTitle,
                          {
                            color:
                              scanResult.status === 'excellent' || scanResult.statusLabel.includes('Good')
                                ? '#10b981'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {scanResult.status === 'excellent' || scanResult.statusLabel.includes('Good')
                          ? 'Good Posture ✓'
                          : 'Posture Needs Improvement ⚠'}
                      </Text>
                    </View>

                    {/* Score Badge */}
                    <View style={styles.scoreBadgeBox}>
                      <Text style={styles.scoreNumber}>{scanResult.score}</Text>
                      <Text style={styles.scoreDenominator}>/ 100</Text>
                    </View>
                  </View>

                  {/* Observational Message */}
                  <View style={styles.observationBox}>
                    <Text style={styles.observationMessageText}>{scanResult.message}</Text>
                  </View>

                  {/* Alignment Landmarks Breakdown */}
                  {scanResult.landmarks && (
                    <View style={styles.landmarksSection}>
                      <Text style={styles.sectionTitle}>Visible Alignment Breakdown</Text>
                      <View style={styles.landmarkItem}>
                        <Feather name="compass" size={15} color="#059669" />
                        <Text style={styles.landmarkLabel}>Head Position:</Text>
                        <Text style={styles.landmarkValue}>{scanResult.landmarks.headPosition || 'Aligned'}</Text>
                      </View>
                      <View style={styles.landmarkItem}>
                        <Feather name="maximize-2" size={15} color="#059669" />
                        <Text style={styles.landmarkLabel}>Shoulders:</Text>
                        <Text style={styles.landmarkValue}>{scanResult.landmarks.shoulderAlignment || 'Relaxed'}</Text>
                      </View>
                      <View style={styles.landmarkItem}>
                        <Feather name="git-commit" size={15} color="#059669" />
                        <Text style={styles.landmarkLabel}>Spine:</Text>
                        <Text style={styles.landmarkValue}>{scanResult.landmarks.spineCurve || 'Neutral'}</Text>
                      </View>
                    </View>
                  )}

                  {/* Improvement / Maintenance Tips */}
                  <View style={styles.tipsSection}>
                    <Text style={styles.sectionTitle}>
                      {scanResult.status === 'excellent' ? 'Maintenance Guidance' : 'Areas to Improve'}
                    </Text>
                    {scanResult.tips.map((tip, idx) => (
                      <View key={idx} style={styles.tipRow}>
                        <View style={styles.tipBullet} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons: Scan Again & Proceed */}
                  <View style={styles.resultActionsRow}>
                    <TouchableOpacity
                      style={styles.scanAgainButton}
                      onPress={handleScanAgain}
                      activeOpacity={0.8}
                    >
                      <Feather name="rotate-ccw" size={15} color="#64748b" />
                      <Text style={styles.scanAgainText}>Scan Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.proceedButton}
                      onPress={handleProceedToCompletion}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.proceedGradient}
                      >
                        <Text style={styles.proceedButtonText}>Proceed to Completion</Text>
                        <Feather name="arrow-right" size={17} color="#ffffff" style={{ marginLeft: 6 }} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          )}

          {/* ==================================================== */}
          {/* PAGE 4 — COMPLETION & REWARD CLAIM */}
          {/* ==================================================== */}
          {page === 4 && (
            <ScrollView
              contentContainerStyle={styles.page4Scroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Falling Confetti Particles */}
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {CONFETTI_PARTICLES.map((particle, i) => (
                  <Animated.View
                    key={particle.id}
                    style={{
                      position: 'absolute',
                      left: particle.x,
                      top: -20,
                      width: particle.size,
                      height: particle.size * 1.5,
                      borderRadius: 2,
                      backgroundColor: particle.color,
                      transform: [
                        {
                          translateY: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, height * 0.75],
                          }),
                        },
                        {
                          rotate: confettiFallAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                      opacity: confettiFallAnims[i].interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [1, 0.9, 0],
                      }),
                    }}
                  />
                ))}
              </View>

              {/* Spring Medallion Visual */}
              <View style={styles.celebrationCenter}>
                <Animated.View
                  style={[
                    styles.celebrationAuraRing,
                    {
                      transform: [
                        {
                          scale: celebrationAuraAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.6, 1.4],
                          }),
                        },
                      ],
                      opacity: celebrationAuraAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.4, 0.7, 0.2],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.celebrationMedallion,
                    {
                      transform: [{ scale: celebrationScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.medallionGradient}
                  >
                    <Ionicons name="checkmark-sharp" size={48} color="#ffffff" />
                  </LinearGradient>
                </Animated.View>
              </View>

              {/* Completion Headlines */}
              <View style={styles.completionHeaders}>
                <Text style={styles.completionTitle}>Posture Check Complete</Text>
                <Text style={styles.completionSubtitle}>
                  You took a moment to understand and improve your posture.
                </Text>
              </View>

              {/* Prominent +100 Points Reward Card */}
              <Animated.View
                style={[
                  styles.rewardCardContainer,
                  {
                    opacity: rewardCardOpacityAnim,
                    transform: [{ translateY: rewardCardSlideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ffffff', '#fdfcf7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rewardCardGradient}
                >
                  <View style={styles.rewardTrophyCircle}>
                    <Ionicons name="trophy" size={28} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.rewardLabel}>AUTHENTIC REWARD</Text>
                    <Text style={styles.rewardPointsAmount}>+100 Points</Text>
                  </View>
                  <View style={styles.rewardVerifiedPill}>
                    <Feather name="shield" size={13} color="#10b981" />
                    <Text style={styles.rewardVerifiedText}>Backend Verified</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Summary of What Was Accomplished */}
              <View style={styles.accomplishmentSummaryCard}>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Studied 3 posture alignment video guides</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Completed AI full-body posture analysis</Text>
                </View>
                <View style={styles.accomplishmentRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={styles.accomplishmentText}>Practiced mindful spinal alignment</Text>
                </View>
              </View>

              {/* Authenticated Claim Button */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionButton,
                    isClaimingPoints && styles.disabledActionButton,
                  ]}
                  onPress={handleClaimPoints}
                  activeOpacity={0.88}
                  disabled={isClaimingPoints}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {isClaimingPoints ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[styles.primaryButtonText, { marginLeft: 10 }]}>
                          Verifying with Backend...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Claim +100 Points</Text>
                        <Ionicons name="sparkles" size={19} color="#ffffff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  pageContainer: {
    flex: 1,
  },

  // PAGE 1 STYLES
  page1Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSilhouetteCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  silhouetteWrapper: {
    width: 180,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alignmentMarker: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginHorizontal: 3,
  },
  markerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  alignmentStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  alignmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  page1ContentWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  taskSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  explanationCard: {
    width: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  explanationText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTime: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  badgeDifficulty: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  badgeReward: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  promptIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 7,
  },
  promptIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  ctaContainer: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  primaryActionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledActionButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // PAGE 2 STYLES
  page2Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  pageHeaderSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  videoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  videoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  videoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  completedCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  playTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  playTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 5,
  },
  watchedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  unwatchedStatusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  unlockHintText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },

  // PAGE 3 STYLES
  page3Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  uploadPlaceholderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cameraGraphicBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scanLineGraphic: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#38bdf8',
    top: 45,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  uploadCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 18,
    marginLeft: 8,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  uploadChoiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  uploadChoiceButtonPrimary: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  uploadChoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  postureImagePreview: {
    width: '100%',
    height: '100%',
  },
  activeScanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    zIndex: 10,
  },
  scanBeamGradient: {
    width: '100%',
    height: '100%',
  },
  scanningStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  scanningStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
  },
  previewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  retakeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  analyzeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // RESULT REPORT STYLES
  resultReportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  resultHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultStatusTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  scoreBadgeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  scoreDenominator: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 2,
  },
  observationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  observationMessageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  landmarksSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  landmarkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  landmarkValue: {
    fontSize: 13,
    color: '#0f172a',
    marginLeft: 6,
  },
  tipsSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 6,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  resultActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  scanAgainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  proceedButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  proceedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // PAGE 4 STYLES
  page4Scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  celebrationCenter: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    position: 'relative',
  },
  celebrationAuraRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  celebrationMedallion: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  medallionGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionHeaders: {
    alignItems: 'center',
    marginTop: 18,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  rewardCardContainer: {
    width: '100%',
    marginTop: 22,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rewardTrophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    letterSpacing: 0.8,
  },
  rewardPointsAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  rewardVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  rewardVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  accomplishmentSummaryCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accomplishmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  accomplishmentText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
  },
});
