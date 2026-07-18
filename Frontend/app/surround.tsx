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
  SharedValue,
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
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

// --- ANIMATED FLOATING LEAVES & DUST PARTICLES ---
const FloatingParticle = ({ index }: { index: number }) => {
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

  return (
    <Animated.View style={animatedStyle}>
      {isLeaf ? (
        <Ionicons name="leaf-outline" size={16} color="rgba(110, 231, 183, 0.5)" />
      ) : (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: 'rgba(253, 230, 138, 0.6)',
            shadowColor: '#FDE047',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 3,
          }}
        />
      )}
    </Animated.View>
  );
};

const FloatingElements = ({ count = 12 }: { count?: number }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(count)].map((_, i) => (
        <FloatingParticle key={`particle-${i}`} index={i} />
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

// --- FLYING COMPASS BIRD ---
const FlyingCompassBird = ({ startY = 40, delay = 0 }: { startY?: number; delay?: number }) => {
  const birdX = useSharedValue(-40);
  const birdY = useSharedValue(startY);
  const wingFlap = useSharedValue(0);

  useEffect(() => {
    birdX.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(width + 40, { duration: 8000, easing: Easing.linear })),
        withTiming(-40, { duration: 0 })
      ),
      -1,
      false
    );

    birdY.value = withRepeat(
      withSequence(
        withTiming(startY + 15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(startY - 15, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    wingFlap.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: birdX.value,
    top: birdY.value,
  }));

  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: wingFlap.value ? 0.3 : 1 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View style={wingStyle}>
        <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <Path
            d="M1 5 C4 1, 8 1, 8 5 C8 1, 12 1, 15 5 C12 7, 8 7, 8 5 C8 7, 4 7, 1 5 Z"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
            fill="rgba(255,255,255,0.15)"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

// --- COMPASS ILLUSTRATION (Page 1) ---
const CompassIllustration = ({ isTransitioning }: { isTransitioning: boolean }) => {
  const needleRotation = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);

  useEffect(() => {
    needleRotation.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${needleRotation.value}deg` },
      { scale: isTransitioning ? withTiming(1.25, { duration: 350 }) : 1 }
    ],
  }));

  const glowingRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value * (isTransitioning ? 1.15 : 1) }],
    opacity: isTransitioning ? withTiming(1, { duration: 300 }) : ringOpacity.value,
  }));

  return (
    <View style={styles.compassWrapper}>
      <Animated.View style={[styles.compassHalo, glowingRingStyle]} />

      <Svg width="130" height="130" viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgLinearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </SvgLinearGradient>
          <SvgLinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="100%" stopColor="#D97706" />
          </SvgLinearGradient>
        </Defs>

        <Circle cx="50" cy="50" r="44" fill="url(#dialGrad)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <Circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {[...Array(12)].map((_, idx) => {
          const angle = (idx * 30 * Math.PI) / 180;
          const x1 = 50 + 38 * Math.cos(angle);
          const y1 = 50 + 38 * Math.sin(angle);
          const x2 = 50 + (idx % 3 === 0 ? 32 : 35) * Math.cos(angle);
          const y2 = 50 + (idx % 3 === 0 ? 32 : 35) * Math.sin(angle);
          return (
            <Path
              key={idx}
              d={`M${x1} ${y1} L${x2} ${y2}`}
              stroke={idx % 3 === 0 ? '#FBBF24' : 'rgba(255,255,255,0.3)'}
              strokeWidth={idx % 3 === 0 ? 1.5 : 1}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>

      <Animated.View style={[styles.compassNeedleContainer, needleStyle]}>
        <Svg width="130" height="130" viewBox="0 0 100 100" fill="none">
          <Path d="M50 18 L54 47 L50 50 Z" fill="#FBBF24" />
          <Path d="M50 18 L46 47 L50 50 Z" fill="#F59E0B" />
          <Path d="M50 82 L54 53 L50 50 Z" fill="#10B981" />
          <Path d="M50 82 L46 53 L50 50 Z" fill="#047857" />
          <Circle cx="50" cy="50" r="3.5" fill="#FFFFFF" stroke="#047857" strokeWidth="1" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// --- MISSION ITEM ROW WITH SPRING LEAF ---
const MissionItem = ({ text, index }: { text: string; index: number }) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 200 + 300, withSpring(1, { damping: 10 }));
  }, []);

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    marginRight: 12,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 200).duration(600)}
      style={styles.missionItemRow}
    >
      <Animated.View style={leafStyle}>
        <Ionicons name="leaf" size={16} color="#10B981" />
      </Animated.View>
      <Text style={styles.missionItemText}>{text}</Text>
    </Animated.View>
  );
};

// --- ANIMATED LANDSCAPE SVG ---
const LandscapeIllustration = () => {
  const sway = useSharedValue(0);
  const cloudX1 = useSharedValue(20);
  const cloudX2 = useSharedValue(180);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-2.5, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cloudX1.value = withRepeat(
      withSequence(
        withTiming(90, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 16000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cloudX2.value = withRepeat(
      withSequence(
        withTiming(130, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(190, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ skewX: `${sway.value}deg` }],
  }));

  const cloud1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX1.value }],
  }));

  const cloud2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX2.value }],
  }));

  return (
    <BlurView intensity={18} tint="dark" style={styles.landscapeCard}>
      <Svg width="100%" height="110" viewBox="0 0 320 110" fill="none">
        <Defs>
          <SvgLinearGradient id="hillBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#065F46" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#064E3B" stopOpacity="0.8" />
          </SvgLinearGradient>
          <SvgLinearGradient id="hillFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#047857" />
            <Stop offset="100%" stopColor="#022C22" />
          </SvgLinearGradient>
          <SvgLinearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </SvgLinearGradient>
        </Defs>

        <Path d="M-20 110 Q80 40, 180 80 T340 60 L340 110 Z" fill="url(#hillBack)" />
        <Path d="M120 70 Q140 90, 130 100 T150 110" stroke="url(#riverGrad)" strokeWidth="6" strokeLinecap="round" />
        <Path d="M-20 110 Q100 70, 220 95 T340 75 L340 110 Z" fill="url(#hillFront)" />

        <G transform="translate(0, 10)">
          <Animated.View style={cloud1Style}>
            <Svg width="30" height="20" viewBox="0 0 30 20" fill="none" style={{ position: 'absolute' }}>
              <Path d="M5 15 C5 10, 10 7, 15 10 C18 6, 25 8, 26 13 C29 13, 29 17, 26 18 C23 18, 5 18, 5 15 Z" fill="#FFFFFF" opacity="0.25" />
            </Svg>
          </Animated.View>
        </G>

        <G transform="translate(0, 20)">
          <Animated.View style={cloud2Style}>
            <Svg width="30" height="20" viewBox="0 0 30 20" fill="none" style={{ position: 'absolute' }}>
              <Path d="M5 15 C5 10, 10 7, 15 10 C18 6, 25 8, 26 13 C29 13, 29 17, 26 18 C23 18, 5 18, 5 15 Z" fill="#FFFFFF" opacity="0.18" />
            </Svg>
          </Animated.View>
        </G>

        <G transform="translate(60, 58)">
          <Animated.View style={swayStyle}>
            <Svg width="20" height="35" viewBox="0 0 20 35" fill="none" style={{ position: 'absolute', left: -10, top: -20 }}>
              <Path d="M10 20 L10 32" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M10 2 C16 10, 18 20, 10 22 C2 20, 4 10, 10 2 Z" fill="#10B981" opacity="0.9" />
              <Path d="M10 5 C14 11, 16 18, 10 20 C4 18, 6 11, 10 5 Z" fill="#34D399" opacity="0.8" />
            </Svg>
          </Animated.View>
        </G>

        <G transform="translate(230, 68)">
          <Animated.View style={swayStyle}>
            <Svg width="16" height="30" viewBox="0 0 16 30" fill="none" style={{ position: 'absolute', left: -8, top: -15 }}>
              <Path d="M8 15 L8 28" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
              <Path d="M8 2 C13 8, 14 16, 8 18 C2 16, 3 8, 8 2 Z" fill="#047857" opacity="0.95" />
              <Path d="M8 5 C11 10, 12 15, 8 16 C4 15, 5 10, 8 5 Z" fill="#10B981" opacity="0.85" />
            </Svg>
          </Animated.View>
        </G>
      </Svg>
    </BlurView>
  );
};

// --- NOTEBOOK ILLUSTRATION (Page 3) ---
const NotebookIllustration = () => {
  return (
    <View style={styles.notebookContainer}>
      <Svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <Defs>
          <SvgLinearGradient id="notebookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A7F3D0" />
            <Stop offset="100%" stopColor="#059669" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
          fill="url(#notebookGrad)"
          opacity="0.2"
          stroke="url(#notebookGrad)"
          strokeWidth="1.5"
        />
        <Path d="M4 6h2M4 10h2M4 14h2M4 18h2" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <Path d="M9 7h8M9 11h8M9 15h6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
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

// --- OBSERVATION COMPLETED BADGE ---
const ObservationCompleteBadge = () => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.completeBadgeContainer, badgeStyle]}>
      <View style={styles.checkmarkCircle}>
        <Ionicons name="checkmark-sharp" size={30} color="#FFFFFF" />
      </View>
      <Text style={styles.completeTitle}>Observation Complete</Text>
    </Animated.View>
  );
};

// --- EYE IN A LEAF SUCCESS BADGE (Page 4) ---
const SuccessBadge = () => {
  return (
    <Animated.View style={styles.badgeOuterContainer}>
      <Svg width="160" height="160" viewBox="0 0 120 120" fill="none">
        <Defs>
          <SvgRadialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#FBBF24" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgLinearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#D97706" />
          </SvgLinearGradient>
          <SvgLinearGradient id="leafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#065F46" />
            <Stop offset="50%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r="50" fill="url(#badgeGlow)" />
        <Circle cx="60" cy="60" r="42" stroke="url(#badgeGold)" strokeWidth="3" strokeDasharray="6 3" />
        <G transform="translate(60,60) rotate(-45) translate(-60,-60)">
          <Path
            d="M60 20 C85 45, 85 75, 60 100 C35 75, 35 45, 60 20 Z"
            fill="url(#leafGrad)"
            stroke="url(#badgeGold)"
            strokeWidth="2.5"
          />
        </G>
        <G transform="translate(60, 60)">
          <Path
            d="M-18 0 C-8 -12, 8 -12, 18 0 C8 12, -8 12, -18 0 Z"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            fill="rgba(255,255,255,0.1)"
          />
          <Circle cx="0" cy="0" r="6" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1.5" />
          <Circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" />
        </G>
      </Svg>
    </Animated.View>
  );
};

export default function ObserveSurroundingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(1);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoFinished, setVideoFinished] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reflection, setReflection] = useState('');
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

  // Rewards state from database completion response
  const [pointsAwarded, setPointsAwarded] = useState(300);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  const videoRef = useRef<Video>(null);

  const videoSources = [
    require('../assets/videos/Men_walking_in_garden_202607181332.mp4'),
    require('../assets/videos/Men_walking_in_garden_202607181329.mp4'),
  ];

  // Pulse effect for Start button
  const startBtnScale = useSharedValue(1);
  useEffect(() => {
    if (page === 1) {
      startBtnScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [page]);

  const startBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnScale.value }],
  }));

  const handleBeginObservation = () => {
    triggerHaptic('medium');
    setIsTransitioning(true);

    // Staggered leaf coordinates transition from bottom-left to top-right
    for (let i = 0; i < 12; i++) {
      const startX = -60 - Math.random() * 80;
      const startY = height - Math.random() * 200;
      
      leavesX[i].value = startX;
      leavesY[i].value = startY;
      leavesRotate[i].value = 0;

      leavesX[i].value = withDelay(
        i * 60,
        withTiming(width + 80, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
      leavesY[i].value = withDelay(
        i * 60,
        withTiming(-80, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
      leavesRotate[i].value = withDelay(
        i * 60,
        withTiming(720, { duration: 1100, easing: Easing.out(Easing.quad) })
      );
    }

    setTimeout(() => {
      setPage(2);
      setIsTransitioning(false);
    }, 1300);
  };

  // Playback listener for Video Player on Page 2
  const handlePlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      if (currentVideoIndex === 0) {
        triggerHaptic('medium');
        setCurrentVideoIndex(1);
        if (videoRef.current) {
          try {
            await videoRef.current.loadAsync(
              require('../assets/videos/Men_walking_in_garden_202607181329.mp4'),
              { shouldPlay: true, isMuted: true }
            );
          } catch (err) {
            console.error('Failed to transition to second video:', err);
          }
        }
      } else {
        triggerHaptic('success');
        setVideoFinished(true);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    triggerHaptic('light');
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleReplay = async () => {
    if (!videoRef.current) return;
    triggerHaptic('medium');
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.playAsync();
    setIsPlaying(true);
    setVideoFinished(false);
  };

  const handleSaveReflection = async () => {
    if (!reflection.trim() || isSaving) return;
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
          taskName: 'Observe Surroundings',
          completed: true,
          response_text: reflection.trim(),
          videoCompleted: videoFinished,
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (response.ok || data.success) {
        triggerHaptic('success');
        setPointsAwarded(data.pointsAdded || 300);
        setTotalPoints(data.totalPoints || 0);
        setStreakCount(data.streak || 0);
        setPage(4);
      } else {
        alert(data.error || 'Failed to complete task. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to save reflection.');
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

  // --- SUB-PAGES RENDERING ---

  // Page 1: Introduction Screen
  const renderIntroPage = () => {
    return (
      <View style={styles.container}>
        {/* Fullscreen background image */}
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.darkOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]} />
        </View>

        {/* Floating particles */}
        <FloatingElements count={14} />

        {/* Flying birds around compass */}
        <FlyingCompassBird startY={60} delay={0} />
        <FlyingCompassBird startY={100} delay={3000} />

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Top Compass with rotating needle */}
            <View style={styles.compassContainer}>
              <CompassIllustration isTransitioning={isTransitioning} />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Become an Explorer</Text>
              <Text style={styles.subtitle}>
                The world is full of beautiful moments.{'\n'}
                Today your mission is to notice the little things that most people walk past.
              </Text>
            </View>

            {/* Today's Mission Floating Card */}
            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
              <Text style={styles.missionHeader}>🌿 Today's Mission</Text>
              <View style={styles.missionList}>
                <MissionItem text="Watch carefully." index={0} />
                <MissionItem text="Observe every movement." index={1} />
                <MissionItem text="Notice every color." index={2} />
                <MissionItem text="Look for something peaceful." index={3} />
                <MissionItem text="Find one beautiful moment." index={4} />
              </View>
            </BlurView>

            {/* Animated landscape illustration */}
            <LandscapeIllustration />

            {/* Quote Card */}
            <Animated.View entering={FadeInUp.delay(1200).duration(800)} style={styles.quoteCardIntro}>
              <Text style={styles.quoteIntroText}>
                "The more you observe,{'\n'}the more beautiful the world becomes."
              </Text>
            </Animated.View>

            {/* Start Button */}
            <Animated.View style={[styles.buttonWrapper, startBtnAnimatedStyle]}>
              <TouchableOpacity
                onPress={handleBeginObservation}
                activeOpacity={0.8}
                style={styles.gradientButtonContainer}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>Begin Observation</Text>
                  <Ionicons name="compass" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  // Page 2: Cinematic Video Playback
  const renderObservationPage = () => {
    return (
      <View style={[styles.container, { backgroundColor: '#070A14' }]}>
        {/* blurred background image */}
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[styles.darkOverlay, { backgroundColor: 'rgba(7, 10, 20, 0.85)' }]} />
        </View>

        <FloatingElements count={8} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setPage(1);
                setCurrentVideoIndex(0);
                setVideoFinished(false);
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>OBSERVATION MODE</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.observationContent}>
            {/* Small glass badge above video */}
            <BlurView intensity={20} tint="light" style={styles.observationBadge}>
              <Ionicons name="eye-outline" size={14} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.observationBadgeText}>Observation Mode</Text>
            </BlurView>

            {/* Rounded Premium Video Container */}
            <View style={styles.videoPlayerFrame}>
              <Video
                ref={videoRef}
                source={videoSources[currentVideoIndex]}
                style={styles.videoPlayer}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isPlaying}
                isMuted={true}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            </View>

            {/* Description Glass Card below video */}
            <BlurView intensity={25} tint="dark" style={styles.observationInstructionsCard}>
              <Text style={styles.observationInstructText}>
                Don't rush.{'\n'}Look beyond the obvious.{'\n'}Notice movement, colors, patterns, and peaceful moments.
              </Text>
            </BlurView>

            {/* Checkmark card on complete */}
            {videoFinished && (
              <ObservationCompleteBadge />
            )}
          </View>

          {/* Continue button smoothly slides / glows up after video finishes */}
          <View style={styles.bottomNavSection}>
            {videoFinished ? (
              <Animated.View entering={FadeInUp.duration(600)} style={styles.buttonWrapper}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setPage(3);
                  }}
                  activeOpacity={0.8}
                  style={[styles.gradientButtonContainer, styles.glowButtonShadow]}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.disabledPlaceholderBtn}>
                <Text style={styles.disabledBtnText}>Observe the surroundings carefully</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  };

  // Page 3: Reflection Input Form
  const renderReflectionPage = () => {
    const placeholderText =
      '• The trees were moving peacefully.\n• The birds looked free.\n• The sunlight felt warm.\n• The river looked calming.\n• Nature felt alive.';

    const isReflectionEmpty = reflection.trim().length === 0;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['#064E3B', '#022C22']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FloatingElements count={10} />

          <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerBar}>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setPage(2);
                }}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>REFLECTION</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
            >
              {/* Illustration and titles */}
              <View style={styles.centerSection}>
                <NotebookIllustration />
              </View>

              <View style={styles.titleSection}>
                <Text style={styles.mainTitle}>What Did You Notice?</Text>
                <Text style={styles.subtitle}>
                  Write the positive things you observed during the video.
                </Text>
              </View>

              {/* Large premium glass text area */}
              <BlurView intensity={20} tint="dark" style={styles.glassTextAreaContainer}>
                <TextInput
                  style={styles.glassTextArea}
                  multiline
                  placeholder={placeholderText}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={reflection}
                  onChangeText={(text) => {
                    setReflection(text);
                  }}
                  keyboardAppearance="dark"
                  textAlignVertical="top"
                />
              </BlurView>

              {/* Small encouragement card */}
              <BlurView intensity={10} tint="dark" style={styles.encouragementCard}>
                <Ionicons name="sparkles" size={16} color="#FBBF24" style={{ marginRight: 10 }} />
                <Text style={styles.encouragementText}>
                  Every observation trains your mind to notice more beauty in everyday life.
                </Text>
              </BlurView>

              {/* Save Reflection button */}
              <View style={[styles.buttonWrapper, { marginTop: 24 }]}>
                <TouchableOpacity
                  onPress={handleSaveReflection}
                  disabled={isReflectionEmpty || isSaving}
                  activeOpacity={0.8}
                  style={[styles.gradientButtonContainer, isReflectionEmpty && { opacity: 0.5 }]}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Save Reflection</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  };

  // Page 4: Success / Completion Screen
  const renderCompletionPage = () => {
    const achievements = [
      { id: 1, emoji: '🌿', title: 'Mindfulness', desc: 'You became more aware.' },
      { id: 2, emoji: '👀', title: 'Observation', desc: 'You trained your attention.' },
      { id: 3, emoji: '💚', title: 'Positivity', desc: 'You focused on good things.' },
      { id: 4, emoji: '✨', title: 'Presence', desc: 'You stayed in the moment.' },
    ];

    return (
      <View style={styles.container}>
        {/* Soft Golden Sunset Gradient Background */}
        <LinearGradient
          colors={['#78350F', '#451A03', '#1C1917']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Floating particles background */}
        <FloatingElements count={16} />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Center success badge */}
            <View style={[styles.centerSection, { marginVertical: 32 }]}>
              <SuccessBadge />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.completionTitle}>Wonderful Observation</Text>
              <Text style={styles.completionSubtitle}>
                Today you slowed down and noticed the beauty around you.
              </Text>
            </View>

            {/* Staggered achievement cards sliding up */}
            <View style={styles.achievementGrid}>
              {achievements.map((item, idx) => (
                <Animated.View
                  entering={FadeInDown.delay(idx * 150).duration(600)}
                  key={item.id}
                  style={styles.achievementWrapper}
                >
                  <BlurView intensity={20} tint="light" style={styles.achievementCard}>
                    <Text style={styles.achievementEmoji}>{item.emoji}</Text>
                    <Text style={styles.achievementName}>{item.title}</Text>
                    <Text style={styles.achievementDesc}>{item.desc}</Text>
                  </BlurView>
                </Animated.View>
              ))}
            </View>

            {/* Reward Card */}
            <Animated.View
              entering={FadeInDown.delay(700).duration(500)}
              style={styles.rewardCardContainer}
            >
              <BlurView intensity={30} tint="light" style={styles.rewardCard}>
                <View style={styles.rewardRow}>
                  <View style={styles.rewardBadge}>
                    <Ionicons name="sparkles" size={16} color="#FBBF24" />
                    <Text style={styles.rewardPoints}>+{pointsAwarded} Points</Text>
                  </View>
                  <View style={styles.rewardBadge}>
                    <Ionicons name="flame" size={16} color="#EF4444" />
                    <Text style={styles.rewardStreak}>Streak Updated</Text>
                  </View>
                </View>
                <Text style={styles.totalScore}>
                  Total Points: <Text style={{ color: '#FBBF24', fontWeight: '800' }}>{totalPoints}</Text>  •  Streak: <Text style={{ color: '#EF4444', fontWeight: '800' }}>{streakCount} Days</Text>
                </Text>
              </BlurView>
            </Animated.View>

            {/* Continue/Finish button */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                onPress={handleFinishTask}
                activeOpacity={0.8}
                style={styles.gradientButtonContainer}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };

  switch (page) {
    case 1:
      return renderIntroPage();
    case 2:
      return renderObservationPage();
    case 3:
      return renderReflectionPage();
    case 4:
      return renderCompletionPage();
    default:
      return renderIntroPage();
  }
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
    backgroundColor: 'rgba(5, 12, 10, 0.65)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'stretch',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#A7F3D0',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    opacity: 0.9,
    paddingHorizontal: 12,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
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

  // COMPASS STYLES
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  compassWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassHalo: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.03)',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  compassNeedleContainer: {
    position: 'absolute',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // MISSION STYLES
  missionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  missionList: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  missionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  missionItemText: {
    fontSize: 15,
    color: '#E6F4EA',
    fontWeight: '500',
  },

  // LANDSCAPE STYLES
  landscapeCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 20,
    padding: 8,
    alignItems: 'center',
  },

  // INTRO QUOTE
  quoteCardIntro: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  quoteIntroText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#A7F3D0',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },

  // PAGE 2 OBSERVATION STYLES
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2.0,
  },
  observationContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  observationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  observationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  videoPlayerFrame: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 24,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  observationInstructionsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  observationInstructText: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  completeBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  checkmarkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  completeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  glowButtonShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  bottomNavSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: '100%',
  },
  disabledPlaceholderBtn: {
    width: '100%',
    height: 56,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 15,
    fontWeight: '600',
  },

  // PAGE 3 REFLECTION STYLES
  notebookContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassTextAreaContainer: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    height: 180,
    padding: 16,
    marginBottom: 20,
  },
  glassTextArea: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  encouragementText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },

  // PAGE 4 COMPLETION STYLES
  badgeOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  completionSubtitle: {
    fontSize: 15,
    color: '#FDE68A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    opacity: 0.9,
    paddingHorizontal: 16,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
  },
  achievementWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  achievementCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    height: 128,
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 11,
    color: '#FDE68A',
    textAlign: 'center',
    opacity: 0.8,
  },
  rewardCardContainer: {
    marginBottom: 28,
  },
  rewardCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.25)',
    overflow: 'hidden',
    backgroundColor: 'rgba(252, 211, 77, 0.05)',
    alignItems: 'center',
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
    marginLeft: 6,
  },
  rewardStreak: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 6,
  },
  totalScore: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
