import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Video, ResizeMode } from 'expo-av';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import { apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Haptic helper
const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (err) {
    console.warn('Haptics not supported:', err);
  }
};

// --- ANIMATED FLOATING LEAVES & DUST PARTICLES (Hooks Safe) ---
const FloatingParticle = ({ index, colorTheme }: { index: number; colorTheme?: 'dark' | 'light' | 'gold' }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(Math.random() * height + 100);
  const scale = useSharedValue(Math.random() * 0.5 + 0.4);
  const opacity = useSharedValue(Math.random() * 0.4 + 0.15);
  const rotation = useSharedValue(Math.random() * 360);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(x.value + (Math.random() * 80 - 40), {
        duration: 5000 + Math.random() * 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    y.value = withRepeat(
      withTiming(y.value - (120 + Math.random() * 100), {
        duration: 7000 + Math.random() * 5000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    rotation.value = withRepeat(
      withTiming(rotation.value + 180, {
        duration: 6000 + Math.random() * 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const isLeaf = index % 2 === 0;

  // Decide colors based on screen background themes
  let particleColor = 'rgba(110, 231, 183, 0.4)'; // Emerald green (default)
  let dotColor = 'rgba(253, 230, 138, 0.5)'; // Gold dot (default)

  if (colorTheme === 'light') {
    particleColor = 'rgba(99, 102, 241, 0.25)'; // Indigo/blue for reflection
    dotColor = 'rgba(147, 197, 253, 0.4)';
  } else if (colorTheme === 'gold') {
    particleColor = 'rgba(245, 158, 11, 0.45)'; // Amber/gold for rewards
    dotColor = 'rgba(252, 211, 77, 0.6)';
  }

  return (
    <Animated.View style={animatedStyle}>
      {isLeaf ? (
        <Ionicons name="leaf-outline" size={16} color={particleColor} />
      ) : (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: dotColor,
            shadowColor: colorTheme === 'gold' ? '#F59E0B' : '#60A5FA',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 3,
          }}
        />
      )}
    </Animated.View>
  );
};

const FloatingElements = ({ count = 12, colorTheme }: { count?: number; colorTheme?: 'dark' | 'light' | 'gold' }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(count)].map((_, i) => (
        <FloatingParticle key={`particle-${i}`} index={i} colorTheme={colorTheme} />
      ))}
    </View>
  );
};

// --- GUST OF WIND TRANSITION LEAF ---
interface GustLeafProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotate: SharedValue<number>;
}

const GustLeaf = ({ x, y, rotate }: GustLeafProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    transform: [{ rotate: `${rotate.value}deg` }],
    opacity: 0.9,
    zIndex: 9999,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="leaf" size={28} color="#10B981" />
    </Animated.View>
  );
};

// --- MISSION CARD STAGGERED ROW ---
const MissionItem = ({ text, index }: { text: string; index: number }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 250, withSpring(1, { damping: 10, stiffness: 80 }));
    opacity.value = withDelay(index * 250, withTiming(1, { duration: 550 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.missionItemRow, animatedStyle]}>
      <Animated.View style={{ marginRight: 12 }}>
        <Ionicons name="heart-circle-outline" size={22} color="#10B981" />
      </Animated.View>
      <Text style={styles.missionItemText}>{text}</Text>
    </Animated.View>
  );
};

// --- ORB SPARK PARTICLE ---
const OrbSpark = ({
  angle,
  translate,
  opacity,
}: {
  angle: number;
  translate: SharedValue<number>;
  opacity: SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: translate.value * Math.cos(angle) },
      { translateY: translate.value * Math.sin(angle) },
    ],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.sparkParticle, animatedStyle]} />;
};

// --- COMPASS-EYE WELCOME ICON (Page 1) ---
const EyeCompassIllustration = () => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.eyeContainer}>
      <Animated.View style={[styles.eyeHalo, haloStyle]} />
      <Svg width="90" height="90" viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgLinearGradient id="eyeCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#047857" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="40" fill="rgba(16, 185, 129, 0.08)" stroke="url(#eyeCircleGrad)" strokeWidth="3" />
        <Path d="M25 50 Q50 25, 75 50 Q50 75, 25 50 Z" stroke="#FFFFFF" strokeWidth="2.5" fill="rgba(255,255,255,0.15)" />
        <Circle cx="50" cy="50" r="12" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
        <Circle cx="52" cy="48" r="4.5" fill="#FFFFFF" />
        <Path d="M50 18 L50 24M50 76 L50 82M18 50 L24 50M76 50 L82 50" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

// --- NOTEBOOK ILLUSTRATION (Page 2) ---
const NotebookIllustration = () => {
  return (
    <View style={styles.notebookContainer}>
      <Svg width="85" height="85" viewBox="0 0 24 24" fill="none">
        <Defs>
          <SvgLinearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#4F46E5" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
          fill="url(#bookGrad)"
          opacity="0.15"
          stroke="url(#bookGrad)"
          strokeWidth="1.5"
        />
        <Path d="M4 6h2M4 10h2M4 14h2M4 18h2" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        <Path d="M9 7h8M9 11h8M9 15h6" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <Path
          d="M17 19l3.5-3.5a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0L14 16m3 3l-3-3m3 3l-1.5 1.5H14v-1.5l1.5-1.5"
          stroke="#FBBF24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// --- SUCCESS LEAF-EYE GOLD BADGE (Page 3) ---
const SuccessBadge = () => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 85 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.badgeOuterContainer, animatedStyle]}>
      <Svg width="150" height="150" viewBox="0 0 120 120" fill="none">
        <Defs>
          <SvgRadialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
            <Stop offset="60%" stopColor="#FBBF24" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgLinearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#D97706" />
          </SvgLinearGradient>
          <SvgLinearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#047857" />
            <Stop offset="50%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill="url(#badgeGlow)" />
        <Circle cx="60" cy="60" r="42" stroke="url(#badgeGold)" strokeWidth="3" strokeDasharray="6 3" />
        <G transform="translate(60,60) rotate(-45) translate(-60,-60)">
          <Path
            d="M60 22 C83 45, 83 75, 60 98 C37 75, 37 45, 60 22 Z"
            fill="url(#leafGrad)"
            stroke="url(#badgeGold)"
            strokeWidth="2.5"
          />
        </G>
        <G transform="translate(60, 60)">
          <Path
            d="M-16 0 C-7 -10, 7 -10, 16 0 C7 10, -7 10, -16 0 Z"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            fill="rgba(255,255,255,0.18)"
          />
          <Circle cx="0" cy="0" r="5" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.2" />
          <Circle cx="-1.5" cy="-1.5" r="1.3" fill="#FFFFFF" />
        </G>
      </Svg>
    </Animated.View>
  );
};

// --- ROTATING LIGHT RAYS (Page 3 Background) ---
const LightRays = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    position: 'absolute',
    width: width * 1.8,
    height: width * 1.8,
    opacity: 0.22,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
        <Path d="M100 100 L30 -20 L70 -20 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L220 30 L220 70 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L170 220 L130 220 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L-20 170 L-20 130 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L130 -20 L170 -20 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L220 130 L220 170 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L70 220 L30 220 Z" fill="#FDE047" opacity="0.4" />
        <Path d="M100 100 L-20 30 L-20 70 Z" fill="#FDE047" opacity="0.4" />
      </Svg>
    </Animated.View>
  );
};

// --- STAGGERED ACHIEVEMENT CARD ---
const AchievementCard = ({ emoji, title, desc, index }: { emoji: string; title: string; desc: string; index: number }) => {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 200 + 400).duration(600)}
      style={styles.achievementWrapper}
    >
      <BlurView intensity={25} tint="light" style={styles.achievementCard}>
        <Text style={styles.achievementEmoji}>{emoji}</Text>
        <Text style={styles.achievementName}>{title}</Text>
        <Text style={styles.achievementDesc}>{desc}</Text>
      </BlurView>
    </Animated.View>
  );
};

export default function SocialObservationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(1);
  const [observation, setObservation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Transition Leaves coordinates (individually declared hooks to adhere to Rules of Hooks)
  const lx0 = useSharedValue(-100);
  const lx1 = useSharedValue(-100);
  const lx2 = useSharedValue(-100);
  const lx3 = useSharedValue(-100);
  const lx4 = useSharedValue(-100);
  const lx5 = useSharedValue(-100);
  const lx6 = useSharedValue(-100);
  const lx7 = useSharedValue(-100);
  const lx8 = useSharedValue(-100);
  const lx9 = useSharedValue(-100);
  const lx10 = useSharedValue(-100);
  const lx11 = useSharedValue(-100);

  const ly0 = useSharedValue(height + 100);
  const ly1 = useSharedValue(height + 100);
  const ly2 = useSharedValue(height + 100);
  const ly3 = useSharedValue(height + 100);
  const ly4 = useSharedValue(height + 100);
  const ly5 = useSharedValue(height + 100);
  const ly6 = useSharedValue(height + 100);
  const ly7 = useSharedValue(height + 100);
  const ly8 = useSharedValue(height + 100);
  const ly9 = useSharedValue(height + 100);
  const ly10 = useSharedValue(height + 100);
  const ly11 = useSharedValue(height + 100);

  const lr0 = useSharedValue(0);
  const lr1 = useSharedValue(0);
  const lr2 = useSharedValue(0);
  const lr3 = useSharedValue(0);
  const lr4 = useSharedValue(0);
  const lr5 = useSharedValue(0);
  const lr6 = useSharedValue(0);
  const lr7 = useSharedValue(0);
  const lr8 = useSharedValue(0);
  const lr9 = useSharedValue(0);
  const lr10 = useSharedValue(0);
  const lr11 = useSharedValue(0);

  const leavesX = [lx0, lx1, lx2, lx3, lx4, lx5, lx6, lx7, lx8, lx9, lx10, lx11];
  const leavesY = [ly0, ly1, ly2, ly3, ly4, ly5, ly6, ly7, ly8, ly9, ly10, ly11];
  const leavesRotate = [lr0, lr1, lr2, lr3, lr4, lr5, lr6, lr7, lr8, lr9, lr10, lr11];

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rewards state
  const [pointsAwarded, setPointsAwarded] = useState(300);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  const [tapCount, setTapCount] = useState(0);

  // Orb animations
  const orbScale = useSharedValue(1);
  const orbRotation = useSharedValue(0);
  const rippleScale = useSharedValue(0.8);
  const rippleOpacity = useSharedValue(0);
  const sparkTranslate = useSharedValue(0);
  const sparkOpacity = useSharedValue(0);

  useEffect(() => {
    // Breathing scale animation
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const handleOrbPress = () => {
    if (tapCount >= 5) return;
    
    const nextTapCount = tapCount + 1;
    triggerHaptic('light');
    setTapCount(nextTapCount);

    // Slight rotation bump
    orbRotation.value = withTiming(orbRotation.value + 72, { duration: 550, easing: Easing.out(Easing.quad) });

    // Tap ripple pulse
    rippleScale.value = 0.8;
    rippleOpacity.value = 1;
    rippleScale.value = withTiming(2.2, { duration: 700, easing: Easing.out(Easing.quad) });
    rippleOpacity.value = withTiming(0, { duration: 700 });

    // Spark burst explosion
    sparkTranslate.value = 0;
    sparkOpacity.value = 0.9;
    sparkTranslate.value = withTiming(75, { duration: 500, easing: Easing.out(Easing.quad) });
    sparkOpacity.value = withTiming(0, { duration: 500 });
    
    if (nextTapCount === 5) {
      triggerHaptic('success');
    }
  };

  const instructions = [
    { emoji: '👀', text: 'Notice the people around you.' },
    { emoji: '🤝', text: 'Look for kindness and respect.' },
    { emoji: '🌿', text: 'Observe without judging.' },
    { emoji: '💙', text: 'Find one meaningful moment.' },
    { emoji: '✨', text: 'Write one positive social observation.' }
  ];

  const introScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (tapCount > 0) {
      setTimeout(() => {
        introScrollRef.current?.scrollToEnd({ animated: true });
      }, 350);
    }
  }, [tapCount]);

  // Pulse effect for Start button on completion
  const startBtnScale = useSharedValue(1);
  useEffect(() => {
    if (page === 1 && tapCount === 5) {
      startBtnScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [page, tapCount]);

  const startBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnScale.value }],
  }));

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbScale.value },
      { rotate: `${orbRotation.value}deg` }
    ],
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const handleBeginObservation = () => {
    triggerHaptic('medium');
    setIsTransitioning(true);

    // Staggered leaf gust sweep animation
    for (let i = 0; i < 12; i++) {
      const startX = -60 - Math.random() * 80;
      const startY = height - Math.random() * 200;

      leavesX[i].value = startX;
      leavesY[i].value = startY;
      leavesRotate[i].value = 0;

      leavesX[i].value = withDelay(
        i * 50,
        withTiming(width + 80, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
      leavesY[i].value = withDelay(
        i * 50,
        withTiming(-80, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
      leavesRotate[i].value = withDelay(
        i * 50,
        withTiming(720, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
    }

    setTimeout(() => {
      setPage(2);
      setIsTransitioning(false);
    }, 1300);
  };

  const handleSaveObservation = async () => {
    if (observation.trim().length < 20 || isSaving) return;
    setIsSaving(true);
    triggerHaptic('medium');

    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskName: 'Write 1 Social Observation',
          completed: true,
          response_text: observation.trim(),
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (response.ok || data.success) {
        triggerHaptic('success');
        setPointsAwarded(data.pointsAdded || 300);
        setTotalPoints(data.totalPoints || 0);
        setStreakCount(data.streak || 0);
        setPage(3);
      } else {
        alert(data.error || 'Failed to complete task. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to complete observation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishTask = () => {
    triggerHaptic('medium');
    router.replace({
      pathname: '/(tabs)',
      params: {
        updatedPoints: totalPoints.toString(),
        updatedStreak: streakCount.toString(),
      },
    } as any);
  };

  // --- RENDERING PAGES ---

  // Page 1: Welcome Onboarding Experience
  const renderWelcomePage = () => {
    return (
      <View style={styles.container}>
        {/* Full screen looping video */}
        <View style={StyleSheet.absoluteFillObject}>
          <Video
            source={require('../assets/videos/Create_a_cinematic_second_v.mp4')}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.darkOverlay, { backgroundColor: 'rgba(10, 15, 30, 0.55)' }]} />
        </View>

        {/* Floating particles */}
        <FloatingElements count={10} colorTheme="dark" />

        {/* Gust of wind transition leaves */}
        {isTransitioning &&
          [...Array(12)].map((_, idx) => (
            <GustLeaf
              key={`gust-${idx}`}
              x={leavesX[idx]}
              y={leavesY[idx]}
              rotate={leavesRotate[idx]}
            />
          ))}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerBarWelcome}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                router.back();
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            ref={introScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentIntro}
          >
            {/* Title Section */}
            <View style={styles.titleSectionIntro}>
              <Text style={styles.mainTitleIntro}>
                {tapCount === 5 ? 'Mission Ready' : 'Open Your Eyes'}
              </Text>
              <Text style={styles.subtitleIntro}>
                {tapCount === 5
                  ? 'Your mind is tuned to notice the positive. Press below to start.'
                  : 'Touch the light to begin your observation journey.'}
              </Text>
            </View>

            {/* Glowing Orb in Center */}
            <View style={styles.orbOuterContainer}>
              <TouchableOpacity
                onPress={handleOrbPress}
                activeOpacity={0.9}
                style={styles.orbTouchable}
              >
                {/* Ripple Effect Ring */}
                <Animated.View
                  style={[
                    styles.orbRipple,
                    rippleAnimatedStyle,
                  ]}
                />

                {/* Main Orb Body */}
                <Animated.View
                  style={[
                    styles.orbBody,
                    orbAnimatedStyle,
                    // Slight color shifts as tapCount grows
                    tapCount === 1 && { shadowColor: '#06B6D4', borderColor: 'rgba(6, 182, 212, 0.4)' },
                    tapCount === 2 && { shadowColor: '#6366F1', borderColor: 'rgba(99, 102, 241, 0.4)' },
                    tapCount === 3 && { shadowColor: '#8B5CF6', borderColor: 'rgba(139, 92, 246, 0.4)' },
                    tapCount >= 4 && { shadowColor: '#FBBF24', borderColor: 'rgba(251, 191, 36, 0.4)' },
                  ]}
                >
                  <LinearGradient
                    colors={
                      tapCount === 0 ? ['#10B981', '#047857'] :
                      tapCount === 1 ? ['#06B6D4', '#0891B2'] :
                      tapCount === 2 ? ['#6366F1', '#4F46E5'] :
                      tapCount === 3 ? ['#8B5CF6', '#7C3AED'] :
                      ['#FBBF24', '#D97706']
                    }
                    style={styles.orbGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* If 5 taps complete, show Eye Icon, otherwise show subtle inner glow */}
                    {tapCount === 5 ? (
                      <Animated.View entering={FadeInUp.duration(400)}>
                        <Ionicons name="eye-sharp" size={36} color="#FFFFFF" />
                      </Animated.View>
                    ) : (
                      <View style={styles.orbCore} />
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              {/* Spark Particles burst array */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                return (
                  <OrbSpark
                    key={`spark-${i}`}
                    angle={angle}
                    translate={sparkTranslate}
                    opacity={sparkOpacity}
                  />
                );
              })}
            </View>

            {/* Instruction Bubbles discovered so far */}
            <View style={styles.discoveredBubblesContainer}>
              {instructions.slice(0, tapCount).map((inst, idx) => (
                <Animated.View
                  key={`bubble-${idx}`}
                  entering={FadeInDown.springify().damping(12).stiffness(90)}
                  style={styles.instructionBubble}
                >
                  <BlurView intensity={25} tint="light" style={styles.bubbleGlass}>
                    <Text style={styles.bubbleEmoji}>{inst.emoji}</Text>
                    <Text style={styles.bubbleText}>{inst.text}</Text>
                  </BlurView>
                </Animated.View>
              ))}
            </View>

            {/* Quote Card (fades in only at the beginning when tapCount < 2) */}
            {tapCount < 2 && (
              <Animated.View entering={FadeInUp.duration(600)} exiting={FadeOutDown.duration(400)} style={styles.quoteCardWelcome}>
                <Text style={styles.quoteTextWelcome}>
                  "The world becomes more beautiful when we choose to notice the good."
                </Text>
              </Animated.View>
            )}

            {/* Begin Observation Button (Slides up when tapCount === 5) */}
            {tapCount === 5 && (
              <Animated.View entering={FadeInUp.springify()} style={[styles.buttonWrapper, { marginTop: 20 }]}>
                <TouchableOpacity
                  onPress={handleBeginObservation}
                  activeOpacity={0.8}
                  style={[styles.gradientButtonContainer, styles.glowButtonShadowGold, startBtnAnimatedStyle]}
                >
                  <LinearGradient
                    colors={['#FBBF24', '#D97706']}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.primaryButtonText}>Begin Observation</Text>
                    <Ionicons name="compass" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  // Page 2: Reflection Form Screen
  const renderReflectionPage = () => {
    const isButtonDisabled = observation.trim().length < 20 || isSaving;

    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#F0F7FF', '#EBE9FE']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Subtle light background floating particles */}
          <FloatingElements count={10} colorTheme="light" />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.headerBar}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setPage(1);
                  }}
                  style={[styles.backButton, styles.backButtonLight]}
                  activeOpacity={0.7}
                >
                  <Feather name="chevron-left" size={24} color="#4F46E5" />
                </TouchableOpacity>
                <Text style={styles.headerTitleLight}>REFLECTION</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentLight}
                keyboardShouldPersistTaps="handled"
              >
                {/* Notebook at top */}
                <View style={styles.illustrationContainer}>
                  <NotebookIllustration />
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                  <Text style={styles.mainTitleLight}>What Did You Observe?</Text>
                  <Text style={styles.subtitleLight}>
                    Write one positive social observation from your surroundings.
                  </Text>
                </View>

                {/* Premium text box */}
                <BlurView intensity={65} tint="light" style={styles.glassTextAreaContainer}>
                  <TextInput
                    style={styles.glassTextArea}
                    multiline
                    numberOfLines={5}
                    value={observation}
                    onChangeText={(val) => setObservation(val.slice(0, 300))}
                    placeholder={`Example:\n\n"I noticed a student helping another student understand a difficult topic."\n\nor\n\n"A stranger waited patiently instead of getting angry."`}
                    placeholderTextColor="rgba(79, 70, 229, 0.45)"
                    textAlignVertical="top"
                  />
                  
                  {/* Live character counter */}
                  <View style={styles.charCounterRow}>
                    <Text style={styles.charCounterText}>
                      {observation.trim().length} / 300 characters
                    </Text>
                  </View>
                </BlurView>

                {/* Encouragement card */}
                <BlurView intensity={35} tint="light" style={styles.encouragementCard}>
                  <Ionicons name="bulb-outline" size={20} color="#4F46E5" style={{ marginRight: 12 }} />
                  <Text style={styles.encouragementText}>
                    Every positive observation trains your mind to notice the good around you.
                  </Text>
                </BlurView>

                {/* Complete button */}
                <View style={styles.bottomNavSection}>
                  {isSaving ? (
                    <View style={styles.savingIndicatorContainer}>
                      <ActivityIndicator size="small" color="#4F46E5" />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSaveObservation}
                      activeOpacity={isButtonDisabled ? 1 : 0.8}
                      style={[
                        styles.gradientButtonContainer,
                        isButtonDisabled && styles.disabledBtnWrapper
                      ]}
                      disabled={isButtonDisabled}
                    >
                      <LinearGradient
                        colors={isButtonDisabled ? ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.06)'] : ['#6366F1', '#4F46E5']}
                        style={styles.primaryButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={isButtonDisabled ? styles.disabledBtnText : styles.primaryButtonText}>
                          Complete Task
                        </Text>
                        {!isButtonDisabled && (
                          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    );
  };

  // Page 3: Completion Rewards Screen
  const renderCompletionPage = () => {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Animated Light Rays */}
          <LightRays />

          {/* Floating Gold Particles */}
          <FloatingElements count={12} colorTheme="gold" />

          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentGold}
            >
              {/* Success Badge Leaf-Eye */}
              <View style={styles.completionBadgeContainer}>
                <SuccessBadge />
              </View>

              {/* Header Title */}
              <View style={styles.titleSection}>
                <Text style={styles.mainTitleGold}>Observation Complete</Text>
                <Text style={styles.subtitleGold}>
                  You trained your mind to notice the positive moments that make our world better.
                </Text>
              </View>

              {/* Achievement Grid */}
              <View style={styles.achievementGrid}>
                <AchievementCard emoji="🌱" title="Awareness" desc="You became more mindful." index={0} />
                <AchievementCard emoji="🤝" title="Connection" desc="You noticed kindness around you." index={1} />
                <AchievementCard emoji="💚" title="Positivity" desc="You focused on the good." index={2} />
                <AchievementCard emoji="✨" title="Reflection" desc="You captured a meaningful moment." index={3} />
              </View>

              {/* Rewards Card */}
              <BlurView intensity={65} tint="light" style={styles.rewardCardContainer}>
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardCardHeader}>🏆 Task Completed</Text>
                  
                  <View style={styles.rewardRow}>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="star" size={16} color="#D97706" />
                      <Text style={styles.rewardPoints}>+{pointsAwarded} Points Earned</Text>
                    </View>

                    <View style={styles.rewardBadge}>
                      <Ionicons name="flame" size={16} color="#EF4444" />
                      <Text style={styles.rewardStreak}>Daily Streak: {streakCount}</Text>
                    </View>
                  </View>

                  <Text style={styles.totalScore}>
                    Total Balance: {totalPoints} pts
                  </Text>
                </View>
              </BlurView>

              {/* Continue button */}
              <View style={styles.bottomNavSection}>
                <TouchableOpacity
                  onPress={handleFinishTask}
                  activeOpacity={0.8}
                  style={[styles.gradientButtonContainer, styles.glowButtonShadowGold]}
                >
                  <LinearGradient
                    colors={['#D97706', '#B45309']}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  };

  return (
    <>
      <StatusBar style={page === 2 ? 'dark' : 'light'} />
      {page === 1 && renderWelcomePage()}
      {page === 2 && renderReflectionPage()}
      {page === 3 && renderCompletionPage()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContentIntro: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  titleSectionIntro: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  mainTitleIntro: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  subtitleIntro: {
    fontSize: 15,
    color: '#A7F3D0',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    opacity: 0.9,
    paddingHorizontal: 12,
  },
  scrollContentLight: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'stretch',
  },
  scrollContentGold: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'stretch',
  },
  headerBarWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLight: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.12)',
  },
  headerTitleLight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 2.0,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  missionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  missionItemText: {
    fontSize: 15,
    color: '#E6F4EA',
    fontWeight: '500',
    flex: 1,
  },
  eyeContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeHalo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  mainTitleLight: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1B4B',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  mainTitleGold: {
    fontSize: 30,
    fontWeight: '800',
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  subtitleLight: {
    fontSize: 15,
    color: '#4F46E5',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 12,
  },
  subtitleGold: {
    fontSize: 15,
    color: '#92400E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    opacity: 0.85,
    paddingHorizontal: 12,
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  disabledBtnWrapper: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.22)',
  },

  // INTERACTIVE ORB STYLES
  orbOuterContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  orbTouchable: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRipple: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  orbBody: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  sparkParticle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE047',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  // DISCOVERED BUBBLES STYLES
  discoveredBubblesContainer: {
    width: '100%',
    alignItems: 'stretch',
    marginVertical: 16,
  },
  instructionBubble: {
    marginBottom: 12,
    width: '100%',
  },
  bubbleGlass: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bubbleEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  bubbleText: {
    fontSize: 15,
    color: '#E6F4EA',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },

  // QUOTE STYLES
  quoteCardWelcome: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  quoteTextWelcome: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#A7F3D0',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },

  // NOTEBOOK STYLES
  notebookContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // TEXTAREA STYLES
  glassTextAreaContainer: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
    height: 200,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  glassTextArea: {
    flex: 1,
    color: '#1E1B4B',
    fontSize: 16,
    lineHeight: 22,
  },
  charCounterRow: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  charCounterText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    opacity: 0.6,
  },

  // ENCOURAGEMENT CARD
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.08)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  encouragementText: {
    flex: 1,
    color: '#4F46E5',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomNavSection: {
    width: '100%',
    marginTop: 8,
  },
  savingIndicatorContainer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // COMPLETION STYLES
  completionBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  badgeOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  achievementWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  achievementCard: {
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    height: 120,
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    opacity: 0.8,
  },
  rewardCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  rewardCard: {
    padding: 20,
    alignItems: 'center',
  },
  rewardCardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.18)',
  },
  rewardPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 6,
  },
  rewardStreak: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D01C1C',
    marginLeft: 6,
  },
  totalScore: {
    fontSize: 13,
    color: '#78350F',
    opacity: 0.85,
    fontWeight: '600',
  },
  glowButtonShadowGold: {
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },
});
