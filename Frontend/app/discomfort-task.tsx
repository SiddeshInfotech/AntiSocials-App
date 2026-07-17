import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 300; // 5 minutes (300 seconds)

export default function DiscomfortTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const timerFadeAnim = useRef(new Animated.Value(0)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.6)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  
  // Mascot Floating & Gentle Breathing
  const mascotFloatAnim = useRef(new Animated.Value(0)).current;
  const mascotScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Initial animations
  useEffect(() => {
    // Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.04, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Mascot animations (floating 🪨)
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, { toValue: -5, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotFloatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScaleAnim, { toValue: 1.04, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotScaleAnim, { toValue: 0.96, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsCompleted(true);
      setIsActive(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused, timeLeft]);

  const startTask = () => {
    setIsActive(true);
    // Crossfade details page into timer page
    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(timerFadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ]).start();
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Sit with Discomfort' })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.points_rewarded?.toString() || data.pointsAdded?.toString() || "300", 
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0"
          };
        } else {
          Alert.alert("Error", data.error || "Failed to submit task completion");
        }
      } else {
        Alert.alert("Authorization Error", "No authorization token found. Please log in again.");
      }
    } catch(e) { 
      console.error(e);
      Alert.alert("Connection Error", "Network request failed. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }

    router.replace({ 
      pathname: '/task-success', 
      params: { 
        points: pointsData.pointsAdded, 
        totalPoints: pointsData.totalPoints, 
        streak: pointsData.streak,
        message: "You didn't escape.",
        difficulty: "hard"
      } 
    } as any);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Developer testing helper (double click timer to skip to end)
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3); // Fast forward to 3 seconds remaining
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Image with scale animation */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <Image 
          source={require('../assets/images/discomfort-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Blurred image overlay when timer starts */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: timerFadeAnim }]}>
        <Image 
          source={require('../assets/images/discomfort-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          blurRadius={25}
        />
      </Animated.View>

      {/* Cinematic dark overlay to make sure text is highly legible */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(8, 12, 22, 0.45)', 'rgba(15, 20, 35, 0.65)', 'rgba(5, 7, 15, 0.85)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Content Safe Area */}
      <SafeAreaView style={styles.foregroundLayer} edges={['top', 'bottom']}>

        {/* Header navigation (abort button) */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (isActive && !isCompleted) {
                Alert.alert(
                  "Abort Task?",
                  "Are you sure you want to stop? Your progress will be lost.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Abort", style: "destructive", onPress: () => router.back() }
                  ]
                );
              } else {
                router.back();
              }
            }} 
            style={styles.backBtn} 
            activeOpacity={0.6}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isActive ? 'CHALLENGE ACTIVE' : 'CHALLENGE DETAILS'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* --- Timer View (Active Phase) --- */}
        <Animated.View 
          style={[StyleSheet.absoluteFillObject, styles.timerCenter, { opacity: timerFadeAnim }]} 
          pointerEvents={isActive || isCompleted ? 'auto' : 'none'}
        >
          {!isCompleted && (
            <View style={styles.timerContentWrapper}>
              <Animated.View style={[styles.mascotPulseCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.giantEmoji}>🪨</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Text style={styles.focusSubtitle}>
                {isPaused ? "Timer Paused" : "Sit with the feeling..."}
              </Text>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity 
                  style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.controlButtonText, isPaused && { color: '#ffffff' }]}>
                    {isPaused ? "Resume" : "Pause"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.abortButton}
                onPress={() => {
                  Alert.alert(
                    "Abort Task?",
                    "Are you sure you want to stop focusing? Your progress will be lost.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Abort", style: "destructive", onPress: () => router.back() }
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.abortButtonText}>Abort Challenge</Text>
              </TouchableOpacity>
            </View>
          )}

          {isCompleted && (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🪨</Text>
              <Text style={styles.successText}>You didn't escape.</Text>
              <Text style={styles.successMessage}>Learning to stay with discomfort builds emotional strength.</Text>
              <TouchableOpacity 
                style={styles.finishButton} 
                onPress={completeTaskBackend}
                disabled={isLoading}
              >
                <Text style={styles.finishButtonText}>
                  {isLoading ? "Awarding Points..." : "Claim +300 Points"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* --- Onboarding UI (Details Phase) --- */}
        <Animated.View 
          style={[styles.uiWrapper, { opacity: uiFadeAnim }]} 
          pointerEvents={!isActive && !isCompleted ? 'auto' : 'none'}
        >
          <Animated.View style={[styles.detailsMascotContainer, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
            <Text style={styles.heroEmoji}>🪨</Text>
          </Animated.View>

          <View style={styles.glassPanel}>
            <Text style={styles.title}>Sit with Discomfort</Text>
            
            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, styles.badgeDuration]}>
                <Feather name="clock" size={14} color="#f97316" />
                <Text style={[styles.badgeText, styles.textDuration]}>5 min</Text>
              </View>
              <View style={[styles.badge, styles.badgeDifficulty]}>
                <Feather name="zap" size={14} color="#ef4444" />
                <Text style={[styles.badgeText, styles.textDifficulty]}>🔥 Hard</Text>
              </View>
              <View style={[styles.badge, styles.badgePoints]}>
                <Feather name="award" size={14} color="#ea580c" />
                <Text style={[styles.badgeText, styles.textPoints]}>+300 Pts</Text>
              </View>
            </View>

            {/* Description list */}
            <View style={styles.descriptionList}>
              <Text style={styles.introText}>Instead of reaching for your phone or distracting yourself, simply sit with whatever you're feeling for five minutes:</Text>
              
              <View style={styles.bulletContainer}>
                <Text style={styles.descLine}>• Stay seated and don't scroll</Text>
                <Text style={styles.descLine}>• Avoid multitasking or seeking distractions</Text>
                <Text style={styles.descLine}>• Simply observe your thoughts and emotions without judging them</Text>
              </View>

              <Text style={styles.courageText}>"The strongest response is sometimes choosing not to react."</Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startTask} activeOpacity={0.85}>
              <LinearGradient
                colors={['#818cf8', '#4f46e5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.startButtonText}>Start Task</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070f',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  foregroundLayer: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  uiWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  detailsMascotContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 75,
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#818cf8',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  heroEmoji: {
    fontSize: 68,
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 14,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  badgeDuration: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  badgePoints: {
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: 'rgba(234, 88, 12, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textDuration: {
    color: '#f97316',
  },
  textDifficulty: {
    color: '#ef4444',
  },
  textPoints: {
    color: '#ea580c',
  },
  descriptionList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  introText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    textAlign: 'center',
  },
  bulletContainer: {
    paddingLeft: 8,
    gap: 6,
  },
  descLine: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  courageText: {
    fontSize: 14,
    color: '#a5b4fc',
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  startButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Timer States
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timerContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mascotPulseCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#818cf8',
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  giantEmoji: {
    fontSize: 76,
  },
  timerText: {
    fontSize: 84,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowColor: 'rgba(129, 140, 248, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  focusSubtitle: {
    fontSize: 16,
    color: '#f3f4f6',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  controlButton: {
    width: 160,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  pauseButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resumeButton: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  abortButton: {
    padding: 12,
  },
  abortButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  successText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  finishButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
});
