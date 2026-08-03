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
const TOTAL_JOURNEY_SECONDS = 900; // 15 minutes

const DESTINATIONS = [
  { id: 'airport', title: 'Airport', icon: '✈️', desc: 'Departure lounges & gate seating areas.' },
  { id: 'metro', title: 'Metro', icon: '🚇', desc: 'Transit stations & commuter platforms.' },
  { id: 'gym', title: 'Gym', icon: '🏋️', desc: 'Workout floor & fitness lounge areas.' },
  { id: 'library', title: 'Library', icon: '📚', desc: 'Reading rooms & quiet study tables.' },
  { id: 'coffeeshop', title: 'Coffee Shop', icon: '☕', desc: 'New local cafés & espresso bars.' },
  { id: 'event', title: 'Public Event', icon: '🎤', desc: 'Workshops, talks & community gatherings.' },
  { id: 'coworking', title: 'Co-working Space', icon: '🏢', desc: 'Shared desks & common kitchen lounges.' },
  { id: 'mall', title: 'Shopping Mall', icon: '🛍️', desc: 'Plazas & retail walkway benches.' },
];

const PREPARATION_CHECKLIST = [
  { id: 'smile', title: 'Smile Warmly', icon: '😊', stamp: 'VISA: WARMTH' },
  { id: 'hello', title: 'Say Hello', icon: '👋', stamp: 'VISA: OPENING' },
  { id: 'question', title: 'Ask Something Simple', icon: '❓', stamp: 'VISA: CURIOSITY' },
  { id: 'introduce', title: 'Introduce Yourself', icon: '💬', stamp: 'VISA: PRESENCE' },
  { id: 'curious', title: 'Stay Curious', icon: '🤝', stamp: 'VISA: EXPLORATION' },
];

const TRAVEL_QUOTES = [
  '🌍 "Every unfamiliar place becomes familiar."',
  '✈️ "Confidence travels with you."',
  '🛂 "Every step expands your world."',
  '💬 "New places create new conversations."',
  '🌟 "Every unfamiliar place is an opportunity waiting for your first hello."',
];

export default function UnfamiliarSettingTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen flow:
  // 1: Leave Your Comfort Zone (Airport Terminal & Passport Open)
  // 2: Destination Picker (Visa Stamp Animations)
  // 3: Mission Preparation (Checklist Travel Visas)
  // 4: Journey Progress (15-minute Passport Page Progress)
  // 5: Boarding Pass & Celebration (Destination CONFIDENCE + Explorer Badge)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Passport interaction state
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [completedChecklist, setCompletedChecklist] = useState<string[]>([]);

  // 15-Minute Passport Timer & Progress
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Animations
  const passportOpenAnim = useRef(new Animated.Value(0)).current;
  const stampAnim = useRef(new Animated.Value(0)).current;
  const boardingPassSlideAnim = useRef(new Animated.Value(height)).current;
  const pageTurnAnim = useRef(new Animated.Value(0)).current;

  // Background Passport & Page Turning Loops
  useEffect(() => {
    // Passport opening
    Animated.timing(passportOpenAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Page turning loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pageTurnAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pageTurnAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
          body: JSON.stringify({ task_name: 'Initiate Conversation in Unfamiliar Setting' })
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
        await fetch(`${API_BASE_URL}/api/tasks/passport/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Initiate Conversation in Unfamiliar Setting', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Begin Journey
  const handleBeginJourney = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScreen(2);
  };

  // Screen 2: Select Destination Tile & Stamp Visa
  const handleSelectDestination = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSetting(id);

    // Visa stamp slam animation
    stampAnim.setValue(2);
    Animated.spring(stampAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();

    const destObj = DESTINATIONS.find((d) => d.id === id);
    if (destObj) {
      saveProgressOnBackend({ setting: destObj.title });
    }
  };

  // Screen 3: Toggle Preparation Checklist
  const toggleChecklist = (id: string) => {
    Haptics.selectionAsync();
    setCompletedChecklist((prev) => {
      const updated = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      saveProgressOnBackend({ preparation: updated });
      return updated;
    });
  };

  // Screen 4: 15-Minute Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const step = isFastForward ? 45 : 1;
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

  // Rotate travel quotes every 8s
  useEffect(() => {
    if (screen === 4) {
      const qInterval = setInterval(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % TRAVEL_QUOTES.length);
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
          body: JSON.stringify({ task_name: 'Initiate Conversation in Unfamiliar Setting' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, conversation_initiated: true });
      setScreen(5);

      // Boarding Pass Slide Up Animation
      Animated.timing(boardingPassSlideAnim, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }
  };

  // Interpolated Transforms
  const passportCoverScale = passportOpenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const pageTurnY = pageTurnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const progressPct = Math.min(100, Math.floor((timerSeconds / TOTAL_JOURNEY_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Deep Navy & Travel Sky Gradient Background Layer */}
      <Animated.View style={styles.passportLayer}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#38BDF8', '#0F172A']}
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
          <Text style={styles.headerTitle}>Unfamiliar Setting</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🛂🌍 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'passport' : 'view-dashboard-outline'}
            size={22}
            color="#38BDF8"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: LEAVE YOUR COMFORT ZONE (Airport Terminal & Passport Open) */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>PASSPORT CHALLENGE — STAGE 1</Text>
          <Text style={styles.screenHeader}>"Leave Your Comfort Zone."</Text>
          <Text style={styles.screenSubHeader}>Every new place has a new story.</Text>

          {/* Luxury Passport & Terminal Illustration */}
          <Animated.View style={[styles.passportCoverContainer, { transform: [{ scale: passportCoverScale }] }]}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              style={styles.passportCoverInner}
            >
              <Text style={styles.passportEmblemIcon}>🛂</Text>
              <Text style={styles.passportTitleText}>PASSPORT</Text>
              <Text style={styles.passportSubText}>CONFIDENCE EXPANSION</Text>
              <View style={styles.passportGoldBorder} />
            </LinearGradient>
          </Animated.View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleBeginJourney}
          >
            <LinearGradient
              colors={['#38BDF8', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🛂 Begin Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: DESTINATION PICKER (Passport Visa Stamps) */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 2 — DESTINATION PICKER</Text>
          <Text style={styles.screenHeader}>Choose Your Unfamiliar Environment</Text>
          <Text style={styles.screenSubHeader}>
            Select a location where you normally wouldn't start a conversation.
          </Text>

          {/* Destination Tiles Grid */}
          <View style={styles.destinationsGrid}>
            {DESTINATIONS.map((d) => {
              const isSelected = selectedSetting === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.destTile, isSelected && styles.destTileSelected]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectDestination(d.id)}
                >
                  <LinearGradient
                    colors={isSelected ? ['#10B981', '#38BDF8'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.destTileInner}
                  >
                    <Text style={styles.destIcon}>{d.icon}</Text>
                    <Text style={[styles.destTitle, isSelected && styles.destTitleSelected]}>
                      {d.title}
                    </Text>
                    <Text style={styles.destDesc}>{d.desc}</Text>

                    {isSelected && (
                      <Animated.View style={[styles.visaStampBadge, { transform: [{ scale: stampAnim }] }]}>
                        <Text style={styles.visaStampText}>ENTRY STAMPED 🛂</Text>
                      </Animated.View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedSetting && { opacity: 0.5 }]}
            disabled={!selectedSetting}
            activeOpacity={0.85}
            onPress={() => setScreen(3)}
          >
            <LinearGradient
              colors={['#38BDF8', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Proceed to Preparation ✈️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 3: MISSION PREPARATION (Checklist Visas) */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — MISSION PREPARATION</Text>
          <Text style={styles.screenHeader}>Collect Your Travel Visas</Text>
          <Text style={styles.screenSubHeader}>
            Complete your preparation checklist before stepping forward.
          </Text>

          {/* Travel Checklist Items */}
          <View style={styles.checklistGrid}>
            {PREPARATION_CHECKLIST.map((item) => {
              const isDone = completedChecklist.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checkCard, isDone && styles.checkCardDone]}
                  activeOpacity={0.8}
                  onPress={() => toggleChecklist(item.id)}
                >
                  <LinearGradient
                    colors={isDone ? ['#38BDF8', '#10B981'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.checkInner}
                  >
                    <Text style={styles.checkIcon}>{item.icon}</Text>
                    <View style={styles.checkTextWrapper}>
                      <Text style={[styles.checkTitle, isDone && styles.checkTitleDone]}>
                        {item.title}
                      </Text>
                      <Text style={styles.stampBadgeText}>{item.stamp}</Text>
                    </View>
                    {isDone && <Feather name="check-circle" size={22} color="#F8FAFC" />}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, completedChecklist.length === 0 && { opacity: 0.5 }]}
            disabled={completedChecklist.length === 0}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
            }}
          >
            <LinearGradient
              colors={['#10B981', '#38BDF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start Journey Progress 🛂</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: JOURNEY PROGRESS (15-Minute Passport Page Filling) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — JOURNEY PROGRESS</Text>
          <Text style={styles.screenHeader}>Passport Page Completion</Text>
          <Text style={styles.screenSubHeader}>
            Remain present in your new environment for 15 minutes as visa stamps fill your passport.
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

          {/* Passport Pages Turning Visualizer */}
          <View style={styles.passportPagesVisualizer}>
            <Animated.View style={[styles.passportPageSheet, { transform: [{ translateY: pageTurnY }] }]}>
              <View style={styles.pageHeaderRow}>
                <Text style={styles.pageHeaderText}>PASSPORT PAGE {Math.min(10, Math.floor(progressPct / 10))}</Text>
                <Text style={styles.pageStatusBadge}>IMMIGRATION CLEARED</Text>
              </View>

              <View style={styles.stampsFlexBox}>
                <View style={styles.pageStampItem}><Text style={styles.pageStampText}>STAMP: ENTRY 🛂</Text></View>
                {progressPct >= 25 && <View style={styles.pageStampItem}><Text style={styles.pageStampText}>STAMP: INITIATED 💬</Text></View>}
                {progressPct >= 50 && <View style={styles.pageStampItem}><Text style={styles.pageStampText}>STAMP: EXPANSION 🌍</Text></View>}
                {progressPct >= 75 && <View style={styles.pageStampItem}><Text style={styles.pageStampText}>STAMP: CONFIDENCE ✈️</Text></View>}
              </View>
            </Animated.View>

            <View style={styles.passportPercentBox}>
              <Text style={styles.passportPercentText}>{progressPct}%</Text>
              <Text style={styles.passportStatusLabel}>TRAVELING IN NEW GROUND</Text>
            </View>

            <View style={styles.journeyTrack}>
              <View style={[styles.journeyFill, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Motivational Rotating Travel Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{TRAVEL_QUOTES[activeQuoteIndex]}</Text>
            <Text style={styles.timeRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_JOURNEY_SECONDS - timerSeconds) / 60))}m {Math.max(0, (TOTAL_JOURNEY_SECONDS - timerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: BOARDING PASS & FINAL CELEBRATION */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"You crossed your comfort zone."</Text>

          {/* Boarding Pass for Destination CONFIDENCE */}
          <Animated.View style={[styles.boardingPassCard, { transform: [{ translateY: boardingPassSlideAnim }] }]}>
            <LinearGradient
              colors={['#10B981', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.boardingPassInner}
            >
              <View style={styles.boardingTopRow}>
                <Text style={styles.airlineText}>ANTISOCIAL AIRWAYS ✈️</Text>
                <Text style={styles.classText}>FIRST CLASS</Text>
              </View>

              <View style={styles.destinationBox}>
                <Text style={styles.destLabel}>DESTINATION:</Text>
                <Text style={styles.destBigText}>CONFIDENCE 🌍</Text>
              </View>

              <View style={styles.passDetailsRow}>
                <View><Text style={styles.passLabel}>GATE</Text><Text style={styles.passValue}>A-01</Text></View>
                <View><Text style={styles.passLabel}>SEAT</Text><Text style={styles.passValue}>01A</Text></View>
                <View><Text style={styles.passLabel}>STATUS</Text><Text style={styles.passValue}>ARRIVED</Text></View>
              </View>

              <View style={styles.barcodeLine} />
            </LinearGradient>
          </Animated.View>

          {/* Achievement Box */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Explorer</Text>
            <Text style={styles.achievementDesc}>
              "You stepped into a place that once felt unfamiliar."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMsgText}>"You entered new ground."</Text>
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
                  taskName: 'Initiate Conversation in Unfamiliar Setting',
                  message: 'You entered new ground.',
                  difficulty: 'hard',
                  badge: 'Explorer'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#38BDF8', '#10B981']}
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
          <Text style={styles.screenHeader}>Passport Overview</Text>

          {/* Top Passport Illustration */}
          <View style={styles.dashboardTopBox}>
            <Text style={styles.dashboardPassportIcon}>🛂🌍</Text>
            <Text style={styles.dashboardTitle}>Unfamiliar Setting Challenge</Text>
          </View>

          {/* Destination Stamps Center */}
          <View style={styles.dashboardStampsBox}>
            <Text style={styles.dashboardSectionTitle}>Completed Visa Stamps</Text>
            <View style={styles.dashboardRow}>
              <Text style={styles.rowIcon}>🛂</Text>
              <Text style={styles.dashboardRowText}>Unfamiliar Setting Entry Visa Stamped ✔</Text>
            </View>
            <View style={styles.dashboardRow}>
              <Text style={styles.rowIcon}>✈️</Text>
              <Text style={styles.dashboardRowText}>15-Minute Comfort Zone Journey Complete ✔</Text>
            </View>
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Explorer Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "Every unfamiliar place is an opportunity waiting for your first hello."
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
  passportLayer: {
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
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerTag: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTagText: {
    fontSize: 11,
    color: '#10B981',
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
  passportCoverContainer: {
    height: 270,
    width: '100%',
    borderRadius: 24,
    marginVertical: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  passportCoverInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  passportEmblemIcon: { fontSize: 64, marginBottom: 10 },
  passportTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 4,
  },
  passportSubText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  passportGoldBorder: {
    position: 'absolute',
    top: 15,
    bottom: 15,
    left: 15,
    right: 15,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 16,
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

  /* Screen 2 Destinations Grid */
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  destTile: {
    width: '48%',
    borderRadius: 18,
    marginVertical: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    overflow: 'hidden',
  },
  destTileSelected: {
    borderColor: '#10B981',
  },
  destTileInner: {
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  destIcon: { fontSize: 28, marginBottom: 4 },
  destTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  destTitleSelected: { color: '#F8FAFC' },
  destDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  visaStampBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  visaStampText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
  },

  /* Screen 3 Checklist */
  checklistGrid: {
    width: '100%',
    marginVertical: 16,
  },
  checkCard: {
    width: '100%',
    borderRadius: 18,
    marginVertical: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  checkCardDone: {
    borderColor: '#10B981',
  },
  checkInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  checkIcon: { fontSize: 26, marginRight: 12 },
  checkTextWrapper: { flex: 1 },
  checkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  checkTitleDone: { color: '#F8FAFC' },
  stampBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 2,
  },

  /* Screen 4 Progress */
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
  passportPagesVisualizer: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
  },
  passportPageSheet: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 12,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pageHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  pageStatusBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
  },
  stampsFlexBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pageStampItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginRight: 6,
    marginBottom: 6,
  },
  pageStampText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
  },
  passportPercentBox: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  passportPercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  passportStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
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
    backgroundColor: '#10B981',
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
    color: '#10B981',
    letterSpacing: 2,
    marginBottom: 8,
  },
  boardingPassCard: {
    width: '100%',
    borderRadius: 22,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  boardingPassInner: {
    padding: 20,
  },
  boardingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  airlineText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  classText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  destinationBox: {
    marginVertical: 10,
  },
  destLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  destBigText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginTop: 2,
  },
  passDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  passLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  passValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  barcodeLine: {
    height: 4,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    marginTop: 16,
    opacity: 0.6,
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  completionMsgText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardTopBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardPassportIcon: { fontSize: 56 },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardStampsBox: {
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
    color: '#10B981',
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
