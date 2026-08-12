import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

const VIDEO_PATH = require('../assets/videos/Create_a_second_seamless_lo.mp4');

const COLORS = {
  bgWarm: '#FFF9F2',
  bgMint: '#F2FFF7',
  bgSky: '#EAF8FF',
  primary: '#63E6BE', // Mint
  accent: '#7DD3FC',  // Sky Blue
  secondary: '#B8F2E6',
  text: '#16342F', // Dark Teal
  whiteGlass: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

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

const FloatingItem = ({ width, height, index }: { width: number; height: number; index: number }) => {
  const posX = useSharedValue(Math.random() * width);
  const posY = useSharedValue(height + Math.random() * 80);
  const rot = useSharedValue(0);
  const scale = Math.random() * 0.4 + 0.35;
  const opacity = Math.random() * 0.25 + 0.15;
  const isLeaf = index % 3 === 0;
  const isFeather = index % 3 === 1;

  useEffect(() => {
    const duration = 15000 + Math.random() * 10000;
    const delay = Math.random() * 6000;

    posY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(height + 40, { duration: 0 }),
          withTiming(-50, { duration, easing: Easing.linear })
        ),
        -1,
        false
      )
    );

    posX.value = withRepeat(
      withSequence(
        withTiming(posX.value + (Math.random() * 50 - 25), {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(posX.value - (Math.random() * 50 - 25), {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    rot.value = withRepeat(
      withTiming(360, { duration: 8000 + Math.random() * 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
      { scale },
      { rotate: `${rot.value}deg` },
    ],
    opacity,
  }));

  return (
    <Animated.View style={[styles.floatingElement, style]}>
      {isLeaf ? (
        <MaterialCommunityIcons name="leaf" size={24} color={COLORS.primary} />
      ) : isFeather ? (
        <Feather name="feather" size={24} color={COLORS.accent} />
      ) : (
        <Feather name="wind" size={22} color={COLORS.primary} />
      )}
    </Animated.View>
  );
};

// Ambient Floating Feathers and Leaves in the background
const AmbientFloatingElements = ({ width, height }: { width: number; height: number }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingItem key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
};

export default function ReleaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Desktop width boundaries
  const isDesktop = width > 768;
  const containerWidth = isDesktop ? 650 : width;

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // Step 4 represents completion

  // Selected elements to release on Screen 1
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({
    breath: false,
    thoughts: false,
    tension: false,
    weight: false,
  });

  // Animate rising items inside Screen 1
  const riseBreathY = useSharedValue(0);
  const riseBreathScale = useSharedValue(0);
  const riseBreathOpacity = useSharedValue(0);

  const riseThoughtsY = useSharedValue(0);
  const riseThoughtsScale = useSharedValue(0);
  const riseThoughtsOpacity = useSharedValue(0);

  const riseTensionY = useSharedValue(0);
  const riseTensionScale = useSharedValue(0);
  const riseTensionOpacity = useSharedValue(0);

  const riseWeightY = useSharedValue(0);
  const riseWeightScale = useSharedValue(0);
  const riseWeightOpacity = useSharedValue(0);

  // Screen 2 Orbit merging statuses
  const [mergedItems, setMergedItems] = useState<Record<string, boolean>>({
    breath: false,
    thoughts: false,
    tension: false,
    weight: false,
  });

  // Orbit elements shared coordinate offsets
  const orbitBreathX = useSharedValue(-60);
  const orbitBreathY = useSharedValue(-60);
  const orbitThoughtsX = useSharedValue(60);
  const orbitThoughtsY = useSharedValue(-60);
  const orbitTensionX = useSharedValue(-60);
  const orbitTensionY = useSharedValue(60);
  const orbitWeightX = useSharedValue(60);
  const orbitWeightY = useSharedValue(60);

  // Orbit elements scales
  const scaleBreath = useSharedValue(1);
  const scaleThoughts = useSharedValue(1);
  const scaleTension = useSharedValue(1);
  const scaleWeight = useSharedValue(1);

  // Screen 3 state choice and silhouette values
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const silhouetteY = useSharedValue(0);
  const particlesDissolveY = useSharedValue(0);
  const particlesDissolveScale = useSharedValue(1);
  const whiteBloomOpacity = useSharedValue(0);
  const titleConfettiY = useSharedValue(height);

  // Centerpieces animations
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1.0);
  const sphereGlow = useSharedValue(0.4);
  const orbScaleMultiplier = useSharedValue(1.0);

  // BG Video Player
  const videoPlayer = useVideoPlayer(VIDEO_PATH, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Points metadata
  const [pointsEarned, setPointsEarned] = useState(300);
  const [totalPoints, setTotalPoints] = useState(0);

  // Central Orb breathing animations loops
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sphereGlow.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Orbit elements slow drift
    const driftOrbit = (shX: any, shY: any, origX: number, origY: number, delay: number) => {
      shX.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(origX + 12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            withTiming(origX - 12, { duration: 4000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
      shY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(origY - 12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
            withTiming(origY + 12, { duration: 4000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    };

    driftOrbit(orbitBreathX, orbitBreathY, -60, -60, 0);
    driftOrbit(orbitThoughtsX, orbitThoughtsY, 60, -60, 800);
    driftOrbit(orbitTensionX, orbitTensionY, -60, 60, 1600);
    driftOrbit(orbitWeightX, orbitWeightY, 60, 60, 2400);

    // Silhouette levitation loop
    silhouetteY.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Restore task progress if exits early
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/tasks/release/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success && data.progress) {
          const progress = data.progress;
          if (progress.selectedItems) setSelectedItems(progress.selectedItems);
          if (progress.selectedFeeling) setSelectedFeeling(progress.selectedFeeling);
          if (progress.step && progress.step < 4) setCurrentStep(progress.step);
        }
      } catch (err) {
        console.warn('Error loading progress:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Save progress dynamically
  const saveProgress = async (nextStep: number, currentSelections = selectedItems, currentFeel = selectedFeeling) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      await apiFetch('/api/tasks/release/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: nextStep >= 4,
          progressPayload: {
            step: nextStep,
            selectedItems: currentSelections,
            selectedFeeling: currentFeel,
          }
        })
      });
    } catch (err) {
      console.warn('Error saving progress:', err);
    }
  };

  // Screen 1: select combination cards
  const handleSelectCard = (key: string) => {
    const nextState = !selectedItems[key];
    const newSelections = { ...selectedItems, [key]: nextState };
    setSelectedItems(newSelections);
    triggerHaptic('light');

    // Rising items floating up to centerpiece sphere animation
    if (nextState) {
      let activeY, activeScale, activeOpacity;
      if (key === 'breath') { activeY = riseBreathY; activeScale = riseBreathScale; activeOpacity = riseBreathOpacity; }
      else if (key === 'thoughts') { activeY = riseThoughtsY; activeScale = riseThoughtsScale; activeOpacity = riseThoughtsOpacity; }
      else if (key === 'tension') { activeY = riseTensionY; activeScale = riseTensionScale; activeOpacity = riseTensionOpacity; }
      else { activeY = riseWeightY; activeScale = riseWeightScale; activeOpacity = riseWeightOpacity; }

      activeY.value = 180;
      activeScale.value = 1.0;
      activeOpacity.value = 1.0;

      activeY.value = withTiming(-80, { duration: 1800, easing: Easing.out(Easing.quad) });
      activeScale.value = withDelay(1200, withTiming(0.2, { duration: 600 }));
      activeOpacity.value = withDelay(1200, withTiming(0, { duration: 600 }));
    }

    saveProgress(currentStep, newSelections);
  };

  // Screen 2: tap elements to merge into the central orb
  const handleMergeItem = (key: string) => {
    if (mergedItems[key]) return;
    triggerHaptic('medium');

    let activeX, activeY, activeScale;
    if (key === 'breath') { activeX = orbitBreathX; activeY = orbitBreathY; activeScale = scaleBreath; }
    else if (key === 'thoughts') { activeX = orbitThoughtsX; activeY = orbitThoughtsY; activeScale = scaleThoughts; }
    else if (key === 'tension') { activeX = orbitTensionX; activeY = orbitTensionY; activeScale = scaleTension; }
    else { activeX = orbitWeightX; activeY = orbitWeightY; activeScale = scaleWeight; }

    // Disable orbiting and pull item inside the center
    activeX.value = withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) });
    activeY.value = withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) });
    activeScale.value = withTiming(0, { duration: 800 });

    setTimeout(() => {
      triggerHaptic('success');
      setMergedItems(prev => {
        const next = { ...prev, [key]: true };
        // Increase orb size and brightness
        orbScaleMultiplier.value = withSequence(
          withTiming(1.3, { duration: 150 }),
          withTiming(1.0, { duration: 250 })
        );
        return next;
      });
    }, 800);
  };

  // Screen 2 items orbiting checks
  const screen2SelectedList = useMemo(() => {
    return Object.keys(selectedItems).filter(k => selectedItems[k]);
  }, [selectedItems]);

  const allMerged = useMemo(() => {
    if (screen2SelectedList.length === 0) return false;
    return screen2SelectedList.every(k => mergedItems[k]);
  }, [screen2SelectedList, mergedItems]);

  // Navigate Screen Step redirects
  const handleContinueStep1 = () => {
    triggerHaptic('light');
    setCurrentStep(2);
    saveProgress(2);
  };

  const handleContinueStep2 = () => {
    triggerHaptic('light');
    setCurrentStep(3);
    saveProgress(3);
  };

  // Screen 3: complete and trigger dissolve bloom animations
  const handleCompleteSession = () => {
    if (!selectedFeeling) {
      triggerHaptic('medium');
      Alert.alert("Please choose how you're feeling.");
      return;
    }

    triggerHaptic('success');

    // Float silhouette upward and dissolve
    particlesDissolveY.value = withTiming(-350, { duration: 2200, easing: Easing.out(Easing.cubic) });
    particlesDissolveScale.value = withTiming(0.1, { duration: 2200 });

    // Fade white bloom overlay in
    whiteBloomOpacity.value = withTiming(1.0, { duration: 2500 });
    
    // Confetti particles rising
    titleConfettiY.value = withTiming(-100, { duration: 3000, easing: Easing.out(Easing.cubic) });

    // Delay redirect to completion API
    setTimeout(() => {
      executeCompleteAPI();
    }, 2800);
  };

  const executeCompleteAPI = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskName: 'Release',
          task_name: 'Release',
          taskTitle: 'Release'
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        setPointsEarned(data.pointsAdded || 300);
        setTotalPoints(data.totalPoints || 0);

        router.replace({
          pathname: '/task-success',
          params: {
            type: 'breathing',
            points: (data.pointsAdded || 300).toString(),
            totalPoints: (data.totalPoints || 0).toString(),
            streak: (data.streak || 0).toString(),
          }
        } as any);
      }
    } catch (err) {
      console.warn('Error completing release task:', err);
      // Fallback navigation so user doesn't get stuck
      router.replace({
        pathname: '/task-success',
        params: {
          type: 'breathing',
          points: '300',
          totalPoints: '300',
          streak: '0',
        }
      } as any);
    }
  };

  // Reanimated style declarations
  const breathingSphereStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: pulseScale.value },
    ],
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowRadius: sphereGlow.value * 25 + 5,
    shadowOpacity: sphereGlow.value + 0.15,
  }));

  const step2OrbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: pulseScale.value * orbScaleMultiplier.value },
    ],
    shadowRadius: allMerged ? 45 : sphereGlow.value * 30 + 10,
    shadowOpacity: allMerged ? 0.9 : sphereGlow.value + 0.2,
    backgroundColor: allMerged ? 'rgba(255,255,255,0.95)' : 'rgba(99, 230, 190, 0.25)',
  }));

  // Float rising item styles for Screen 1
  const riseBreathStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: riseBreathY.value },
      { scale: riseBreathScale.value }
    ],
    opacity: riseBreathOpacity.value,
  }));

  const riseThoughtsStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: riseThoughtsY.value },
      { scale: riseThoughtsScale.value }
    ],
    opacity: riseThoughtsOpacity.value,
  }));

  const riseTensionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: riseTensionY.value },
      { scale: riseTensionScale.value }
    ],
    opacity: riseTensionOpacity.value,
  }));

  const riseWeightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: riseWeightY.value },
      { scale: riseWeightScale.value }
    ],
    opacity: riseWeightOpacity.value,
  }));

  // Screen 2 Orbit elements style sheets
  const orbitBreathStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbitBreathX.value },
      { translateY: orbitBreathY.value },
      { scale: scaleBreath.value },
    ],
  }));

  const orbitThoughtsStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbitThoughtsX.value },
      { translateY: orbitThoughtsY.value },
      { scale: scaleThoughts.value },
    ],
  }));

  const orbitTensionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbitTensionX.value },
      { translateY: orbitTensionY.value },
      { scale: scaleTension.value },
    ],
  }));

  const orbitWeightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbitWeightX.value },
      { translateY: orbitWeightY.value },
      { scale: scaleWeight.value },
    ],
  }));

  // Screen 3 Particle human silhouette styles
  const silhouetteSilhouetteStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: silhouetteY.value + particlesDissolveY.value },
      { scale: particlesDissolveScale.value },
    ],
    opacity: particlesDissolveScale.value,
  }));

  // Bloom Overlay Style
  const bloomOverlayStyle = useAnimatedStyle(() => ({
    opacity: whiteBloomOpacity.value,
  }));

  const screen3ConfettiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleConfettiY.value }],
  }));

  const screen1CanContinue = useMemo(() => {
    return Object.values(selectedItems).some(v => v);
  }, [selectedItems]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Release...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background Gradients & Video mappings */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[COLORS.bgWarm, COLORS.bgMint, COLORS.bgSky]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <VideoView
            player={videoPlayer}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        </View>

        {/* Ambient floating particles */}
        <AmbientFloatingElements width={width} height={height} />
      </View>

      {/* Desktop wrapper boundaries */}
      <View style={[styles.viewportWrapper, { width: containerWidth }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

          {/* HEADER */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glassHeaderBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={18} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Release</Text>

            <TouchableOpacity style={styles.glassHeaderBtn} activeOpacity={0.7}>
              <Feather name="more-horizontal" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              {/* SUBTITLE */}
              <View style={styles.subtitleWrapper}>
                <Text style={styles.subtitleText}>
                  Notice what you're holding onto.{"\n"}Let it become lighter.
                </Text>
              </View>

              {/* CENTERPIECE: Glowing breathing transparent sphere */}
              <View style={styles.centerSection}>
                <Animated.View style={[styles.giantBreatheSphere, breathingSphereStyle]}>
                  {/* Floating elements inside sphere */}
                  <View style={[styles.sphereElementPosition, { top: '25%', left: '28%' }]}>
                    <MaterialCommunityIcons name="feather" size={24} color="#FFF" style={styles.featherGlow} />
                  </View>
                  <View style={[styles.sphereElementPosition, { bottom: '26%', right: '28%' }]}>
                    <MaterialCommunityIcons name="diamond-stone" size={24} color={COLORS.accent} style={styles.crystalGlow} />
                  </View>
                  <View style={[styles.sphereElementPosition, { bottom: '45%', left: '42%' }]}>
                    <Ionicons name="sparkles-outline" size={16} color="#FFF" style={{ opacity: 0.8 }} />
                  </View>

                  {/* Rising active elements overlay animation */}
                  <Animated.View style={[styles.sphereRiseBubble, riseBreathStyle]}>
                    <BlurView intensity={35} tint="light" style={styles.riseBubbleContent}>
                      <Text style={{ fontSize: 18 }}>🫁</Text>
                    </BlurView>
                  </Animated.View>

                  <Animated.View style={[styles.sphereRiseBubble, riseThoughtsStyle]}>
                    <BlurView intensity={35} tint="light" style={styles.riseBubbleContent}>
                      <Text style={{ fontSize: 18 }}>💭</Text>
                    </BlurView>
                  </Animated.View>

                  <Animated.View style={[styles.sphereRiseBubble, riseTensionStyle]}>
                    <BlurView intensity={35} tint="light" style={styles.riseBubbleContent}>
                      <Text style={{ fontSize: 18 }}>💪</Text>
                    </BlurView>
                  </Animated.View>

                  <Animated.View style={[styles.sphereRiseBubble, riseWeightStyle]}>
                    <BlurView intensity={35} tint="light" style={styles.riseBubbleContent}>
                      <Text style={{ fontSize: 18 }}>❤️</Text>
                    </BlurView>
                  </Animated.View>
                </Animated.View>
              </View>

              {/* INTERACTIVE RELEASE CARDS */}
              <View style={styles.cardsGridSection}>
                <View style={styles.gridRow}>
                  {/* Deep Breath */}
                  <TouchableOpacity
                    onPress={() => handleSelectCard('breath')}
                    activeOpacity={0.8}
                    style={[styles.releaseGlassCard, selectedItems.breath && styles.glassCardActive]}
                  >
                    <BlurView intensity={65} tint="light" style={styles.cardBlurContent}>
                      <Text style={styles.cardEmoji}>🫁</Text>
                      <Text style={styles.cardTitle}>Deep Breath</Text>
                      <View style={styles.checkmarkPosition}>
                        <Ionicons
                          name={selectedItems.breath ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={18}
                          color={selectedItems.breath ? COLORS.primary : 'rgba(22, 52, 47, 0.2)'}
                        />
                      </View>
                    </BlurView>
                  </TouchableOpacity>

                  {/* Heavy Thoughts */}
                  <TouchableOpacity
                    onPress={() => handleSelectCard('thoughts')}
                    activeOpacity={0.8}
                    style={[styles.releaseGlassCard, selectedItems.thoughts && styles.glassCardActive]}
                  >
                    <BlurView intensity={65} tint="light" style={styles.cardBlurContent}>
                      <Text style={styles.cardEmoji}>💭</Text>
                      <Text style={styles.cardTitle}>Heavy Thoughts</Text>
                      <View style={styles.checkmarkPosition}>
                        <Ionicons
                          name={selectedItems.thoughts ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={18}
                          color={selectedItems.thoughts ? COLORS.primary : 'rgba(22, 52, 47, 0.2)'}
                        />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </View>

                <View style={styles.gridRow}>
                  {/* Muscle Tension */}
                  <TouchableOpacity
                    onPress={() => handleSelectCard('tension')}
                    activeOpacity={0.8}
                    style={[styles.releaseGlassCard, selectedItems.tension && styles.glassCardActive]}
                  >
                    <BlurView intensity={65} tint="light" style={styles.cardBlurContent}>
                      <Text style={styles.cardEmoji}>💪</Text>
                      <Text style={styles.cardTitle}>Muscle Tension</Text>
                      <View style={styles.checkmarkPosition}>
                        <Ionicons
                          name={selectedItems.tension ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={18}
                          color={selectedItems.tension ? COLORS.primary : 'rgba(22, 52, 47, 0.2)'}
                        />
                      </View>
                    </BlurView>
                  </TouchableOpacity>

                  {/* Emotional Weight */}
                  <TouchableOpacity
                    onPress={() => handleSelectCard('weight')}
                    activeOpacity={0.8}
                    style={[styles.releaseGlassCard, selectedItems.weight && styles.glassCardActive]}
                  >
                    <BlurView intensity={65} tint="light" style={styles.cardBlurContent}>
                      <Text style={styles.cardEmoji}>❤️</Text>
                      <Text style={styles.cardTitle}>Emotional Weight</Text>
                      <View style={styles.checkmarkPosition}>
                        <Ionicons
                          name={selectedItems.weight ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={18}
                          color={selectedItems.weight ? COLORS.primary : 'rgba(22, 52, 47, 0.2)'}
                        />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                </View>
              </View>

              {/* FOOTER ACTION BUTTON */}
              <View style={[styles.bottomBtnWrapper, !screen1CanContinue && { opacity: 0.55 }]}>
                <TouchableOpacity
                  onPress={handleContinueStep1}
                  disabled={!screen1CanContinue}
                  activeOpacity={0.85}
                  style={styles.pillActionBtn}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={styles.actionBtnText}>Continue →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.subtitleWrapper}>
                <Text style={styles.subtitleText}>
                  {allMerged 
                    ? "Everything is released. You feel lighter." 
                    : "Tap each floating stress element to dissolve it into the energy orb."}
                </Text>
              </View>

              {/* LET GO ORB & FLOATING ISLAND CENTERPIECE */}
              <View style={styles.centerSection}>
                <View style={styles.islandSceneContainer}>
                  {/* Floating island base */}
                  <View style={styles.islandBaseOfLight} />

                  {/* Glowing Energy Orb */}
                  <Animated.View style={[styles.letGoEnergyOrb, step2OrbStyle]}>
                    <View style={styles.orbInnerCore} />
                  </Animated.View>

                  {/* Selected items orbiting orb */}
                  {selectedItems.breath && !mergedItems.breath && (
                    <Animated.View style={[styles.orbitingStressItem, orbitBreathStyle]}>
                      <TouchableOpacity onPress={() => handleMergeItem('breath')} activeOpacity={0.8} style={styles.stressBubbleTouch}>
                        <BlurView intensity={50} tint="light" style={[styles.stressBubble, { borderColor: COLORS.accent }]}>
                          <Text style={{ fontSize: 18 }}>🫁</Text>
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {selectedItems.thoughts && !mergedItems.thoughts && (
                    <Animated.View style={[styles.orbitingStressItem, orbitThoughtsStyle]}>
                      <TouchableOpacity onPress={() => handleMergeItem('thoughts')} activeOpacity={0.8} style={styles.stressBubbleTouch}>
                        <BlurView intensity={50} tint="light" style={[styles.stressBubble, { borderColor: COLORS.primary }]}>
                          <Text style={{ fontSize: 18 }}>💭</Text>
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {selectedItems.tension && !mergedItems.tension && (
                    <Animated.View style={[styles.orbitingStressItem, orbitTensionStyle]}>
                      <TouchableOpacity onPress={() => handleMergeItem('tension')} activeOpacity={0.8} style={styles.stressBubbleTouch}>
                        <BlurView intensity={50} tint="light" style={[styles.stressBubble, { borderColor: COLORS.accent }]}>
                          <Text style={{ fontSize: 18 }}>💪</Text>
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {selectedItems.weight && !mergedItems.weight && (
                    <Animated.View style={[styles.orbitingStressItem, orbitWeightStyle]}>
                      <TouchableOpacity onPress={() => handleMergeItem('weight')} activeOpacity={0.8} style={styles.stressBubbleTouch}>
                        <BlurView intensity={50} tint="light" style={[styles.stressBubble, { borderColor: COLORS.primary }]}>
                          <Text style={{ fontSize: 18 }}>❤️</Text>
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>

                {allMerged && (
                  <View style={styles.releasedStatusBox}>
                    <Text style={styles.releasedStatusText}>You've Let Go.</Text>
                  </View>
                )}
              </View>

              {/* FOOTER ACTION BUTTON */}
              <View style={[styles.bottomBtnWrapper, !allMerged && { opacity: 0.55 }]}>
                <TouchableOpacity
                  onPress={handleContinueStep2}
                  disabled={!allMerged}
                  activeOpacity={0.85}
                  style={styles.pillActionBtn}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={styles.actionBtnText}>I Feel Free →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.subtitleWrapper}>
                <Text style={styles.subtitleText}>
                  Your body and mind are completely light.
                </Text>
              </View>

              {/* HUMAN SILHOUETTE MADE OF PARTICLES */}
              <View style={styles.centerSection}>
                <Animated.View style={[styles.silhouetteWrapper, silhouetteSilhouetteStyle]}>
                  {/* Glowing Silhouette Outline */}
                  <Ionicons name="body-outline" size={140} color="rgba(99, 230, 190, 0.45)" style={styles.silhouetteGlow} />

                  {/* Sparkle particle overlays */}
                  <View style={[styles.silhSparkle, { top: '15%', left: '46%' }]}>
                    <Ionicons name="sparkles-outline" size={12} color={COLORS.primary} />
                  </View>
                  <View style={[styles.silhSparkle, { top: '35%', left: '30%' }]}>
                    <Ionicons name="sparkles-outline" size={12} color="#FFF" />
                  </View>
                  <View style={[styles.silhSparkle, { top: '40%', right: '30%' }]}>
                    <Ionicons name="sparkles-outline" size={12} color={COLORS.accent} />
                  </View>
                  <View style={[styles.silhSparkle, { bottom: '25%', left: '46%' }]}>
                    <Ionicons name="sparkles-outline" size={12} color="#FFF" />
                  </View>
                </Animated.View>
              </View>

              {/* HOW DO YOU FEEL NOW CARDS */}
              <View style={styles.feelingSelectorWrapper}>
                <Text style={styles.feelingSelectorTitle}>How do you feel now?</Text>

                <View style={styles.feelingGrid}>
                  {[
                    { label: 'Completely Light', emoji: '☁' },
                    { label: 'Calm', emoji: '😊' },
                    { label: 'Relaxed', emoji: '🌿' },
                    { label: 'Refreshed', emoji: '✨' },
                  ].map((item) => {
                    const isSelected = selectedFeeling === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedFeeling(item.label);
                        }}
                        activeOpacity={0.85}
                        style={[
                          styles.feelingGlassCard,
                          isSelected && styles.feelingGlassCardActive
                        ]}
                      >
                        <BlurView intensity={65} tint="light" style={styles.feelingCardBlur}>
                          <Text style={styles.feelingEmoji}>{item.emoji}</Text>
                          <Text style={styles.feelingText}>{item.label}</Text>
                        </BlurView>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* COMPLETE SESSION BUTTON */}
              <View style={[styles.bottomBtnWrapper, !selectedFeeling && { opacity: 0.55 }]}>
                <TouchableOpacity
                  onPress={handleCompleteSession}
                  disabled={!selectedFeeling}
                  activeOpacity={0.85}
                  style={styles.pillActionBtn}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={styles.actionBtnText}>Complete Session</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SCREEN 4: WHITE LIGHT BLOOM TRANSITION OVERLAY */}
          {whiteBloomOpacity.value > 0.05 && (
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.bloomOverlay, bloomOverlayStyle]} pointerEvents="none">
              <Animated.View style={[styles.titleConfettiContainer, screen3ConfettiStyle]}>
                <MaterialCommunityIcons name="feather" size={48} color={COLORS.primary} style={styles.completeIconGlow} />
                <Text style={styles.bloomTitleText}>Release Complete</Text>
                <Text style={styles.bloomSubtitleText}>
                  "You created space for calm.{"\n"}Carry this feeling with you."
                </Text>
              </Animated.View>
            </Animated.View>
          )}

        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
  viewportWrapper: {
    flex: 1,
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  glassHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  subtitleWrapper: {
    marginVertical: 14,
    width: '100%',
  },
  subtitleText: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    opacity: 0.85,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  // Sphere Centerpiece Screen 1
  giantBreatheSphere: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  sphereElementPosition: {
    position: 'absolute',
  },
  featherGlow: {
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  crystalGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  sphereRiseBubble: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  riseBubbleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  // Interactive Release Cards Screen 1
  cardsGridSection: {
    width: '100%',
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  releaseGlassCard: {
    width: '48.5%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassCardActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 0.97 }],
  },
  cardBlurContent: {
    padding: 16,
    backgroundColor: COLORS.whiteGlass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 20,
  },
  cardEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  checkmarkPosition: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  // Island Scene Screen 2
  islandSceneContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  islandBaseOfLight: {
    position: 'absolute',
    bottom: 20,
    width: 140,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 230, 190, 0.18)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  letGoEnergyOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(99, 230, 190, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
  },
  orbInnerCore: {
    width: '45%',
    height: '45%',
    borderRadius: 99,
    backgroundColor: '#FFF',
  },
  orbitingStressItem: {
    position: 'absolute',
  },
  stressBubbleTouch: {
    padding: 8,
  },
  stressBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  releasedStatusBox: {
    position: 'absolute',
    bottom: -15,
  },
  releasedStatusText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // Particle Silhouette Screen 3
  silhouetteWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  silhouetteGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  silhSparkle: {
    position: 'absolute',
  },
  // Feeling selector cards Screen 3
  feelingSelectorWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  feelingSelectorTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  feelingGlassCard: {
    width: '48.5%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  feelingGlassCardActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    transform: [{ scale: 0.97 }],
  },
  feelingCardBlur: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteGlass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
  },
  feelingEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  feelingText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  // Footer pill button
  bottomBtnWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  pillActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Bloom Transition Overlay
  bloomOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleConfettiContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  completeIconGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    marginBottom: 16,
  },
  bloomTitleText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  bloomSubtitleText: {
    color: COLORS.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    fontWeight: '600',
    opacity: 0.85,
  },
  floatingElement: {
    position: 'absolute',
  },
});
