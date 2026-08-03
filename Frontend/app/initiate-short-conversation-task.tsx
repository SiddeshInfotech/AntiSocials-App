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
const TOTAL_JOURNEY_SECONDS = 600; // 10 minutes

const FLOW_STAGES = [
  { id: 1, title: 'Start', icon: '🌊', desc: 'Begin with an open, friendly greeting or observation.' },
  { id: 2, title: 'Listen', icon: '💬', desc: 'Give your full attention and listen carefully to their response.' },
  { id: 3, title: 'Respond', icon: '😊', desc: 'Acknowledge warmly and share a small natural reflection.' },
  { id: 4, title: 'Continue', icon: '🤝', desc: 'Ask a light follow-up to keep the conversation flowing 30–90 seconds.' },
];

const FLOW_BOOSTERS = [
  { id: 'listen', title: 'Listen Carefully', icon: '👂', desc: 'Focus entirely on what they say without rushing to talk.' },
  { id: 'followup', title: 'Ask One Follow-up', icon: '❓', desc: 'Stay curious with a natural open follow-up question.' },
  { id: 'smile', title: 'Smile Naturally', icon: '😊', desc: 'Keep warm facial expression and friendly eye contact.' },
  { id: 'acknowledge', title: 'Acknowledge Answer', icon: '👍', desc: 'Nod and validate their thoughts warmly.' },
  { id: 'share', title: 'Share One Small Thought', icon: '💬', desc: 'Add a relatable short detail from your own day.' },
];

const MOTIVATIONAL_CARDS = [
  '💬 "Good conversations aren\'t rushed."',
  '🌊 "Listening is part of confidence."',
  '😊 "Stay curious."',
  '🤝 "Every reply keeps the flow alive."',
  '✨ "Small moments of presence build lasting confidence."',
];

export default function InitiateShortConversationTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Start the Flow
  // 2: Flow Path
  // 3: Flow Boosters
  // 4: Current Journey (10-minute River Current)
  // 5: Horizon Sunrise & Celebration
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Interaction State
  const [activeStage, setActiveStage] = useState<number>(1);
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [flowInitiated, setFlowInitiated] = useState(false);
  const [flowContinued, setFlowContinued] = useState(false);

  // 10-Minute River Timer & Progress
  const [journeySeconds, setJourneySeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Animations
  const riverWaveAnim = useRef(new Animated.Value(0)).current;
  const dropAnim = useRef(new Animated.Value(-40)).current;
  const dropScaleAnim = useRef(new Animated.Value(1)).current;
  const currentFlowAnim = useRef(new Animated.Value(0)).current;
  const birdFlyAnim = useRef(new Animated.Value(-60)).current;
  const breezeAnim = useRef(new Animated.Value(0)).current;
  const sunriseGlowAnim = useRef(new Animated.Value(0)).current;

  // Background River Current Loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(riverWaveAnim, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(riverWaveAnim, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Flying Birds Ambient Animation Loop
    Animated.loop(
      Animated.timing(birdFlyAnim, {
        toValue: width + 80,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle Breeze Animation Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(breezeAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breezeAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
          body: JSON.stringify({ task_name: 'Initiate Short Conversation' })
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
        await fetch(`${API_BASE_URL}/api/tasks/conversation-flow/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Initiate Short Conversation', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Drop falling into river animation
  const handleBeginFlow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    dropAnim.setValue(-40);
    dropScaleAnim.setValue(1);

    Animated.sequence([
      Animated.timing(dropAnim, { toValue: 110, duration: 900, easing: Easing.bounce, useNativeDriver: true }),
      Animated.timing(dropScaleAnim, { toValue: 2.2, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setScreen(2);
      saveProgressOnBackend({ flow_initiated: true });
    });
  };

  // Screen 3: Toggle Booster Selection
  const toggleBooster = (id: string) => {
    Haptics.selectionAsync();
    setSelectedBoosters((prev) => {
      const updated = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      saveProgressOnBackend({ boosters: updated });
      return updated;
    });
  };

  // Screen 4: 10-Minute River Current Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setJourneySeconds((prev) => {
          const step = isFastForward ? 30 : 1;
          const next = prev + step;
          if (next >= TOTAL_JOURNEY_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerActive(false);
            handleCompleteTask();
            return TOTAL_JOURNEY_SECONDS;
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
        setActiveQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_CARDS.length);
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
          body: JSON.stringify({ task_name: 'Initiate Short Conversation' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, journey_completed: true });
      setScreen(5);

      // Sunrise Lake Glow Animation
      Animated.timing(sunriseGlowAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  // Interpolated Transforms
  const waveTranslateY = riverWaveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const breezeX = breezeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const journeyProgressPct = Math.min(100, Math.floor((journeySeconds / TOTAL_JOURNEY_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Flowing Water Gradient Layer */}
      <Animated.View style={styles.riverLayer}>
        <LinearGradient
          colors={['#0F172A', '#2563EB', '#38BDF8', '#0F172A']}
          start={{ x: 0, y: 0.1 }}
          end={{ x: 1, y: 0.9 }}
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
          <Text style={styles.headerTitle}>Initiate Short Conversation</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🌊💬 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'waves' : 'view-dashboard-outline'}
            size={22}
            color="#38BDF8"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: START THE FLOW */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>STAGE 1 — THE RIVER SOURCE</Text>
          <Text style={styles.screenHeader}>"Every conversation starts with one small moment."</Text>
          <Text style={styles.screenSubHeader}>Keep it flowing.</Text>

          {/* Water Source & Falling Drop Illustration */}
          <View style={styles.waterSourceContainer}>
            <Animated.View
              style={[
                styles.fallingDrop,
                {
                  transform: [
                    { translateY: dropAnim },
                    { scale: dropScaleAnim }
                  ]
                }
              ]}
            >
              <Text style={styles.dropEmoji}>💧</Text>
            </Animated.View>

            {/* Ripple Pool */}
            <View style={styles.riverPool}>
              <Animated.View style={[styles.poolWave, { transform: [{ translateY: waveTranslateY }] }]} />
              <Text style={styles.poolWaterText}>🌊 River Current Active</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleBeginFlow}
          >
            <LinearGradient
              colors={['#2563EB', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🌊 Begin Flow</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: FLOW PATH (4 River Bends) */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 2 — FLOW PATH</Text>
          <Text style={styles.screenHeader}>The Conversation River</Text>
          <Text style={styles.screenSubHeader}>
            Move through the 4 stages of a natural 30–90 second interaction.
          </Text>

          {/* River Bends Visualizer */}
          <View style={styles.riverPathContainer}>
            <View style={styles.riverPathLine} />

            {FLOW_STAGES.map((stage) => {
              const isActive = activeStage >= stage.id;
              return (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.riverBendCard,
                    isActive && styles.riverBendCardActive
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveStage(stage.id);
                  }}
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? ['rgba(37, 99, 235, 0.4)', 'rgba(56, 189, 248, 0.25)']
                        : ['rgba(30, 41, 59, 0.5)', 'rgba(15, 23, 42, 0.5)']
                    }
                    style={styles.bendCardInner}
                  >
                    <Text style={styles.bendIcon}>{stage.icon}</Text>
                    <View style={styles.bendTextWrapper}>
                      <Text style={[styles.bendTitle, isActive && styles.bendTitleActive]}>
                        Stage {stage.id}: {stage.title}
                      </Text>
                      <Text style={styles.bendDesc}>{stage.desc}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(3)}
          >
            <LinearGradient
              colors={['#38BDF8', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Proceed to Boosters ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3: FLOW BOOSTERS */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — FLOW BOOSTERS</Text>
          <Text style={styles.screenHeader}>Select Conversation Boosters</Text>
          <Text style={styles.screenSubHeader}>
            Choose 1 or more mindsets to anchor your presence before speaking.
          </Text>

          {/* Liquid Morph Booster Cards */}
          <View style={styles.boostersGrid}>
            {FLOW_BOOSTERS.map((b) => {
              const isSelected = selectedBoosters.includes(b.id);
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.boosterCard,
                    isSelected && styles.boosterCardSelected
                  ]}
                  activeOpacity={0.8}
                  onPress={() => toggleBooster(b.id)}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ['#2563EB', '#38BDF8']
                        : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']
                    }
                    style={styles.boosterInner}
                  >
                    <Text style={styles.boosterIcon}>{b.icon}</Text>
                    <Text style={[styles.boosterTitle, isSelected && styles.boosterTitleSelected]}>
                      {b.title}
                    </Text>
                    <Text style={[styles.boosterDesc, isSelected && styles.boosterDescSelected]}>
                      {b.desc}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              selectedBoosters.length === 0 && { opacity: 0.5 }
            ]}
            disabled={selectedBoosters.length === 0}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
              saveProgressOnBackend({ flow_continued: true });
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start Current Journey 🌊</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: CURRENT JOURNEY (10-Minute River Current) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — RIVER CURRENT JOURNEY</Text>
          <Text style={styles.screenHeader}>Flowing River Progress</Text>
          <Text style={styles.screenSubHeader}>
            Remain present for 10 minutes as your conversation energy travels downstream.
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

          {/* River Current & Ambient Animation Box */}
          <View style={styles.riverCurrentVisualizer}>
            {/* Flying Birds */}
            <Animated.View style={[styles.flyingBirdRow, { transform: [{ translateX: birdFlyAnim }] }]}>
              <Text style={styles.birdIcon}>🐦</Text>
              <Text style={styles.birdIcon2}>🐦</Text>
            </Animated.View>

            {/* River Water Currents */}
            <Animated.View style={[styles.waveStream1, { transform: [{ translateX: breezeX }] }]} />
            <Animated.View style={[styles.waveStream2, { transform: [{ translateY: waveTranslateY }] }]} />

            <View style={styles.currentCenterInfo}>
              <Text style={styles.currentPercentText}>{journeyProgressPct}%</Text>
              <Text style={styles.currentSubLabel}>TRAVELING DOWNSTREAM</Text>
            </View>

            {/* Progress Bar Line */}
            <View style={styles.journeyTrack}>
              <View style={[styles.journeyFill, { width: `${journeyProgressPct}%` }]} />
            </View>
          </View>

          {/* Motivational Rotating Quote Box */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{MOTIVATIONAL_CARDS[activeQuoteIndex]}</Text>
            <Text style={styles.timeRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_JOURNEY_SECONDS - journeySeconds) / 60))}m {Math.max(0, (TOTAL_JOURNEY_SECONDS - journeySeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: SUNRISE LAKE HORIZON & CELEBRATION */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"You kept the conversation moving."</Text>

          {/* Sunrise Lake & Still Water Reflection Illustration */}
          <Animated.View style={[styles.sunriseLakeBox, { opacity: sunriseGlowAnim }]}>
            <LinearGradient
              colors={['#F59E0B', '#38BDF8', '#1E293B']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.sunCircle} />
            <View style={styles.lakeReflectionLine} />
            <Text style={styles.lakeStillText}>✨ Still Water Lake & Horizon</Text>
          </Animated.View>

          {/* Achievement Unlock Box */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Conversation Flow</Text>
            <Text style={styles.achievementDesc}>
              "You didn't just start a conversation—you kept it alive."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMessageText}>"You moved forward."</Text>
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
                  taskName: 'Initiate Short Conversation',
                  message: 'You moved forward.',
                  difficulty: 'hard',
                  badge: 'Conversation Flow'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#2563EB', '#10B981']}
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
          <Text style={styles.screenHeader}>Conversation Flow Overview</Text>

          {/* River Illustration */}
          <View style={styles.dashboardRiverHeader}>
            <Text style={styles.dashboardRiverIcon}>🌊💬</Text>
            <Text style={styles.dashboardTitle}>Initiate Short Conversation</Text>
          </View>

          {/* Completed River Journey Visualization */}
          <View style={styles.dashboardJourneyBox}>
            <Text style={styles.dashboardSectionLabel}>Completed Journey Bends</Text>
            {FLOW_STAGES.map((s) => (
              <View key={s.id} style={styles.dashboardStageRow}>
                <Text style={styles.dashboardStageIcon}>{s.icon}</Text>
                <Text style={styles.dashboardStageTitle}>
                  Stage {s.id}: {s.title} — Completed ✔
                </Text>
              </View>
            ))}
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Conversation Flow Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "Every meaningful conversation is simply two people choosing to keep the flow alive."
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
  riverLayer: {
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

  /* Screen 1 */
  waterSourceContainer: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fallingDrop: {
    position: 'absolute',
    top: 20,
  },
  dropEmoji: {
    fontSize: 48,
  },
  riverPool: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poolWave: {
    width: '100%',
    height: 10,
    backgroundColor: '#38BDF8',
    position: 'absolute',
    top: 0,
    opacity: 0.6,
  },
  poolWaterText: {
    fontSize: 13,
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

  /* Screen 2 Flow Path */
  riverPathContainer: {
    width: '100%',
    marginVertical: 20,
    position: 'relative',
  },
  riverPathLine: {
    position: 'absolute',
    top: 20,
    bottom: 20,
    left: 28,
    width: 3,
    backgroundColor: '#38BDF8',
    opacity: 0.4,
  },
  riverBendCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  riverBendCardActive: {
    borderColor: '#38BDF8',
  },
  bendCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bendIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  bendTextWrapper: {
    flex: 1,
  },
  bendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  bendTitleActive: {
    color: '#F8FAFC',
  },
  bendDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Screen 3 Boosters */
  boostersGrid: {
    width: '100%',
    marginVertical: 16,
  },
  boosterCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  boosterCardSelected: {
    borderColor: '#10B981',
  },
  boosterInner: {
    padding: 16,
  },
  boosterIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  boosterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  boosterTitleSelected: {
    color: '#F8FAFC',
  },
  boosterDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  boosterDescSelected: {
    color: '#E2E8F0',
  },

  /* Screen 4 River Current */
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
  riverCurrentVisualizer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#0B132B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginVertical: 14,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyingBirdRow: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
  },
  birdIcon: { fontSize: 16, marginRight: 20 },
  birdIcon2: { fontSize: 14 },
  waveStream1: {
    position: 'absolute',
    width: '120%',
    height: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    top: '40%',
    borderRadius: 4,
  },
  waveStream2: {
    position: 'absolute',
    width: '120%',
    height: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.5)',
    top: '55%',
    borderRadius: 6,
  },
  currentCenterInfo: {
    alignItems: 'center',
    zIndex: 10,
  },
  currentPercentText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  currentSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.5,
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
    backgroundColor: '#10B981',
  },
  quoteCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#2563EB',
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
    color: '#10B981',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sunriseLakeBox: {
    height: 200,
    width: '100%',
    borderRadius: 24,
    marginVertical: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sunCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDE047',
    marginBottom: 10,
  },
  lakeReflectionLine: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(253, 224, 71, 0.6)',
    borderRadius: 2,
  },
  lakeStillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  achievementBox: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    marginVertical: 14,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
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
  completionMessageText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardRiverHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardRiverIcon: {
    fontSize: 56,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardJourneyBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginVertical: 10,
  },
  dashboardSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
  dashboardStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dashboardStageIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dashboardStageTitle: {
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
    borderColor: '#10B981',
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
