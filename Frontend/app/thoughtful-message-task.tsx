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
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 480; // 8 minutes in seconds

export default function ThoughtfulMessageTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen Steps:
  // 1: Detail Dashboard (Live preview placeholder, ribbon quote)
  // 2: Heart Notes Intro (Cozy writing desk background, warm sunlight vibe)
  // 3: Message Mood (Circular cards Appreciate, Encouraging, Gratitude blooming)
  // 4: Greeting Card Creator (Themes, message editor, live preview, voice memo)
  // 5: Heartbeat Moment (Heart tap pulse, Kindness ripple waves)
  // 6: Connection Timer (8-minute blooming flower timer, falling petals/feathers)
  // 7: Final Celebration (Folding card, ribbon, badge claim points)
  const [step, setStep] = useState(1);

  // Challenge States
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'floral' | 'sunrise' | 'minimal' | 'watercolor' | 'elegant'>('minimal');
  const [messageText, setMessageText] = useState('');
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;

  // Soft paper intro transition
  const paperFoldAnim = useRef(new Animated.Value(1)).current;

  // Mood selection blooms scale anims
  const bloomAppreciate = useRef(new Animated.Value(0)).current;
  const bloomEncourage = useRef(new Animated.Value(0)).current;
  const bloomGratitude = useRef(new Animated.Value(0)).current;
  const bloomChecking = useRef(new Animated.Value(0)).current;
  const bloomCelebration = useRef(new Animated.Value(0)).current;
  const bloomMotivation = useRef(new Animated.Value(0)).current;

  // Heartbeat moment scale
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const heartbeatWaves = useRef(new Animated.Value(0)).current;

  // Connection timer flower petal layers
  const petalScale1 = useRef(new Animated.Value(0)).current;
  const petalScale2 = useRef(new Animated.Value(0)).current;
  const petalScale3 = useRef(new Animated.Value(0)).current;
  const petalScale4 = useRef(new Animated.Value(0)).current;

  // Final celebration fold
  const finalCardFold = useRef(new Animated.Value(1)).current;

  // AppState restoration tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Ambient quote database
  const reflectionQuotes = [
    '💝 "Thoughtful words create lasting memories."',
    '🌸 "Kindness begins with intention."',
    '🤍 "One sincere message can change someone\'s day."',
    '❤️ "Connection grows through genuine care."',
  ];

  // Falling particles config
  const [fallingPetals, setFallingPetals] = useState<{ id: number; left: number; speed: number; scale: number; rotation: number }[]>([]);

  // Mood variables matching refs
  const moodCards = [
    { label: '❤️ Appreciation', value: 'Appreciation', refBloom: bloomAppreciate },
    { label: '🌞 Encouraging', value: 'Encouragement', refBloom: bloomEncourage },
    { label: '🙏 Gratitude', value: 'Gratitude', refBloom: bloomGratitude },
    { label: '🌸 Checking In', value: 'Checking In', refBloom: bloomChecking },
    { label: '🎉 Celebration', value: 'Celebration', refBloom: bloomCelebration },
    { label: '💪 Motivation', value: 'Motivation', refBloom: bloomMotivation },
  ];

  // Configure falling petal particles once
  useEffect(() => {
    const petals = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: Math.random() * (width - 40),
      speed: 5000 + Math.random() * 5000,
      scale: 0.6 + Math.random() * 0.8,
      rotation: Math.random() * 360,
    }));
    setFallingPetals(petals);
  }, []);

  // Ambient quote interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 6) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % reflectionQuotes.length);
      }, 5500);
    }
    return () => clearInterval(interval);
  }, [step]);

  // AppState restoration
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

  // Main pulse animations loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Timer run loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 6 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          // Open layers of petals as timer progresses
          const elapsed = TIMER_DURATION - prev;
          const progress = elapsed / TIMER_DURATION;

          // Target scales for petal layers (0 to 1)
          petalScale1.setValue(Math.min(1, progress * 4));
          petalScale2.setValue(Math.min(1, Math.max(0, (progress - 0.25) * 4)));
          petalScale3.setValue(Math.min(1, Math.max(0, (progress - 0.5) * 4)));
          petalScale4.setValue(Math.min(1, Math.max(0, (progress - 0.75) * 4)));

          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(7);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, { toValue: 1.08, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(timerPulseAnim, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Handle transition between steps
  const transitionToStep = (nextStep: number) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (nextStep === 7) {
          // Play elegant folding card and confetti ribbon sequence
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.sequence([
            Animated.timing(finalCardFold, { toValue: 0.1, duration: 800, useNativeDriver: true }),
            Animated.timing(finalCardFold, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]).start();
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
          body: JSON.stringify({ task_name: 'Send a Thoughtful Message' })
        });
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
    transitionToStep(2);
  };

  // Soft paper page folding animation
  const handleTriggerPaperFold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(paperFoldAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      transitionToStep(3); // Choose purpose mood
    });
  };

  // Select message purpose mood card
  const handleSelectPurpose = async (purpose: string, bloomRef: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPurpose(purpose);

    Animated.sequence([
      Animated.timing(bloomRef, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(bloomRef, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(async () => {
      // Save Purpose progress to API
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await apiFetch('/api/tasks/save-thoughtful-message-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              task_name: 'Send a Thoughtful Message',
              purpose,
            })
          });
        }
      } catch (e) {
        console.error('Error saving purpose progress:', e);
      }

      setTimeout(() => {
        transitionToStep(4); // Greeting Card Creator
      }, 250);
    });
  };

  // Simulated Voice Recording
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceRecorded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      setRecordProgress(0);
      
      // Simulate progress tick
      let count = 0;
      const interval = setInterval(() => {
        if (count >= 100) {
          clearInterval(interval);
        } else {
          setRecordProgress((prev) => prev + 10);
          count += 10;
        }
      }, 300);
    }
  };

  // Save Card theme/text details
  const handleSaveCardDetails = async () => {
    if (!messageText.trim()) {
      Alert.alert('Empty Note', 'Please write a message inside the greeting card.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/save-thoughtful-message-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Send a Thoughtful Message',
            card_theme: selectedTheme,
            message_text: messageText,
            voice_recording: voiceRecorded ? 'voice_memo_attachment.wav' : null,
          })
        });
      }
    } catch (e) {
      console.error('Error saving card progress:', e);
    }

    transitionToStep(5); // Go to Heartbeat confirmation
  };

  // Sent message heartbeat confirm
  const handleConfirmSent = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Heartbeat anim
    Animated.sequence([
      Animated.spring(heartbeatAnim, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartbeatAnim, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(heartbeatAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Rippling particle waves anim
    Animated.timing(heartbeatWaves, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(async () => {
      // Save confirmation state
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await apiFetch('/api/tasks/save-thoughtful-message-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              task_name: 'Send a Thoughtful Message',
              confirmed: true,
            })
          });
        }
      } catch (e) {
        console.error('Error saving sent confirm progress:', e);
      }

      transitionToStep(6); // Go to Reflection Timer
      setIsActive(true);
    });
  };

  // Complete Task API Call
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
            task_name: 'Send a Thoughtful Message',
            purpose: selectedPurpose,
            card_theme: selectedTheme,
            message_text: messageText,
            voice_recording: voiceRecorded ? 'voice_memo_attachment.wav' : null,
            confirmed: true,
            timer_completion: true,
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
      Alert.alert('Connection Error', 'Network request failed. Please check your connection.');
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
        message: 'You connected intentionally.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev skip shortcut
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper theme card colors
  const getThemeGradient = (theme: string): [string, string] => {
    switch (theme) {
      case 'floral':
        return ['#FFF3F8', '#FCE4EC'];
      case 'sunrise':
        return ['#FFFDE7', '#FFE082'];
      case 'minimal':
        return ['#FCFBF9', '#F5F2EB'];
      case 'watercolor':
        return ['#F8BBD0', '#EC407A'];
      case 'elegant':
        return ['#FFFDF9', '#F4D35E'];
      default:
        return ['#FCFBF9', '#F5F2EB'];
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Abort Challenge?',
                'Are you sure you want to exit? Your progress will be discarded.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => router.back() },
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={16} color="#EC407A" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 6 && isActive && !isPaused && { backgroundColor: '#EC407A' }]} />
            <Text style={styles.statusText}>
              {step === 6 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `CARD.STEP_${step}`}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: contentFadeAnim }]}>

          {/* STEP 1: TASK DETAIL PAGE (DASHBOARD) */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.illustrationFrame}>
                <LinearGradient
                  colors={['#FFFDF9', '#F8BBD0']}
                  style={styles.greetingCardArt}
                >
                  <Ionicons name="heart-circle" size={44} color="#EC407A" />
                  <Text style={styles.cardArtText}>Warm Wishes</Text>
                </LinearGradient>
              </View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Send a Thoughtful Message</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(236, 64, 122, 0.1)' }]}>
                    <Text style={[styles.badgeText, { color: '#EC407A' }]}>+300 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(244, 211, 94, 0.15)' }]}>
                    <Text style={[styles.badgeText, { color: '#B78A00' }]}>8 Min</Text>
                  </View>
                </View>
              </View>

              {/* Center: Live preview of completed heart note */}
              <View style={styles.livePreviewBoxPlaceholder}>
                <LinearGradient
                  colors={getThemeGradient(selectedTheme)}
                  style={styles.liveCardShape}
                >
                  <Text style={styles.liveCardPurposeHeader}>
                    {selectedPurpose ? `💝 ${selectedPurpose}` : 'Selected Purpose'}
                  </Text>
                  <ScrollView style={styles.liveCardTextScroll}>
                    <Text style={[styles.liveCardText, !messageText.trim() && { color: '#9CA3AF', fontStyle: 'italic' }]}>
                      {messageText.trim() ? messageText : 'Your written message preview will display here...'}
                    </Text>
                  </ScrollView>
                </LinearGradient>
              </View>

              {/* Bottom: Elegant Ribbon quote */}
              <View style={styles.detailsCard}>
                <View style={styles.ribbonWrapper}>
                  <Text style={styles.quoteText}>
                    "The most valuable messages are the ones that come from the heart."
                  </Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.cardDescription}>
                  Take a moment to brighten someone's day. Write a thoughtful message of appreciation, gratitude, or checking in. Small words leave big impacts.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#EC407A', '#D81B60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>💝 Create Heart Note</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: HEART NOTES INTRO */}
          {step === 2 && (
            <Animated.View style={[styles.stepContainer, { justifyContent: 'space-between', transform: [{ scale: paperFoldAnim }] }]}>
              <View style={styles.introHeaderBox}>
                <Text style={styles.introTitle}>"Kind words stay with people long after they're read."</Text>
                <Text style={styles.introSubtitle}>"Today, send a message that truly matters."</Text>
              </View>

              {/* Cozy writing desk artistic scene representation */}
              <View style={styles.deskArtFrame}>
                <View style={styles.sunlightBeam} />
                <View style={styles.lettersRow}>
                  <Text style={styles.deskEmoji}>✍️</Text>
                  <Text style={styles.deskEmoji}>🍵</Text>
                  <Text style={styles.deskEmoji}>🌸</Text>
                  <Text style={styles.deskEmoji}>📜</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleTriggerPaperFold} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#EC407A', '#D81B60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>💝 Write Greeting Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* STEP 3: MESSAGE MOOD */}
          {step === 3 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepTitle}>Choose Message Purpose</Text>
                <Text style={styles.stepSubtitle}>
                  Select the underlying theme or intention of the message you want to craft.
                </Text>
              </View>

              {/* Grid of blooming circular purpose cards */}
              <View style={styles.moodCardsGrid}>
                {moodCards.map((card) => {
                  const isSelected = selectedPurpose === card.value;
                  return (
                    <TouchableOpacity
                      key={card.value}
                      style={[
                        styles.moodCircleCard,
                        isSelected && styles.moodCircleCardSelected,
                      ]}
                      onPress={() => handleSelectPurpose(card.value, card.refBloom)}
                      activeOpacity={0.8}
                    >
                      {/* Animated blooming ring background */}
                      <Animated.View
                        style={[
                          styles.bloomingBloomRing,
                          {
                            transform: [
                              {
                                scale: card.refBloom.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.3],
                                }),
                              },
                            ],
                            opacity: card.refBloom.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 0.4],
                            }),
                          },
                        ]}
                      />
                      <Text style={styles.moodCardLabel}>{card.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
            </View>
          )}

          {/* STEP 4: GREETING CARD CREATOR */}
          {step === 4 && (
            <ScrollView contentContainerStyle={styles.editorScrollContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.stepTitle}>Greeting Card Creator</Text>
              <Text style={styles.stepSubtitle}>
                Select a visual card style and write your message inside.
              </Text>

              {/* Theme selectors row */}
              <View style={styles.themeSelectorRow}>
                {(['floral', 'sunrise', 'minimal', 'watercolor', 'elegant'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themePill,
                      selectedTheme === t && styles.themePillSelected,
                    ]}
                    onPress={() => setSelectedTheme(t)}
                  >
                    <Text style={[styles.themePillText, selectedTheme === t && { color: '#EC407A' }]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Live Preview Card Box */}
              <View style={styles.editorPreviewCard}>
                <LinearGradient
                  colors={getThemeGradient(selectedTheme)}
                  style={styles.editorCardGradient}
                >
                  <View style={styles.editorCardHeader}>
                    <Text style={styles.editorCardPurpose}>
                      {selectedPurpose ? `💝 ${selectedPurpose}` : 'Personal Message'}
                    </Text>
                    <Ionicons name="sparkles" size={16} color="#EC407A" />
                  </View>

                  <TextInput
                    style={styles.editorTextInput}
                    placeholder="Write your heartfelt message here..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={500}
                    value={messageText}
                    onChangeText={setMessageText}
                  />
                  <Text style={styles.charCountText}>{messageText.length}/500 chars</Text>
                </LinearGradient>
              </View>

              {/* Optional simulated Voice recording reflection */}
              <View style={styles.voiceSectionCard}>
                <Text style={styles.voiceTitle}>Optional Voice Memo Reflection</Text>
                <Text style={styles.voiceDesc}>
                  Include a 60-second audio clip reflecting on the kindness you are sharing.
                </Text>

                <View style={styles.voiceControlRow}>
                  <TouchableOpacity
                    style={[
                      styles.voiceRecordBtn,
                      isRecording && { backgroundColor: '#F8D7DA' },
                      voiceRecorded && { backgroundColor: '#D4EDDA' },
                    ]}
                    onPress={handleToggleVoiceRecord}
                  >
                    <Feather
                      name={isRecording ? 'square' : voiceRecorded ? 'check' : 'mic'}
                      size={20}
                      color={isRecording ? '#D9534F' : voiceRecorded ? '#28A745' : '#EC407A'}
                    />
                    <Text style={[styles.voiceBtnText, isRecording && { color: '#D9534F' }]}>
                      {isRecording ? 'Stop Recording' : voiceRecorded ? 'Voice Memo Attached' : 'Record Reflection'}
                    </Text>
                  </TouchableOpacity>

                  {isRecording && (
                    <View style={styles.recordingFeedback}>
                      <View style={[styles.recordProgressBar, { width: `${recordProgress}%` }]} />
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveCardDetails} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#EC407A', '#D81B60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Lock in Details ➔</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 5: HEARTBEAT MOMENT */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              <View style={styles.introHeaderBox}>
                <Text style={styles.stepTitle}>Brighten Someone's Day</Text>
                <Text style={styles.stepSubtitle}>
                  Please send your thoughtfulness card to your chosen contact now via your preferred messaging app.
                </Text>
              </View>

              {/* Glowing heartbeat card */}
              <View style={styles.heartCenterArea}>
                {/* Translucent rippling kindness waves */}
                <Animated.View
                  style={[
                    styles.heartRippleWave,
                    {
                      transform: [
                        {
                          scale: heartbeatWaves.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 3.5],
                          }),
                        },
                      ],
                      opacity: heartbeatWaves.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                    },
                  ]}
                />

                <Animated.View
                  style={[
                    styles.heartNode,
                    {
                      transform: [{ scale: heartbeatAnim }],
                    },
                  ]}
                >
                  <Ionicons name="heart" size={80} color="#EC407A" />
                </Animated.View>
              </View>

              <View style={styles.sentStatusMessageBox}>
                <Text style={styles.sentStatusText}>"Your words are now part of someone's day."</Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSent} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#EC407A', '#D81B60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>❤️ I've Sent My Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: CONNECTION TIMER (8 Minutes) */}
          {step === 6 && (
            <View style={[styles.stepContainer, { justifyContent: 'space-between' }]}>
              {/* Falling Petals ambient effects */}
              {fallingPetals.map((pet) => (
                <Animated.View
                  key={pet.id}
                  style={[
                    styles.fallingPetalIcon,
                    {
                      left: pet.left,
                      transform: [{ scale: pet.scale }, { rotate: `${pet.rotation}deg` }],
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>🌸</Text>
                </Animated.View>
              ))}

              <View style={styles.timerTopMeta}>
                <Text style={styles.reflectionTitle}>Reflective Care Space</Text>
                <Text style={styles.reflectionSubtitle}>
                  Contemplate the emotional ripple of your thoughtfulness. Kindness is an active choice.
                </Text>
              </View>

              {/* Blooming flower representation */}
              <View style={styles.bloomingFlowerCanvas}>
                {/* Petal Layer 4 (Outer layer) */}
                <Animated.View
                  style={[
                    styles.flowerPetalRing,
                    {
                      transform: [{ scale: petalScale4 }],
                      width: 170,
                      height: 170,
                      borderRadius: 85,
                      backgroundColor: 'rgba(244, 211, 94, 0.25)', // soft gold
                    },
                  ]}
                />

                {/* Petal Layer 3 */}
                <Animated.View
                  style={[
                    styles.flowerPetalRing,
                    {
                      transform: [{ scale: petalScale3 }],
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: 'rgba(248, 187, 208, 0.45)', // blush pink
                    },
                  ]}
                />

                {/* Petal Layer 2 */}
                <Animated.View
                  style={[
                    styles.flowerPetalRing,
                    {
                      transform: [{ scale: petalScale2 }],
                      width: 110,
                      height: 110,
                      borderRadius: 55,
                      backgroundColor: 'rgba(236, 64, 122, 0.35)', // rose red
                    },
                  ]}
                />

                {/* Petal Layer 1 (Inner layer) */}
                <Animated.View
                  style={[
                    styles.flowerPetalRing,
                    {
                      transform: [{ scale: petalScale1 }],
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: 'rgba(236, 64, 122, 0.65)',
                    },
                  ]}
                />

                {/* Center Core bud with timer numbers */}
                <Animated.View style={[styles.timerBudCore, { transform: [{ scale: timerPulseAnim }] }]}>
                  <Pressable onPress={handleDevSkip}>
                    <Text style={styles.timerDigitalCount}>{formatTime(timeLeft)}</Text>
                  </Pressable>
                  <Text style={styles.timerSubText}>Blooming</Text>
                </Animated.View>
              </View>

              {/* Ambient quote update card */}
              <View style={styles.timerQuoteFrame}>
                <Text style={styles.timerQuoteText}>{reflectionQuotes[quoteIndex]}</Text>
              </View>

              <View style={styles.timerControlBox}>
                <TouchableOpacity
                  style={[styles.timerControlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timerControlBtnText}>{isPaused ? 'Resume Care' : 'Pause'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 7: FINAL CELEBRATION */}
          {step === 7 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Confetti confetti / blooming visuals */}
              <View style={styles.badgeHaloContainer}>
                <LinearGradient
                  colors={['#F8BBD0', '#F4D35E']}
                  style={styles.badgeHaloCircle}
                >
                  <Text style={styles.badgeEmoji}>🏅</Text>
                </LinearGradient>
              </View>

              <Text style={styles.celebrationMainTitle}>Heart Notes Complete</Text>
              <Text style={styles.celebrationMainSub}>
                "Your kindness travelled farther than you may ever know."
              </Text>

              {/* Folds card preview */}
              <Animated.View style={[styles.foldingCardVisual, { transform: [{ scale: finalCardFold }] }]}>
                <LinearGradient
                  colors={getThemeGradient(selectedTheme)}
                  style={styles.foldingCardInnerShape}
                >
                  <Ionicons name="mail-open" size={24} color="#EC407A" />
                  <Text style={styles.foldingCardLabel}>GREETING CARD SENT 🎀</Text>
                </LinearGradient>
              </Animated.View>

              <Text style={styles.taskCompletionMessage}>"You connected intentionally."</Text>

              <TouchableOpacity
                style={styles.claimPointsBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EC407A', '#D81B60']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.claimPointsBtnText}>
                    {isLoading ? 'Saving data...' : 'Claim +200 Task Points'}
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
    backgroundColor: '#FFFDF9', // Cozy Warm White Background
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
    backgroundColor: 'rgba(236, 64, 122, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EC407A',
    letterSpacing: 0.5,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E879F9',
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
  illustrationFrame: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#EC407A',
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  greetingCardArt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArtText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EC407A',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 15,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#374151',
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
    backgroundColor: 'rgba(244, 211, 94, 0.25)',
  },
  mediumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B78A00',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  livePreviewBoxPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F8BBD0',
    marginVertical: 10,
  },
  liveCardShape: {
    flex: 1,
    padding: 12,
  },
  liveCardPurposeHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EC407A',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  liveCardTextScroll: {
    flex: 1,
  },
  liveCardText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: '#FCF9F2',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F4D35E',
    marginBottom: 20,
  },
  ribbonWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: '#EC407A',
    paddingLeft: 8,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4D35E',
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 10,
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  introHeaderBox: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
  },
  introTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  deskArtFrame: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunlightBeam: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FFFEE0',
    opacity: 0.35,
    zIndex: 1,
  },
  lettersRow: {
    flexDirection: 'row',
    gap: 20,
    zIndex: 10,
  },
  deskEmoji: {
    fontSize: 44,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#374151',
    textAlign: 'center',
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 15,
    marginTop: 6,
  },
  moodCardsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 20,
    width: '100%',
  },
  moodCircleCard: {
    width: '44%',
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
    borderColor: '#F8BBD0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  moodCircleCardSelected: {
    borderColor: '#EC407A',
  },
  bloomingBloomRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F8BBD0',
  },
  moodCardLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    zIndex: 5,
  },
  editorScrollContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 15,
  },
  themePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themePillSelected: {
    borderColor: '#EC407A',
    backgroundColor: '#FFF0F5',
  },
  themePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
  },
  editorPreviewCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EC407A',
    marginBottom: 20,
    elevation: 3,
  },
  editorCardGradient: {
    flex: 1,
    padding: 16,
  },
  editorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editorCardPurpose: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EC407A',
  },
  editorTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    textAlignVertical: 'top',
    padding: 0,
  },
  charCountText: {
    fontSize: 9,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  voiceSectionCard: {
    width: '100%',
    backgroundColor: '#FCF9F2',
    borderWidth: 1,
    borderColor: '#F4D35E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  voiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  voiceDesc: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 14,
  },
  voiceControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  voiceRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFEE0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EC407A',
    gap: 8,
  },
  voiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EC407A',
  },
  recordingFeedback: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  recordProgressBar: {
    height: '100%',
    backgroundColor: '#EF5350',
  },
  heartCenterArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartRippleWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8BBD0',
  },
  heartNode: {
    zIndex: 10,
  },
  sentStatusMessageBox: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
  sentStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC407A',
    textAlign: 'center',
  },
  fallingPetalIcon: {
    position: 'absolute',
    top: -20,
  },
  timerTopMeta: {
    alignItems: 'center',
    marginTop: 15,
  },
  reflectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#374151',
  },
  reflectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 15,
    lineHeight: 16,
  },
  bloomingFlowerCanvas: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 25,
  },
  flowerPetalRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFFDF9',
  },
  timerBudCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFDF9',
    borderWidth: 3,
    borderColor: '#EC407A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  timerDigitalCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EC407A',
  },
  timerSubText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  timerQuoteFrame: {
    backgroundColor: '#FCF9F2',
    borderWidth: 1,
    borderColor: '#F4D35E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginVertical: 10,
  },
  timerQuoteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  timerControlBox: {
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
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  resumeBtn: {
    backgroundColor: '#EC407A',
  },
  timerControlBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EC407A',
  },
  badgeHaloContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeHaloCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  badgeEmoji: {
    fontSize: 68,
  },
  celebrationMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#374151',
    textAlign: 'center',
  },
  celebrationMainSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  foldingCardVisual: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 25,
  },
  foldingCardInnerShape: {
    width: '80%',
    height: 70,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EC407A',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  foldingCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EC407A',
    letterSpacing: 0.5,
  },
  taskCompletionMessage: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EC407A',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  claimPointsBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#EC407A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  claimPointsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
