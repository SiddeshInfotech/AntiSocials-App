import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, Image, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 300; // 5 minutes (300 seconds)

export default function CourageTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Wizard steps: 'intro' | 'journal' | 'readback' | 'timer'
  const [step, setStep] = useState<'intro' | 'journal' | 'readback' | 'timer'>('intro');
  const [journalText, setJournalText] = useState('');
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.6)).current;

  // Load draft text on mount
  useEffect(() => {
    SecureStore.getItemAsync('courage_moment_draft').then(draft => {
      if (draft) {
        setJournalText(draft);
      }
    }).catch(err => console.error("Error loading draft:", err));
  }, []);

  // Auto-save draft helper
  const handleTextChange = (text: string) => {
    setJournalText(text);
    SecureStore.setItemAsync('courage_moment_draft', text)
      .catch(err => console.error("Error auto-saving draft:", err));
  };

  // Initial animations
  useEffect(() => {
    // Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.03, duration: 11000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 11000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background shift
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 22000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 22000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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

  const changeStep = (nextStep: typeof step) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setStep(nextStep);
      if (nextStep === 'timer') {
        setIsActive(true);
      }
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }).start();
    });
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            task_name: 'Write Courage Moment',
            journal_entry: journalText
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = { 
            pointsAdded: data.points_rewarded?.toString() || data.pointsAdded?.toString() || "200", 
            totalPoints: data.totalPoints?.toString() || "0",
            streak: data.streak?.toString() || "0"
          };
          // Clear local draft text upon completion
          await SecureStore.deleteItemAsync('courage_moment_draft');
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
        message: "You grew stronger.",
        difficulty: "medium"
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

      {/* Background Image with scale breathing animation */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <Image 
          source={require('../assets/images/courage-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Blurred image overlay when timer starts */}
      {step === 'timer' && (
        <View style={StyleSheet.absoluteFillObject}>
          <Image 
            source={require('../assets/images/courage-bg.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={25}
          />
        </View>
      )}

      {/* Cinematic dark overlay to make sure text is highly legible */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(35, 22, 10, 0.45)', 'rgba(50, 32, 15, 0.7)', 'rgba(24, 15, 5, 0.95)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Main Content Safe Area */}
      <SafeAreaView style={styles.foregroundLayer} edges={['top', 'bottom']}>

        {/* Header navigation (abort button) */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (step === 'timer' && !isCompleted) {
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
          <Text style={styles.headerTitle}>WRITE COURAGE MOMENT</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.mainContent, { opacity: contentFadeAnim }]}>
          
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.mascotContainer}>
                <Text style={styles.heroEmoji}>🪶</Text>
              </View>

              <View style={styles.glassPanel}>
                <Text style={styles.title}>Write Courage Moment</Text>
                
                {/* Badges */}
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeDuration]}>
                    <Feather name="clock" size={14} color="#fb923c" />
                    <Text style={[styles.badgeText, styles.textDuration]}>5 min</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeDifficulty]}>
                    <Feather name="zap" size={14} color="#eab308" />
                    <Text style={[styles.badgeText, styles.textDifficulty]}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, styles.badgePoints]}>
                    <Feather name="award" size={14} color="#fbbf24" />
                    <Text style={[styles.badgeText, styles.textPoints]}>+300 Pts</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionList}>
                  <Text style={styles.introText}>Think about a moment in your life when you showed courage. It doesn't have to be something extraordinary.</Text>
                  <Text style={styles.descLine}>• Maybe you faced a fear, apologized sincerely, or tried something new.</Text>
                  <Text style={styles.descLine}>• Reflect on how it made you feel and what you learned.</Text>
                  <Text style={styles.courageText}>"The courage you showed then still lives within you today."</Text>
                </View>

                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>Every act of courage deserves to be remembered.</Text>
                </View>

                <TouchableOpacity style={styles.startButton} onPress={() => changeStep('journal')} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#fb923c', '#f97316']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.startButtonText}>Start Reflection</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* STEP 2: JOURNAL WRITING SCREEN */}
          {step === 'journal' && (
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>REFLECTION JOURNAL</Text>
                <Text style={styles.sectionTitle}>Describe a moment when you were brave.</Text>
                <Text style={styles.sectionDescription}>Write about a time you faced a challenge, stepped outside your comfort zone, or did something that made you proud (minimum 50 characters):</Text>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Write about a time when you faced a challenge, stepped outside your comfort zone, or did something that made you proud..."
                  placeholderTextColor="#9ca3af"
                  value={journalText}
                  onChangeText={handleTextChange}
                  maxLength={500}
                />
                <Text style={styles.charCount}>
                  {journalText.length} / 500 (minimum 50)
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.startButton, journalText.trim().length < 50 && styles.disabledButton]} 
                onPress={() => journalText.trim().length >= 50 && changeStep('readback')} 
                activeOpacity={0.85}
                disabled={journalText.trim().length < 50}
              >
                <LinearGradient
                  colors={journalText.trim().length < 50 ? ['#4b5563', '#374151'] : ['#fb923c', '#f97316']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.startButtonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 3: READ-BACK AND CONTINUE */}
          {step === 'readback' && (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>READ AND ABSORB</Text>
                <Text style={styles.sectionTitle}>Take a moment to read what you wrote.</Text>
              </View>

              <View style={styles.readbackPanel}>
                <Text style={styles.readbackQuoteIcon}>“</Text>
                <Text style={styles.readbackText}>{journalText}</Text>
                <Text style={styles.readbackQuoteIconEnd}>”</Text>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={() => changeStep('timer')} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#fb923c', '#f97316']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.startButtonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 4: REFLECTION TIMER */}
          {step === 'timer' && (
            <View style={styles.timerContentWrapper}>
              {!isCompleted && (
                <>
                  <View style={styles.timerMascotCircle}>
                    <Text style={styles.giantEmoji}>🪶</Text>
                  </View>

                  <Pressable onPress={handleDevSkip}>
                    <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                      {formatTime(timeLeft)}
                    </Animated.Text>
                  </Pressable>

                  <Text style={styles.focusSubtitle}>
                    {isPaused ? "Timer Paused" : "Quietly reflecting on your courage..."}
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
                          { text: "Abort", style: "destructive", onPress: () => router.back() }
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.abortButtonText}>Abort Task</Text>
                  </TouchableOpacity>
                </>
              )}

              {isCompleted && (
                <View style={styles.successContainer}>
                  <Text style={styles.successEmoji}>🪶</Text>
                  <Text style={styles.successText}>You grew stronger.</Text>
                  <Text style={styles.successMessage}>Reflecting on your own resilience boosts confidence and emotional strength.</Text>
                  <TouchableOpacity 
                    style={styles.finishButton} 
                    onPress={completeTaskBackend}
                    disabled={isLoading}
                  >
                    <Text style={styles.finishButtonText}>
                      {isLoading ? "Awarding Points..." : "Claim +200 Points"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    backgroundColor: '#1b120c',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mainContent: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  mascotContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderRadius: 75,
    width: 125,
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fb923c',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.35)',
  },
  heroEmoji: {
    fontSize: 64,
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(30, 22, 18, 0.85)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.2)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeDifficulty: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  badgePoints: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textDuration: {
    color: '#fb923c',
  },
  textDifficulty: {
    color: '#eab308',
  },
  textPoints: {
    color: '#fbbf24',
  },
  descriptionList: {
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  introText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    textAlign: 'center',
  },
  descLine: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    textAlign: 'center',
  },
  courageText: {
    fontSize: 14,
    color: '#fbd5c6',
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
    marginBottom: 20,
  },
  messageText: {
    color: '#ffedd5',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
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

  // Journal steps
  sectionHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 22,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fb923c',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 28,
  },
  textInput: {
    width: '100%',
    minHeight: 180,
    backgroundColor: 'rgba(30, 22, 18, 0.82)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 146, 60, 0.25)',
    color: '#ffffff',
    fontSize: 15,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: '600',
  },

  // Readback Panel
  readbackPanel: {
    width: '100%',
    backgroundColor: 'rgba(30, 22, 18, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.15)',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  readbackQuoteIcon: {
    fontSize: 40,
    color: '#fb923c',
    opacity: 0.3,
    lineHeight: 30,
    marginBottom: -10,
  },
  readbackText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  readbackQuoteIconEnd: {
    fontSize: 40,
    color: '#fb923c',
    opacity: 0.3,
    lineHeight: 30,
    textAlign: 'right',
    marginTop: -10,
  },

  // Timer Screen styles
  timerContentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timerMascotCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#fb923c',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  giantEmoji: {
    fontSize: 70,
  },
  timerText: {
    fontSize: 84,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowColor: 'rgba(251, 146, 60, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
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
    backgroundColor: '#fb923c',
    borderColor: '#f97316',
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
    paddingHorizontal: 10,
    width: '100%',
  },
  successEmoji: {
    fontSize: 76,
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
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
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
