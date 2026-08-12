import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, TextInput, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS,
  interpolate, Easing, useAnimatedProps, interpolateColor
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0B0914', // Deep space-black
  blue: '#38BDF8', // Camera facts highlight
  purple: '#A78BFA', // Brain stories highlight
  lavender: '#C4B5FD', // Lavender highlight
  gold: '#FBBF24', // Gold success highlight
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBrd: 'rgba(255, 255, 255, 0.11)',
  textLight: 'rgba(255, 255, 255, 0.65)',
  textMid: 'rgba(255, 255, 255, 0.88)'
};

type ScreenState = 'welcome' | 'intro' | 'thought' | 'camera' | 'brain' | 'compare' | 'insight' | 'anchor' | 'success';

// ── Floating Drift Particle Component ─────────────────────────────────────
function Particle({ x, y, size, color, delay, drift = 20 }: any) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const op = useSharedValue(0.4);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-40 - delay * 0.08, { duration: 3500 + delay, easing: Easing.inOut(Easing.ease) }),
      withTiming(10, { duration: 3500 + delay, easing: Easing.inOut(Easing.ease) })
    ), -1, true);

    tx.value = withRepeat(withSequence(
      withTiming(drift, { duration: 2800 + delay * 0.5, easing: Easing.inOut(Easing.ease) }),
      withTiming(-drift, { duration: 2800 + delay * 0.5, easing: Easing.inOut(Easing.ease) })
    ), -1, true);

    op.value = withRepeat(withSequence(
      withTiming(0.75, { duration: 2200 + delay }),
      withTiming(0.15, { duration: 2200 + delay })
    ), -1, true);
  }, []);

  const s = useAnimatedStyle(() => ({
    transform: [
      { translateY: ty.value },
      { translateX: tx.value }
    ],
    opacity: op.value
  }));

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color
      },
      s
    ]} />
  );
}

// ── Animated Surreal Background ───────────────────────────────────────────
function SurrealBackground() {
  const bgScale = useSharedValue(1);

  useEffect(() => {
    bgScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
    opacity: 0.55
  }));

  // Randomized particle configurations to cover the space
  const particles = [
    { x: 30, y: 150, size: 5, color: '#38BDF8', delay: 100, drift: 15 },
    { x: width - 70, y: 220, size: 4, color: '#A78BFA', delay: 400, drift: -20 },
    { x: 60, y: 390, size: 6, color: '#C4B5FD', delay: 800, drift: 25 },
    { x: width - 110, y: 460, size: 5, color: '#0284C7', delay: 300, drift: -10 },
    { x: 40, y: 600, size: 4, color: '#38BDF8', delay: 1200, drift: 18 },
    { x: width - 50, y: 680, size: 5, color: '#A78BFA', delay: 600, drift: -15 },
    { x: 100, y: 250, size: 3, color: '#FFF', delay: 1500, drift: 8 },
    { x: width - 150, y: 120, size: 4, color: '#C4B5FD', delay: 900, drift: -12 },
    { x: 80, y: 500, size: 5, color: '#38BDF8', delay: 200, drift: 14 },
    { x: width - 100, y: 320, size: 6, color: '#A78BFA', delay: 700, drift: -22 },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.Image
        source={require('../assets/images/surreal_cosmic_bg.png')}
        style={[StyleSheet.absoluteFillObject, bgStyle]}
        resizeMode="cover"
      />
      <LinearGradient 
        colors={['rgba(11, 9, 20, 0.45)', 'rgba(15, 12, 27, 0.85)', '#0B0914']} 
        style={StyleSheet.absoluteFillObject} 
      />
      {particles.map((p, i) => <Particle key={i} {...p} />)}
    </View>
  );
}

// ── Premium Gradient Button ──────────────────────────────────────────────
function GradBtn({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled?: boolean; colors?: [string, string] }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(style);
      }
    } catch (e) {}
  };

  return (
    <Animated.View style={[styles.gradBtnWrap, s]}>
      <Pressable
        onPressIn={() => {
          if (!disabled) {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            sc.value = withSpring(0.96);
          }
        }}
        onPressOut={() => { sc.value = withSpring(1); }}
        onPress={onPress}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={disabled ? ['#2D273D', '#1A1726'] : (colors || [C.blue, '#0284C7'])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={[styles.gradBtnText, disabled && { color: 'rgba(255,255,255,0.25)' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MAIN SCREEN COMPONENT ────────────────────────────────────────────────
export default function BrainVsCameraScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [thought, setThought] = useState('');
  
  // List arrays
  const [facts, setFacts] = useState<string[]>([]);
  const [stories, setStories] = useState<string[]>([]);
  
  // Input fields
  const [factInput, setFactInput] = useState('');
  const [storyInput, setStoryInput] = useState('');

  // Completion states & functions
  const [completeData, setCompleteData] = useState<{ totalPoints: number; streak: number } | null>(null);
  const [isAwarding, setIsAwarding] = useState(false);
  const [hasCalledComplete, setHasCalledComplete] = useState(false);
  const [pointsDisplay, setPointsDisplay] = useState(0);

  const completeTask = async (): Promise<{ totalPoints: number; streak: number } | null> => {
    if (hasCalledComplete) return completeData;
    try {
      setHasCalledComplete(true);
      const token = await SecureStore.getItemAsync('token');
      if (!token) return null;
      const res = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          task_name: 'Brain vs Camera', 
          points: 500,
          original_thought: thought,
          facts: facts,
          stories: stories
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const result = { totalPoints: data.totalPoints, streak: data.streak };
        setCompleteData(result);
        return result;
      }
      return null;
    } catch (e) {
      console.error('completeTask error:', e);
      return null;
    }
  };

  const handleReturnHome = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    
    let finalPoints = completeData?.totalPoints;
    let finalStreak = completeData?.streak;
    
    if (!finalPoints) {
      const data = await completeTask();
      if (data) {
        finalPoints = data.totalPoints;
        finalStreak = data.streak;
      }
    }

    router.replace({
      pathname: '/(tabs)',
      params: { 
        updatedPoints: finalPoints ? String(finalPoints) : undefined, 
        updatedStreak: finalStreak !== undefined ? String(finalStreak) : undefined 
      }
    } as any);
  };

  // Reanimated Animation Values
  const shutterYTop = useSharedValue(-height / 2);
  const shutterYBottom = useSharedValue(height / 2);
  const reticleScale = useSharedValue(1);
  const reticleRotation = useSharedValue(0);
  const brainPulse = useSharedValue(1);

  // SVG insight animated value
  const svgProgress = useSharedValue(0);

  // Screen 7 float away story translation
  const storyFloatY = useSharedValue(0);
  const storyFloatOpacity = useSharedValue(1);
  const storyFloatScale = useSharedValue(1);
  const storyFloatRotation = useSharedValue(0);

  // Welcome Hero Float animation
  const welcomeHeroFloat = useSharedValue(0);

  // Screen 3 Orb Scale and border glow
  const orbScale = useSharedValue(1);
  const borderGlow = useSharedValue(0);

  // Screen 8 Success Radiant rotation
  const successRadiantScale = useSharedValue(0.2);
  const successRadiantRotate = useSharedValue(0);
  const successTrophyAnim = useSharedValue(0);

  // Setup loop animations
  useEffect(() => {
    reticleScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500 }),
        withTiming(0.96, { duration: 1500 })
      ),
      -1,
      true
    );

    reticleRotation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    brainPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    welcomeHeroFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(style);
      }
    } catch (e) {}
  };

  const triggerShutterTransition = (nextScreen: ScreenState) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    // Slide shutter closed
    shutterYTop.value = withTiming(0, { duration: 320 });
    shutterYBottom.value = withTiming(0, { duration: 320 }, (finished) => {
      if (finished) {
        runOnJS(setScreen)(nextScreen);
        // Slide shutter open
        shutterYTop.value = withTiming(-height / 2, { duration: 420 });
        shutterYBottom.value = withTiming(height / 2, { duration: 420 });
      }
    });
  };

  const addFact = () => {
    if (!factInput.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setFacts([...facts, factInput.trim()]);
    setFactInput('');
  };

  const addStory = () => {
    if (!storyInput.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setStories([...stories, storyInput.trim()]);
    setStoryInput('');
  };

  // Screen 6 insight trigger
  useEffect(() => {
    if (screen === 'insight') {
      svgProgress.value = 0;
      svgProgress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) });
    }
  }, [screen]);

  // Screen 8 success trigger (confetti, starburst, trophy, points countdown)
  useEffect(() => {
    if (screen === 'success') {
      successRadiantScale.value = 0.2;
      successRadiantScale.value = withSpring(1, { damping: 10 });
      successRadiantRotate.value = 0;
      successRadiantRotate.value = withRepeat(
        withTiming(360, { duration: 22000, easing: Easing.linear }),
        -1
      );

      successTrophyAnim.value = 0;
      successTrophyAnim.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Smooth count up points from 0 to 500
      setPointsDisplay(0);
      let start = 0;
      const end = 500;
      const duration = 1800; // 1.8 seconds
      const stepTime = 30; // 30ms steps
      const totalSteps = duration / stepTime;
      const increment = end / totalSteps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setPointsDisplay(end);
          clearInterval(timer);
        } else {
          setPointsDisplay(Math.floor(start));
        }
      }, stepTime);

      if (!hasCalledComplete && !isAwarding) {
        setIsAwarding(true);
        completeTask().then(() => {
          setIsAwarding(false);
        });
      }
      
      return () => clearInterval(timer);
    }
  }, [screen]);

  // Screen 3 Orb scale tracker
  useEffect(() => {
    if (screen === 'thought') {
      orbScale.value = withSpring(1 + (thought.length / 200) * 0.45);
    }
  }, [thought, screen]);

  const handleThoughtChange = (text: string) => {
    setThought(text);
    borderGlow.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 250 })
    );
  };

  // Screen 7 animation trigger
  const triggerAnchorFloat = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    storyFloatY.value = withTiming(-380, { duration: 3200, easing: Easing.inOut(Easing.quad) });
    storyFloatOpacity.value = withTiming(0, { duration: 2900 });
    storyFloatScale.value = withTiming(0.4, { duration: 3100 });
    storyFloatRotation.value = withTiming(10, { duration: 3200 });
  };

  // Reanimated style definitions
  const animatedShutterTop = useAnimatedStyle(() => ({
    transform: [{ translateY: shutterYTop.value }]
  }));

  const animatedShutterBottom = useAnimatedStyle(() => ({
    transform: [{ translateY: shutterYBottom.value }]
  }));

  const animatedReticle = useAnimatedStyle(() => ({
    transform: [
      { scale: reticleScale.value },
      { rotate: `${interpolate(reticleRotation.value, [0, 1], [-2.2, 2.2])}deg` }
    ]
  }));

  const animatedBrain = useAnimatedStyle(() => ({
    transform: [{ scale: brainPulse.value }]
  }));

  const floatAwayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: storyFloatY.value },
      { scale: storyFloatScale.value },
      { rotate: `${storyFloatRotation.value}deg` }
    ],
    opacity: storyFloatOpacity.value
  }));

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: welcomeHeroFloat.value }]
  }));

  const animatedInputCardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.12)', 'rgba(167, 139, 250, 0.6)']
    ),
    shadowColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ['rgba(0,0,0,0)', 'rgba(167, 139, 250, 0.4)']
    ),
    shadowRadius: interpolate(borderGlow.value, [0, 1], [6, 16]),
    shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.1, 0.5])
  }));

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: interpolate(orbScale.value, [1, 1.45], [0.18, 0.45]),
    backgroundColor: interpolateColor(
      orbScale.value,
      [1, 1.45],
      ['rgba(167, 139, 250, 0.7)', 'rgba(56, 189, 248, 0.85)']
    )
  }));

  const animatedSuccessRadiantStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: successRadiantScale.value },
      { rotate: `${successRadiantRotate.value}deg` }
    ]
  }));

  const animatedTrophyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: successTrophyAnim.value },
      { scale: interpolate(successTrophyAnim.value, [-6, 0], [1.04, 1.0]) }
    ]
  }));

  // Suggestion Examples setup
  const examplesList = [
    "My friend left me on seen.",
    "My boss scheduled a meeting without context.",
    "I made a mistake in front of the whole team.",
    "No one replied to my post in the group chat."
  ];
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    if (screen === 'thought') {
      const interval = setInterval(() => {
        setExampleIndex((prev) => (prev + 1) % examplesList.length);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [screen]);

  // Svg circular arc calculations
  const totalEntries = Math.max(facts.length + stories.length, 1);
  const factPercentage = facts.length / totalEntries;
  const clarityScore = Math.round(factPercentage * 100);

  // SVG stroke details
  const radius = 60;
  const strokeWidth = 10;
  const circum = 2 * Math.PI * radius; // 377

  const animatedSvgProps = useAnimatedProps(() => {
    const strokeDashoffset = circum - (svgProgress.value * factPercentage) * circum;
    return {
      strokeDashoffset
    };
  });

  // ──────── SCREEN 1 — WELCOME SCREEN ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            {/* Split Illustration */}
            <Animated.View 
              entering={FadeInDown.duration(900)} 
              style={[styles.welcomeHeroContainer, animatedHeroStyle]}
            >
              <LinearGradient 
                colors={['rgba(56, 189, 248, 0.18)', 'rgba(167, 139, 250, 0.18)']} 
                style={styles.heroGlow} 
              />
              <Image
                source={require('../assets/images/brain_vs_camera_hero.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.welcomeIntro}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🧠 Cognitive Reframing</Text>
              </View>
              <Text style={styles.welcomeTitle}>📸 Brain vs Camera</Text>
              <Text style={styles.welcomeSubtitle}>
                See what happened. Separate it from the story your mind created.
              </Text>
            </Animated.View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Begin Task" 
                onPress={() => triggerShutterTransition('intro')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 2 — TASK INTRODUCTION (NEW) ────────
  if (screen === 'intro') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => triggerShutterTransition('welcome')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Task Intro</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>How this task helps you</Text>
                <Text style={styles.introSummaryText}>
                  Brain vs Camera is a mindfulness exercise designed to help you separate objective reality from the stories your mind creates.
                </Text>
              </Animated.View>

              {/* Glassmorphic explanation card */}
              <Animated.View entering={FadeInDown.delay(150).duration(900)} style={styles.introGlassCard}>
                
                {/* Step 1 */}
                <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.introStepRow}>
                  <View style={[styles.introIconCircle, { backgroundColor: 'rgba(167, 139, 250, 0.15)', borderColor: 'rgba(167, 139, 250, 0.3)' }]}>
                    <Feather name="edit-3" size={18} color={C.purple} />
                  </View>
                  <View style={styles.introStepContent}>
                    <Text style={styles.introStepTitle}>1. Write a worrying thought</Text>
                    <Text style={styles.introStepDesc}>Start by putting down whatever worrying thought is on your mind today.</Text>
                  </View>
                </Animated.View>

                {/* Step 2 */}
                <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.introStepRow}>
                  <View style={[styles.introIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                    <Feather name="camera" size={18} color={C.blue} />
                  </View>
                  <View style={styles.introStepContent}>
                    <Text style={styles.introStepTitle}>2. Filter camera facts</Text>
                    <Text style={styles.introStepDesc}>Identify only the observable facts—what a physical camera would capture.</Text>
                  </View>
                </Animated.View>

                {/* Step 3 */}
                <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.introStepRow}>
                  <View style={[styles.introIconCircle, { backgroundColor: 'rgba(196, 181, 253, 0.15)', borderColor: 'rgba(196, 181, 253, 0.3)' }]}>
                    <MaterialCommunityIcons name="brain" size={18} color={C.lavender} />
                  </View>
                  <View style={styles.introStepContent}>
                    <Text style={styles.introStepTitle}>3. Unmask brain narratives</Text>
                    <Text style={styles.introStepDesc}>Recognize the assumptions, fears, or predictions your mind added.</Text>
                  </View>
                </Animated.View>

                {/* Step 4 */}
                <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.introStepRow}>
                  <View style={[styles.introIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.25)' }]}>
                    <MaterialCommunityIcons name="scale-balance" size={18} color="#FFF" />
                  </View>
                  <View style={styles.introStepContent}>
                    <Text style={styles.introStepTitle}>4. Find cognitive balance</Text>
                    <Text style={styles.introStepDesc}>By comparing facts with stories, you'll see that not every thought is true.</Text>
                  </View>
                </Animated.View>

              </Animated.View>

              <Animated.View entering={FadeInUp.delay(650).duration(800)} style={styles.introFooterCard}>
                <Text style={styles.introFooterText}>
                  This exercise helps reduce overthinking, encourages rational thinking, and brings greater clarity and emotional balance.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(750).duration(700)} style={styles.timeEstimateContainer}>
                <Text style={styles.timeEstimateText}>✨ Takes less than 2 minutes</Text>
              </Animated.View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Start Task" 
                onPress={() => triggerShutterTransition('thought')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 3 — ENTER WORRYING THOUGHT (REDESIGN) ────────
  if (screen === 'thought') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => triggerShutterTransition('intro')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Describe Worry</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>What's on your mind today?</Text>
                  <Text style={styles.writeSubtitle}>Write down the situation or thought that is weighing on your mind.</Text>
                </Animated.View>

                {/* Unique Premium Orb/Journal Input Experience */}
                <Animated.View 
                  entering={FadeInDown.delay(200).duration(800)} 
                  style={[styles.premiumThoughtContainer, animatedInputCardStyle]}
                >
                  {/* Glowing Memory Orb behind input */}
                  <Animated.View style={[styles.memoryOrb, animatedOrbStyle]} />
                  
                  <Text style={styles.worryCardLabel}>💭 Floating Journal</Text>
                  <TextInput
                    style={styles.worryInput}
                    multiline
                    numberOfLines={5}
                    placeholder="My friend didn't reply to my message..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={thought}
                    onChangeText={handleThoughtChange}
                    maxLength={200}
                  />
                  <Text style={styles.worryCharCount}>{thought.length} / 200</Text>
                </Animated.View>

                {/* Interactive suggestion builder */}
                <Animated.View entering={FadeInUp.delay(350).duration(700)} style={styles.suggestionWrapper}>
                  <Pressable 
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      handleThoughtChange(examplesList[exampleIndex]);
                    }}
                    style={styles.exampleSuggestionPressable}
                  >
                    <Ionicons name="sparkles" size={14} color={C.lavender} style={{ marginRight: 6 }} />
                    <Text style={styles.exampleLabel}>Tap to write: </Text>
                    <Animated.Text 
                      key={exampleIndex}
                      entering={FadeInDown.duration(400)}
                      style={styles.exampleSuggestionText}
                    >
                      "{examplesList[exampleIndex]}"
                    </Animated.Text>
                  </Pressable>
                </Animated.View>

              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Continue →" 
                  onPress={() => triggerShutterTransition('camera')} 
                  disabled={!thought.trim()} 
                  colors={[C.blue, C.purple]}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 4 — CAMERA MODE (Facts Collection) ────────
  if (screen === 'camera') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => triggerShutterTransition('thought')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.blue }]}>Camera Mode 📸</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>If a camera recorded this moment, what would it capture?</Text>
                  <Text style={[styles.writeSubtitle, { color: 'rgba(56, 189, 248, 0.8)' }]}>
                    List only objective facts. Things anyone could observe. No guesses.
                  </Text>
                </Animated.View>

                {/* Camera Framed View */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.cameraBoxContainer}>
                  {/* Camera Reticle corners outline */}
                  <Animated.View style={[styles.cameraReticle, animatedReticle]}>
                    <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
                    <View style={[styles.reticleCorner, styles.reticleTopRight]} />
                    <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
                    <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
                  </Animated.View>

                  {/* List of facts entered */}
                  <View style={styles.factsList}>
                    {facts.length === 0 ? (
                      <Text style={styles.listPlaceholder}>No facts logged yet. Enter one below.</Text>
                    ) : (
                      facts.map((fact, index) => (
                        <Animated.View 
                          key={index} 
                          entering={FadeInDown.duration(350).springify()} 
                          style={styles.factItem}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color={C.blue} style={{ marginRight: 8 }} />
                          <Text style={styles.factText}>{fact}</Text>
                        </Animated.View>
                      ))
                    )}
                  </View>
                </Animated.View>

                {/* Dynamic Fact Input Form */}
                <View style={styles.listBuilderForm}>
                  <TextInput
                    style={styles.builderInput}
                    placeholder="e.g., I sent a message. It has been 8 hours."
                    placeholderTextColor="rgba(56, 189, 248, 0.3)"
                    value={factInput}
                    onChangeText={setFactInput}
                    onSubmitEditing={addFact}
                  />
                  <TouchableOpacity onPress={addFact} style={[styles.builderAddBtn, { backgroundColor: C.blue }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Next →" 
                  onPress={() => triggerShutterTransition('brain')} 
                  disabled={facts.length === 0} 
                  colors={[C.blue, '#0284C7']}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 5 — BRAIN MODE (Stories Collection) ────────
  if (screen === 'brain') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => triggerShutterTransition('camera')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.purple }]}>Brain Mode 🧠</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>Now, what story did your mind create?</Text>
                  <Text style={[styles.writeSubtitle, { color: 'rgba(167, 139, 250, 0.8)' }]}>
                    List thoughts, assumptions, guesses, worries, or predictions.
                  </Text>
                </Animated.View>

                {/* Brain cloud display */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.brainBoxContainer}>
                  {/* Pulsing brain icon with soft neon back-glow */}
                  <Animated.View style={[styles.brainPulseWrapper, animatedBrain]}>
                    <View style={styles.brainGlowBacking} />
                    <MaterialCommunityIcons name="brain" size={48} color={C.purple} />
                  </Animated.View>

                  {/* List of stories entered */}
                  <View style={styles.factsList}>
                    {stories.length === 0 ? (
                      <Text style={styles.listPlaceholder}>No narratives logged yet. Enter one below.</Text>
                    ) : (
                      stories.map((story, index) => (
                        <Animated.View 
                          key={index} 
                          entering={FadeInDown.duration(350).springify()} 
                          style={styles.storyItem}
                        >
                          <Ionicons name="help-circle-outline" size={18} color={C.purple} style={{ marginRight: 8 }} />
                          <Text style={styles.storyText}>{story}</Text>
                        </Animated.View>
                      ))
                    )}
                  </View>
                </Animated.View>

                {/* Dynamic Story Input Form */}
                <View style={styles.listBuilderForm}>
                  <TextInput
                    style={styles.builderInput}
                    placeholder="e.g., They are ignoring me. They're angry."
                    placeholderTextColor="rgba(167, 139, 250, 0.3)"
                    value={storyInput}
                    onChangeText={setStoryInput}
                    onSubmitEditing={addStory}
                  />
                  <TouchableOpacity onPress={addStory} style={[styles.builderAddBtn, { backgroundColor: C.purple }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Continue →" 
                  onPress={() => triggerShutterTransition('compare')} 
                  disabled={stories.length === 0} 
                  colors={[C.purple, '#7C3AED']}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 6 — COMPARE ────────
  if (screen === 'compare') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => triggerShutterTransition('brain')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reality vs Story</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Let's compare them side-by-side</Text>
                <Text style={styles.writeSubtitle}>Look at the difference between what was observed and what was imagined.</Text>
              </Animated.View>

              {/* Side by side cards */}
              <View style={styles.compareContainer}>
                
                {/* Reality Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={[styles.compareCard, styles.compareRealityCard]}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="camera-outline" size={20} color={C.blue} style={{ marginRight: 6 }} />
                    <Text style={[styles.compareCardTitle, { color: C.blue }]}>Reality (Camera)</Text>
                  </View>
                  <View style={styles.dividerBlue} />
                  {facts.map((fact, index) => (
                    <Text key={index} style={styles.compareTextLine}>✓ {fact}</Text>
                  ))}
                </Animated.View>

                {/* Story Card */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={[styles.compareCard, styles.compareStoryCard]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="brain" size={20} color={C.purple} style={{ marginRight: 6 }} />
                    <Text style={[styles.compareCardTitle, { color: C.purple }]}>Story (Brain)</Text>
                  </View>
                  <View style={styles.dividerPurple} />
                  {stories.map((story, index) => (
                    <Text key={index} style={styles.compareTextLine}>☁️ {story}</Text>
                  ))}
                </Animated.View>

              </View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Show Insight" 
                onPress={() => triggerShutterTransition('insight')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 7 — INSIGHT METER ────────
  if (screen === 'insight') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => triggerShutterTransition('compare')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Insight Meter</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Here's what we found</Text>
              </Animated.View>

              {/* Concentric Circular Progress Dial */}
              <View style={styles.svgContainer}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                  <G rotation="-90" origin="80, 80">
                    {/* Background Circle */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Reality stroke arc */}
                    <AnimatedCircle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={C.blue}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circum}
                      animatedProps={animatedSvgProps}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </G>
                </Svg>

                <View style={styles.svgCenterLabel}>
                  <Text style={styles.svgCenterNum}>{clarityScore}%</Text>
                  <Text style={styles.svgCenterTxt}>Clarity</Text>
                </View>
              </View>

              {/* Meter Stats Box */}
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: C.blue }]}>Camera Facts</Text>
                  <Text style={styles.metricVal}>{facts.length}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: C.purple }]}>Brain Stories</Text>
                  <Text style={styles.metricVal}>{stories.length}</Text>
                </View>
              </Animated.View>

              {/* Side comparison with visual focus (Facts sharp, stories blurred) */}
              <View style={styles.focusContainer}>
                <View style={[styles.focusCard, styles.focusRealityCard]}>
                  <Text style={[styles.focusTitle, { color: C.blue }]}>📷 Reality (Sharp)</Text>
                  <Text style={styles.focusBody} numberOfLines={2}>"{facts[0] || 'Observe reality'}"</Text>
                </View>
                
                {/* Blurred Story card using textShadow */}
                <View style={[styles.focusCard, styles.focusStoryCard, { opacity: 0.4 }]}>
                  <Text style={[styles.focusTitle, { color: C.purple }]}>🧠 Story (Blurred)</Text>
                  <Text style={[styles.focusBody, styles.textBlurred]} numberOfLines={2}>"{stories[0] || 'Imagined thoughts'}"</Text>
                </View>
              </View>

              <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.insightBox}>
                <Text style={styles.insightText}>
                  Your brain tried to explain uncertainty by creating a story. That doesn't make the story true.
                </Text>
              </Animated.View>

            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Continue" 
                onPress={() => triggerShutterTransition('anchor')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 8 — REALITY ANCHOR (Float Away Story Animation) ────────
  if (screen === 'anchor') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SurrealBackground />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => triggerShutterTransition('insight')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Clarity Anchor</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Return to what you know</Text>
                <Text style={styles.writeSubtitle}>Watch the worries dissolve, leaving only clear facts.</Text>
              </Animated.View>

              <View style={styles.anchorWrapper}>
                
                {/* Stories floating away */}
                <Animated.View style={[styles.anchorStoryColumn, floatAwayStyle]}>
                  <Text style={styles.anchorColHeader}>🧠 Narrative Stories</Text>
                  {stories.map((story, i) => (
                    <View key={i} style={styles.storyBubble}>
                      <Text style={styles.storyBubbleText}>☁️ {story}</Text>
                    </View>
                  ))}
                </Animated.View>

                {/* Facts remaining anchored */}
                <View style={styles.anchorRealityColumn}>
                  <Text style={styles.anchorColHeader}>📷 Grounded Facts</Text>
                  {facts.map((fact, i) => (
                    <View key={i} style={styles.factBubble}>
                      <Text style={styles.factBubbleText}>✅ {fact}</Text>
                    </View>
                  ))}
                </View>

              </View>

              {/* Separation text */}
              <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.adviceBanner}>
                <Text style={styles.adviceBannerHeader}>Separating Facts vs Stories</Text>
                <Text style={styles.adviceBannerBody}>
                  Facts give clarity. Stories create possibilities—not certainty.
                </Text>
              </Animated.View>
            </ScrollView>

            <View style={styles.actionBlock}>
              {storyFloatOpacity.value === 1 ? (
                <GradBtn label="Let Stories Go" onPress={triggerAnchorFloat} colors={['#A78BFA', '#7C3AED']} />
              ) : (
                <GradBtn label="Finish" onPress={() => triggerShutterTransition('success')} colors={[C.blue, '#0284C7']} />
              )}
            </View>

          </View>
        </SafeAreaView>
        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 9 — FINAL SUCCESS SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SurrealBackground />

      {/* Radiant rotating starburst background */}
      <Animated.View style={[styles.successRadiantOverlay, animatedSuccessRadiantStyle]}>
        <LinearGradient 
          colors={['rgba(251, 191, 36, 0.22)', 'rgba(167, 139, 250, 0.18)', 'transparent']} 
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Extra floating celebration particles */}
      {[
        { x: 40, y: height - 120, size: 8, color: '#FBBF24', delay: 100, drift: 35 },
        { x: width - 80, y: height - 180, size: 6, color: '#F59E0B', delay: 300, drift: -25 },
        { x: 120, y: height - 260, size: 5, color: '#FFF', delay: 600, drift: 20 },
        { x: width - 130, y: height - 90, size: 7, color: '#FBBF24', delay: 900, drift: -40 },
        { x: 60, y: height - 320, size: 6, color: '#38BDF8', delay: 1200, drift: 30 }
      ].map((p, i) => <Particle key={`succ-${i}`} {...p} />)}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.responsiveContainer}>
          
          <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
            
            {/* Animated Trophy badge */}
            <Animated.View 
              entering={FadeInDown.delay(100).duration(800).springify()} 
              style={[styles.successTrophyContainer, animatedTrophyStyle]}
            >
              <LinearGradient 
                colors={['rgba(251, 191, 36, 0.25)', 'rgba(245, 158, 11, 0.05)']} 
                style={styles.trophyGlowRing} 
              />
              <MaterialCommunityIcons name="trophy-award" size={88} color="#FBBF24" />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.completeHeader}>
              <Text style={styles.completeTitle}>🎉 Task Completed!</Text>
              <Text style={styles.completeSubtitle}>
                You successfully separated facts from assumptions and chose clarity over overthinking.
              </Text>
            </Animated.View>

            {/* Animated Reward Card showing points counting up smoothly */}
            <Animated.View entering={FadeInDown.delay(450).duration(800)} style={styles.pointsCard}>
              <View style={styles.pointsRow}>
                <MaterialCommunityIcons name="star-circle" size={36} color="#FBBF24" style={{ marginRight: 10 }} />
                <Text style={styles.pointsText}>+{pointsDisplay} Mind Points</Text>
              </View>
            </Animated.View>

            {/* Achievement motivational quote */}
            <Animated.View entering={FadeInDown.delay(650).duration(800)} style={styles.quoteBanner}>
              <Text style={styles.quoteBannerText}>
                "Every time you choose facts over stories, your mind becomes stronger."
              </Text>
            </Animated.View>

          </ScrollView>

          <View style={styles.actionBlock}>
            <GradBtn label="Return to Home" onPress={handleReturnHome} colors={['#FBBF24', '#F59E0B']} />
          </View>

        </View>
      </SafeAreaView>
      {/* Shutter panel slide overlays */}
      <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
      <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
    </View>
  );
}

// ── SVG Reanimated Binding ───────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Stylesheets ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg
  },
  safeArea: {
    flex: 1
  },
  keyboardContainer: {
    flex: 1
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  welcomeHeroContainer: {
    marginTop: height * 0.04,
    height: height * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  heroGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.8,
    zIndex: -1,
    shadowColor: '#A78BFA',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 }
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  welcomeIntro: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: C.textLight,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 4
  },
  writeHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  writeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28
  },
  writeSubtitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 20
  },
  
  // NEW intro screen styles
  introSummaryText: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginTop: 4
  },
  introGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16
  },
  introStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  introIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
    marginTop: 2
  },
  introStepContent: {
    flex: 1
  },
  introStepTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  introStepDesc: {
    color: C.textLight,
    fontSize: 12,
    lineHeight: 17
  },
  introFooterCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16
  },
  introFooterText: {
    color: C.textMid,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  timeEstimateContainer: {
    alignItems: 'center',
    marginBottom: 12
  },
  timeEstimateText: {
    color: C.lavender,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5
  },

  // Redesigned Screen 3 Premium Orb Input Styles
  premiumThoughtContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    width: '100%',
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  memoryOrb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    bottom: -35,
    right: -35,
    zIndex: -1,
    shadowRadius: 20,
    shadowOpacity: 0.35
  },
  worryCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.purple,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10
  },
  worryInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFF',
    minHeight: 110,
    paddingTop: 8,
    textAlignVertical: 'top',
    zIndex: 2
  },
  worryCharCount: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '600'
  },
  suggestionWrapper: {
    marginTop: 14,
    alignItems: 'center',
    width: '100%',
  },
  exampleSuggestionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '96%'
  },
  exampleLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600'
  },
  exampleSuggestionText: {
    color: C.textMid,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic'
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },

  // Camera screen styles
  cameraBoxContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    padding: 20,
    position: 'relative',
    marginBottom: 16
  },
  cameraReticle: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    pointerEvents: 'none'
  },
  reticleCorner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: C.blue,
  },
  reticleTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2
  },
  reticleTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2
  },
  reticleBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2
  },
  reticleBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2
  },
  factsList: {
    width: '100%',
    zIndex: 2
  },
  listPlaceholder: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)'
  },
  factText: {
    color: C.textMid,
    fontSize: 14,
    flex: 1
  },
  listBuilderForm: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
    marginBottom: 10
  },
  builderInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBrd,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 14,
    marginRight: 10
  },
  builderAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3
  },

  // Brain screen styles
  brainBoxContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(167, 139, 250, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    padding: 20,
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center'
  },
  brainPulseWrapper: {
    position: 'absolute',
    top: 14,
    right: 18,
    opacity: 0.8
  },
  brainGlowBacking: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    alignSelf: 'center',
    top: -12,
    zIndex: -1,
    shadowColor: C.purple,
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    width: '100%'
  },
  storyText: {
    color: C.textMid,
    fontSize: 14,
    flex: 1
  },

  // Shutter panels styles
  shutterHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#0A0813',
    height: height / 2,
    zIndex: 999,
  },
  shutterTop: {
    top: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#241B3E'
  },
  shutterBottom: {
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#241B3E'
  },

  // Compare screen styles
  compareContainer: {
    width: '100%',
    flexDirection: Platform.OS === 'web' && width > 500 ? 'row' : 'column',
    justifyContent: 'space-between',
    marginTop: 10
  },
  compareCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16
  },
  compareRealityCard: {
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginRight: Platform.OS === 'web' && width > 500 ? 10 : 0,
    shadowColor: C.blue,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12
  },
  compareStoryCard: {
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginLeft: Platform.OS === 'web' && width > 500 ? 10 : 0,
    shadowColor: C.purple,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  compareCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  dividerBlue: {
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    width: '100%',
    marginBottom: 12
  },
  dividerPurple: {
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    width: '100%',
    marginBottom: 12
  },
  compareTextLine: {
    color: C.textMid,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },

  // Svg circular container
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative'
  },
  svgCenterLabel: {
    position: 'absolute',
    alignItems: 'center'
  },
  svgCenterNum: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900'
  },
  svgCenterTxt: {
    color: C.textLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 5
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  metricVal: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900'
  },
  focusContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  focusCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 5
  },
  focusRealityCard: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  focusStoryCard: {
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  focusTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  focusBody: {
    color: C.textLight,
    fontSize: 13,
    lineHeight: 18
  },
  textBlurred: {
    textShadowColor: 'rgba(167, 139, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    color: 'transparent',
    opacity: 0.4
  },
  insightBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 16,
    width: '100%',
    marginBottom: 10
  },
  insightText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  // Screen 7 Anchor styles
  anchorWrapper: {
    width: '100%',
    height: 320,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 16
  },
  anchorColHeader: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center'
  },
  anchorStoryColumn: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16
  },
  anchorRealityColumn: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16
  },
  storyBubble: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginBottom: 6,
    maxWidth: '85%'
  },
  storyBubbleText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: '500'
  },
  factBubble: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 6,
    maxWidth: '85%'
  },
  factBubbleText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '600'
  },
  adviceBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  adviceBannerHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: C.lavender || '#C4B5FD',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4
  },
  adviceBannerBody: {
    color: C.textMid,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  // Final Success styles
  successRadiantOverlay: {
    position: 'absolute',
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    top: height * 0.15,
    left: -width * 0.3,
    zIndex: 0
  },
  completeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: height * 0.05
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16
  },
  badgeSuccessText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10
  },
  completeSubtitle: {
    color: C.textLight,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  statsSummaryBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.glassBrd,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  summaryLabel: {
    color: C.textMid,
    fontSize: 14,
    fontWeight: '700'
  },
  summaryVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    marginVertical: 10
  },
  quoteBanner: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 20,
    width: '100%'
  },
  quoteBannerText: {
    color: C.purple,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24
  },
  successTrophyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative'
  },
  trophyGlowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    zIndex: -1,
    shadowColor: '#FBBF24',
    shadowOpacity: 0.6,
    shadowRadius: 20
  },
  pointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pointsText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5
  },

  // Button generic styles
  gradBtnWrap: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowColor: C.blue,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6
  },
  gradBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gradBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
