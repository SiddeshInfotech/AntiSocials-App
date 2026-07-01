import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS,
  interpolate, interpolateColor, Easing, SharedValue
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0F0C1B', // Calming midnight slate
  violet: '#8B5CF6',
  indigo: '#4F46E5',
  lavender: '#C4B5FD',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBrd: 'rgba(255, 255, 255, 0.15)',
  textLight: 'rgba(255, 255, 255, 0.65)',
  textMid: 'rgba(255, 255, 255, 0.88)'
};

type ScreenState = 'welcome' | 'write' | 'label' | 'reflection' | 'complete';

interface LabelItem {
  id: string;
  emoji: string;
  title: string;
}

const LABELS: LabelItem[] = [
  { id: '1', emoji: '😟', title: 'Fear' },
  { id: '2', emoji: '😫', title: 'Stress' },
  { id: '3', emoji: '😔', title: 'Self-Doubt' },
  { id: '4', emoji: '😰', title: 'Anxiety' },
  { id: '5', emoji: '😞', title: 'Regret' },
  { id: '6', emoji: '😡', title: 'Anger' },
  { id: '7', emoji: '😢', title: 'Sadness' },
  { id: '8', emoji: '😕', title: 'Confusion' },
  { id: '9', emoji: '😣', title: 'Overthinking' },
  { id: '10', emoji: '❤️', title: 'Relationship' },
  { id: '11', emoji: '💼', title: 'Career' },
  { id: '12', emoji: '📚', title: 'Studies' },
  { id: '13', emoji: '💰', title: 'Money' },
  { id: '14', emoji: '🏠', title: 'Family' },
  { id: '15', emoji: '🌱', title: 'Growth' },
  { id: '16', emoji: '😊', title: 'Hope' },
  { id: '17', emoji: '🙏', title: 'Gratitude' },
  { id: '18', emoji: '💪', title: 'Confidence' },
  { id: '19', emoji: '✨', title: 'Motivation' },
  { id: '20', emoji: '😌', title: 'Peace' }
];

const ORBITING_THOUGHTS = [
  "What if I fail?",
  "I'm not good enough.",
  "I should have done better."
];

// ── Particle Component ───────────────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.4);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-35 - delay * 0.05, { duration: 3500 + delay }),
      withTiming(15, { duration: 3500 + delay })
    ), -1, true);

    op.value = withRepeat(withSequence(
      withTiming(0.8, { duration: 2200 + delay }),
      withTiming(0.2, { duration: 2200 + delay })
    ), -1, true);
  }, []);

  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value
  }));

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color
      },
      s
    ]} />
  );
}

// ── Premium Gradient Button ──────────────────────────────────────────────
function GradBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[styles.gradBtnWrap, s]}>
      <Pressable
        onPressIn={() => {
          if (!disabled) {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
            sc.value = withSpring(0.96);
          }
        }}
        onPressOut={() => { sc.value = withSpring(1); }}
        onPress={onPress}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={disabled ? ['#352B4E', '#231E35'] : [C.violet, C.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={[styles.gradBtnText, disabled && { color: 'rgba(255,255,255,0.25)' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MAIN EXPERIENTIAL COMPONENT ───────────────────────────────────────────
export default function LabelThoughtScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [thoughtText, setThoughtText] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<LabelItem | null>(null);

  // Animations shared values
  const breatheScale = useSharedValue(1);
  const orbitAngle = useSharedValue(0);

  // Pulse animation for the thought card icon
  const iconPulseScale = useSharedValue(1);

  // Setup breathing cloud & 3D elliptical orbits
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbitAngle.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (thoughtText.length > 0) {
      iconPulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      iconPulseScale.value = 1;
    }
  }, [thoughtText]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPulseScale.value }]
  }));

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    try {
      Haptics.impactAsync(style);
    } catch (e) {}
  };

  const handleSelectLabel = (label: LabelItem) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLabel(label);
  };

  const saveThoughtLog = async () => {
    try {
      const existing = await SecureStore.getItemAsync('labeled_thoughts_log');
      const list = existing ? JSON.parse(existing) : [];
      const newEntry = {
        id: Date.now().toString(),
        thought: thoughtText,
        label: selectedLabel,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };
      list.unshift(newEntry);
      await SecureStore.setItemAsync('labeled_thoughts_log', JSON.stringify(list));
    } catch (e) {
      console.error("saveThoughtLog error:", e);
    }
  };

  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_name: 'Label a Thought', points: 500 }),
      });
    } catch (e) {
      console.error('completeTask error:', e);
    }
  };

  const handleSaveThought = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    saveThoughtLog();
    setScreen('complete');
  };

  const handleReturnHome = () => {
    completeTask();
    router.replace('/(tabs)' as any);
  };

  // Breathe Dot styles (static hooks)
  const dotStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -24 * breatheScale.value * 0.9 },
      { translateY: -24 * breatheScale.value * 0.9 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: 24 * breatheScale.value * 1.0 },
      { translateY: -24 * breatheScale.value * 1.0 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -24 * breatheScale.value * 0.85 },
      { translateY: 24 * breatheScale.value * 0.85 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle4 = useAnimatedStyle(() => ({
    transform: [
      { translateX: 24 * breatheScale.value * 0.95 },
      { translateY: 24 * breatheScale.value * 0.95 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle5 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -32 * breatheScale.value * 1.05 },
      { translateY: -5 * breatheScale.value * 1.05 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle6 = useAnimatedStyle(() => ({
    transform: [
      { translateX: 32 * breatheScale.value * 0.9 },
      { translateY: -5 * breatheScale.value * 0.9 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle7 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -5 * breatheScale.value * 1.0 },
      { translateY: -32 * breatheScale.value * 1.0 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));
  const dotStyle8 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -5 * breatheScale.value * 0.95 },
      { translateY: 32 * breatheScale.value * 0.95 }
    ],
    opacity: interpolate(breatheScale.value, [0.9, 1.15], [0.45, 0.75])
  }));

  // Elliptical Orbiting thoughts styles (static hooks)
  const orbitStyle1 = useAnimatedStyle(() => {
    const angle = orbitAngle.value + 0;
    const rx = width > 500 ? 150 : 110;
    const ry = 42;
    const tx = Math.cos(angle) * rx;
    const ty = Math.sin(angle) * ry;
    const scale = interpolate(Math.sin(angle), [-1, 1], [0.82, 1.12]);
    const opacity = interpolate(Math.sin(angle), [-1, 1], [0.35, 0.95]);
    const zIndex = Math.sin(angle) > 0 ? 15 : -1;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
      zIndex
    };
  });

  const orbitStyle2 = useAnimatedStyle(() => {
    const angle = orbitAngle.value + (2 * Math.PI) / 3;
    const rx = width > 500 ? 150 : 110;
    const ry = 42;
    const tx = Math.cos(angle) * rx;
    const ty = Math.sin(angle) * ry;
    const scale = interpolate(Math.sin(angle), [-1, 1], [0.82, 1.12]);
    const opacity = interpolate(Math.sin(angle), [-1, 1], [0.35, 0.95]);
    const zIndex = Math.sin(angle) > 0 ? 15 : -1;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
      zIndex
    };
  });

  const orbitStyle3 = useAnimatedStyle(() => {
    const angle = orbitAngle.value + (4 * Math.PI) / 3;
    const rx = width > 500 ? 150 : 110;
    const ry = 42;
    const tx = Math.cos(angle) * rx;
    const ty = Math.sin(angle) * ry;
    const scale = interpolate(Math.sin(angle), [-1, 1], [0.82, 1.12]);
    const opacity = interpolate(Math.sin(angle), [-1, 1], [0.35, 0.95]);
    const zIndex = Math.sin(angle) > 0 ? 15 : -1;
    return {
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
      opacity,
      zIndex
    };
  });



  // ──────── SCREEN 1 — WELCOME ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#100A25', '#24143D', '#0F091E']} style={StyleSheet.absoluteFillObject} />

        {/* Ambient Particles */}
        {[
          { x: 30, y: 140, size: 5, color: '#C4B5FD', delay: 0 },
          { x: width - 60, y: 250, size: 4, color: '#A78BFA', delay: 500 },
          { x: 80, y: 380, size: 5, color: '#818CF8', delay: 200 },
          { x: width - 90, y: 440, size: 6, color: '#FBCFE8', delay: 700 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            {/* Upper Interactive breathing cloud and orbit visual */}
            <View style={styles.cloudVisualContainer}>
              {/* Breath Dot Cloud */}
              <View style={styles.cloudCore}>
                {/* 8 surrounding breathing dots to construct a cloud shape */}
                <Animated.View style={[styles.cloudDot, { top: -20, left: -20 }, dotStyle1]} />
                <Animated.View style={[styles.cloudDot, { top: -20, left: 10 }, dotStyle2]} />
                <Animated.View style={[styles.cloudDot, { top: 10, left: -20 }, dotStyle3]} />
                <Animated.View style={[styles.cloudDot, { top: 10, left: 10 }, dotStyle4]} />
                <Animated.View style={[styles.cloudDot, { top: -5, left: -30 }, dotStyle5]} />
                <Animated.View style={[styles.cloudDot, { top: -5, left: 20 }, dotStyle6]} />
                <Animated.View style={[styles.cloudDot, { top: -30, left: -5 }, dotStyle7]} />
                <Animated.View style={[styles.cloudDot, { top: 20, left: -5 }, dotStyle8]} />
              </View>

              {/* 3 Orbiting Thoughts */}
              <Animated.View style={[styles.orbitingPill, orbitStyle1]}>
                <Text style={styles.orbitingText}>💭 {ORBITING_THOUGHTS[0]}</Text>
              </Animated.View>
              <Animated.View style={[styles.orbitingPill, orbitStyle2]}>
                <Text style={styles.orbitingText}>💭 {ORBITING_THOUGHTS[1]}</Text>
              </Animated.View>
              <Animated.View style={[styles.orbitingPill, orbitStyle3]}>
                <Text style={styles.orbitingText}>💭 {ORBITING_THOUGHTS[2]}</Text>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.duration(1000)} style={styles.welcomeIntro}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🧠 Mindfulness Pause</Text>
              </View>
              <Text style={styles.welcomeTitle}>Label a Thought</Text>
              <Text style={styles.welcomeSubtitle}>
                Every thought has a pattern. Giving it a name helps you understand it instead of reacting automatically.
              </Text>
            </Animated.View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn label="Begin" onPress={() => setScreen('write')} />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 2 — WRITE YOUR THOUGHT ────────
  if (screen === 'write') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#100A25', '#1B1130', '#0F091E']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Write Thought</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>What's on your mind?</Text>
                <Text style={styles.writeSubtitle}>
                  Write the thought exactly as it appears. Don't fix it. Don't judge it. Just notice it.
                </Text>
              </Animated.View>

              {/* Premium Thought Label Card */}
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.thoughtCard}>
                <View style={styles.thoughtCardHeader}>
                  <Animated.View style={animatedPulseStyle}>
                    <Ionicons name="cloud" size={24} color="#C4B5FD" style={styles.glowingBubble} />
                  </Animated.View>
                  <Text style={styles.thoughtCardHeaderText}>💭 Thought to Label</Text>
                </View>

                <TextInput
                  style={styles.thoughtInput}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  placeholder="I keep thinking..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  value={thoughtText}
                  onChangeText={setThoughtText}
                  maxLength={300}
                />

                <Text style={styles.thoughtCharCount}>
                  {thoughtText.length} / 300
                </Text>
              </Animated.View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Continue" 
                onPress={() => setScreen('label')} 
                disabled={!thoughtText.trim()} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 3 — LABEL YOUR THOUGHT ────────
  if (screen === 'label') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#100A25', '#1B1130', '#0F091E']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('write')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Label</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>What best describes this thought?</Text>
                <Text style={styles.writeSubtitle}>
                  There are no right or wrong answers. Choose the label that feels closest.
                </Text>
              </Animated.View>

              {/* 2-Column Responsive Grid */}
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.labelsGrid}>
                {LABELS.map((item) => {
                  const isSelected = selectedLabel?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectLabel(item)}
                      style={[
                        styles.labelCard,
                        isSelected && styles.labelCardSelected
                      ]}
                    >
                      <Text style={styles.labelEmoji}>{item.emoji}</Text>
                      <Text style={[styles.labelText, isSelected && styles.labelTextSelected]}>
                        {item.title}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={C.lavender} style={styles.checkmarkIcon} />
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Continue" 
                onPress={handleSaveThought} 
                disabled={!selectedLabel} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 5 — COMPLETION SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* Sunrise Overlay */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.25)', 'rgba(239, 68, 68, 0.15)', '#0F091E']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.responsiveContainer}>
          
          <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
            
            <Animated.View entering={FadeInDown.duration(900)} style={styles.completeHeader}>
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-done-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.badgeSuccessText}>Mindful Moment Completed</Text>
              </View>
              <Text style={styles.completeTitle}>✨ Thought Saved</Text>
              <Text style={styles.completeSubtitle}>
                You took a moment to notice your thoughts instead of letting them control you. Small moments of awareness create lasting change.
              </Text>
            </Animated.View>

            {/* Summary statistics Card */}
            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.summaryCardView}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>📝 Your Thought</Text>
                <Text style={styles.summaryRowVal}>"{thoughtText}"</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>🏷️ Selected Label</Text>
                <Text style={styles.summaryRowVal}>
                  {selectedLabel?.emoji} {selectedLabel?.title}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>📅 Date</Text>
                <Text style={styles.summaryRowVal}>
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </Animated.View>

            {/* Short reflection sentence */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.reflectionQuoteCard}>
              <Text style={styles.reflectionQuoteText}>
                "Giving your thought a label is the first step toward understanding it."
              </Text>
            </Animated.View>

          </ScrollView>

          <View style={styles.actionBlock}>
            <GradBtn label="Done" onPress={handleReturnHome} />
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Stylesheets ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg
  },
  safeArea: {
    flex: 1
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  cloudVisualContainer: {
    height: height * 0.28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 20
  },
  cloudCore: {
    position: 'relative',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cloudDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C4B5FD',
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 4
  },
  orbitingPill: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  orbitingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600'
  },
  welcomeIntro: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  welcomeTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 46,
    textAlign: 'center',
    marginBottom: 12
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: C.textLight,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 4
  },
  writeHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  writeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6
  },
  writeSubtitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 20
  },
  thoughtCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    minHeight: 240,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: C.violet,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative'
  },
  thoughtCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  glowingBubble: {
    textShadowColor: 'rgba(196, 181, 253, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  thoughtCardHeaderText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 8
  },
  thoughtInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFF',
    marginTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 24,
    minHeight: 120,
  },
  thoughtCharCount: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600'
  },
  labelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  labelCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  labelCardSelected: {
    borderColor: '#C4B5FD',
    backgroundColor: 'rgba(139, 92, 246, 0.16)',
    transform: [{ scale: 1.02 }]
  },
  labelEmoji: {
    fontSize: 20,
    marginRight: 10
  },
  labelText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  labelTextSelected: {
    color: '#C4B5FD'
  },
  checkmarkIcon: {
    marginLeft: 4
  },
  reflectionContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 24,
    width: '100%',
    height: 180,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  reflectionMorphArea: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: 'center'
  },
  reflectLabel: {
    color: '#C4B5FD',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  reflectThoughtVal: {
    color: '#FFF',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12
  },
  reflectDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    marginVertical: 4
  },
  reflectLabelVal: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600'
  },
  floatingFeatherContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featherMantra: {
    color: '#C4B5FD',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 10,
    fontWeight: '500'
  },
  reflectionAdviceCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    padding: 20,
    width: '100%'
  },
  reflectionAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  reflectionAdviceTitle: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  reflectionAdviceText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic'
  },
  completeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: height * 0.04
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16
  },
  badgeSuccessText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10
  },
  completeSubtitle: {
    color: C.textLight,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  summaryCardView: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.glassBrd,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  summaryRowLabel: {
    color: '#C4B5FD',
    fontSize: 14,
    fontWeight: '700'
  },
  summaryRowVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    marginVertical: 10
  },
  reflectionQuoteCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20
  },
  reflectionQuoteText: {
    color: '#C4B5FD',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  gradBtnWrap: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowColor: C.violet,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6
  },
  gradBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gradBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
