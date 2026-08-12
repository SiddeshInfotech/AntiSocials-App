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
import Svg, { Circle, Line, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const SESSION_DURATION_SECONDS = 900; // 15 minutes (900s)
const TOTAL_CHAIN_LINKS = 15;

interface SocialEnvironment {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

const SOCIAL_ENVIRONMENTS: SocialEnvironment[] = [
  { id: 'cafe', emoji: '☕', name: 'Café', description: 'Sitting comfortably with drinks or coffee around.' },
  { id: 'library', emoji: '📚', name: 'Library', description: 'Shared quiet study or reading tables.' },
  { id: 'campus', emoji: '🏫', name: 'Campus', description: 'University courtyard, lawns, or student center.' },
  { id: 'mall', emoji: '🛍', name: 'Mall / Food Court', description: 'Bustling shopping center or open food court.' },
  { id: 'park', emoji: '🌳', name: 'Public Park', description: 'Benches or grass with people walking around.' },
  { id: 'waiting', emoji: '🚉', name: 'Waiting Area', description: 'Transit lounge, station, or waiting lobby.' },
];

interface WeatherOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  color: string;
}

const SOCIAL_WEATHER_OPTIONS: WeatherOption[] = [
  { id: 'comfortable', emoji: '🌤', name: 'Comfortable', description: 'Calm water, easy atmosphere', color: '#7DD3FC' },
  { id: 'awkward', emoji: '🌥', name: 'Slightly Awkward', description: 'Gentle waves, mild self-awareness', color: '#38BDF8' },
  { id: 'overwhelming', emoji: '🌧', name: 'Overwhelming', description: 'Choppy water, strong urges to flee', color: '#2563EB' },
  { id: 'challenging', emoji: '🌊', name: 'Very Challenging', description: 'Deep ocean swells, high discomfort', color: '#1E40AF' },
];

const SUPPORTIVE_MESSAGES = [
  '⚓ "You are safe."',
  '🌊 "Discomfort naturally rises and falls."',
  '🩵 "You don\'t need to escape."',
  '✨ "Notice the people around you without judging yourself."',
  '🤍 "Every minute here strengthens your confidence."',
];

export default function StayInSocialSpaceTaskScreen() {
  const router = useRouter();

  // Step state:
  // 0: Detail Overview Dashboard
  // 1: SCREEN 1 — DROP THE ANCHOR
  // 2: SCREEN 2 — CHOOSE YOUR SOCIAL SPACE
  // 3: SCREEN 3 — SOCIAL WEATHER
  // 4: SCREEN 4 & 5 — ANCHOR SESSION & INNER BALANCE
  // 5: FINAL CELEBRATION
  // 6: COMPLETED TASK DASHBOARD
  const [step, setStep] = useState<number>(0);

  // Challenge Selections
  const [selectedEnvironment, setSelectedEnvironment] = useState<SocialEnvironment | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherOption | null>(null);

  // Session & Timer State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_DURATION_SECONDS);
  const [completedLinks, setCompletedLinks] = useState<number>(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Screen 1 Anchor Descent
  const anchorY = useRef(new Animated.Value(-60)).current;
  const waveScale = useRef(new Animated.Value(1)).current;

  // Floating Tokens (Screen 2)
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Weather Dial Rotation (Screen 3)
  const dialRotation = useRef(new Animated.Value(0)).current;

  // Anchor Chain Progress (Screen 4)
  const chainOffsetY = useRef(new Animated.Value(0)).current;
  const oceanWaveAnim = useRef(new Animated.Value(0)).current;

  // Celebration Sunrise (Screen 5)
  const sunriseY = useRef(new Animated.Value(100)).current;
  const emblemGlow = useRef(new Animated.Value(0)).current;

  // AppState timer tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Ambient Rising Bubbles
  const [bubbles] = useState(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * (width - 40) + 20,
      startY: height * 0.7 + Math.random() * 100,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
    }))
  );

  // Fetch Existing Task Progress
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
        const thisTask = data.tasks.find((t: any) => t.title === 'Stay in Social Space (15 Minutes)');
        if (thisTask && thisTask.status === 'completed') {
          setStep(6); // Go to completed dashboard directly
          setCompletedLinks(15);

          // Fetch stored detailed response
          if (thisTask.id) {
            const respRes = await apiFetch('/api/tasks/anchor-task-response/${thisTask.id}', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (respRes.ok) {
              const contentType = respRes.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const respData = await respRes.json();
                if (respData && respData.data) {
                  if (respData.data.selected_environment) {
                    const env = SOCIAL_ENVIRONMENTS.find(e => e.id === respData.data.selected_environment.id || e.name === respData.data.selected_environment);
                    if (env) setSelectedEnvironment(env);
                  }
                  if (respData.data.initial_social_weather) {
                    const w = SOCIAL_WEATHER_OPTIONS.find(sw => sw.id === respData.data.initial_social_weather.id || sw.name === respData.data.initial_social_weather);
                    if (w) setSelectedWeather(w);
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

  // Floating tokens animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Ocean wave animation loop for session screen
  useEffect(() => {
    if (step === 4) {
      Animated.loop(
        Animated.timing(oceanWaveAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [step]);

  // Supportive message rotation loop
  useEffect(() => {
    let msgInterval: any = null;
    if (step === 4 && isActive) {
      msgInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % SUPPORTIVE_MESSAGES.length);
      }, 10000);
    }
    return () => clearInterval(msgInterval);
  }, [step, isActive]);

  // Main 15-Minute Timer Countdown & Chain Link Progress
  useEffect(() => {
    let interval: any = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          const elapsed = SESSION_DURATION_SECONDS - nextTime;
          const linksDone = Math.min(15, Math.floor(elapsed / 60));
          setCompletedLinks(linksDone);

          if (nextTime <= 0) {
            clearInterval(interval);
            handleSessionCompleted();
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  // AppState handler for background timer recovery
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isActive && !isPaused && endTimeRef.current > 0) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((endTimeRef.current - now) / 1000));
          setTimeLeft(remaining);
          const elapsed = SESSION_DURATION_SECONDS - remaining;
          const linksDone = Math.min(15, Math.floor(elapsed / 60));
          setCompletedLinks(linksDone);

          if (remaining <= 0) {
            handleSessionCompleted();
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

  // Step transition helper
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

  // Screen 1: Drop Anchor Press
  const handleDropAnchor = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(anchorY, {
        toValue: 60,
        duration: 1200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(waveScale, { toValue: 1.6, duration: 600, useNativeDriver: true }),
        Animated.timing(waveScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => {
      animateToStep(2);
    });
  };

  // Screen 2: Select Environment Token
  const handleSelectEnvironment = (env: SocialEnvironment) => {
    Haptics.selectionAsync();
    setSelectedEnvironment(env);

    saveProgress({ environment: env.name });

    setTimeout(() => {
      animateToStep(3);
    }, 400);
  };

  // Screen 3: Select Weather Option
  const handleSelectWeather = (weather: WeatherOption) => {
    Haptics.selectionAsync();
    setSelectedWeather(weather);

    saveProgress({
      environment: selectedEnvironment?.name,
      social_weather: weather.name,
    });

    setTimeout(() => {
      // Start 15-minute Session
      setIsActive(true);
      setIsPaused(false);
      endTimeRef.current = Date.now() + timeLeft * 1000;

      startTaskBackend();
      animateToStep(4);
    }, 500);
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
        const thisTask = data.tasks.find((t: any) => t.title === 'Stay in Social Space (15 Minutes)');
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

  // Session Completed -> Trigger Final Celebration
  const handleSessionCompleted = () => {
    setIsActive(false);

    Animated.parallel([
      Animated.timing(sunriseY, { toValue: 0, duration: 1500, useNativeDriver: true }),
      Animated.timing(emblemGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]).start(() => {
      completeTaskFinal();
    });
  };

  const handleFastForwardTimer = () => {
    setTimeLeft(5);
    endTimeRef.current = Date.now() + 5000;
  };

  const completeTaskFinal = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        animateToStep(5);
        return;
      }

      await saveProgress({
        environment: selectedEnvironment?.name,
        social_weather: selectedWeather?.name,
        session_started: true,
        session_completed: true,
        chain_links_completed: 15,
        timer_completion: true,
      });

      const res = await apiFetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        let taskId = null;
        if (data && data.tasks) {
          const thisTask = data.tasks.find((t: any) => t.title === 'Stay in Social Space (15 Minutes)');
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

      await apiFetch('/api/tasks/save-anchor-task-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Stay in Social Space (15 Minutes)',
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Main Ocean Canvas Background Gradient */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#0284C7']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient Rising Bubbles Background */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {bubbles.map((b) => (
          <View
            key={b.id}
            style={[
              styles.ambientBubble,
              {
                left: b.x,
                top: b.startY,
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
              },
            ]}
          />
        ))}
      </View>

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
          <Text style={styles.headerBadgeText}>⚓ SOCIAL EXPOSURE TASK</Text>
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
            {/* Hero Artwork Banner */}
            <View style={styles.dashboardHeroCard}>
              <LinearGradient colors={['rgba(37, 99, 235, 0.3)', 'rgba(125, 211, 252, 0.15)']} style={styles.heroGradient}>
                <View style={styles.anchorArtworkBox}>
                  <Svg height="150" width="220" viewBox="0 0 220 150">
                    <Defs>
                      <SvgLinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#7DD3FC" stopOpacity="0.8" />
                        <Stop offset="1" stopColor="#2563EB" stopOpacity="0.9" />
                      </SvgLinearGradient>
                    </Defs>
                    {/* Ocean Water Line */}
                    <Path d="M 10 90 Q 60 75 110 90 T 210 90 L 210 140 L 10 140 Z" fill="url(#waterGrad)" opacity="0.6" />
                    <Path d="M 10 100 Q 60 110 110 100 T 210 100 L 210 140 L 10 140 Z" fill="#1E3A8A" opacity="0.8" />

                    {/* Anchor SVG */}
                    <G transform="translate(85, 30)">
                      <Circle cx="25" cy="15" r="10" stroke="#7DD3FC" strokeWidth="3" fill="none" />
                      <Line x1="25" y1="25" x2="25" y2="70" stroke="#F8FAFC" strokeWidth="4" />
                      <Line x1="10" y1="40" x2="40" y2="40" stroke="#F8FAFC" strokeWidth="4" />
                      <Path d="M 5 60 C 5 85, 45 85, 45 60" stroke="#7DD3FC" strokeWidth="4" fill="none" />
                      <Path d="M 2 57 L 8 63 L 2 63 Z" fill="#7DD3FC" />
                      <Path d="M 48 57 L 42 63 L 48 63 Z" fill="#7DD3FC" />
                    </G>
                  </Svg>
                </View>
                <Text style={styles.heroTitle}>Stay in Social Space</Text>
                <Text style={styles.heroSubtitle}>15 Minutes Presence • Hard • +300 Points</Text>
              </LinearGradient>
            </View>

            {/* Description */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionHeader}>TASK DESCRIPTION</Text>
              <Text style={styles.descriptionBody}>
                Growth doesn't always come from doing more.{'\n\n'}
                Sometimes it comes from staying.{'\n\n'}
                Choose a public place where people are naturally present.{'\n\n'}
                Sit, observe, breathe, and remain there for fifteen minutes without avoiding the environment or reaching for your phone unnecessarily.{'\n\n'}
                You don't need to speak. You don't need to perform. Simply stay.
              </Text>
            </View>

            {/* Environmental Examples Box */}
            <View style={styles.examplesCard}>
              <Text style={styles.examplesHeader}>⚓ SUITABLE SOCIAL SPACES</Text>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Café or coffee shop seating area</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Library reading tables or lounge</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>University campus courtyard or plaza</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Food court or public mall seating</Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Park bench with people passing around</Text>
              </View>
            </View>

            {/* Quote Box */}
            <View style={styles.quoteBoxCard}>
              <Text style={styles.quoteBoxText}>
                "Courage isn't always taking action. Sometimes courage is choosing not to run away."
              </Text>
            </View>

            {/* Begin Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => animateToStep(1)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#2563EB', '#7DD3FC']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>Drop Anchor & Begin ⚓</Text>
                <Feather name="arrow-right" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 1 — DROP THE ANCHOR */}
        {/* =================================================== */}
        {step === 1 && (
          <View style={styles.centerContainer}>
            {/* Suspended Anchor Animation */}
            <View style={styles.anchorDescentStage}>
              <Animated.View
                style={[
                  styles.anchorSpriteBox,
                  {
                    transform: [{ translateY: anchorY }],
                  },
                ]}
              >
                <MaterialCommunityIcons name="anchor" size={72} color="#7DD3FC" />
              </Animated.View>

              {/* Water Surface Line & Waves */}
              <Animated.View
                style={[
                  styles.waterRippleRing,
                  {
                    transform: [{ scale: waveScale }],
                  },
                ]}
              />
            </View>

            <Text style={styles.screen1Heading}>
              "You don't have to leave every uncomfortable moment."
            </Text>
            <Text style={styles.screen1Subtext}>
              "Today, your strength comes from staying."
            </Text>

            <TouchableOpacity
              style={[styles.primaryActionButton, { marginTop: 44 }]}
              onPress={handleDropAnchor}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#2563EB', '#7DD3FC']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>⚓ Drop Your Anchor</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================== */}
        {/* SCREEN 2 — CHOOSE YOUR SOCIAL SPACE */}
        {/* =================================================== */}
        {step === 2 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeaderBox}>
              <Text style={styles.stepTag}>STEP 1 OF 2 • SOCIAL ENVIRONMENT</Text>
              <Text style={styles.stepTitle}>Choose your current social space:</Text>
            </View>

            {/* Grid of Floating Environment Tokens */}
            <View style={styles.tokensGrid}>
              {SOCIAL_ENVIRONMENTS.map((env, index) => {
                const isSelected = selectedEnvironment?.id === env.id;
                const translateY = floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [index % 2 === 0 ? -6 : 6, index % 2 === 0 ? 6 : -6],
                });

                return (
                  <Animated.View
                    key={env.id}
                    style={[
                      styles.tokenWrapper,
                      { transform: [{ translateY }] },
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.tokenCard, isSelected && styles.tokenCardSelected]}
                      onPress={() => handleSelectEnvironment(env)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#2563EB', '#0284C7'] : ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.8)']}
                        style={styles.tokenGradient}
                      >
                        <Text style={styles.tokenEmoji}>{env.emoji}</Text>
                        <Text style={styles.tokenName}>{env.name}</Text>
                        <Text style={styles.tokenDesc} numberOfLines={2}>{env.description}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 3 — SOCIAL WEATHER */}
        {/* =================================================== */}
        {step === 3 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.stepHeaderBox}>
              <Text style={styles.stepTag}>STEP 2 OF 2 • EMOTIONAL BASELINE</Text>
              <Text style={styles.stepTitle}>How does the environment feel right now?</Text>
            </View>

            {/* Weather Options List */}
            <View style={styles.weatherList}>
              {SOCIAL_WEATHER_OPTIONS.map((w) => {
                const isSelected = selectedWeather?.id === w.id;

                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.weatherCard, isSelected && { borderColor: w.color, borderWidth: 2 }]}
                    onPress={() => handleSelectWeather(w)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.weatherEmojiBox, { backgroundColor: `${w.color}25` }]}>
                      <Text style={styles.weatherEmoji}>{w.emoji}</Text>
                    </View>
                    <View style={styles.weatherContent}>
                      <Text style={styles.weatherName}>{w.name}</Text>
                      <Text style={styles.weatherDesc}>{w.description}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? w.color : '#64748B'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* =================================================== */}
        {/* SCREEN 4 & 5 — ANCHOR SESSION (15 MINUTE CHAIN PROGRESS) */}
        {/* =================================================== */}
        {step === 4 && (
          <View style={styles.sessionContainer}>
            {/* Top Anchor Status Bar */}
            <View style={styles.sessionStatusHeader}>
              <View style={styles.sessionPill}>
                <Text style={styles.sessionPillEmoji}>{selectedEnvironment?.emoji || '⚓'}</Text>
                <Text style={styles.sessionPillText}>{selectedEnvironment?.name || 'Social Space'}</Text>
              </View>

              <View style={styles.sessionPill}>
                <Text style={styles.sessionPillEmoji}>{selectedWeather?.emoji || '🌤'}</Text>
                <Text style={styles.sessionPillText}>{selectedWeather?.name || 'Social Weather'}</Text>
              </View>
            </View>

            {/* Vertical Anchor Chain Link Progress Visualization */}
            <View style={styles.chainStage}>
              <Text style={styles.chainStageTitle}>ANCHOR DEPTH: {completedLinks} / 15 MINS</Text>

              <View style={styles.chainLinksColumn}>
                {Array.from({ length: TOTAL_CHAIN_LINKS }).map((_, i) => {
                  const isFilled = i < completedLinks;
                  const isCurrent = i === completedLinks;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.chainLinkPill,
                        isFilled && styles.chainLinkPillFilled,
                        isCurrent && styles.chainLinkPillCurrent,
                      ]}
                    >
                      <Text style={styles.chainLinkNumber}>{i + 1}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.anchorBaseIcon}>
                <MaterialCommunityIcons name="anchor" size={32} color="#7DD3FC" />
              </View>
            </View>

            {/* Timer HUD Display */}
            <View style={styles.timerHudBox}>
              <Text style={styles.timerHudValue}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerHudSub}>Remaining Anchor Exposure Time</Text>
            </View>

            {/* Rotating Supportive Grounding Quote */}
            <View style={styles.supportiveQuoteCard}>
              <Text style={styles.supportiveQuoteText}>{SUPPORTIVE_MESSAGES[currentMessageIndex]}</Text>
            </View>

            {/* Controls */}
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
                <Ionicons name="flash" size={18} color="#7DD3FC" />
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
            <View style={styles.celebrationAnchorBox}>
              <LinearGradient colors={['#0284C7', '#2563EB', '#7DD3FC']} style={styles.anchorEmblemGradient}>
                <MaterialCommunityIcons name="anchor" size={56} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={styles.celebrationBadgeTitle}>🏅 SOCIAL ANCHOR UNLOCKED</Text>
            <Text style={styles.celebrationMainHeading}>
              "Real confidence isn't always about speaking. Sometimes it's about staying."
            </Text>
            <Text style={styles.celebrationCompletionMsg}>
              "You didn't escape."
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
              <LinearGradient colors={['#7DD3FC', '#2563EB']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.primaryButtonText}>View Dashboard 🏆</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* =================================================== */}
        {/* STEP 6: COMPLETED TASK DASHBOARD */}
        {/* =================================================== */}
        {step === 6 && (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.completedHeroCard}>
              <LinearGradient colors={['#1E3A8A', '#0F172A']} style={styles.completedGradient}>
                <View style={styles.completedArtworkBox}>
                  <Svg height="140" width="220" viewBox="0 0 220 140">
                    <Path d="M 10 90 Q 60 75 110 90 T 210 90 L 210 140 L 10 140 Z" fill="#7DD3FC" opacity="0.4" />
                    <G transform="translate(85, 20)">
                      <Circle cx="25" cy="15" r="10" stroke="#7DD3FC" strokeWidth="3" fill="none" />
                      <Line x1="25" y1="25" x2="25" y2="70" stroke="#F8FAFC" strokeWidth="4" />
                      <Line x1="10" y1="40" x2="40" y2="40" stroke="#F8FAFC" strokeWidth="4" />
                      <Path d="M 5 60 C 5 85, 45 85, 45 60" stroke="#7DD3FC" strokeWidth="4" fill="none" />
                    </G>
                  </Svg>
                </View>
                <Text style={styles.completedHeroTitle}>Stay in Social Space</Text>
                <View style={styles.completedBadgePill}>
                  <Text style={styles.completedBadgePillText}>🏅 Social Anchor</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.completedStatsCard}>
              <Text style={styles.sectionHeader}>EXPOSURE SESSION SUMMARY</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>{selectedEnvironment?.emoji || '☕'}</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Social Space: {selectedEnvironment?.name || 'Public Environment'}</Text>
                  <Text style={styles.summaryDesc}>Remained present for 15 full minutes without fleeing.</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>{selectedWeather?.emoji || '🌤'}</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Initial Weather: {selectedWeather?.name || 'Baseline Feeling'}</Text>
                  <Text style={styles.summaryDesc}>Regulated discomfort into emotional grounding.</Text>
                </View>
              </View>
            </View>

            <View style={styles.quoteBoxCard}>
              <Text style={styles.quoteBoxText}>
                "Courage isn't always taking action. Sometimes courage is choosing not to run away."
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                router.replace({
                  pathname: '/task-success',
                  params: {
                    points: '300',
                    taskName: 'Stay in Social Space (15 Minutes)',
                    message: "You didn't escape.",
                    difficulty: 'hard',
                    badge: 'Presence Anchor Unlocked'
                  }
                } as any);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#2563EB', '#7DD3FC']} style={styles.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
    backgroundColor: '#0F172A',
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
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
  },
  headerBadgeText: {
    color: '#7DD3FC',
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

  // Overview Dashboard
  dashboardHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.25)',
  },
  heroGradient: {
    padding: 24,
    alignItems: 'center',
  },
  anchorArtworkBox: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 10,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#7DD3FC',
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
    color: '#7DD3FC',
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  examplesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7DD3FC',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    color: '#7DD3FC',
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
  quoteBoxCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  quoteBoxText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7DD3FC',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
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

  // Screen 1 Drop Anchor
  anchorDescentStage: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  anchorSpriteBox: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  waterRippleRing: {
    width: 140,
    height: 20,
    borderRadius: 70,
    backgroundColor: 'rgba(125, 211, 252, 0.2)',
    borderWidth: 2,
    borderColor: '#7DD3FC',
    marginTop: -20,
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
    color: '#7DD3FC',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Screen 2 Environment Tokens
  stepHeaderBox: {
    marginTop: 10,
    marginBottom: 20,
  },
  stepTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7DD3FC',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  tokensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tokenWrapper: {
    width: (width - 52) / 2,
  },
  tokenCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tokenCardSelected: {
    borderColor: '#7DD3FC',
    borderWidth: 2,
  },
  tokenGradient: {
    padding: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  tokenEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  tokenDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    lineHeight: 15,
  },

  // Screen 3 Weather
  weatherList: {
    gap: 12,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  weatherEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  weatherEmoji: {
    fontSize: 24,
  },
  weatherContent: {
    flex: 1,
  },
  weatherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  weatherDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Screen 4 Session
  sessionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sessionStatusHeader: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
    gap: 6,
  },
  sessionPillEmoji: {
    fontSize: 14,
  },
  sessionPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chainStage: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  chainStageTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7DD3FC',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chainLinksColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    maxWidth: 280,
  },
  chainLinkPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chainLinkPillFilled: {
    backgroundColor: '#0284C7',
    borderColor: '#7DD3FC',
  },
  chainLinkPillCurrent: {
    borderColor: '#FFF',
    borderWidth: 2,
  },
  chainLinkNumber: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  anchorBaseIcon: {
    marginTop: 12,
  },
  timerHudBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
    width: '100%',
  },
  timerHudValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  timerHudSub: {
    fontSize: 11,
    color: '#7DD3FC',
    fontWeight: '600',
    marginTop: 2,
  },
  supportiveQuoteCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 18,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  supportiveQuoteText: {
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
    backgroundColor: 'rgba(125, 211, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  timerFastForwardText: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '700',
  },

  // Celebration & Completed Dashboard
  celebrationAnchorBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
  },
  anchorEmblemGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7DD3FC',
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
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
  },
  pointsAwardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#7DD3FC',
  },
  pointsAwardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
    marginTop: 2,
  },
  completedHeroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.3)',
  },
  completedGradient: {
    padding: 24,
    alignItems: 'center',
  },
  completedArtworkBox: {
    height: 140,
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
    backgroundColor: 'rgba(125, 211, 252, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  completedBadgePillText: {
    color: '#7DD3FC',
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
  ambientBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(125, 211, 252, 0.2)',
  },
});
