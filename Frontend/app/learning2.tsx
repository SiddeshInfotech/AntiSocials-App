import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedProps,
  SharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  interpolate,
  runOnJS,
  withDelay
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Polygon, Line, Defs, LinearGradient as SvgLinearGradient, Stop, Path, Circle as SvgCircle } from 'react-native-svg';
import { API_BASE_URL } from '../constants/Api';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Theme Colors
const COLORS = {
  bg: '#09071A', // Space Navy
  primary: '#7E3AF2', // Purple
  secondary: '#FF9A3D', // Gold/Orange
  accent: '#FFD700', // Gold
  emerald: '#10B981', // Green
  text: '#FFFFFF',
  textDim: '#A1A1AA',
  glass: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
  indigo: '#1E1B4B',
  goldGlow: 'rgba(255, 215, 0, 0.3)',
};

// Safe haptic feedback helper
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.log("Haptic failed", e);
  }
};

// Premium background particle systems
const Fireflies = () => {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(20)].map((_, i) => {
        const x = useSharedValue(Math.random() * width);
        const y = useSharedValue(Math.random() * height);
        const opacity = useSharedValue(Math.random() * 0.5 + 0.1);
        const scale = useSharedValue(Math.random() * 0.8 + 0.5);

        useEffect(() => {
          x.value = withRepeat(
            withTiming(x.value + (Math.random() * 80 - 40), {
              duration: 6000 + Math.random() * 6000,
            }),
            -1,
            true
          );
          y.value = withRepeat(
            withTiming(y.value + (Math.random() * 80 - 40), {
              duration: 6000 + Math.random() * 6000,
            }),
            -1,
            true
          );
          opacity.value = withRepeat(
            withTiming(Math.random() * 0.6 + 0.2, {
              duration: 2000 + Math.random() * 3000,
            }),
            -1,
            true
          );
        }, []);

        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: x.value },
            { translateY: y.value },
            { scale: scale.value }
          ],
          opacity: opacity.value,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              styles.firefly,
              style,
              {
                backgroundColor: Math.random() > 0.4 ? COLORS.accent : COLORS.secondary,
              }
            ]}
          />
        );
      })}
    </View>
  );
};

// Dynamic color settings for crystals based on active step
const getCrystalColors = (step: number) => {
  if (step === 3) {
    // Yellow / Gold Crystal
    return {
      glow: '#FFB300',
      tL: ['#FFE082', '#FFB300'],
      tR: ['#FFF59D', '#F57C00'],
      bL: ['#FFB300', '#E65100'],
      bR: ['#FF8F00', '#E65100']
    };
  } else if (step === 4) {
    // Light Blue / Cyan Crystal
    return {
      glow: '#38BDF8',
      tL: ['#7DD3FC', '#0369A1'],
      tR: ['#BAE6FD', '#0284C7'],
      bL: ['#38BDF8', '#1D4ED8'],
      bR: ['#2563EB', '#1E3A8A']
    };
  } else {
    // Purple Crystal
    return {
      glow: '#8B5CF6',
      tL: ['#C084FC', '#581C87'],
      tR: ['#D8B4FE', '#7E22CE'],
      bL: ['#818CF8', '#312E81'],
      bR: ['#6366F1', '#1E1B4B']
    };
  }
};

// 3D Faceted Crystal Svg Component with dynamic color logic
const GlowingCrystal = ({ step, fillProgress, style }: { step: number, fillProgress: SharedValue<number>, style?: any }) => {
  const glowValue = useSharedValue(0.5);

  useEffect(() => {
    glowValue.value = withRepeat(withTiming(1.0, { duration: 2000 }), -1, true);
  }, []);

  const colors = getCrystalColors(step);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowValue.value, [0.5, 1], [0.3, 0.75]) * interpolate(fillProgress.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(glowValue.value, [0.5, 1], [0.95, 1.05]) }],
    backgroundColor: colors.glow,
    shadowColor: colors.glow,
  }));

  const facetProps = useAnimatedProps(() => ({
    opacity: fillProgress.value,
  }));

  return (
    <View style={[styles.crystalContainer, style]}>
      {/* Outer Glow Background */}
      <Animated.View style={[styles.crystalGlow, glowStyle]} />
      
      <Svg width={110} height={160} viewBox="0 0 100 100" style={styles.crystalSvg}>
        <Defs>
          {/* Base Facets Gradients */}
          <SvgLinearGradient id="cTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.tL[0]} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={colors.tL[1]} stopOpacity={0.6} />
          </SvgLinearGradient>
          <SvgLinearGradient id="cTR" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.tR[0]} stopOpacity={0.95} />
            <Stop offset="100%" stopColor={colors.tR[1]} stopOpacity={0.5} />
          </SvgLinearGradient>
          <SvgLinearGradient id="cBL" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.bL[0]} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={colors.bL[1]} stopOpacity={0.4} />
          </SvgLinearGradient>
          <SvgLinearGradient id="cBR" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={colors.bR[0]} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={colors.bR[1]} stopOpacity={0.3} />
          </SvgLinearGradient>
        </Defs>

        {/* Empty Crystal Base Outline (Hollow look) */}
        <Polygon points="50,5 20,50 50,50" fill="rgba(255,255,255,0.02)" stroke={colors.glow} strokeWidth={0.5} opacity={0.25} />
        <Polygon points="50,5 50,50 80,50" fill="rgba(255,255,255,0.02)" stroke={colors.glow} strokeWidth={0.5} opacity={0.25} />
        <Polygon points="50,50 20,50 50,95" fill="rgba(255,255,255,0.02)" stroke={colors.glow} strokeWidth={0.5} opacity={0.25} />
        <Polygon points="50,50 80,50 50,95" fill="rgba(255,255,255,0.02)" stroke={colors.glow} strokeWidth={0.5} opacity={0.25} />

        {/* Vibrant Filled Crystal Facets (glowing overlay based on progress) */}
        <AnimatedPolygon points="50,5 20,50 50,50" fill="url(#cTL)" animatedProps={facetProps} />
        <AnimatedPolygon points="50,5 50,50 80,50" fill="url(#cTR)" animatedProps={facetProps} />
        <AnimatedPolygon points="50,50 20,50 50,95" fill="url(#cBL)" animatedProps={facetProps} />
        <AnimatedPolygon points="50,50 80,50 50,95" fill="url(#cBR)" animatedProps={facetProps} />

        {/* Inner Shading Facet Lines */}
        <Line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.2)" strokeWidth={0.6} />
        <Line x1="20" y1="50" x2="80" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth={0.6} />
        <Polygon points="50,5 20,50 50,95 80,50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      </Svg>
    </View>
  );
};

// 3D Hexagon Slot Component for Screen 1
const HexagonSlot = ({ color }: { color: string }) => (
  <View style={styles.hexagonWrapper}>
    <Svg width={46} height={52} viewBox="0 0 100 115">
      <Polygon
        points="50,2 98,30 98,85 50,113 2,85 2,30"
        fill="rgba(255, 255, 255, 0.03)"
        stroke={color}
        strokeWidth={3}
      />
      <SvgCircle cx={50} cy={57} r={10} fill={color} opacity={0.15} />
    </Svg>
  </View>
);

// Night Tree Silhouette for Welcome Screen 1
const WelcomeTreeSilhouette = () => (
  <Svg width={180} height={180} viewBox="0 0 100 100">
    <SvgCircle cx={50} cy={50} r={40} fill="rgba(126, 58, 242, 0.06)" />
    {/* Ground */}
    <Path d="M5,92 Q50,88 95,92 L95,100 L5,100 Z" fill="#130F30" />
    {/* Trunk */}
    <Path d="M47,92 C47,82 45,72 45,62 C43,59 38,55 35,52 C40,52 46,56 48,59 C49,49 44,39 41,32 C45,35 48,41 49,47 C50,39 49,29 50,19 C51,29 50,39 51,47 C52,41 55,35 59,32 C56,39 51,49 52,59 C54,56 60,52 65,52 C62,55 57,59 55,62 C55,72 53,82 53,92 Z" fill="#7E57C2" />
    {/* Glowing leaf dots */}
    <SvgCircle cx={50} cy={19} r={3} fill="#FFE082" opacity={0.8} />
    <SvgCircle cx={41} cy={32} r={3.5} fill="#FFE082" opacity={0.8} />
    <SvgCircle cx={59} cy={32} r={3} fill="#FFE082" opacity={0.8} />
    <SvgCircle cx={35} cy={52} r={4} fill="#FFE082" opacity={0.85} />
    <SvgCircle cx={65} cy={52} r={4} fill="#FFE082" opacity={0.85} />
    
    <SvgCircle cx={47} cy={25} r={2.5} fill="#8B5CF6" opacity={0.9} />
    <SvgCircle cx={53} cy={25} r={2.5} fill="#8B5CF6" opacity={0.9} />
    <SvgCircle cx={45} cy={42} r={3} fill="#8B5CF6" opacity={0.9} />
    <SvgCircle cx={55} cy={42} r={3} fill="#8B5CF6" opacity={0.9} />
  </Svg>
);

export default function Write3LearningsScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Load state
  const [step, setStep] = useState<number>(1);
  const [learnings, setLearnings] = useState<string[]>(['', '', '']);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number | null>(null);

  // Reanimated Shared Values for Screen Transitions and Effects
  const sunriseOpacity = useSharedValue(0);
  const fillProgress = useSharedValue(0);
  const circularProgress = useSharedValue(0);

  // Shared values for the Crystal fly-up animation
  const crystalTranslateX = useSharedValue(0);
  const crystalTranslateY = useSharedValue(0);
  const crystalScale = useSharedValue(1);
  const crystalOpacity = useSharedValue(1);

  // Shared values for the Tree of Wisdom growing animation
  const treeTrunkGrowth = useSharedValue(0);
  const treeBranchGrowth = useSharedValue(0);
  const treeLeavesScale = useSharedValue(0);

  // Restore autosaved today's progress
  useEffect(() => {
    const restoreProgress = async () => {
      try {
        const saved = await SecureStore.getItemAsync('write_3_learnings_progress');
        if (saved) {
          const parsed = JSON.parse(saved);
          const savedDate = new Date(parsed.timestamp).toDateString();
          const todayDate = new Date().toDateString();

          // Restore only if progress is from today and not fully completed
          if (savedDate === todayDate && !parsed.isCompleted) {
            setLearnings(parsed.learnings || ['', '', '']);
            setStep(parsed.currentStep || 1);
            triggerHaptic('light');
          }
        }
      } catch (e) {
        console.log('Error restoring progress', e);
      }
    };
    restoreProgress();
  }, []);

  // Save progress helper
  const saveProgress = async (nextStep: number, currentLearnings: string[], isCompleted = false) => {
    try {
      const data = {
        learnings: currentLearnings,
        currentStep: nextStep,
        timestamp: Date.now(),
        isCompleted
      };
      await SecureStore.setItemAsync('write_3_learnings_progress', JSON.stringify(data));
    } catch (e) {
      console.log('Error saving progress', e);
    }
  };

  // Pre-populate input area prefixes to match user screenshot guidelines
  useEffect(() => {
    if (step === 2 && !learnings[0]) {
      const updated = [...learnings];
      updated[0] = "I learned that ";
      setLearnings(updated);
    } else if (step === 3 && !learnings[1]) {
      const updated = [...learnings];
      updated[1] = "I discovered that ";
      setLearnings(updated);
    } else if (step === 4 && !learnings[2]) {
      const updated = [...learnings];
      updated[2] = "Next time I will ";
      setLearnings(updated);
    }
  }, [step]);

  // Watch typing state for current input
  const currentLearningText = learnings[Math.min(step - 2, 2)] || '';
  useEffect(() => {
    if (step >= 2 && step <= 4) {
      const prefixLength = step === 2 ? 15 : step === 3 ? 19 : 17;
      const actualInputText = currentLearningText.slice(prefixLength);
      fillProgress.value = withTiming(Math.min(actualInputText.length / 80, 1), { duration: 300 });
      setIsTyping(actualInputText.length > 0);
    }
  }, [currentLearningText, step]);

  // Handle step increments and crystal fly-up transition
  const handleContinue = async () => {
    const learningIdx = step - 2;

    // Validation to prevent empty inputs
    if (step >= 2 && step <= 4) {
      const prefix = step === 2 ? "I learned that " : step === 3 ? "I discovered that " : "Next time I will ";
      if (!currentLearningText.trim() || currentLearningText.trim() === prefix.trim()) {
        Alert.alert('Reflect', 'Please capture your learning before proceeding.');
        return;
      }
    }

    triggerHaptic('medium');

    if (step >= 2 && step <= 4) {
      // Animate crystal fly-up to represent capturing the gem
      const targetX = learningIdx === 0 ? -60 : learningIdx === 1 ? 0 : 60;
      const targetY = -height * 0.38;

      crystalTranslateX.value = withTiming(targetX, { duration: 900 });
      crystalTranslateY.value = withTiming(targetY, { duration: 900 });
      crystalScale.value = withTiming(0.2, { duration: 900 });
      crystalOpacity.value = withTiming(0, { duration: 900 });

      setTimeout(() => {
        const nextStep = step + 1;
        setStep(nextStep);
        saveProgress(nextStep, learnings);

        // Reset positions for the next crystal setup
        crystalTranslateX.value = 0;
        crystalTranslateY.value = 0;
        crystalScale.value = 1;
        crystalOpacity.value = 1;
        fillProgress.value = 0;
        setIsTyping(false);

        triggerHaptic('success');
      }, 950);
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      saveProgress(nextStep, learnings);
    }
  };

  // Step 5: Tree of Wisdom trunk and branches growth effect
  useEffect(() => {
    if (step === 5) {
      treeTrunkGrowth.value = withTiming(1, { duration: 1000 });
      treeBranchGrowth.value = withDelay(800, withTiming(1, { duration: 1000 }));
      treeLeavesScale.value = withDelay(1500, withSpring(1, { damping: 12 }));
      triggerHaptic('success');
    }
  }, [step]);

  // Step 6: Growth stats radial progression
  useEffect(() => {
    if (step === 6) {
      sunriseOpacity.value = withTiming(0.4, { duration: 2000 });
      circularProgress.value = withTiming(1, { duration: 1800 });
      triggerHaptic('medium');
    }
  }, [step]);

  // Step 7: Completion Screen sunburst activation
  useEffect(() => {
    if (step === 7) {
      sunriseOpacity.value = withTiming(0.95, { duration: 2500 });
      triggerHaptic('success');
    }
  }, [step]);

  // Submit and Complete Task rewards
  const handleReturnHome = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    triggerHaptic('heavy');

    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          task_name: "Write 3 Learnings",
          learnings: learnings
        })
      });

      const data = await response.json();

      if (response.ok || data.success) {
        await saveProgress(7, learnings, true);
        
        router.replace({
          pathname: '/(tabs)',
          params: {
            updatedPoints: data.totalPoints?.toString() || "300",
            updatedStreak: data.streak?.toString()
          }
        } as any);
      } else {
        Alert.alert("Error", data.error || "Failed to complete task");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Connection Error", "Could not synchronize rewards. Returning home.");
      router.replace('/(tabs)' as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (text: string) => {
    const updated = [...learnings];
    updated[step - 2] = text.slice(0, 250);
    setLearnings(updated);
  };

  // Reanimated style bindings
  const animatedCrystalStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: crystalTranslateX.value },
      { translateY: crystalTranslateY.value },
      { scale: crystalScale.value }
    ],
    opacity: crystalOpacity.value,
  }));

  const animatedTrunkProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(treeTrunkGrowth.value, [0, 1], [100, 0]),
  }));

  const animatedBranchProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(treeBranchGrowth.value, [0, 1], [100, 0]),
    opacity: treeBranchGrowth.value,
  }));

  const animatedLeavesStyle = useAnimatedStyle(() => ({
    transform: [{ scale: treeLeavesScale.value }],
    opacity: treeLeavesScale.value,
  }));

  const animatedCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * 45; // r=45
    return {
      strokeDashoffset: interpolate(circularProgress.value, [0, 1], [circumference, 0]),
    };
  });

  const animatedSunriseStyle = useAnimatedStyle(() => ({
    opacity: sunriseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dynamic Backgrounds */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
        <LinearGradient
          colors={['#0F0826', '#090518', COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Animated sunrise background glow */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedSunriseStyle]}>
          <LinearGradient
            colors={['rgba(255, 154, 61, 0.45)', 'rgba(126, 58, 242, 0.12)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.85 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Floating fireflies background effect */}
      <Fireflies />

      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]} edges={['top', 'bottom']}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          {step > 1 && step < 7 ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                const prev = Math.max(step - 1, 1);
                setStep(prev);
                saveProgress(prev, learnings);
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

          {step >= 2 && step <= 4 ? (
            <View style={styles.headerCenter}>
              <Text style={styles.progressText}>{step - 1} of 3</Text>
              
              {/* Mockup circular dot progress indicators */}
              <View style={styles.dotsProgressContainer}>
                {[1, 2, 3].map((dotIdx) => {
                  const isActive = step - 1 === dotIdx;
                  const isCompleted = step - 1 > dotIdx;
                  let dotColor = 'rgba(255,255,255,0.18)';
                  if (isActive) {
                    dotColor = dotIdx === 1 ? '#8B5CF6' : dotIdx === 2 ? '#FF9A3D' : '#38BDF8';
                  } else if (isCompleted) {
                    dotColor = 'rgba(255,255,255,0.55)';
                  }
                  return (
                    <View
                      key={dotIdx}
                      style={[
                        styles.progressDot,
                        { 
                          backgroundColor: isActive || isCompleted ? dotColor : 'transparent',
                          borderColor: dotColor
                        }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            <Text style={styles.headerTitle}>Write 3 Learnings</Text>
          )}

          {step < 7 ? (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                router.replace('/(tabs)' as any);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Content Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexOne}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.responsiveContent}>

              {/* ─── SCREEN 1: INTRODUCTION ─── */}
              {step === 1 && (
                <Animated.View entering={FadeIn.duration(1000)} style={styles.stepContainer}>
                  <View style={styles.introCenter}>
                    
                    <Text style={styles.titleBig}>Write 3 Learnings</Text>
                    <Text style={styles.subtitleBig}>
                      Every day teaches something.{"\n"}Capture today's lessons before they fade.
                    </Text>

                    {/* Gold separator ornament */}
                    <View style={styles.ornamentRow}>
                      <View style={styles.ornamentLine} />
                      <Text style={styles.ornamentDiamond}>✧ ── ✧</Text>
                      <View style={styles.ornamentLine} />
                    </View>

                    {/* Calming Quote (no cards, just text) */}
                    <Text style={styles.quoteIntroText}>
                      "The smallest lesson today can become tomorrow's greatest strength."
                    </Text>

                    {/* Tree Silhouette at the bottom center */}
                    <View style={styles.treeSilhouette}>
                      <WelcomeTreeSilhouette />
                    </View>

                    {/* Three empty hexagon slots */}
                    <View style={styles.slotsIntroContainer}>
                      <HexagonSlot color="rgba(255, 154, 61, 0.45)" />
                      <HexagonSlot color="rgba(255, 154, 61, 0.45)" />
                      <HexagonSlot color="rgba(255, 154, 61, 0.45)" />
                    </View>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleContinue} style={styles.gradientButtonContainer}>
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>Begin Journey</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* ─── SCREEN 2, 3, 4: INPUT FORM ─── */}
              {(step >= 2 && step <= 4) && (
                <View style={styles.stepContainer}>
                  
                  {/* Floating slot indicators above crystal */}
                  <View style={styles.slotsRow}>
                    {[...Array(3)].map((_, idx) => {
                      const isCollected = step - 2 > idx;
                      let slotColor = isCollected 
                        ? (idx === 0 ? '#8B5CF6' : idx === 1 ? '#FF9A3D' : '#38BDF8')
                        : 'rgba(255,255,255,0.15)';
                      return (
                        <View key={idx} style={styles.slotWrapper}>
                          {isCollected ? (
                            <View style={styles.slotGlowing}>
                              <Ionicons name="diamond" size={16} color={slotColor} />
                            </View>
                          ) : (
                            <Ionicons name="diamond-outline" size={16} color={slotColor} />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Gem pedestal visual */}
                  <Animated.View style={[styles.crystalWrapper, animatedCrystalStyle]}>
                    <GlowingCrystal step={step} fillProgress={fillProgress} />
                  </Animated.View>

                  <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.inputSection}>
                    <Text style={styles.learningHeading}>
                      {step === 2 && <><Ionicons name="star" size={14} color={COLORS.accent} /> First Learning</>}
                      {step === 3 && <><Ionicons name="bulb" size={14} color={COLORS.accent} /> Second Learning</>}
                      {step === 4 && <><Ionicons name="sparkles" size={14} color={COLORS.accent} /> Third Learning</>}
                    </Text>
                    
                    <Text style={styles.learningQuestion}>
                      {step === 2 && "What is one thing you learned today?"}
                      {step === 3 && "What surprised you today?"}
                      {step === 4 && "What lesson do you want to remember?"}
                    </Text>

                    <BlurView intensity={25} tint="dark" style={styles.writingCard}>
                      <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder={
                          step === 2 ? 'Example:\n"I learned that taking breaks helps me stay focused."' :
                          step === 3 ? 'Example:\n"I discovered something new about myself."' :
                          'Example:\n"Next time I will..."'
                        }
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={currentLearningText}
                        onChangeText={handleTextChange}
                        maxLength={250}
                        blurOnSubmit={true}
                      />
                      <Text style={styles.charCounter}>
                        {currentLearningText.length} / 250
                      </Text>
                    </BlurView>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleContinue}
                      style={[
                        styles.gradientButtonContainer, 
                        !currentLearningText.trim() && { opacity: 0.5 }
                      ]}
                      disabled={!currentLearningText.trim()}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>
                          {step === 4 ? "Complete" : "Continue"}
                        </Text>
                        <Ionicons 
                          name={step === 4 ? "checkmark" : "chevron-forward"} 
                          size={16} 
                          color="#FFF" 
                          style={{ marginLeft: 8 }} 
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}

              {/* ─── SCREEN 5: TREE OF WISDOM ─── */}
              {step === 5 && (
                <Animated.View entering={FadeIn.duration(1000)} style={styles.stepContainer}>
                  <Text style={styles.treeScreenTitle}>Your Tree of Wisdom</Text>
                  <Text style={styles.treeScreenSubtitle}>Tap on a leaf to see your learning.</Text>

                  <View style={styles.treeContainer}>
                    {/* SVG Tree Trunk & Branches */}
                    <Svg width={240} height={280} viewBox="0 0 100 100" style={styles.treeSvg}>
                      {/* Trunk */}
                      <AnimatedPath
                        d="M50,92 Q50,75 50,55"
                        fill="none"
                        stroke="#7E3AF2"
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        strokeDasharray="100"
                        animatedProps={animatedTrunkProps}
                      />
                      
                      {/* Left Branch */}
                      <AnimatedPath
                        d="M50,72 Q40,58 30,53"
                        fill="none"
                        stroke="#7E3AF2"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="100"
                        animatedProps={animatedBranchProps}
                      />

                      {/* Right Branch */}
                      <AnimatedPath
                        d="M50,72 Q60,58 70,53"
                        fill="none"
                        stroke="#7E3AF2"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="100"
                        animatedProps={animatedBranchProps}
                      />

                      {/* Center Branch */}
                      <AnimatedPath
                        d="M50,55 L50,35"
                        fill="none"
                        stroke="#7E3AF2"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeDasharray="100"
                        animatedProps={animatedBranchProps}
                      />

                      {/* Roots */}
                      <Path
                        d="M45,95 Q40,97 35,98 M55,95 Q60,97 65,98"
                        fill="none"
                        stroke={COLORS.secondary}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>

                    {/* Interactive Gold Labeled Leaf Cards positioned around tree */}
                    <Animated.View style={[styles.leavesContainer, animatedLeavesStyle]}>
                      
                      {/* Leaf 1 (Center Top) */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedLeafIndex(0);
                        }}
                        style={[styles.leafCardNode, styles.leafNodeCenter]}
                      >
                        <View style={styles.leafIndexCircle}>
                          <Text style={styles.leafIndexText}>1</Text>
                        </View>
                        <Text style={styles.leafSnippetText} numberOfLines={2}>
                          {learnings[0]}
                        </Text>
                        <Ionicons name="leaf" size={13} color={COLORS.emerald} style={styles.leafIconDecorator} />
                      </TouchableOpacity>

                      {/* Leaf 2 (Left Branch) */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedLeafIndex(1);
                        }}
                        style={[styles.leafCardNode, styles.leafNodeLeft]}
                      >
                        <View style={styles.leafIndexCircle}>
                          <Text style={styles.leafIndexText}>2</Text>
                        </View>
                        <Text style={styles.leafSnippetText} numberOfLines={2}>
                          {learnings[1]}
                        </Text>
                        <Ionicons name="leaf" size={13} color={COLORS.emerald} style={styles.leafIconDecorator} />
                      </TouchableOpacity>

                      {/* Leaf 3 (Right Branch) */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedLeafIndex(2);
                        }}
                        style={[styles.leafCardNode, styles.leafNodeRight]}
                      >
                        <View style={styles.leafIndexCircle}>
                          <Text style={styles.leafIndexText}>3</Text>
                        </View>
                        <Text style={styles.leafSnippetText} numberOfLines={2}>
                          {learnings[2]}
                        </Text>
                        <Ionicons name="leaf" size={13} color={COLORS.emerald} style={styles.leafIconDecorator} />
                      </TouchableOpacity>

                    </Animated.View>
                  </View>

                  <Text style={styles.treeInstructions}>Keep nurturing your tree every day.</Text>

                  <TouchableOpacity activeOpacity={0.85} onPress={handleContinue} style={styles.gradientButtonContainer}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>View Personal Growth</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ─── SCREEN 6: YOUR GROWTH stats page ─── */}
              {step === 6 && (
                <Animated.View entering={FadeIn.duration(1000)} style={styles.stepContainer}>
                  <Text style={styles.growthTitle}>Your Growth Today</Text>
                  <Text style={styles.growthSubtitle}>Every lesson makes you stronger.</Text>

                  {/* Circular Growth Progress */}
                  <View style={styles.circularContainer}>
                    <Svg width={180} height={180} viewBox="0 0 100 100">
                      <Defs>
                        <SvgLinearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor={COLORS.primary} />
                          <Stop offset="100%" stopColor={COLORS.secondary} />
                        </SvgLinearGradient>
                      </Defs>
                      <SvgCircle
                        cx={50}
                        cy={50}
                        r={45}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth={5}
                      />
                      <AnimatedCircle
                        cx={50}
                        cy={50}
                        r={45}
                        fill="none"
                        stroke="url(#circleGrad)"
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 45}
                        animatedProps={animatedCircleProps}
                        transform="rotate(-90 50 50)"
                      />
                    </Svg>
                    <View style={styles.circularInner}>
                      {/* Gold Tree Outline inside circular meter */}
                      <Ionicons name="git-branch" size={32} color={COLORS.secondary} />
                      <Text style={styles.circularPercent}>100%</Text>
                    </View>
                  </View>

                  {/* Three Stats Cards in a row */}
                  <View style={styles.statsRow}>
                    <BlurView intensity={20} tint="dark" style={styles.statCard}>
                      <Ionicons name="leaf" size={22} color={COLORS.emerald} style={{ marginBottom: 6 }} />
                      <Text style={styles.statLabel}>Lessons Collected</Text>
                      <Text style={styles.statValue}>3</Text>
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.statCard}>
                      <Ionicons name="diamond" size={22} color={COLORS.primary} style={{ marginBottom: 6 }} />
                      <Text style={styles.statLabel}>Wisdom Gems</Text>
                      <Text style={styles.statValue}>3</Text>
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.statCard}>
                      <Ionicons name="git-branch" size={22} color={COLORS.secondary} style={{ marginBottom: 6 }} />
                      <Text style={styles.statLabel}>Tree Growth</Text>
                      <Text style={styles.statValue}>100%</Text>
                    </BlurView>
                  </View>

                  {/* Reflection Card */}
                  <BlurView intensity={15} tint="dark" style={styles.reflectionCard}>
                    <View style={styles.reflectionHeader}>
                      <Text style={styles.reflectionHeaderTitle}>✧ Reflection</Text>
                    </View>
                    <Text style={styles.reflectionText}>
                      Every lesson you notice makes tomorrow a little easier.
                    </Text>
                  </BlurView>

                  <TouchableOpacity activeOpacity={0.85} onPress={handleContinue} style={styles.gradientButtonContainer}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>Continue</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ─── SCREEN 7: JOURNEY COMPLETE ─── */}
              {step === 7 && (
                <Animated.View entering={FadeIn.duration(1200)} style={styles.stepContainer}>
                  <View style={styles.completionContainer}>
                    
                    {/* Completion silhouette tree background placeholder */}
                    <View style={styles.treeSilhouetteCenter}>
                      <WelcomeTreeSilhouette />
                    </View>

                    <Text style={styles.completeTitle}>Journey Complete</Text>
                    <Text style={styles.completeSubtitle}>
                      You didn't just live today.{"\n"}You learned from it.
                    </Text>

                    {/* Trophy reward points card */}
                    <BlurView intensity={25} tint="dark" style={[styles.rewardCardFull, styles.cardYellowBorder]}>
                      <Ionicons name="trophy" size={32} color={COLORS.accent} style={{ marginBottom: 8 }} />
                      <Text style={styles.rewardPoints}>+300</Text>
                      <Text style={styles.rewardLabel}>Mind Points</Text>
                    </BlurView>

                    {/* Ribbon Star collector card */}
                    <BlurView intensity={20} tint="dark" style={[styles.rewardCardFull, styles.cardGoldGlow]}>
                      <Ionicons name="star" size={28} color={COLORS.accent} style={{ marginBottom: 6 }} />
                      <Text style={styles.achievementBadgeHeader}>Wisdom Collector</Text>
                      <Text style={styles.achievementBadgeSubText}>You collected 3 wisdom gems today!</Text>
                    </BlurView>

                    <Text style={styles.completeQuote}>
                      "The more you learn from life,{"\n"}the more beautifully you grow."
                    </Text>

                    <TouchableOpacity 
                      activeOpacity={0.85} 
                      onPress={handleReturnHome} 
                      style={styles.gradientButtonContainer}
                      disabled={isSubmitting}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="home-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.primaryButtonText}>Return Home</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Detailed Leaf Node Popup Modal */}
        {selectedLeafIndex !== null && (
          <View style={styles.modalOverlay}>
            <BlurView intensity={30} tint="dark" style={styles.modalBlur}>
              <Animated.View entering={FadeIn.duration(400)} style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons name="leaf" size={20} color={COLORS.emerald} style={{ marginRight: 8 }} />
                    <Text style={styles.modalTitle}>
                      {selectedLeafIndex === 0 && "First Learning"}
                      {selectedLeafIndex === 1 && "Second Learning"}
                      {selectedLeafIndex === 2 && "Third Learning"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedLeafIndex(null);
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.modalBodyText}>
                    {learnings[selectedLeafIndex]}
                  </Text>
                </ScrollView>
              </Animated.View>
            </BlurView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// React Native SVG Circle Reanimated Component
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20
  },
  responsiveContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  progressText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  dotsProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  firefly: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Welcome page introduction elements
  introCenter: {
    alignItems: 'center',
    width: '100%',
  },
  titleBig: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  subtitleBig: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20
  },
  ornamentLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(255, 154, 61, 0.25)',
  },
  ornamentDiamond: {
    color: COLORS.secondary,
    fontSize: 13,
    marginHorizontal: 10,
    fontWeight: '600'
  },
  quoteIntroText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
    fontWeight: '500'
  },
  treeSilhouette: {
    marginTop: 10,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsIntroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 35,
  },

  // Crystallization and pedestal styles
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  slotWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotGlowing: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  crystalWrapper: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    zIndex: 10,
  },
  crystalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalGlow: {
    position: 'absolute',
    width: 80,
    height: 130,
    borderRadius: 40,
    opacity: 0.5,
    filter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 30,
  },
  crystalSvg: {
    zIndex: 11,
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
  },
  learningHeading: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  learningQuestion: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  writingCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.glass,
  },
  textInput: {
    color: COLORS.text,
    fontSize: 15,
    height: 90,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 22,
  },
  charCounter: {
    alignSelf: 'flex-end',
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 6,
  },

  // Svg Tree and leaf nodes layout
  treeScreenTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  treeScreenSubtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  treeContainer: {
    width: '100%',
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  treeSvg: {
    position: 'absolute',
    bottom: 20,
    zIndex: 1,
  },
  leavesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  leafCardNode: {
    position: 'absolute',
    backgroundColor: 'rgba(9, 7, 26, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 154, 61, 0.45)', // gold border
    borderRadius: 16,
    padding: 10,
    width: 140,
    shadowColor: COLORS.secondary, // gold shadow glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  leafNodeLeft: {
    left: '4%',
    top: '32%',
  },
  leafNodeCenter: {
    alignSelf: 'center',
    top: '4%',
  },
  leafNodeRight: {
    right: '4%',
    top: '32%',
  },
  leafIndexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.secondary, // gold index badge
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  leafIndexText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  leafSnippetText: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 15,
  },
  leafIconDecorator: {
    position: 'absolute',
    right: 8,
    top: 8,
    opacity: 0.6,
  },
  treeInstructions: {
    color: COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },

  // Growth ring dashboard
  growthTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  growthSubtitle: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  circularInner: {
    position: 'absolute',
    alignItems: 'center',
  },
  circularPercent: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.glass,
  },
  statLabel: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  reflectionCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 28,
    overflow: 'hidden',
    backgroundColor: COLORS.glass,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reflectionHeaderTitle: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reflectionText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },

  // Completion Success layout styles
  completionContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  treeSilhouetteCenter: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    color: COLORS.textDim,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  rewardCardFull: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardYellowBorder: {
    borderColor: 'rgba(255, 154, 61, 0.45)',
    backgroundColor: 'rgba(255, 154, 61, 0.05)',
  },
  cardGoldGlow: {
    borderColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    shadowColor: COLORS.accent,
  },
  rewardPoints: {
    color: COLORS.secondary,
    fontSize: 32,
    fontWeight: '900',
  },
  rewardLabel: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  achievementBadgeHeader: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  achievementBadgeSubText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
  completeQuote: {
    color: COLORS.textDim,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 28,
  },

  // Buttons generic
  gradientButtonContainer: {
    width: '100%',
    borderRadius: 99,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 99,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Hexagons and particles layout helpers
  hexagonWrapper: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },

  // Modal Dialog Popup for Leaves
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  modalBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(15, 11, 35, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(126, 58, 242, 0.3)',
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 200,
  },
  modalBodyText: {
    color: COLORS.textDim,
    fontSize: 15,
    lineHeight: 22,
  },
});
