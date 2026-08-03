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
const TOTAL_EXPANSION_SECONDS = 1800; // 30 minutes

const MISSION_CAPSULES = [
  { id: 'introduce', title: 'Introduce Yourself', icon: '💬', desc: 'Share a simple friendly greeting and your name.' },
  { id: 'name', title: 'Ask Their Name', icon: '😊', desc: 'Ask for their name and remember it warmly.' },
  { id: 'day', title: 'Ask About Their Day', icon: '🌍', desc: 'Inquire how their morning or afternoon is going.' },
  { id: 'environment', title: 'Shared Environment', icon: '🎯', desc: 'Comment on something happening nearby in your environment.' },
  { id: 'question', title: 'Friendly Question', icon: '☕', desc: 'Ask a light, casual question (e.g. recommendation or direction).' },
];

const ORBIT_QUOTES = [
  '🌍 "Every stranger is simply someone you haven\'t met yet."',
  '🪐 "Confidence grows beyond familiar circles."',
  '✨ "Connection begins with curiosity."',
  '💬 "Every new conversation expands your world."',
  '🌌 "Stepping into the unknown creates new possibilities."',
];

export default function TalkTo2NewPeopleTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen state:
  // 1: Expand Your Orbit (Intro)
  // 2: New Connection Scanner (Select Star 1 & Star 2)
  // 3: Orbit Missions (Select capsule for person 1 & 2)
  // 4: Orbit Expansion (30-minute Galaxy Current)
  // 5: New Galaxy Celebration (Zoom out + Orbit Expander badge)
  // 6: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // Connection scanner states
  const [connection1Selected, setConnection1Selected] = useState(false);
  const [connection2Selected, setConnection2Selected] = useState(false);
  const [mission1, setMission1] = useState<string | null>(null);
  const [mission2, setMission2] = useState<string | null>(null);

  // 30-Minute Timer & Orbit expansion
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(300);

  // Animations
  const planetRotateAnim = useRef(new Animated.Value(0)).current;
  const orbitPulseAnim = useRef(new Animated.Value(1)).current;
  const star1MoveAnim = useRef(new Animated.Value(0)).current;
  const star2MoveAnim = useRef(new Animated.Value(0)).current;
  const galaxyZoomAnim = useRef(new Animated.Value(1)).current;
  const starlightGlowAnim = useRef(new Animated.Value(0.4)).current;
  const particleFloatAnim = useRef(new Animated.Value(0)).current;

  // Background Planet Rotation & Galaxy Pulse Loops
  useEffect(() => {
    // Planet rotation
    Animated.loop(
      Animated.timing(planetRotateAnim, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Orbit Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbitPulseAnim, { toValue: 1.18, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbitPulseAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Floating Starlight Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(starlightGlowAnim, { toValue: 0.95, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starlightGlowAnim, { toValue: 0.4, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Floating galaxy particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloatAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(particleFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
          body: JSON.stringify({ task_name: 'Talk to 2 New People' })
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
        await fetch(`${API_BASE_URL}/api/tasks/social-orbit/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Talk to 2 New People', ...data })
        });
      }
    } catch (e) {
      console.log('Save progress error:', e);
    }
  };

  // Screen 1: Launch Mission
  const handleLaunchMission = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScreen(2);
  };

  // Screen 2: Tap Star 1 & Star 2
  const handleTapStar1 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnection1Selected(true);
    Animated.timing(star1MoveAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();

    saveProgressOnBackend({ connection_1_selected: true });
  };

  const handleTapStar2 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnection2Selected(true);
    Animated.timing(star2MoveAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();

    saveProgressOnBackend({ connection_2_selected: true });
  };

  // Screen 4: 30-Minute Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (screen === 4 && isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const step = isFastForward ? 90 : 1;
          const next = prev + step;
          if (next >= TOTAL_EXPANSION_SECONDS) {
            if (interval) clearInterval(interval);
            setIsTimerActive(false);
            handleCompleteTask();
            return TOTAL_EXPANSION_SECONDS;
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
        setActiveQuoteIndex((prev) => (prev + 1) % ORBIT_QUOTES.length);
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
          body: JSON.stringify({ task_name: 'Talk to 2 New People' })
        });
        const resData = await response.json();
        if (resData.success && resData.pointsAdded) {
          setEarnedPoints(resData.pointsAdded);
        }
      }
    } catch (e) {
      console.log('Complete task error:', e);
    } finally {
      saveProgressOnBackend({ completed: true, orbit_expanded: true });
      setScreen(5);

      // Galaxy Zoom Out Animation
      Animated.timing(galaxyZoomAnim, {
        toValue: 0.82,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  };

  // Interpolated Transforms
  const planetSpinDegree = planetRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const star1TranslateX = star1MoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 45],
  });

  const star2TranslateX = star2MoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, -45],
  });

  const particleY = particleFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const orbitLevelCount = Math.min(10, Math.floor((timerSeconds / TOTAL_EXPANSION_SECONDS) * 10));
  const progressPct = Math.min(100, Math.floor((timerSeconds / TOTAL_EXPANSION_SECONDS) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Deep Indigo & Galaxy Glow Gradient Layer */}
      <Animated.View style={styles.galaxyLayer}>
        <LinearGradient
          colors={['#0B0D1B', '#4338CA', '#8B5CF6', '#090A14']}
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
          <Text style={styles.headerTitle}>Talk to 2 New People</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🪐 300 Points • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 6 ? 4 : 6)}
        >
          <MaterialCommunityIcons
            name={screen === 6 ? 'orbit' : 'view-dashboard-outline'}
            size={22}
            color="#22D3EE"
          />
        </TouchableOpacity>
      </View>

      {/* SCREEN 1: EXPAND YOUR ORBIT */}
      {screen === 1 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>STAGE 1 — SOCIAL ORBIT</Text>
          <Text style={styles.screenHeader}>"Your world grows every time you meet someone new."</Text>
          <Text style={styles.screenSubHeader}>Today, expand your orbit.</Text>

          {/* Minimal Galaxy with Rotating Planet in Center */}
          <View style={styles.planetContainer}>
            <Animated.View style={[styles.orbitRingOuter, { transform: [{ scale: orbitPulseAnim }] }]} />
            <View style={styles.orbitRingMid} />

            {/* Rotating Central Planet */}
            <Animated.View style={[styles.centralPlanet, { transform: [{ rotate: planetSpinDegree }] }]}>
              <LinearGradient
                colors={['#22D3EE', '#4338CA', '#8B5CF6']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.planetCrater1} />
              <View style={styles.planetCrater2} />
            </Animated.View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleLaunchMission}
          >
            <LinearGradient
              colors={['#4338CA', '#22D3EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>🪐 Launch Mission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* SCREEN 2: NEW CONNECTION SCANNER (Tap Star 1 & Star 2) */}
      {screen === 2 && (
        <View style={styles.screenContent}>
          <Text style={styles.screenTag}>STAGE 2 — NEW CONNECTION SCANNER</Text>
          <Text style={styles.screenHeader}>Connect With 2 New Stars</Text>
          <Text style={styles.screenSubHeader}>
            Tap each floating star to pull a new connection into your social orbit.
          </Text>

          {/* Orbit Scanner View */}
          <View style={styles.scannerContainer}>
            <Animated.View style={[styles.orbitRingOuter, { transform: [{ scale: orbitPulseAnim }] }]} />
            
            {/* Center Planet */}
            <View style={styles.scannerCenterPlanet}>
              <Text style={styles.planetIconText}>🪐</Text>
            </View>

            {/* Star 1 (Left Connection) */}
            <Animated.View style={[styles.starWrapperLeft, { transform: [{ translateX: star1TranslateX }] }]}>
              <TouchableOpacity
                style={[styles.starBtn, connection1Selected && styles.starBtnSelected]}
                onPress={handleTapStar1}
                activeOpacity={0.8}
              >
                <Text style={styles.starIcon}>✨</Text>
              </TouchableOpacity>
              <Text style={styles.starLabel}>
                {connection1Selected ? 'Connection 1 Connected! 🌍' : 'Person 1'}
              </Text>
            </Animated.View>

            {/* Star 2 (Right Connection) */}
            <Animated.View style={[styles.starWrapperRight, { transform: [{ translateX: star2TranslateX }] }]}>
              <TouchableOpacity
                style={[styles.starBtn, connection2Selected && styles.starBtnSelected]}
                onPress={handleTapStar2}
                activeOpacity={0.8}
              >
                <Text style={styles.starIcon}>✨</Text>
              </TouchableOpacity>
              <Text style={styles.starLabel}>
                {connection2Selected ? 'Connection 2 Connected! 🌍' : 'Person 2'}
              </Text>
            </Animated.View>
          </View>

          {/* Info Card */}
          <View style={styles.scannerCard}>
            <Text style={styles.scannerCardText}>
              {connection1Selected && connection2Selected
                ? 'Both new connections are pulled into your orbit! Proceed to choose your missions.'
                : connection1Selected
                ? 'First connection locked! Tap Person 2 to lock your second connection.'
                : 'Tap Person 1 & Person 2 to represent two strangers you will connect with today.'}
            </Text>

            {connection1Selected && connection2Selected && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setScreen(3)}
              >
                <Text style={styles.secondaryBtnText}>Proceed to Orbit Missions 🚀</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* SCREEN 3: ORBIT MISSIONS (Rotating Mission Capsules) */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 3 — ORBIT MISSIONS</Text>
          <Text style={styles.screenHeader}>Select Mission Capsules</Text>
          <Text style={styles.screenSubHeader}>
            Choose a mission approach for Person 1 and Person 2.
          </Text>

          {/* Mission Capsule Selection Grid */}
          <View style={styles.missionsGrid}>
            <Text style={styles.missionSectionTitle}>MISSION FOR PERSON 1:</Text>
            {MISSION_CAPSULES.map((m) => {
              const isSelected = mission1 === m.id;
              return (
                <TouchableOpacity
                  key={`m1-${m.id}`}
                  style={[styles.missionCapsule, isSelected && styles.missionCapsuleSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMission1(m.id);
                    saveProgressOnBackend({ mission_1: m.title });
                  }}
                >
                  <LinearGradient
                    colors={isSelected ? ['#4338CA', '#22D3EE'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.missionCapsuleInner}
                  >
                    <Text style={styles.missionIcon}>{m.icon}</Text>
                    <Text style={styles.missionTitle}>{m.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.missionSectionTitle, { marginTop: 16 }]}>MISSION FOR PERSON 2:</Text>
            {MISSION_CAPSULES.map((m) => {
              const isSelected = mission2 === m.id;
              return (
                <TouchableOpacity
                  key={`m2-${m.id}`}
                  style={[styles.missionCapsule, isSelected && styles.missionCapsuleSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMission2(m.id);
                    saveProgressOnBackend({ mission_2: m.title });
                  }}
                >
                  <LinearGradient
                    colors={isSelected ? ['#8B5CF6', '#22D3EE'] : ['rgba(30, 41, 59, 0.7)', 'rgba(15, 23, 42, 0.7)']}
                    style={styles.missionCapsuleInner}
                  >
                    <Text style={styles.missionIcon}>{m.icon}</Text>
                    <Text style={styles.missionTitle}>{m.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!mission1 || !mission2) && { opacity: 0.5 }]}
            disabled={!mission1 || !mission2}
            activeOpacity={0.85}
            onPress={() => {
              setScreen(4);
              setIsTimerActive(true);
            }}
          >
            <LinearGradient
              colors={['#4338CA', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Start Orbit Expansion 🪐</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* SCREEN 4: ORBIT EXPANSION (30-Minute Orbit Progression) */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.screenTag}>STAGE 4 — ORBIT EXPANSION</Text>
          <Text style={styles.screenHeader}>Expanding Social Orbit</Text>
          <Text style={styles.screenSubHeader}>
            Remain active for 30 minutes as your social universe grows around your planet.
          </Text>

          {/* Test Fast-Forward Toggle */}
          <View style={styles.testModeBox}>
            <Text style={styles.testModeLabel}>⚡ Fast-Forward Timer (Test Mode):</Text>
            <Switch
              value={isFastForward}
              onValueChange={setIsFastForward}
              trackColor={{ false: '#334155', true: '#22D3EE' }}
              thumbColor={isFastForward ? '#F8FAFC' : '#94A3B8'}
            />
          </View>

          {/* Orbit Expansion Visualizer */}
          <View style={styles.orbitExpansionContainer}>
            <Animated.View style={[styles.floatingParticles, { transform: [{ translateY: particleY }] }]}>
              <Text style={styles.particleStar}>✨</Text>
              <Text style={styles.particleStar2}>🪐</Text>
              <Text style={styles.particleStar}>✨</Text>
            </Animated.View>

            {/* Orbit Level Rings (1 to 10) */}
            <View style={styles.orbitLevelStack}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.stackRing,
                    {
                      width: 90 + idx * 30,
                      height: 90 + idx * 30,
                      borderRadius: (90 + idx * 30) / 2,
                      borderColor: idx < orbitLevelCount / 2 ? '#22D3EE' : 'rgba(139, 92, 246, 0.25)',
                    }
                  ]}
                />
              ))}

              <View style={styles.stackCenterPlanet}>
                <Text style={styles.stackPlanetIcon}>🪐</Text>
              </View>
            </View>

            <View style={styles.orbitPercentBox}>
              <Text style={styles.orbitPercentText}>{progressPct}%</Text>
              <Text style={styles.orbitStatusLabel}>ORBIT EXPANSION ACTIVE</Text>
            </View>
          </View>

          {/* Rotating Motivational Quote Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteCardText}>{ORBIT_QUOTES[activeQuoteIndex]}</Text>
            <Text style={styles.timerRemainingText}>
              Time Remaining: {Math.max(0, Math.floor((TOTAL_EXPANSION_SECONDS - timerSeconds) / 60))}m {Math.max(0, (TOTAL_EXPANSION_SECONDS - timerSeconds) % 60)}s
            </Text>
          </View>
        </ScrollView>
      )}

      {/* SCREEN 5: NEW GALAXY & FINAL CELEBRATION */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollScreenContent}>
          <Text style={styles.celebrationTag}>MISSION COMPLETE</Text>
          <Text style={styles.screenHeader}>"Your social world became bigger today."</Text>

          {/* New Galaxy Zoom-out View */}
          <Animated.View style={[styles.galaxyCelebrationBox, { transform: [{ scale: galaxyZoomAnim }] }]}>
            <LinearGradient
              colors={['#8B5CF6', '#4338CA', '#0B0D1B']}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.celebrationPlanet}>
              <Text style={styles.celebrationPlanetIcon}>🪐</Text>
            </View>

            <View style={styles.orbitingStar1}>
              <Text style={styles.orbitingStarIcon}>✨</Text>
            </View>
            <View style={styles.orbitingStar2}>
              <Text style={styles.orbitingStarIcon}>✨</Text>
            </View>

            <Text style={styles.galaxyConstellationLabel}>🌌 Expanded Social Orbit</Text>
          </Animated.View>

          {/* Achievement Box */}
          <View style={styles.achievementBox}>
            <View style={styles.medalCircle}>
              <Text style={styles.medalIcon}>🏅</Text>
            </View>
            <Text style={styles.achievementTitle}>Orbit Expander</Text>
            <Text style={styles.achievementDesc}>
              "You stepped beyond the familiar and welcomed new connections."
            </Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillText}>+{earnedPoints} Task Points</Text>
            </View>
            <Text style={styles.completionMsgText}>"You expanded your circle."</Text>
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
                  taskName: 'Talk to 2 New People',
                  message: 'You expanded your circle.',
                  difficulty: 'hard',
                  badge: 'Orbit Expander'
                }
              } as any);
            }}
          >
            <LinearGradient
              colors={['#4338CA', '#22D3EE']}
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
          <Text style={styles.screenHeader}>Social Orbit Overview</Text>

          {/* Top Planet */}
          <View style={styles.dashboardTopPlanetBox}>
            <Text style={styles.dashboardPlanetIcon}>🪐</Text>
            <Text style={styles.dashboardTitle}>Talk to 2 New People</Text>
          </View>

          {/* Orbit Journey Center */}
          <View style={styles.dashboardOrbitBox}>
            <Text style={styles.dashboardSectionTitle}>Orbit Progress</Text>
            <View style={styles.dashboardStarRow}>
              <Text style={styles.starIcon}>✨</Text>
              <Text style={styles.dashboardStarText}>Connection 1 — Added to Orbit ✔</Text>
            </View>
            <View style={styles.dashboardStarRow}>
              <Text style={styles.starIcon}>✨</Text>
              <Text style={styles.dashboardStarText}>Connection 2 — Added to Orbit ✔</Text>
            </View>
          </View>

          {/* Badge & Quote */}
          <View style={styles.dashboardBadgeBox}>
            <Text style={styles.medalIcon}>🏅</Text>
            <Text style={styles.dashboardBadgeText}>Orbit Expander Badge Unlocked</Text>
          </View>

          <View style={styles.dashboardQuoteBox}>
            <Text style={styles.dashboardQuoteText}>
              "Every new person you meet expands the universe you live in."
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
    backgroundColor: '#090A14',
  },
  galaxyLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 211, 238, 0.15)',
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
    backgroundColor: 'rgba(67, 56, 202, 0.3)',
  },
  headerTagText: {
    fontSize: 11,
    color: '#22D3EE',
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
    color: '#22D3EE',
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
  planetContainer: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  orbitRingMid: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  centralPlanet: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  planetCrater1: {
    position: 'absolute',
    top: 20,
    left: 25,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  planetCrater2: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    borderColor: '#22D3EE',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    marginTop: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22D3EE',
  },

  /* Screen 2 Scanner */
  scannerContainer: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerCenterPlanet: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetIconText: { fontSize: 32 },
  starWrapperLeft: {
    position: 'absolute',
    left: 20,
    alignItems: 'center',
  },
  starWrapperRight: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
  },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBtnSelected: {
    backgroundColor: '#22D3EE',
    borderColor: '#F8FAFC',
  },
  starIcon: { fontSize: 22 },
  starLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  scannerCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    alignItems: 'center',
  },
  scannerCardText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },

  /* Screen 3 Missions */
  missionsGrid: {
    width: '100%',
    marginVertical: 16,
  },
  missionSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22D3EE',
    letterSpacing: 1,
    marginBottom: 8,
  },
  missionCapsule: {
    width: '100%',
    borderRadius: 16,
    marginVertical: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  missionCapsuleSelected: {
    borderColor: '#22D3EE',
  },
  missionCapsuleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  missionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },

  /* Screen 4 Orbit Expansion */
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
  orbitExpansionContainer: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: '#090A14',
    borderWidth: 1.5,
    borderColor: '#4338CA',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  floatingParticles: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
  },
  particleStar: { fontSize: 16, marginRight: 24 },
  particleStar2: { fontSize: 18 },
  orbitLevelStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  stackCenterPlanet: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackPlanetIcon: { fontSize: 28 },
  orbitPercentBox: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  orbitPercentText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  orbitStatusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22D3EE',
    letterSpacing: 1.2,
  },
  quoteCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    marginTop: 10,
  },
  quoteCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  timerRemainingText: {
    fontSize: 12,
    color: '#22D3EE',
    marginTop: 6,
    fontWeight: '600',
  },

  /* Screen 5 Celebration */
  celebrationTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22D3EE',
    letterSpacing: 2,
    marginBottom: 8,
  },
  galaxyCelebrationBox: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    marginVertical: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  celebrationPlanet: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationPlanetIcon: { fontSize: 32 },
  orbitingStar1: {
    position: 'absolute',
    top: 40,
    right: 50,
  },
  orbitingStar2: {
    position: 'absolute',
    bottom: 40,
    left: 50,
  },
  orbitingStarIcon: { fontSize: 24 },
  galaxyConstellationLabel: {
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
    borderColor: '#8B5CF6',
    alignItems: 'center',
    marginVertical: 14,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
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
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22D3EE',
  },
  completionMsgText: {
    fontSize: 15,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#F8FAFC',
    marginTop: 10,
  },

  /* Dashboard Screen 6 */
  dashboardTopPlanetBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardPlanetIcon: { fontSize: 56 },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 8,
  },
  dashboardOrbitBox: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
    marginVertical: 10,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22D3EE',
    marginBottom: 8,
  },
  dashboardStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dashboardStarText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
    marginLeft: 8,
  },
  dashboardBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
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
    borderColor: '#22D3EE',
    width: '100%',
    marginVertical: 10,
  },
  dashboardQuoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#22D3EE',
    textAlign: 'center',
    lineHeight: 20,
  },
});
