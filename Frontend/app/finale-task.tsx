import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
  AppState,
  ScrollView,
  Platform,
  DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 12 * 60; // 12 minutes (720 seconds)

export default function FinaleTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Flow steps:
  // 0 = Luxury Dashboard (Intro)
  // 1 = The Gateway Gate (Key unlock animation)
  // 2 = Path Selection (4 crystal road paths)
  // 3 = Destiny Compass (Guiding quality selection)
  // 4 = Future Vision Builder (4 categories)
  // 5 = Portal Walk (12-min distance guided journey)
  // 6 = Final Unlock Ceremony (Foundation Complete certificate)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - PATH SELECTION STATE
  const lifePaths = [
    { id: 'wellness', label: 'Wellness', emoji: '🌿', accent: '#34D399', desc: 'Holistic health & energy' },
    { id: 'career', label: 'Career', emoji: '💼', accent: '#60A5FA', desc: 'Purpose & vocational impact' },
    { id: 'relationships', label: 'Relationships', emoji: '❤️', accent: '#F472B6', desc: 'Deep connection & love' },
    { id: 'growth', label: 'Personal Growth', emoji: '🧠', accent: '#A78BFA', desc: 'Mindset & self-mastery' },
  ];
  const [selectedPath, setSelectedPath] = useState<{ id: string; label: string; emoji: string; accent: string } | null>(null);

  // STEP 3 - DESTINY COMPASS STATE
  const compassQualities = [
    { label: 'Courage', emoji: '🔥', angle: '0deg' },
    { label: 'Balance', emoji: '⚖️', angle: '45deg' },
    { label: 'Consistency', emoji: '🌱', angle: '90deg' },
    { label: 'Compassion', emoji: '💙', angle: '135deg' },
    { label: 'Focus', emoji: '🎯', angle: '180deg' },
    { label: 'Peace', emoji: '🕊️', angle: '225deg' },
    { label: 'Curiosity', emoji: '✨', angle: '270deg' },
    { label: 'Wisdom', emoji: '💡', angle: '315deg' },
  ];
  const [selectedQuality, setSelectedQuality] = useState<{ label: string; emoji: string } | null>(null);
  const compassNeedleAngle = useRef(new Animated.Value(0)).current;

  // STEP 4 - VISION BUILDER STATE
  const visionCategories = {
    goal: ['Master a Skill', 'Financial Freedom', 'Mindful Living', 'Inner Peace'],
    lifestyle: ['Daily Movement', 'Active Balance', 'Mindful Routine', 'Deep Rest'],
    mindset: ['Abundance', 'Unshakeable Calm', 'Boundless Curiosity', 'Growth Mindset'],
    impact: ['Inspiring Others', 'Deep Connections', 'Creating Value', 'Spreading Joy'],
  };

  const [selectedVision, setSelectedVision] = useState({
    goal: visionCategories.goal[0],
    lifestyle: visionCategories.lifestyle[0],
    mindset: visionCategories.mindset[0],
    impact: visionCategories.impact[0],
  });

  // STEP 5 - PORTAL WALK DISTANCE TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const portalMessages = [
    '🌅 "Every ending creates a beginning."',
    '🗝️ "The door opened because you kept walking."',
    '💙 "Carry your lessons forward."',
    '✨ "The next chapter is yours to write."',
    '🌌 "Your foundation is permanent strength."',
  ];

  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Gateway Key Rotation Animation (Step 1)
  const keyRotationAnim = useRef(new Animated.Value(0)).current;
  const gatewayLightRay = useRef(new Animated.Value(0.2)).current;

  // Avatar Walking animation (Step 5)
  const avatarWalkAnim = useRef(new Animated.Value(0)).current;

  // Ambient Floating Particles & Cyan Dust
  const cyanParticles = useRef(
    Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 20),
      scale: Math.random() * 0.6 + 0.3,
      opacity: new Animated.Value(0),
    }))
  ).current;

  // AppState for background timer tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Fade in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sync background timer updates on app resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isTimerActive && !isTimerPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            handleTimerComplete();
          }
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [step, isTimerActive, isTimerPaused]);

  // Step transitions handler
  const transitionToStep = (nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      if (nextStep === 1) {
        startGatewayKeyAnimation();
      } else if (nextStep === 5) {
        startCyanParticles();
        startAvatarWalking();
      }
    });
  };

  // STEP 1 - GATEWAY KEY ANIMATION
  const startGatewayKeyAnimation = () => {
    keyRotationAnim.setValue(0);
    Animated.parallel([
      Animated.timing(keyRotationAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(gatewayLightRay, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(gatewayLightRay, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  };

  // STEP 2 - SAVE PATH
  const handleSelectPath = async (path: { id: string; label: string; emoji: string; accent: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPath(path);

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/finale/save-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Life Path Unlock',
          path: path.label,
        }),
      });

      if (res.ok) {
        transitionToStep(3);
      } else {
        Alert.alert('Save Error', 'Could not save selected life path.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Unable to connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3 - SAVE COMPASS QUALITY
  const handleSelectQuality = async (q: { label: string; emoji: string; angle: string }, idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedQuality(q);

    // Rotate compass needle
    const targetDeg = idx * 45;
    Animated.spring(compassNeedleAngle, { toValue: targetDeg, friction: 6, useNativeDriver: true }).start();

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/finale/save-compass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Life Path Unlock',
          quality: q.label,
        }),
      });

      if (res.ok) {
        setTimeout(() => transitionToStep(4), 800);
      } else {
        Alert.alert('Save Error', 'Could not save guiding quality.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4 - SAVE VISION BUILDER
  const handleSaveVision = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/finale/save-vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Life Path Unlock',
          goal: selectedVision.goal,
          lifestyle: selectedVision.lifestyle,
          mindset: selectedVision.mindset,
          impact: selectedVision.impact,
        }),
      });

      if (res.ok) {
        transitionToStep(5);
      } else {
        Alert.alert('Save Error', 'Could not save vision builder card.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5 - PORTAL WALK DISTANCE TIMER & ANIMATIONS
  const startCyanParticles = () => {
    cyanParticles.forEach((p) => {
      p.y.setValue(height + 20);
      p.opacity.setValue(0);
      const duration = Math.random() * 6000 + 4000;
      const delay = Math.random() * 3000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.y, { toValue: -40, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: 0.8, duration: duration * 0.3, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const startAvatarWalking = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarWalkAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
        Animated.timing(avatarWalkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next > 0 && next % 144 === 0) {
            setCurrentReminderIdx((idx) => (idx + 1) % portalMessages.length);
          }
          if (next <= 0) {
            clearInterval(interval);
            handleTimerComplete();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isTimerPaused, timeLeft]);

  const handleStartTimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsTimerActive(true);
    endTimeRef.current = Date.now() + timeLeft * 1000;
  };

  const handlePauseTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTimerPaused(!isTimerPaused);
    if (isTimerPaused) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    transitionToStep(6);
  };

  const devSkipTimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeLeft(5);
    endTimeRef.current = Date.now() + 5000;
  };

  // STEP 6 - FINAL COMPLETION API
  const handleCompleteTask = async () => {
    setIsLoading(true);
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Life Path Unlock' }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.points_rewarded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      router.replace({
        pathname: '/task-success',
        params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak },
      } as any);
    }
  };

  const handleStartTask = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      await fetch(`${API_BASE_URL}/api/tasks/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_name: 'Life Path Unlock' }),
      });
      transitionToStep(1);
    } catch (err) {
      transitionToStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Distance calculations for Portal Walk
  const totalMeters = 1000; // 1 km walk
  const distanceTraveled = Math.round(((TIMER_DURATION - timeLeft) / TIMER_DURATION) * totalMeters);
  const distancePercent = Math.round(((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100);

  // BACKGROUND PALETTE RENDERER (Sapphire Blue / Ice Blue / Cyan Glow)
  const renderBackground = () => {
    if (step === 6) {
      // Daylight Unlocked Horizon
      return (
        <LinearGradient
          colors={['#B3E5FC', '#00E5FF', '#1565C0']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    return (
      <LinearGradient
        colors={['#0A192F', '#0D3B66', '#1565C0']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}

      {/* Ambient Cyan Light Particles */}
      {cyanParticles.map((p, idx) => (
        <Animated.View
          key={`cyan-${idx}`}
          style={[
            styles.cyanParticleItem,
            {
              left: p.x,
              transform: [{ translateY: p.y }, { scale: p.scale }],
              opacity: p.opacity,
            },
          ]}
        >
          <Text style={styles.particleEmojiText}>💎</Text>
        </Animated.View>
      ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 6 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 5) {
                  Alert.alert('Abort Journey', 'Are you sure you want to stop this finale unlock session?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Abort', style: 'destructive', onPress: () => router.back() },
                  ]);
                } else {
                  transitionToStep(step - 1);
                }
              }}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={24} color="#FFF" />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            step === 0 && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="x" size={20} color="#B3E5FC" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 6 && { backgroundColor: '#00E5FF', shadowColor: '#00E5FF' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'GRAND FINALE'
                : step === 6
                ? 'FOUNDATION COMPLETE'
                : `CHAPTER.0${step}`}
            </Text>
          </View>

          {step === 5 && (
            <TouchableOpacity onPress={devSkipTimer} activeOpacity={0.8} style={styles.devSkipBtn}>
              <Feather name="chevrons-right" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        <Animated.View style={[styles.stepWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* ======================================================== */}
          {/* STEP 0 - LUXURY DASHBOARD (TASK DETAIL PAGE)             */}
          {/* ======================================================== */}
          {step === 0 && (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.dashboardIllustrationWrap}>
                <View style={styles.portalHalo}>
                  <Text style={styles.largeKeyEmoji}>🗝️</Text>
                </View>
              </View>

              <View style={styles.dashboardGlassCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ GRAND FINALE MILESTONE</Text>
                <Text style={styles.dashboardTitle}>Life Path Unlock</Text>
                <View style={styles.dashboardBadgesRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#00E5FF" />
                    <Text style={styles.dashBadgeText}>12 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="award" size={14} color="#00E5FF" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardDescription}>
                  Every meaningful journey begins with a strong foundation. Today isn't the end—it's the moment you unlock your next chapter.
                </Text>
              </View>

              <View style={styles.crystalBadgeWrap}>
                <View style={styles.crystalBadgeOuter}>
                  <LinearGradient
                    colors={['#00E5FF', '#1565C0']}
                    style={styles.crystalBadgeGradient}
                  >
                    <Text style={styles.crystalBadgeText}>FOUNDATION</Text>
                    <Text style={styles.crystalBadgeSub}>COMPLETE</Text>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>
                  "A foundation isn't the finish line—it's the place from which everything meaningful begins."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#00E5FF', '#1565C0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>UNLOCK MY PATH</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 — THE GATEWAY                                   */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerGateContent}>
                <Animated.View style={[styles.floatingPortalFrame, { opacity: gatewayLightRay }]}>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          rotate: keyRotationAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    }}
                  >
                    <Text style={styles.floatingKeyEmoji}>🗝️</Text>
                  </Animated.View>
                </Animated.View>
                <Text style={styles.gateTitle}>"You've built the foundation. Now unlock what's next."</Text>
                <Text style={styles.gateSubtext}>
                  "Growth isn't finished—it simply enters a new chapter."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#00E5FF', '#1565C0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>🗝️ Unlock My Path</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 — PATH SELECTION                                */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>CRYSTAL ROADWAYS</Text>
                <Text style={styles.stepTitle}>Choose Your Path</Text>
              </View>

              <ScrollView contentContainerStyle={styles.pathsContainer} showsVerticalScrollIndicator={false}>
                {lifePaths.map((path) => {
                  const isSelected = selectedPath?.id === path.id;
                  return (
                    <TouchableOpacity
                      key={path.id}
                      onPress={() => handleSelectPath(path)}
                      activeOpacity={0.8}
                      style={[
                        styles.crystalRoadCard,
                        isSelected && { borderColor: path.accent, backgroundColor: 'rgba(0,229,255,0.15)' },
                      ]}
                    >
                      <View style={[styles.pathIconWrap, { backgroundColor: path.accent }]}>
                        <Text style={styles.pathIconEmoji}>{path.emoji}</Text>
                      </View>
                      <View style={styles.pathTextWrap}>
                        <Text style={styles.pathTitleText}>{path.label}</Text>
                        <Text style={styles.pathDescText}>{path.desc}</Text>
                      </View>
                      <Feather
                        name={isSelected ? 'check-circle' : 'chevron-right'}
                        size={20}
                        color={isSelected ? path.accent : 'rgba(255,255,255,0.4)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 — DESTINY COMPASS                               */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>DESTINY COMPASS</Text>
                <Text style={styles.stepTitle}>Choose Your Guiding Quality</Text>
                <Text style={styles.stepSubtitle}>"What quality will guide your next chapter?"</Text>
              </View>

              <ScrollView contentContainerStyle={styles.compassContent} showsVerticalScrollIndicator={false}>
                {/* Rotating Compass Canvas */}
                <View style={styles.compassCanvas}>
                  <Animated.View
                    style={[
                      styles.compassNeedleWrap,
                      {
                        transform: [
                          {
                            rotate: compassNeedleAngle.interpolate({
                              inputRange: [0, 360],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.compassNeedleHead} />
                    <View style={styles.compassNeedleTail} />
                  </Animated.View>
                  <View style={styles.compassCenterCap} />
                </View>

                {/* 8 Qualities Buttons */}
                <View style={styles.qualitiesGrid}>
                  {compassQualities.map((q, idx) => {
                    const isSelected = selectedQuality?.label === q.label;
                    return (
                      <TouchableOpacity
                        key={`q-${idx}`}
                        onPress={() => handleSelectQuality(q, idx)}
                        activeOpacity={0.8}
                        style={[
                          styles.qualityChip,
                          isSelected && styles.qualityChipSelected,
                        ]}
                      >
                        <Text style={styles.qualityEmoji}>{q.emoji}</Text>
                        <Text style={[styles.qualityLabel, isSelected && styles.qualityLabelSelected]}>
                          {q.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 — FUTURE VISION BUILDER                         */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>VISION BUILDER</Text>
                <Text style={styles.stepTitle}>Next Chapter Card</Text>
              </View>

              <ScrollView contentContainerStyle={styles.visionBuilderContent} showsVerticalScrollIndicator={false}>
                {/* Dynamically Assembled Card Preview */}
                <View style={styles.nextChapterCardPreview}>
                  <Text style={styles.visionCardHeaderTag}>💎 MY NEXT CHAPTER VISION</Text>

                  <View style={styles.visionCardRow}>
                    <Text style={styles.visionRowLabel}>🎯 Goal:</Text>
                    <Text style={styles.visionRowVal}>{selectedVision.goal}</Text>
                  </View>
                  <View style={styles.visionCardRow}>
                    <Text style={styles.visionRowLabel}>🏃 Lifestyle:</Text>
                    <Text style={styles.visionRowVal}>{selectedVision.lifestyle}</Text>
                  </View>
                  <View style={styles.visionCardRow}>
                    <Text style={styles.visionRowLabel}>💬 Mindset:</Text>
                    <Text style={styles.visionRowVal}>{selectedVision.mindset}</Text>
                  </View>
                  <View style={styles.visionCardRow}>
                    <Text style={styles.visionRowLabel}>🌍 Impact:</Text>
                    <Text style={styles.visionRowVal}>{selectedVision.impact}</Text>
                  </View>
                </View>

                {/* Categories Selector */}
                {Object.entries(visionCategories).map(([key, options]) => (
                  <View key={key} style={styles.categorySelectorGroup}>
                    <Text style={styles.categoryTitleText}>
                      Select {key.toUpperCase()}:
                    </Text>
                    <View style={styles.optionsWrap}>
                      {options.map((opt) => {
                        const isPicked = (selectedVision as any)[key] === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedVision((prev) => ({ ...prev, [key]: opt }));
                            }}
                            style={[
                              styles.visionOptionChip,
                              isPicked && styles.visionOptionChipPicked,
                            ]}
                          >
                            <Text style={[styles.visionOptionLabel, isPicked && styles.visionOptionLabelPicked]}>
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveVision}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#00E5FF', '#1565C0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>ENTER PORTAL WALK</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 — PORTAL WALK                                   */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>THE HORIZON PORTAL</Text>
                <Text style={styles.stepTitle}>12 Minute Guided Walk</Text>
              </View>

              <View style={styles.portalWalkScene}>
                {/* Distance Progress Display */}
                <View style={styles.distanceCard}>
                  <Text style={styles.distanceMetersText}>{distanceTraveled}m / {totalMeters}m</Text>
                  <Text style={styles.distancePercentText}>{distancePercent}% OF PATH COMPLETED</Text>
                  <View style={styles.distanceTrack}>
                    <View style={[styles.distanceFill, { width: `${distancePercent}%` as DimensionValue }]} />
                  </View>
                </View>

                {/* Animated Avatar Walking */}
                <Animated.View
                  style={[
                    styles.avatarWalkerWrap,
                    {
                      transform: [{ translateY: avatarWalkAnim }],
                    },
                  ]}
                >
                  <Text style={styles.avatarEmoji}>🚶‍♂️</Text>
                  <Text style={styles.portalLightAhead}>✨ PORTAL LIGHT AHEAD</Text>
                </Animated.View>

                {/* Rotating Guidance Reminders */}
                <View style={styles.portalRemindersWrap}>
                  <Text style={styles.portalReminderText}>
                    {portalMessages[currentReminderIdx]}
                  </Text>
                </View>
              </View>

              <View style={styles.timerControls}>
                {isTimerActive ? (
                  <TouchableOpacity
                    onPress={handlePauseTimer}
                    activeOpacity={0.8}
                    style={styles.timerPauseBtn}
                  >
                    <Text style={styles.timerPauseText}>
                      {isTimerPaused ? 'CONTINUE WALK' : 'PAUSE WALK'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartTimer}
                    activeOpacity={0.9}
                    style={styles.actionBtnWrap}
                  >
                    <LinearGradient
                      colors={['#00E5FF', '#1565C0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionBtnText}>
                        🗝️ BEGIN PORTAL WALK
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6 — FINAL UNLOCK CEREMONY                         */}
          {/* ======================================================== */}
          {step === 6 && (
            <View style={styles.fullscreenStep}>
              <ScrollView contentContainerStyle={styles.celebrationScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.celebrationHeader}>
                  <Text style={styles.celebrationEmoji}>🏆</Text>
                  <Text style={styles.celebrationKicker}>FOUNDATION COMPLETE</Text>
                  <Text style={styles.celebrationTitle}>
                    "Your foundation is complete. Every step from here is built on what you've already become."
                  </Text>
                </View>

                {/* Achievement Certificate */}
                <View style={styles.finaleCertCard}>
                  <View style={styles.certInnerBorder}>
                    <Text style={styles.certKicker}>ANTISOCIAL GRAND FINALE</Text>
                    <Text style={styles.certTitle}>Certificate of Transformation</Text>

                    <View style={styles.certBadgeCircle}>
                      <Text style={styles.badgeKeyIcon}>🗝️</Text>
                    </View>

                    <Text style={styles.certSummaryText}>
                      Life Path: <Text style={{ color: '#00E5FF', fontWeight: 'bold' }}>{selectedPath?.label || 'Personal Growth'}</Text>
                    </Text>
                    <Text style={styles.certSummaryText}>
                      Guiding Quality: <Text style={{ color: '#00E5FF', fontWeight: 'bold' }}>{selectedQuality?.label || 'Wisdom'}</Text>
                    </Text>

                    <Text style={styles.certCompletionQuote}>"You completed the foundation."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCompleteTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#00E5FF', '#1565C0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'SAVING FINALE...' : 'COMPLETE FINALE (+300 PTS)'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F',
  },
  safeArea: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
  fullscreenStep: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 50,
    zIndex: 100,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  devSkipBtn: {
    padding: 6,
  },

  // AMBIENT PARTICLES
  cyanParticleItem: {
    position: 'absolute',
    zIndex: 2,
  },
  particleEmojiText: {
    fontSize: 14,
  },

  // STEP 0 - DASHBOARD
  dashboardIllustrationWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  portalHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  largeKeyEmoji: {
    fontSize: 54,
  },
  dashboardGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    marginBottom: 20,
  },
  dashboardKicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  dashboardTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  dashboardBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,229,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  dashBadgeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  crystalBadgeWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  crystalBadgeOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
  },
  crystalBadgeGradient: {
    flex: 1,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crystalBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  crystalBadgeSub: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quoteCard: {
    backgroundColor: 'rgba(0,229,255,0.06)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    marginVertical: 15,
  },
  quoteText: {
    color: '#B3E5FC',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  actionBtnIcon: {
    marginLeft: 8,
  },

  // STEP 1 - THE GATEWAY
  centerGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  floatingPortalFrame: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  floatingKeyEmoji: {
    fontSize: 50,
  },
  gateTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
  },
  gateSubtext: {
    color: '#B3E5FC',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 2 - PATH SELECTION
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  stepKicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  stepSubtitle: {
    color: '#B3E5FC',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  pathsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  crystalRoadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 14,
  },
  pathIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathIconEmoji: {
    fontSize: 22,
  },
  pathTextWrap: {
    flex: 1,
  },
  pathTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pathDescText: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 2,
  },

  // STEP 3 - DESTINY COMPASS
  compassContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  compassCanvas: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  compassNeedleWrap: {
    width: 100,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassNeedleHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00E5FF',
  },
  compassNeedleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1565C0',
  },
  compassCenterCap: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  qualitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  qualityChip: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityChipSelected: {
    backgroundColor: 'rgba(0,229,255,0.2)',
    borderColor: '#00E5FF',
  },
  qualityEmoji: {
    fontSize: 20,
  },
  qualityLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  qualityLabelSelected: {
    color: '#00E5FF',
  },

  // STEP 4 - VISION BUILDER
  visionBuilderContent: {
    paddingBottom: 20,
  },
  nextChapterCardPreview: {
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
    padding: 20,
    marginBottom: 20,
  },
  visionCardHeaderTag: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  visionCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  visionRowLabel: {
    color: '#B3E5FC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  visionRowVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  categorySelectorGroup: {
    marginBottom: 16,
  },
  categoryTitleText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visionOptionChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  visionOptionChipPicked: {
    backgroundColor: 'rgba(0,229,255,0.2)',
    borderColor: '#00E5FF',
  },
  visionOptionLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  visionOptionLabelPicked: {
    color: '#00E5FF',
  },

  // STEP 5 - PORTAL WALK
  portalWalkScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  distanceCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  distanceMetersText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  distancePercentText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 12,
  },
  distanceTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distanceFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
  },
  avatarWalkerWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarEmoji: {
    fontSize: 54,
  },
  portalLightAhead: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 8,
  },
  portalRemindersWrap: {
    marginTop: 20,
    paddingHorizontal: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  portalReminderText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerControls: {
    width: '100%',
  },
  timerPauseBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  timerPauseText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // STEP 6 - FINAL CELEBRATION
  celebrationScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginVertical: 15,
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  celebrationKicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  celebrationTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
  },
  finaleCertCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    padding: 6,
    marginVertical: 10,
  },
  certInnerBorder: {
    borderWidth: 2,
    borderColor: 'rgba(0,229,255,0.4)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certKicker: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  certTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  certBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,229,255,0.2)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeKeyIcon: {
    fontSize: 30,
  },
  certSummaryText: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  certCompletionQuote: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
