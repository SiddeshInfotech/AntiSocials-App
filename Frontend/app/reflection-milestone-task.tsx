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
import { Audio } from 'expo-av';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 15 * 60; // 15 minutes (900 seconds)

export default function ReflectionMilestoneTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Step flow:
  // 0 = Luxury Dashboard (Intro)
  // 1 = Grand Opening (Cinematic Sunrise)
  // 2 = Journey Timeline (Animated Light Up)
  // 3 = Memory Vault (5 cards, Type or Record)
  // 4 = Letter to Future Self (Parchment folding)
  // 5 = Personal Growth Tree (Blooms)
  // 6 = Meditative Timer (Dawn-to-day visual shifts)
  // 7 = Final Celebration (Summit glow, leaf confetti, certificate)
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2 - TIMELINE STATE
  const [activeTimelineIdx, setActiveTimelineIdx] = useState(0);

  // STEP 3 - MEMORY VAULT STATE
  const [selectedVaultIdx, setSelectedVaultIdx] = useState<number | null>(null);
  const [vaultAnswers, setVaultAnswers] = useState<string[]>(['', '', '', '', '']);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [vaultVoiceUrls, setVaultVoiceUrls] = useState<(string | null)[]>([null, null, null, null, null]);

  // STEP 4 - FUTURE LETTER STATE
  const [futureLetter, setFutureLetter] = useState('');
  const [isFolded, setIsFolded] = useState(false);

  // STEP 5 - PERSONAL GROWTH TREE STATE
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);

  // STEP 6 - TIMER STATE
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);

  // ANIMATION REFS
  const fadeAnim = useRef(new Animated.Value(0)).current; // Main transition fade
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const spotX = useRef(new Animated.Value(-100)).current;
  const spotY = useRef(new Animated.Value(-100)).current;
  const sunriseGlow = useRef(new Animated.Value(0)).current; // Sunrise overlay opacity
  
  // Particles
  const particles = useRef(
    Array.from({ length: 15 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 50),
      scale: Math.random() * 0.7 + 0.3,
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Timeline sequential glows
  const timelineGlows = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.2))).current;

  // Vault crystals float & expand
  const vaultOpenAnim = useRef(new Animated.Value(0)).current;
  const crystalScaleAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;

  // Letter Fold animation values
  const foldScale = useRef(new Animated.Value(1)).current;
  const foldRotation = useRef(new Animated.Value(0)).current;
  const foldTranslateY = useRef(new Animated.Value(0)).current;
  const envelopeOpacity = useRef(new Animated.Value(0)).current;
  const envelopeScale = useRef(new Animated.Value(0.5)).current;

  // Tree qualities bloom scale values
  const qualityBloomAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;

  // Meditative Timer animations
  const skyProgress = useRef(new Animated.Value(0)).current; // Shifting gradient overlay
  const timerCircleBreathe = useRef(new Animated.Value(1)).current;
  const cloudsTranslateX = useRef(new Animated.Value(-100)).current;

  // Celebration Confetti
  const confetti = useRef(
    Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: new Animated.Value(-50),
      scale: Math.random() * 0.5 + 0.3,
      rotation: new Animated.Value(0),
      color: ['#FFD54F', '#C084FC', '#34D399', '#60A5FA', '#F87171'][Math.floor(Math.random() * 5)],
      opacity: new Animated.Value(0),
    }))
  ).current;

  // AppState track for background timer support
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Timeline milestones
  const timelineMilestones = [
    { label: '🌱 Day 1', title: 'First Step', desc: 'Making the commitment to change.' },
    { label: '💪 Week 1', title: 'Building Awareness', desc: 'Noticing habits and screen cues.' },
    { label: '🔥 Week 2', title: 'Facing Challenges', desc: 'Stepping out of the comfort zone.' },
    { label: '🌟 Week 3', title: 'Growing Stronger', desc: 'Practicing digital restraint & connection.' },
    { label: '🏆 Today', title: 'Reflection', desc: 'Celebrating your 21-day evolution.' },
  ];

  // Vault Crystal questions
  const vaultQuestions = [
    'What are you most proud of?',
    'Which task challenged you the most?',
    'What habit would you like to continue?',
    'What surprised you about yourself?',
    'What changed in your mindset?',
  ];

  // Personal growth qualities list
  const growthQualities = [
    { label: 'Discipline', emoji: '🌱', color: '#34D399' },
    { label: 'Kindness', emoji: '❤️', color: '#F87171' },
    { label: 'Patience', emoji: '🧘', color: '#60A5FA' },
    { label: 'Confidence', emoji: '💪', color: '#FBBF24' },
    { label: 'Positivity', emoji: '🌞', color: '#FB923C' },
    { label: 'Calmness', emoji: '🌊', color: '#22D3EE' },
    { label: 'Consistency', emoji: '📚', color: '#A78BFA' },
    { label: 'Connection', emoji: '🤝', color: '#F472B6' },
  ];

  // Meditative Timer thoughts list
  const meditativeThoughts = [
    '✨ "Growth happens one day at a time."',
    '🌅 "Every small step mattered."',
    '🌱 "You became stronger by showing up."',
    '🏔️ "Look how far you\'ve come."',
    '🌌 "The quiet mind observes all."',
  ];

  // Background spotlight drifting animation
  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(spotX, { toValue: width * 0.5, duration: 20000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(spotY, { toValue: height * 0.3, duration: 25000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(spotX, { toValue: -120, duration: 20000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(spotY, { toValue: -120, duration: 25000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    drift.start();
    return () => drift.stop();
  }, []);

  // Sync background timer updates on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 6 && isTimerActive && !isTimerPaused) {
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

  // Audio recording duration tracking
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 90) {
            handleVoiceRecordingToggle(); // Auto stop at 90s
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Screen particle drift triggers
  const startParticles = () => {
    particles.forEach((p) => {
      p.y.setValue(height + 20);
      p.opacity.setValue(0);
      const duration = Math.random() * 6000 + 4000;
      const delay = Math.random() * 4000;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.y, { toValue: -50, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: Math.random() * 0.7 + 0.3, duration: duration * 0.2, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: duration * 0.8, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  // Step transitions fade handler
  const transitionToStep = (nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]).start();

      // Trigger animations relevant to the step loaded
      if (nextStep === 1) {
        startParticles();
        Animated.timing(sunriseGlow, { toValue: 0.7, duration: 6000, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      } else if (nextStep === 2) {
        runTimelineSequentialAnimations();
      } else if (nextStep === 3) {
        Animated.spring(vaultOpenAnim, { toValue: 1, tension: 15, friction: 6, useNativeDriver: true }).start();
      } else if (nextStep === 5) {
        // Sprout tree animations when loading step 5
        selectedQualities.forEach((qual) => {
          const index = growthQualities.findIndex((q) => q.label === qual);
          if (index !== -1) {
            Animated.spring(qualityBloomAnims[index], { toValue: 1, friction: 4, useNativeDriver: true }).start();
          }
        });
      } else if (nextStep === 6) {
        // Slow shifting cloud and breathe animation for meditative timer
        Animated.loop(
          Animated.sequence([
            Animated.timing(cloudsTranslateX, { toValue: width + 100, duration: 55000, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(cloudsTranslateX, { toValue: -150, duration: 0, useNativeDriver: true }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(timerCircleBreathe, { toValue: 1.08, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(timerCircleBreathe, { toValue: 0.95, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      } else if (nextStep === 7) {
        triggerConfettiRain();
      }
    });
  };

  // Fade in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // STEP 2 - TIMELINE ANIMATION SEQUENCES
  const runTimelineSequentialAnimations = () => {
    timelineGlows.forEach((glow) => glow.setValue(0.2));
    const animations = timelineGlows.map((glow, idx) => {
      return Animated.sequence([
        Animated.delay(idx * 500),
        Animated.parallel([
          Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(timelineGlows[idx], { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.parallel(animations).start();
  };

  const handleTimelineMilestoneView = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTimelineIdx(idx);
  };

  // STEP 3 - MEMORY VAULT VOICE RECORDING AND SAVES
  const handleVoiceRecordingToggle = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isRecording) {
      // Stop voice recording
      if (!recording) return;
      try {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        if (uri && selectedVaultIdx !== null) {
          uploadAudioFile(uri, selectedVaultIdx);
        }
      } catch (err) {
        console.error('Failed to stop voice recording', err);
      }
    } else {
      // Start recording
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('Microphone Access Needed', 'We require microphone access to record your reflection voice note.');
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
        setIsRecording(true);
        setRecordDuration(0);
      } catch (err) {
        console.error('Failed to start recording', err);
      }
    }
  };

  const uploadAudioFile = async (localUri: string, index: number) => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const formData = new FormData();
      const filename = localUri.split('/').pop() || `voice_${index}.m4a`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `audio/${match[1]}` : `audio/m4a`;

      formData.append('voice', {
        uri: Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri,
        name: filename,
        type: type,
      } as any);

      const res = await apiFetch('/api/tasks/reflection/upload-voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUrls = [...vaultVoiceUrls];
        updatedUrls[index] = data.fileUrl;
        setVaultVoiceUrls(updatedUrls);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Upload Failed', 'Could not upload your voice note. Please try text response.');
      }
    } catch (err) {
      console.error('Audio upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMemoryAnswersToBackend = async () => {
    // Validate if at least some questions are answered (typing or voice urls)
    const validCount = vaultAnswers.filter((ans, idx) => ans.trim().length > 0 || vaultVoiceUrls[idx] !== null).length;
    if (validCount < 5) {
      Alert.alert('Complete Reflection', 'Please provide a response (type or record voice) for all 5 memory crystals.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      // Format answers package
      const answerPack = vaultAnswers.map((ans, idx) => ({
        question: vaultQuestions[idx],
        answer_text: ans,
        voice_url: vaultVoiceUrls[idx],
      }));

      const res = await apiFetch('/api/tasks/reflection/save-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Reflect on 21 Days',
          answers: answerPack,
        }),
      });

      if (res.ok) {
        transitionToStep(4);
      } else {
        const data = await res.json();
        Alert.alert('Save Error', data.error || 'Unable to save answers. Please try again.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4 - PARCHMENT FOLD AND SEALS
  const executeLetterFoldAndSave = async () => {
    if (futureLetter.trim().length < 10) {
      Alert.alert('Message Too Short', 'Please write a message (at least 10 characters) to your future self.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFolded(true);

    // Run custom folding animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(foldScale, { toValue: 0.15, duration: 800, useNativeDriver: true }),
        Animated.timing(foldRotation, { toValue: 180, duration: 800, useNativeDriver: true }),
        Animated.timing(foldTranslateY, { toValue: 80, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(envelopeOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(envelopeScale, { toValue: 1.1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.spring(envelopeScale, { toValue: 1.0, friction: 3, useNativeDriver: true }),
    ]).start(async () => {
      // Save future letter to backend
      setIsLoading(true);
      try {
        const token = await SecureStore.getItemAsync('token');
        const res = await apiFetch('/api/tasks/reflection/save-letter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Reflect on 21 Days',
            letter: futureLetter,
          }),
        });

        if (res.ok) {
          setTimeout(() => {
            transitionToStep(5);
            // Reset fold states for possible next runs
            setIsFolded(false);
            foldScale.setValue(1);
            foldRotation.setValue(0);
            foldTranslateY.setValue(0);
            envelopeOpacity.setValue(0);
            envelopeScale.setValue(0.5);
          }, 1200);
        } else {
          setIsFolded(false);
          Alert.alert('Error', 'Unable to seal letter. Please try again.');
        }
      } catch (e) {
        setIsFolded(false);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    });
  };

  // STEP 5 - QUALITIES SELECT & BLOOMS
  const toggleQuality = (qualityName: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated = [...selectedQualities];
    if (updated.includes(qualityName)) {
      updated = updated.filter((q) => q !== qualityName);
      Animated.timing(qualityBloomAnims[index], { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      if (updated.length >= 3) {
        // Swap quality or alert
        const oldQual = updated.shift();
        if (oldQual) {
          const oldIdx = growthQualities.findIndex((q) => q.label === oldQual);
          if (oldIdx !== -1) {
            Animated.timing(qualityBloomAnims[oldIdx], { toValue: 0, duration: 300, useNativeDriver: true }).start();
          }
        }
      }
      updated.push(qualityName);
      Animated.spring(qualityBloomAnims[index], { toValue: 1, friction: 3, useNativeDriver: true }).start();
    }
    setSelectedQualities(updated);
  };

  const saveQualitiesAndProceed = async () => {
    if (selectedQualities.length < 3) {
      Alert.alert('Select Qualities', 'Please choose exactly three qualities that you have developed during these 21 days.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch('/api/tasks/reflection/save-qualities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: 'Reflect on 21 Days',
          qualities: selectedQualities,
        }),
      });

      if (res.ok) {
        transitionToStep(6);
      } else {
        Alert.alert('Save Error', 'Could not save qualities. Please try again.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 6 - MEDITATIVE TIMER
  useEffect(() => {
    let timerInt: any = null;
    if (isTimerActive && !isTimerPaused && timeLeft > 0) {
      timerInt = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          // Interpolate sky sunrise transition
          const prog = (TIMER_DURATION - next) / TIMER_DURATION;
          skyProgress.setValue(prog);

          // Change rotating meditative thoughts every 3 minutes (180 seconds)
          if (next > 0 && next % 180 === 0) {
            setCurrentPromptIdx((idx) => (idx + 1) % meditativeThoughts.length);
          }

          if (next <= 0) {
            clearInterval(timerInt);
            handleTimerComplete();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timerInt);
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
    transitionToStep(7);
  };

  // SECRET DEVELOPER SKIP BUTTON
  const skipTimerDev = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeLeft(5);
    endTimeRef.current = Date.now() + 5000;
  };

  // STEP 7 - CELEBRATION & CONFETTI
  const triggerConfettiRain = () => {
    confetti.forEach((c) => {
      c.y.setValue(-50);
      c.opacity.setValue(1);
      c.rotation.setValue(0);
      const duration = Math.random() * 4000 + 2000;
      const delay = Math.random() * 2000;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(c.y, { toValue: height + 50, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(c.rotation, { toValue: 360, duration, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(c.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
              Animated.timing(c.opacity, { toValue: 0, duration: duration - 250, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    });
  };

  const completeMilestoneTask = async () => {
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
            task_name: 'Reflect on 21 Days',
            voice_reflection: vaultVoiceUrls.filter((url) => url !== null).join(','),
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
      const response = await apiFetch('/api/tasks/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task_name: 'Reflect on 21 Days' }),
      });
      if (response.ok) {
        transitionToStep(1);
      } else {
        // Already started or database configuration error
        transitionToStep(1);
      }
    } catch (err) {
      transitionToStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  // TIMER FORMAT
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerProgressPercent = () => {
    return ((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100;
  };

  // BACKGROUND GRADIENT RENDERER
  const renderBackground = () => {
    if (step === 6) {
      // Shifting gradient backdrop matching the meditativeness of the timer
      return (
        <Animated.View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['#020208', '#0B132B', '#23184E']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Overlapping animated colors */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: skyProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#0B132B', '#5B3DF5', '#9333EA']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: skyProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#3C1E70', '#8B5CF6', '#FBBF24']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </Animated.View>
      );
    }

    if (step === 7) {
      return (
        <LinearGradient
          colors={['#070A1E', '#0E173C', '#281747']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    // Default premium background for steps 0-5
    return (
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#050816', '#0B132B', '#1C103F']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Animated spotlight */}
        <Animated.View
          style={[
            styles.radialSpotlight,
            {
              transform: [{ translateX: spotX }, { translateY: spotY }],
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}

      {/* Floating Sunrise overlay in step 1 */}
      {step === 1 && (
        <Animated.View
          style={[
            styles.sunriseBackgroundGlow,
            {
              opacity: sunriseGlow,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,160,80,0.2)', 'rgba(91,61,245,0.1)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}

      {/* Particles Engine */}
      {(step === 1 || step === 6) &&
        particles.map((p, idx) => (
          <Animated.View
            key={`part-${idx}`}
            style={[
              styles.particle,
              {
                left: p.x,
                transform: [{ translateY: p.y }, { scale: p.scale }],
                opacity: p.opacity,
              },
            ]}
          />
        ))}

      {/* Confetti Celebration Rain */}
      {step === 7 &&
        confetti.map((c, idx) => (
          <Animated.View
            key={`conf-${idx}`}
            style={[
              styles.confettiParticle,
              {
                left: c.x,
                backgroundColor: c.color,
                transform: [
                  { translateY: c.y },
                  { scale: c.scale },
                  {
                    rotate: c.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: c.opacity,
              },
            ]}
          />
        ))}

      <SafeAreaView style={styles.safeArea}>
        {/* HUD Navigation Header */}
        <View style={[styles.hudHeader, { marginTop: insets.top > 0 ? 0 : 10 }]}>
          {step > 0 && step < 7 ? (
            <TouchableOpacity
              onPress={() => {
                if (step === 6) {
                  // Abort timer verification
                  Alert.alert('Abort Session', 'Are you sure you want to stop this milestone reflection session?', [
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
                <Feather name="x" size={20} color="#8A94A6" />
                <Text style={styles.backText}>ABORT</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                step === 7 && { backgroundColor: '#FFD54F', shadowColor: '#FFD54F' },
                step > 0 && step < 7 && { backgroundColor: '#5B3DF5', shadowColor: '#5B3DF5' },
              ]}
            />
            <Text style={styles.statusText}>
              {step === 0
                ? 'DASHBOARD'
                : step === 7
                ? 'COMPLETE'
                : `REFLECTION.0${step}`}
            </Text>
          </View>

          {step === 6 && (
            <TouchableOpacity onPress={skipTimerDev} activeOpacity={0.8} style={styles.devSkipBtn}>
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
              <View style={styles.dashboardImageSection}>
                {/* SVG/Styled Mountain Peak */}
                <View style={styles.mountainVectorWrap}>
                  <View style={styles.mountainBackPeak} />
                  <View style={styles.mountainFrontPeak} />
                  <View style={styles.goldenSunDisc} />
                  <LinearGradient
                    colors={['rgba(91,61,245,0.4)', 'transparent']}
                    style={styles.mountainGlowMask}
                  />
                  <Feather name="award" size={40} color="#FFD54F" style={styles.summitAwardIcon} />
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressRingOuter}>
                  <LinearGradient
                    colors={['#FFD54F', '#5B3DF5']}
                    style={styles.progressRingGradient}
                  >
                    <View style={styles.progressRingInner}>
                      <Text style={styles.progressPercentText}>21</Text>
                      <Text style={styles.progressSubtext}>DAYS COMPLETED</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.dashboardGlassCard}>
                <Text style={styles.dashboardKicker}>⭐⭐⭐ HARD MILESTONE TASK</Text>
                <Text style={styles.dashboardTitle}>Reflect on 21 Days</Text>
                <View style={styles.dashboardDetailsRow}>
                  <View style={styles.dashBadge}>
                    <Feather name="clock" size={14} color="#FFD54F" />
                    <Text style={styles.dashBadgeText}>15 Mins</Text>
                  </View>
                  <View style={styles.dashBadge}>
                    <Feather name="shield" size={14} color="#FFD54F" />
                    <Text style={styles.dashBadgeText}>+300 Points</Text>
                  </View>
                </View>
                <Text style={styles.dashboardQuote}>
                  "The greatest journey isn't measured by distance, but by the person you become along the way."
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleStartTask}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#5B3DF5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>START JOURNEY PROTOCOL</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ======================================================== */}
          {/* SCREEN 1 - GRAND OPENING                                  */}
          {/* ======================================================== */}
          {step === 1 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.centerContent}>
                <View style={styles.cinematicMountainIcon}>
                  <Text style={styles.mountainEmoji}>🏔️</Text>
                </View>
                <Text style={styles.cinematicHeading}>21 Days. Countless Small Victories.</Text>
                <Text style={styles.cinematicSubtext}>
                  "Today isn't about finishing a challenge. It's about recognizing the person you've become."
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(2)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#FFD54F', '#FB923C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionBtnText, { color: '#0B132B' }]}>🏔️ Begin My Reflection</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2 - JOURNEY TIMELINE                              */}
          {/* ======================================================== */}
          {step === 2 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>YOUR TIMELINE</Text>
                <Text style={styles.stepTitle}>Path of Conscious Growth</Text>
              </View>

              <View style={styles.timelineContainer}>
                {/* Vertical Line */}
                <View style={styles.timelineLine} />

                <ScrollView
                  contentContainerStyle={styles.timelineList}
                  showsVerticalScrollIndicator={false}
                >
                  {timelineMilestones.map((m, idx) => {
                    const isSelected = activeTimelineIdx === idx;
                    const glowVal = timelineGlows[idx];

                    return (
                      <TouchableOpacity
                        key={`milestone-${idx}`}
                        onPress={() => handleTimelineMilestoneView(idx)}
                        activeOpacity={0.8}
                        style={styles.timelineItem}
                      >
                        <Animated.View
                          style={[
                            styles.timelineNode,
                            isSelected && styles.timelineNodeSelected,
                            {
                              transform: [{ scale: glowVal }],
                            },
                          ]}
                        >
                          {isSelected ? (
                            <View style={styles.timelineActiveInnerDot} />
                          ) : (
                            <View style={styles.timelineInnerDot} />
                          )}
                        </Animated.View>

                        <View style={styles.timelineContentWrap}>
                          <Text style={[styles.timelineNodeLabel, isSelected && styles.timelineLabelSelected]}>
                            {m.label}
                          </Text>
                          <Text style={styles.timelineNodeTitle}>{m.title}</Text>
                          {isSelected && (
                            <Text style={styles.timelineNodeDesc}>{m.desc}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={() => transitionToStep(3)}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#5B3DF5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>ENTER MEMORY VAULT</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 3 - MEMORY VAULT                                  */}
          {/* ======================================================== */}
          {step === 3 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>MEMORY VAULT</Text>
                <Text style={styles.stepTitle}>Explore the Crystals</Text>
              </View>

              <View style={styles.vaultSceneContainer}>
                {selectedVaultIdx === null ? (
                  <View style={styles.vaultGridContainer}>
                    <Text style={styles.vaultInstruction}>
                      Tap on each memory crystal to answer its inquiry. All 5 crystals must be unlocked.
                    </Text>
                    {/* Glowing crystals grid */}
                    <Animated.View
                      style={[
                        styles.crystalsGrid,
                        {
                          transform: [{ scale: vaultOpenAnim }],
                        },
                      ]}
                    >
                      {vaultQuestions.map((q, idx) => {
                        const isDone = vaultAnswers[idx].trim().length > 0 || vaultVoiceUrls[idx] !== null;

                        return (
                          <TouchableOpacity
                            key={`crystal-${idx}`}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setSelectedVaultIdx(idx);
                            }}
                            activeOpacity={0.7}
                            style={styles.crystalWrapper}
                          >
                            <Animated.View
                              style={[
                                styles.crystalDisc,
                                isDone && styles.crystalDiscUnlocked,
                                {
                                  transform: [{ scale: crystalScaleAnims[idx] }],
                                },
                              ]}
                            >
                              <LinearGradient
                                colors={isDone ? ['#FFD54F', '#FB923C'] : ['#5B3DF5', '#1E1B4B']}
                                style={styles.crystalGradient}
                              >
                                <Text style={styles.crystalIconText}>💎</Text>
                              </LinearGradient>
                            </Animated.View>
                            <Text style={[styles.crystalLabel, isDone && styles.crystalLabelUnlocked]} numberOfLines={2}>
                              {`Q${idx + 1}: ` + q.substring(0, 16) + '...'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </Animated.View>
                  </View>
                ) : (
                  <View style={styles.crystalDetailCard}>
                    <TouchableOpacity
                      onPress={() => setSelectedVaultIdx(null)}
                      style={styles.closeCardBtn}
                    >
                      <Feather name="arrow-left" size={20} color="#FFF" />
                      <Text style={styles.closeCardText}>CRYSTALS</Text>
                    </TouchableOpacity>

                    <Text style={styles.questionNumber}>CRYSTAL MEMORY 0{selectedVaultIdx + 1}</Text>
                    <Text style={styles.questionText}>"{vaultQuestions[selectedVaultIdx]}"</Text>

                    <TextInput
                      style={styles.crystalInput}
                      placeholder="Type your reflection answer here..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      multiline
                      value={vaultAnswers[selectedVaultIdx]}
                      onChangeText={(txt) => {
                        const updated = [...vaultAnswers];
                        updated[selectedVaultIdx] = txt;
                        setVaultAnswers(updated);
                      }}
                    />

                    <View style={styles.recordOrTypeDivider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerLabel}>OR RECORD AUDIO</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Mic Voice reflection */}
                    <View style={styles.voiceSection}>
                      <TouchableOpacity
                        onPress={handleVoiceRecordingToggle}
                        activeOpacity={0.8}
                        style={[styles.voiceMicBtn, isRecording && styles.voiceMicBtnRecording]}
                      >
                        <Ionicons
                          name={isRecording ? 'stop-circle' : 'mic-outline'}
                          size={32}
                          color={isRecording ? '#FF8F50' : '#FFF'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.voiceStatusLabel}>
                        {isRecording
                          ? `Recording... ${recordDuration}s / 90s`
                          : vaultVoiceUrls[selectedVaultIdx] !== null
                          ? '✅ Voice note uploaded successfully'
                          : 'Tap to record voice reflection'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedVaultIdx(null);
                      }}
                      style={styles.saveCrystalCardBtn}
                    >
                      <Text style={styles.saveCrystalText}>LOCK CRYSTAL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedVaultIdx === null && (
                <TouchableOpacity
                  onPress={saveMemoryAnswersToBackend}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={styles.actionBtnWrap}
                >
                  <LinearGradient
                    colors={['#5B3DF5', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'SAVING DATA...' : 'SEAL MEMORIES'}
                    </Text>
                    {!isLoading && <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />}
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 4 - LETTER TO YOUR FUTURE SELF                     */}
          {/* ======================================================== */}
          {step === 4 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>JOURNAL PROTOCOL</Text>
                <Text style={styles.stepTitle}>Letter to Future Self</Text>
              </View>

              <View style={styles.letterContainer}>
                {!isFolded ? (
                  <Animated.View
                    style={[
                      styles.parchmentPaper,
                      {
                        transform: [
                          { scale: foldScale },
                          { translateY: foldTranslateY },
                          {
                            rotateY: foldRotation.interpolate({
                              inputRange: [0, 180],
                              outputRange: ['0deg', '180deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.letterParchmentHeading}>Write a message to your future self.</Text>
                    <TextInput
                      style={styles.letterTextInput}
                      placeholder="Write your commitment, hopes, or advice to your future self..."
                      placeholderTextColor="rgba(80, 50, 20, 0.4)"
                      multiline
                      value={futureLetter}
                      onChangeText={setFutureLetter}
                    />
                    <View style={styles.parchmentDecorativeSeal}>
                      <Text style={styles.sealEmojiText}>📜</Text>
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.envelopeWrap}>
                    <Animated.View
                      style={[
                        styles.glowingEnvelope,
                        {
                          opacity: envelopeOpacity,
                          transform: [{ scale: envelopeScale }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#FFD54F', '#FB923C']}
                        style={styles.envelopeGradient}
                      >
                        <View style={styles.envelopeInnerSeal}>
                          <Text style={styles.envelopeSealIcon}>🏔️</Text>
                          <Text style={styles.envelopeSealLabel}>SEALED</Text>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  </View>
                )}
              </View>

              {!isFolded && (
                <TouchableOpacity
                  onPress={executeLetterFoldAndSave}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={styles.actionBtnWrap}
                >
                  <LinearGradient
                    colors={['#5B3DF5', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionBtnText}>
                      {isLoading ? 'FOLDING...' : '✉️ FOLD & SEAL LETTER'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 5 - PERSONAL GROWTH TREE                          */}
          {/* ======================================================== */}
          {step === 5 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>GROWTH METAPHOR</Text>
                <Text style={styles.stepTitle}>Sprout Your Growth Tree</Text>
              </View>

              <View style={styles.treeSceneContainer}>
                {/* Visual Tree illustration */}
                <View style={styles.treeCanvas}>
                  {/* Trunk */}
                  <View style={styles.treeTrunk}>
                    <View style={styles.treeRootLine} />
                  </View>

                  {/* Blooming Leaves on Branches */}
                  {growthQualities.map((qual, idx) => {
                    const isSelected = selectedQualities.includes(qual.label);
                    const scaleAnimVal = qualityBloomAnims[idx];

                    // Positioning offsets for leaf clusters
                    const positions: { left: DimensionValue; top: DimensionValue }[] = [
                      { left: '42%', top: '25%' }, // High Center
                      { left: '25%', top: '38%' }, // Mid Left
                      { left: '60%', top: '38%' }, // Mid Right
                      { left: '15%', top: '55%' }, // Low Left
                      { left: '72%', top: '55%' }, // Low Right
                      { left: '33%', top: '48%' }, // Center Left
                      { left: '50%', top: '48%' }, // Center Right
                      { left: '44%', top: '65%' }, // Bottom Center
                    ];

                    return (
                      <Animated.View
                        key={`bloom-${idx}`}
                        style={[
                          styles.leafCluster,
                          positions[idx],
                          {
                            transform: [{ scale: scaleAnimVal }],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={[qual.color, '#FFD54F']}
                          style={styles.leafGradient}
                        >
                          <Text style={styles.leafEmoji}>{qual.emoji}</Text>
                        </LinearGradient>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Qualities picker (Max 3) */}
                <View style={styles.qualitiesSelectorContainer}>
                  <Text style={styles.selectorLabel}>
                    Choose 3 qualities that blossomed in these 21 days:
                  </Text>
                  <View style={styles.qualitiesBadgeGrid}>
                    {growthQualities.map((qual, idx) => {
                      const isPicked = selectedQualities.includes(qual.label);
                      return (
                        <TouchableOpacity
                          key={`badge-${idx}`}
                          onPress={() => toggleQuality(qual.label, idx)}
                          activeOpacity={0.85}
                          style={[
                            styles.qualityBadge,
                            isPicked && styles.qualityBadgePicked,
                          ]}
                        >
                          <Text style={styles.badgeText}>{qual.emoji + ' ' + qual.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={saveQualitiesAndProceed}
                disabled={isLoading}
                activeOpacity={0.9}
                style={styles.actionBtnWrap}
              >
                <LinearGradient
                  colors={['#5B3DF5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionBtnText}>WATER THE TREE</Text>
                  <Feather name="arrow-right" size={18} color="#FFF" style={styles.actionBtnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================================== */}
          {/* SCREEN 6 - REFLECTION TIMER                              */}
          {/* ======================================================== */}
          {step === 6 && (
            <View style={styles.fullscreenStep}>
              <View style={styles.stepHeaderSection}>
                <Text style={styles.stepKicker}>FINAL THRESHOLD</Text>
                <Text style={styles.stepTitle}>15 Minute Meditative Rest</Text>
              </View>

              <View style={styles.meditativeTimerContainer}>
                {/* Slow Moving Clouds */}
                <Animated.View
                  style={[
                    styles.meditativeClouds,
                    {
                      transform: [{ translateX: cloudsTranslateX }],
                    },
                  ]}
                >
                  <Feather name="cloud" size={40} color="rgba(255,255,255,0.06)" style={styles.cloudIcon} />
                  <Feather name="cloud" size={60} color="rgba(255,255,255,0.04)" style={[styles.cloudIcon, { marginLeft: 120 }]} />
                </Animated.View>

                {/* Meditative breathing timer ring */}
                <Animated.View
                  style={[
                    styles.meditativeTimerRing,
                    {
                      transform: [{ scale: timerCircleBreathe }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,213,79,0.1)', 'rgba(91,61,245,0.2)']}
                    style={styles.meditativeInnerRing}
                  >
                    <Text style={styles.timerDigitsText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerLabelText}>REMAINING DURATION</Text>
                  </LinearGradient>
                </Animated.View>

                {/* Rotating reflective thoughts */}
                <View style={styles.reflectionsTextCard}>
                  <Text style={styles.reflectionStatement}>
                    {meditativeThoughts[currentPromptIdx]}
                  </Text>
                </View>
              </View>

              <View style={styles.timerControls}>
                {isTimerActive ? (
                  <View style={styles.timerBtnGroup}>
                    <TouchableOpacity
                      onPress={handlePauseTimer}
                      activeOpacity={0.8}
                      style={styles.timerPauseBtn}
                    >
                      <Text style={styles.timerPauseText}>
                        {isTimerPaused ? 'CONTINUE' : 'PAUSE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartTimer}
                    activeOpacity={0.9}
                    style={styles.actionBtnWrap}
                  >
                    <LinearGradient
                      colors={['#FFD54F', '#FB923C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionBtnText, { color: '#0B132B' }]}>
                        ⚡ INITIATE MEDITATION
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress HUD */}
              {isTimerActive && (
                <View style={styles.progressHudLineWrap}>
                  <View style={[styles.progressHudLineFill, { width: `${getTimerProgressPercent()}%` }]} />
                </View>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* FINAL CELEBRATION (CERTIFICATE)                          */}
          {/* ======================================================== */}
          {step === 7 && (
            <View style={styles.fullscreenStep}>
              <ScrollView contentContainerStyle={styles.celebrationScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.summitGlowHeader}>
                  <Text style={styles.summitEmoji}>🏆</Text>
                  <Text style={styles.celebrationKicker}>JOURNEY COMPLETE</Text>
                  <Text style={styles.certificateHeadline}>You choose growth over comfort.</Text>
                </View>

                {/* Certificate */}
                <View style={styles.certificateGlassView}>
                  <View style={styles.certDecorativeBorder}>
                    <Text style={styles.certTitle}>ANTISOCIAL MILESTONE</Text>
                    <Text style={styles.certSub}>Award of Conscious Evolution</Text>

                    <View style={styles.certSealContainer}>
                      <Text style={styles.certSealText}>🏔️</Text>
                    </View>

                    <Text style={styles.certTextBody}>
                      For completing the rigorous 21-day digital mindfulness journey and looking within.
                    </Text>

                    <View style={styles.certQualitiesSection}>
                      <Text style={styles.certQualitiesTitle}>BLOOMED QUALITIES</Text>
                      <View style={styles.certBadgeRow}>
                        {selectedQualities.map((qual, idx) => (
                          <View key={`cert-q-${idx}`} style={styles.certBadge}>
                            <Text style={styles.certBadgeText}>{qual}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <Text style={styles.certCompletionText}>"You looked within."</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={completeMilestoneTask}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.actionBtnWrap, { marginTop: 30 }]}
                >
                  <LinearGradient
                    colors={['#FFD54F', '#FB923C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButton}
                  >
                    <Text style={[styles.actionBtnText, { color: '#0B132B' }]}>
                      {isLoading ? 'UPDATING ARCHIVES...' : 'FINISH REFLECTION'}
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
    backgroundColor: '#050816',
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
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
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

  // BACKGROUND EFFECTS
  radialSpotlight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(91, 61, 245, 0.15)',
    shadowColor: '#5B3DF5',
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 5,
  },
  sunriseBackgroundGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  // PARTICLE SYSTEM
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  // CONFETTI CELEBRATION
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },

  // STEP 0 - LUXURY DASHBOARD
  dashboardImageSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mountainVectorWrap: {
    width: width * 0.7,
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mountainBackPeak: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    width: 140,
    height: 140,
    backgroundColor: 'rgba(91, 61, 245, 0.25)',
    transform: [{ rotate: '45deg' }],
  },
  mountainFrontPeak: {
    position: 'absolute',
    bottom: -20,
    left: '35%',
    width: 120,
    height: 120,
    backgroundColor: 'rgba(91, 61, 245, 0.4)',
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 213, 79, 0.5)',
  },
  goldenSunDisc: {
    position: 'absolute',
    top: 30,
    left: '35%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  mountainGlowMask: {
    ...StyleSheet.absoluteFillObject,
  },
  summitAwardIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: 15,
  },
  progressRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    shadowColor: '#FFD54F',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  progressRingGradient: {
    flex: 1,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#050816',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentText: {
    color: '#FFD54F',
    fontSize: 34,
    fontWeight: '900',
  },
  progressSubtext: {
    color: '#8A94A6',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  dashboardGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    marginVertical: 10,
  },
  dashboardKicker: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  dashboardTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  dashboardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  dashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,213,79,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  dashBadgeText: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dashboardQuote: {
    color: '#D1D5DB',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtnWrap: {
    width: '100%',
    shadowColor: '#5B3DF5',
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

  // STEP 1 - GRAND OPENING
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cinematicMountainIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,213,79,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.2)',
  },
  mountainEmoji: {
    fontSize: 48,
  },
  cinematicHeading: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    paddingHorizontal: 10,
  },
  cinematicSubtext: {
    color: '#D1D5DB',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // STEP 2 - TIMELINE
  stepHeaderSection: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  stepKicker: {
    color: '#FFD54F',
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
  timelineContainer: {
    flex: 1,
    marginVertical: 10,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  timelineList: {
    paddingLeft: 40,
    paddingVertical: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 32,
    position: 'relative',
  },
  timelineNode: {
    position: 'absolute',
    left: -32,
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineNodeSelected: {
    backgroundColor: '#FFD54F',
    borderColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  timelineActiveInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0B132B',
  },
  timelineContentWrap: {
    flex: 1,
  },
  timelineNodeLabel: {
    color: '#8A94A6',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timelineLabelSelected: {
    color: '#FFD54F',
  },
  timelineNodeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timelineNodeDesc: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  // STEP 3 - MEMORY VAULT
  vaultSceneContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 10,
  },
  vaultGridContainer: {
    alignItems: 'center',
  },
  vaultInstruction: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  crystalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  crystalWrapper: {
    width: '40%',
    alignItems: 'center',
    marginVertical: 10,
  },
  crystalDisc: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B3DF5',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  crystalDiscUnlocked: {
    shadowColor: '#FFD54F',
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  crystalGradient: {
    flex: 1,
    borderRadius: 33,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crystalIconText: {
    fontSize: 28,
  },
  crystalLabel: {
    color: '#8A94A6',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  crystalLabelUnlocked: {
    color: '#FFD54F',
  },
  crystalDetailCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    minHeight: height * 0.45,
  },
  closeCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeCardText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 1.5,
  },
  questionNumber: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  questionText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 26,
  },
  crystalInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 12,
    color: '#FFF',
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  recordOrTypeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerLabel: {
    color: '#8A94A6',
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  voiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  voiceMicBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(91,61,245,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B3DF5',
  },
  voiceMicBtnRecording: {
    backgroundColor: 'rgba(251,146,60,0.2)',
    borderColor: '#FB923C',
  },
  voiceStatusLabel: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  saveCrystalCardBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 'auto',
  },
  saveCrystalText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },

  // STEP 4 - LETTER JOURNAL
  letterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  parchmentPaper: {
    width: '100%',
    height: height * 0.45,
    backgroundColor: '#FAF6EB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D7B8',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  letterParchmentHeading: {
    color: '#5C4033',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(92,64,51,0.1)',
    paddingBottom: 8,
  },
  letterTextInput: {
    flex: 1,
    color: '#5C4033',
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  parchmentDecorativeSeal: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEFC7',
    borderWidth: 1,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealEmojiText: {
    fontSize: 18,
  },
  envelopeWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: height * 0.45,
  },
  glowingEnvelope: {
    width: 220,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFD54F',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  envelopeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeInnerSeal: {
    alignItems: 'center',
  },
  envelopeSealIcon: {
    fontSize: 42,
  },
  envelopeSealLabel: {
    color: '#0B132B',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 6,
  },

  // STEP 5 - TREE
  treeSceneContainer: {
    flex: 1,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  treeCanvas: {
    height: height * 0.28,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
  },
  treeTrunk: {
    width: 14,
    height: 110,
    backgroundColor: '#5C4033',
    borderRadius: 4,
    position: 'relative',
  },
  treeRootLine: {
    position: 'absolute',
    bottom: 0,
    left: -18,
    right: -18,
    height: 4,
    backgroundColor: '#4A3B32',
    borderRadius: 2,
  },
  leafCluster: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafEmoji: {
    fontSize: 20,
  },
  qualitiesSelectorContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  selectorLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  qualitiesBadgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qualityBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  qualityBadgePicked: {
    backgroundColor: 'rgba(91,61,245,0.2)',
    borderColor: '#5B3DF5',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // STEP 6 - TIMER
  meditativeTimerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 15,
  },
  meditativeClouds: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  cloudIcon: {
    opacity: 0.5,
  },
  meditativeTimerRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD54F',
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  meditativeInnerRing: {
    flex: 1,
    width: '100%',
    borderRadius: 116,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerDigitsText: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: '300',
    letterSpacing: 2,
  },
  timerLabelText: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  reflectionsTextCard: {
    marginTop: 40,
    paddingHorizontal: 30,
    minHeight: 60,
    justifyContent: 'center',
  },
  reflectionStatement: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timerControls: {
    width: '100%',
  },
  timerBtnGroup: {
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
  progressHudLineWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressHudLineFill: {
    height: '100%',
    backgroundColor: '#FFD54F',
    shadowColor: '#FFD54F',
    shadowOpacity: 1,
    shadowRadius: 5,
  },

  // STEP 7 - CELEBRATION
  celebrationScroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  summitGlowHeader: {
    alignItems: 'center',
    marginVertical: 15,
  },
  summitEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  celebrationKicker: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  certificateHeadline: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  certificateGlassView: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    width: '100%',
    padding: 6,
    marginVertical: 10,
    shadowColor: '#FFD54F',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  certDecorativeBorder: {
    borderWidth: 2,
    borderColor: 'rgba(255,213,79,0.15)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  certTitle: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  certSub: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  certSealContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,213,79,0.1)',
    borderWidth: 1,
    borderColor: '#FFD54F',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  certSealText: {
    fontSize: 32,
  },
  certTextBody: {
    color: '#D1D5DB',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  certQualitiesSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  certQualitiesTitle: {
    color: '#8A94A6',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  certBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  certBadge: {
    backgroundColor: 'rgba(255,213,79,0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.2)',
  },
  certBadgeText: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: 'bold',
  },
  certCompletionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
