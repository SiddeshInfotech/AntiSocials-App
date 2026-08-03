import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 10 * 60; // 10 minutes (600 seconds)

export default function ThankYourselfTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Flow steps:
  // 0 = Luxury Dashboard (Intro)
  // 1 = Welcome Gate (Sunlight room & mirror intro)
  // 2 = Appreciation Mirror (Selection of min 3 affirmations)
  // 3 = Gratitude Letter (Handwritten note + voice recording + envelope fold)
  // 4 = Achievement Gallery (3 picture frames)
  // 5 = Self-Appreciation Timer (10-min meditative timer with candle & petals)
  // 6 = Final Celebration (Golden mirror glow & certificate)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - AFFIRMATIONS STATE
  const affirmationCards = [
    { label: 'Thank you for not giving up.', emoji: '🤍', color: '#FFF8E7' },
    { label: 'Thank you for trying again.', emoji: '🌸', color: '#F8D7DA' },
    { label: 'Thank you for learning.', emoji: '✨', color: '#E6C068' },
    { label: 'Thank you for believing.', emoji: '☀️', color: '#FEF3C7' },
    { label: 'Thank you for being patient.', emoji: '🧘', color: '#E0E7FF' },
    { label: 'Thank you for showing up today.', emoji: '🌿', color: '#D1FAE5' },
  ];
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);

  // STEP 3 - GRATITUDE LETTER & VOICE STATE
  const [letterText, setLetterText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [voiceServerPath, setVoiceServerPath] = useState<string | null>(null);
  const [isLetterFolded, setIsLetterFolded] = useState(false);

  // STEP 4 - ACHIEVEMENT GALLERY STATE
  const [challengeOvercome, setChallengeOvercome] = useState('');
  const [habitImproved, setHabitImproved] = useState('');
  const [momentProud, setMomentProud] = useState('');

  // STEP 5 - TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const appreciationMessages = [
    '🤍 "Your effort matters."',
    '✨ "Progress deserves recognition."',
    '🌸 "Be as kind to yourself as you are to others."',
    '☀️ "You are worthy of your own appreciation."',
    '🥂 "Every small victory builds your future."',
  ];

  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Mirror brightness animation (Step 2)
  const mirrorGlowAnim = useRef(new Animated.Value(0.2)).current;

  // Envelope Fold animation (Step 3)
  const envelopeFoldAnim = useRef(new Animated.Value(0)).current;

  // Candle & Petals ambient particles (Step 5)
  const candleFlickerAnim = useRef(new Animated.Value(1)).current;

  const floatingPetals = useRef(
    Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(-40),
      scale: Math.random() * 0.6 + 0.4,
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const floatingGoldenDust = useRef(
    Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 20),
      scale: Math.random() * 0.5 + 0.3,
      opacity: new Animated.Value(0),
    }))
  ).current;

  // AppState for background timer tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);

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

      if (nextStep === 2) {
        Animated.timing(mirrorGlowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
      } else if (nextStep === 5) {
        startCandleFlicker();
        startFloatingPetals();
        startFloatingGoldenDust();
      }
    });
  };

  // STEP 2 - AFFIRMATIONS SELECTION & SAVE
  const toggleAffirmation = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedAffirmations.includes(label)) {
      setSelectedAffirmations(selectedAffirmations.filter((a) => a !== label));
    } else {
      setSelectedAffirmations([...selectedAffirmations, label]);
    }
  };

  const handleSaveAffirmations = async () => {
    if (selectedAffirmations.length < 3) {
      Alert.alert('Selection Required', 'Please tap at least 3 affirmations that resonate with you.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/thank-yourself/save-affirmations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Thank Yourself',
          selected_affirmations: selectedAffirmations,
        }),
      });

      if (res.ok) {
        transitionToStep(3);
      } else {
        Alert.alert('Save Error', 'Could not save selected affirmations.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Unable to connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3 - AUDIO RECORDING & ENVELOPE FOLD
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice reflections.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 90) {
            stopRecording();
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setVoiceUri(uri);
      setRecording(null);
      if (uri) {
        uploadVoiceFile(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const uploadVoiceFile = async (uri: string) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const formData = new FormData();
      formData.append('voice', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'audio/m4a',
        name: `voice_${Date.now()}.m4a`,
      } as any);

      const res = await fetch(`${API_BASE_URL}/api/tasks/thank-yourself/upload-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.voicePath) {
        setVoiceServerPath(data.voicePath);
      }
    } catch (e) {
      console.error('Voice upload failed', e);
    }
  };

  const handleFoldEnvelopeAndSave = async () => {
    if (letterText.trim().length < 5 && !voiceServerPath) {
      Alert.alert('Reflective Note Needed', 'Please write a short note to yourself or record a voice note.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Fold animation sequence
    Animated.timing(envelopeFoldAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => {
      setIsLetterFolded(true);
    });

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/thank-yourself/save-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Thank Yourself',
          letter_text: letterText,
          voice_path: voiceServerPath,
        }),
      });

      if (res.ok) {
        setTimeout(() => transitionToStep(4), 1000);
      } else {
        Alert.alert('Save Error', 'Could not save gratitude letter.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4 - GALLERY SAVE
  const handleSaveGallery = async () => {
    if (challengeOvercome.trim().length < 3 || habitImproved.trim().length < 3 || momentProud.trim().length < 3) {
      Alert.alert('Complete Gallery', 'Please fill all three picture frames before proceeding.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks/thank-yourself/save-gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Thank Yourself',
          challenge_overcome: challengeOvercome,
          habit_improved: habitImproved,
          moment_proud: momentProud,
        }),
      });

      if (res.ok) {
        transitionToStep(5);
      } else {
        Alert.alert('Save Error', 'Could not save gallery frames.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5 - TIMER & AMBIENT ANIMATIONS
  const startCandleFlicker = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(candleFlickerAnim, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(candleFlickerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(candleFlickerAnim, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const startFloatingPetals = () => {
    floatingPetals.forEach((p) => {
      p.y.setValue(-40);
      p.opacity.setValue(0);
      p.rotation.setValue(0);
      const duration = Math.random() * 8000 + 6000;
      const delay = Math.random() * 4000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.y, { toValue: height + 40, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(p.rotation, { toValue: 360, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: 0.8, duration: duration * 0.2, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.8, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const startFloatingGoldenDust = () => {
    floatingGoldenDust.forEach((d) => {
      d.y.setValue(height + 20);
      d.opacity.setValue(0);
      const duration = Math.random() * 6000 + 4000;
      const delay = Math.random() * 3000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(d.y, { toValue: -40, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(d.opacity, { toValue: 0.7, duration: duration * 0.3, useNativeDriver: true }),
              Animated.timing(d.opacity, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next > 0 && next % 120 === 0) {
            setCurrentReminderIdx((idx) => (idx + 1) % appreciationMessages.length);
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
          body: JSON.stringify({
            task_name: 'Thank Yourself',
            voice_reflection: voiceServerPath,
          }),
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
        body: JSON.stringify({ task_name: 'Thank Yourself' }),
      });
      transitionToStep(1);
    } catch (err) {
      transitionToStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // BACKGROUND PALETTE RENDERER (Pearl White / Champagne Gold / Soft Rose)
  const renderBackground = () => {
    return (
      <LinearGradient
        colors={['#FFF8E7', '#F8D7DA', '#E6C068']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderBackground()}

      {/* Step 5 Ambient Drifting Rose Petals */}
      {step === 5 &&
        floatingPetals.map((p, idx) => (
          <Animated.View
            key={`petal-${idx}`}
            style={[
              styles.floatingPetal,
              {
                left: p.x,
                transform: [
                  { translateY: p.y },
                  { scale: p.scale },
                  {
                    rotate: p.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: p.opacity,
              },
            ]}
          >
            <Text style={styles.petalEmojiText}>🌸</Text>
          </Animated.View>
        ))}

      {/* Step 5 Ambient Floating Golden Dust */}
      {step === 5 &&
        floatingGoldenDust.map((d, idx) => (
          <Animated.View
            key={`dust-${idx}`}
            style={[
              styles.floatingDust,
              {
                left: d.x,
                transform: [{ translateY: d.y }, { scale: d.scale }],
                opacity: d.opacity,
              },
            ]}
          >
            <Text style={styles.dustEmojiText}>✨</Text>
          </Animated.View>
        ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 6 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 5) {
                  Alert.alert('Abort Ceremony', 'Are you sure you want to stop this self-appreciation ceremony?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Abort', style: 'destructive', onPress: () => router.back() },
                  ]);
                } else {
                  transitionToStep(step - 1);
                }
              }}
              style={styles.backBtn}
            >
              <Feather name="chevron-left" size={24} color="#4A3E3D" />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          ) : (
            step === 0 && (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="x" size={20} color="#4A3E3D" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 6 && { backgroundColor: '#E6C068', shadowColor: '#E6C068' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'SELF APPRECIATION'
                : step === 6
                ? 'ACKNOWLEDGED'
                : `CEREMONY.0${step}`}
            </Text>
          </View>

          {step === 5 && (
            <TouchableOpacity onPress={devSkipTimer} activeOpacity={0.8} style={styles.devSkipBtn}>
              <Feather name="chevrons-right" size={16} color="rgba(74,62,61,0.4)" />
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
                <View style={styles.mirrorHalo}>
                  <Text style={styles.largeMirrorEmoji}>🪞</Text>
                </View>
              </View>

              <View style={styles.dashboardGlassCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ HARD SELF APPRECIATION</Text>
                <Text style={styles.dashboardTitle}>Thank Yourself</Text>
                <View style={styles.dashboardBadgesRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#8C6D23" />
                    <Text style={styles.dashBadgeText}>10 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="award" size={14} color="#8C6D23" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardDescription}>
                  You spend so much time appreciating others. Today, take a few quiet moments to thank yourself for showing up and growing.
                </Text>
              </View>

              <View style={styles.ribbonQuoteCard}>
                <View style={styles.ribbonBadge}>
                  <Text style={styles.ribbonIcon}>🤲</Text>
                </View>
                <Text style={styles.quoteText}>
                  "Your effort deserves your gratitude, even when nobody else sees it."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#E6C068', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>BEGIN APPRECIATION CEREMONY</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 — WELCOME                                       */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerGateContent}>
                <View style={styles.sunlitMirrorWrap}>
                  <LinearGradient
                    colors={['#FFF8E7', '#F8D7DA']}
                    style={styles.sunlitMirrorGlow}
                  >
                    <Text style={styles.sunlitMirrorEmoji}>🪞</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.gateTitle}>
                  "Today, the person who deserves your gratitude is you."
                </Text>
                <Text style={styles.gateSubtext}>
                  "You have survived difficult days, kept going, and continued to grow."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#E6C068', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>✨ Begin Appreciation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 — APPRECIATION MIRROR                           */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>AFFIRMATION SELECTION</Text>
                <Text style={styles.stepTitle}>Appreciation Mirror</Text>
                <Text style={styles.stepSubtitle}>"Look at yourself with kindness." (Select at least 3)</Text>
              </View>

              <ScrollView contentContainerStyle={styles.affirmationsContainer} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.mirrorDisplayFrame, { opacity: mirrorGlowAnim }]}>
                  <Text style={styles.mirrorDisplayEmoji}>🪞</Text>
                </Animated.View>

                <View style={styles.affirmationsList}>
                  {affirmationCards.map((card, idx) => {
                    const isSelected = selectedAffirmations.includes(card.label);
                    return (
                      <TouchableOpacity
                        key={`aff-${idx}`}
                        onPress={() => toggleAffirmation(card.label)}
                        activeOpacity={0.8}
                        style={[styles.affirmationCard, isSelected && styles.affirmationCardSelected]}
                      >
                        <Text style={styles.affEmoji}>{card.emoji}</Text>
                        <Text style={[styles.affLabel, isSelected && styles.affLabelSelected]}>{card.label}</Text>
                        <Feather
                          name={isSelected ? 'check-circle' : 'circle'}
                          size={18}
                          color={isSelected ? '#B8860B' : '#C4B59D'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveAffirmations}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#E6C068', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>
                    SAVE AFFIRMATIONS ({selectedAffirmations.length}/3)
                  </Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 — GRATITUDE LETTER                              */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>HANDWRITTEN NOTE</Text>
                <Text style={styles.stepTitle}>Write a Thank-You Note</Text>
              </View>

              <ScrollView contentContainerStyle={styles.letterContentContainer} showsVerticalScrollIndicator={false}>
                {/* Parchment Note */}
                <Animated.View
                  style={[
                    styles.parchmentLetter,
                    {
                      transform: [
                        {
                          scale: envelopeFoldAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.4],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.letterPromptsTitle}>Starter Prompts:</Text>
                  <Text style={styles.letterPromptBullet}>• I'm proud of myself because...</Text>
                  <Text style={styles.letterPromptBullet}>• One thing I handled well was...</Text>
                  <Text style={styles.letterPromptBullet}>• I appreciate myself for...</Text>

                  <TextInput
                    style={styles.parchmentInput}
                    placeholder="Dear me, thank you for showing up today..."
                    placeholderTextColor="#A3937B"
                    multiline
                    value={letterText}
                    onChangeText={setLetterText}
                  />

                  {/* Voice Reflection Control */}
                  <View style={styles.voiceSectionWrap}>
                    <Text style={styles.voiceTitle}>Optional Voice Note (Up to 90s):</Text>
                    {isRecording ? (
                      <TouchableOpacity onPress={stopRecording} style={styles.recordingBtnActive}>
                        <Ionicons name="stop-circle" size={24} color="#EF4444" />
                        <Text style={styles.recordingText}>Recording... {recordingTime}s (Tap to Stop)</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={startRecording} style={styles.recordingBtn}>
                        <Feather name="mic" size={18} color="#8C6D23" />
                        <Text style={styles.voiceBtnText}>
                          {voiceUri ? 'Voice Note Recorded! (Tap to re-record)' : 'Tap to Record Voice Note'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>

                {isLetterFolded && (
                  <View style={styles.waxEnvelopeView}>
                    <Text style={styles.envelopeIcon}>✉️</Text>
                    <Text style={styles.waxSealText}>Sealed with Golden Stamp</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                onPress={handleFoldEnvelopeAndSave}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#E6C068', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>SEAL LETTER WITH WAX</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 — ACHIEVEMENT GALLERY                           */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>GALLERY WALL</Text>
                <Text style={styles.stepTitle}>Achievement Gallery</Text>
                <Text style={styles.stepSubtitle}>Fill all three picture frames</Text>
              </View>

              <ScrollView contentContainerStyle={styles.galleryWallContainer} showsVerticalScrollIndicator={false}>
                {/* Frame 1: Challenge Overcome */}
                <View style={styles.pictureFrameCard}>
                  <View style={styles.frameHeaderRow}>
                    <Text style={styles.frameBadgeIcon}>🏆</Text>
                    <Text style={styles.frameTitleText}>Frame 1: A Challenge I Overcame</Text>
                  </View>
                  <TextInput
                    style={styles.frameTextInput}
                    placeholder="e.g. Staying calm when plans suddenly changed..."
                    placeholderTextColor="#A3937B"
                    value={challengeOvercome}
                    onChangeText={setChallengeOvercome}
                  />
                </View>

                {/* Frame 2: Habit Improved */}
                <View style={styles.pictureFrameCard}>
                  <View style={styles.frameHeaderRow}>
                    <Text style={styles.frameBadgeIcon}>🌱</Text>
                    <Text style={styles.frameTitleText}>Frame 2: A Habit I Improved</Text>
                  </View>
                  <TextInput
                    style={styles.frameTextInput}
                    placeholder="e.g. Taking regular breaks away from screens..."
                    placeholderTextColor="#A3937B"
                    value={habitImproved}
                    onChangeText={setHabitImproved}
                  />
                </View>

                {/* Frame 3: Moment Proud Of */}
                <View style={styles.pictureFrameCard}>
                  <View style={styles.frameHeaderRow}>
                    <Text style={styles.frameBadgeIcon}>❤️</Text>
                    <Text style={styles.frameTitleText}>Frame 3: A Moment I'm Proud Of</Text>
                  </View>
                  <TextInput
                    style={styles.frameTextInput}
                    placeholder="e.g. Choosing kindness over frustration..."
                    placeholderTextColor="#A3937B"
                    value={momentProud}
                    onChangeText={setMomentProud}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveGallery}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#E6C068', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>HANG FRAMES ON WALL</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 — SELF-APPRECIATION TIMER                       */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>QUIET SANCTUARY</Text>
                <Text style={styles.stepTitle}>10 Minute Self-Appreciation</Text>
              </View>

              <View style={styles.cozyTimerScene}>
                <Animated.View style={[styles.candleLightGlow, { opacity: candleFlickerAnim }]}>
                  <Text style={styles.candleEmoji}>🕯️</Text>
                </Animated.View>

                {/* Timer Circle */}
                <View style={styles.timerCircleOuter}>
                  <LinearGradient
                    colors={['#FFF8E7', '#F8D7DA']}
                    style={styles.timerGradient}
                  >
                    <Text style={styles.timerDigitsText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerSubLabel}>WARM MOMENT</Text>
                  </LinearGradient>
                </View>

                {/* Rotating Messages */}
                <View style={styles.messagesWrap}>
                  <Text style={styles.rotatingMsgText}>
                    {appreciationMessages[currentReminderIdx]}
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
                      {isTimerPaused ? 'CONTINUE' : 'PAUSE'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartTimer}
                    activeOpacity={0.9}
                    style={styles.actionBtnWrap}
                  >
                    <LinearGradient
                      colors={['#E6C068', '#B8860B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionBtnText}>
                        ✨ BEGIN 10-MIN REFLECTION
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6 — FINAL CELEBRATION                             */}
          {/* ======================================================== */}
          {step === 6 && (
            <View style={styles.fullscreenStep}>
              <ScrollView contentContainerStyle={styles.celebrationScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.celebrationHeader}>
                  <Text style={styles.celebrationEmoji}>🪞</Text>
                  <Text style={styles.celebrationKicker}>SELF APPRECIATION COMPLETE</Text>
                  <Text style={styles.celebrationTitle}>
                    "The strongest relationship you'll ever build is the one with yourself."
                  </Text>
                </View>

                {/* Certificate */}
                <View style={styles.appreciationCertCard}>
                  <View style={styles.certInnerBorder}>
                    <Text style={styles.certKicker}>ANTISOCIAL GRATITUDE</Text>
                    <Text style={styles.certTitle}>Certificate of Self-Recognition</Text>

                    <View style={styles.certBadgeWrap}>
                      <Text style={styles.badgeIconText}>🤲</Text>
                    </View>

                    <Text style={styles.certSummaryText}>
                      You recognized your effort with <Text style={{ fontWeight: 'bold', color: '#B8860B' }}>{selectedAffirmations.length} affirmations</Text> and hung 3 achievement frames on your wall.
                    </Text>

                    <Text style={styles.certCompletionMessage}>"You acknowledged effort."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCompleteTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#E6C068', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'SAVING APPRECIATION...' : 'COMPLETE TASK (+300 PTS)'}
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
    backgroundColor: '#FFF8E7',
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
    color: '#4A3E3D',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B8860B',
    marginRight: 8,
  },
  statusText: {
    color: '#4A3E3D',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  devSkipBtn: {
    padding: 6,
  },

  // AMBIENT PARTICLES
  floatingPetal: {
    position: 'absolute',
    zIndex: 2,
  },
  petalEmojiText: {
    fontSize: 18,
  },
  floatingDust: {
    position: 'absolute',
    zIndex: 2,
  },
  dustEmojiText: {
    fontSize: 14,
  },

  // STEP 0 - DASHBOARD
  dashboardIllustrationWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mirrorHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF8E7',
    borderWidth: 2,
    borderColor: '#E6C068',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E6C068',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  largeMirrorEmoji: {
    fontSize: 54,
  },
  dashboardGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.3)',
    padding: 24,
    marginBottom: 20,
  },
  dashboardKicker: {
    color: '#8C6D23',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  dashboardTitle: {
    color: '#362A28',
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
    backgroundColor: '#FFF8E7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.3)',
  },
  dashBadgeText: {
    color: '#8C6D23',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardDescription: {
    color: '#6B5A56',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  ribbonQuoteCard: {
    backgroundColor: '#FFF8E7',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6C068',
    alignItems: 'center',
    marginVertical: 15,
  },
  ribbonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8D7DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ribbonIcon: {
    fontSize: 22,
  },
  quoteText: {
    color: '#4A3E3D',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#E6C068',
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
    letterSpacing: 1.5,
  },
  actionBtnIcon: {
    marginLeft: 8,
  },

  // STEP 1 - WELCOME
  centerGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sunlitMirrorWrap: {
    marginBottom: 30,
  },
  sunlitMirrorGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E6C068',
  },
  sunlitMirrorEmoji: {
    fontSize: 50,
  },
  gateTitle: {
    color: '#362A28',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
  },
  gateSubtext: {
    color: '#6B5A56',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 2 - APPRECIATION MIRROR
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  stepKicker: {
    color: '#8C6D23',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  stepTitle: {
    color: '#362A28',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  stepSubtitle: {
    color: '#6B5A56',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  affirmationsContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  mirrorDisplayFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E7',
    borderWidth: 2,
    borderColor: '#E6C068',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  mirrorDisplayEmoji: {
    fontSize: 36,
  },
  affirmationsList: {
    width: '100%',
    gap: 10,
  },
  affirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.3)',
    gap: 12,
  },
  affirmationCardSelected: {
    backgroundColor: '#FFF8E7',
    borderColor: '#B8860B',
  },
  affEmoji: {
    fontSize: 18,
  },
  affLabel: {
    color: '#4A3E3D',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  affLabelSelected: {
    color: '#8C6D23',
  },

  // STEP 3 - GRATITUDE LETTER
  letterContentContainer: {
    paddingBottom: 20,
  },
  parchmentLetter: {
    backgroundColor: '#FFF8E7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6C068',
    padding: 20,
  },
  letterPromptsTitle: {
    color: '#8C6D23',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  letterPromptBullet: {
    color: '#6B5A56',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  parchmentInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.4)',
    color: '#362A28',
    padding: 14,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: 'top',
    marginTop: 12,
  },
  voiceSectionWrap: {
    marginTop: 16,
  },
  voiceTitle: {
    color: '#8C6D23',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6C068',
    gap: 8,
  },
  recordingBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  voiceBtnText: {
    color: '#4A3E3D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waxEnvelopeView: {
    alignItems: 'center',
    marginTop: 20,
  },
  envelopeIcon: {
    fontSize: 48,
  },
  waxSealText: {
    color: '#8C6D23',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },

  // STEP 4 - ACHIEVEMENT GALLERY
  galleryWallContainer: {
    gap: 14,
    paddingBottom: 20,
  },
  pictureFrameCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E6C068',
    padding: 16,
  },
  frameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  frameBadgeIcon: {
    fontSize: 18,
  },
  frameTitleText: {
    color: '#4A3E3D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  frameTextInput: {
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(230,192,104,0.4)',
    color: '#362A28',
    padding: 12,
    fontSize: 13,
  },

  // STEP 5 - SELF APPRECIATION TIMER
  cozyTimerScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  candleLightGlow: {
    marginBottom: 15,
  },
  candleEmoji: {
    fontSize: 40,
  },
  timerCircleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 4,
    backgroundColor: 'rgba(230,192,104,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 106,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDigitsText: {
    color: '#362A28',
    fontSize: 44,
    fontWeight: '300',
  },
  timerSubLabel: {
    color: '#8C6D23',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  messagesWrap: {
    marginTop: 35,
    paddingHorizontal: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  rotatingMsgText: {
    color: '#4A3E3D',
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6C068',
    alignItems: 'center',
  },
  timerPauseText: {
    color: '#4A3E3D',
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
    color: '#8C6D23',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  celebrationTitle: {
    color: '#362A28',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 28,
  },
  appreciationCertCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6C068',
    width: '100%',
    padding: 6,
    marginVertical: 10,
  },
  certInnerBorder: {
    borderWidth: 2,
    borderColor: 'rgba(230,192,104,0.5)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certKicker: {
    color: '#8C6D23',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  certTitle: {
    color: '#362A28',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  certBadgeWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8D7DA',
    borderWidth: 1,
    borderColor: '#E6C068',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeIconText: {
    fontSize: 30,
  },
  certSummaryText: {
    color: '#6B5A56',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  certCompletionMessage: {
    color: '#362A28',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
