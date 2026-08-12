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
  AppState,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 480; // 8 minutes in seconds

export default function SayHelloTo3PeopleTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Task Steps:
  // 1: Detail Dashboard Screen (Intro)
  // 2: Start Your Quest (Neighborhood Street Footprints)
  // 3: Hello Map (Playful town map with 3 locations)
  // 4: Connection Streak (3 character avatars, tap to greet/wave)
  // 5: Positive Ripple (kindness ripple circles merging)
  // 6: Connection Timer (8-minute golden hour park timer)
  // 7: Final Celebration (Badge unlock & confetti)
  const [step, setStep] = useState(1);

  // Task State
  const [greeting1, setGreeting1] = useState(false);
  const [greeting2, setGreeting2] = useState(false);
  const [greeting3, setGreeting3] = useState(false);
  const [activeMapLocation, setActiveMapLocation] = useState<'neighborhood' | 'cafe' | 'park' | null>(null);

  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Animation values
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const handWaveAnim = useRef(new Animated.Value(0)).current;

  // Screen 2 footprints animations
  const footprint1Opacity = useRef(new Animated.Value(0)).current;
  const footprint2Opacity = useRef(new Animated.Value(0)).current;
  const footprint3Opacity = useRef(new Animated.Value(0)).current;
  const footprint4Opacity = useRef(new Animated.Value(0)).current;
  const footprint1Scale = useRef(new Animated.Value(0.7)).current;
  const footprint2Scale = useRef(new Animated.Value(0.7)).current;
  const footprint3Scale = useRef(new Animated.Value(0.7)).current;
  const footprint4Scale = useRef(new Animated.Value(0.7)).current;

  // Map Glowing locations animation
  const locationPulse = useRef(new Animated.Value(1)).current;

  // Character avatars spring scales
  const avatarScale1 = useRef(new Animated.Value(1)).current;
  const avatarScale2 = useRef(new Animated.Value(1)).current;
  const avatarScale3 = useRef(new Animated.Value(1)).current;

  // Background appState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Ambient effects state (particles)
  const [bubbles, setBubbles] = useState<{ id: number; left: number; speed: number; delay: number; scale: number }[]>([]);
  const [leaves, setLeaves] = useState<{ id: number; left: number; speed: number; delay: number; rotation: number }[]>([]);
  const [confetti, setConfetti] = useState<{ id: number; left: number; top: number; color: string; scale: number; speed: number }[]>([]);

  const encouragingQuotes = [
    '👋 "Every hello makes the next one easier."',
    '😊 "Confidence grows through small actions."',
    '🤝 "Connection starts with openness."',
    '🌞 "You chose courage today."',
  ];

  // Initialize bubbles, leaves, confetti
  useEffect(() => {
    const newBubbles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      speed: 3000 + Math.random() * 3000,
      delay: Math.random() * 2000,
      scale: 0.5 + Math.random() * 0.8,
    }));
    setBubbles(newBubbles);

    const newLeaves = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      speed: 4000 + Math.random() * 4000,
      delay: Math.random() * 3000,
      rotation: Math.random() * 360,
    }));
    setLeaves(newLeaves);

    const colors = ['#FF7A59', '#87CEEB', '#FFD54F', '#FF4081', '#4CAF50', '#9C27B0'];
    const newConfetti = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * width,
      top: -20 - Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.6 + Math.random() * 0.8,
      speed: 2500 + Math.random() * 2500,
    }));
    setConfetti(newConfetti);
  }, []);

  // Quote rotation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 6) {
      interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % encouragingQuotes.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // AppState listener for background timer tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 6 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(7);
            setIsActive(false);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [step, isActive, isPaused]);

  // Standard pulse animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(locationPulse, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(locationPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 6 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(7);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Pulse timer circle
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Hand waving loop on streak screen
  const startWaving = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(handWaveAnim, { toValue: 15, duration: 300, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(handWaveAnim, { toValue: -15, duration: 300, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    if (step === 4) {
      startWaving();
    }
  }, [step]);

  // Step transitions helper
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (nextStep === 5) {
          // Play positive ripple animation automatically
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            // Automatically transition to timer screen
            transitionToStep(6);
            setIsActive(true);
          });
        }
      });
    });
  };

  // API Call: Start Task
  const handleStartTask = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Say Hello to 3 People' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // Footprint Animation handler for Screen 2
  const runFootprintsAnimation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Animate footprints sequentially
    Animated.stagger(400, [
      Animated.parallel([
        Animated.timing(footprint1Opacity, { toValue: 0.9, duration: 400, useNativeDriver: true }),
        Animated.spring(footprint1Scale, { toValue: 1.1, friction: 5, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(footprint2Opacity, { toValue: 0.9, duration: 400, useNativeDriver: true }),
        Animated.spring(footprint2Scale, { toValue: 1.1, friction: 5, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(footprint3Opacity, { toValue: 0.9, duration: 400, useNativeDriver: true }),
        Animated.spring(footprint3Scale, { toValue: 1.1, friction: 5, useNativeDriver: true })
      ]),
      Animated.parallel([
        Animated.timing(footprint4Opacity, { toValue: 0.9, duration: 400, useNativeDriver: true }),
        Animated.spring(footprint4Scale, { toValue: 1.1, friction: 5, useNativeDriver: true })
      ])
    ]).start(() => {
      setTimeout(() => {
        transitionToStep(3); // Transition to map
      }, 600);
    });
  };

  // Save Progress inside map view
  const handleMapHelloDone = async (location: 'neighborhood' | 'cafe' | 'park') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let nextG1 = greeting1;
    let nextG2 = greeting2;
    let nextG3 = greeting3;

    if (location === 'neighborhood') {
      nextG1 = true;
      setGreeting1(true);
    } else if (location === 'cafe') {
      nextG2 = true;
      setGreeting2(true);
    } else if (location === 'park') {
      nextG3 = true;
      setGreeting3(true);
    }

    setActiveMapLocation(null);

    // Save progress to API
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-greeting-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Say Hello to 3 People',
            greeting1_completed: nextG1,
            greeting2_completed: nextG2,
            greeting3_completed: nextG3,
            timer_completion: false
          })
        });
      }
    } catch (e) {
      console.error('Error saving greeting progress:', e);
    }
  };

  // Greet Avatar triggers custom waves and springs
  const handleTapAvatar = async (num: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetScale = num === 1 ? avatarScale1 : num === 2 ? avatarScale2 : avatarScale3;

    Animated.sequence([
      Animated.timing(targetScale, { toValue: 1.25, duration: 150, useNativeDriver: true }),
      Animated.spring(targetScale, { toValue: 1.05, friction: 4, useNativeDriver: true })
    ]).start();

    // Trigger local completion toggle (should already be set true if map was pressed, but user is now completing the streak screen interaction)
    if (num === 1) setGreeting1(true);
    if (num === 2) setGreeting2(true);
    if (num === 3) setGreeting3(true);
  };

  // API Call: Final complete task and award points
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Say Hello to 3 People',
            greeting1_completed: greeting1,
            greeting2_completed: greeting2,
            greeting3_completed: greeting3,
            timer_completion: true
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '200',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0'
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Error', data.error || 'Failed to complete task');
        }
      } else {
        Alert.alert('Auth Error', 'Please log in again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }

    // Redirect to task success page
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You showed openness.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Developer fast-forward gesture
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Fast forward to 3 seconds
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Progress summary count
  const completedGreetingsCount = (greeting1 ? 1 : 0) + (greeting2 ? 1 : 0) + (greeting3 ? 1 : 0);

  // Hand waving rotation interpolation
  const spinWave = handWaveAnim.interpolate({
    inputRange: [-15, 15],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Abort Quest?',
                'Are you sure you want to exit? Your greeting milestones will be discarded.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => router.back() },
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={16} color="#FF7A59" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 6 && isActive && !isPaused && { backgroundColor: '#FF7A59' }]} />
            <Text style={styles.statusText}>
              {step === 6 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `HELLO.STEP_${step}`}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>
          
          {/* STEP 1: DETAIL DASHBOARD PAGE */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.mainEmoji}>👋</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Say Hello to 3 People</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(255, 122, 89, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#FF7A59' }]}>+300 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(135, 206, 235, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#2C8BB0' }]}>8 Min</Text>
                  </View>
                </View>
              </View>

              {/* Playful Dashboard Center Progress Badge */}
              <View style={styles.dashboardBadgeContainer}>
                <View style={styles.circularBadgeBg}>
                  <Text style={styles.dashboardBadgeNumber}>{completedGreetingsCount}/3</Text>
                  <Text style={styles.dashboardBadgeText}>Greetings Done</Text>
                </View>
              </View>

              {/* Quote Card */}
              <View style={styles.detailsCard}>
                <Feather name="message-circle" size={24} color="#FF7A59" style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={styles.quoteText}>
                  "Every friendship begins with a simple hello."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.cardDescription}>
                  A simple "Hello" can create a meaningful connection. Today, greet three different people.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FF7A59', '#FF633C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>👋 Start Connection Quest</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: START YOUR QUEST (Footprints leading forward) */}
          {step === 2 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={styles.introHeader}>
                <Text style={styles.introTitle}>"Three simple hellos can brighten three different days."</Text>
                <Text style={styles.introSubtitle}>"Small greetings build big confidence."</Text>
              </View>

              {/* Footprints path illustration */}
              <View style={styles.footprintsTrack}>
                <Animated.View style={[styles.footprint, { left: 40, top: 40, opacity: footprint1Opacity, transform: [{ scale: footprint1Scale }] }]}>
                  <FontAwesome5 name="shoe-prints" size={24} color="#FF7A59" style={{ transform: [{ rotate: '45deg' }] }} />
                </Animated.View>
                <Animated.View style={[styles.footprint, { right: 40, top: 100, opacity: footprint2Opacity, transform: [{ scale: footprint2Scale }] }]}>
                  <FontAwesome5 name="shoe-prints" size={24} color="#87CEEB" style={{ transform: [{ rotate: '15deg' }] }} />
                </Animated.View>
                <Animated.View style={[styles.footprint, { left: 50, top: 160, opacity: footprint3Opacity, transform: [{ scale: footprint3Scale }] }]}>
                  <FontAwesome5 name="shoe-prints" size={24} color="#FFD54F" style={{ transform: [{ rotate: '30deg' }] }} />
                </Animated.View>
                <Animated.View style={[styles.footprint, { right: 60, top: 220, opacity: footprint4Opacity, transform: [{ scale: footprint4Scale }] }]}>
                  <FontAwesome5 name="shoe-prints" size={24} color="#FF7A59" style={{ transform: [{ rotate: '5deg' }] }} />
                </Animated.View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={runFootprintsAnimation} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#FF7A59', '#FF633C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Lead the Way 👣</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: HELLO MAP */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Interactive Town Map</Text>
              <Text style={styles.stepSubtitle}>
                Select a location to greet someone, then tap "Hello Done" to light it up.
              </Text>

              {/* Map Illustration Frame */}
              <View style={styles.mapFrame}>
                {/* SVG Path Connector (drawn with layout elements) */}
                <View style={styles.mapConnectorLine} />

                {/* Destination 1: Neighborhood */}
                <TouchableOpacity
                  style={[
                    styles.mapLocationNode,
                    { left: '15%', top: '15%' },
                    greeting1 && styles.locationNodeGlowing,
                  ]}
                  onPress={() => setActiveMapLocation('neighborhood')}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[styles.nodeIconCircle, { transform: [{ scale: greeting1 ? 1 : locationPulse }] }]}>
                    <Text style={styles.nodeEmoji}>🏡</Text>
                  </Animated.View>
                  <Text style={styles.locationNodeText}>Neighborhood</Text>
                  {greeting1 && <View style={styles.checkBadge}><Feather name="check" size={10} color="#FFF" /></View>}
                </TouchableOpacity>

                {/* Destination 2: Cafe */}
                <TouchableOpacity
                  style={[
                    styles.mapLocationNode,
                    { right: '15%', top: '45%' },
                    greeting2 && styles.locationNodeGlowing,
                  ]}
                  onPress={() => setActiveMapLocation('cafe')}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[styles.nodeIconCircle, { transform: [{ scale: greeting2 ? 1 : locationPulse }] }]}>
                    <Text style={styles.nodeEmoji}>☕</Text>
                  </Animated.View>
                  <Text style={styles.locationNodeText}>Café</Text>
                  {greeting2 && <View style={styles.checkBadge}><Feather name="check" size={10} color="#FFF" /></View>}
                </TouchableOpacity>

                {/* Destination 3: Park */}
                <TouchableOpacity
                  style={[
                    styles.mapLocationNode,
                    { left: '25%', bottom: '15%' },
                    greeting3 && styles.locationNodeGlowing,
                  ]}
                  onPress={() => setActiveMapLocation('park')}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[styles.nodeIconCircle, { transform: [{ scale: greeting3 ? 1 : locationPulse }] }]}>
                    <Text style={styles.nodeEmoji}>🌳</Text>
                  </Animated.View>
                  <Text style={styles.locationNodeText}>Park</Text>
                  {greeting3 && <View style={styles.checkBadge}><Feather name="check" size={10} color="#FFF" /></View>}
                </TouchableOpacity>
              </View>

              {/* Map Location Actions Modal Drawer */}
              {activeMapLocation && (
                <View style={styles.drawerCard}>
                  <Text style={styles.drawerTitle}>
                    {activeMapLocation === 'neighborhood' && '🏡 Neighborhood Opportunity'}
                    {activeMapLocation === 'cafe' && '☕ Cafe Connection'}
                    {activeMapLocation === 'park' && '🌳 Park Interaction'}
                  </Text>
                  <Text style={styles.drawerDescription}>
                    {activeMapLocation === 'neighborhood' && 'Smile and greet a neighbor or someone walking nearby.'}
                    {activeMapLocation === 'cafe' && 'Say hello to a barista, cashier, or person waiting for their drink.'}
                    {activeMapLocation === 'park' && 'Say hello to a security guard, gardener, or passerby.'}
                  </Text>
                  <View style={styles.drawerButtonsRow}>
                    <TouchableOpacity
                      style={styles.cancelDrawerBtn}
                      onPress={() => setActiveMapLocation(null)}
                    >
                      <Text style={styles.cancelDrawerBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmDrawerBtn}
                      onPress={() => handleMapHelloDone(activeMapLocation)}
                    >
                      <Text style={styles.confirmDrawerBtnText}>Hello Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Proceed to Streak Screen if all three are finished */}
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { marginTop: 'auto' },
                  (!greeting1 || !greeting2 || !greeting3) && styles.disabledBtn,
                ]}
                disabled={!greeting1 || !greeting2 || !greeting3}
                onPress={() => transitionToStep(4)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={(!greeting1 || !greeting2 || !greeting3) ? ['#CBD5E1', '#94A3B8'] : ['#FF7A59', '#FF633C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Strengthen Connection Streak ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: CONNECTION STREAK */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Connection Streak</Text>
              <Text style={styles.stepSubtitle}>
                Tap each avatar to share a virtual greeting and watch them wave back!
              </Text>

              <View style={styles.avatarsRow}>
                {/* Person 1 */}
                <Pressable onPress={() => handleTapAvatar(1)}>
                  <Animated.View style={[
                    styles.avatarCard,
                    greeting1 && styles.avatarCardVibrant,
                    { transform: [{ scale: avatarScale1 }] }
                  ]}>
                    <Text style={styles.avatarEmoji}>{greeting1 ? '😄' : '😐'}</Text>
                    <Text style={styles.avatarLabel}>Person 1</Text>
                    {greeting1 && (
                      <Animated.View style={{ transform: [{ rotate: spinWave }] }}>
                        <Text style={styles.wavingHand}>👋</Text>
                      </Animated.View>
                    )}
                  </Animated.View>
                </Pressable>

                {/* Person 2 */}
                <Pressable onPress={() => handleTapAvatar(2)}>
                  <Animated.View style={[
                    styles.avatarCard,
                    greeting2 && styles.avatarCardVibrant,
                    { transform: [{ scale: avatarScale2 }] }
                  ]}>
                    <Text style={styles.avatarEmoji}>{greeting2 ? '😊' : '😐'}</Text>
                    <Text style={styles.avatarLabel}>Person 2</Text>
                    {greeting2 && (
                      <Animated.View style={{ transform: [{ rotate: spinWave }] }}>
                        <Text style={styles.wavingHand}>👋</Text>
                      </Animated.View>
                    )}
                  </Animated.View>
                </Pressable>

                {/* Person 3 */}
                <Pressable onPress={() => handleTapAvatar(3)}>
                  <Animated.View style={[
                    styles.avatarCard,
                    greeting3 && styles.avatarCardVibrant,
                    { transform: [{ scale: avatarScale3 }] }
                  ]}>
                    <Text style={styles.avatarEmoji}>{greeting3 ? '🥳' : '😐'}</Text>
                    <Text style={styles.avatarLabel}>Person 3</Text>
                    {greeting3 && (
                      <Animated.View style={{ transform: [{ rotate: spinWave }] }}>
                        <Text style={styles.wavingHand}>👋</Text>
                      </Animated.View>
                    )}
                  </Animated.View>
                </Pressable>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { marginTop: 'auto' },
                  (!greeting1 || !greeting2 || !greeting3) && styles.disabledBtn,
                ]}
                disabled={!greeting1 || !greeting2 || !greeting3}
                onPress={() => transitionToStep(5)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={(!greeting1 || !greeting2 || !greeting3) ? ['#CBD5E1', '#94A3B8'] : ['#FF7A59', '#FF633C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Spread Kindness Ripple ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: POSITIVE RIPPLE */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Kindness ripples overlay */}
              <View style={styles.rippleOuterFrame}>
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 3.5],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.8, 0.4, 0],
                      }),
                      borderColor: '#FF7A59',
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 2.5],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0.8, 0.3, 0],
                      }),
                      borderColor: '#87CEEB',
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.rippleCircle,
                    {
                      transform: [
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.1, 1.8],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, 0.9, 1],
                        outputRange: [0.9, 0.2, 0],
                      }),
                      borderColor: '#FFD54F',
                    },
                  ]}
                />
                
                {/* Center glowing circle */}
                <Animated.View style={[styles.rippleCenterNode, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.rippleCenterEmoji}>🌈</Text>
                </Animated.View>
              </View>

              <Text style={styles.rippleHeader}>"Kindness spreads further than you can see."</Text>
              <Text style={styles.rippleSubtitle}>Your three simple hellos are rippling out right now.</Text>
            </View>
          )}

          {/* STEP 6: CONNECTION TIMER (8 Minutes) */}
          {step === 6 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              {/* Soft City Park Ambient Background (using absolute view overlays) */}
              <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]}>
                <LinearGradient
                  colors={['#FFD54F', '#FF7A59', '#87CEEB']}
                  style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
                  locations={[0.1, 0.5, 0.9]}
                />
              </View>

              {/* Floating Bubbles Effect */}
              {bubbles.map((b) => (
                <Animated.View
                  key={b.id}
                  style={[
                    styles.bubble,
                    {
                      left: b.left,
                      transform: [{ scale: b.scale }],
                    },
                  ]}
                />
              ))}

              <View style={styles.timerTopInfo}>
                <Text style={styles.timerHeader}>Appreciate the Connection</Text>
                <Text style={styles.timerSubheading}>
                  Let the positive feelings sink in. Openness expands our comfort zone.
                </Text>
              </View>

              {/* Circular pulse countdown timer */}
              <View style={styles.timerCenterContainer}>
                <Animated.View
                  style={[
                    styles.timerOuterRing,
                    { transform: [{ scale: timerPulseAnim }] },
                  ]}
                />
                <View style={styles.timerInnerCircle}>
                  <Pressable onPress={handleDevSkip}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  </Pressable>
                  <Text style={styles.timerMinutesLabel}>Minutes Left</Text>
                </View>
              </View>

              {/* Encouraging Quote */}
              <View style={styles.timerQuoteBox}>
                <Text style={styles.timerQuoteText}>{encouragingQuotes[currentQuoteIndex]}</Text>
              </View>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={[styles.timerControlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timerControlBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 7: FINAL CELEBRATION */}
          {step === 7 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Confetti particles */}
              {confetti.map((c) => (
                <View
                  key={c.id}
                  style={[
                    styles.confettiPiece,
                    {
                      left: c.left,
                      top: c.top + 200,
                      backgroundColor: c.color,
                      transform: [{ scale: c.scale }, { rotate: `${c.id * 15}deg` }],
                    },
                  ]}
                />
              ))}

              <View style={styles.badgeWrapper}>
                <LinearGradient
                  colors={['#FFD54F', '#FF7A59']}
                  style={styles.badgeHalo}
                >
                  <Text style={styles.badgeEmoji}>🏅</Text>
                </LinearGradient>
              </View>

              <Text style={styles.celebrationHeader}>Connection Complete</Text>
              <Text style={styles.celebrationSubtext}>
                "You made the world a little friendlier today."
              </Text>

              {/* Gathered avatars at the bottom of success */}
              <View style={styles.gatheredAvatarsRow}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FF7A59' }]}><Text style={styles.gatheredEmoji}>😄</Text></View>
                <View style={[styles.avatarCircle, { backgroundColor: '#FFD54F' }]}><Text style={styles.gatheredEmoji}>😊</Text></View>
                <View style={[styles.avatarCircle, { backgroundColor: '#87CEEB' }]}><Text style={styles.gatheredEmoji}>🥳</Text></View>
              </View>

              <Text style={styles.questCompletionMessage}>"You showed openness."</Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FF7A59', '#FF5B33']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'Saving progress...' : 'Claim +200 Task Points'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 122, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7A59',
    letterSpacing: 0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 15,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFEBE5',
  },
  mainEmoji: {
    fontSize: 60,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mediumBadge: {
    backgroundColor: '#FFD54F',
  },
  mediumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C5E00',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dashboardBadgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFEEA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD54F',
    marginVertical: 15,
  },
  circularBadgeBg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardBadgeNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF7A59',
  },
  dashboardBadgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FBFBFC',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 10,
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  introHeader: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  footprintsTrack: {
    flex: 1,
    width: '100%',
    position: 'relative',
    marginVertical: 30,
  },
  footprint: {
    position: 'absolute',
    opacity: 0,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  mapFrame: {
    width: '100%',
    flex: 1,
    marginVertical: 20,
    backgroundColor: '#EAF8FF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#BFE5FF',
    position: 'relative',
    overflow: 'hidden',
  },
  mapConnectorLine: {
    position: 'absolute',
    width: '75%',
    height: '60%',
    left: '12%',
    top: '20%',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#A5D6A7',
    borderRadius: 80,
  },
  mapLocationNode: {
    position: 'absolute',
    alignItems: 'center',
    width: 100,
  },
  nodeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  nodeEmoji: {
    fontSize: 28,
  },
  locationNodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  locationNodeGlowing: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  checkBadge: {
    position: 'absolute',
    right: 15,
    top: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCard: {
    position: 'absolute',
    bottom: 75,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FF7A59',
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF7A59',
  },
  drawerDescription: {
    fontSize: 12,
    color: '#4B5563',
    marginVertical: 10,
    lineHeight: 18,
  },
  drawerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelDrawerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
  },
  cancelDrawerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  confirmDrawerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#FF7A59',
  },
  confirmDrawerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 60,
  },
  avatarCard: {
    width: width * 0.25,
    height: 160,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarCardVibrant: {
    backgroundColor: '#FFF0EC',
    borderColor: '#FF7A59',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  wavingHand: {
    fontSize: 22,
    position: 'absolute',
    bottom: -15,
    left: -11,
  },
  rippleOuterFrame: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 40,
  },
  rippleCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    opacity: 0,
  },
  rippleCenterNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  rippleCenterEmoji: {
    fontSize: 40,
  },
  rippleHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF7A59',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  rippleSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  timerTopInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  timerHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  timerSubheading: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  timerCenterContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  timerOuterRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#FFD54F',
    backgroundColor: 'rgba(255, 213, 79, 0.08)',
  },
  timerInnerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  timerText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FF7A59',
    letterSpacing: 1,
  },
  timerMinutesLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerQuoteBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    marginVertical: 15,
  },
  timerQuoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  timerControlsRow: {
    width: '100%',
    marginBottom: 20,
  },
  timerControlBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  resumeBtn: {
    backgroundColor: '#FF7A59',
  },
  timerControlBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  badgeWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeHalo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 68,
  },
  celebrationHeader: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
  },
  celebrationSubtext: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  gatheredAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: -15,
    marginVertical: 25,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gatheredEmoji: {
    fontSize: 24,
  },
  questCompletionMessage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF7A59',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  claimBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bubble: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    bottom: 50,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 12,
    borderRadius: 2,
  },
});
