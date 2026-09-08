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
import { requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { appendFileToFormData } from './create-post';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 10 * 60; // 10 minutes (600 seconds)

export default function ShareInsightTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Flow steps:
  // 0 = Luxury Dashboard (Intro)
  // 1 = Light the Lantern Gate
  // 2 = Lesson Discovery (Topic selection)
  // 3 = Share Your Insight (Quote Creator + voice recording)
  // 4 = Send the Light (Lantern float animation)
  // 5 = Quiet Gratitude (10-min meditative timer)
  // 6 = Final Celebration (Sky lanterns & certificate)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - LESSON DISCOVERY STATE
  const wisdomTopics = [
    { label: 'Growth', emoji: '🌱', color: '#34D399' },
    { label: 'Courage', emoji: '💪', color: '#FF7043' },
    { label: 'Kindness', emoji: '❤️', color: '#F472B6' },
    { label: 'Patience', emoji: '🧘', color: '#60A5FA' },
    { label: 'Calmness', emoji: '🌊', color: '#38BDF8' },
    { label: 'Discipline', emoji: '🔥', color: '#F59E0B' },
    { label: 'Hope', emoji: '✨', color: '#FBBF24' },
    { label: 'Connection', emoji: '🤝', color: '#A78BFA' },
    { label: 'Positivity', emoji: '🌞', color: '#FDE047' },
  ];
  const [selectedTopic, setSelectedTopic] = useState<{ label: string; emoji: string; color: string } | null>(null);

  // STEP 3 - QUOTE CREATOR & VOICE STATE
  const [insightText, setInsightText] = useState('');
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [voiceServerPath, setVoiceServerPath] = useState<string | null>(null);

  // STEP 4 - LANTERN FLOAT ANIMATION STATE
  const lanternY = useRef(new Animated.Value(0)).current;
  const lanternScale = useRef(new Animated.Value(1)).current;
  const lanternOpacity = useRef(new Animated.Value(1)).current;

  // STEP 5 - TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);

  const wisdomReminders = [
    '✨ "Someone may need the words you just shared."',
    '🏮 "Wisdom grows when it\'s shared."',
    '🌅 "Your experiences have value."',
    '❤️ "Truth spoken with kindness becomes hope."',
    '🕊️ "Your story can unlock someone else\'s freedom."',
  ];

  // ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Gate Lantern Ignition Animation (Step 1)
  const lanternGlowPulse = useRef(new Animated.Value(0.6)).current;

  // Ambient Floating Lanterns (Step 5)
  const floatingLanterns = useRef(
    Array.from({ length: 10 }, () => ({
      x: Math.random() * (width - 40),
      y: new Animated.Value(height + 40),
      scale: Math.random() * 0.5 + 0.5,
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Ambient Fireflies (Step 5)
  const fireflies = useRef(
    Array.from({ length: 15 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
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

      if (nextStep === 1) {
        startGateLanternPulse();
      } else if (nextStep === 5) {
        startFloatingLanterns();
        startFireflies();
      }
    });
  };

  // STEP 1 - GATE LANTERN PULSE
  const startGateLanternPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lanternGlowPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(lanternGlowPulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  };

  // STEP 2 - SAVE TOPIC
  const handleSelectTopic = async (topic: { label: string; emoji: string; color: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTopic(topic);

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/insight/save-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Share Insight',
          topic: topic.label,
        }),
      });

      if (res.ok) {
        transitionToStep(3);
      } else {
        Alert.alert('Save Error', 'Could not save topic selection.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3 - VOICE RECORDING & SAVE QUOTE
  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for recording your insight.');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setRecording({ getURI: () => null, stopAndUnloadAsync: async () => {} });
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
      await appendFileToFormData(formData, 'voice', uri, `voice_${Date.now()}.m4a`, 'audio/m4a');

      const res = await apiFetch('/api/tasks/insight/upload-voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const handleSaveQuoteAndPreview = async () => {
    if (insightText.trim().length < 5 && !voiceServerPath) {
      Alert.alert('Insight Required', 'Please write a brief insight or record a voice message.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/insight/save-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Share Insight',
          insight_text: insightText,
          voice_path: voiceServerPath,
        }),
      });

      if (res.ok) {
        transitionToStep(4);
      } else {
        Alert.alert('Save Error', 'Could not save insight quote.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4 - SEND THE LIGHT ANIMATION
  const handleSendLightAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(lanternY, { toValue: -height * 0.6, duration: 2500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(lanternScale, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      Animated.timing(lanternOpacity, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ]).start(() => {
      transitionToStep(5);
    });
  };

  // STEP 5 - TIMER & AMBIENT LANTERNS
  const startFloatingLanterns = () => {
    floatingLanterns.forEach((lantern) => {
      lantern.y.setValue(height + 40);
      lantern.opacity.setValue(0);
      const duration = Math.random() * 8000 + 7000;
      const delay = Math.random() * 4000;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(lantern.y, { toValue: -60, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(lantern.opacity, { toValue: 0.8, duration: duration * 0.2, useNativeDriver: true }),
              Animated.timing(lantern.opacity, { toValue: 0, duration: duration * 0.8, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const startFireflies = () => {
    fireflies.forEach((f) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(Math.random() * 2000),
          Animated.parallel([
            Animated.timing(f.opacity, { toValue: Math.random() * 0.8 + 0.2, duration: 1500, useNativeDriver: true }),
            Animated.timing(f.x, { toValue: Math.random() * width, duration: 3000, useNativeDriver: true }),
            Animated.timing(f.y, { toValue: Math.random() * height, duration: 3000, useNativeDriver: true }),
          ]),
          Animated.timing(f.opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
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
            setCurrentReminderIdx((idx) => (idx + 1) % wisdomReminders.length);
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
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Share Insight',
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
      await apiFetch('/api/tasks/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_name: 'Share Insight' }),
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

  // BACKGROUND PALETTE RENDERER (Sunset Coral / Amber / Dark Dusk Lake)
  const renderBackground = () => {
    return (
      <LinearGradient
        colors={['#1A0C08', '#3B140B', '#7C2D12']}
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

      {/* Ambient Floating Lanterns (Step 5 & 6) */}
      {(step === 5 || step === 6) &&
        floatingLanterns.map((l, idx) => (
          <Animated.View
            key={`l-ambient-${idx}`}
            style={[
              styles.floatingLanternItem,
              {
                left: l.x,
                transform: [{ translateY: l.y }, { scale: l.scale }],
                opacity: l.opacity,
              },
            ]}
          >
            <Text style={styles.floatingLanternEmoji}>🏮</Text>
          </Animated.View>
        ))}

      {/* Ambient Fireflies (Step 5) */}
      {step === 5 &&
        fireflies.map((f, idx) => (
          <Animated.View
            key={`firefly-${idx}`}
            style={[
              styles.fireflyItem,
              {
                transform: [{ translateX: f.x }, { translateY: f.y }],
                opacity: f.opacity,
              },
            ]}
          >
            <View style={styles.fireflyDot} />
          </Animated.View>
        ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 6 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 5) {
                  Alert.alert('Abort Ceremony', 'Are you sure you want to stop this wisdom sharing session?', [
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
                <Feather name="x" size={20} color="#FFD8B1" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 6 && { backgroundColor: '#FFB74D', shadowColor: '#FFB74D' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'WISDOM CEREMONY'
                : step === 6
                ? 'WISDOM SHARED'
                : `INSIGHT.0${step}`}
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
                <View style={styles.lanternHalo}>
                  <Text style={styles.largeLanternEmoji}>🏮</Text>
                </View>
              </View>

              <View style={styles.dashboardGlassCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ HARD WISDOM SHARING</Text>
                <Text style={styles.dashboardTitle}>Share Insight</Text>
                <View style={styles.dashboardBadgesRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#FFB74D" />
                    <Text style={styles.dashBadgeText}>10 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="award" size={14} color="#FFB74D" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardDescription}>
                  Every experience teaches us something. Choose one lesson you've learned through your journey and share it.
                </Text>
              </View>

              <View style={styles.wisdomCardCircle}>
                <Text style={styles.wisdomCardCircleText}>1</Text>
                <Text style={styles.wisdomCardCircleSub}>TRUTH SHARED</Text>
              </View>

              <View style={styles.quoteRibbonCard}>
                <Text style={styles.quoteText}>
                  "A lesson kept inside changes one life. A lesson shared may change another."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#FF7043', '#C2410C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>LIGHT YOUR LANTERN</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 — LIGHT THE LANTERN                             */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerGateContent}>
                <Animated.View style={[styles.sunlitLanternWrap, { opacity: lanternGlowPulse }]}>
                  <LinearGradient
                    colors={['rgba(255,183,77,0.3)', 'rgba(255,112,67,0.1)']}
                    style={styles.sunlitLanternGlow}
                  >
                    <Text style={styles.sunlitLanternEmoji}>🏮</Text>
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.gateTitle}>"Your experience can become someone else's light."</Text>
                <Text style={styles.gateSubtext}>
                  "Every lesson you've learned has the power to guide another person."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#FFB74D', '#FF7043']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>🏮 Light My Lantern</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 — LESSON DISCOVERY                              */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>LESSON DISCOVERY</Text>
                <Text style={styles.stepTitle}>Choose a Wisdom Topic</Text>
              </View>

              <ScrollView contentContainerStyle={styles.topicsGridContent} showsVerticalScrollIndicator={false}>
                {/* Center Lantern */}
                <View style={styles.centerLanternDisplay}>
                  <View
                    style={[
                      styles.centerLanternPulseRing,
                      selectedTopic && { borderColor: selectedTopic.color },
                    ]}
                  >
                    <Text style={styles.centerLanternEmoji}>🏮</Text>
                  </View>
                  {selectedTopic && (
                    <Text style={[styles.selectedTopicTag, { color: selectedTopic.color }]}>
                      Selected: {selectedTopic.emoji} {selectedTopic.label}
                    </Text>
                  )}
                </View>

                {/* 9 Wisdom Topics */}
                <View style={styles.topicsGrid}>
                  {wisdomTopics.map((topic, idx) => {
                    const isSelected = selectedTopic?.label === topic.label;
                    return (
                      <TouchableOpacity
                        key={`topic-${idx}`}
                        onPress={() => handleSelectTopic(topic)}
                        activeOpacity={0.8}
                        style={[
                          styles.topicCard,
                          isSelected && { borderColor: topic.color, backgroundColor: 'rgba(255,255,255,0.15)' },
                        ]}
                      >
                        <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                        <Text style={styles.topicLabel}>{topic.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 — SHARE YOUR INSIGHT (QUOTE CREATOR)            */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>QUOTE CREATOR</Text>
                <Text style={styles.stepTitle}>Share Your Insight</Text>
              </View>

              <ScrollView contentContainerStyle={styles.quoteCreatorContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.quotePromptQuestion}>
                  "If someone were facing what you once faced... what would you tell them?"
                </Text>

                {/* Live Typography Preview Quote Card */}
                <View style={styles.quotePreviewCard}>
                  <Text style={styles.quoteCardTopicBadge}>
                    {selectedTopic ? `${selectedTopic.emoji} ${selectedTopic.label}` : '✨ Wisdom'}
                  </Text>
                  <Text style={styles.quoteCardTextPreview}>
                    {insightText.trim().length > 0
                      ? `"${insightText}"`
                      : '"Your written wisdom will appear here as a live inspirational quote..."'}
                  </Text>
                  <Text style={styles.quoteCardSignature}>— Shared from my journey</Text>
                </View>

                <TextInput
                  style={styles.quoteInput}
                  placeholder="Write your insight here..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  value={insightText}
                  onChangeText={setInsightText}
                />

                {/* Optional Voice Recording */}
                <View style={styles.voiceSectionWrap}>
                  <Text style={styles.voiceTitle}>Optional Voice Insight (Up to 90s):</Text>
                  {isRecording ? (
                    <TouchableOpacity onPress={stopRecording} style={styles.recordingBtnActive}>
                      <Ionicons name="stop-circle" size={24} color="#EF4444" />
                      <Text style={styles.recordingText}>Recording... {recordingTime}s (Tap to Stop)</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={startRecording} style={styles.recordingBtn}>
                      <Feather name="mic" size={18} color="#FFB74D" />
                      <Text style={styles.voiceBtnText}>
                        {voiceUri ? 'Voice Insight Recorded! (Tap to re-record)' : 'Tap to Record Voice Insight'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveQuoteAndPreview}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#FF7043', '#C2410C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>PREVIEW SKY LANTERN</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 — SEND THE LIGHT                                */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>LANTERN RELEASE</Text>
                <Text style={styles.stepTitle}>Send the Light</Text>
              </View>

              <View style={styles.sendLightContainer}>
                <Animated.View
                  style={[
                    styles.glowingSkyLanternCard,
                    {
                      transform: [{ translateY: lanternY }, { scale: lanternScale }],
                      opacity: lanternOpacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,183,77,0.3)', 'rgba(255,112,67,0.4)']}
                    style={styles.lanternGradientWrap}
                  >
                    <Text style={styles.lanternCardHeaderIcon}>🏮</Text>
                    <Text style={styles.lanternCardTopicText}>
                      {selectedTopic ? `${selectedTopic.emoji} ${selectedTopic.label}` : 'Wisdom'}
                    </Text>
                    <Text style={styles.lanternCardInsightText}>"{insightText}"</Text>
                  </LinearGradient>
                </Animated.View>
              </View>

              <TouchableOpacity
                onPress={handleSendLightAnimation}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#FFB74D', '#FF7043']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>✨ Share My Insight</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 — QUIET GRATITUDE                               */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>EVENING LAKESIDE</Text>
                <Text style={styles.stepTitle}>10 Minute Quiet Gratitude</Text>
              </View>

              <View style={styles.duskTimerScene}>
                <View style={styles.duskTimerRing}>
                  <LinearGradient
                    colors={['rgba(255,183,77,0.2)', 'rgba(255,112,67,0.3)']}
                    style={styles.duskTimerGradient}
                  >
                    <Text style={styles.duskTimerDigits}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.duskTimerLabel}>SILENT REFLECTION</Text>
                  </LinearGradient>
                </View>

                {/* Rotating Reminders */}
                <View style={styles.wisdomRemindersWrap}>
                  <Text style={styles.wisdomReminderText}>
                    {wisdomReminders[currentReminderIdx]}
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
                      colors={['#FFB74D', '#FF7043']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionBtnText}>
                        🏮 BEGIN QUIET GRATITUDE
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
                  <Text style={styles.celebrationEmoji}>🏮</Text>
                  <Text style={styles.celebrationKicker}>WISDOM SHARED</Text>
                  <Text style={styles.celebrationTitle}>"Your journey became a light for someone else."</Text>
                </View>

                {/* Illuminated Quote Certificate */}
                <View style={styles.illuminatedQuoteCard}>
                  <View style={styles.certInnerBorder}>
                    <Text style={styles.certKicker}>ANTISOCIAL WISDOM</Text>
                    <Text style={styles.certTitle}>Message of Guidance</Text>

                    <View style={styles.certLanternBadge}>
                      <Text style={styles.badgeLanternIcon}>🏮</Text>
                    </View>

                    <Text style={styles.certQuoteDisplay}>"{insightText}"</Text>

                    {selectedTopic && (
                      <View style={styles.certTopicPill}>
                        <Text style={styles.certTopicPillText}>Topic: {selectedTopic.emoji} {selectedTopic.label}</Text>
                      </View>
                    )}

                    <Text style={styles.certCompletionMessage}>"You expressed truth."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCompleteTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#FFB74D', '#FF7043']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'SAVING WISDOM...' : 'COMPLETE TASK (+600 PTS)'}
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
    backgroundColor: '#1A0C08',
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
    borderColor: 'rgba(255,183,77,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7043',
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
  floatingLanternItem: {
    position: 'absolute',
    zIndex: 2,
  },
  floatingLanternEmoji: {
    fontSize: 28,
  },
  fireflyItem: {
    position: 'absolute',
    zIndex: 2,
  },
  fireflyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDE047',
    shadowColor: '#FDE047',
    shadowRadius: 6,
    shadowOpacity: 0.8,
  },

  // STEP 0 - DASHBOARD
  dashboardIllustrationWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  lanternHalo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,183,77,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7043',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  largeLanternEmoji: {
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
    color: '#FFB74D',
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
    backgroundColor: 'rgba(255,183,77,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  dashBadgeText: {
    color: '#FFB74D',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  wisdomCardCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,112,67,0.15)',
    borderWidth: 1,
    borderColor: '#FF7043',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  wisdomCardCircleText: {
    color: '#FFB74D',
    fontSize: 32,
    fontWeight: '900',
  },
  wisdomCardCircleSub: {
    color: '#D1D5DB',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  quoteRibbonCard: {
    backgroundColor: 'rgba(255,112,67,0.06)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,112,67,0.15)',
    marginVertical: 15,
  },
  quoteText: {
    color: '#FFD8B1',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#FF7043',
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

  // STEP 1 - LIGHT THE LANTERN
  centerGateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sunlitLanternWrap: {
    marginBottom: 30,
  },
  sunlitLanternGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  sunlitLanternEmoji: {
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
    color: '#FFD8B1',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontStyle: 'italic',
  },

  // STEP 2 - LESSON DISCOVERY
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  stepKicker: {
    color: '#FFB74D',
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
  topicsGridContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  centerLanternDisplay: {
    alignItems: 'center',
    marginVertical: 15,
  },
  centerLanternPulseRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 2,
    borderColor: '#FFB74D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLanternEmoji: {
    fontSize: 44,
  },
  selectedTopicTag: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  topicCard: {
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  topicEmoji: {
    fontSize: 22,
  },
  topicLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // STEP 3 - QUOTE CREATOR
  quoteCreatorContent: {
    paddingBottom: 20,
  },
  quotePromptQuestion: {
    color: '#FFD8B1',
    fontSize: 15,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  quotePreviewCard: {
    backgroundColor: 'rgba(255,112,67,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF7043',
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  quoteCardTopicBadge: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  quoteCardTextPreview: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  quoteCardSignature: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 12,
  },
  quoteInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  voiceSectionWrap: {
    marginTop: 15,
  },
  voiceTitle: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.3)',
    gap: 8,
  },
  recordingBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  voiceBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // STEP 4 - SEND THE LIGHT
  sendLightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowingSkyLanternCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFB74D',
    shadowColor: '#FFB74D',
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  lanternGradientWrap: {
    padding: 24,
    alignItems: 'center',
  },
  lanternCardHeaderIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  lanternCardTopicText: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  lanternCardInsightText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },

  // STEP 5 - QUIET GRATITUDE TIMER
  duskTimerScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  duskTimerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    padding: 4,
    backgroundColor: 'rgba(255,183,77,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duskTimerGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 106,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duskTimerDigits: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '300',
  },
  duskTimerLabel: {
    color: '#FFB74D',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  wisdomRemindersWrap: {
    marginTop: 40,
    paddingHorizontal: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  wisdomReminderText: {
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
    color: '#FFB74D',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  celebrationTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 30,
  },
  illuminatedQuoteCard: {
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
    borderColor: 'rgba(255,183,77,0.3)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certKicker: {
    color: '#FFB74D',
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
  certLanternBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,112,67,0.2)',
    borderWidth: 1,
    borderColor: '#FF7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeLanternIcon: {
    fontSize: 30,
  },
  certQuoteDisplay: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  certTopicPill: {
    backgroundColor: 'rgba(255,183,77,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  certTopicPillText: {
    color: '#FFB74D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  certCompletionMessage: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
