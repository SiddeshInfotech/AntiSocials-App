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
  Switch,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const TOTAL_UNLOCK_SECONDS = 600; // 10 minutes

// 🌼 Floating Petals (Questions)
const CHECKIN_QUESTIONS = [
  { id: 'day', emoji: '🌼', text: 'How was your day?', accent: '#FACC15' },
  { id: 'smile', emoji: '🌸', text: 'What made you smile today?', accent: '#F472B6' },
  { id: 'feeling', emoji: '🌺', text: 'How are you feeling today?', accent: '#FB7185' },
  { id: 'highlight', emoji: '🌻', text: 'What was the highlight of your day?', accent: '#EAB308' },
  { id: 'challenging', emoji: '🌷', text: 'Was today challenging?', accent: '#A78BFA' },
];

// 🍃 Floating Leaves (Promises)
const LISTENING_PROMISES = [
  { id: 'p1', emoji: '🍃', text: 'Listen without interrupting.' },
  { id: 'p2', emoji: '🍃', text: 'Stay present.' },
  { id: 'p3', emoji: '🍃', text: 'Show empathy.' },
  { id: 'p4', emoji: '🍃', text: 'Let them finish.' },
  { id: 'p5', emoji: '🍃', text: 'Appreciate their response.' },
];

// 💛 Motivational Messages
const MOTIVATIONAL_MESSAGES = [
  '💛 Caring starts with listening.',
  '🌼 Small questions create meaningful moments.',
  '🍃 Presence is a gift.',
  '🌿 Empathy grows through attention.',
];

export default function AskAboutDayTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen state:
  // 1: Sunrise Garden & Opening Flower
  // 2: Choose Your Check-In (Floating Petals)
  // 3: Listening Promise (Floating Leaves)
  // 4: Care Garden (10-min Timer & Blooming Flower)
  // 5: Flower Fully Blooms
  // 6: Final Celebration (Garden Blossoms & Badge Unlock)
  // 7: Task Detail Dashboard View
  const [screen, setScreen] = useState<number>(1);

  // User Selections
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedPromises, setSelectedPromises] = useState<string[]>([]);

  // 10-Minute Unlock Timer & Progress
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  // Animations
  const flowerBloomAnim = useRef(new Animated.Value(0.2)).current;
  const sunlightAnim = useRef(new Animated.Value(0)).current;
  const pollenFloatAnim = useRef(new Animated.Value(0)).current;
  const butterflyWingAnim = useRef(new Animated.Value(0)).current;
  const butterflyPathAnim = useRef(new Animated.Value(0)).current;

  // Initialize background ambient animations
  useEffect(() => {
    // Pollen particle floating loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pollenFloatAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pollenFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Sunlight glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunlightAnim, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sunlightAnim, { toValue: 0.3, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Butterfly wing flutter loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(butterflyWingAnim, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(butterflyWingAnim, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();

    // Butterfly wave flight path loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(butterflyPathAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(butterflyPathAnim, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Screen 1 Flower opening effect on load
  useEffect(() => {
    if (screen === 1) {
      Animated.timing(flowerBloomAnim, {
        toValue: 0.4,
        duration: 1800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();
    }
  }, [screen]);

  // Screen 4 Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds < TOTAL_UNLOCK_SECONDS) {
      const step = isFastForward ? 25 : 1;
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + step;
          if (next >= TOTAL_UNLOCK_SECONDS) {
            setIsTimerActive(false);
            return TOTAL_UNLOCK_SECONDS;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds, isFastForward]);

  // Update flower bloom scale dynamically based on timer progress
  useEffect(() => {
    if (screen === 4) {
      const progressRatio = timerSeconds / TOTAL_UNLOCK_SECONDS;
      const targetScale = 0.4 + progressRatio * 0.6; // Scale 0.4 to 1.0
      Animated.timing(flowerBloomAnim, {
        toValue: targetScale,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [timerSeconds, screen]);

  // Rotating quote messages every 6 seconds on screen 4
  useEffect(() => {
    let quoteInterval: any = null;
    if (screen === 4) {
      quoteInterval = setInterval(() => {
        setActiveQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
      }, 6000);
    }
    return () => {
      if (quoteInterval) clearInterval(quoteInterval);
    };
  }, [screen]);

  // Handlers
  const handleBeginCheckIn = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(2);
  };

  const handleSelectPetal = (qText: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setSelectedQuestion(qText);
  };

  const handleProceedToPromises = () => {
    if (!selectedQuestion) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(3);
    // Grow flower slightly on question choice
    Animated.timing(flowerBloomAnim, {
      toValue: 0.55,
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleTogglePromise = (pText: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    setSelectedPromises((prev) => {
      let updated: string[];
      if (prev.includes(pText)) {
        updated = prev.filter((p) => p !== pText);
      } else {
        updated = [...prev, pText];
      }
      // Expand flower health with promises joined
      const bonusScale = 0.55 + (updated.length / LISTENING_PROMISES.length) * 0.2;
      Animated.timing(flowerBloomAnim, {
        toValue: bonusScale,
        duration: 600,
        useNativeDriver: true,
      }).start();
      return updated;
    });
  };

  const handleEnterCareGarden = () => {
    if (selectedPromises.length === 0) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setScreen(4);
    setIsTimerActive(true);
    saveProgressToBackend(false);
  };

  const handleFlowerFullBloom = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    setScreen(5);
    Animated.timing(flowerBloomAnim, {
      toValue: 1.0,
      duration: 1500,
      easing: Easing.out(Easing.elastic(1.2)),
      useNativeDriver: true,
    }).start();
  };

  const handleGoToCelebration = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    setScreen(6);
  };

  // Complete Challenge & navigate to shared Task Success screen
  const handleFinalCompletion = async () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    let pointsData = { pointsAdded: '300', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        // Complete Task
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone About Their Day',
            selected_question: selectedQuestion,
            listening_promises: selectedPromises,
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error('Task complete fetch error:', e);
    }

    // Save detailed response data
    await saveProgressToBackend(true);

    // Redirect to shared task completion component
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        taskName: 'Ask Someone About Their Day',
        message: 'You showed care.',
        badge: 'Compassion Bloom',
        difficulty: 'hard',
      },
    } as any);
  };

  const saveProgressToBackend = async (completed: boolean) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/bloom-checkin/save-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Ask Someone About Their Day',
            selected_question: selectedQuestion,
            listening_promises: selectedPromises,
            checkin_completed: true,
            completed,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save Bloom Check-In progress:', err);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Interpolated animation values
  const pollenY = pollenFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const sunlightOpacity = sunlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.75],
  });

  const butterflyWingScale = butterflyWingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  const butterflyPosX = butterflyPathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-30, 40, -20],
  });

  const butterflyPosY = butterflyPathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-15, 25, -10],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Warm Peaceful Background Gradient (Bloom Check-In Theme) */}
      <LinearGradient
        colors={['#FFFBEB', '#FEF08A', '#E0F2FE', '#DCFCE7']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Gentle Morning Sunlight Glow */}
      <Animated.View style={[styles.sunlightGlow, { opacity: sunlightOpacity }]} />

      {/* Floating Pollen Particles */}
      <Animated.View style={[styles.pollenContainer, { transform: [{ translateY: pollenY }] }]}>
        <Text style={styles.pollenDot}>✨</Text>
        <Text style={styles.pollenDot2}>🌼</Text>
        <Text style={styles.pollenDot3}>✨</Text>
      </Animated.View>

      {/* Navigation Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Ask Someone About Their Day</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>🌼💛 300 Pts • Hard</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={() => setScreen(screen === 7 ? 4 : 7)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={screen === 7 ? 'flower-outline' : 'view-dashboard-outline'}
            size={22}
            color="#CA8A04"
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= SCREEN 1: SUNRISE GARDEN & OPENING FLOWER ================================================= */}
      {screen === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>BLOOM CHECK-IN • STAGE 1</Text>
          </View>

          <Text style={styles.screenHeader}>"Kindness begins with one simple question."</Text>
          <Text style={styles.screenSubHeader}>Ask. Listen. Care.</Text>

          {/* Peaceful Garden & Blooming Flower Graphic */}
          <View style={styles.flowerDisplayCard}>
            <Animated.View style={[styles.flowerScaleContainer, { transform: [{ scale: flowerBloomAnim }] }]}>
              {/* Organic Blooming Flower SVG Graphic */}
              <Svg width="180" height="180" viewBox="0 0 100 100">
                <Defs>
                  <SvgGradient id="petalGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FACC15" stopOpacity="0.95" />
                    <Stop offset="1" stopColor="#EAB308" stopOpacity="0.85" />
                  </SvgGradient>
                  <SvgGradient id="petalGrad2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#F472B6" stopOpacity="0.9" />
                    <Stop offset="1" stopColor="#FB7185" stopOpacity="0.8" />
                  </SvgGradient>
                </Defs>

                {/* Leaves Stem */}
                <Path d="M50 65 L50 95" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
                <Path d="M50 80 Q35 75 30 85 Q45 90 50 80" fill="#22C55E" />
                <Path d="M50 75 Q65 70 70 80 Q55 85 50 75" fill="#22C55E" />

                {/* Petals */}
                <G>
                  <Circle cx="50" cy="30" r="16" fill="url(#petalGrad1)" />
                  <Circle cx="70" cy="50" r="16" fill="url(#petalGrad2)" />
                  <Circle cx="50" cy="70" r="16" fill="url(#petalGrad1)" />
                  <Circle cx="30" cy="50" r="16" fill="url(#petalGrad2)" />
                  <Circle cx="64" cy="36" r="15" fill="url(#petalGrad1)" />
                  <Circle cx="64" cy="64" r="15" fill="url(#petalGrad2)" />
                  <Circle cx="36" cy="64" r="15" fill="url(#petalGrad1)" />
                  <Circle cx="36" cy="36" r="15" fill="url(#petalGrad2)" />
                </G>

                {/* Center Core */}
                <Circle cx="50" cy="50" r="14" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2.5" />
                <Circle cx="50" cy="50" r="8" fill="#F59E0B" />
              </Svg>
            </Animated.View>

            <View style={styles.flowerStatusBadge}>
              <Text style={styles.flowerStatusText}>🌱 Morning Sun • Flower Opening</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleBeginCheckIn}
          >
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>🌼 Begin Check-In</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 2: CHOOSE YOUR CHECK-IN (FLOATING PETALS) ================================================= */}
      {screen === 2 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>CHOOSE YOUR CHECK-IN</Text>
          <Text style={styles.screenSubHeader}>
            Select one caring question to sincerely ask someone today.
          </Text>

          <View style={styles.petalsContainer}>
            {CHECKIN_QUESTIONS.map((q) => {
              const isSelected = selectedQuestion === q.text;
              return (
                <TouchableOpacity
                  key={q.id}
                  activeOpacity={0.8}
                  style={[
                    styles.petalCard,
                    isSelected && { borderColor: q.accent, backgroundColor: '#FFFFFF', transform: [{ scale: 1.03 }] },
                  ]}
                  onPress={() => handleSelectPetal(q.text)}
                >
                  <View style={[styles.petalEmojiBubble, { backgroundColor: q.accent + '25' }]}>
                    <Text style={styles.petalEmoji}>{q.emoji}</Text>
                  </View>
                  <Text style={[styles.petalText, isSelected && { color: '#0F172A', fontWeight: '700' }]}>
                    {q.text}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: q.accent }]}>
                      <Feather name="check" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedQuestion && styles.disabledBtn]}
            activeOpacity={0.85}
            disabled={!selectedQuestion}
            onPress={handleProceedToPromises}
          >
            <LinearGradient
              colors={selectedQuestion ? ['#16A34A', '#15803D'] : ['#94A3B8', '#64748B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Proceed to Listening Promise 🌿</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 3: LISTENING PROMISE (FLOATING LEAVES) ================================================= */}
      {screen === 3 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>LISTENING PROMISE</Text>
          <Text style={styles.screenSubHeader}>
            Select the promises you commit to keep during your conversation.
          </Text>

          <View style={styles.leavesContainer}>
            {LISTENING_PROMISES.map((p) => {
              const isSelected = selectedPromises.includes(p.text);
              return (
                <TouchableOpacity
                  key={p.id}
                  activeOpacity={0.8}
                  style={[
                    styles.leafCard,
                    isSelected && styles.leafCardSelected,
                  ]}
                  onPress={() => handleTogglePromise(p.text)}
                >
                  <Text style={styles.leafEmoji}>{p.emoji}</Text>
                  <Text style={[styles.leafText, isSelected && styles.leafTextSelected]}>
                    {p.text}
                  </Text>
                  <View style={[styles.leafCheckbox, isSelected && styles.leafCheckboxSelected]}>
                    {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Joined Leaf Flower Indicator */}
          <View style={styles.flowerHealthPreview}>
            <Animated.View style={{ transform: [{ scale: flowerBloomAnim }] }}>
              <Text style={{ fontSize: 44 }}>🌼</Text>
            </Animated.View>
            <Text style={styles.flowerHealthText}>
              {selectedPromises.length === 0
                ? 'Select leaves to nourish the flower.'
                : `🌿 ${selectedPromises.length} / ${LISTENING_PROMISES.length} Leaves Joined • Flower Health Growing!`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, selectedPromises.length === 0 && styles.disabledBtn]}
            activeOpacity={0.85}
            disabled={selectedPromises.length === 0}
            onPress={handleEnterCareGarden}
          >
            <LinearGradient
              colors={selectedPromises.length > 0 ? ['#EAB308', '#CA8A04'] : ['#94A3B8', '#64748B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Enter Care Garden 🌼</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 4: CARE GARDEN (10-MIN TIMER & BLOOMING) ================================================= */}
      {screen === 4 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.careHeaderBar}>
            <View style={styles.careTagPill}>
              <Text style={styles.careTagText}>CARE GARDEN • 10 MINUTES</Text>
            </View>
            <View style={styles.ffContainer}>
              <Text style={styles.ffLabel}>⚡ Fast Test</Text>
              <Switch
                value={isFastForward}
                onValueChange={(val) => setIsFastForward(val)}
                trackColor={{ false: '#CBD5E1', true: '#FACC15' }}
                thumbColor={isFastForward ? '#CA8A04' : '#F8FAFC'}
              />
            </View>
          </View>

          {/* Central Blooming Flower & Visitor Butterflies */}
          <View style={styles.gardenStageBox}>
            {/* Animated Visitor Butterflies */}
            {timerSeconds > TOTAL_UNLOCK_SECONDS * 0.5 && (
              <Animated.View
                style={[
                  styles.butterflyVisitor,
                  {
                    transform: [
                      { translateX: butterflyPosX },
                      { translateY: butterflyPosY },
                      { scaleX: butterflyWingScale },
                    ],
                  },
                ]}
              >
                <Text style={styles.butterflyEmoji}>🦋</Text>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ scale: flowerBloomAnim }] }}>
              <Svg width="200" height="200" viewBox="0 0 100 100">
                <Defs>
                  <SvgGradient id="bloomGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FDE047" stopOpacity="1" />
                    <Stop offset="1" stopColor="#EAB308" stopOpacity="0.9" />
                  </SvgGradient>
                </Defs>

                {/* Stem & Sprouting Leaves */}
                <Path d="M50 60 L50 95" stroke="#15803D" strokeWidth="4.5" strokeLinecap="round" />
                <Path d="M50 78 Q30 70 24 82 Q42 88 50 78" fill="#22C55E" />
                <Path d="M50 72 Q70 64 76 76 Q58 82 50 72" fill="#22C55E" />

                {/* Expanded Blooming Petals */}
                <G>
                  <Circle cx="50" cy="24" r="18" fill="url(#bloomGrad)" />
                  <Circle cx="76" cy="50" r="18" fill="#F472B6" />
                  <Circle cx="50" cy="76" r="18" fill="url(#bloomGrad)" />
                  <Circle cx="24" cy="50" r="18" fill="#F472B6" />
                  <Circle cx="68" cy="32" r="17" fill="url(#bloomGrad)" />
                  <Circle cx="68" cy="68" r="17" fill="#F472B6" />
                  <Circle cx="32" cy="68" r="17" fill="url(#bloomGrad)" />
                  <Circle cx="32" cy="32" r="17" fill="#F472B6" />
                </G>

                <Circle cx="50" cy="50" r="16" fill="#FEF08A" stroke="#CA8A04" strokeWidth="3" />
                <Circle cx="50" cy="50" r="9" fill="#F59E0B" />
              </Svg>
            </Animated.View>

            {/* Timer Readout */}
            <View style={styles.timerDisplayWrap}>
              <Text style={styles.timerDigitsText}>{formatTimer(TOTAL_UNLOCK_SECONDS - timerSeconds)}</Text>
              <Text style={styles.timerSubText}>
                {timerSeconds >= TOTAL_UNLOCK_SECONDS ? 'Full Bloom Achieved! ✨' : 'Flower Blooming in Progress...'}
              </Text>
            </View>
          </View>

          {/* Rotating Motivational Message Banner */}
          <View style={styles.motivationalCard}>
            <Text style={styles.motivationalText}>
              {MOTIVATIONAL_MESSAGES[activeQuoteIndex]}
            </Text>
          </View>

          {/* Active Question & Promises Summary */}
          <View style={styles.activeDetailsBox}>
            <Text style={styles.detailsLabel}>YOUR CHECK-IN QUESTION</Text>
            <Text style={styles.detailsQuestionText}>"{selectedQuestion}"</Text>
            <View style={styles.detailsDivider} />
            <Text style={styles.detailsLabel}>YOUR LISTENING COMMITMENTS</Text>
            <View style={styles.promisesWrap}>
              {selectedPromises.map((p, idx) => (
                <View key={idx} style={styles.promiseChip}>
                  <Text style={styles.promiseChipText}>🍃 {p}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              timerSeconds < TOTAL_UNLOCK_SECONDS && !isFastForward && styles.disabledBtn,
            ]}
            activeOpacity={0.85}
            onPress={handleFlowerFullBloom}
          >
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Bloom Garden 🌸</Text>
              <Feather name="sun" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 5: FLOWER FULLY BLOOMS ================================================= */}
      {screen === 5 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screenTagPill}>
            <Text style={styles.screenTagText}>GARDEN OF CARE</Text>
          </View>

          <Text style={styles.screenHeader}>"You made someone feel seen."</Text>
          <Text style={styles.screenSubHeader}>
            Your genuine curiosity and patient listening gave another person the gift of being heard.
          </Text>

          <View style={styles.fullBloomDisplayCard}>
            {/* Flying Butterflies */}
            <View style={styles.butterflyRow}>
              <Text style={styles.flyingButterfly}>🦋</Text>
              <Text style={styles.flyingButterfly2}>🦋</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: flowerBloomAnim }] }}>
              <Svg width="220" height="220" viewBox="0 0 100 100">
                <Defs>
                  <SvgGradient id="fullBloomGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FDE047" stopOpacity="1" />
                    <Stop offset="1" stopColor="#EAB308" stopOpacity="0.9" />
                  </SvgGradient>
                </Defs>

                {/* Stem */}
                <Path d="M50 55 L50 95" stroke="#15803D" strokeWidth="5" strokeLinecap="round" />
                <Path d="M50 75 Q25 65 20 78 Q40 84 50 75" fill="#22C55E" />
                <Path d="M50 68 Q75 58 80 71 Q60 77 50 68" fill="#22C55E" />

                {/* Lush Full Petals */}
                <G>
                  <Circle cx="50" cy="20" r="20" fill="url(#fullBloomGrad)" />
                  <Circle cx="80" cy="50" r="20" fill="#F472B6" />
                  <Circle cx="50" cy="80" r="20" fill="url(#fullBloomGrad)" />
                  <Circle cx="20" cy="50" r="20" fill="#F472B6" />
                  <Circle cx="71" cy="29" r="19" fill="url(#fullBloomGrad)" />
                  <Circle cx="71" cy="71" r="19" fill="#F472B6" />
                  <Circle cx="29" cy="71" r="19" fill="url(#fullBloomGrad)" />
                  <Circle cx="29" cy="29" r="19" fill="#F472B6" />
                </G>

                <Circle cx="50" cy="50" r="18" fill="#FEF08A" stroke="#CA8A04" strokeWidth="3.5" />
                <Circle cx="50" cy="50" r="10" fill="#F59E0B" />
              </Svg>
            </Animated.View>

            <View style={styles.bloomMessageBadge}>
              <Text style={styles.bloomMessageText}>✨ Golden Light • Flower Fully Bloomed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleGoToCelebration}
          >
            <LinearGradient
              colors={['#16A34A', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Blossom Garden 🌸</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 6: FINAL CELEBRATION (ACHIEVEMENT UNLOCK) ================================================= */}
      {screen === 6 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>FINAL CELEBRATION</Text>
          <Text style={styles.screenHeader}>"The entire garden blossoms."</Text>
          <Text style={styles.screenSubHeader}>
            Multiple flowers bloom together as empathy spreads.
          </Text>

          {/* Multiple Blooming Flowers Visual */}
          <View style={styles.gardenBlossomGrid}>
            <Text style={styles.blossomFlowerEmoji}>🌼</Text>
            <Text style={styles.blossomFlowerEmojiMain}>🌻</Text>
            <Text style={styles.blossomFlowerEmoji}>🌸</Text>
          </View>

          {/* Achievement Unlock Card */}
          <View style={styles.badgeUnlockCard}>
            <View style={styles.badgeIconHalo}>
              <Text style={styles.badgeIconText}>🏅</Text>
            </View>
            <Text style={styles.badgeCategoryText}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.badgeTitleText}>Compassion Bloom</Text>
            <Text style={styles.badgeSubtitleText}>
              "You chose curiosity with kindness and attention."
            </Text>
            <View style={styles.completionPill}>
              <Text style={styles.completionPillText}>Completion Message: "You showed care."</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleFinalCompletion}
          >
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Complete Challenge ✨</Text>
              <Feather name="check-circle" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ================================================= SCREEN 7: TASK DETAIL DASHBOARD ================================================= */}
      {screen === 7 && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenSectionTitle}>TASK DETAIL DASHBOARD</Text>
          <Text style={styles.screenHeader}>Ask Someone About Their Day</Text>

          {/* Top: Animated Blooming Flower */}
          <View style={styles.dashboardFlowerBox}>
            <Animated.View style={{ transform: [{ scale: flowerBloomAnim }] }}>
              <Text style={{ fontSize: 64 }}>🌼</Text>
            </Animated.View>
            <Text style={styles.dashboardFlowerLabel}>Bloom Check-In Visual Identity</Text>
          </View>

          {/* Center: Flower Growth Progress Visualization */}
          <View style={styles.dashboardProgressCard}>
            <Text style={styles.dashboardCardTitle}>GROWTH PROGRESS VISUALIZATION</Text>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>⏱️</Text>

              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Target Duration</Text>
                <Text style={styles.metricValue}>10 Minutes (300 Task Points)</Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🌼</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Selected Question</Text>
                <Text style={styles.metricValue}>
                  {selectedQuestion || 'How was your day?'}
                </Text>
              </View>
            </View>

            <View style={styles.dashboardMetricRow}>
              <Text style={styles.metricIcon}>🌿</Text>
              <View style={styles.metricTextWrap}>
                <Text style={styles.metricTitle}>Listening Promises</Text>
                <Text style={styles.metricValue}>
                  {selectedPromises.length > 0
                    ? `${selectedPromises.length} promises active`
                    : '5 promises defined'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom: Compassion Bloom Badge */}
          <View style={styles.dashboardBadgeCard}>
            <Text style={styles.dashboardBadgeIcon}>🏅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashboardBadgeHeader}>REWARD BADGE</Text>
              <Text style={styles.dashboardBadgeName}>Compassion Bloom</Text>
            </View>
          </View>

          {/* Mandatory Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "People may forget your words, but they'll remember how you made them feel."
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => setScreen(1)}
          >
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.primaryBtnText}>Return to Check-In 🌼</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  sunlightGlow: {
    position: 'absolute',
    top: -60,
    left: width * 0.1,
    width: width * 0.8,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(250, 204, 21, 0.35)',
  },
  pollenContainer: {
    position: 'absolute',
    top: height * 0.15,
    right: 25,
    alignItems: 'center',
    gap: 12,
  },
  pollenDot: { fontSize: 18 },
  pollenDot2: { fontSize: 16 },
  pollenDot3: { fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTag: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  dashboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },

  screenTagPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  screenTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A16207',
    letterSpacing: 0.8,
  },
  screenSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#A16207',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  screenSubHeader: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  flowerDisplayCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#EAB308',
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  flowerScaleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowerStatusBadge: {
    marginTop: 20,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  flowerStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#CA8A04',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Screen 2 Petals
  petalsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  petalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    elevation: 2,
  },
  petalEmojiBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  petalEmoji: { fontSize: 22 },
  petalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Screen 3 Leaves
  leavesContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  leafCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  leafCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#22C55E',
  },
  leafEmoji: { fontSize: 20, marginRight: 12 },
  leafText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  leafTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  leafCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafCheckboxSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  flowerHealthPreview: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: 16,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  flowerHealthText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    textAlign: 'center',
  },

  // Screen 4 Care Garden
  careHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  careTagPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  careTagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#854D0E',
  },
  ffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ffLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  gardenStageBox: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2,
    borderColor: '#FEF08A',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  butterflyVisitor: {
    position: 'absolute',
    top: 25,
    right: 40,
    zIndex: 10,
  },
  butterflyEmoji: { fontSize: 28 },

  timerDisplayWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerDigitsText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
  },
  timerSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    marginTop: 2,
  },

  motivationalCard: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEFCE8',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    alignItems: 'center',
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A16207',
    textAlign: 'center',
  },

  activeDetailsBox: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailsQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontStyle: 'italic',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  promisesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  promiseChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  promiseChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  // Screen 5 Full Bloom
  fullBloomDisplayCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#FDE047',
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
  },
  butterflyRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 10,
  },
  flyingButterfly: { fontSize: 26 },
  flyingButterfly2: { fontSize: 24 },
  bloomMessageBadge: {
    marginTop: 16,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bloomMessageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },

  // Screen 6 Celebration
  gardenBlossomGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 20,
  },
  blossomFlowerEmoji: { fontSize: 44 },
  blossomFlowerEmojiMain: { fontSize: 64 },

  badgeUnlockCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAB308',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
  },
  badgeIconHalo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIconText: { fontSize: 32 },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#CA8A04',
    letterSpacing: 1.2,
  },
  badgeTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  badgeSubtitleText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 14,
  },
  completionPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  completionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  // Screen 7 Dashboard
  dashboardFlowerBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dashboardFlowerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    marginTop: 6,
  },
  dashboardProgressCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  dashboardCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#CA8A04',
    letterSpacing: 1,
    marginBottom: 14,
  },
  dashboardMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: { fontSize: 24, marginRight: 12 },
  metricTextWrap: { flex: 1 },
  metricTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  dashboardBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FEFCE8',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    padding: 16,
    marginBottom: 16,
  },
  dashboardBadgeIcon: { fontSize: 32, marginRight: 14 },
  dashboardBadgeHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A16207',
    letterSpacing: 1,
  },
  dashboardBadgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  quoteCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 18,
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
});
