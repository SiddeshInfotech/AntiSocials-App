import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Morning Sun Particles
const SUN_PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * width - width * 0.5,
  y: Math.random() * height * 0.6 - height * 0.3,
  size: 4 + Math.random() * 6,
  delay: i * 180,
}));

export default function Stage2FinalTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Display Text
  const [displayText, setDisplayText] = useState('Take one last look behind you.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Doorway & Lighting Animations
  const doorOpenAnim = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = fully open
  const doorGapLightAnim = useRef(new Animated.Value(0)).current;
  const roomFadeAnim = useRef(new Animated.Value(0)).current; // 0 = indoor room, 1 = room faded out
  const cameraZoomAnim = useRef(new Animated.Value(1)).current; // Zooming through doorway
  const morningSunlightAnim = useRef(new Animated.Value(0.2)).current;
  const openSpaceFadeAnim = useRef(new Animated.Value(0)).current; // Open space at 5:00

  // Final Cinematic
  const doorDissolveAnim = useRef(new Animated.Value(1)).current;
  const stageBannerScale = useRef(new Animated.Value(0)).current;
  const stageBannerOpacity = useRef(new Animated.Value(0)).current;

  // Ambient Morning Sunlight Breathing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(morningSunlightAnim, {
          toValue: 0.65,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(morningSunlightAnim, {
          toValue: 0.3,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00 / 300s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Closed doorway ahead
      setDisplayText('Take one last look behind you.');
      setSubDisplayText(null);
    } else if (elapsedTime === 60) {
      // 1:00 - Soft light appears beneath door
      setDisplayText('The person who started this journey...');
      setSubDisplayText(null);

      Animated.timing(doorGapLightAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setSubDisplayText('...is no longer standing here.');
      }, 2500);
    } else if (elapsedTime === 120) {
      // 2:00 - Door slowly begins opening, warm light enters
      setDisplayText('You practiced courage.');
      setSubDisplayText(null);

      Animated.timing(doorOpenAnim, {
        toValue: 0.5,
        duration: 4500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 180) {
      // 3:00 - Room behind slowly fades away, doorway becomes brighter
      setDisplayText('You practiced connection.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(doorOpenAnim, {
          toValue: 0.85,
          duration: 4000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(roomFadeAnim, {
          toValue: 0.6,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 240) {
      // 4:00 - User moves forward toward doorway
      setDisplayText('You practiced authenticity.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(doorOpenAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(cameraZoomAnim, {
          toValue: 1.35,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(roomFadeAnim, {
          toValue: 0.9,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime >= 300) {
      // 5:00 - User steps through doorway into open space with morning light
      setDisplayText('Welcome back.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(openSpaceFadeAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(roomFadeAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setSubDisplayText('You are ready.');
      }, 2500);

      // Trigger Final Cinematic
      setTimeout(() => {
        startFinalCinematic();
      }, 5500);
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Decrement Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, isPaused, timeLeft]);

  // Start Challenge
  const startChallenge = () => {
    saveProgressBackend({ session_started: true });
    setPhase('active');

    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sceneFadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // FINAL CINEMATIC (Doorway Dissolves -> Stage 2 Complete)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(doorDissolveAnim, {
        toValue: 0,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.spring(stageBannerScale, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(stageBannerOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // BACKEND INTEGRATION & COMPLETION
  // ----------------------------------------------------
  const saveProgressBackend = async (dataPayload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/stage2-final/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Final Reflection (Stage 2)',
            ...dataPayload,
          }),
        });
      }
    } catch (e) {
      console.log('saveProgressBackend error:', e);
    }
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    let pointsData = { pointsAdded: '600', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Final Reflection (Stage 2)',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '600',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }

    // MANDATORY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You re-entered the social world.',
        difficulty: 'hard',
        taskName: 'Final Reflection (Stage 2)',
        badge: 'Social Explorer',
      },
    } as any);
  };

  // Developer Fast-Forward Helper
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__ || true) {
      const time = Date.now();
      if (time - lastPress.current < 350) {
        setTimeLeft(5); // Jump to 5s remaining
        Alert.alert('Dev Skip Triggered', 'Skipped to final phase (5s remaining)');
      }
      lastPress.current = time;
    }
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const leftDoorRotate = doorOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-75deg'],
  });

  const rightDoorRotate = doorOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '75deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The Return Gate Warm Sunrise Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Warm White & Soft Gold Gradient */}
        <LinearGradient
          colors={['#1c1917', '#292524', '#44403c', '#1c1917']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Sunrise Beam Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: morningSunlightAnim,
              backgroundColor: 'rgba(254, 240, 138, 0.12)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Room Fade Out to Bright Sunrise Light */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: roomFadeAnim,
              backgroundColor: 'rgba(254, 243, 199, 0.25)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Open Space Light Overlay (at 5:00) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: openSpaceFadeAnim,
              backgroundColor: 'rgba(224, 242, 254, 0.2)',
            },
          ]}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'active' && timeLeft > 0) {
                Alert.alert(
                  'Abort Session?',
                  'Leaving now will reset your finale progress.',
                  [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Abort',
                      style: 'destructive',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#f59e0b" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE RETURN GATE' : 'STAGE 2 FINALE'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ============================================================ */}
        {/* PHASE 1: TASK DETAIL PAGE (Onboarding & Visual Identity)     */}
        {/* ============================================================ */}
        <Animated.View
          style={[styles.detailsWrapper, { opacity: uiFadeAnim }]}
          pointerEvents={phase === 'details' ? 'auto' : 'none'}
        >
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Hero: Architectural Doorway with Sunlight Rays */}
            <View style={styles.heroDoorContainer}>
              <View style={styles.heroDoorFrame}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.4)', 'rgba(41, 37, 36, 0.9)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialCommunityIcons name="door-open" size={48} color="#f59e0b" />
                <Text style={styles.heroDoorLabel}>STAGE 2 GRAND FINALE</Text>
              </View>
            </View>

            {/* Central Glass Panel */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>Final Reflection</Text>
              <Text style={styles.taskSubTitle}>(Stage 2 Completion)</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#f59e0b" />
                  <Text style={styles.badgeText}>5 Minutes</Text>
                </View>
                <View style={[styles.badgePill, styles.badgeHard]}>
                  <Ionicons name="flame" size={13} color="#ef4444" />
                  <Text style={[styles.badgeText, { color: '#ef4444' }]}>
                    ⭐⭐⭐ Hard
                  </Text>
                </View>
                <View style={[styles.badgePill, styles.badgePoints]}>
                  <Ionicons name="trophy" size={13} color="#f59e0b" />
                  <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                    600 Points
                  </Text>
                </View>
              </View>

              {/* Description Text */}
              <Text style={styles.descriptionText}>
                You are no longer the same person who started this journey.{'\n\n'}
                Over the past challenges you learned to face discomfort, stay present, speak honestly, connect with people, and build courage.{'\n\n'}
                Today isn't about doing more. It's about recognizing who you've become.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="sun" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "The goal was never to become fearless. The goal was to stop letting fear decide."
                </Text>
              </View>

              {/* Stage 2 Completion Badge Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>Social Explorer</Text>
                  <Text style={styles.badgeBannerSub}>
                    Complete Stage 2 & automatically unlock Stage 3
                  </Text>
                </View>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startChallenge}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#d97706', '#f59e0b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>ENTER THE RETURN GATE</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN CINEMATIC DOORWAY SCENE & STAGE UNLOCK     */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Return Gate Arena */}
          <View style={styles.doorwayArena}>
            {phase !== 'cinematic' || doorDissolveAnim !== (0 as any) ? (
              <Animated.View
                style={[
                  styles.doorwayArchitecturalFrame,
                  {
                    transform: [{ scale: cameraZoomAnim }],
                    opacity: doorDissolveAnim,
                  },
                ]}
              >
                {/* Morning Sunlight Beam inside Doorway */}
                <LinearGradient
                  colors={['#fef08a', '#f59e0b', '#78350f']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Light Gap beneath door (at 1:00) */}
                <Animated.View
                  style={[
                    styles.doorGapLight,
                    { opacity: doorGapLightAnim },
                  ]}
                />

                {/* Left Door Panel */}
                <Animated.View
                  style={[
                    styles.doorPanelLeft,
                    { transform: [{ rotateY: leftDoorRotate }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#292524', '#1c1917']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.doorHandleLeft} />
                </Animated.View>

                {/* Right Door Panel */}
                <Animated.View
                  style={[
                    styles.doorPanelRight,
                    { transform: [{ rotateY: rightDoorRotate }] },
                  ]}
                >
                  <LinearGradient
                    colors={['#292524', '#1c1917']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.doorHandleRight} />
                </Animated.View>

                {/* Floating Morning Sun Particles */}
                {SUN_PARTICLES.map((p) => (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: 'absolute',
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: '#fef08a',
                      opacity: 0.7,
                      transform: [{ translateX: p.x }, { translateY: p.y }],
                    }}
                  />
                ))}
              </Animated.View>
            ) : null}
          </View>

          {/* Central Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Footer Controls (No Timer Rings or Progress Bars, pure aesthetic digits) */}
          {phase === 'active' && (
            <View style={styles.footerControls}>
              <Pressable onPress={handleDevSkip}>
                <Text style={styles.timerText}>
                  {formatTimerDigits(timeLeft)}
                </Text>
              </Pressable>

              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.abortBtn}
                  onPress={() => {
                    Alert.alert(
                      'Abort Session?',
                      'Are you sure you want to stop? Your progress will be lost.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Abort',
                          style: 'destructive',
                          onPress: () => router.back(),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortBtnText}>ABORT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Final Stage 2 Completion Box (Phase 3) */}
          {phase === 'cinematic' && (
            <Animated.View
              style={[
                styles.achievementBox,
                {
                  transform: [{ scale: stageBannerScale }],
                  opacity: stageBannerOpacity,
                },
              ]}
            >
              <View style={styles.stageHeaderRow}>
                <Text style={styles.stageEmoji}>🏆</Text>
                <View>
                  <Text style={styles.stageUnlockTag}>STAGE 2 COMPLETED</Text>
                  <Text style={styles.stageBadgeTitle}>Social Explorer</Text>
                </View>
              </View>

              <View style={styles.rewardSummaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>+300 Points</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillText}>Badge Unlocked</Text>
                </View>
                <View style={[styles.summaryPill, styles.summaryPillStage]}>
                  <Text style={[styles.summaryPillText, { color: '#10b981' }]}>
                    Stage 3 Unlocked 🎉
                  </Text>
                </View>
              </View>

              <Text style={styles.achievementDescription}>
                "You didn't become someone new. You discovered someone who was already there."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#d97706', '#f59e0b']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'SAVING...' : 'RE-ENTER THE WORLD'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  headerTagText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding Details
  detailsWrapper: {
    flex: 1,
    width: '100%',
  },
  detailsScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDoorContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroDoorFrame: {
    width: 110,
    height: 150,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(41, 37, 36, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroDoorLabel: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(41, 37, 36, 0.92)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  taskSubTitle: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeHard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  descriptionText: {
    color: '#e7e5e4',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    width: '100%',
  },
  badgeBannerEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  badgeBannerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeBannerSub: {
    color: '#f59e0b',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Phase 2 & 3: Main Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  doorwayArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doorwayArchitecturalFrame: {
    width: width * 0.72,
    height: height * 0.44,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#d97706',
    backgroundColor: '#0c0a09',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
  },
  doorGapLight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#fef08a',
    shadowColor: '#fef08a',
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  doorPanelLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: '#44403c',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  doorPanelRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    bottom: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#44403c',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  doorHandleLeft: {
    width: 6,
    height: 36,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  doorHandleRight: {
    width: 6,
    height: 36,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },

  // Display Text
  displayTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  mainDisplayText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subDisplayText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },

  // Footer Controls
  footerControls: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  timerText: {
    color: '#f59e0b',
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pauseBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  abortBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  abortBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Stage Completion Box (Phase 3)
  achievementBox: {
    width: '92%',
    backgroundColor: 'rgba(41, 37, 36, 0.95)',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 10,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stageEmoji: {
    fontSize: 36,
  },
  stageUnlockTag: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stageBadgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  rewardSummaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  summaryPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  summaryPillStage: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  summaryPillText: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '800',
  },
  achievementDescription: {
    color: '#e7e5e4',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
