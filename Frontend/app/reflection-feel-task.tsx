import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 420; // 7 minutes in seconds

export default function ReflectionFeelTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Steps:
  // 1: Introduction / Star Sky Greet
  // 2: Emotion Wheel
  // 3: Reflection Journal / Voice
  // 4: Memory Timeline
  // 5: 7-Minute Timer with floating stars
  // 6: Success completion screen
  const [step, setStep] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasVoiceRecorded, setHasVoiceRecorded] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [memorySentence, setMemorySentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Rotating timer prompts
  const prompts = [
    '🌌 "Growth begins with awareness."',
    '💙 "Observe without judging yourself."',
    '✨ "Every small reflection creates change."',
    '🌠 "You are learning about yourself."'
  ];
  const [promptIndex, setPromptIndex] = useState(0);

  // Emotion Wheel list
  const emotions = [
    { label: 'Calm', emoji: '😊' },
    { label: 'Proud', emoji: '💪' },
    { label: 'Relaxed', emoji: '😌' },
    { label: 'Curious', emoji: '🤔' },
    { label: 'Hopeful', emoji: '🌱' },
    { label: 'Nervous', emoji: '😟' },
    { label: 'Grateful', emoji: '❤️' },
    { label: 'Inspired', emoji: '✨' }
  ];

  // Memory cards list
  const memoryCards = [
    { id: 'learned', title: 'Something I learned', emoji: '🌱', bg: 'rgba(0, 188, 212, 0.15)' },
    { id: 'surprised', title: 'Something that surprised me', emoji: '💡', bg: 'rgba(41, 121, 255, 0.15)' },
    { id: 'repeat', title: 'Something I want to repeat', emoji: '❤️', bg: 'rgba(244, 63, 94, 0.15)' }
  ];

  // Animations
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const floatMascotAnim = useRef(new Animated.Value(0)).current;
  const scaleMascotAnim = useRef(new Animated.Value(1)).current;
  const timerCircleBreathe = useRef(new Animated.Value(0.7)).current;
  const promptFadeAnim = useRef(new Animated.Value(1)).current;

  // Background Aurora aurora breathing animations
  const auroraShift = useRef(new Animated.Value(0)).current;
  const starGlowAnim = useRef(new Animated.Value(0.2)).current;

  // Shooting star animations
  const shootingStarX = useRef(new Animated.Value(-100)).current;
  const shootingStarY = useRef(new Animated.Value(-100)).current;

  // Wheel Rotation
  const wheelRotation = useRef(new Animated.Value(0)).current;

  // Voice wave scale values
  const voiceWave1 = useRef(new Animated.Value(1)).current;
  const voiceWave2 = useRef(new Animated.Value(1)).current;
  const voiceWave3 = useRef(new Animated.Value(1)).current;
  const voiceWave4 = useRef(new Animated.Value(1)).current;

  // Memory card scale/spring triggers
  const memory1Scale = useRef(new Animated.Value(1)).current;
  const memory2Scale = useRef(new Animated.Value(1)).current;
  const memory3Scale = useRef(new Animated.Value(1)).current;

  // Background AppState Recovery Tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Sync background timer updates on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(6);
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

  // General animation loops setup
  useEffect(() => {
    // Mascot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatMascotAnim, { toValue: -8, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatMascotAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Aurora gradient shifts
    Animated.loop(
      Animated.sequence([
        Animated.timing(auroraShift, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(auroraShift, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Stars sparkling
    Animated.loop(
      Animated.sequence([
        Animated.timing(starGlowAnim, { toValue: 0.95, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(starGlowAnim, { toValue: 0.2, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer circle breathe glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerCircleBreathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerCircleBreathe, { toValue: 0.65, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Start Shooting Stars loop
    const triggerShootingStar = () => {
      shootingStarX.setValue(-100);
      shootingStarY.setValue(-50);
      Animated.sequence([
        Animated.delay(5000 + Math.random() * 8000),
        Animated.parallel([
          Animated.timing(shootingStarX, { toValue: width + 100, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(shootingStarY, { toValue: height * 0.35, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true })
        ])
      ]).start(() => triggerShootingStar());
    };
    triggerShootingStar();
  }, []);

  // Voice recording timer
  useEffect(() => {
    let recTimer: ReturnType<typeof setInterval>;
    if (isRecording) {
      // Bouncing wave bars loop
      const animateWave = (wave: Animated.Value, max: number, duration: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(wave, { toValue: max, duration, useNativeDriver: true }),
            Animated.timing(wave, { toValue: 1, duration, useNativeDriver: true })
          ])
        ).start();
      };
      animateWave(voiceWave1, 3.2, 450);
      animateWave(voiceWave2, 2.5, 350);
      animateWave(voiceWave3, 4.0, 500);
      animateWave(voiceWave4, 2.0, 300);

      recTimer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            clearInterval(recTimer);
            setIsRecording(false);
            setHasVoiceRecorded(true);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      voiceWave1.setValue(1);
      voiceWave2.setValue(1);
      voiceWave3.setValue(1);
      voiceWave4.setValue(1);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecording]);

  // Timer countdown ticks
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(6);
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
  }, [step, isActive, isPaused, timeLeft]);

  // Mindful prompts rotation (Dev: 10s, Prod: 60s)
  useEffect(() => {
    let promptTimer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused) {
      const intervalMs = __DEV__ ? 10000 : 60000;
      promptTimer = setInterval(() => {
        Animated.timing(promptFadeAnim, { toValue: 0, duration: 550, useNativeDriver: true }).start(() => {
          setPromptIndex((prev) => (prev + 1) % prompts.length);
          Animated.timing(promptFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, intervalMs);
    }
    return () => {
      if (promptTimer) clearInterval(promptTimer);
    };
  }, [step, isActive, isPaused]);

  // Transition controller
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
      }).start();
    });
  };

  // API Call: Start Task
  const handleStartTask = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Reflection: How Did It Feel?' })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(2);
  };

  // Select emotion on wheel
  const handleSelectEmotion = (label: string, index: number) => {
    setSelectedEmotion(label);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Rotate wheel slightly to center the tapped emotion
    const anglePerItem = 360 / emotions.length;
    const targetRotation = -index * anglePerItem;
    
    Animated.spring(wheelRotation, {
      toValue: targetRotation,
      useNativeDriver: true,
      friction: 5
    }).start();
  };

  // API Call: Save Reflection Emotion
  const handleConfirmEmotion = async () => {
    if (!selectedEmotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-reflection-emotion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Reflection: How Did It Feel?',
            emotion: selectedEmotion
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(3);
  };

  // Toggle voice recorder
  const handleToggleVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
      setHasVoiceRecorded(true);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      setHasVoiceRecorded(false);
    }
  };

  // API Call: Save Reflection Journal / Voice
  const handleConfirmJournal = async () => {
    if (!journalText.trim() && !hasVoiceRecorded) {
      Alert.alert('Incomplete Journal', 'Please write your reflection or record a short voice note before proceeding.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-journal-entry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Reflection: How Did It Feel?',
            emotion: selectedEmotion,
            journal_text: journalText,
            voice_recorded: hasVoiceRecorded
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(4);
  };

  // Select memory card
  const handleSelectMemoryCard = (cardId: string) => {
    setSelectedMemory(cardId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const scaleMap = {
      'learned': memory1Scale,
      'surprised': memory2Scale,
      'repeat': memory3Scale,
    };
    const activeScale = scaleMap[cardId as keyof typeof scaleMap];
    if (activeScale) {
      Animated.sequence([
        Animated.timing(activeScale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(activeScale, { toValue: 1, friction: 3, useNativeDriver: true })
      ]).start();
    }
  };

  // API Call: Save Memory Timeline
  const handleConfirmMemoryTimeline = async () => {
    if (!selectedMemory || !memorySentence.trim()) {
      Alert.alert('Timeline Empty', 'Please select one memory card and write a short sentence.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-memory-selection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Reflection: How Did It Feel?',
            emotion: selectedEmotion,
            journal_text: journalText,
            voice_recorded: hasVoiceRecorded,
            memory_card: selectedMemory,
            reflection_sentence: memorySentence
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(5);
    setIsActive(true);
  };

  // API Call: complete task and claim points
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Reflection: How Did It Feel?',
            emotion: selectedEmotion,
            journal_text: journalText,
            voice_recorded: hasVoiceRecorded,
            memory_card: selectedMemory,
            reflection_sentence: memorySentence
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
          Alert.alert('Error', data.error || 'Failed to submit task completion');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }

    // Redirect to success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You noticed your response.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev double tap skip
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Interpolated rotation values for the emotion wheel
  const wheelRotateInterpolate = wheelRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg']
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* Breathing Midnight Aurora background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: scaleMascotAnim }] }]}>
        <LinearGradient
          colors={['#0A1128', '#102542', '#1C3144']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: auroraShift }]}>
        <LinearGradient
          colors={['#102542', '#1A365D', '#0F4C81']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Sparkly Starry Sky Decoration Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: starGlowAnim }]} pointerEvents="none">
        <View style={[styles.starDot, { top: height * 0.15, left: width * 0.25 }]} />
        <View style={[styles.starDot, { top: height * 0.25, left: width * 0.75, width: 4, height: 4 }]} />
        <View style={[styles.starDot, { top: height * 0.45, left: width * 0.15, width: 2, height: 2 }]} />
        <View style={[styles.starDot, { top: height * 0.55, left: width * 0.85, width: 3, height: 3 }]} />
        <View style={[styles.starDot, { top: height * 0.65, left: width * 0.3 }]} />
      </Animated.View>

      {/* Dynamic Shooting Star */}
      <Animated.View
        style={[
          styles.shootingStar,
          { transform: [{ translateX: shootingStarX }, { translateY: shootingStarY }] }
        ]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Abort Reflection?",
                "Are you sure you want to stop? Your progress will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Abort", style: "destructive", onPress: () => router.back() }
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={18} color="#00BCD4" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 5 && isActive && !isPaused && { backgroundColor: '#00BCD4', shadowColor: '#00BCD4' }]} />
            <Text style={styles.statusText}>
              {step === 5 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `REFLECT.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Dynamic Slide Step Content */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>

          {/* STEP 1: Details Greet Layout */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>🌌</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Reflection: How Did It Feel?</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(0, 188, 212, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#00BCD4' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(41, 121, 255, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#2979FF' }]}>7 Min</Text>
                  </View>
                </View>
              </View>

              {/* Glassmorphism card shapes */}
              <View style={styles.glassCard}>
                <Text style={styles.quoteText}>
                  "The more honestly you reflect, the more peacefully you grow."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Every experience has something to teach you."
                </Text>
                <Text style={styles.cardDescription}>
                  Take a few quiet moments to reflect on your recent experience. Instead of judging yourself, simply notice what happened, how you felt, and what you learned.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#00BCD4', '#2979FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Begin Reflection</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Rotating Emotion Wheel */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Reflection Wheel</Text>
              <Text style={styles.stepSubtitle}>
                Select the emotion that best matches your experience.
              </Text>

              {/* Interactive circular rotation wheel */}
              <View style={styles.wheelOuterFrame}>
                <Animated.View style={[styles.wheelContainer, { transform: [{ rotate: wheelRotateInterpolate }] }]}>
                  {emotions.map((item, idx) => {
                    const angle = (idx * 360) / emotions.length;
                    const radius = 105; // circle radius offset
                    const radians = (angle * Math.PI) / 180;
                    const x = radius * Math.cos(radians);
                    const y = radius * Math.sin(radians);
                    const isSelected = selectedEmotion === item.label;

                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={[
                          styles.wheelNode,
                          { transform: [{ translateX: x }, { translateY: y }] },
                          isSelected && styles.wheelNodeActive
                        ]}
                        onPress={() => handleSelectEmotion(item.label, idx)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.nodeEmoji}>{item.emoji}</Text>
                        <Text style={styles.nodeLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              </View>

              {selectedEmotion && (
                <Text style={styles.chosenEmotionContext}>
                  Feeling: <Text style={{ color: '#00BCD4', fontWeight: '800' }}>{selectedEmotion}</Text>
                </Text>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 'auto' }, !selectedEmotion && styles.disabledBtn]}
                disabled={!selectedEmotion}
                onPress={handleConfirmEmotion}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!selectedEmotion ? ['#334155', '#1E293B'] : ['#00BCD4', '#2979FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Confirm Emotion</Text>
                  <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: digital notebook journal & voice reflection */}
          {step === 3 && (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Reflection Journal</Text>
                <Text style={styles.stepSubtitle}>
                  "What happened during this experience?"
                </Text>

                {/* Digital Journal notebook card */}
                <View style={styles.notebookCard}>
                  <View style={styles.notebookHeader}>
                    <Ionicons name="journal-outline" size={18} color="#00BCD4" style={{ marginRight: 6 }} />
                    <Text style={styles.notebookTitle}>My Notes</Text>
                  </View>
                  <TextInput
                    style={styles.journalInput}
                    multiline
                    numberOfLines={6}
                    placeholder="Describe how the experience felt. Be honest and gentle with yourself..."
                    placeholderTextColor="#64748B"
                    value={journalText}
                    onChangeText={setJournalText}
                  />
                </View>

                {/* Simulated Voice recording support */}
                <View style={styles.voiceSection}>
                  <Text style={styles.voicePromptLabel}>
                    Or record a short 60s voice reflection
                  </Text>

                  <View style={styles.recordingRow}>
                    <TouchableOpacity
                      style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                      onPress={handleToggleVoice}
                      activeOpacity={0.8}
                    >
                      <Feather name={isRecording ? "square" : "mic"} size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    {isRecording ? (
                      <View style={styles.recordingWaves}>
                        <Animated.View style={[styles.waveBar, { transform: [{ scaleY: voiceWave1 }] }]} />
                        <Animated.View style={[styles.waveBar, { transform: [{ scaleY: voiceWave2 }] }]} />
                        <Animated.View style={[styles.waveBar, { transform: [{ scaleY: voiceWave3 }] }]} />
                        <Animated.View style={[styles.waveBar, { transform: [{ scaleY: voiceWave4 }] }]} />
                        <Text style={styles.recordingTime}>0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</Text>
                      </View>
                    ) : (
                      <Text style={styles.voiceStatusText}>
                        {hasVoiceRecorded ? "✓ Voice reflection saved (60s)" : "Tap to record"}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 'auto' }]} onPress={handleConfirmJournal} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#00BCD4', '#2979FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.btnText}>Confirm Entry</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* STEP 4: Memory Timeline */}
          {step === 4 && (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Memory Timeline</Text>
                <Text style={styles.stepSubtitle}>
                  "What will you remember from this?" Choose one card and write a short sentence.
                </Text>

                {/* Animated Memory Cards */}
                <View style={styles.memoryCardsGrid}>
                  {memoryCards.map((card) => {
                    const isSelected = selectedMemory === card.id;
                    const scaleVal = card.id === 'learned' ? memory1Scale : card.id === 'surprised' ? memory2Scale : memory3Scale;

                    return (
                      <Animated.View
                        key={card.id}
                        style={{ transform: [{ scale: scaleVal }], width: '100%' }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.memoryCardItem,
                            { backgroundColor: card.bg },
                            isSelected && styles.memoryCardActive
                          ]}
                          onPress={() => handleSelectMemoryCard(card.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.memoryEmoji}>{card.emoji}</Text>
                          <Text style={[styles.memoryTitle, isSelected && { color: '#FFFFFF' }]}>{card.title}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Memory Sentence Field */}
                {selectedMemory && (
                  <View style={styles.memorySentenceWrapper}>
                    <Text style={styles.sentenceLabel}>Write one short sentence:</Text>
                    <TextInput
                      style={styles.sentenceInput}
                      placeholder="Write your reflection summary..."
                      placeholderTextColor="#64748B"
                      value={memorySentence}
                      onChangeText={setMemorySentence}
                      maxLength={100}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 'auto' }, (!selectedMemory || !memorySentence.trim()) && styles.disabledBtn]}
                  disabled={!selectedMemory || !memorySentence.trim()}
                  onPress={handleConfirmMemoryTimeline}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={(!selectedMemory || !memorySentence.trim()) ? ['#334155', '#1E293B'] : ['#00BCD4', '#2979FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.btnText}>Confirm Memory</Text>
                    <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* STEP 5: 7-Minute Reflection Timer */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerMascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.timerLargeEmoji}>🌌</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerTextDisplay, { opacity: timerCircleBreathe }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.promptCard, { opacity: promptFadeAnim }]}>
                <Text style={styles.promptText}>
                  {prompts[promptIndex]}
                </Text>
              </Animated.View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.controlBtnText, isPaused && { color: '#FFFFFF' }]}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 6: Success completion reward slide */}
          {step === 6 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>🌌</Text>
              <Text style={styles.successHeading}>You noticed your response.</Text>
              <Text style={styles.successContext}>
                Regular self-reflection helps form strong neuropathways of self-awareness. Tapping into how you react to social situations empowers your emotional confidence.
              </Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00BCD4', '#2979FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? "Saving response..." : "Claim +200 Task Points"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 188, 212, 0.02)',
  },
  starDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  shootingStar: {
    position: 'absolute',
    width: 60,
    height: 2,
    backgroundColor: '#00BCD4',
    opacity: 0.8,
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
    height: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00BCD4',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 49, 68, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,188,212,0.45)',
  },
  mainEmoji: {
    fontSize: 70,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediumBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  mediumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  glassCard: {
    backgroundColor: 'rgba(28, 49, 68, 0.45)',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.35)',
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#00BCD4',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 188, 212, 0.15)',
    marginVertical: 14,
  },
  illustrationText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  wheelOuterFrame: {
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheelContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheelNode: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(28, 49, 68, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wheelNodeActive: {
    backgroundColor: '#00BCD4',
    borderColor: '#FFFFFF',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  nodeEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  chosenEmotionContext: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 20,
    fontWeight: '600',
  },
  notebookCard: {
    width: '100%',
    backgroundColor: 'rgba(28, 49, 68, 0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
    padding: 16,
    marginBottom: 20,
  },
  notebookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 188, 212, 0.15)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  notebookTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  journalInput: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  voiceSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  voicePromptLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '600',
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2979FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2979FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micBtnRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  recordingWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 4,
    height: 18,
    backgroundColor: '#00BCD4',
    borderRadius: 2,
  },
  recordingTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  voiceStatusText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  memoryCardsGrid: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  memoryCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  memoryCardActive: {
    borderColor: '#00BCD4',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 188, 212, 0.25)',
  },
  memoryEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  memoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  memorySentenceWrapper: {
    width: '100%',
    backgroundColor: 'rgba(28, 49, 68, 0.4)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.15)',
    marginBottom: 20,
  },
  sentenceLabel: {
    fontSize: 13,
    color: '#00BCD4',
    fontWeight: '800',
    marginBottom: 8,
  },
  sentenceInput: {
    fontSize: 14,
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 188, 212, 0.3)',
    paddingVertical: 6,
  },
  timerMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(28, 49, 68, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#00BCD4',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.3)',
  },
  timerLargeEmoji: {
    fontSize: 60,
  },
  timerTextDisplay: {
    fontSize: 78,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 188, 212, 0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  promptCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerControls: {
    width: '60%',
    alignItems: 'center',
  },
  controlBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#00BCD4',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00BCD4',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  successLargeEmoji: {
    fontSize: 84,
    marginBottom: 20,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  successContext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  claimBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
