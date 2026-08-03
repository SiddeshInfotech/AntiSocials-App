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
const TOTAL_FIRE_SECONDS = 300; // 5 minutes

const FIREWOOD_TOKENS = [
  { id: 'listening', title: 'Active Listening', icon: '👂', desc: 'Focus fully on their words without preparing your next reply.' },
  { id: 'followup', title: 'Follow-up Question', icon: '❓', desc: 'Ask an open, curious question about what they just shared.' },
  { id: 'experience', title: 'Shared Experience', icon: '😊', desc: 'Relate with a small, grounded personal story or feeling.' },
  { id: 'encouragement', title: 'Encouraging Response', icon: '💬', desc: 'Acknowledge their thoughts with warmth and affirmation.' },
  { id: 'humor', title: 'Light Humor', icon: '😂', desc: 'Bring playful, gentle humor to keep the mood relaxed.' },
  { id: 'curiosity', title: 'Genuine Curiosity', icon: '🤝', desc: 'Show real care for their perspective and experiences.' },
];

const CAMPFIRE_QUOTES = [
  '🔥 "Connection grows with attention."',
  '🤝 "Listening keeps conversations alive."',
  '✨ "Presence is more powerful than perfection."',
  '💬 "Keep the warmth going."',
  '🌟 "The strongest conversations aren\'t rushed—they\'re nurtured."',
];

const REMINDER_PROMPTS = [
  { id: 1, text: '👂 "Listen more than you speak."', action: 'Add Ember ✨' },
  { id: 2, text: '💬 "Ask a follow-up question."', action: 'Add Ember ✨' },
  { id: 3, text: '😊 "Share a small experience."', action: 'Add Ember ✨' },
  { id: 4, text: '🤝 "Show genuine interest."', action: 'Add Ember ✨' },
];

export default function HoldConversation5MinTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Light the Fire (Spark ignition)
  // 2: Firewood Tokens (Select 2-3 logs sliding into fire)
  // 3: Keep the Fire Alive (Interactive reminders adding embers)
  // 4: Steady Flame (5-minute Campfire Timer)
  // 5: Shared Warmth & Celebration (Floating lantern embers + Conversation Keeper badge)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Firewood tokens & reminder states
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [fireLit, setFireLit] = useState(false);
  const [embersCount, setEmbersCount] = useState(0);

  // 5-Minute Timer & Flame progress
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Animations
  const sparkAnim = useRef(new Animated.Value(0)).current;
  const flameScaleAnim = useRef(new Animated.Value(1)).current;
  const emberFloatAnim = useRef(new Animated.Value(0)).current;
  const logSlideAnim = useRef(new Animated.Value(0)).current;
  const duskSkyAnim = useRef(new Animated.Value(0)).current;

  // Background Flame Flicker & Embers Floating Loops
  useEffect(() => {
    // Flame flickering loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameScaleAnim, { toValue: 1.15, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flameScaleAnim, { toValue: 0.95, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Floating embers loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(emberFloatAnim, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(emberFloatAnim, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
          body: JSON.stringify({ task_name: 'Hold Conversation (5 Minutes)' })
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
        await fetch(`${API_BASE_URL}/api/tasks/campfire/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Hold Conversation (5 Minutes)', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Light the Fire Spark Animation
  const handleLightFire = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    sparkAnim.setValue(0);

    Animated.sequence([
      Animated.timing(sparkAnim, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setFireLit(true);
      setScreen(2);
      saveProgressOnBackend({ fire_lit: true });
    });
  };

  // Screen 2: Select Firewood Token
  const toggleLog = (id: string) => {
    Haptics.selectionAsync();
    setSelectedLogs((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 3) {
          updated = [...prev.slice(1), id];
        } else {
          updated = [...prev, id];
        }
      }
      saveProgressOnBackend({ skills: updated });
      return updated;
    });

    // Log slide animation
    logSlideAnim.setValue(0);
    Animated.timing(logSlideAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  };

  // Screen 3: Add Ember from Reminder Prompt
  const handleAddEmber = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEmbersCount((prev) => prev + 1);
  };

  // Screen 4: 5-Minute Campfire Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const step = isFastForward ? 30 : 1;
          const next = prev + step;
          if (next >= TOTAL_FIRE_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerActive(false);
            handleCompleteTask();
            return TOTAL_FIRE_SECONDS;
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
        setActiveQuoteIndex((prev) => (prev + 1) % CAMPFIRE_QUOTES.length);
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
          body: JSON.stringify({ task_name: 'Hold Conversation (5 Minutes)' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, steady_flame: true });
      setScreen(5);

      // Evening Dusk Sky Glow Animation
      Animated.timing(duskSkyAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  // Interpolated Transforms
  const emberY = emberFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });

  const flameProgressScale = 1 + (timerSeconds / TOTAL_FIRE_SECONDS) * 0.45;
  const progressPct = Math.min(100, Math.floor((timerSeconds / TOTAL_FIRE_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Warm Dusk & Campfire Glow Gradient Layer */}
      <Animated.View style={styles.campfireLayer}>
        <LinearGradient
          colors={['#1E293B', '#6B4F3A', '#F97316', '#0F172A']}
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
          <Text style={styles.headerTitle}>Hold Conversation (5 min)</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🔥 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'campfire' : 'view-dashboard-outline'}
            size={22}
            color="#F97316"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: LIGHT THE FIRE */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>STAGE 1 — THE SPARK</Text>
          <Text style={styles.screenHeader}>"Every meaningful conversation starts with a spark."</Text>
          <Text style={styles.screenSubHeader}>Keep the fire alive.</Text>

          {/* Fire Pit Outdoor Seating Illustration */}
          <View style={styles.firePitContainer}>
            <Animated.View style={[styles.floatingEmbersRow, { transform: [{ translateY: emberY }] }]}>
              <Text style={styles.emberIcon}>✨</Text>
              <Text style={styles.emberIcon2}>🔥</Text>
              <Text style={styles.emberIcon}>✨</Text>
            </Animated.View>

            <View style={styles.firePitLogsBase}>
              <Text style={styles.logsEmoji}>🪵 🪵</Text>
            </View>

            {/* Spark & Flame Ignition */}
            <Animated.View style={[styles.flameCircle, { transform: [{ scale: flameScaleAnim }] }]}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleLightFire}
          >
            <LinearGradient
              colors={['#F97316', '#FACC15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🔥 Light the Campfire</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: FIREWOOD TOKENS (Select 2-3 logs) */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 2 — FIREWOOD TOKENS</Text>
          <Text style={styles.screenHeader}>Select Conversation Skills</Text>
          <Text style={styles.screenSubHeader}>
            Choose 2 or 3 wooden logs to fuel your conversation campfire.
          </Text>

          {/* Wooden Logs Grid */}
          <View style={styles.logsGrid}>
            {FIREWOOD_TOKENS.map((log) => {
              const isSelected = selectedLogs.includes(log.id);
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[styles.logCard, isSelected && styles.logCardSelected]}
                  activeOpacity={0.8}
                  onPress={() => toggleLog(log.id)}
                >
                  <LinearGradient
                    colors={isSelected ? ['#F97316', '#6B4F3A'] : ['rgba(51, 65, 85, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.logCardInner}
                  >
                    <Text style={styles.logIcon}>{log.icon}</Text>
                    <View style={styles.logTextWrapper}>
                      <Text style={[styles.logTitle, isSelected && styles.logTitleSelected]}>
                        {log.title}
                      </Text>
                      <Text style={styles.logDesc}>{log.desc}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, selectedLogs.length < 2 && { opacity: 0.5 }]}
            disabled={selectedLogs.length < 2}
            activeOpacity={0.85}
            onPress={() => setScreen(3)}
          >
            <LinearGradient
              colors={['#F97316', '#FACC15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Feed the Campfire 🪵</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3: KEEP THE FIRE ALIVE (Interactive Reminders) */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — KEEP THE FIRE ALIVE</Text>
          <Text style={styles.screenHeader}>Nurture the Connection</Text>
          <Text style={styles.screenSubHeader}>
            Tap interactive reminders as you practice presence in your conversation.
          </Text>

          {/* Central Burning Campfire */}
          <View style={styles.centralFireBox}>
            <Animated.View style={[styles.centralFlameGlow, { transform: [{ scale: flameScaleAnim }] }]}>
              <Text style={styles.giantFireEmoji}>🔥</Text>
            </Animated.View>
            <Text style={styles.embersCountText}>✨ {embersCount} Embers Added</Text>
          </View>

          {/* Reminder Prompt Cards */}
          <View style={styles.remindersList}>
            {REMINDER_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={styles.reminderCard}
                activeOpacity={0.8}
                onPress={handleAddEmber}
              >
                <Text style={styles.reminderText}>{prompt.text}</Text>
                <View style={styles.emberActionBtn}>
                  <Text style={styles.emberActionText}>{prompt.action}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
            }}
          >
            <LinearGradient
              colors={['#F97316', '#FACC15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start 5-Min Steady Flame 🔥</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: STEADY FLAME (5-Minute Timer & Campfire Strength) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — STEADY FLAME</Text>
          <Text style={styles.screenHeader}>5-Minute Endurance Flame</Text>
          <Text style={styles.screenSubHeader}>
            Keep your attention focused as the campfire reaches its maximum steady warmth.
          </Text>

          {/* Test Fast-Forward Toggle */}
          <View style={styles.testModeBox}>
            <Text style={styles.testModeLabel}>⚡ Fast-Forward Timer (Test Mode):</Text>
            <Switch
              value={isFastForward}
              onValueChange={setIsFastForward}
              trackColor={{ false: '#334155', true: '#F97316' }}
              thumbColor={isFastForward ? '#F8FAFC' : '#94A3B8'}
            />
          </View>

          {/* Campfire Progress Strength Visualizer */}
          <View style={styles.flameVisualizerBox}>
            <Animated.View style={[styles.flameSparkles, { transform: [{ translateY: emberY }] }]}>
              <Text style={styles.sparkleEmoji}>✨</Text>
              <Text style={styles.sparkleEmoji2}>🌟</Text>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: flameProgressScale }] }}>
              <Text style={styles.growingFlameEmoji}>🔥</Text>
            </Animated.View>

            <View style={styles.flamePercentBox}>
              <Text style={styles.flamePercentText}>{progressPct}%</Text>
              <Text style={styles.flameStatusLabel}>STEADY WARMTH</Text>
            </View>

            <View style={styles.journeyTrack}>
              <View style={[styles.journeyFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Rotating Motivational Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{CAMPFIRE_QUOTES[activeQuoteIndex]}</Text>
            <Text style={styles.timeRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_FIRE_SECONDS - timerSeconds) / 60))}m {Math.max(0, (TOTAL_FIRE_SECONDS - timerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: SHARED WARMTH & CELEBRATION */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"You kept the connection alive."</Text>

          {/* Floating Lantern Embers & Night Atmosphere */}
          <Animated.View style={[styles.celebrationCampfireBox, { opacity: duskSkyAnim }]}>
            <LinearGradient
              colors={['#F97316', '#6B4F3A', '#0F172A']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.lanternEmbersRow}>
              <Text style={styles.lanternEmber}>✨</Text>
              <Text style={styles.lanternEmber2}>🌟</Text>
              <Text style={styles.lanternEmber}>✨</Text>
            </View>

            <Text style={styles.giantFireEmoji}>🔥</Text>
            <Text style={styles.celebrationWarmthLabel}>✨ Sustained Warm Connection</Text>
          </Animated.View>

          {/* Achievement Card */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Conversation Keeper</Text>
            <Text style={styles.achievementDesc}>
              "Great conversations are remembered because someone chose to stay engaged."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMsgText}>"You sustained connection."</Text>
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
                  taskName: 'Hold Conversation (5 Minutes)',
                  message: 'You sustained connection.',
                  difficulty: 'hard',
                  badge: 'Conversation Keeper'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#F97316', '#FACC15']}
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
          <Text style={styles.screenHeader}>Conversation Campfire Overview</Text>

          {/* Large Campfire Illustration Top */}
          <View style={styles.dashboardTopCampfireBox}>
            <Text style={styles.dashboardFireIcon}>🔥</Text>
            <Text style={styles.dashboardTitle}>Hold Conversation (5 Minutes)</Text>
          </View>

          {/* Glowing Fire Center */}
          <View style={styles.dashboardFireBox}>
            <Text style={styles.dashboardSectionTitle}>Maximum Warmth Reached</Text>
            <View style={styles.dashboardSkillRow}>
              <Text style={styles.skillIcon}>🪵</Text>
              <Text style={styles.dashboardSkillText}>Selected Conversation Skills Fueled Fire ✔</Text>
            </View>
            <View style={styles.dashboardSkillRow}>
              <Text style={styles.skillIcon}>✨</Text>
              <Text style={styles.dashboardSkillText}>5-Minute Sustained Connection Completed ✔</Text>
            </View>
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Conversation Keeper Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "The strongest conversations aren't rushed—they're nurtured."
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
    backgroundColor: '#0F172A',
  },
  campfireLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(249, 115, 22, 0.2)',
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
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
  },
  headerTagText: {
    fontSize: 11,
    color: '#FACC15',
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
    color: '#F97316',
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
  firePitContainer: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingEmbersRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 25,
  },
  emberIcon: { fontSize: 20, marginHorizontal: 12 },
  emberIcon2: { fontSize: 24, marginHorizontal: 10 },
  firePitLogsBase: {
    position: 'absolute',
    bottom: 30,
  },
  logsEmoji: { fontSize: 40 },
  flameCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  fireEmoji: { fontSize: 52 },

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
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    marginTop: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },

  /* Screen 2 Logs Grid */
  logsGrid: {
    width: '100%',
    marginVertical: 16,
  },
  logCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  logCardSelected: {
    borderColor: '#FACC15',
  },
  logCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  logIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  logTextWrapper: {
    flex: 1,
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  logTitleSelected: {
    color: '#FACC15',
  },
  logDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Screen 3 Keep Fire Alive */
  centralFireBox: {
    alignItems: 'center',
    marginVertical: 20,
  },
  centralFlameGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  giantFireEmoji: { fontSize: 64 },
  embersCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FACC15',
    marginTop: 10,
  },
  remindersList: {
    width: '100%',
    marginVertical: 10,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    marginVertical: 4,
  },
  reminderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  emberActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
  },
  emberActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FACC15',
  },

  /* Screen 4 Steady Flame */
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
  flameVisualizerBox: {
    width: '100%',
    height: 230,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F97316',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  flameSparkles: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
  },
  sparkleEmoji: { fontSize: 16, marginRight: 20 },
  sparkleEmoji2: { fontSize: 18 },
  growingFlameEmoji: { fontSize: 72 },
  flamePercentBox: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  flamePercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  flameStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FACC15',
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
    backgroundColor: '#F97316',
  },
  quoteCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#F97316',
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
    color: '#FACC15',
    marginTop: 6,
    fontWeight: '600',
  },

  /* Screen 5 Celebration */
  celebrationTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FACC15',
    letterSpacing: 2,
    marginBottom: 8,
  },
  celebrationCampfireBox: {
    height: 210,
    width: '100%',
    borderRadius: 24,
    marginVertical: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  lanternEmbersRow: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
  },
  lanternEmber: { fontSize: 18, marginHorizontal: 16 },
  lanternEmber2: { fontSize: 22 },
  celebrationWarmthLabel: {
    position: 'absolute',
    bottom: 12,
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  achievementBox: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#F97316',
    alignItems: 'center',
    marginVertical: 14,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
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
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FACC15',
  },
  completionMsgText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardTopCampfireBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardFireIcon: { fontSize: 56 },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardFireBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginVertical: 10,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FACC15',
    marginBottom: 8,
  },
  dashboardSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  skillIcon: { fontSize: 18, marginRight: 10 },
  dashboardSkillText: {
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
    borderColor: '#F97316',
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
    borderColor: '#FACC15',
    width: '100%',
    marginVertical: 10,
  },
  dashboardQuoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FACC15',
    textAlign: 'center',
    lineHeight: 20,
  },
});
