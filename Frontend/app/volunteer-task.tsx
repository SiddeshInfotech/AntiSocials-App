import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

// ─── Category Data ───────────────────────────────────────────────────────────
const CAUSE_DATA: Record<string, any> = {
  older: {
    name: 'Older People',
    icon: 'user-friends',
    color: '#8b5cf6',
    task: 'Spend time talking with an elderly person for 60 minutes.',
    desc: 'Share stories, listen actively, and provide warm companionship to someone who might be feeling deeply lonely today.',
  },
  community: {
    name: 'Community',
    icon: 'hands-helping',
    color: '#3b82f6',
    task: 'Help clean a small area or street in your neighborhood.',
    desc: 'Take initiative to pick up litter or organize a tiny sweep. A cared-for neighborhood lifts everyone up.',
  },
  crisis: {
    name: 'Crisis and Welfare',
    icon: 'box-open',
    color: '#f59e0b',
    task: 'Donate clothes or essentials to someone in need.',
    desc: 'Gather items you no longer use and hand them to a shelter or an individual struggling today.',
  },
  animal: {
    name: 'Animal Welfare',
    icon: 'paw',
    color: '#10b981',
    task: 'Feed a stray animal and spend time caring for it.',
    desc: 'Offer fresh water, safe food, and gentle affection to an innocent animal surviving on the streets.',
  },
  art: {
    name: 'Sport, Art and Culture',
    icon: 'palette',
    color: '#ec4899',
    task: 'Teach or share a beautiful skill with someone.',
    desc: 'Inspire somebody by spending an hour teaching them to draw, play music, or practice a sport.',
  },
  youth: {
    name: 'Young People & Children',
    icon: 'child',
    color: '#06b6d4',
    task: 'Help a child with their studies or engage with them.',
    desc: 'Empower the next generation with homework help, reading, or a supportive game.',
  },
  health: {
    name: 'Health and Social Care',
    icon: 'heartbeat',
    color: '#ef4444',
    task: 'Visit or assist someone who is unwell or needs care.',
    desc: 'Bring a warm meal, help with chores, or sit beside someone recovering from illness.',
  },
  environment: {
    name: 'Environment',
    icon: 'leaf',
    color: '#84cc16',
    task: 'Plant a tree or clean a wild green space entirely.',
    desc: 'Reconnect with nature by planting a sapling or removing waste from a public park.',
  },
};

// ─── Screen States ───────────────────────────────────────────────────────────
type Phase = 'intro' | 'active' | 'proof' | 'success';

// ─────────────────────────────────────────────────────────────────────────────
export default function VolunteerTaskScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams();
  const cause = CAUSE_DATA[categoryId as string] || CAUSE_DATA.community;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('intro');       // current screen phase
  const [timeLeft, setTimeLeft] = useState(3600);            // 60 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Timer Logic ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || isPaused || timeLeft <= 0) return;

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, isPaused, timeLeft]);

  // Gentle breathing pulse while timer runs
  useEffect(() => {
    if (phase === 'active' && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase, isPaused]);

  // Success entrance
  useEffect(() => {
    if (phase === 'success') {
      Animated.spring(successScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
    }
  }, [phase]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((3600 - timeLeft) / 3600) * 100;

  const handleFinishTask = () => setPhase('proof');

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to capture proof of your task.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhase('success');
    }
  };

  const handleSkipPhoto = () => setPhase('success');

  // ── Render Helpers ─────────────────────────────────────────────────────────

  // PHASE 1 — Intro / pre-start
  const renderIntro = () => (
    <Animated.View style={[styles.phaseWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.iconRing, { borderColor: `${cause.color}50`, backgroundColor: `${cause.color}18`, shadowColor: cause.color }]}>
        <FontAwesome5 name={cause.icon} size={36} color={cause.color} />
      </View>

      <Text style={[styles.categoryLabel, { color: cause.color }]}>{cause.name.toUpperCase()}</Text>
      <Text style={styles.taskTitle}>{cause.task}</Text>

      <View style={styles.durationPill}>
        <Feather name="clock" size={15} color="#fff" />
        <Text style={styles.durationText}>60 Minutes</Text>
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.storyHeading}>Your Mission:</Text>
        <Text style={styles.storyBody}>{cause.desc}</Text>
        <View style={[styles.divider, { borderColor: `${cause.color}25` }]} />
        <Text style={styles.instructionLine}>
          Complete the task, click a photo as proof, and earn your points
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.bigBtn, { backgroundColor: cause.color, shadowColor: cause.color }]}
        activeOpacity={0.85}
        onPress={() => setPhase('active')}
      >
        <Text style={styles.bigBtnText}>Begin Task</Text>
        <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 10 }} />
      </TouchableOpacity>
    </Animated.View>
  );

  // PHASE 2 — Active timer
  const renderActive = () => (
    <View style={styles.phaseWrapper}>
      <Text style={[styles.categoryLabel, { color: cause.color }]}>{cause.name.toUpperCase()}</Text>
      <Text style={styles.activeTaskText}>{cause.task}</Text>

      {/* Big Timer */}
      <Animated.View style={[styles.timerRing, { borderColor: `${cause.color}55`, shadowColor: cause.color, transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.timerDigits}>{formatTime(timeLeft)}</Text>
        <Text style={styles.timerLabel}>remaining</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: cause.color }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progressPercent)}% completed</Text>

      {/* Instruction card */}
      <View style={styles.instructionCard}>
        <Feather name="camera" size={18} color={cause.color} />
        <Text style={styles.instructionCardText}>
          Complete the task, click a photo as proof, and earn your points
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlRow}>
        <TouchableOpacity
          style={styles.controlBtn}
          activeOpacity={0.7}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Feather name={isPaused ? 'play' : 'pause'} size={22} color="#fff" />
          <Text style={styles.controlLabel}>{isPaused ? 'Resume' : 'Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: cause.color, shadowColor: cause.color }]}
          activeOpacity={0.85}
          onPress={handleFinishTask}
        >
          <Text style={styles.finishBtnText}>Finish Task</Text>
          <Feather name="check-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // PHASE 3 — Photo proof
  const renderProof = () => (
    <View style={styles.phaseWrapper}>
      <View style={[styles.iconRing, { borderColor: `${cause.color}50`, backgroundColor: `${cause.color}18`, shadowColor: cause.color }]}>
        <Feather name="camera" size={38} color={cause.color} />
      </View>

      <Text style={styles.proofTitle}>Almost there!</Text>
      <Text style={styles.proofSubtitle}>Take a quick photo of your completed task as proof.</Text>

      <TouchableOpacity
        style={[styles.bigBtn, { backgroundColor: cause.color, shadowColor: cause.color }]}
        activeOpacity={0.85}
        onPress={handleTakePhoto}
      >
        <Feather name="camera" size={20} color="#fff" />
        <Text style={[styles.bigBtnText, { marginLeft: 10 }]}>Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={handleSkipPhoto}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  // PHASE 4 — Success / points
  const renderSuccess = () => (
    <Animated.View style={[styles.phaseWrapper, { transform: [{ scale: successScale }] }]}>
      <View style={styles.successCircle}>
        <Feather name="check" size={52} color="#000" />
      </View>

      <Text style={styles.successTitle}>Task Completed!</Text>
      <Text style={styles.successSub}>You made a real difference today.</Text>

      <View style={styles.pointsBadge}>
        <FontAwesome5 name="fire-alt" size={22} color="#d9fc00" />
        <Text style={styles.pointsValue}>+200 Points Earned</Text>
      </View>

      {photoUri && (
        <View style={styles.proofPreview}>
          <Image source={{ uri: photoUri }} style={styles.proofImage} />
          <Text style={styles.proofLabel}>Proof uploaded ✓</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.bigBtn, { backgroundColor: '#ffffff' }]}
        activeOpacity={0.85}
        onPress={() => router.replace('/(tabs)/tasks' as any)}
      >
        <Text style={[styles.bigBtnText, { color: '#000' }]}>Back to Tasks</Text>
        <Feather name="home" size={20} color="#000" style={{ marginLeft: 10 }} />
      </TouchableOpacity>
    </Animated.View>
  );

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Gradient tinted to current cause colour */}
      <LinearGradient
        colors={[`${cause.color}30`, '#131317', '#131317']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header — hidden during success */}
      {phase !== 'success' && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {phase === 'intro' && renderIntro()}
      {phase === 'active' && renderActive()}
      {phase === 'proof' && renderProof()}
      {phase === 'success' && renderSuccess()}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131317' },

  header: { paddingHorizontal: 16, paddingTop: 10 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Shared wrapper for every phase — centres content vertically
  phaseWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  // ── Icon ring ──
  iconRing: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    shadowOpacity: 0.5, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 12,
  },

  // ── Typography ──
  categoryLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  taskTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 34, marginBottom: 20 },
  activeTaskText: { fontSize: 16, fontWeight: '600', color: '#d4d4d8', textAlign: 'center', lineHeight: 24, marginBottom: 30 },

  // ── Duration pill ──
  durationPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  durationText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  // ── Story card ──
  storyCard: {
    backgroundColor: '#1b1b22', width: '100%', borderRadius: 22,
    padding: 24, marginBottom: 30, borderWidth: 1, borderColor: '#2d2d38',
  },
  storyHeading: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  storyBody: { color: '#a1a1aa', fontSize: 14, lineHeight: 22 },
  divider: { borderBottomWidth: 1, marginVertical: 16 },
  instructionLine: { color: '#d9fc00', fontSize: 13, fontWeight: '700', lineHeight: 20 },

  // ── Big CTA button ──
  bigBtn: {
    width: '100%', paddingVertical: 19, borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
  },
  bigBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.8 },

  // ── Timer ring ──
  timerRing: {
    width: 210, height: 210, borderRadius: 105, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center', marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 25, elevation: 10,
  },
  timerDigits: { color: '#fff', fontSize: 52, fontWeight: '200', letterSpacing: 2 },
  timerLabel: { color: '#71717a', fontSize: 13, fontWeight: '600', marginTop: 4 },

  // ── Progress bar ──
  progressTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: '#27272a', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: '#71717a', fontSize: 12, fontWeight: '600', marginBottom: 28 },

  // ── Instruction card ──
  instructionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1b1b22',
    width: '100%', borderRadius: 16, padding: 18, marginBottom: 30,
    borderWidth: 1, borderColor: '#2d2d38',
  },
  instructionCardText: { flex: 1, color: '#a1a1aa', fontSize: 13, lineHeight: 20, marginLeft: 12, fontWeight: '500' },

  // ── Controls ──
  controlRow: { flexDirection: 'row', width: '100%', gap: 12 },
  controlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 16, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  controlLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  finishBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 18,
    shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 6,
  },
  finishBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // ── Proof phase ──
  proofTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  proofSubtitle: { color: '#a1a1aa', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 35 },
  skipBtn: { marginTop: 20, paddingVertical: 14 },
  skipText: { color: '#71717a', fontSize: 14, fontWeight: '600' },

  // ── Success phase ──
  successCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#d9fc00',
    alignItems: 'center', justifyContent: 'center', marginBottom: 30,
    shadowColor: '#d9fc00', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 8 }, shadowRadius: 25, elevation: 15,
  },
  successTitle: { color: '#fff', fontSize: 30, fontWeight: '900', marginBottom: 8 },
  successSub: { color: '#a1a1aa', fontSize: 16, marginBottom: 30, fontWeight: '500' },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(217,252,0,0.12)', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(217,252,0,0.3)',
  },
  pointsValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 10 },
  proofPreview: { alignItems: 'center', marginBottom: 30 },
  proofImage: { width: 140, height: 140, borderRadius: 20, marginBottom: 8 },
  proofLabel: { color: '#10b981', fontSize: 13, fontWeight: '700' },
});

