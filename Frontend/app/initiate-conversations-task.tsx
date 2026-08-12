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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 720; // 12 minutes in seconds (720s)

interface IcebreakerStyle {
  id: string;
  emoji: string;
  name: string;
  description: string;
  starterPrompt: string;
  gradient: [string, string];
}

const ICEBREAKER_STYLES: IcebreakerStyle[] = [
  {
    id: 'compliment',
    emoji: '😊',
    name: 'Compliment',
    description: "Comment positively on someone's outfit, effort, or energy.",
    starterPrompt: '"Hey! I loved your style—where did you get that?"',
    gradient: ['#5B5FEE', '#38BDF8'],
  },
  {
    id: 'observation',
    emoji: '🌤',
    name: 'Observation',
    description: 'Notice a shared moment or detail around you both.',
    starterPrompt: '"Pretty busy around here today, isn\'t it?"',
    gradient: ['#38BDF8', '#6EE7B7'],
  },
  {
    id: 'curious',
    emoji: '❓',
    name: 'Curious Question',
    description: 'Ask a simple, engaging question about a place or item.',
    starterPrompt: '"Excuse me, do you happen to know if this place is good?"',
    gradient: ['#6EE7B7', '#5B5FEE'],
  },
  {
    id: 'situation',
    emoji: '🎯',
    name: 'Shared Situation',
    description: 'Acknowledge waiting in line, a delay, or an event together.',
    starterPrompt: '"Looks like we are both waiting for the same thing!"',
    gradient: ['#818CF8', '#38BDF8'],
  },
  {
    id: 'humor',
    emoji: '😂',
    name: 'Light Humor',
    description: 'Make a gentle, lighthearted remark to break the ice.',
    starterPrompt: '"Hope we don\'t fall asleep before this line moves!"',
    gradient: ['#38BDF8', '#A7F3D0'],
  },
  {
    id: 'everyday',
    emoji: '☕',
    name: 'Everyday Chat',
    description: 'Start a casual, warm "How\'s your day going so far?".',
    starterPrompt: '"Hi! How has your day been going so far?"',
    gradient: ['#5B5FEE', '#6EE7B7'],
  },
];

const MOTIVATIONAL_MESSAGES = [
  '💬 "The first words are always the hardest."',
  '✨ "Momentum grows with every interaction."',
  '🤝 "Initiative creates opportunity."',
  '🌟 "You are becoming more socially confident."',
];

export default function InitiateConversationsTaskScreen() {
  const router = useRouter();

  // Navigation / Workflow Steps:
  // 0: Task Detail Overview / Intro Dashboard
  // 1: SCREEN 1 — FIRST SPARK (Floating Sparks & Ignition)
  // 2: SCREEN 2 — SPARK SELECTOR (Orb selection for Conv 1 & Conv 2)
  // 3: SCREEN 3 — CONNECTION CONSTELLATION (Confirming 2 Conversations & Constellation light up)
  // 4: SCREEN 4 & 5 — MOMENTUM FLOW & INITIATIVE MOMENT (12-Min Energy Streams & Beacon)
  // 5: FINAL CELEBRATION (Sparks Merge, Badge Unlock & Point Award)
  // 6: COMPLETED TASK DASHBOARD (Futuristic Overview with Stats & Badges)
  const [step, setStep] = useState<number>(0);

  // Selected Icebreaker Styles
  const [style1, setStyle1] = useState<IcebreakerStyle | null>(null);
  const [style2, setStyle2] = useState<IcebreakerStyle | null>(null);
  const [selectingFor, setSelectingFor] = useState<'conv1' | 'conv2'>('conv1');

  // Conversation Completions
  const [conv1Completed, setConv1Completed] = useState<boolean>(false);
  const [conv2Completed, setConv2Completed] = useState<boolean>(false);

  // Timer & Momentum Flow
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Screen 1 Sparks Animation
  const spark1X = useRef(new Animated.Value(-40)).current;
  const spark2X = useRef(new Animated.Value(40)).current;
  const sparkScale = useRef(new Animated.Value(1)).current;
  const sparkPulse = useRef(new Animated.Value(0.8)).current;

  // Screen 2 Orb Expansion Animation
  const selectedOrbScale = useRef(new Animated.Value(1)).current;

  // Screen 3 Constellation Line Beams
  const lineBeam1 = useRef(new Animated.Value(0)).current;
  const lineBeam2 = useRef(new Animated.Value(0)).current;

  // Screen 4 Energy Streams Flow
  const streamFlowAnim = useRef(new Animated.Value(0)).current;
  const beaconPulse = useRef(new Animated.Value(1)).current;

  // Final Celebration Sparks Merge
  const sparkMergeDist = useRef(new Animated.Value(80)).current;
  const starGlowScale = useRef(new Animated.Value(0)).current;

  // AppState Timer Tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Ambient particles
  const [particles] = useState(() =>
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 2 + 1,
    }))
  );

  // Initial Load & Existing Progress Fetch
  useEffect(() => {
    fetchExistingProgress();
  }, []);

  const fetchExistingProgress = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const res = await apiFetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.tasks) {
        const thisTask = data.tasks.find((t: any) => t.title === 'Initiate 2 Conversations');
        if (thisTask && thisTask.status === 'completed') {
          setStep(6); // Show completed dashboard directly
          setConv1Completed(true);
          setConv2Completed(true);

          // Fetch stored detailed response
          if (thisTask.id) {
            const respRes = await apiFetch('/api/tasks/initiate-conversations-response/${thisTask.id}', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (respRes.ok) {
              const contentType = respRes.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const respData = await respRes.json();
                if (respData && respData.data) {
                  if (respData.data.icebreaker_style_1) {
                    const s1 = ICEBREAKER_STYLES.find(s => s.id === respData.data.icebreaker_style_1 || s.name === respData.data.icebreaker_style_1);
                    if (s1) setStyle1(s1);
                  }
                  if (respData.data.icebreaker_style_2) {
                    const s2 = ICEBREAKER_STYLES.find(s => s.id === respData.data.icebreaker_style_2 || s.name === respData.data.icebreaker_style_2);
                    if (s2) setStyle2(s2);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching task progress:', e);
    }
  };

  // Pulse animations for sparks
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkPulse, {
          toValue: 1.3,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkPulse, {
          toValue: 0.8,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Energy Stream flow loop
  useEffect(() => {
    if (step === 4) {
      Animated.loop(
        Animated.timing(streamFlowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(beaconPulse, {
            toValue: 1.15,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(beaconPulse, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [step]);

  // Quote rotation during Momentum Flow
  useEffect(() => {
    let quoteInterval: any = null;
    if (step === 4 && isActive) {
      quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
      }, 7000);
    }
    return () => clearInterval(quoteInterval);
  }, [step, isActive]);

  // Timer logic for Screen 4 (Momentum Flow)
  useEffect(() => {
    let interval: any = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimerCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  // AppState change listener for accurate timer backgrounding
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isActive && !isPaused && endTimeRef.current > 0) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handleTimerCompleted();
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        if (isActive && !isPaused) {
          endTimeRef.current = Date.now() + timeLeft * 1000;
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isActive, isPaused, timeLeft]);

  // Transition animation helper
  const animateToStep = (newStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  // Screen 1: Ignite Button Press
  const handleIgniteSparks = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(spark1X, { toValue: -10, duration: 600, useNativeDriver: true }),
      Animated.timing(spark2X, { toValue: 10, duration: 600, useNativeDriver: true }),
      Animated.timing(sparkScale, { toValue: 1.6, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      saveProgress({ style1: style1?.name, style2: style2?.name });
      animateToStep(2);
    });
  };

  // Screen 2: Select Icebreaker Orb
  const handleSelectOrb = (style: IcebreakerStyle) => {
    Haptics.selectionAsync();

    if (selectingFor === 'conv1') {
      setStyle1(style);
      Animated.sequence([
        Animated.timing(selectedOrbScale, { toValue: 1.25, duration: 250, useNativeDriver: true }),
        Animated.timing(selectedOrbScale, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      saveProgress({ style1: style.name });

      setTimeout(() => {
        setSelectingFor('conv2');
      }, 500);
    } else {
      if (style.id === style1?.id) {
        Alert.alert('Different Style Required', 'Please choose a different icebreaker style for your second conversation to challenge yourself!');
        return;
      }
      setStyle2(style);
      Animated.sequence([
        Animated.timing(selectedOrbScale, { toValue: 1.25, duration: 250, useNativeDriver: true }),
        Animated.timing(selectedOrbScale, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      saveProgress({ style1: style1?.name, style2: style.name });

      setTimeout(() => {
        animateToStep(3);
      }, 600);
    }
  };

  // Screen 3: Confirm Conversations
  const toggleConv1 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const nextVal = !conv1Completed;
    setConv1Completed(nextVal);

    if (nextVal) {
      Animated.timing(lineBeam1, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    } else {
      Animated.timing(lineBeam1, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }

    saveProgress({
      style1: style1?.name,
      style2: style2?.name,
      conv1_completed: nextVal,
      conv2_completed: conv2Completed,
      total_conversations_completed: (nextVal ? 1 : 0) + (conv2Completed ? 1 : 0),
    });
  };

  const toggleConv2 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const nextVal = !conv2Completed;
    setConv2Completed(nextVal);

    if (nextVal) {
      Animated.timing(lineBeam2, { toValue: 1, duration: 800, useNativeDriver: false }).start();
    } else {
      Animated.timing(lineBeam2, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }

    saveProgress({
      style1: style1?.name,
      style2: style2?.name,
      conv1_completed: conv1Completed,
      conv2_completed: nextVal,
      total_conversations_completed: (conv1Completed ? 1 : 0) + (nextVal ? 1 : 0),
    });
  };

  const handleStartMomentumFlow = () => {
    if (!conv1Completed || !conv2Completed) {
      Alert.alert('Confirm Both Conversations', 'Please initiate and confirm both conversations to build full social momentum!');
      return;
    }

    setIsActive(true);
    setIsPaused(false);
    endTimeRef.current = Date.now() + timeLeft * 1000;

    startTaskBackend();
    animateToStep(4);
  };

  const startTaskBackend = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const res = await apiFetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.tasks) {
        const thisTask = data.tasks.find((t: any) => t.title === 'Initiate 2 Conversations');
        if (thisTask) {
          await apiFetch('/api/tasks/${thisTask.id}/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
  };

  const handleTimerCompleted = () => {
    setIsActive(false);

    Animated.parallel([
      Animated.timing(sparkMergeDist, { toValue: 0, duration: 1200, useNativeDriver: true }),
      Animated.timing(starGlowScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start(() => {
      completeTaskFinal();
    });
  };

  const handleFastForwardTimer = () => {
    setTimeLeft(3);
    endTimeRef.current = Date.now() + 3000;
  };

  const completeTaskFinal = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        animateToStep(5);
        return;
      }

      await saveProgress({
        style1: style1?.name,
        style2: style2?.name,
        conv1_completed: true,
        conv2_completed: true,
        total_conversations_completed: 2,
        timer_completion: true,
      });

      const res = await apiFetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        let taskId = null;
        if (data && data.tasks) {
          const thisTask = data.tasks.find((t: any) => t.title === 'Initiate 2 Conversations');
          if (thisTask) taskId = thisTask.id;
        }

        if (taskId) {
          const compRes = await apiFetch('/api/tasks/${taskId}/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          });
          if (compRes.ok) {
            const compData = await compRes.json();
            if (compData && compData.points_rewarded) {
              setPointsAwarded(compData.points_rewarded);
            } else {
              setPointsAwarded(300);
            }
          } else {
            setPointsAwarded(300);
          }
        } else {
          setPointsAwarded(300);
        }
      } else {
        setPointsAwarded(300);
      }

      animateToStep(5);
    } catch (e) {
      console.error('Error completing task:', e);
      setPointsAwarded(300);
      animateToStep(5);
    }
  };

  const saveProgress = async (payload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      await apiFetch('/api/tasks/save-initiate-conversations-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Initiate 2 Conversations',
          ...payload,
        }),
      });
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderBackgroundSparks = () => (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((p) => (
        <View
          key={p.id}
          style={[
            styles.particleSpark,
            {
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Main Canvas Background Gradient */}
      <LinearGradient
        colors={['#0A0E1A', '#0F172A', '#1E1B4B']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {renderBackgroundSparks()}

      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (step > 0 && step < 5) {
              animateToStep(step - 1);
            } else {
              router.back();
            }
          }}
        >
          <Feather name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>✨💬 HARD SOCIAL INITIATIVE</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Animated Body Content Container */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {/* =================================================== */}
        {/* STEP 0: TASK DETAIL OVERVIEW DASHBOARD */}
        {/* =================================================== */}
        {step === 0 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardHeroCard}>
              <LinearGradient colors={['rgba(91, 95, 238, 0.25)', 'rgba(56, 189, 248, 0.1)']} style={styles.heroGradient}>
                <View style={styles.constellationArtwork}>
                  <Svg height="140" width="220" viewBox="0 0 220 140">
                    <Defs>
                      <SvgLinearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#5B5FEE" stopOpacity="0.8" />
                        <Stop offset="0.5" stopColor="#38BDF8" stopOpacity="0.9" />
                        <Stop offset="1" stopColor="#6EE7B7" stopOpacity="0.8" />
                      </SvgLinearGradient>
                    </Defs>
                    <Line x1="40" y1="70" x2="110" y2="40" stroke="url(#heroLineGrad)" strokeWidth="2.5" strokeDasharray="4,4" />
                    <Line x1="180" y1="70" x2="110" y2="40" stroke="url(#heroLineGrad)" strokeWidth="2.5" strokeDasharray="4,4" />

                    <Circle cx="40" cy="70" r="14" fill="#5B5FEE" opacity="0.4" />
                    <Circle cx="40" cy="70" r="8" fill="#38BDF8" />
                    <Circle cx="40" cy="70" r="3" fill="#FFFFFF" />

                    <Circle cx="110" cy="40" r="18" fill="#38BDF8" opacity="0.3" />
                    <Circle cx="110" cy="40" r="10" fill="#6EE7B7" />
                    <Circle cx="110" cy="40" r="4" fill="#FFFFFF" />

                    <Circle cx="180" cy="70" r="14" fill="#5B5FEE" opacity="0.4" />
                    <Circle cx="180" cy="70" r="8" fill="#38BDF8" />
                    <Circle cx="180" cy="70" r="3" fill="#FFFFFF" />
                  </Svg>
                </View>
                <Text style={styles.heroTitle}>Initiate 2 Conversations</Text>
                <Text style={styles.heroSubtitle}>2 Real Connections • 12 Minutes • +300 Points</Text>
              </LinearGradient>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionHeader}>TASK DESCRIPTION</Text>
              <Text style={styles.descriptionBody}>
                Great conversations don't happen by waiting.{'\n\n'}
                They begin because someone chooses to take the first step.{'\n\n'}
                Today, start two separate conversations with two different people.{'\n\n'}
                They don't have to be long. They only need to be genuine.
              </Text>
            </View>

            <View style={styles.examplesCard}>
              <Text style={styles.examplesHeader}>💡 CONVERSATION EXAMPLES</Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Ask how someone's day is going.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Talk about the weather or environment.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Comment on something around you both.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Ask about their work, studies, or plans.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Start a casual chat while waiting in line.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => animateToStep(1)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#5B5FEE', '#38BDF8']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>Begin Challenge ✨</Text>
                <Feather name="arrow-right" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 1 — FIRST SPARK */}
        {/* =================================================== */}
        {step === 1 && (
          <View style={styles.centerContainer}>
            <View style={styles.sparksStage}>
              <Animated.View
                style={[
                  styles.sparkOrb,
                  styles.sparkLeft,
                  {
                    transform: [{ translateX: spark1X }, { scale: sparkScale }, { scale: sparkPulse }],
                  },
                ]}
              >
                <View style={styles.sparkInnerGlowCyan} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.sparkOrb,
                  styles.sparkRight,
                  {
                    transform: [{ translateX: spark2X }, { scale: sparkScale }, { scale: sparkPulse }],
                  },
                ]}
              >
                <View style={styles.sparkInnerGlowMint} />
              </Animated.View>
            </View>

            <Text style={styles.screen1Heading}>
              "Every meaningful connection begins with one small spark."
            </Text>
            <Text style={styles.screen1Subtext}>
              Today you'll create two.
            </Text>

            <TouchableOpacity
              style={[styles.primaryActionButton, { marginTop: 48 }]}
              onPress={handleIgniteSparks}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#5B5FEE', '#38BDF8']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>✨ Ignite Conversations</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================== */}
        {/* SCREEN 2 — SPARK SELECTOR */}
        {/* =================================================== */}
        {step === 2 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.selectorHeaderBox}>
              <Text style={styles.selectorStepTitle}>
                {selectingFor === 'conv1' ? 'FIRST SPARK: CONVERSATION 1' : 'SECOND SPARK: CONVERSATION 2'}
              </Text>
              <Text style={styles.selectorHeading}>
                {selectingFor === 'conv1'
                  ? 'Select an icebreaker style for your 1st conversation:'
                  : 'Choose a DIFFERENT icebreaker style for your 2nd conversation:'}
              </Text>
            </View>

            <View style={styles.orbsGrid}>
              {ICEBREAKER_STYLES.map((style) => {
                const isConv1Selected = style1?.id === style.id;
                const isConv2Selected = style2?.id === style.id;
                const isDisabled = selectingFor === 'conv2' && isConv1Selected;

                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.orbCard,
                      (isConv1Selected || isConv2Selected) && styles.orbCardSelected,
                      isDisabled && styles.orbCardDisabled,
                    ]}
                    onPress={() => handleSelectOrb(style)}
                    disabled={isDisabled}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isDisabled ? ['#1E293B', '#0F172A'] : style.gradient}
                      style={styles.orbGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.orbEmoji}>{style.emoji}</Text>
                      <Text style={styles.orbName}>{style.name}</Text>
                      <Text style={styles.orbDesc} numberOfLines={2}>
                        {style.description}
                      </Text>
                      {isConv1Selected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>Conv 1 Choice</Text>
                        </View>
                      )}
                      {isConv2Selected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>Conv 2 Choice</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {style1 && (
              <View style={styles.selectedSummaryCard}>
                <Text style={styles.selectedSummaryTitle}>⭐ CONVERSATION 1 STYLE:</Text>
                <Text style={styles.selectedSummaryText}>
                  {style1.emoji} {style1.name} — {style1.starterPrompt}
                </Text>
              </View>
            )}
            {style2 && (
              <View style={styles.selectedSummaryCard}>
                <Text style={styles.selectedSummaryTitle}>⭐ CONVERSATION 2 STYLE:</Text>
                <Text style={styles.selectedSummaryText}>
                  {style2.emoji} {style2.name} — {style2.starterPrompt}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 3 — CONNECTION CONSTELLATION */}
        {/* =================================================== */}
        {step === 3 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.constellationHeaderBox}>
              <Text style={styles.constellationTitle}>Connection Constellation</Text>
              <Text style={styles.constellationSubtext}>
                "Every conversation adds a new point of confidence."
              </Text>
            </View>

            <View style={styles.skyCanvasContainer}>
              <Svg height="220" width={width - 48} viewBox="0 0 320 220">
                <Defs>
                  <SvgLinearGradient id="beam1Grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#5B5FEE" stopOpacity="0.9" />
                    <Stop offset="1" stopColor="#38BDF8" stopOpacity="0.9" />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="beam2Grad" x1="1" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#6EE7B7" stopOpacity="0.9" />
                    <Stop offset="1" stopColor="#38BDF8" stopOpacity="0.9" />
                  </SvgLinearGradient>
                </Defs>

                <Line
                  x1="70"
                  y1="140"
                  x2="160"
                  y2="60"
                  stroke={conv1Completed ? 'url(#beam1Grad)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={conv1Completed ? 3.5 : 1.5}
                  strokeDasharray={conv1Completed ? undefined : '4,4'}
                />
                <Line
                  x1="250"
                  y1="140"
                  x2="160"
                  y2="60"
                  stroke={conv2Completed ? 'url(#beam2Grad)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={conv2Completed ? 3.5 : 1.5}
                  strokeDasharray={conv2Completed ? undefined : '4,4'}
                />
                {conv1Completed && conv2Completed && (
                  <Line
                    x1="70"
                    y1="140"
                    x2="250"
                    y2="140"
                    stroke="#6EE7B7"
                    strokeWidth="3"
                  />
                )}

                <Circle cx="70" cy="140" r={conv1Completed ? '22' : '16'} fill="#5B5FEE" opacity={conv1Completed ? '0.6' : '0.2'} />
                <Circle cx="70" cy="140" r={conv1Completed ? '12' : '8'} fill={conv1Completed ? '#38BDF8' : '#475569'} />
                <Circle cx="70" cy="140" r="4" fill="#FFFFFF" />

                <Circle cx="160" cy="60" r={conv1Completed && conv2Completed ? '28' : '18'} fill="#38BDF8" opacity={conv1Completed && conv2Completed ? '0.6' : '0.2'} />
                <Circle cx="160" cy="60" r={conv1Completed && conv2Completed ? '16' : '10'} fill={conv1Completed && conv2Completed ? '#6EE7B7' : '#475569'} />
                <Circle cx="160" cy="60" r="5" fill="#FFFFFF" />

                <Circle cx="250" cy="140" r={conv2Completed ? '22' : '16'} fill="#6EE7B7" opacity={conv2Completed ? '0.6' : '0.2'} />
                <Circle cx="250" cy="140" r={conv2Completed ? '12' : '8'} fill={conv2Completed ? '#38BDF8' : '#475569'} />
                <Circle cx="250" cy="140" r="4" fill="#FFFFFF" />
              </Svg>
            </View>

            <View style={styles.toggleCardsBox}>
              <TouchableOpacity
                style={[styles.convToggleCard, conv1Completed && styles.convToggleCardCompleted]}
                onPress={toggleConv1}
                activeOpacity={0.8}
              >
                <View style={styles.convToggleIconBox}>
                  <Text style={styles.convToggleEmoji}>{style1?.emoji || '💬'}</Text>
                </View>
                <View style={styles.convToggleTextBox}>
                  <Text style={styles.convToggleTitle}>⭐ Conversation One ({style1?.name || 'Style 1'})</Text>
                  <Text style={styles.convToggleSub}>
                    {conv1Completed ? 'Confirmed Complete! Beam Connected ✨' : 'Tap to confirm conversation completed'}
                  </Text>
                </View>
                <Ionicons
                  name={conv1Completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={conv1Completed ? '#6EE7B7' : '#64748B'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.convToggleCard, conv2Completed && styles.convToggleCardCompleted]}
                onPress={toggleConv2}
                activeOpacity={0.8}
              >
                <View style={styles.convToggleIconBox}>
                  <Text style={styles.convToggleEmoji}>{style2?.emoji || '💬'}</Text>
                </View>
                <View style={styles.convToggleTextBox}>
                  <Text style={styles.convToggleTitle}>⭐ Conversation Two ({style2?.name || 'Style 2'})</Text>
                  <Text style={styles.convToggleSub}>
                    {conv2Completed ? 'Confirmed Complete! Beam Connected ✨' : 'Tap to confirm conversation completed'}
                  </Text>
                </View>
                <Ionicons
                  name={conv2Completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={conv2Completed ? '#6EE7B7' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryActionButton,
                (!conv1Completed || !conv2Completed) && styles.buttonDisabled,
              ]}
              onPress={handleStartMomentumFlow}
              disabled={!conv1Completed || !conv2Completed}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={conv1Completed && conv2Completed ? ['#5B5FEE', '#6EE7B7'] : ['#334155', '#1E293B']}
                style={styles.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Proceed to Momentum Flow →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 4 & 5 — MOMENTUM FLOW & INITIATIVE BEACON */}
        {/* =================================================== */}
        {step === 4 && (
          <View style={styles.momentumContainer}>
            <View style={styles.beaconStage}>
              <Animated.View
                style={[
                  styles.centralBeacon,
                  {
                    transform: [{ scale: beaconPulse }],
                  },
                ]}
              >
                <LinearGradient colors={['#6EE7B7', '#38BDF8', '#5B5FEE']} style={styles.beaconGradient}>
                  <MaterialCommunityIcons name="lightning-bolt" size={40} color="#FFF" />
                </LinearGradient>
              </Animated.View>

              <Svg height="240" width={width} style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <SvgLinearGradient id="streamLeft" x1="0" y1="1" x2="0.5" y2="0.5">
                    <Stop offset="0" stopColor="#5B5FEE" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#38BDF8" stopOpacity="1" />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="streamRight" x1="1" y1="1" x2="0.5" y2="0.5">
                    <Stop offset="0" stopColor="#6EE7B7" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#38BDF8" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>

                <Path d={`M 30 220 Q ${width * 0.25} 150 ${width * 0.5} 120`} stroke="url(#streamLeft)" strokeWidth="4" fill="none" />
                <Path d={`M ${width - 30} 220 Q ${width * 0.75} 150 ${width * 0.5} 120`} stroke="url(#streamRight)" strokeWidth="4" fill="none" />
              </Svg>
            </View>

            <View style={styles.timerHudBox}>
              <Text style={styles.timerHudLabel}>12-MINUTE MOMENTUM INTEGRATION</Text>
              <Text style={styles.timerHudValue}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerHudSub}>Both conversation energy streams active</Text>
            </View>

            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>{MOTIVATIONAL_MESSAGES[currentQuoteIndex]}</Text>
            </View>

            <View style={styles.timerControlsRow}>
              <TouchableOpacity
                style={styles.timerControlBtn}
                onPress={() => setIsPaused(!isPaused)}
              >
                <Feather name={isPaused ? 'play' : 'pause'} size={20} color="#FFF" />
                <Text style={styles.timerControlText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timerFastForwardBtn}
                onPress={handleFastForwardTimer}
              >
                <Ionicons name="flash" size={18} color="#6EE7B7" />
                <Text style={styles.timerFastForwardText}>Complete Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 5: FINAL CELEBRATION */}
        {/* =================================================== */}
        {step === 5 && (
          <View style={styles.centerContainer}>
            <View style={styles.celebrationStarBox}>
              <LinearGradient colors={['#5B5FEE', '#38BDF8', '#6EE7B7']} style={styles.starGradient}>
                <Ionicons name="sparkles" size={54} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={styles.celebrationBadgeTitle}>🏅 INITIATIVE UNLOCKED</Text>
            <Text style={styles.celebrationMainHeading}>
              "You didn't wait for connection—you created it twice."
            </Text>
            <Text style={styles.celebrationCompletionMsg}>
              "You took initiative."
            </Text>

            <View style={styles.pointsAwardCard}>
              <Text style={styles.pointsAwardValue}>+{pointsAwarded || 300}</Text>
              <Text style={styles.pointsAwardLabel}>TASK POINTS AWARDED</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionButton, { marginTop: 32 }]}
              onPress={() => animateToStep(6)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#6EE7B7', '#38BDF8']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>View Dashboard 🏆</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 6: COMPLETED TASK DETAIL DASHBOARD */}
        {/* =================================================== */}
        {step === 6 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.completedHeroCard}>
              <LinearGradient colors={['#1E1B4B', '#0F172A']} style={styles.completedGradient}>
                <View style={styles.completedArtworkBox}>
                  <Svg height="160" width="240" viewBox="0 0 240 160">
                    <Defs>
                      <SvgLinearGradient id="compLineGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#5B5FEE" />
                        <Stop offset="0.5" stopColor="#38BDF8" />
                        <Stop offset="1" stopColor="#6EE7B7" />
                      </SvgLinearGradient>
                    </Defs>
                    <Line x1="50" y1="80" x2="120" y2="40" stroke="url(#compLineGrad)" strokeWidth="3" />
                    <Line x1="190" y1="80" x2="120" y2="40" stroke="url(#compLineGrad)" strokeWidth="3" />
                    <Line x1="50" y1="80" x2="190" y2="80" stroke="url(#compLineGrad)" strokeWidth="3" />

                    <Circle cx="50" cy="80" r="16" fill="#5B5FEE" opacity="0.4" />
                    <Circle cx="50" cy="80" r="10" fill="#38BDF8" />
                    <Circle cx="50" cy="80" r="4" fill="#FFFFFF" />

                    <Circle cx="190" cy="80" r="16" fill="#6EE7B7" opacity="0.4" />
                    <Circle cx="190" cy="80" r="10" fill="#38BDF8" />
                    <Circle cx="190" cy="80" r="4" fill="#FFFFFF" />

                    <Circle cx="120" cy="40" r="22" fill="#38BDF8" opacity="0.4" />
                    <Circle cx="120" cy="40" r="12" fill="#6EE7B7" />
                    <Circle cx="120" cy="40" r="5" fill="#FFFFFF" />
                  </Svg>
                </View>
                <Text style={styles.completedHeroTitle}>Initiate 2 Conversations</Text>
                <View style={styles.completedBadgePill}>
                  <Text style={styles.completedBadgePillText}>🏅 Initiative Unlocked</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.completedStatsCard}>
              <Text style={styles.sectionHeader}>COMPLETED JOURNEY SUMMARY</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>{style1?.emoji || '😊'}</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Conversation 1: {style1?.name || 'Compliment'}</Text>
                  <Text style={styles.summaryDesc}>{style1?.description || 'Initiated first genuine connection.'}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>{style2?.emoji || '🌤'}</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Conversation 2: {style2?.name || 'Observation'}</Text>
                  <Text style={styles.summaryDesc}>{style2?.description || 'Initiated second genuine connection.'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.quoteBoxCard}>
              <Text style={styles.quoteBoxText}>
                "Confidence isn't found. It's created every time you begin."
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                router.replace({
                  pathname: '/task-success',
                  params: {
                    points: '300',
                    taskName: 'Initiate 2 Conversations',
                    message: 'You took initiative.',
                    difficulty: 'hard',
                    badge: 'Initiative Unlocked'
                  }
                } as any);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#5B5FEE', '#38BDF8']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>Continue to Well Done 🎉</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 95, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(91, 95, 238, 0.4)',
  },
  headerBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Dashboard Overview Styles
  dashboardHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  constellationArtwork: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6EE7B7',
    marginTop: 4,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  descriptionBody: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  examplesCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(91, 95, 238, 0.3)',
  },
  examplesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6EE7B7',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    color: '#38BDF8',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  primaryActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  primaryGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Screen 1 Styles
  sparksStage: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  sparkOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkLeft: {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
  },
  sparkRight: {
    backgroundColor: 'rgba(110, 231, 183, 0.3)',
  },
  sparkInnerGlowCyan: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
  },
  sparkInnerGlowMint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6EE7B7',
  },
  screen1Heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  screen1Subtext: {
    fontSize: 16,
    color: '#38BDF8',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Screen 2 Styles
  selectorHeaderBox: {
    marginBottom: 20,
    marginTop: 10,
  },
  selectorStepTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  selectorHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  orbsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  orbCard: {
    width: (width - 52) / 2,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbCardSelected: {
    borderColor: '#6EE7B7',
    borderWidth: 2,
  },
  orbCardDisabled: {
    opacity: 0.35,
  },
  orbGradient: {
    padding: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  orbEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  orbName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  orbDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 15,
  },
  selectedBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  selectedSummaryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  selectedSummaryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  selectedSummaryText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },

  // Screen 3 Styles
  constellationHeaderBox: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  constellationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  constellationSubtext: {
    fontSize: 13,
    color: '#38BDF8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  skyCanvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleCardsBox: {
    gap: 12,
    marginBottom: 24,
  },
  convToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  convToggleCardCompleted: {
    borderColor: '#6EE7B7',
    backgroundColor: 'rgba(110, 231, 183, 0.12)',
  },
  convToggleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  convToggleEmoji: {
    fontSize: 22,
  },
  convToggleTextBox: {
    flex: 1,
  },
  convToggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  convToggleSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Screen 4 Styles
  momentumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  beaconStage: {
    height: 240,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralBeacon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    zIndex: 10,
  },
  beaconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerHudBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    width: '100%',
  },
  timerHudLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  timerHudValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  timerHudSub: {
    fontSize: 12,
    color: '#6EE7B7',
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quoteText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600',
    textAlign: 'center',
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  timerControlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  timerControlText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timerFastForwardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(110, 231, 183, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.4)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  timerFastForwardText: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '700',
  },

  // Screen 5 Celebration Styles
  celebrationStarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
  },
  starGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  celebrationMainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  celebrationCompletionMsg: {
    fontSize: 16,
    color: '#38BDF8',
    fontStyle: 'italic',
    marginBottom: 28,
  },
  pointsAwardCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  pointsAwardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  pointsAwardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Completed Dashboard Styles
  completedHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.3)',
  },
  completedGradient: {
    padding: 24,
    alignItems: 'center',
  },
  completedArtworkBox: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },
  completedBadgePill: {
    backgroundColor: 'rgba(110, 231, 183, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  completedBadgePillText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '700',
  },
  completedStatsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  summaryEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  summaryDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  quoteBoxCard: {
    backgroundColor: 'rgba(91, 95, 238, 0.15)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(91, 95, 238, 0.3)',
  },
  quoteBoxText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38BDF8',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  particleSpark: {
    position: 'absolute',
    backgroundColor: '#38BDF8',
  },
});
