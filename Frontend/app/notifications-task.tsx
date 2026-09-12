import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, Platform, AppState, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import DndModule from '../modules/dnd-module';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 1800; // 30 minutes (1800 seconds)

export default function NotificationsTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dndActive, setDndActive] = useState(false);

  const appState = useRef(AppState.currentState);
  const isWaitingForPermission = useRef(false);
  const endTimeRef = useRef<number>(0);

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

    // Mascot animations (Gentle, calm stillness posture)
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloatAnim, { toValue: -5, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotScaleAnim, { toValue: 1.02, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(mascotScaleAnim, { toValue: 0.96, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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

  // AppState change listener to handle backgrounding/resuming and setting permission return
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App returned to foreground
        if (isWaitingForPermission.current) {
          isWaitingForPermission.current = false;
          if (Platform.OS === 'android' && DndModule.isNative) {
            if (DndModule.checkDndPermission()) {
              startAndroidTask();
            } else {
              Alert.alert(
                "Permission Denied",
                "AntiSocial could not enable Do Not Disturb because permission was not granted."
              );
            }
          }
        }

        // Adjust remaining time based on timestamp
        if (isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (Platform.OS === 'android' && DndModule.isNative) {
            setDndActive(DndModule.isDndEnabled());
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, isPaused]);

  // Safe release of DND mode on screen unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'android' && DndModule.isNative) {
        try {
          DndModule.setDndMode(false);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Timer Run Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      
      // Update DND state immediately when starting/resuming
      if (Platform.OS === 'android' && DndModule.isNative) {
        setDndActive(DndModule.isDndEnabled());
      }

      timer = setInterval(() => {
        // Update DND state check every second
        if (Platform.OS === 'android' && DndModule.isNative) {
          setDndActive(DndModule.isDndEnabled());
        }

        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            setIsActive(false);
            if (Platform.OS === 'android' && DndModule.isNative) {
              try {
                DndModule.setDndMode(false);
                setDndActive(false);
              } catch (e) {
                console.error("Failed to disable DND mode:", e);
              }
            }
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

  const startAndroidTask = () => {
    try {
      DndModule.setDndMode(true);
      setDndActive(true);
    } catch (e) {
      console.error("Failed to enable DND mode:", e);
    }
    startTimerFlow();
  };

  const startTimerFlow = () => {
    Animated.timing(uiFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsActive(true);
      timerFadeAnim.setValue(0);
      Animated.timing(timerFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const startTask = () => {
    const isAutomationSupported = Platform.OS === 'android' && DndModule.isNative;

    if (isAutomationSupported) {
      const hasPermission = DndModule.checkDndPermission();
      if (!hasPermission) {
        Alert.alert(
          "DND Permission Required",
          "To complete this task, AntiSocial needs permission to enable Do Not Disturb mode automatically.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Grant Permission", 
              onPress: () => {
                isWaitingForPermission.current = true;
                DndModule.requestDndPermission();
              } 
            }
          ]
        );
      } else {
        startAndroidTask();
      }
    } else {
      // Manual flow for iOS and Android without native DndModule (Expo Go)
      Alert.alert(
        "Enable Do Not Disturb",
        "Please enable Focus / Do Not Disturb manually.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Settings", 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            } 
          },
          {
            text: "Start Timer",
            onPress: () => {
              startTimerFlow();
            }
          }
        ]
      );
    }
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '100', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Turn off notifications (30 min)' })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.pointsAdded?.toString() || "100", 
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
          colors={['#f2fdf5', '#edfbf2', '#f6fdf9']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient
          colors={['#ebfaf0', '#e6f7eb', '#f2fcf6']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Edge vignette effect */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      {/* Main Content Safe Area */}
      <SafeAreaView style={styles.foregroundLayer} edges={['top', 'bottom']}>
        
        {/* Top Back Navigation Bar for Details Phase */}
        {!isActive && !isCompleted && (
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.circleBackBtn} 
              onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={24} color="#111111" />
            </TouchableOpacity>
          </View>
        )}

        {/* --- Onboarding UI (Details Phase) --- */}
        {!isActive && !isCompleted && (
          <Animated.View style={[styles.uiWrapper, { opacity: uiFadeAnim }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              <View style={styles.mainUpperSection}>
                <Animated.View style={[styles.detailsMascotContainer, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                  <Text style={styles.heroEmoji}>🔕</Text>
                </Animated.View>

                <Text style={styles.title}>Turn off notifications</Text>
                
                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={13} color="#3b82f6" />
                    <Text style={[styles.badgeText, styles.textDuration]}>30 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDifficulty]}>
                    <Feather name="bar-chart-2" size={13} color="#16a34a" />
                    <Text style={[styles.badgeText, styles.textDifficulty]}>Easy</Text>
                  </View>
                  <View style={[styles.badge, styles.badgePoints]}>
                    <Feather name="award" size={13} color="#16a34a" />
                    <Text style={[styles.badgeText, styles.textPoints]}>+100 Pts</Text>
                  </View>
                </View>

                {/* Description Lines in Glass Panel */}
                <View style={styles.glassPanel}>
                  <View style={styles.descriptionList}>
                    <Text style={styles.descLine}>• Turn off your phone notifications for the next 30 minutes.</Text>
                    <Text style={styles.descLine}>• Take a break from constant interruptions and enjoy a quieter environment.</Text>
                    <Text style={styles.descLine}>• Use this time to relax, work, read, or simply be present without distractions.</Text>
                    <Text style={styles.descLine}>• Small moments of silence help improve focus and reduce stress.</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bottomArea}>
                <TouchableOpacity style={styles.startButton} onPress={startTask} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.startButtonText}>Start Task</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* --- Timer View (Active Phase) --- */}
        {(isActive || isCompleted) && (
          <Animated.View style={[styles.timerCenter, { opacity: timerFadeAnim }]}>
            {!isCompleted && (
              <View style={styles.timerContentWrapper}>
                <Animated.View style={[styles.mascotPulseCircle, { transform: [{ translateY: mascotFloatAnim }, { scale: mascotScaleAnim }] }]}>
                  <Text style={styles.giantEmoji}>🔕</Text>
                </Animated.View>

                <Pressable onPress={handleDevSkip}>
                  <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                    {formatTime(timeLeft)}
                  </Animated.Text>
                </Pressable>

                <Text style={styles.focusSubtitle}>
                  {isPaused ? "Timer Paused" : "Enjoying the quiet..."}
                </Text>

                {Platform.OS === 'android' && DndModule.isNative ? (
                  <View style={styles.dndStatusContainer}>
                    <Feather 
                      name={dndActive ? "shield" : "shield-off"} 
                      size={16} 
                      color={dndActive ? "#10b981" : "#ef4444"} 
                    />
                    <Text style={[styles.dndStatusText, { color: dndActive ? "#065f46" : "#b91c1c" }]}>
                      {dndActive ? "Do Not Disturb: Active" : "Do Not Disturb: Inactive"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dndStatusContainer}>
                    <Feather 
                      name="info" 
                      size={16} 
                      color="#2563eb" 
                    />
                    <Text style={[styles.dndStatusText, { color: '#1e40af' }]}>
                      Please ensure Focus/DND is enabled manually
                    </Text>
                  </View>
                )}

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
                            if (Platform.OS === 'android') {
                              try {
                                DndModule.setDndMode(false);
                              } catch (e) {
                                console.error(e);
                              }
                            }
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
                <Text style={styles.successEmoji}>🔕</Text>
                <Text style={styles.successText}>You reduced noise.</Text>
                <Text style={styles.successMessage}>Take a break from constant interruptions and enjoy a quieter environment.</Text>
                <TouchableOpacity 
                  style={styles.finishButton} 
                  onPress={completeTaskBackend}
                  disabled={isLoading}
                >
                  <Text style={styles.finishButtonText}>
                    {isLoading ? "Awarding Points..." : "Claim +100 Points"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2fdf5',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 30,
    borderColor: 'rgba(0,0,0,0.015)',
    borderRadius: 70,
  },
  foregroundLayer: {
    flex: 1,
    zIndex: 2,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  circleBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  abortButton: {
    padding: 10,
    marginTop: 14,
  },
  abortButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dndStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
  },
  dndStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  uiWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  mainUpperSection: {
    alignItems: 'center',
    width: '100%',
  },
  detailsMascotContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  heroEmoji: {
    fontSize: 50,
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
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
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
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
    fontSize: 12,
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
    gap: 9,
  },
  descLine: {
    fontSize: 13.5,
    color: '#4b5563',
    lineHeight: 19.5,
    fontWeight: '400',
  },
  bottomArea: {
    width: '100%',
    paddingTop: 16,
  },
  startButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  mascotPulseCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  giantEmoji: {
    fontSize: 66,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#114a2f',
    letterSpacing: 2,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(16, 185, 129, 0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  focusSubtitle: {
    fontSize: 16,
    color: '#1b5a3e',
    fontWeight: '500',
    marginBottom: 20,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '80%',
    justifyContent: 'center',
  },
  controlButton: {
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 28,
    width: 170,
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
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    width: width * 0.86,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  successText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 28,
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
    fontSize: 16,
  },
});
