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
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Random Public Settings
const PUBLIC_SETTINGS = [
  { name: 'Coffee Shop Lounge', icon: 'coffee', ambient: '☕ Espresso machine hums & soft background chatter' },
  { name: 'Library Study Nook', icon: 'book-open', ambient: '📚 Soft page turns & gentle quiet sunlight' },
  { name: 'University Courtyard', icon: 'sun', ambient: '🌿 Morning breeze through oak trees & footsteps' },
  { name: 'Museum Café', icon: 'image', ambient: '🏛️ Subtle acoustics & gentle clink of coffee cups' },
  { name: 'Co-Working Lounge', icon: 'monitor', ambient: '💡 Soft ambient ambient light & relaxed focus' },
];

// Natural Conversation Opportunities (Randomized)
const ORGANIC_OPPORTUNITIES = [
  { prompt: 'Someone nearby smiles gently while looking up', detail: 'They seem relaxed and approachable.' },
  { prompt: 'Someone asks, "Is this seat taken?"', detail: 'A simple, natural moment of connection.' },
  { prompt: 'Someone accidentally drops a notebook nearby', detail: 'An unscripted moment opens up.' },
  { prompt: 'Someone comments, "It’s surprisingly peaceful here today"', detail: 'An easy open window to respond.' },
  { prompt: 'Someone asks for simple directions to the main hall', detail: 'A genuine, low-pressure interaction.' },
];

// Ambient Breeze Particles for Final Cinematic
const BREEZE_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  startY: height * 0.4 + Math.random() * 200,
  size: 3 + Math.random() * 5,
  delay: i * 150,
}));

export default function InitiateNaturallyTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selected Random Setting & Opportunity
  const [selectedSetting] = useState(
    () => PUBLIC_SETTINGS[Math.floor(Math.random() * PUBLIC_SETTINGS.length)]
  );
  const [selectedOpportunity] = useState(
    () => ORGANIC_OPPORTUNITIES[Math.floor(Math.random() * ORGANIC_OPPORTUNITIES.length)]
  );

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Interaction State
  const [opportunityTriggered, setOpportunityTriggered] = useState(false);
  const [opportunityWelcomed, setOpportunityWelcomed] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Stay open.');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Window & Curtain Animations
  const curtainSwayAnim = useRef(new Animated.Value(0)).current;
  const windowOpenAnim = useRef(new Animated.Value(0)).current;
  const sunbeamGlowAnim = useRef(new Animated.Value(0.4)).current;
  const roomBrightnessAnim = useRef(new Animated.Value(0)).current;

  // People & Ambient Motion
  const ambientPasserAnim = useRef(new Animated.Value(-100)).current;
  const opportunityPulseAnim = useRef(new Animated.Value(1)).current;

  // Final Cinematic Shield
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;
  const breezeParticleAnim = useRef(new Animated.Value(0)).current;

  // Setup Curtain Swaying & Sunbeam Animations
  useEffect(() => {
    // Gentle Sheer Curtain Movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(curtainSwayAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(curtainSwayAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing Sunbeams
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunbeamGlowAnim, {
          toValue: 0.8,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sunbeamGlowAnim, {
          toValue: 0.4,
          duration: 5000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      setDisplayText('Stay open.');
      setSubDisplayText(null);
    } else if (elapsedTime === 45) {
      // 0:45 - People naturally pass by
      setDisplayText('Not every opportunity announces itself.');
      setSubDisplayText(null);

      // Animate background passerby shadow
      Animated.timing(ambientPasserAnim, {
        toValue: width + 100,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    } else if (elapsedTime === 90) {
      // 1:30 - Background organic moments
      setDisplayText('Simply notice.');
      setSubDisplayText(null);
    } else if (elapsedTime === 150) {
      // 2:30 - Genuine conversation opportunity appears
      setOpportunityTriggered(true);
      setDisplayText('A natural moment opens up.');
      setSubDisplayText(selectedOpportunity.prompt);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      // Pulse interaction button
      Animated.loop(
        Animated.sequence([
          Animated.timing(opportunityPulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opportunityPulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (elapsedTime === 240) {
      // 4:00 - Interaction finishes, window opens wider, fresh air & sunlight
      setDisplayText("You didn't force the moment.");

      Animated.parallel([
        Animated.timing(windowOpenAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(roomBrightnessAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setSubDisplayText('You welcomed it.');
      }, 2200);
    } else if (elapsedTime >= 300) {
      // 5:00 - Final Cinematic
      startFinalCinematic();
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Count-down
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

  // Handle Welcoming Opportunity
  const handleWelcomeOpportunity = () => {
    if (opportunityWelcomed) return;
    setOpportunityWelcomed(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setSubDisplayText('You entered the moment comfortably.');

    // Save progress to backend
    saveProgressBackend({ interaction_completed: true });
  };

  // Start the Challenge
  const startChallenge = () => {
    saveProgressBackend({ session_started: true, setting_name: selectedSetting.name });
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
  // FINAL CINEMATIC (Open Window & Sunlight Shield)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(breezeParticleAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
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
        await apiFetch('/api/tasks/initiate-naturally/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Initiate Conversation Naturally',
            setting_name: selectedSetting.name,
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
            task_name: 'Initiate Conversation Naturally',
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
        message: 'You moved freely.',
        difficulty: 'hard',
        taskName: 'Initiate Conversation Naturally',
        badge: 'Natural Connector',
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

  const curtainSwayLeft = curtainSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '4deg'],
  });

  const curtainSwayRight = curtainSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-4deg'],
  });

  const windowScale = windowOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* The Flow Window Background Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Gradient: Sage Green & Warm White & Soft Sky Blue */}
        <LinearGradient
          colors={['#1c2d27', '#2a3d36', '#3b5249', '#192621']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Sunlight Glow Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: sunbeamGlowAnim,
              backgroundColor: 'rgba(254, 243, 199, 0.08)',
            },
          ]}
          pointerEvents="none"
        />

        {/* Room Brightness Boost at Ending */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: roomBrightnessAnim,
              backgroundColor: 'rgba(168, 218, 220, 0.12)',
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
            <Feather name="chevron-left" size={24} color="#84a98c" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'THE FLOW WINDOW' : selectedSetting.name.toUpperCase()}
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
            {/* Top Animated Open Window Hero */}
            <View style={styles.heroWindowContainer}>
              <View style={styles.heroWindowFrame}>
                <View style={styles.heroSunbeamRay} />

                {/* Animated Sheer Curtains */}
                <Animated.View
                  style={[
                    styles.heroCurtainLeft,
                    { transform: [{ rotateZ: curtainSwayLeft }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.heroCurtainRight,
                    { transform: [{ rotateZ: curtainSwayRight }] },
                  ]}
                />

                {/* Window Glass Pane & Leaves */}
                <View style={styles.heroWindowCenter}>
                  <Ionicons name="leaf-outline" size={32} color="#84a98c" />
                  <Text style={styles.heroWindowLabel}>NATURAL OPENNESS</Text>
                </View>
              </View>
            </View>

            {/* Central Glass Panel */}
            <View style={styles.glassCard}>
              <Text style={styles.taskTitle}>Initiate Conversation</Text>
              <Text style={styles.taskSubTitle}>Naturally</Text>

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                <View style={styles.badgePill}>
                  <Feather name="clock" size={13} color="#84a98c" />
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
                Not every conversation needs planning.{'\n'}
                Some simply begin because you're open enough to notice the moment.{'\n\n'}
                Today's challenge is to recognize one natural opportunity and respond comfortably. Stay relaxed. Stay curious.
              </Text>

              {/* Quote Box */}
              <View style={styles.quoteBox}>
                <Feather name="sun" size={18} color="#84a98c" style={{ marginRight: 8 }} />
                <Text style={styles.quoteText}>
                  "Real conversations rarely begin with perfect words. They begin with openness."
                </Text>
              </View>

              {/* Natural Connector Achievement Banner */}
              <View style={styles.badgeBanner}>
                <Text style={styles.badgeBannerEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeBannerTitle}>Natural Connector</Text>
                  <Text style={styles.badgeBannerSub}>
                    Unlock achievement by entering conversation comfortably
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
                  colors={['#52796f', '#84a98c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>ENTER THE FLOW WINDOW</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN FLOW WINDOW SCENE & FINAL CINEMATIC         */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Window Arena */}
          <View style={styles.windowArena}>
            {/* The Large Wooden Window Frame */}
            <Animated.View
              style={[
                styles.largeWindowFrame,
                { transform: [{ scale: windowScale }] },
              ]}
            >
              {/* Sunbeam Light Rays */}
              <LinearGradient
                colors={['rgba(254, 243, 199, 0.25)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Animated Sheer Curtains Swinging Gently */}
              <Animated.View
                style={[
                  styles.curtainPanelLeft,
                  { transform: [{ rotateZ: curtainSwayLeft }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.curtainPanelRight,
                  { transform: [{ rotateZ: curtainSwayRight }] },
                ]}
              />

              {/* Outdoor Ambient Scene View */}
              <View style={styles.outdoorView}>
                <Ionicons
                  name={selectedSetting.icon as any || 'leaf-outline'}
                  size={52}
                  color="rgba(132, 169, 140, 0.65)"
                />
                <Text style={styles.settingLabel}>
                  {selectedSetting.name}
                </Text>
                <Text style={styles.ambientLabel}>
                  {selectedSetting.ambient}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Dynamic Natural Interaction Moment Prompt */}
          {opportunityTriggered && phase === 'active' && (
            <Animated.View
              style={[
                styles.opportunityCard,
                { transform: [{ scale: opportunityPulseAnim }] },
              ]}
            >
              <View style={styles.oppIconCircle}>
                <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#84a98c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.oppTag}>ORGANIC OPPORTUNITY</Text>
                <Text style={styles.oppPrompt}>{selectedOpportunity.prompt}</Text>
                <Text style={styles.oppDetail}>{selectedOpportunity.detail}</Text>
              </View>

              {!opportunityWelcomed ? (
                <TouchableOpacity
                  style={styles.welcomeBtn}
                  onPress={handleWelcomeOpportunity}
                  activeOpacity={0.8}
                >
                  <Text style={styles.welcomeBtnText}>WELCOME MOMENT</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.welcomedPill}>
                  <Feather name="check-circle" size={16} color="#52796f" />
                  <Text style={styles.welcomedPillText}>WELCOMED</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Central Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Footer Timer & Controls */}
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

          {/* Final Cinematic Banner (Phase 3) */}
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
                    Natural Connector
                  </Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "You discovered that confidence often begins with openness."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#354f52', '#52796f']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+600 PTS)'}
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
    backgroundColor: '#192621',
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
    borderColor: 'rgba(132, 169, 140, 0.25)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(132, 169, 140, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(132, 169, 140, 0.3)',
  },
  headerTagText: {
    color: '#84a98c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding / Details Page
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
    alignItems: 'stretch',
  },
  heroWindowContainer: {
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  heroWindowFrame: {
    width: 120,
    height: 150,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#d4a373',
    backgroundColor: 'rgba(42, 61, 54, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#84a98c',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroSunbeamRay: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 80,
    height: 180,
    backgroundColor: 'rgba(254, 243, 199, 0.15)',
    transform: [{ rotate: '30deg' }],
  },
  heroCurtainLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.25)',
    borderBottomRightRadius: 16,
  },
  heroCurtainRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.25)',
    borderBottomLeftRadius: 16,
  },
  heroWindowCenter: {
    alignItems: 'center',
  },
  heroWindowLabel: {
    color: '#f8f9fa',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(35, 52, 46, 0.9)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(132, 169, 140, 0.3)',
    shadowColor: '#84a98c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8f9fa',
    textAlign: 'center',
  },
  taskSubTitle: {
    fontSize: 14,
    color: '#84a98c',
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
    backgroundColor: 'rgba(132, 169, 140, 0.12)',
    borderColor: 'rgba(132, 169, 140, 0.35)',
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
    color: '#84a98c',
  },
  descriptionText: {
    color: '#cad2c5',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(132, 169, 140, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#84a98c',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    color: '#e0e1dd',
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
    color: '#f8f9fa',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeBannerSub: {
    color: '#84a98c',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    alignSelf: 'stretch',
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

  // Phase 2 & 3: Flow Window Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  windowArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  largeWindowFrame: {
    width: width * 0.8,
    height: height * 0.38,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#d4a373',
    backgroundColor: 'rgba(42, 61, 54, 0.85)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#84a98c',
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  curtainPanelLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.24,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.28)',
    borderBottomRightRadius: 30,
  },
  curtainPanelRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.24,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.28)',
    borderBottomLeftRadius: 30,
  },
  outdoorView: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  settingLabel: {
    color: '#f8f9fa',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  ambientLabel: {
    color: '#84a98c',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  // Organic Opportunity Prompt Card
  opportunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    backgroundColor: 'rgba(35, 52, 46, 0.95)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(132, 169, 140, 0.4)',
    marginVertical: 10,
    gap: 10,
  },
  oppIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(132, 169, 140, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppTag: {
    color: '#84a98c',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  oppPrompt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  oppDetail: {
    color: '#cad2c5',
    fontSize: 11,
  },
  welcomeBtn: {
    backgroundColor: '#52796f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  welcomeBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  welcomedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(132, 169, 140, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  welcomedPillText: {
    color: '#52796f',
    fontSize: 10,
    fontWeight: '900',
  },

  // Psychological Text Display
  displayTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  mainDisplayText: {
    color: '#f8f9fa',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subDisplayText: {
    color: '#84a98c',
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
    color: '#84a98c',
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
    backgroundColor: 'rgba(35, 52, 46, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(132, 169, 140, 0.4)',
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
    color: '#84a98c',
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
    color: '#cad2c5',
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
