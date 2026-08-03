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
const TOTAL_UNLOCK_SECONDS = 600; // 10 minutes

const QUESTION_CATEGORIES = [
  { id: 'dreams', title: 'Dreams', icon: '💭', desc: 'Questions about aspirations, visions, and personal hopes.' },
  { id: 'life', title: 'Life', icon: '❤️', desc: 'Questions about personal values, lessons, and wisdom.' },
  { id: 'goals', title: 'Goals', icon: '🎯', desc: 'Questions about career inspiration and personal ambitions.' },
  { id: 'memories', title: 'Memories', icon: '📖', desc: 'Questions about meaningful moments and past experiences.' },
  { id: 'experiences', title: 'Experiences', icon: '🌍', desc: 'Questions about travel, perspective shifts, and discovery.' },
  { id: 'happiness', title: 'Happiness', icon: '✨', desc: 'Questions about joy, gratitude, and fulfillment.' },
];

const QUESTION_FRAGMENTS = [
  { id: 1, text: 'What inspired...' },
  { id: 2, text: 'How did you...' },
  { id: 3, text: 'What changed after...' },
  { id: 4, text: 'What\'s something...' },
  { id: 5, text: 'If you could...' },
];

const KEYMAKER_QUOTES = [
  '🔑 "Curiosity creates connection."',
  '💬 "Great questions change conversations."',
  '✨ "Listen to understand."',
  '🤝 "Every story deserves attention."',
  '🌟 "The quality of your life depends on the quality of your questions."',
];

export default function AskMeaningfulQuestionTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Pick Your Key (Hallway & Rotating Golden Key)
  // 2: Question Keys (Category Selection)
  // 3: Build Your Question (Sentence Fragments)
  // 4: Unlock Journey (10-minute Lock Opening Progression)
  // 5: Endless Path & Celebration (Golden Light Path + Deep Listener Badge)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Keymaker interaction state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFragments, setSelectedFragments] = useState<string[]>([]);
  const [doorUnlocked, setDoorUnlocked] = useState(false);

  // 10-Minute Unlock Timer & Progress
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Animations
  const keySpinAnim = useRef(new Animated.Value(0)).current;
  const lockTurnAnim = useRef(new Animated.Value(0)).current;
  const doorOpenAnim = useRef(new Animated.Value(0)).current;
  const particleFloatAnim = useRef(new Animated.Value(0)).current;

  // Background Golden Key Rotation & Particle Loops
  useEffect(() => {
    // Key rotation loop
    Animated.loop(
      Animated.timing(keySpinAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Glowing particle floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloatAnim, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(particleFloatAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    startTaskOnBackend();
  }, []);

  const startTaskOnBackend = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Ask Meaningful Question' })
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
        await fetch(`${API_BASE_URL}/api/tasks/keymaker/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Ask Meaningful Question', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Pick Your Key
  const handlePickKey = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScreen(2);
  };

  // Screen 2: Select Category Key
  const handleSelectCategory = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(id);
    setDoorUnlocked(true);

    const catObj = QUESTION_CATEGORIES.find((c) => c.id === id);
    if (catObj) {
      saveProgressOnBackend({ category: catObj.title });
    }
  };

  // Screen 3: Toggle Fragment Selection
  const toggleFragment = (text: string) => {
    Haptics.selectionAsync();
    setSelectedFragments((prev) => {
      const updated = prev.includes(text) ? prev.filter((f) => f !== text) : [...prev, text];
      saveProgressOnBackend({ question_fragments: updated });
      return updated;
    });

    // Key turn animation pulse
    lockTurnAnim.setValue(0);
    Animated.timing(lockTurnAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  };

  // Screen 4: 10-Minute Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const step = isFastForward ? 30 : 1;
          const next = prev + step;
          if (next >= TOTAL_UNLOCK_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerActive(false);
            handleCompleteTask();
            return TOTAL_UNLOCK_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, isTimerActive, isFastForward]);

  // Rotate motivational quotes every 8s
  useEffect(() => {
    if (screen === 4) {
      const qInterval = setInterval(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % KEYMAKER_QUOTES.length);
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
          body: JSON.stringify({ task_name: 'Ask Meaningful Question' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, question_asked: true });
      setScreen(5);

      // Door Open Endless Path Animation
      Animated.timing(doorOpenAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  // Interpolated Transforms
  const keyRotationDegree = keySpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particleY = particleFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const doorLightScale = 1 + (timerSeconds / TOTAL_UNLOCK_SECONDS) * 0.4;
  const progressPct = Math.min(100, Math.floor((timerSeconds / TOTAL_UNLOCK_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Midnight Black & Antique Gold Gradient Layer */}
      <Animated.View style={styles.keymakerLayer}>
        <LinearGradient
          colors={['#020617', '#1E3A8A', '#D97706', '#020617']}
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
          <Text style={styles.headerTitle}>Ask Meaningful Question</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🔑 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'key-variant' : 'view-dashboard-outline'}
            size={22}
            color="#F59E0B"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: PICK YOUR KEY (Hallway of Closed Doors & Rotating Golden Key) */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>THE KEYMAKER — STAGE 1</Text>
          <Text style={styles.screenHeader}>"Every person has a story waiting to be unlocked."</Text>
          <Text style={styles.screenSubHeader}>Curiosity opens doors.</Text>

          {/* Hallway & Golden Key Illustration */}
          <View style={styles.hallwayContainer}>
            <Animated.View style={[styles.glowingParticles, { transform: [{ translateY: particleY }] }]}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.sparkleIcon2}>🌟</Text>
              <Text style={styles.sparkleIcon}>✨</Text>
            </Animated.View>

            {/* Rotating Golden Key */}
            <Animated.View style={[styles.goldenKeyCircle, { transform: [{ rotate: keyRotationDegree }] }]}>
              <Text style={styles.giantKeyEmoji}>🔑</Text>
            </Animated.View>
            <Text style={styles.doorwayLabel}>🚪 Hallway of Stories</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handlePickKey}
          >
            <LinearGradient
              colors={['#D97706', '#FCD34D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🔑 Pick Your Key</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: QUESTION KEYS (Floating Category Keys) */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 2 — QUESTION KEYS</Text>
          <Text style={styles.screenHeader}>Select a Story Category Key</Text>
          <Text style={styles.screenSubHeader}>
            Choose a key category to unlock a deeper conversation door.
          </Text>

          {/* Floating Category Keys Grid */}
          <View style={styles.keysGrid}>
            {QUESTION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.keyCard, isSelected && styles.keyCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectCategory(cat.id)}
                >
                  <LinearGradient
                    colors={isSelected ? ['#D97706', '#FCD34D'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.keyCardInner}
                  >
                    <Text style={styles.keyIcon}>{cat.icon}</Text>
                    <View style={styles.keyTextWrapper}>
                      <Text style={[styles.keyTitle, isSelected && styles.keyTitleSelected]}>
                        {cat.title} Key
                      </Text>
                      <Text style={styles.keyDesc}>{cat.desc}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedCategory && { opacity: 0.5 }]}
            disabled={!selectedCategory}
            activeOpacity={0.85}
            onPress={() => setScreen(3)}
          >
            <LinearGradient
              colors={['#D97706', '#FCD34D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Proceed to Build Question 🔑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3: BUILD YOUR QUESTION (Sentence Fragments) */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — BUILD YOUR QUESTION</Text>
          <Text style={styles.screenHeader}>Craft Your Open Question</Text>
          <Text style={styles.screenSubHeader}>
            Select sentence fragments to light up your golden key.
          </Text>

          {/* Sentence Fragment Cards */}
          <View style={styles.fragmentsList}>
            {QUESTION_FRAGMENTS.map((frag) => {
              const isSelected = selectedFragments.includes(frag.text);
              return (
                <TouchableOpacity
                  key={frag.id}
                  style={[styles.fragmentCard, isSelected && styles.fragmentCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => toggleFragment(frag.text)}
                >
                  <LinearGradient
                    colors={isSelected ? ['#D97706', '#F59E0B'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.fragmentInner}
                  >
                    <Text style={[styles.fragmentText, isSelected && styles.fragmentTextSelected]}>
                      "{frag.text}"
                    </Text>
                    {isSelected && <Text style={styles.keyLitIcon}>✨ Key Lit</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, selectedFragments.length === 0 && { opacity: 0.5 }]}
            disabled={selectedFragments.length === 0}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
            }}
          >
            <LinearGradient
              colors={['#D97706', '#FCD34D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start Unlock Journey 🚪</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: UNLOCK JOURNEY (10-Minute Lock Opening Progression) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — UNLOCK JOURNEY</Text>
          <Text style={styles.screenHeader}>Door Unlocking Progress</Text>
          <Text style={styles.screenSubHeader}>
            Remain present for 10 minutes as your question turns the key and light fills the doorway.
          </Text>

          {/* Test Fast-Forward Toggle */}
          <View style={styles.testModeBox}>
            <Text style={styles.testModeLabel}>⚡ Fast-Forward Timer (Test Mode):</Text>
            <Switch
              value={isFastForward}
              onValueChange={setIsFastForward}
              trackColor={{ false: '#334155', true: '#F59E0B' }}
              thumbColor={isFastForward ? '#F8FAFC' : '#94A3B8'}
            />
          </View>

          {/* Door & Lock Visualizer */}
          <View style={styles.doorUnlockBox}>
            <Animated.View style={[styles.doorGlowLight, { transform: [{ scale: doorLightScale }] }]}>
              <LinearGradient
                colors={['#FCD34D', '#D97706', 'transparent']}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            <View style={styles.lockCenterCircle}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>

            <View style={styles.unlockPercentBox}>
              <Text style={styles.unlockPercentText}>{progressPct}%</Text>
              <Text style={styles.unlockStatusLabel}>DOOR UNLOCKING ACTIVE</Text>
            </View>

            <View style={styles.journeyTrack}>
              <View style={[styles.journeyFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Motivational Rotating Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{KEYMAKER_QUOTES[activeQuoteIndex]}</Text>
            <Text style={styles.timeRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_UNLOCK_SECONDS - timerSeconds) / 60))}m {Math.max(0, (TOTAL_UNLOCK_SECONDS - timerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: ENDLESS PATH & FINAL CELEBRATION */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"You opened a deeper conversation."</Text>

          {/* Opened Doorway & Endless Path of Light Illustration */}
          <Animated.View style={[styles.endlessPathBox, { opacity: doorOpenAnim }]}>
            <LinearGradient
              colors={['#FCD34D', '#D97706', '#020617']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.openDoorFrame}>
              <Text style={styles.openDoorEmoji}>🚪✨</Text>
            </View>
            <Text style={styles.pathLightText}>✨ Endless Path of Golden Light</Text>
          </Animated.View>

          {/* Achievement Box */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Deep Listener</Text>
            <Text style={styles.achievementDesc}>
              "You chose curiosity over assumptions and unlocked a real story."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMsgText}>"You went deeper."</Text>
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
                  taskName: 'Ask Meaningful Question',
                  message: 'You went deeper.',
                  difficulty: 'hard',
                  badge: 'Deep Listener'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#D97706', '#FCD34D']}
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
          <Text style={styles.screenHeader}>Keymaker Overview</Text>

          {/* Top Golden Key Illustration */}
          <View style={styles.dashboardTopKeyBox}>
            <Text style={styles.dashboardKeyIcon}>🔑</Text>
            <Text style={styles.dashboardTitle}>Ask Meaningful Question</Text>
          </View>

          {/* Lock Opening Center */}
          <View style={styles.dashboardLockBox}>
            <Text style={styles.dashboardSectionTitle}>Door Unlocked</Text>
            <View style={styles.dashboardRow}>
              <Text style={styles.rowIcon}>🚪</Text>
              <Text style={styles.dashboardRowText}>Category & Sentence Fragments Locked ✔</Text>
            </View>
            <View style={styles.dashboardRow}>
              <Text style={styles.rowIcon}>✨</Text>
              <Text style={styles.dashboardRowText}>10-Minute Deep Question Journey Complete ✔</Text>
            </View>
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Deep Listener Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "The quality of your life depends on the quality of your questions."
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
    backgroundColor: '#020617',
  },
  keymakerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.25)',
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
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
  },
  headerTagText: {
    fontSize: 11,
    color: '#FCD34D',
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
    color: '#FCD34D',
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

  /* Screen 1 */
  hallwayContainer: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowingParticles: {
    position: 'absolute',
    top: 25,
    flexDirection: 'row',
  },
  sparkleIcon: { fontSize: 18, marginHorizontal: 16 },
  sparkleIcon2: { fontSize: 22 },
  goldenKeyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  giantKeyEmoji: { fontSize: 52 },
  doorwayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
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
    color: '#020617',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    marginTop: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCD34D',
  },

  /* Screen 2 Keys Grid */
  keysGrid: {
    width: '100%',
    marginVertical: 16,
  },
  keyCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  keyCardSelected: {
    borderColor: '#FCD34D',
  },
  keyCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  keyIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  keyTextWrapper: {
    flex: 1,
  },
  keyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  keyTitleSelected: {
    color: '#020617',
  },
  keyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Screen 3 Fragments */
  fragmentsList: {
    width: '100%',
    marginVertical: 16,
  },
  fragmentCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  fragmentCardSelected: {
    borderColor: '#FCD34D',
  },
  fragmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  fragmentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    fontStyle: 'italic',
  },
  fragmentTextSelected: {
    color: '#020617',
  },
  keyLitIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#020617',
  },

  /* Screen 4 Unlock Journey */
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
  doorUnlockBox: {
    width: '100%',
    height: 230,
    borderRadius: 24,
    backgroundColor: '#020617',
    borderWidth: 1.5,
    borderColor: '#D97706',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  doorGlowLight: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.35,
  },
  lockCenterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: { fontSize: 40 },
  unlockPercentBox: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  unlockPercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  unlockStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
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
    backgroundColor: '#D97706',
  },
  quoteCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#D97706',
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
    color: '#FCD34D',
    marginTop: 6,
    fontWeight: '600',
  },

  /* Screen 5 Celebration */
  celebrationTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 2,
    marginBottom: 8,
  },
  endlessPathBox: {
    height: 210,
    width: '100%',
    borderRadius: 24,
    marginVertical: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  openDoorFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  openDoorEmoji: { fontSize: 56 },
  pathLightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#020617',
    marginTop: 10,
  },
  achievementBox: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#D97706',
    alignItems: 'center',
    marginVertical: 14,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
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
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FCD34D',
  },
  completionMsgText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardTopKeyBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardKeyIcon: { fontSize: 56 },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardLockBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    marginVertical: 10,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 8,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  rowIcon: { fontSize: 18, marginRight: 10 },
  dashboardRowText: {
    fontSize: 13,
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
    borderColor: '#D97706',
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
    borderColor: '#FCD34D',
    width: '100%',
    marginVertical: 10,
  },
  dashboardQuoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FCD34D',
    textAlign: 'center',
    lineHeight: 20,
  },
});
