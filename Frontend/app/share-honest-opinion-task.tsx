import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TOTAL_VOICE_SECONDS = 120; // 2 minutes

const TOPICS = [
  { id: 'movies', name: 'Movies 🎬', label: 'Cinema & Stories' },
  { id: 'music', name: 'Music 🎵', label: 'Melodies & Rhythm' },
  { id: 'food', name: 'Food 🍕', label: 'Flavors & Tastes' },
  { id: 'books', name: 'Books 📚', label: 'Literature & Ideas' },
  { id: 'sports', name: 'Sports ⚽', label: 'Games & Competition' },
  { id: 'tech', name: 'Technology 💻', label: 'Innovation & Digital' },
  { id: 'travel', name: 'Travel 🌍', label: 'Places & Cultures' },
  { id: 'dailylife', name: 'Daily Life ☕', label: 'Routine & Experiences' },
];

const PROMPTS = [
  { id: 'think', text: 'What do you honestly think?' },
  { id: 'feel', text: 'Why do you feel that way?' },
  { id: 'perspective', text: 'What is your perspective?' },
  { id: 'disagree', text: 'Would you respectfully disagree?' },
  { id: 'believe', text: 'What makes you believe that?' },
];

const SENTENCE_BUILDER_PHRASES = [
  'I...',
  'I believe...',
  'I believe this because...',
  'I believe this because everyone experiences things differently.',
];

const BACKGROUND_KEYWORDS = [
  'Confidence', 'Respect', 'Honesty', 'Truth', 'Perspective', 'Understanding', 'Growth', 'Kindness', 'Authenticity'
];

const MOTIVATIONAL_TYPOGRAPHY = [
  '💬 "Your opinion deserves space."',
  '💬 "Respect makes honesty powerful."',
  '💬 "Different opinions create better conversations."',
  '💬 "Your voice has value."',
  '✨ "You chose honesty over approval."',
];

export default function ShareHonestOpinionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Your Voice Matters (Letter typing animation)
  // 2: Choose a Topic (Kinetic text chips)
  // 3: Find Your Words (Prompt selection)
  // 4: Voice Builder (10-minute kinetic sentence progression)
  // 5: Authentic Celebration (Giant kinetic text + Authentic Voice badge)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Kinetic typography states
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // 10-Minute Voice Builder Timer & Progress
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Kinetic Typing Animation states
  const [typedText, setTypedText] = useState('');
  const fullText = "Your Voice Matters.";

  // Animations
  const wordFloatAnim = useRef(new Animated.Value(0)).current;
  const chipExpandAnim = useRef(new Animated.Value(1)).current;
  const sentenceGlowAnim = useRef(new Animated.Value(0)).current;

  // Kinetic Letter Typing Effect (Screen 1)
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 90);

    // Floating background keywords loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(wordFloatAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wordFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    startTaskOnBackend();
    return () => clearInterval(typingInterval);
  }, []);

  const startTaskOnBackend = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Share Honest Opinion' })
        });
      }
    } catch (e) {
      console.log('Failed to call task start API:', e);
    }
  };

  const saveProgressOnBackend = async (data: Record<string, any>) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/typography/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Share Honest Opinion', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 2: Select Topic with Kinetic Chip Enlargement & Character Merge Animation
  const handleSelectTopic = (id: string) => {
    Haptics.selectionAsync();
    setSelectedTopic(id);

    chipExpandAnim.setValue(0.85);
    Animated.spring(chipExpandAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const topicObj = TOPICS.find((t) => t.id === id);
    if (topicObj) {
      saveProgressOnBackend({ topic: topicObj.name });
    }
  };

  // Screen 3: Select Prompt
  const handleSelectPrompt = (text: string) => {
    Haptics.selectionAsync();
    setSelectedPrompt(text);
    saveProgressOnBackend({ prompt: text });
  };

  // Screen 4: 10-Minute Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const step = isFastForward ? 30 : 1;
          const next = prev + step;
          if (next >= TOTAL_VOICE_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerActive(false);
            handleCompleteTask();
            return TOTAL_VOICE_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, isTimerActive, isFastForward]);

  // Rotate motivational typography every 8s
  useEffect(() => {
    if (screen === 4) {
      const qInterval = setInterval(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_TYPOGRAPHY.length);
      }, 8000);
      return () => clearInterval(qInterval);
    }
  }, [screen]);

  // Complete Task & Award Points
  const handleCompleteTask = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Share Honest Opinion' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, opinion_shared: true });
      setScreen(5);

      // Kinetic Typography Glow Animation
      Animated.timing(sentenceGlowAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  // Sentence Builder Index (0 to 3)
  const sentenceStageIdx = Math.min(
    SENTENCE_BUILDER_PHRASES.length - 1,
    Math.floor((timerSeconds / TOTAL_VOICE_SECONDS) * SENTENCE_BUILDER_PHRASES.length)
  );

  const wordFloatY = wordFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const progressPct = Math.min(100, Math.floor((timerSeconds / TOTAL_VOICE_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Charcoal Black & Kinetic Royal Blue Gradient Background */}
      <Animated.View style={styles.typographyLayer}>
        <LinearGradient
          colors={['#0B0F19', '#121826', '#2563EB', '#0B0F19']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Global Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))}
        >
          <Feather name="arrow-left" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Share Honest Opinion</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🗣️✍️ 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'format-letter-case' : 'view-dashboard-outline'}
            size={22}
            color="#38BDF8"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: YOUR VOICE MATTERS (Kinetic Letter Typing Animation) */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>WORDS MATTER — STAGE 1</Text>
          
          {/* Kinetic Typing Hero Text */}
          <View style={styles.kineticHeroBox}>
            <Text style={styles.typedHeroText}>{typedText}</Text>
            <View style={styles.cursorBlink} />
          </View>

          <Text style={styles.screenSubHeader}>
            "Confidence begins when your words are truly yours."
          </Text>

          {/* Floating Words Particle Backdrop */}
          <Animated.View style={[styles.floatingWordsContainer, { transform: [{ translateY: wordFloatY }] }]}>
            {BACKGROUND_KEYWORDS.slice(0, 5).map((kw, idx) => (
              <Text key={idx} style={styles.bgWordParticle}>{kw}</Text>
            ))}
          </Animated.View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(2)}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🗣️ Start Speaking</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: CHOOSE A TOPIC (Floating Kinetic Typography Chips) */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 2 — CONVERSATION TOPIC</Text>
          <Text style={styles.screenHeader}>Select Your Discussion Topic</Text>
          <Text style={styles.screenSubHeader}>
            Choose a subject where you hold a genuine, heartfelt perspective.
          </Text>

          {/* Typography Text Chips Grid */}
          <View style={styles.topicsGrid}>
            {TOPICS.map((t) => {
              const isSelected = selectedTopic === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTopic(t.id)}
                >
                  <Animated.View
                    style={[
                      styles.chipInner,
                      isSelected && { transform: [{ scale: chipExpandAnim }] }
                    ]}
                  >
                    <Text style={[styles.topicNameText, isSelected && styles.topicNameSelected]}>
                      {t.name}
                    </Text>
                    <Text style={styles.topicLabelText}>{t.label}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedTopic && { opacity: 0.5 }]}
            disabled={!selectedTopic}
            activeOpacity={0.85}
            onPress={() => setScreen(3)}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Proceed to Prompts ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3: FIND YOUR WORDS (Animated Prompts) */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — FIND YOUR WORDS</Text>
          <Text style={styles.screenHeader}>Select a Conversation Prompt</Text>
          <Text style={styles.screenSubHeader}>
            Pick an entry point to introduce your honest perspective.
          </Text>

          {/* Animated Typography Prompts */}
          <View style={styles.promptsList}>
            {PROMPTS.map((p) => {
              const isSelected = selectedPrompt === p.text;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.promptCard, isSelected && styles.promptCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectPrompt(p.text)}
                >
                  <LinearGradient
                    colors={isSelected ? ['#2563EB', '#38BDF8'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.promptInner}
                  >
                    <Text style={[styles.promptText, isSelected && styles.promptTextSelected]}>
                      "{p.text}"
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedPrompt && { opacity: 0.5 }]}
            disabled={!selectedPrompt}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Launch Voice Builder 🗣️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: VOICE BUILDER (10-Minute Sentence Progression) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — VOICE BUILDER</Text>
          <Text style={styles.screenHeader}>Building Your Authentic Phrase</Text>
          <Text style={styles.screenSubHeader}>
            Express your opinion respectfully as your words gain clarity over 2 minutes.
          </Text>

          {/* Test Fast-Forward Toggle */}
          <View style={styles.testModeBox}>
            <Text style={styles.testModeLabel}>⚡ Fast-Forward Timer (Test Mode):</Text>
            <Switch
              value={isFastForward}
              onValueChange={setIsFastForward}
              trackColor={{ false: '#334155', true: '#38BDF8' }}
              thumbColor={isFastForward ? '#F8FAFC' : '#94A3B8'}
            />
          </View>

          {/* Sentence Builder Visualizer */}
          <View style={styles.sentenceBuilderBox}>
            {/* Background Moving Keywords */}
            <Animated.View style={[styles.bgWordsLayer, { transform: [{ translateY: wordFloatY }] }]}>
              {BACKGROUND_KEYWORDS.map((word, idx) => (
                <Text key={idx} style={styles.bgWordItem}>{word}</Text>
              ))}
            </Animated.View>

            {/* Current Assembled Phrase */}
            <View style={styles.assembledPhraseContainer}>
              <Text style={styles.assembledPhraseText}>
                {SENTENCE_BUILDER_PHRASES[sentenceStageIdx]}
              </Text>
            </View>

            <View style={styles.voiceProgressRow}>
              <Text style={styles.voiceProgressPct}>{progressPct}%</Text>
              <Text style={styles.voiceProgressLabel}>EXPRESSION ACTIVE</Text>
            </View>

            <View style={styles.journeyTrack}>
              <View style={[styles.journeyFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Motivational Rotating Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{MOTIVATIONAL_TYPOGRAPHY[activeQuoteIndex]}</Text>
            <Text style={styles.timeRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_VOICE_SECONDS - timerSeconds) / 60))}m {Math.max(0, (TOTAL_VOICE_SECONDS - timerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: AUTHENTIC CELEBRATION (Giant Kinetic Typography + Authentic Voice Badge) */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"You expressed yourself honestly."</Text>

          {/* Giant Illuminated Kinetic Typography Composition */}
          <Animated.View style={[styles.giantTypographyBox, { opacity: sentenceGlowAnim }]}>
            <LinearGradient
              colors={['#2563EB', '#60A5FA', '#0B0F19']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <Text style={styles.giantHeroText}>Your Voice Matters.</Text>
            
            <View style={styles.authenticCenterpiece}>
              <Text style={styles.authenticCenterText}>AUTHENTIC</Text>
              <Text style={styles.authenticSubText}>You chose honesty over approval.</Text>
            </View>
          </Animated.View>

          {/* Achievement Box */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Authentic Voice</Text>
            <Text style={styles.achievementDesc}>
              "You stepped forward and spoke your truth with respect."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMsgText}>"You were authentic."</Text>
          </View>

          {/* Mandatory Navigation to Shared Well Done Screen */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              router.replace({
                pathname: '/task-success',
                params: {
                  points: earnedPoints.toString(),
                  taskName: 'Share Honest Opinion',
                  message: 'You were authentic.',
                  difficulty: 'hard',
                  badge: 'Authentic Voice'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Continue to Well Done 🎉</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 6: TASK DETAIL DASHBOARD */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenHeader}>Kinetic Typography Overview</Text>

          {/* Top Kinetic Hero Illustration */}
          <View style={styles.dashboardTopHeroBox}>
            <Text style={styles.dashboardHeroIcon}>🗣️✍️</Text>
            <Text style={styles.dashboardTitle}>Share Honest Opinion</Text>
          </View>

          {/* Live Floating Keywords Center */}
          <View style={styles.dashboardKeywordsBox}>
            <Text style={styles.dashboardSectionTitle}>Live Expression Keywords</Text>
            <View style={styles.dashboardKeywordChipsRow}>
              {BACKGROUND_KEYWORDS.slice(0, 6).map((kw, idx) => (
                <View key={idx} style={styles.dashKwPill}>
                  <Text style={styles.dashKwText}>{kw}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Authentic Voice Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "Your strongest voice is the one that speaks honestly."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setScreen(4)}
          >
            <Text style={styles.secondaryBtnText}>Back to Challenge</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  typographyLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerTag: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
  },
  headerTagText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  dashboardBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  scrollScreenContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  screenTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  screenSubHeader: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Screen 1 Kinetic Typing */
  kineticHeroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    minHeight: 80,
  },
  typedHeroText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cursorBlink: {
    width: 3,
    height: 36,
    backgroundColor: '#38BDF8',
    marginLeft: 4,
  },
  floatingWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  bgWordParticle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(96, 165, 250, 0.4)',
    marginHorizontal: 8,
    marginVertical: 4,
  },

  /* Buttons */
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  primaryBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    marginTop: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },

  /* Screen 2 Topics Grid */
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  topicChip: {
    width: '48%',
    borderRadius: 18,
    marginVertical: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    overflow: 'hidden',
  },
  topicChipSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
  },
  chipInner: {
    padding: 16,
    alignItems: 'center',
  },
  topicNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  topicNameSelected: {
    color: '#38BDF8',
  },
  topicLabelText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  /* Screen 3 Prompts */
  promptsList: {
    width: '100%',
    marginVertical: 16,
  },
  promptCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  promptCardSelected: {
    borderColor: '#60A5FA',
  },
  promptInner: {
    padding: 16,
  },
  promptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    fontStyle: 'italic',
  },
  promptTextSelected: {
    color: '#F8FAFC',
  },

  /* Screen 4 Voice Builder */
  testModeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    marginVertical: 10,
  },
  testModeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sentenceBuilderBox: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: '#0B0F19',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  bgWordsLayer: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    opacity: 0.15,
    top: 15,
  },
  bgWordItem: {
    fontSize: 13,
    color: '#38BDF8',
    marginHorizontal: 8,
    marginVertical: 4,
    fontWeight: '700',
  },
  assembledPhraseContainer: {
    zIndex: 10,
    alignItems: 'center',
  },
  assembledPhraseText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 28,
  },
  voiceProgressRow: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  voiceProgressPct: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  voiceProgressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  journeyTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  journeyFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  quoteCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    marginTop: 10,
  },
  quoteCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 6,
    fontWeight: '600',
  },

  /* Screen 5 Celebration */
  celebrationTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
    marginBottom: 8,
  },
  giantTypographyBox: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    marginVertical: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#60A5FA',
    paddingHorizontal: 16,
  },
  giantHeroText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  authenticCenterpiece: {
    marginTop: 16,
    alignItems: 'center',
  },
  authenticCenterText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 4,
  },
  authenticSubText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 2,
    fontStyle: 'italic',
  },
  achievementBox: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    marginVertical: 14,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  medalIcon: { fontSize: 32 },
  achievementTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  achievementDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  rewardPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  completionMsgText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardTopHeroBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardHeroIcon: { fontSize: 56 },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardKeywordsBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginVertical: 10,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
  dashboardKeywordChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dashKwPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    marginRight: 6,
    marginBottom: 6,
  },
  dashKwText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  dashboardBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    width: '100%',
    marginVertical: 10,
  },
  dashboardBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginLeft: 10,
  },
  dashboardQuoteBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    width: '100%',
    marginVertical: 10,
  },
  dashboardQuoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#38BDF8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
