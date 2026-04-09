import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');
const PRIMARY = '#ff3b30';
const BG = '#0a0a0f';

type Phase = 'HOME' | 'WORKOUT';

// ─── Exercise Data with CORRECT video mapping ───
const EXERCISES = [
  {
    id: '1', name: 'Jumping Jacks', ytCode: '8vs18_V5f20',
    desc: 'Full body warm-up & cardio boost', cal: '60 Kcal', diff: 'Beginner',
    img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500',
    tips: ['Sync arms and legs', 'Land softly on balls of feet', 'Maintain posture'],
    motivation: [
      'Wake up your whole body and build momentum.',
      'Stay light, stay fast, keep your rhythm strong.',
    ],
  },
  {
    id: '2', name: 'Squats', ytCode: 'b9DFYywGneA',
    desc: 'Lower body and glute builder', cal: '45 Kcal', diff: 'Beginner',
    img: 'https://images.unsplash.com/photo-1574680088814-c9e8a10d8a4d?q=80&w=500',
    tips: ['Keep back straight', 'Push knees outwards', 'Lower until thighs are parallel'],
    motivation: [
      'Strong legs, strong foundation.',
      'Go deep, stay balanced, own every rep.',
    ],
  },
  {
    id: '3', name: 'Push-Ups', ytCode: 'TYSCQRmJAYk',
    desc: 'Chest, shoulder, and core strength', cal: '55 Kcal', diff: 'Intermediate',
    img: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=500',
    tips: ['Maintain body alignment', 'Elbows tucked slightly', 'Core tight always'],
    motivation: [
      'Every rep builds strength and confidence.',
      'Stay aligned, stay powerful, finish strong.',
    ],
  },
  {
    id: '4', name: 'High Knees', ytCode: 'DsNk82RhE_c',
    desc: 'High intensity core and cardio', cal: '70 Kcal', diff: 'Intermediate',
    img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=500',
    tips: ['Lift knees high', 'Pump your arms', 'Move in controlled form'],
    motivation: [
      'Drive your knees up and push your energy higher.',
      'Explode with rhythm and keep your pace alive.',
    ],
  },
  {
    id: '5', name: 'Lunges', ytCode: 'LRVkPtvEQ7o',
    desc: 'Unilateral leg strength', cal: '50 Kcal', diff: 'Intermediate',
    img: 'https://images.unsplash.com/photo-1434596922112-19c563067271?q=80&w=500',
    tips: ['Keep balance while alternating legs', 'Keep torso upright', 'Do not let knee pass toes'],
    motivation: [
      'Control every step and build lower-body power.',
      'Stay steady, stay focused, feel the burn.',
    ],
  },
  {
    id: '6', name: 'Plank', ytCode: 'DsNk82RhE_c',
    desc: 'Static core stability hold', cal: '30 Kcal', diff: 'Beginner',
    img: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?q=80&w=500',
    tips: ['Tighten your core and stay straight', 'Squeeze glutes', 'Keep breathing steady'],
    motivation: [
      'Still body, strong core, strong mind.',
      'Hold with discipline, strength grows in silence.',
    ],
  },
];

export default function PremiumFitnessFlowScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [phase, setPhase] = useState<Phase>('HOME');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ─── Force dark background on the native navigation layer ───
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(BG);
    navigation.setOptions({
      contentStyle: { backgroundColor: BG },
      animation: 'fade',
    });
  }, [navigation]);

  // ─── Transition helper ───
  const triggerTransition = useCallback((callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // ─── Actions ───
  const handleGoHome = () => {
    setYtPlaying(false);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    setPhase('HOME');
  };

  const handleMarkComplete = () => {
    if (!selectedExerciseId) return;
    setYtPlaying(false);
    setCompletedExercises(prev => {
      const next = new Set(prev);
      next.add(selectedExerciseId);
      // If all 6 done, navigate to reward page
      if (next.size >= EXERCISES.length) {
        setTimeout(() => router.push('/exercise-complete' as any), 300);
      }
      return next;
    });
    // Go back to home after marking
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    setPhase('HOME');
  };

  const isCurrentExCompleted = selectedExerciseId ? completedExercises.has(selectedExerciseId) : false;

  // ═══════════════════════════════════
  //   HOME: EXERCISE SELECTION
  // ═══════════════════════════════════
  if (phase === 'HOME') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.flex}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HOME WORKOUTS</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollPad}>
            <Text style={styles.hugeHeader}>Select Your{'\n'}Challenge</Text>

            {/* Progress Tracker */}
            <View style={styles.progressRow}>
              <Text style={styles.progressTxt}>{completedExercises.size} / {EXERCISES.length} Completed</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(completedExercises.size / EXERCISES.length) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.grid}>
              {EXERCISES.map((ex) => {
                const isDone = completedExercises.has(ex.id);
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.exCard, isDone && styles.exCardDone]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedExerciseId(ex.id);
                      setYtPlaying(false);
                      triggerTransition(() => setPhase('WORKOUT'));
                    }}
                  >
                    <ImageBackground source={{ uri: ex.img }} style={styles.exImg} imageStyle={{ borderRadius: 20 }}>
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.exGrad}>
                        <View style={styles.badgeRow}>
                          <View style={styles.exBadge}><Text style={styles.exBadgeTxt}>5 MIN</Text></View>
                          {isDone && (
                            <View style={styles.doneBadge}>
                              <Feather name="check-circle" size={14} color="#000" />
                              <Text style={styles.doneBadgeTxt}>DONE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.exTitle}>{ex.name}</Text>
                        <Text style={styles.exDesc}>{ex.desc}</Text>
                        <View style={styles.exChips}>
                          <View style={styles.iconTxt}><FontAwesome5 name="fire-alt" size={12} color={PRIMARY} /><Text style={styles.iconVal}>{ex.cal}</Text></View>
                          <View style={[styles.iconTxt, { marginLeft: 15 }]}><Feather name="bar-chart-2" size={14} color="#a1a1aa" /><Text style={styles.iconVal}>{ex.diff}</Text></View>
                        </View>
                        <View style={[styles.cardCta, isDone && styles.cardCtaDone]}>
                          <Text style={[styles.cardCtaTxt, isDone && { color: '#fff' }]}>{isDone ? 'COMPLETED' : 'START WORKOUT'}</Text>
                          <Feather name={isDone ? 'check' : 'arrow-right'} size={16} color={isDone ? '#fff' : '#000'} />
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════
  //   WORKOUT SESSION
  // ═══════════════════════════════════
  const selectedEx = EXERCISES.find(e => e.id === selectedExerciseId);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ── Header ── */}
        <SafeAreaView edges={['top']} style={styles.workoutHeader}>
          <TouchableOpacity onPress={handleGoHome} style={styles.headerCircle}>
            <Feather name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.workoutTitleTxt} numberOfLines={1}>{selectedEx?.name}</Text>
          <View style={styles.spacer} />
        </SafeAreaView>

        {/* ── Video Player ── */}
        <View style={styles.videoOuter}>
          <View style={styles.videoCard}>
            <YoutubePlayer
              height={Math.round((width - 32) * 9 / 16)}
              width={width - 32}
              play={ytPlaying}
              videoId={selectedEx?.ytCode}
              initialPlayerParams={{
                controls: true,
                rel: false,
                modestbranding: true,
                cc_load_policy: 0,
              }}
              webViewStyle={{ borderRadius: 16, opacity: 0.99 }}
            />
          </View>
        </View>

        {/* ── Scrollable Content ── */}
        <ScrollView style={styles.workoutScroll} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>

          {/* Quick Info Chips */}
          <View style={styles.chipRow}>
            <View style={styles.chip}><FontAwesome5 name="fire-alt" size={14} color={PRIMARY} /><Text style={styles.chipTxt}>{selectedEx?.cal}</Text></View>
            <View style={styles.chip}><Feather name="bar-chart-2" size={14} color="#a1a1aa" /><Text style={styles.chipTxt}>{selectedEx?.diff}</Text></View>
            <View style={styles.chip}><Feather name="clock" size={14} color="#a1a1aa" /><Text style={styles.chipTxt}>5 Min</Text></View>
          </View>

          {/* Motivational Quote Card */}
          <View style={styles.motiveWrap}>
            <LinearGradient colors={['rgba(255,59,48,0.08)', 'rgba(255,59,48,0.02)', 'transparent']} style={styles.motiveGrad}>
              <View style={styles.motiveBar} />
              <View style={styles.motiveInner}>
                <FontAwesome5 name="quote-left" size={14} color={PRIMARY} style={{ opacity: 0.6, marginBottom: 8 }} />
                {selectedEx?.motivation.map((line, i) => (
                  <Text key={i} style={styles.motiveLine}>{line}</Text>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Mark Complete Button */}
          <View style={styles.markCompleteWrap}>
            <TouchableOpacity
              style={[styles.markCompleteBtn, isCurrentExCompleted && styles.markCompleteBtnDone]}
              onPress={isCurrentExCompleted ? handleGoHome : handleMarkComplete}
              activeOpacity={0.85}
            >
              <Feather name={isCurrentExCompleted ? 'check-circle' : 'award'} size={20} color={isCurrentExCompleted ? '#fff' : '#000'} />
              <Text style={[styles.markCompleteTxt, isCurrentExCompleted && { color: '#fff' }]}>
                {isCurrentExCompleted ? 'ALREADY COMPLETED' : 'MARK COMPLETE'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Form & Focus Instructions */}
          <View style={styles.instSection}>
            <Text style={styles.instHeader}>Form & Focus</Text>
            <View style={styles.instCard}>
              <View style={styles.instRow}>
                <Feather name="activity" size={18} color={PRIMARY} />
                <Text style={styles.instTxt}>Follow the motion shown in the video</Text>
              </View>
              <View style={styles.instRow}>
                <Feather name="wind" size={18} color={PRIMARY} />
                <Text style={styles.instTxt}>Keep breathing steady throughout</Text>
              </View>
              <View style={styles.instRow}>
                <Feather name="shield" size={18} color={PRIMARY} />
                <Text style={styles.instTxt}>Move in controlled form</Text>
              </View>

              <View style={styles.divLine} />

              {selectedEx?.tips.map((tip, i) => (
                <View key={i} style={styles.instRow}>
                  <View style={styles.instDot} />
                  <Text style={styles.instTxtBold}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  spacer: { width: 44 },

  // Top Bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1c1c24', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // Home Grid
  scrollPad: { paddingBottom: 50 },
  hugeHeader: { color: '#fff', fontSize: 38, fontWeight: '900', paddingHorizontal: 20, marginTop: 10, marginBottom: 25, lineHeight: 45 },
  grid: { paddingHorizontal: 20, gap: 25 },
  exCard: { width: '100%', height: 320, borderRadius: 20, shadowColor: PRIMARY, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  exImg: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  exGrad: { padding: 25, paddingTop: 60, borderRadius: 20 },
  exBadge: { alignSelf: 'flex-start', backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 15 },
  exBadgeTxt: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  exTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  exDesc: { color: '#a1a1aa', fontSize: 15, fontWeight: '500', marginBottom: 15 },
  exChips: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconTxt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconVal: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardCta: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  cardCtaDone: { backgroundColor: '#1c1c24' },
  cardCtaTxt: { color: '#000', fontWeight: '900', fontSize: 14, marginRight: 8, letterSpacing: 1 },
  exCardDone: { opacity: 0.7 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  doneBadgeTxt: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  progressRow: { paddingHorizontal: 20, marginBottom: 20 },
  progressTxt: { color: '#a1a1aa', fontSize: 14, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  progressBarBg: { height: 6, backgroundColor: '#1c1c24', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },

  // Workout Header
  workoutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10, backgroundColor: BG },
  headerCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1c1c24', alignItems: 'center', justifyContent: 'center' },
  workoutTitleTxt: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', flex: 1, textAlign: 'center', marginHorizontal: 10 },

  // Video
  videoOuter: { paddingHorizontal: 16, paddingBottom: 10, backgroundColor: BG },
  videoCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#111118', alignItems: 'center', justifyContent: 'center' },

  // Scroll body
  workoutScroll: { flex: 1, backgroundColor: BG },

  // Info chips
  chipRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, gap: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#13131a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1c1c24' },
  chipTxt: { color: '#e4e4e7', fontSize: 13, fontWeight: '700' },

  // Motivational
  motiveWrap: { marginHorizontal: 20, marginTop: 20, borderRadius: 18, overflow: 'hidden' },
  motiveGrad: { borderRadius: 18 },
  motiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: PRIMARY, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  motiveInner: { paddingVertical: 20, paddingHorizontal: 22, paddingLeft: 20 },
  motiveLine: { color: '#e4e4e7', fontSize: 16, fontWeight: '600', fontStyle: 'italic', lineHeight: 24, marginBottom: 6 },

  // Mark Complete
  markCompleteWrap: { paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  markCompleteBtn: { backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  markCompleteBtnDone: { backgroundColor: '#1c1c24', borderWidth: 1, borderColor: '#22c55e' },
  markCompleteTxt: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },


  // Instructions
  instSection: { padding: 20, paddingTop: 10 },
  instHeader: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  instCard: { backgroundColor: '#13131a', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#1c1c24' },
  instRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, gap: 12 },
  instTxt: { color: '#d4d4d8', fontSize: 15, fontWeight: '500', flex: 1, lineHeight: 22 },
  divLine: { height: 1, backgroundColor: '#1c1c24', marginVertical: 15 },
  instDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY, marginTop: 8 },
  instTxtBold: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, lineHeight: 22 },
});
