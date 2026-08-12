import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export interface EnergyOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
  glowColor: string;
  gradient: [string, string];
  description: string;
}

export const ENERGY_OPTIONS: EnergyOption[] = [
  {
    id: 'positive',
    label: 'Positive',
    emoji: '😊',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    gradient: ['#F59E0B', '#FBBF24'],
    description: 'Warm, uplifting, and cheerful atmosphere.',
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    color: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    gradient: ['#06B6D4', '#38BDF8'],
    description: 'Peaceful, relaxed, and grounding vibe.',
  },
  {
    id: 'excited',
    label: 'Excited',
    emoji: '🔥',
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    gradient: ['#F97316', '#FB923C'],
    description: 'High energy, vibrant, and enthusiastic momentum.',
  },
  {
    id: 'connected',
    label: 'Connected',
    emoji: '🤝',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    gradient: ['#8B5CF6', '#C084FC'],
    description: 'Deep harmony, trust, and togetherness.',
  },
  {
    id: 'supportive',
    label: 'Supportive',
    emoji: '🌱',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    gradient: ['#10B981', '#34D399'],
    description: 'Kind, caring, and encouraging presence.',
  },
  {
    id: 'tense',
    label: 'Tense',
    emoji: '🌧',
    color: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    gradient: ['#6366F1', '#818CF8'],
    description: 'Cautious, quiet, or guarded environment.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    emoji: '🌊',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    gradient: ['#EC4899', '#F472B6'],
    description: 'Shifting emotions, varied dynamic flow.',
  },
];

const SUGGESTION_CHIPS = [
  "The conversation felt supportive.",
  "Everyone seemed comfortable.",
  "The energy became more positive.",
  "People were listening closely to each other.",
  "The mood was calm and relaxed.",
];

const COLORS = {
  bgDark: '#080914',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  emerald: '#10B981',
  rose: '#F43F5E',
  textWhite: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.65)',
  glassBg: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
};

const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    // Haptics fallback
  }
};

// ==========================================
// ANIMATED SUB-COMPONENTS
// ==========================================
const ParticleItem = ({
  width,
  height,
  index,
  activeColor,
}: {
  width: number;
  height: number;
  index: number;
  activeColor?: string;
}) => {
  const posX = useSharedValue(Math.random() * width);
  const posY = useSharedValue(height + Math.random() * 80);
  const pScale = useSharedValue(Math.random() * 0.5 + 0.3);
  const pOpacity = useSharedValue(Math.random() * 0.35 + 0.15);

  useEffect(() => {
    const duration = 10000 + Math.random() * 8000;
    const delay = Math.random() * 4000;

    posY.value = withRepeat(
      withSequence(
        withTiming(height + 20, { duration: delay }),
        withTiming(-40, { duration, easing: Easing.linear })
      ),
      -1,
      false
    );

    posX.value = withRepeat(
      withSequence(
        withTiming(posX.value + (Math.random() * 40 - 20), {
          duration: 3500 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(posX.value - (Math.random() * 40 - 20), {
          duration: 3500 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
      { scale: pScale.value },
    ],
    opacity: pOpacity.value,
  }));

  const colorChoice = activeColor || (index % 3 === 0 ? COLORS.purple : index % 3 === 1 ? COLORS.cyan : COLORS.amber);

  return (
    <Animated.View
      style={[
        styles.ambientParticle,
        style,
        { backgroundColor: colorChoice, shadowColor: colorChoice },
      ]}
    />
  );
};

// Ambient Floating Particles
const FloatingParticles = ({ width, height, count = 22, activeColor }: { width: number; height: number; count?: number; activeColor?: string }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <ParticleItem
          key={i}
          index={i}
          width={width}
          height={height}
          activeColor={activeColor}
        />
      ))}
    </View>
  );
};

// Particles spawned while typing text
interface TypingParticle {
  id: string;
  xOffset: number;
  yStart: number;
  color: string;
}

const TypingParticleItem = React.memo(function TypingParticleItem({
  id,
  xOffset,
  yStart,
  color,
  onComplete,
}: {
  id: string;
  xOffset: number;
  yStart: number;
  color: string;
  onComplete: (id: string) => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onComplete)(id);
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - progress.value) * xOffset },
      { translateY: (1 - progress.value) * yStart - 140 * progress.value },
      { scale: 1 - progress.value * 0.5 },
    ],
    opacity: 1 - progress.value,
  }));

  return (
    <Animated.View
      style={[
        styles.typingParticle,
        animatedStyle,
        { backgroundColor: color, shadowColor: color },
      ]}
    />
  );
});

// Glowing Group Energy Node Circle (Center Graphic)
const GroupEnergyNodeCircle = ({ activeEnergy }: { activeEnergy: EnergyOption | null }) => {
  const pulseAnim = useSharedValue(1);
  const waveRotate = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 2400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    waveRotate.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const themeColor = activeEnergy ? activeEnergy.color : COLORS.purple;
  const themeGlow = activeEnergy ? activeEnergy.glowColor : 'rgba(139, 92, 246, 0.35)';

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    shadowColor: themeColor,
  }));

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotate.value}deg` }],
  }));

  // Avatar positions around the circle (5 nodes)
  const nodePositions: ViewStyle[] = [
    { top: 12, left: '50%', transform: [{ translateX: -16 }] },
    { top: 55, right: 12 },
    { bottom: 22, right: 30 },
    { bottom: 22, left: 30 },
    { top: 55, left: 12 },
  ];

  return (
    <View style={styles.groupCircleWrapper}>
      <Animated.View style={[styles.energyRingBackground, animatedRingStyle, { borderColor: themeColor, shadowColor: themeColor }]} />
      <Animated.View style={[styles.energyWaveArc, animatedWaveStyle, { borderColor: themeGlow }]} />

      <View style={[styles.centerEnergyOrb, { backgroundColor: themeColor, shadowColor: themeColor }]}>
        <Text style={styles.centerOrbEmoji}>{activeEnergy ? activeEnergy.emoji : '🌐'}</Text>
      </View>

      {nodePositions.map((pos, idx) => (
        <View key={idx} style={[styles.avatarNode, pos, { borderColor: themeColor }]}>
          <Ionicons name="person" size={13} color={themeColor} />
        </View>
      ))}
    </View>
  );
};
// Energy Spreading Waves Canvas for Screen 4
const EnergyWaveCanvas = ({ energy }: { energy: EnergyOption }) => {
  const wave1Scale = useSharedValue(0.6);
  const wave2Scale = useSharedValue(0.4);
  const waveOpacity = useSharedValue(0.7);

  useEffect(() => {
    wave1Scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 3200, easing: Easing.out(Easing.cubic) }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    );

    wave2Scale.value = withRepeat(
      withSequence(
        withTiming(2.2, { duration: 4200, easing: Easing.out(Easing.quad) }),
        withTiming(0.4, { duration: 0 })
      ),
      -1,
      false
    );

    waveOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave1Scale.value }],
    opacity: waveOpacity.value,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: wave2Scale.value }],
    opacity: waveOpacity.value * 0.6,
  }));

  return (
    <View style={styles.waveCanvasContainer} pointerEvents="none">
      <Animated.View style={[styles.waveCircle, wave2Style, { borderColor: energy.color }]} />
      <Animated.View style={[styles.waveCircle, wave1Style, { borderColor: energy.color, backgroundColor: energy.glowColor }]} />
    </View>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ObserveGroupEnergyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Navigation / Progress State
  const [screenStep, setScreenStep] = useState<number>(1);
  const [selectedEnergyId, setSelectedEnergyId] = useState<string | null>(null);
  const [observationText, setObservationText] = useState<string>('');
  const [typingParticles, setTypingParticles] = useState<TypingParticle[]>([]);

  // Backend / Sync State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<{ totalPoints: number; streak: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeEnergy = useMemo(() => {
    return ENERGY_OPTIONS.find((e) => e.id === selectedEnergyId) || null;
  }, [selectedEnergyId]);

  // Load existing task progress on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const res = await apiFetch('/api/tasks/observe-group-energy/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.progress) {
            if (data.progress.selectedEnergy) {
              setSelectedEnergyId(data.progress.selectedEnergy);
            }
            if (data.progress.observationText) {
              setObservationText(data.progress.observationText);
            }
            if (data.completed) {
              setScreenStep(5);
            } else if (data.progress.screenStep && data.progress.screenStep > 1) {
              setScreenStep(data.progress.screenStep);
            }
          }
        }
      } catch (err) {
        console.warn('[ObserveGroupEnergy] Error fetching progress:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save progress helper
  const saveProgressToBackend = async (step: number, markCompleted: boolean = false) => {
    try {
      setErrorMessage(null);
      const token = await SecureStore.getItemAsync('token');
      if (!token) return null;

      const payload = {
        selectedEnergy: selectedEnergyId,
        observationText,
        screenStep: step,
      };

      const res = await apiFetch('/api/tasks/observe-group-energy/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: markCompleted,
          progressPayload: payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (markCompleted && data.success) {
          setCompletionData({
            totalPoints: data.totalPoints,
            streak: data.streak,
          });
        }
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Failed to save progress. Please retry.');
      }
    } catch (err) {
      console.error('[ObserveGroupEnergy] Save error:', err);
      setErrorMessage('Network error. Check connection and retry.');
    }
    return null;
  };

  // Screen Handlers
  const handleBeginObservation = () => {
    triggerHaptic('medium');
    setScreenStep(2);
    saveProgressToBackend(2, false);
  };

  const handleSelectEnergy = (id: string) => {
    triggerHaptic('light');
    setSelectedEnergyId(id);
  };

  const handleContinueFromScan = () => {
    if (!selectedEnergyId) return;
    triggerHaptic('medium');
    setScreenStep(3);
    saveProgressToBackend(3, false);
  };

  const handleTypingText = (text: string) => {
    setObservationText(text);
    if (text.length > observationText.length && activeEnergy) {
      const id = Math.random().toString(36).substring(7);
      const xOffset = Math.random() * 120 - 60;
      const yStart = 60 + Math.random() * 30;
      setTypingParticles((prev) => [
        ...prev.slice(-10),
        { id, xOffset, yStart, color: activeEnergy.color },
      ]);
    }
  };

  const handleRemoveParticle = useCallback((id: string) => {
    setTypingParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleChipTap = (chipText: string) => {
    triggerHaptic('light');
    setObservationText((prev) => (prev ? `${prev} ${chipText}` : chipText));
  };

  const handleSaveObservation = () => {
    if (!observationText.trim()) return;
    triggerHaptic('medium');
    setScreenStep(4);
    saveProgressToBackend(4, false);
  };

  const handleContinueToCompletion = async () => {
    triggerHaptic('success');
    setIsSubmitting(true);
    const data = await saveProgressToBackend(5, true);
    setIsSubmitting(false);
    setScreenStep(5);
  };

  const handleFinishAndReturn = () => {
    triggerHaptic('success');
    router.replace({
      pathname: '/(tabs)',
      params: {
        updatedPoints: completionData?.totalPoints?.toString() || '',
        updatedStreak: completionData?.streak?.toString() || '',
      },
    } as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>Opening Group Energy Observation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#080914', '#0F1026', '#080914']} style={StyleSheet.absoluteFill} />

      {/* Dynamic Ambient Background Canvas */}
      <FloatingParticles width={width} height={height} activeColor={activeEnergy?.color} />

      <SafeAreaView style={styles.safeArea}>
        {/* TOP NAVBAR (Screens 1 to 4) */}
        {screenStep < 5 && (
          <View style={styles.navHeader}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                if (screenStep > 1) {
                  setScreenStep((prev) => prev - 1);
                } else {
                  router.back();
                }
              }}
              style={styles.navBackBtn}
              activeOpacity={0.7}
            >
              <Feather name={screenStep === 1 ? 'x' : 'arrow-left'} size={20} color={COLORS.textWhite} />
            </TouchableOpacity>

            {/* Step Indicator */}
            <View style={styles.navStepContainer}>
              <Text style={styles.navStepBadge}>SOCIAL AWARENESS</Text>
              {screenStep > 1 && (
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${((screenStep - 1) / 3) * 100}%` }]} />
                </View>
              )}
            </View>

            <View style={{ width: 40 }} />
          </View>
        )}

        {/* SCREEN 1: INTRODUCTION */}
        {screenStep === 1 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.screenBody}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.heroGraphicContainer}>
                <GroupEnergyNodeCircle activeEnergy={null} />
              </View>

              <View style={styles.heroTextSection}>
                <Text style={styles.heroTitle}>Observe Group Energy</Text>
                <Text style={styles.heroSubtitle}>
                  "Every group has a feeling.{'\n'}Learn to notice the energy without judging it."
                </Text>

                {/* Quote Card */}
                <View style={styles.quoteGlassCard}>
                  <Feather name="shield" size={18} color={COLORS.amber} style={{ marginBottom: 6 }} />
                  <Text style={styles.quoteText}>
                    "Awareness begins when observation replaces reaction."
                  </Text>
                </View>
              </View>

              {/* Begin Observation Button */}
              <TouchableOpacity
                onPress={handleBeginObservation}
                activeOpacity={0.85}
                style={styles.primaryGradientBtn}
              >
                <LinearGradient
                  colors={[COLORS.purple, COLORS.indigo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Begin Observation →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 2: ENERGY SCAN */}
        {screenStep === 2 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>What energy do you notice?</Text>
              <Text style={styles.sectionSubheading}>
                Pause, feel the atmosphere, and select the mood of the room.
              </Text>

              {/* Dynamic Energy Node Centerpiece */}
              <View style={styles.centerScanGraphic}>
                <GroupEnergyNodeCircle activeEnergy={activeEnergy} />
              </View>

              {/* Floating Bubbles Selector Grid */}
              <View style={styles.bubblesGrid}>
                {ENERGY_OPTIONS.map((item) => {
                  const isSelected = selectedEnergyId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleSelectEnergy(item.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.energyBubble,
                        isSelected && {
                          borderColor: item.color,
                          backgroundColor: item.glowColor,
                          transform: [{ scale: 1.05 }],
                          shadowColor: item.color,
                          shadowOpacity: 0.6,
                          shadowRadius: 12,
                          elevation: 6,
                        },
                      ]}
                    >
                      <Text style={styles.bubbleEmoji}>{item.emoji}</Text>
                      <Text style={[styles.bubbleLabel, isSelected && { color: COLORS.textWhite, fontWeight: '700' }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {activeEnergy && (
                <Text style={[styles.energyDescription, { color: activeEnergy.color }]}>
                  {activeEnergy.description}
                </Text>
              )}

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinueFromScan}
                disabled={!selectedEnergyId}
                activeOpacity={0.85}
                style={[
                  styles.primaryGradientBtn,
                  !selectedEnergyId && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={
                    selectedEnergyId && activeEnergy
                      ? activeEnergy.gradient
                      : [COLORS.glassBorder, COLORS.glassBg]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 3: YOUR OBSERVATION */}
        {screenStep === 3 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            {/* Particle Canvas for Typing */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {typingParticles.map((p) => (
                <TypingParticleItem
                  key={p.id}
                  id={p.id}
                  xOffset={p.xOffset}
                  yStart={p.yStart}
                  color={p.color}
                  onComplete={handleRemoveParticle}
                />
              ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Capture What You Noticed</Text>
              <Text style={styles.sectionSubheading}>
                "What did you observe about the group's energy?"
              </Text>

              {/* Selected Energy Chip */}
              {activeEnergy && (
                <View style={[styles.selectedBadgePill, { borderColor: activeEnergy.color, backgroundColor: activeEnergy.glowColor }]}>
                  <Text style={styles.selectedBadgeEmoji}>{activeEnergy.emoji}</Text>
                  <Text style={styles.selectedBadgeText}>Noticing {activeEnergy.label} Energy</Text>
                </View>
              )}

              {/* Glass Reflection Card Text Input */}
              <View style={styles.glassInputCard}>
                <TextInput
                  style={styles.observationTextInput}
                  placeholder="The group felt..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  multiline
                  numberOfLines={4}
                  value={observationText}
                  onChangeText={handleTypingText}
                  maxLength={300}
                  textAlignVertical="top"
                />
                <View style={styles.charCountRow}>
                  <Text style={styles.charCountText}>{observationText.length} / 300</Text>
                </View>
              </View>

              {/* Example Suggestion Chips */}
              <Text style={styles.chipsSectionTitle}>Tap suggestions to add:</Text>
              <View style={styles.suggestionChipsRow}>
                {SUGGESTION_CHIPS.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleChipTap(chip)}
                    activeOpacity={0.7}
                    style={styles.suggestionChip}
                  >
                    <Text style={styles.chipText}>+ {chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Observation Button */}
              <TouchableOpacity
                onPress={handleSaveObservation}
                disabled={!observationText.trim()}
                activeOpacity={0.85}
                style={[
                  styles.primaryGradientBtn,
                  !observationText.trim() && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={
                    observationText.trim() && activeEnergy
                      ? activeEnergy.gradient
                      : [COLORS.purple, COLORS.indigo]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Save Observation →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 4: ENERGY VISUALIZATION */}
        {screenStep === 4 && activeEnergy && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.screenBody}>
            {/* Energy Spreading Wave Visual Canvas */}
            <EnergyWaveCanvas energy={activeEnergy} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Your Observation</Text>
              <Text style={styles.sectionSubheading}>
                The invisible emotional atmosphere you captured.
              </Text>

              {/* Glass Display Reflection Card */}
              <View style={[styles.glassDisplayCard, { borderColor: activeEnergy.color }]}>
                <View style={[styles.badgeDisplayRow, { backgroundColor: activeEnergy.glowColor }]}>
                  <Text style={styles.displayEmoji}>{activeEnergy.emoji}</Text>
                  <Text style={styles.displayTextLabel}>{activeEnergy.label} Energy</Text>
                </View>

                <View style={styles.quoteBlock}>
                  <Text style={styles.quoteSymbol}>“</Text>
                  <Text style={styles.savedObservationText}>{observationText}</Text>
                  <Text style={[styles.quoteSymbol, { alignSelf: 'flex-end' }]}>”</Text>
                </View>

                <View style={styles.cardFooterInfo}>
                  <Feather name="globe" size={14} color={COLORS.textDim} />
                  <Text style={styles.footerText}>Social Awareness Reflection</Text>
                </View>
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              {/* Complete Observation Button */}
              <TouchableOpacity
                onPress={handleContinueToCompletion}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={styles.primaryGradientBtn}
              >
                <LinearGradient
                  colors={activeEnergy.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Complete Task →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* SCREEN 5: SHARED COMPLETION */}
        {screenStep === 5 && (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.completionContainer}>
            <ScrollView contentContainerStyle={styles.completionScroll} showsVerticalScrollIndicator={false}>
              {/* Badge Hero Icon */}
              <View style={styles.completionBadgeCircle}>
                <LinearGradient
                  colors={[COLORS.purple, COLORS.indigo]}
                  style={styles.badgeCircleInner}
                >
                  <Text style={styles.completionEmoji}>🌐✨</Text>
                </LinearGradient>
              </View>

              <Text style={styles.completionWellDone}>Well Done</Text>
              <Text style={styles.completionTaskTitle}>Observe Group Energy</Text>

              {/* Reward & Badge Container */}
              <View style={styles.rewardPillsRow}>
                <View style={styles.rewardPill}>
                  <Ionicons name="sparkles" size={16} color={COLORS.amber} />
                  <Text style={styles.rewardPillText}>+250 Mind Points</Text>
                </View>

                <View style={styles.badgePill}>
                  <Feather name="award" size={15} color={COLORS.cyan} />
                  <Text style={styles.badgePillText}>🌐 Energy Observer</Text>
                </View>
              </View>

              {/* Completion Message Box */}
              <View style={styles.completionQuoteCard}>
                <Text style={styles.completionMessageText}>
                  "You noticed the invisible energy that connects people."
                </Text>
              </View>

              {/* User Observation Summary Card */}
              {activeEnergy && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Captured Summary:</Text>
                  <View style={styles.summaryDetailRow}>
                    <Text style={styles.summaryEmoji}>{activeEnergy.emoji}</Text>
                    <Text style={styles.summaryEnergyName}>{activeEnergy.label} Energy</Text>
                  </View>
                  {observationText ? (
                    <Text style={styles.summaryObservationText}>"{observationText}"</Text>
                  ) : null}
                </View>
              )}

              {/* Continue / Finish Button */}
              <TouchableOpacity
                onPress={handleFinishAndReturn}
                activeOpacity={0.85}
                style={[styles.primaryGradientBtn, { marginTop: 24 }]}
              >
                <LinearGradient
                  colors={[COLORS.purple, COLORS.indigo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textDim,
    fontSize: 15,
    fontWeight: '500',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navStepContainer: {
    alignItems: 'center',
  },
  navStepBadge: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  progressBarTrack: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: 2,
  },
  screenBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // HERO GRAPHIC (SCREEN 1)
  heroGraphicContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCircleWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyRingBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },
  energyWaveArc: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  centerEnergyOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  centerOrbEmoji: {
    fontSize: 32,
  },
  avatarNode: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 16, 38, 0.9)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // HERO TEXTS
  heroTextSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  quoteGlassCard: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginVertical: 8,
  },
  quoteText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },

  // BUTTONS
  primaryGradientBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientBtnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // SCREEN 2 SCAN
  sectionHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sectionSubheading: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  centerScanGraphic: {
    marginVertical: 10,
    alignItems: 'center',
  },
  bubblesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 14,
  },
  energyBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  bubbleEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  bubbleLabel: {
    fontSize: 14,
    color: COLORS.textDim,
    fontWeight: '500',
  },
  energyDescription: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },

  // SCREEN 3 OBSERVATION
  selectedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectedBadgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  selectedBadgeText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  glassInputCard: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  observationTextInput: {
    color: COLORS.textWhite,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 110,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    color: COLORS.textDim,
    fontSize: 12,
  },
  chipsSectionTitle: {
    alignSelf: 'flex-start',
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  suggestionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: COLORS.textDim,
    fontSize: 12,
  },

  // SCREEN 4 VISUALIZATION
  waveCanvasContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
  },
  glassDisplayCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 16, 38, 0.85)',
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 22,
    marginVertical: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  badgeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  displayEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  displayTextLabel: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  quoteBlock: {
    marginVertical: 10,
  },
  quoteSymbol: {
    fontSize: 32,
    color: COLORS.amber,
    fontWeight: '800',
    lineHeight: 28,
  },
  savedObservationText: {
    color: COLORS.textWhite,
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 26,
    marginVertical: 4,
  },
  cardFooterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: COLORS.textDim,
    fontSize: 12,
    marginLeft: 6,
  },
  errorText: {
    color: COLORS.rose,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },

  // PARTICLES
  ambientParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  typingParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // SCREEN 5 COMPLETION
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  completionScroll: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  completionBadgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 20,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  badgeCircleInner: {
    flex: 1,
    borderRadius: 47,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 44,
  },
  completionWellDone: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.amber,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  completionTaskTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 16,
  },
  rewardPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardPillText: {
    color: COLORS.amber,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgePillText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  completionQuoteCard: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  completionMessageText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryTitle: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  summaryEnergyName: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryObservationText: {
    color: COLORS.textDim,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
