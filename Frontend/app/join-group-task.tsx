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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 600; // 10 minutes = 600 seconds

const REALISTIC_SETTINGS = [
  { name: 'Coffee Shop Lounge', icon: 'coffee-outline', sub: 'Warm ambient chatter & espresso aroma' },
  { name: 'Campus Park Bench', icon: 'leaf-outline', sub: 'Golden afternoon sunlight & soft breeze' },
  { name: 'Library Discussion Corner', icon: 'book-outline', sub: 'Quiet collaboration & wooden tables' },
  { name: 'Office Break Room', icon: 'cafe-outline', sub: 'Casual laughter & midday tea' },
  { name: 'Community Terrace', icon: 'people-outline', sub: 'Open air seating & casual gathering' },
];

export default function JoinGroupTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selected Setting
  const [setting] = useState(
    () => REALISTIC_SETTINGS[Math.floor(Math.random() * REALISTIC_SETTINGS.length)]
  );

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Not every invitation is spoken.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Chair & Group Atmosphere Animations
  const sunlightGlowAnim = useRef(new Animated.Value(0.2)).current;
  const groupShiftAnim = useRef(new Animated.Value(0)).current; // Group shifting to make space
  const approachChairAnim = useRef(new Animated.Value(1)).current; // Camera zoom/move toward chair
  const chairOccupiedAnim = useRef(new Animated.Value(0)).current; // 0 = empty, 1 = user sitting
  const warmSunlightFill = useRef(new Animated.Value(0)).current; // 10:00 full sunrise fill

  // Final Cinematic
  const finalZoomOutAnim = useRef(new Animated.Value(1)).current;
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Ambient Golden Light Breathing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunlightGlowAnim, {
          toValue: 0.65,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunlightGlowAnim, {
          toValue: 0.25,
          duration: 4500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 10:00 / 600s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Camera enters, empty chair visible
      setDisplayText('Not every invitation is spoken.');
      setSubDisplayText(null);
    } else if (elapsedTime === 120) {
      // 2:00 - Empty chair catches warm sunlight
      setDisplayText('Sometimes your place is already waiting.');
      setSubDisplayText(null);

      Animated.timing(sunlightGlowAnim, {
        toValue: 0.75,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 240) {
      // 4:00 - Group member naturally shifts slightly, making space
      setDisplayText("You don't need permission to belong.");
      setSubDisplayText(null);

      Animated.timing(groupShiftAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 360) {
      // 6:00 - View calmly moves forward toward the empty chair
      setDisplayText('Showing up is enough.');
      setSubDisplayText(null);

      Animated.timing(approachChairAnim, {
        toValue: 1.3,
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 480) {
      // 8:00 - User quietly joins the group
      setDisplayText('You are part of the moment.');
      setSubDisplayText(null);

      Animated.timing(chairOccupiedAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime >= 600) {
      // 10:00 - Empty chair occupied, warm sunlight fills environment
      setDisplayText('You chose connection over avoidance.');
      setSubDisplayText(null);

      Animated.parallel([
        Animated.timing(warmSunlightFill, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(finalZoomOutAnim, {
          toValue: 0.9,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        startFinalCinematic();
      }, 4000);
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
    saveProgressBackend({ session_started: true, setting_name: setting.name });
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
  // FINAL CINEMATIC (Present Together Achievement)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.spring(shieldScaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(shieldOpacityAnim, {
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
        await fetch(`${API_BASE_URL}/api/tasks/join-group/save-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Join a Small Group Activity',
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

    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Join a Small Group Activity',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '300',
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
        message: 'You showed up.',
        difficulty: 'hard',
        taskName: 'Join a Small Group Activity',
        badge: 'Present Together',
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

  const groupShiftX = groupShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The Empty Chair Warm Oak & Golden Light Background */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Natural Oak & Warm Stone Gradient */}
        <LinearGradient
          colors={['#1c1917', '#292524', '#44403c', '#1c1917']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Soft Golden Sunlight Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: sunlightGlowAnim,
              backgroundColor: 'rgba(251, 191, 36, 0.14)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Full Sunrise Sunlight Fill at 10:00 */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: warmSunlightFill,
              backgroundColor: 'rgba(254, 240, 138, 0.22)',
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
                  'Abort Challenge?',
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
              {phase === 'details' ? 'THE EMPTY CHAIR' : setting.name.toUpperCase()}
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
          {/* Top Hero: Elegant Empty Chair with Sunlight Rays */}
          <View style={styles.heroChairContainer}>
            <View style={styles.heroChairFrame}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.35)', 'rgba(41, 37, 36, 0.9)']}
                style={StyleSheet.absoluteFillObject}
              />
              <MaterialCommunityIcons name="chair-rolling" size={48} color="#fbbf24" />
              <Text style={styles.heroChairLabel}>{setting.name}</Text>
            </View>
          </View>

          {/* Central Glass Card */}
          <View style={styles.glassCard}>
            <Text style={styles.taskTitle}>Join a Small Group</Text>
            <Text style={styles.taskSubTitle}>Activity</Text>

            {/* Setting Pill */}
            <View style={styles.settingPill}>
              <Ionicons name={setting.icon as any} size={14} color="#fbbf24" />
              <Text style={styles.settingPillText}>{setting.name}</Text>
            </View>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Feather name="clock" size={13} color="#fbbf24" />
                <Text style={styles.badgeText}>10 Minutes</Text>
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
                  300 Points
                </Text>
              </View>
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              Belonging doesn't begin when you're invited. It begins when you choose to arrive.{'\n\n'}
              Today, comfortably join an existing small group activity—joining friends for a walk, sitting with people in a café, or joining classmates.{'\n'}
              The emphasis is participation, not performance.
            </Text>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Feather name="coffee" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.quoteText}>
                "Belonging doesn't begin when you're invited. It begins when you choose to arrive."
              </Text>
            </View>

            {/* Present Together Achievement Banner */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeBannerTitle}>Present Together</Text>
                <Text style={styles.badgeBannerSub}>
                  Unlock achievement by discovering that belonging begins by showing up
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
                colors={['#b45309', '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>ENTER THE EMPTY CHAIR</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN GROUP SCENE & FINAL CINEMATIC               */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Arena: Group & Empty Chair Environment */}
          <View style={styles.environmentStage}>
            <Animated.View
              style={[
                styles.groupEnvironmentFrame,
                {
                  transform: [
                    { scale: phase === 'cinematic' ? finalZoomOutAnim : approachChairAnim },
                  ],
                },
              ]}
            >
              {/* Natural Oak Wooden Table Surface */}
              <LinearGradient
                colors={['#292524', '#1c1917', '#44403c']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Group Members (Represented by warm ambient glowing avatars) */}
              <View style={styles.groupAvatarsContainer}>
                {/* Member 1 */}
                <View style={styles.avatarNode}>
                  <Ionicons name="person" size={28} color="rgba(253, 224, 71, 0.75)" />
                </View>

                {/* Member 2 (Shifts right at 4:00 to make room) */}
                <Animated.View
                  style={[
                    styles.avatarNode,
                    { transform: [{ translateX: groupShiftX }] },
                  ]}
                >
                  <Ionicons name="person" size={28} color="rgba(96, 165, 250, 0.75)" />
                </Animated.View>

                {/* Member 3 */}
                <View style={styles.avatarNode}>
                  <Ionicons name="person" size={28} color="rgba(52, 211, 153, 0.75)" />
                </View>
              </View>

              {/* THE EMPTY / OCCUPIED CHAIR */}
              <View style={styles.chairTargetArea}>
                <View style={styles.emptyChairRing}>
                  <MaterialCommunityIcons
                    name="chair-rolling"
                    size={42}
                    color="#fbbf24"
                  />
                  {/* Occupied Overlay (Fades in at 8:00) */}
                  <Animated.View
                    style={[
                      styles.userOccupiedNode,
                      { opacity: chairOccupiedAnim },
                    ]}
                  >
                    <Ionicons name="person-circle" size={44} color="#f59e0b" />
                  </Animated.View>
                </View>
                <Text style={styles.chairAreaLabel}>
                  {elapsedTime < 480 ? 'EMPTY CHAIR' : 'YOU ARE HERE'}
                </Text>
              </View>
            </Animated.View>
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
                      'Abort Challenge?',
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

          {/* Final Achievement Banner (Phase 3) */}
          {phase === 'cinematic' && (
            <Animated.View
              style={[
                styles.achievementBox,
                { opacity: shieldOpacityAnim },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>
                    Present Together
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You discovered that belonging often begins by simply showing up."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#b45309', '#f59e0b']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+300 PTS)'}
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
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Details Page
  detailsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroChairContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  heroChairFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(41, 37, 36, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroChairLabel: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(41, 37, 36, 0.88)',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
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
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: 12,
  },
  settingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  settingPillText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '800',
  },

  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
    color: '#fbbf24',
  },
  descriptionText: {
    color: '#e7e5e4',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  quoteText: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
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
    color: '#fbbf24',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Phase 2 & 3: Main Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  environmentStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  groupEnvironmentFrame: {
    width: width * 0.82,
    height: height * 0.42,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(41, 37, 36, 0.9)',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 20,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  groupAvatarsContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  avatarNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  chairTargetArea: {
    alignItems: 'center',
  },
  emptyChairRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  userOccupiedNode: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    borderRadius: 36,
  },
  chairAreaLabel: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 8,
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
    color: '#fbbf24',
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
    color: '#fbbf24',
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

  // Achievement Unlock Box (Phase 3)
  achievementBox: {
    width: '90%',
    backgroundColor: 'rgba(41, 37, 36, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    marginBottom: 10,
  },
  achievementBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  achievementBadgeEmoji: {
    fontSize: 36,
  },
  achievementBadgeTag: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  achievementBadgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  achievementDescription: {
    color: '#e7e5e4',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
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
