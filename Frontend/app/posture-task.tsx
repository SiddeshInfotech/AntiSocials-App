import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const TASK_DURATION = 120; // 2 minutes (120 seconds)

export default function PostureTaskScreen() {
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
  
  // Mascot Floating animation
  const mascotFloatAnim = useRef(new Animated.Value(0)).current;
  const mascotScaleAnim = useRef(new Animated.Value(0.95)).current;

  // AppState recovery tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // AppState change listener to handle backgrounding/resuming
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Adjust remaining time based on timestamp
        if (isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, isPaused]);

  // Initial animations
  useEffect(() => {
    // Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.04, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Mascot gentle floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, { toValue: -5, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Gentle scale pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScaleAnim, { toValue: 1.05, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(mascotScaleAnim, { toValue: 0.95, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused]);

  const startTask = () => {
    setIsActive(true);
    // Crossfade details page into timer page
    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(timerFadeAnim, {
        toValue: 1,
        duration: 1200,
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
          body: JSON.stringify({ task_name: 'Posture check' })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || "10", 
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
        streak: pointsData.streak 
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
      <StatusBar style="dark" />

      {/* Alive Breathing Warm/Calming Gradient Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <LinearGradient
          colors={['#fdfcf7', '#fdfaf2', '#fefdfb']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient
          colors={['#faf8f0', '#f7f4e8', '#fdfcf7']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Edge vignette effect */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      {/* Main Content Safe Area */}
      <SafeAreaView style={styles.foregroundLayer} edges={['top', 'bottom']}>
        
        {/* --- Timer View (Active Phase) --- */}
        <Animated.View 
          style={[StyleSheet.absoluteFillObject, styles.timerCenter, { opacity: timerFadeAnim }]} 
          pointerEvents={isActive || isCompleted ? 'auto' : 'none'}
        >
          {!isCompleted && (
            <View style={styles.timerContentWrapper}>
              <Animated.View style={[styles.mascotPulseCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                <Text style={styles.giantEmoji}>🧍</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Text style={styles.focusSubtitle}>
                {isPaused ? "Timer Paused" : "Aligning your body..."}
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
                    "Are you sure you want to stop? Your progress will be lost.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Abort", 
                        style: "destructive", 
                        onPress: () => {
                          router.back();
                        } 
                      }
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.abortButtonText}>Abort Task</Text>
              </TouchableOpacity>
            </View>
          )}

          {isCompleted && (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🧍</Text>
              <Text style={styles.successText}>You aligned yourself.</Text>
              <Text style={styles.successMessage}>Small posture corrections throughout the day can improve focus, reduce fatigue, and support overall well-being.</Text>
              <TouchableOpacity 
                style={styles.finishButton} 
                onPress={completeTaskBackend}
                disabled={isLoading}
              >
                <Text style={styles.finishButtonText}>
                  {isLoading ? "Awarding Points..." : "Claim +10 Points"}
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
            <Text style={styles.heroEmoji}>🧍</Text>
          </Animated.View>

          <View style={styles.glassPanel}>
            <Text style={styles.title}>Posture check</Text>
            
            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, styles.badgeDuration]}>
                <Feather name="clock" size={14} color="#3b82f6" />
                <Text style={[styles.badgeText, styles.textDuration]}>2 min</Text>
              </View>
              <View style={[styles.badge, styles.badgeDifficulty]}>
                <Feather name="bar-chart-2" size={14} color="#16a34a" />
                <Text style={[styles.badgeText, styles.textDifficulty]}>Easy</Text>
              </View>
              <View style={[styles.badge, styles.badgePoints]}>
                <Feather name="award" size={14} color="#16a34a" />
                <Text style={[styles.badgeText, styles.textPoints]}>+10 Pts</Text>
              </View>
            </View>

            {/* Description Lines */}
            <View style={styles.descriptionList}>
              <Text style={styles.descLine}>• Take a moment to check your posture.</Text>
              <Text style={styles.descLine}>• Relax your shoulders, straighten your back, keep your neck aligned, and place both feet comfortably on the ground if you're sitting.</Text>
              <Text style={styles.descLine}>• Take a few slow breaths and notice how a better posture makes you feel.</Text>
              <Text style={styles.descLine}>• Small posture corrections throughout the day can improve focus, reduce fatigue, and support overall well-being.</Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startTask} activeOpacity={0.85}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.startButtonText}>Start Task</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backText}>Go Back</Text>
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
    backgroundColor: '#fdfcf7',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 30,
    borderColor: 'rgba(0,0,0,0.015)',
    borderRadius: 70,
  },
  foregroundLayer: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    padding: 12,
    marginTop: 14,
  },
  backText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  abortButton: {
    padding: 12,
    marginTop: 20,
  },
  abortButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  uiWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  detailsMascotContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 80,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d97706',
    shadowOpacity: 0.1,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  heroEmoji: {
    fontSize: 75,
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
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
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  badgeDifficulty: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  badgePoints: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textDuration: {
    color: '#2563eb',
  },
  textDifficulty: {
    color: '#16a34a',
  },
  textPoints: {
    color: '#16a34a',
  },
  descriptionList: {
    width: '100%',
    marginBottom: 35,
    gap: 12,
  },
  descLine: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    fontWeight: '400',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  
  // Timer States
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mascotPulseCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#d97706',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  giantEmoji: {
    fontSize: 90,
  },
  timerText: {
    fontSize: 82,
    fontWeight: '200',
    color: '#374151',
    letterSpacing: 2,
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(156, 163, 175, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  focusSubtitle: {
    fontSize: 18,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 40,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '80%',
    justifyContent: 'center',
  },
  controlButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    width: 180,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  pauseButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  resumeButton: {
    backgroundColor: '#10b981',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  
  // Success state
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 35,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 35,
    width: width * 0.86,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  successEmoji: {
    fontSize: 70,
    marginBottom: 20,
  },
  successText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 4,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
