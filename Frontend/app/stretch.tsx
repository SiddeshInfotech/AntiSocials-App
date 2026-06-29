import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  Platform,
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// --- Theme & Constants ---
const COLORS = {
  bgStart: '#FFF5E1', // Soft Morning Yellow
  bgEnd: '#FFD194',   // Warm Orange
  primary: '#FF8C42', // Deep Morning Orange
  secondary: '#FFB347',
  accent: '#FFF',
  text: '#2D3436',
  textLight: '#636E72',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  success: '#00B894'
};

const EXERCISES = [
  {
    id: 1,
    name: "Knees to Chest",
    image: require('../assets/images/WhatsApp Image 2026-06-26 at 3.57.05 PM.jpeg'),
    instructions: ["Lie comfortably on your back.", "Bring both knees toward your chest.", "Hug your knees gently.", "Keep breathing slowly."],
    benefits: ["Relieves lower back tension", "Improves hip flexibility", "Gently wakes the spine"],
    tip: "Relax your shoulders and breathe deeply."
  },
  {
    id: 2,
    name: "Child Pose",
    image: require('../assets/images/WhatsApp Image 2026-06-26 at 3.57.23 PM.jpeg'),
    instructions: ["Sit on your knees.", "Stretch your arms forward.", "Rest your forehead.", "Breathe deeply."],
    benefits: ["Calms the nervous system", "Opens hips", "Stretches the spine"],
    tip: "Don't force the stretch. Stay relaxed."
  },
  {
    id: 3,
    name: "Side Stretch",
    image: require('../assets/images/WhatsApp Image 2026-06-26 at 3.57.38 PM.jpeg'),
    instructions: ["Stand comfortably.", "Raise one arm.", "Lean gently to one side.", "Repeat for both sides."],
    benefits: ["Improves flexibility", "Opens the ribs", "Loosens side muscles"],
    tip: "Keep your body aligned."
  },
  {
    id: 4,
    name: "Shoulder Stretch",
    image: require('../assets/images/WhatsApp Image 2026-06-26 at 3.57.54 PM.jpeg'),
    instructions: ["Bring one arm across your chest.", "Hold using the opposite arm.", "Switch sides."],
    benefits: ["Releases shoulder stiffness", "Improves mobility", "Relaxes upper body"],
    tip: "Avoid lifting your shoulders."
  },
  {
    id: 5,
    name: "Toe Touch",
    image: require('../assets/images/WhatsApp Image 2026-06-26 at 3.58.08 PM.jpeg'),
    instructions: ["Stand with feet together.", "Slowly bend forward.", "Reach toward your toes.", "Keep knees soft if needed."],
    benefits: ["Stretches hamstrings", "Improves flexibility", "Increases blood flow"],
    tip: "Do not bounce while stretching."
  }
];

// --- Reusable UI Components ---

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <BlurView intensity={40} tint="light" style={[styles.glassCard, style]}>
    {children}
  </BlurView>
);

const ProgressBar = ({ progress }: { progress: number }) => {
  const widthAnim = useSharedValue(0);
  useEffect(() => {
    widthAnim.value = withSpring(progress * 100);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`
  }));

  return (
    <View style={styles.progressContainer}>
      <Animated.View style={[styles.progressFill, animatedStyle]} />
    </View>
  );
};

const CircularTimer = ({ timeLeft, isFinished }: { timeLeft: number, isFinished: boolean }) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / 120; // 2 minutes = 120s

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const scale = useSharedValue(1);

  useEffect(() => {
    if (timeLeft > 0 && timeLeft % 30 === 0) {
      scale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeLeft]);

  const animatedText = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
      <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isFinished ? COLORS.success : COLORS.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }, animatedText]}>
          <Text style={[styles.timerText, isFinished && { color: COLORS.success }]}>
            {isFinished ? "✓" : formatTime(timeLeft)}
          </Text>
          {isFinished && <Text style={styles.completedSmallText}>Completed</Text>}
        </Animated.View>
      </View>
  );
};

// --- Main Application ---

type ScreenState = 'intro' | 'exercise' | 'completion';

export default function MorningStretchScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 120 for 2 mins
  const [timerActive, setTimerActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      clearInterval(interval);
      setTimerActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleStart = () => {
    setScreen('exercise');
    setTimerActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleNext = () => {
    if (currentIdx < EXERCISES.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(120);
      setTimerActive(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setScreen('completion');
      completeTaskApi();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const completeTaskApi = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/activities/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskName: "Morning Stretch",
          points: 500,
        }),
      });
    } catch (e) {
      console.error("Complete task error:", e);
    }
  };

  const currentExercise = EXERCISES[currentIdx];
  const progress = (currentIdx + (timeLeft === 0 ? 1 : 0)) / EXERCISES.length;

  // --- Intro Screen ---
  if (screen === 'intro') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <LinearGradient colors={[COLORS.bgStart, COLORS.bgEnd]} style={StyleSheet.absoluteFill} />
        
        {/* Floating shapes */}
        <Animated.View entering={FadeIn.duration(2000)} style={[styles.floatingCircle, { top: 100, left: -50, backgroundColor: 'rgba(255,255,255,0.3)', width: 200, height: 200 }]} />
        <Animated.View entering={FadeIn.duration(2000).delay(500)} style={[styles.floatingCircle, { bottom: 100, right: -50, backgroundColor: 'rgba(255,255,255,0.2)', width: 150, height: 150 }]} />

        <SafeAreaView style={{ flex: 1, padding: 30, justifyContent: 'center' }}>
          <Animated.View entering={FadeInDown.duration(1000).springify()}>
            <Text style={styles.introEmoji}>🌅</Text>
            <Text style={styles.introGreet}>Good Morning</Text>
            <Text style={styles.introTitle}>Morning Stretch</Text>
            <Text style={styles.introDesc}>
              Wake your body gently.{"\n\n"}
              A few mindful stretches can improve flexibility, reduce stiffness, boost circulation, and prepare you for an energetic day.
            </Text>

            <View style={styles.statsRow}>
               <StatItem icon="clock" label="10 Minutes" />
               <StatItem icon="list" label="5 Exercises" />
               <StatItem icon="star" label="Beginner" />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleStart}
              style={styles.primaryBtnContainer}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Begin Stretch</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // --- Completion Screen ---
  if (screen === 'completion') {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <LinearGradient colors={[COLORS.bgStart, '#FFF']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' }}>
           <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center' }}>
              <View style={styles.completionCircle}>
                 <Ionicons name="sparkles" size={60} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>✨ Amazing Work!</Text>
              <Text style={styles.modalSubtitle}>You completed your{"\n"}10 Minute Morning Stretch</Text>
              
              <View style={styles.summaryGrid}>
                 <SummaryCard label="Exercises Completed" value="5" icon="checkmark-circle" />
                 <SummaryCard label="Total Time" value="10 Min" icon="time" />
                 <SummaryCard label="Morning Energy" value="100%" icon="flash" />
              </View>

              <Text style={styles.quoteText}>"Small morning habits create powerful days."</Text>

              <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)' as any)}>
                 <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Return Home</Text>
                 </LinearGradient>
              </TouchableOpacity>
           </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // --- Exercise Screen ---
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={[COLORS.bgStart, '#FFF']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
           <Text style={styles.headerTitle}>Morning Stretch</Text>
           <View style={styles.progressBadge}>
              <Text style={styles.progressText}>Exercise {currentIdx + 1} / 5</Text>
           </View>
        </View>
        <View style={{ paddingHorizontal: 30 }}>
           <ProgressBar progress={progress} />
        </View>

        <ScrollView contentContainerStyle={styles.exerciseScroll} showsVerticalScrollIndicator={false}>
          <Animated.View key={currentIdx} entering={SlideInRight.duration(600)}>
            <View style={styles.imageCard}>
               <Image source={currentExercise.image} style={styles.exerciseImage} resizeMode="cover" />
            </View>

            <View style={styles.titleInfo}>
               <Text style={styles.exLabel}>Exercise {currentIdx + 1} of 5</Text>
               <Text style={styles.exName}>{currentExercise.name}</Text>
            </View>

            <CircularTimer timeLeft={timeLeft} isFinished={timeLeft === 0} />

            <GlassCard style={styles.infoCard}>
               <SectionHeader icon="list" title="Instructions" />
               {currentExercise.instructions.map((inst, i) => (
                 <Text key={i} style={styles.infoBody}>• {inst}</Text>
               ))}
            </GlassCard>

            <GlassCard style={styles.infoCard}>
               <SectionHeader icon="heart" title="Benefits" />
               {currentExercise.benefits.map((ben, i) => (
                 <Text key={i} style={styles.infoBody}>• {ben}</Text>
               ))}
            </GlassCard>

            <View style={styles.tipBox}>
               <Ionicons name="bulb-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
               <Text style={styles.tipText}><Text style={{ fontWeight: 'bold' }}>Tip: </Text>{currentExercise.tip}</Text>
            </View>
          </Animated.View>
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Next Button */}
        <View style={styles.footer}>
           <TouchableOpacity 
             disabled={timeLeft > 0} 
             onPress={handleNext}
             activeOpacity={0.8}
             style={{ width: '100%' }}
           >
             <LinearGradient 
               colors={timeLeft > 0 ? ['#D1D5DB', '#E5E7EB'] : [COLORS.primary, COLORS.secondary]} 
               style={styles.nextBtn}
             >
                <Text style={[styles.nextBtnText, timeLeft > 0 && { color: '#9CA3AF' }]}>
                   {currentIdx === 4 ? "Finish Stretch" : "Next Exercise"}
                </Text>
                {timeLeft === 0 && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />}
             </LinearGradient>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// --- Helper Components ---

const StatItem = ({ icon, label }: { icon: any, label: string }) => (
  <View style={styles.statItemWrap}>
    <Feather name={icon} size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionHeader = ({ icon, title }: { icon: any, title: string }) => (
  <View style={styles.sectionHeader}>
     <Feather name={icon} size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
     <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const SummaryCard = ({ label, value, icon }: any) => (
  <GlassCard style={styles.summaryCard}>
     <Ionicons name={icon} size={24} color={COLORS.primary} />
     <Text style={styles.summaryValue}>{value}</Text>
     <Text style={styles.summaryLabel}>{label}</Text>
  </GlassCard>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  floatingCircle: { position: 'absolute', borderRadius: 1000 },
  
  // Intro Screen
  introEmoji: { fontSize: 60, marginBottom: 10 },
  introGreet: { fontSize: 24, color: COLORS.textLight, fontWeight: '500' },
  introTitle: { fontSize: 44, fontWeight: '900', color: COLORS.text, marginBottom: 20 },
  introDesc: { fontSize: 17, color: COLORS.textLight, lineHeight: 26, marginBottom: 35 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 40, flexWrap: 'wrap' },
  statItemWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  statLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  primaryBtnContainer: { width: '100%', height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 10 }, shadowRadius: 15 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Exercise Screen
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  progressBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  progressText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressContainer: { height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, width: '100%', marginVertical: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },

  exerciseScroll: { paddingHorizontal: 30, paddingTop: 20 },
  imageCard: { width: '100%', height: 240, borderRadius: 32, overflow: 'hidden', marginBottom: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  exerciseImage: { width: '100%', height: '100%' },
  titleInfo: { alignItems: 'center', marginBottom: 10 },
  exLabel: { fontSize: 13, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  exName: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },

  timerText: { fontSize: 38, fontWeight: 'bold', color: COLORS.text },
  completedSmallText: { fontSize: 12, color: COLORS.success, fontWeight: '800', marginTop: -5 },

  infoCard: { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  infoBody: { fontSize: 15, color: COLORS.textLight, lineHeight: 22, marginBottom: 4 },
  
  tipBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#FEF3C7' },
  tipText: { flex: 1, fontSize: 14, color: '#92400E' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30 },
  nextBtn: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  glassCard: { overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.4)' },

  // Completion Screen
  completionCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 36, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  modalSubtitle: { fontSize: 18, color: COLORS.textLight, textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  summaryCard: { padding: 15, borderRadius: 20, alignItems: 'center', width: (width - 84) / 3 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 8 },
  summaryLabel: { fontSize: 10, color: COLORS.textLight, textAlign: 'center' },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: COLORS.textLight, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  homeBtn: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden' }
});
