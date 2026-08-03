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
  Platform,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TOWER_TOTAL_LEVELS = 10;
const TOTAL_DURATION_SECONDS = 600; // 10 minutes

interface RadarSignal {
  id: number;
  x: number;
  y: number;
  label: string;
  size: number;
}

const HUMAN_QUALITIES = [
  { id: 'kindness', title: 'Kindness', icon: '🤝', desc: 'Did you notice an act of kindness?' },
  { id: 'effort', title: 'Effort', icon: '💪', desc: 'Can you appreciate today\'s effort?' },
  { id: 'dedication', title: 'Dedication', icon: '🎯', desc: 'What quiet focus stood out to you?' },
  { id: 'growth', title: 'Growth', icon: '🌱', desc: 'How is this person striving forward?' },
  { id: 'positivity', title: 'Positivity', icon: '😊', desc: 'What uplifting energy did they bring?' },
  { id: 'creativity', title: 'Creativity', icon: '💡', desc: 'What unique perspective do they share?' },
  { id: 'wisdom', title: 'Wisdom', icon: '🧠', desc: 'What thoughtful quality do they project?' },
  { id: 'compassion', title: 'Compassion', icon: '❤️', desc: 'What gentle empathy did you observe?' },
];

const TOWER_MOTIVATIONAL_QUOTES = [
  '💎 "People remember genuine appreciation."',
  '✨ "Recognition creates confidence."',
  '🌱 "Every kind word changes two people."',
  '🤝 "Today you chose encouragement."',
  '🌌 "Value shines brightest when noticed."',
];

export default function ComplimentSomeoneTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Navigation / Screen state:
  // 1: People Scan
  // 2: Impact Radar
  // 3: Discovery Wheel
  // 4: Impact Moment
  // 5: Impact Tower
  // 6: Final Celebration
  // 7: Dashboard Detail Page
  const [screen, setScreen] = useState<number>(1);

  // Task interaction data
  const [selectedSignal, setSelectedSignal] = useState<RadarSignal | null>(null);
  const [observationCompleted, setObservationCompleted] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<typeof HUMAN_QUALITIES[0] | null>(null);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [complimentDelivered, setComplimentDelivered] = useState(false);
  
  // Impact Tower timer & progress
  const [towerSeconds, setTowerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [isFastForward, setIsFastForward] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Animations
  const auroraAnim = useRef(new Animated.Value(0)).current;
  const zoomCrowdAnim = useRef(new Animated.Value(1)).current;
  const radarRotation = useRef(new Animated.Value(0)).current;
  const radarPulse = useRef(new Animated.Value(1)).current;
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const qualityScaleAnim = useRef(new Animated.Value(0.8)).current;
  const qualityOpacityAnim = useRef(new Animated.Value(0)).current;
  const crystalGlowAnim = useRef(new Animated.Value(0)).current;
  const towerBeamAnim = useRef(new Animated.Value(0)).current;
  const floatingCrystalsAnim = useRef(new Animated.Value(0)).current;
  
  // Celebration city lights
  const cityLightsAnim = useRef(new Animated.Value(0)).current;
  const risingCrystalAnim = useRef(new Animated.Value(0)).current;

  // Radar Signal Dots
  const [signals] = useState<RadarSignal[]>([
    { id: 1, x: width * 0.28, y: height * 0.22, label: 'Signal Alpha', size: 14 },
    { id: 2, x: width * 0.68, y: height * 0.26, label: 'Signal Beta', size: 18 },
    { id: 3, x: width * 0.48, y: height * 0.38, label: 'Signal Gamma', size: 16 },
    { id: 4, x: width * 0.22, y: height * 0.44, label: 'Signal Delta', size: 15 },
    { id: 5, x: width * 0.74, y: height * 0.48, label: 'Signal Epsilon', size: 17 },
  ]);

  // Start initial ambient animations
  useEffect(() => {
    // Background Aurora Breathing Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(auroraAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(auroraAnim, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    // Radar Rotation Loop
    Animated.loop(
      Animated.timing(radarRotation, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Radar Pulse Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, { toValue: 1.25, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(radarPulse, { toValue: 1, duration: 2000, easing: Easing.in(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Floating Crystals Bobbing Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingCrystalsAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatingCrystalsAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    startTaskOnBackend();
  }, []);

  const startTaskOnBackend = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Compliment Someone' })
        });
      }
    } catch (e) {
      console.log('Failed to call task start API:', e);
    }
  };

  const saveProgressOnBackend = async (data: Record<string, any>) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/compliment/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Compliment Someone', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Start Observation
  const handleStartObservation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(zoomCrowdAnim, {
      toValue: 1.18,
      duration: 1500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setScreen(2);
    });
  };

  // Screen 2: Select Radar Signal
  const handleSelectSignal = (sig: RadarSignal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedSignal(sig);
    setObservationCompleted(true);
    saveProgressOnBackend({ target_signal: sig.label, observation_completed: true });
  };

  // Screen 3: Spin Crystal Discovery Wheel
  const handleSpinWheel = () => {
    if (isSpinningWheel) return;
    setIsSpinningWheel(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate wheel rotation multiple full turns
    wheelRotation.setValue(0);
    const targetTurn = 5 + Math.random() * 3;
    const randomIndex = Math.floor(Math.random() * HUMAN_QUALITIES.length);
    const pickedQuality = HUMAN_QUALITIES[randomIndex];

    Animated.timing(wheelRotation, {
      toValue: targetTurn,
      duration: 3200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinningWheel(false);
      setSelectedQuality(pickedQuality);
      
      // Expand selected quality animation
      qualityScaleAnim.setValue(0.5);
      qualityOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(qualityScaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(qualityOpacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      saveProgressOnBackend({ selected_quality: pickedQuality.title });
    });
  };

  // Screen 4: Confirm Compliment Delivered
  const handleDeliverCompliment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setComplimentDelivered(true);

    // Crystal glow bloom animation
    Animated.timing(crystalGlowAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start();

    saveProgressOnBackend({ compliment_delivered: true });
  };

  // Screen 5: Impact Tower Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 5 && isTimerRunning) {
      interval = setInterval(() => {
        setTowerSeconds((prev) => {
          const step = isFastForward ? 30 : 1;
          const next = prev + step;
          if (next >= TOTAL_DURATION_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerRunning(false);
            handleCompleteTask();
            return TOTAL_DURATION_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, isTimerRunning, isFastForward]);

  // Rotate quotes every 15s during tower timer
  useEffect(() => {
    if (screen === 5) {
      const qInterval = setInterval(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % TOWER_MOTIVATIONAL_QUOTES.length);
      }, 8000);
      return () => clearInterval(qInterval);
    }
  }, [screen]);

  // Active crystal levels in light tower (0 to 10)
  const currentTowerLevel = Math.min(
    TOWER_TOTAL_LEVELS,
    Math.floor((towerSeconds / TOTAL_DURATION_SECONDS) * TOWER_TOTAL_LEVELS)
  );

  // Final Complete Task
  const handleCompleteTask = async () => {
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Compliment Someone' })
        });
        const resData = await response.json();
        if (resData.success) {
          setEarnedPoints(resData.pointsAdded || 300);
        } else {
          setEarnedPoints(300);
        }
      } else {
        setEarnedPoints(300);
      }
    } catch (e) {
      console.log('Task complete error:', e);
      setEarnedPoints(300);
    } finally {
      setIsSubmitting(false);
      saveProgressOnBackend({ completed: true, tower_level: 10 });
      setScreen(6); // Go to celebration

      // Animate Celebration Night Skyline Illumination
      Animated.sequence([
        Animated.timing(cityLightsAnim, { toValue: 1, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(risingCrystalAnim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  };

  // Interpolated Animation Transforms
  const auroraOpacity = auroraAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75]
  });

  const radarSpinDegree = radarRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const wheelSpinDegree = wheelRotation.interpolate({
    inputRange: [0, 8],
    outputRange: ['0deg', '2880deg']
  });

  const crystalBobY = floatingCrystalsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12]
  });

  const risingCrystalY = risingCrystalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, -80]
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Futuristic Aurora Animated Background */}
      <Animated.View style={[styles.auroraLayer, { opacity: auroraOpacity }]}>
        <LinearGradient
          colors={['#1E293B', '#7C3AED', '#60A5FA', '#0F172A']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Global Futuristic Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))}
        >
          <Feather name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Compliment Someone</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>💎 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => setScreen(screen === 7 ? 5 : 7)}
        >
          <MaterialCommunityIcons
            name={screen === 7 ? 'crystal-ball' : 'view-dashboard-outline'}
            size={22}
            color="#60A5FA"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: PEOPLE SCAN (Airport Glass Architecture & Silhouette Crowd) */}
      {screen === 1 && (
        <Animated.View style={[styles.screenContent, { transform: [{ scale: zoomCrowdAnim }] }]}>
          {/* Futuristic Airport Glass Terminal Architecture Graphics */}
          <View style={styles.airportGlassContainer}>
            <View style={styles.glassPillarLeft} />
            <View style={styles.glassPillarRight} />
            <View style={styles.glassGridCeiling}>
              <View style={styles.gridLineHorizontal} />
              <View style={styles.gridLineHorizontal2} />
              <View style={styles.gridLineVertical} />
              <View style={styles.gridLineVertical2} />
            </View>

            {/* Silhouette Crowd */}
            <View style={styles.silhouettesWrapper}>
              <View style={[styles.silhouettePerson, { left: '15%', height: 110, width: 28 }]}>
                <View style={styles.silhouetteHead} />
                <View style={styles.silhouetteBody} />
                <View style={styles.silhouetteGlowRing} />
              </View>

              <View style={[styles.silhouettePerson, { left: '42%', height: 130, width: 32 }]}>
                <View style={styles.silhouetteHead} />
                <View style={styles.silhouetteBody} />
                <View style={[styles.silhouetteGlowRing, { borderColor: '#60A5FA' }]} />
              </View>

              <View style={[styles.silhouettePerson, { left: '72%', height: 115, width: 26 }]}>
                <View style={styles.silhouetteHead} />
                <View style={styles.silhouetteBody} />
                <View style={[styles.silhouetteGlowRing, { borderColor: '#7C3AED' }]} />
              </View>
            </View>
          </View>

          {/* Heading & Intro */}
          <View style={styles.scanTextContainer}>
            <Text style={styles.scanHeadingText}>
              "Everyone has something worth appreciating."
            </Text>
            <Text style={styles.scanSubtext}>
              Today's mission is to discover it.
            </Text>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryFuturisticBtn}
            activeOpacity={0.85}
            onPress={handleStartObservation}
          >
            <LinearGradient
              colors={['#7C3AED', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBtnInner}
            >
              <Text style={styles.primaryBtnText}>💎 Start Observation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* SCREEN 2: IMPACT RADAR */}
      {screen === 2 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenStepLabel}>STAGE 1 — OBSERVATION RADAR</Text>
          <Text style={styles.screenTitleText}>Impact Radar</Text>
          <Text style={styles.screenSubText}>
            Tap a glowing signal near you to focus your attention.
          </Text>

          {/* Radar Ring View */}
          <View style={styles.radarContainer}>
            {/* Animated Rotating Scanning Line */}
            <Animated.View
              style={[
                styles.radarScanLine,
                { transform: [{ rotate: radarSpinDegree }] }
              ]}
            >
              <LinearGradient
                colors={['rgba(96, 165, 250, 0.45)', 'transparent']}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Radar Concentric Rings */}
            <Animated.View style={[styles.radarOuterRing, { transform: [{ scale: radarPulse }] }]} />
            <View style={styles.radarMidRing} />
            <View style={styles.radarInnerRing} />
            <View style={styles.radarCenterDot} />

            {/* Interactive Radar Dot Signals */}
            {signals.map((sig) => {
              const isSelected = selectedSignal?.id === sig.id;
              return (
                <TouchableOpacity
                  key={sig.id}
                  style={[
                    styles.radarDot,
                    {
                      left: sig.x - 30,
                      top: sig.y - 120,
                      width: isSelected ? sig.size + 14 : sig.size,
                      height: isSelected ? sig.size + 14 : sig.size,
                      backgroundColor: isSelected ? '#60A5FA' : '#7C3AED',
                      borderColor: isSelected ? '#F8FAFC' : 'rgba(96, 165, 250, 0.6)',
                    }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSignal(sig)}
                >
                  {isSelected && <View style={styles.radarDotHalo} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Observation Guidance Card */}
          <View style={styles.radarCardBox}>
            {selectedSignal ? (
              <>
                <View style={styles.radarCardBadge}>
                  <Text style={styles.radarBadgeText}>TARGET LOCK ACTIVE</Text>
                </View>
                <Text style={styles.radarObservationHeading}>
                  "Observe this person for a few moments."
                </Text>
                <Text style={styles.radarObservationSub}>
                  No writing required. Simply observe with presence, kindness, and open attention.
                </Text>

                <TouchableOpacity
                  style={styles.secondaryFuturisticBtn}
                  onPress={() => setScreen(3)}
                >
                  <Text style={styles.secondaryBtnText}>Proceed to Discovery Wheel ✨</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.radarPromptText}>
                Tap any glowing signal dot on the radar above to select a person.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* SCREEN 3: DISCOVERY WHEEL */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenStepLabel}>STAGE 2 — QUALITY DISCOVERY</Text>
          <Text style={styles.screenTitleText}>Discovery Wheel</Text>
          <Text style={styles.screenSubText}>
            Spin the crystal wheel to reveal a genuine human quality to appreciate.
          </Text>

          {/* Rotating Crystal Wheel Container */}
          <View style={styles.wheelContainer}>
            <Animated.View
              style={[
                styles.crystalWheelCircle,
                { transform: [{ rotate: wheelSpinDegree }] }
              ]}
            >
              {HUMAN_QUALITIES.map((q, idx) => {
                const angle = (idx * 360) / HUMAN_QUALITIES.length;
                return (
                  <View
                    key={q.id}
                    style={[
                      styles.wheelSegment,
                      { transform: [{ rotate: `${angle}deg` }, { translateY: -95 }] }
                    ]}
                  >
                    <Text style={styles.wheelIcon}>{q.icon}</Text>
                  </View>
                );
              })}
            </Animated.View>

            {/* Center Spin Trigger */}
            <TouchableOpacity
              style={styles.wheelCenterButton}
              activeOpacity={0.8}
              onPress={handleSpinWheel}
              disabled={isSpinningWheel}
            >
              <LinearGradient
                colors={['#7C3AED', '#60A5FA']}
                style={styles.wheelCenterInner}
              >
                <Text style={styles.wheelSpinBtnText}>
                  {isSpinningWheel ? 'SPINNING...' : 'SPIN'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Selected Quality Display Card */}
          {selectedQuality && (
            <Animated.View
              style={[
                styles.qualityCardContainer,
                {
                  transform: [{ scale: qualityScaleAnim }],
                  opacity: qualityOpacityAnim
                }
              ]}
            >
              <Text style={styles.qualityCardIcon}>{selectedQuality.icon}</Text>
              <Text style={styles.qualityCardTitle}>{selectedQuality.title}</Text>
              <Text style={styles.qualityCardPrompt}>"{selectedQuality.desc}"</Text>

              <TouchableOpacity
                style={styles.primaryFuturisticBtn}
                activeOpacity={0.85}
                onPress={() => setScreen(4)}
              >
                <LinearGradient
                  colors={['#60A5FA', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>✨ I Found Something Genuine</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* SCREEN 4: IMPACT MOMENT */}
      {screen === 4 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenStepLabel}>STAGE 3 — EXPRESSION</Text>
          <Text style={styles.screenTitleText}>Deliver Your Compliment</Text>
          <Text style={styles.screenSubText}>
            Step forward in real life and express genuine appreciation to this person.
          </Text>

          {/* Large Premium Action Button */}
          <View style={styles.impactActionWrapper}>
            <Animated.View
              style={[
                styles.crystalBloomGlow,
                {
                  opacity: crystalGlowAnim,
                  transform: [
                    {
                      scale: crystalGlowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.4]
                      })
                    }
                  ]
                }
              ]}
            />

            <TouchableOpacity
              style={styles.largeComplimentBtn}
              activeOpacity={0.85}
              onPress={handleDeliverCompliment}
            >
              <LinearGradient
                colors={['#7C3AED', '#60A5FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.largeBtnInner}
              >
                <Text style={styles.largeBtnIcon}>💬</Text>
                <Text style={styles.largeBtnText}>I Shared My Compliment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Illumination Spread Confirmation */}
          {complimentDelivered && (
            <View style={styles.propagationBox}>
              <View style={styles.crystalPulseIconRow}>
                <Text style={styles.crystalSparkle}>💎</Text>
                <Text style={styles.crystalSparkle}>✨</Text>
                <Text style={styles.crystalSparkle}>💎</Text>
              </View>
              <Text style={styles.propagationTitle}>
                "Positivity spreads beyond the moment you created."
              </Text>

              <TouchableOpacity
                style={styles.secondaryFuturisticBtn}
                onPress={() => {
                  setScreen(5);
                  setIsTimerRunning(true);
                }}
              >
                <Text style={styles.secondaryBtnText}>Enter Impact Tower 🏙️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* SCREEN 5: IMPACT TOWER (Vertical 10-Level Light Tower) */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenStepLabel}>STAGE 4 — IMPACT INTEGRATION</Text>
          <Text style={styles.screenTitleText}>Vertical Light Tower</Text>
          <Text style={styles.screenSubText}>
            Allow your positive energy to illuminate the tower level by level over 10 minutes.
          </Text>

          {/* Test / Fast Forward Switch */}
          <View style={styles.fastForwardRow}>
            <Text style={styles.fastForwardLabel}>⚡ Fast-Forward Timer (Test Mode):</Text>
            <Switch
              value={isFastForward}
              onValueChange={setIsFastForward}
              trackColor={{ false: '#334155', true: '#60A5FA' }}
              thumbColor={isFastForward ? '#F8FAFC' : '#94A3B8'}
            />
          </View>

          {/* Vertical Light Tower */}
          <View style={styles.lightTowerContainer}>
            <Animated.View style={[styles.floatingCrystalsRow, { transform: [{ translateY: crystalBobY }] }]}>
              <Text style={styles.floatingCrystal}>💎</Text>
              <Text style={styles.floatingCrystal}>✨</Text>
              <Text style={styles.floatingCrystal}>💎</Text>
            </Animated.View>

            {/* Tower Levels (10 to 1 top to bottom) */}
            {Array.from({ length: TOWER_TOTAL_LEVELS }, (_, idx) => {
              const levelNumber = TOWER_TOTAL_LEVELS - idx;
              const isLevelActive = currentTowerLevel >= levelNumber;

              return (
                <View
                  key={levelNumber}
                  style={[
                    styles.towerLevelBlock,
                    isLevelActive && styles.towerLevelBlockActive
                  ]}
                >
                  <LinearGradient
                    colors={
                      isLevelActive
                        ? ['#60A5FA', '#7C3AED']
                        : ['rgba(30, 41, 59, 0.6)', 'rgba(15, 23, 42, 0.6)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.towerLevelGradient}
                  >
                    <Text style={[styles.towerLevelNum, isLevelActive && styles.towerLevelNumActive]}>
                      Level {levelNumber}
                    </Text>
                    <Text style={styles.towerLevelStatus}>
                      {isLevelActive ? '💎 ILLUMINATED' : '🔒 PENDING'}
                    </Text>
                  </LinearGradient>
                </View>
              );
            })}
          </View>

          {/* Motivational Rotating Quote Box */}
          <View style={styles.motivationalCard}>
            <Text style={styles.motivationalText}>
              {TOWER_MOTIVATIONAL_QUOTES[activeQuoteIndex]}
            </Text>
            <Text style={styles.timerProgressText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_DURATION_SECONDS - towerSeconds) / 60))}m {Math.max(0, (TOTAL_DURATION_SECONDS - towerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 6: FINAL CELEBRATION (Night Skyline Illumination & Badge Unlock) */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>

          {/* Night Skyline & Windows Lighting Animation */}
          <View style={styles.skylineContainer}>
            <Animated.View style={[styles.skylineRisingCrystal, { transform: [{ translateY: risingCrystalY }] }]}>
              <Text style={styles.bigAscendingCrystal}>💎</Text>
            </Animated.View>

            {/* City Building Silhouettes */}
            <View style={styles.buildingRow}>
              <View style={[styles.building, { height: 130 }]}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.windowLight,
                      { opacity: cityLightsAnim }
                    ]}
                  />
                ))}
              </View>

              <View style={[styles.building, { height: 170 }]}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.windowLight,
                      { opacity: cityLightsAnim }
                    ]}
                  />
                ))}
              </View>

              <View style={[styles.building, { height: 140 }]}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.windowLight,
                      { opacity: cityLightsAnim }
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Achievement Unlock Box */}
          <View style={styles.achievementCard}>
            <View style={styles.achievementIconCircle}>
              <Text style={styles.badgeMedalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Positive Influence</Text>
            <Text style={styles.achievementDesc}>
              "You didn't just give a compliment—you reminded someone of their value."
            </Text>
            <View style={styles.pointsBadgeRow}>
              <Text style={styles.earnedPointsText}>+{earnedPoints || 300} Task Points</Text>
            </View>
            <Text style={styles.completionQuoteText}>"You gave value."</Text>
          </View>

          {/* Finish Button */}
          <TouchableOpacity
            style={styles.primaryFuturisticBtn}
            activeOpacity={0.85}
            onPress={() => {
              router.replace({
                pathname: '/task-success',
                params: {
                  points: (earnedPoints || 300).toString(),
                  taskName: 'Compliment Someone',
                  message: 'You gave value.',
                  difficulty: 'hard',
                  badge: 'Positive Influence'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#7C3AED', '#60A5FA']}
              style={styles.gradientBtnInner}
            >
              <Text style={styles.primaryBtnText}>Continue to Well Done 🎉</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 7: TASK DETAIL PAGE DASHBOARD */}
      {screen === 7 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenStepLabel}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenTitleText}>Social Appreciation Dashboard</Text>

          {/* Floating Crystal Top */}
          <View style={styles.detailFloatingCrystalWrapper}>
            <Animated.View style={{ transform: [{ translateY: crystalBobY }] }}>
              <Text style={styles.dashboardCrystalIcon}>💎</Text>
            </Animated.View>
            <Text style={styles.dashboardTitleText}>Compliment Someone</Text>
          </View>

          {/* Completed Light Tower Center */}
          <View style={styles.detailTowerContainer}>
            <Text style={styles.detailSectionTitle}>Completed Light Tower</Text>
            <View style={styles.detailTowerGrid}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={styles.detailTowerGridLevel}>
                  <Text style={styles.detailTowerLevelText}>Level {10 - i} • Illuminated 💎</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Badge Bottom */}
          <View style={styles.detailBadgeBox}>
            <Text style={styles.badgeMedalIcon}>🏅</Text>
            <Text style={styles.detailBadgeName}>Positive Influence Badge Unlocked</Text>
          </View>

          {/* Inspirational Quote */}
          <View style={styles.inspirationalQuoteBox}>
            <Text style={styles.inspirationalQuoteText}>
              "People bloom when someone notices what makes them special."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryFuturisticBtn}
            onPress={() => setScreen(5)}
          >
            <Text style={styles.secondaryBtnText}>Back to Challenge</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  auroraLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(96, 165, 250, 0.15)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerBadge: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  headerBadgeText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
  detailButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  scrollScreenContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  screenStepLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  screenTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  screenSubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 20,
    textAlign: 'center',
  },

  /* Airport Terminal Glass Screen 1 */
  airportGlassContainer: {
    height: 280,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    marginVertical: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  glassPillarLeft: {
    position: 'absolute',
    left: 25,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
  },
  glassPillarRight: {
    position: 'absolute',
    right: 25,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(248, 250, 252, 0.15)',
  },
  glassGridCeiling: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  gridLineHorizontal: {
    height: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    marginTop: 20,
  },
  gridLineHorizontal2: {
    height: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    marginTop: 25,
  },
  gridLineVertical: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  gridLineVertical2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  silhouettesWrapper: {
    flexDirection: 'row',
    height: 140,
    width: '100%',
    position: 'relative',
    alignItems: 'flex-end',
    paddingBottom: 15,
  },
  silhouettePerson: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
  },
  silhouetteHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#94A3B8',
    marginBottom: 4,
  },
  silhouetteBody: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#64748B',
  },
  silhouetteGlowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
    opacity: 0.8,
  },
  scanTextContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  scanHeadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  scanSubtext: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#60A5FA',
    marginTop: 6,
  },

  /* Buttons */
  primaryFuturisticBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  gradientBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  secondaryFuturisticBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    marginTop: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
  },

  /* Radar Screen 2 */
  radarContainer: {
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: (width * 0.82) / 2,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    alignSelf: 'center',
    marginVertical: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  radarOuterRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  radarMidRing: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
  },
  radarInnerRing: {
    position: 'absolute',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
  },
  radarCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  radarScanLine: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: 'bottom left',
  },
  radarDot: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarDotHalo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
    opacity: 0.7,
  },
  radarCardBox: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    alignItems: 'center',
  },
  radarCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.4)',
    marginBottom: 8,
  },
  radarBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  radarObservationHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  radarObservationSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  radarPromptText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  /* Discovery Wheel Screen 3 */
  wheelContainer: {
    width: width * 0.75,
    height: width * 0.75,
    alignSelf: 'center',
    marginVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crystalWheelCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelSegment: {
    position: 'absolute',
    alignItems: 'center',
  },
  wheelIcon: {
    fontSize: 24,
  },
  wheelCenterButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  wheelCenterInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelSpinBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  qualityCardContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    marginTop: 10,
  },
  qualityCardIcon: {
    fontSize: 42,
  },
  qualityCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 6,
  },
  qualityCardPrompt: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#60A5FA',
    marginTop: 4,
    textAlign: 'center',
  },

  /* Screen 4 Impact Moment */
  impactActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  crystalBloomGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(96, 165, 250, 0.35)',
  },
  largeComplimentBtn: {
    width: width * 0.75,
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
  },
  largeBtnInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  largeBtnIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  largeBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  propagationBox: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#60A5FA',
    alignItems: 'center',
  },
  crystalPulseIconRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  crystalSparkle: {
    fontSize: 22,
    marginHorizontal: 6,
  },
  propagationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },

  /* Screen 5 Light Tower */
  fastForwardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    marginVertical: 12,
  },
  fastForwardLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  lightTowerContainer: {
    width: '100%',
    marginVertical: 16,
    alignItems: 'center',
  },
  floatingCrystalsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  floatingCrystal: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  towerLevelBlock: {
    width: '100%',
    height: 40,
    marginVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  towerLevelBlockActive: {
    borderColor: '#60A5FA',
  },
  towerLevelGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  towerLevelNum: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  towerLevelNumActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  towerLevelStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  motivationalCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#7C3AED',
    alignItems: 'center',
    marginTop: 10,
  },
  motivationalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  timerProgressText: {
    fontSize: 12,
    color: '#60A5FA',
    marginTop: 6,
    fontWeight: '600',
  },

  /* Screen 6 Celebration */
  celebrationTag: {
    fontSize: 12,
    fontWeight: '900',
    color: '#60A5FA',
    letterSpacing: 2,
    marginBottom: 10,
  },
  skylineContainer: {
    height: 220,
    width: '100%',
    backgroundColor: '#090D16',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 14,
  },
  skylineRisingCrystal: {
    position: 'absolute',
    alignItems: 'center',
  },
  bigAscendingCrystal: {
    fontSize: 48,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  building: {
    width: 65,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    justifyContent: 'space-around',
  },
  windowLight: {
    width: 10,
    height: 12,
    backgroundColor: '#60A5FA',
    margin: 3,
    borderRadius: 2,
  },
  achievementCard: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    marginVertical: 14,
  },
  achievementIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeMedalIcon: {
    fontSize: 36,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  achievementDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  pointsBadgeRow: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  earnedPointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#60A5FA',
  },
  completionQuoteText: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 12,
  },

  /* Dashboard Screen 7 */
  detailFloatingCrystalWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dashboardCrystalIcon: {
    fontSize: 64,
  },
  dashboardTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 10,
  },
  detailTowerContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    marginVertical: 12,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
    marginBottom: 10,
  },
  detailTowerGrid: {
    width: '100%',
  },
  detailTowerGridLevel: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    marginVertical: 2,
  },
  detailTowerLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  detailBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#7C3AED',
    width: '100%',
    marginVertical: 10,
  },
  detailBadgeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 12,
  },
  inspirationalQuoteBox: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#60A5FA',
    width: '100%',
    marginVertical: 10,
  },
  inspirationalQuoteText: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#60A5FA',
    textAlign: 'center',
    lineHeight: 22,
  },
});
