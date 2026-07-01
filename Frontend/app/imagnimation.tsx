import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, TextInput, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS,
  interpolate, Easing, useAnimatedProps
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0B0914', // Deep space-black
  blue: '#38BDF8', // Camera facts highlight
  purple: '#A78BFA', // Brain stories highlight
  lavender: '#C4B5FD', // Lavender highlight
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBrd: 'rgba(255, 255, 255, 0.12)',
  textLight: 'rgba(255, 255, 255, 0.65)',
  textMid: 'rgba(255, 255, 255, 0.88)'
};

type ScreenState = 'welcome' | 'thought' | 'camera' | 'brain' | 'compare' | 'insight' | 'anchor' | 'success';

// ── Particle Component ───────────────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.4);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-30 - delay * 0.05, { duration: 3200 + delay }),
      withTiming(10, { duration: 3200 + delay })
    ), -1, true);

    op.value = withRepeat(withSequence(
      withTiming(0.8, { duration: 2000 + delay }),
      withTiming(0.2, { duration: 2000 + delay })
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
function GradBtn({ label, onPress, disabled, colors }: { label: string; onPress: () => void; disabled?: boolean; colors?: [string, string] }) {
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
          colors={disabled ? ['#2D273D', '#1A1726'] : (colors || [C.blue, '#0284C7'])}
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

// ── MAIN SCREEN COMPONENT ────────────────────────────────────────────────
export default function BrainVsCameraScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [thought, setThought] = useState('');
  
  // List arrays
  const [facts, setFacts] = useState<string[]>([]);
  const [stories, setStories] = useState<string[]>([]);
  
  // Input fields
  const [factInput, setFactInput] = useState('');
  const [storyInput, setStoryInput] = useState('');

  // Reanimated Animation Values
  const shutterYTop = useSharedValue(-height / 2);
  const shutterYBottom = useSharedValue(height / 2);
  const reticleScale = useSharedValue(1);
  const brainPulse = useSharedValue(1);

  // SVG insight animated value
  const svgProgress = useSharedValue(0);

  // Screen 7 float away story translation
  const storyFloatY = useSharedValue(0);
  const storyFloatOpacity = useSharedValue(1);

  // Setup loop animations
  useEffect(() => {
    reticleScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(0.95, { duration: 1200 })
      ),
      -1,
      true
    );

    brainPulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    try { Haptics.impactAsync(style); } catch (e) {}
  };

  const triggerShutterTransition = (nextScreen: ScreenState) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    // Slide shutter closed
    shutterYTop.value = withTiming(0, { duration: 350 });
    shutterYBottom.value = withTiming(0, { duration: 350 }, (finished) => {
      if (finished) {
        runOnJS(setScreen)(nextScreen);
        // Slide shutter open
        shutterYTop.value = withTiming(-height / 2, { duration: 450 });
        shutterYBottom.value = withTiming(height / 2, { duration: 450 });
      }
    });
  };

  const addFact = () => {
    if (!factInput.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFacts([...facts, factInput.trim()]);
    setFactInput('');
  };

  const addStory = () => {
    if (!storyInput.trim()) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setStories([...stories, storyInput.trim()]);
    setStoryInput('');
  };

  // Screen 6 insight trigger
  useEffect(() => {
    if (screen === 'insight') {
      svgProgress.value = 0;
      svgProgress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) });
    }
  }, [screen]);

  // Screen 7 animation trigger
  const triggerAnchorFloat = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    storyFloatY.value = withTiming(-400, { duration: 3500, easing: Easing.inOut(Easing.ease) });
    storyFloatOpacity.value = withTiming(0, { duration: 3200 });
  };

  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_name: 'Brain vs Camera', points: 500 }),
      });
    } catch (e) {
      console.error('completeTask error:', e);
    }
  };

  const handleReturnHome = () => {
    completeTask();
    router.replace('/(tabs)' as any);
  };

  // Reanimated style definitions
  const animatedShutterTop = useAnimatedStyle(() => ({
    transform: [{ translateY: shutterYTop.value }]
  }));

  const animatedShutterBottom = useAnimatedStyle(() => ({
    transform: [{ translateY: shutterYBottom.value }]
  }));

  const animatedReticle = useAnimatedStyle(() => ({
    transform: [{ scale: reticleScale.value }]
  }));

  const animatedBrain = useAnimatedStyle(() => ({
    transform: [{ scale: brainPulse.value }]
  }));

  const floatAwayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: storyFloatY.value }],
    opacity: storyFloatOpacity.value
  }));

  // Svg circular arc calculations
  const totalEntries = Math.max(facts.length + stories.length, 1);
  const factPercentage = facts.length / totalEntries;
  const clarityScore = Math.round(factPercentage * 100);

  // SVG stroke details
  const radius = 60;
  const strokeWidth = 10;
  const circum = 2 * Math.PI * radius; // 377

  const animatedSvgProps = useAnimatedProps(() => {
    const strokeDashoffset = circum - (svgProgress.value * factPercentage) * circum;
    return {
      strokeDashoffset
    };
  });

  // ──────── SCREEN 1 — WELCOME SCREEN ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F0C1B', '#1B1437', '#0A0612']} style={StyleSheet.absoluteFillObject} />

        {/* Floating Particles */}
        {[
          { x: 30, y: 150, size: 5, color: '#38BDF8', delay: 100 },
          { x: width - 70, y: 220, size: 4, color: '#A78BFA', delay: 400 },
          { x: 60, y: 390, size: 6, color: '#C4B5FD', delay: 800 },
          { x: width - 110, y: 460, size: 5, color: '#0284C7', delay: 300 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            {/* Split Illustration */}
            <Animated.View entering={FadeInDown.duration(900)} style={styles.welcomeGraphicContainer}>
              <LinearGradient 
                colors={['rgba(56, 189, 248, 0.1)', 'rgba(167, 139, 250, 0.1)']} 
                style={styles.graphicCircleBg} 
              />
              <View style={styles.splitGraphicRow}>
                {/* Camera Left */}
                <View style={styles.graphicHalfCamera}>
                  <Ionicons name="camera-outline" size={82} color={C.blue} />
                </View>
                {/* Brain Right */}
                <View style={styles.graphicHalfBrain}>
                  <MaterialCommunityIcons name="brain" size={82} color={C.purple} />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.welcomeIntro}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🧠 Cognitive Reframing</Text>
              </View>
              <Text style={styles.welcomeTitle}>Brain vs Camera</Text>
              <Text style={styles.welcomeSubtitle}>
                Sometimes our brain adds a story to what actually happened. Learn to separate objective reality from mental narratives.
              </Text>
            </Animated.View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Begin" 
                onPress={() => setScreen('thought')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 2 — ENTER WORRYING THOUGHT ────────
  if (screen === 'thought') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0C0A19', '#17112C', '#07050E']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Describe Worry</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>What's bothering you?</Text>
                  <Text style={styles.writeSubtitle}>Write the situation or thought exactly as it is weighing on your mind.</Text>
                </Animated.View>

                {/* Thought Input Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.worryCard}>
                  <Text style={styles.worryCardLabel}>💭 Your Thought</Text>
                  <TextInput
                    style={styles.worryInput}
                    multiline
                    numberOfLines={5}
                    placeholder="My friend didn't reply to my message..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={thought}
                    onChangeText={setThought}
                    maxLength={200}
                  />
                  <Text style={styles.worryCharCount}>{thought.length} / 200</Text>
                </Animated.View>
              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Continue →" 
                  onPress={() => triggerShutterTransition('camera')} 
                  disabled={!thought.trim()} 
                  colors={[C.blue, C.purple]}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 3 — CAMERA MODE (Facts Collection) ────────
  if (screen === 'camera') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#060B18', '#0A1835', '#040712']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setScreen('thought')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.blue }]}>Camera Mode 📷</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>If a camera recorded this moment, what would it capture?</Text>
                  <Text style={[styles.writeSubtitle, { color: 'rgba(56, 189, 248, 0.7)' }]}>
                    List only objective facts. Things anyone could observe. No guesses.
                  </Text>
                </Animated.View>

                {/* Camera Framed View */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.cameraBoxContainer}>
                  {/* Camera Reticle corners outline */}
                  <Animated.View style={[styles.cameraReticle, animatedReticle]}>
                    <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
                    <View style={[styles.reticleCorner, styles.reticleTopRight]} />
                    <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
                    <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
                  </Animated.View>

                  {/* List of facts entered */}
                  <View style={styles.factsList}>
                    {facts.length === 0 ? (
                      <Text style={styles.listPlaceholder}>No facts logged yet. Enter one below.</Text>
                    ) : (
                      facts.map((fact, index) => (
                        <Animated.View key={index} entering={FadeInDown} style={styles.factItem}>
                          <Ionicons name="checkmark-circle-outline" size={18} color={C.blue} style={{ marginRight: 8 }} />
                          <Text style={styles.factText}>{fact}</Text>
                        </Animated.View>
                      ))
                    )}
                  </View>
                </Animated.View>

                {/* Dynamic Fact Input Form */}
                <View style={styles.listBuilderForm}>
                  <TextInput
                    style={styles.builderInput}
                    placeholder="e.g., I sent a message. It has been 8 hours."
                    placeholderTextColor="rgba(56, 189, 248, 0.3)"
                    value={factInput}
                    onChangeText={setFactInput}
                    onSubmitEditing={addFact}
                  />
                  <TouchableOpacity onPress={addFact} style={[styles.builderAddBtn, { backgroundColor: C.blue }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Next →" 
                  onPress={() => triggerShutterTransition('brain')} 
                  disabled={facts.length === 0} 
                  colors={[C.blue, '#0284C7']}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 4 — BRAIN MODE (Stories Collection) ────────
  if (screen === 'brain') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0F071C', '#1D0A35', '#0A0412']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardContainer}>
            <View style={styles.responsiveContainer}>
              
              <View style={styles.header}>
                <TouchableOpacity onPress={() => triggerShutterTransition('camera')} style={styles.glassBackBtn}>
                  <Feather name="chevron-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.purple }]}>Brain Mode 🧠</Text>
                <View style={{ width: 44 }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>Now, what story did your mind create?</Text>
                  <Text style={[styles.writeSubtitle, { color: 'rgba(167, 139, 250, 0.7)' }]}>
                    List thoughts, assumptions, guesses, worries, or predictions.
                  </Text>
                </Animated.View>

                {/* Brain cloud display */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.brainBoxContainer}>
                  {/* Pulsing brain icon */}
                  <Animated.View style={[styles.brainPulseWrapper, animatedBrain]}>
                    <MaterialCommunityIcons name="brain" size={48} color="rgba(167, 139, 250, 0.25)" />
                  </Animated.View>

                  {/* List of stories entered */}
                  <View style={styles.factsList}>
                    {stories.length === 0 ? (
                      <Text style={styles.listPlaceholder}>No narratives logged yet. Enter one below.</Text>
                    ) : (
                      stories.map((story, index) => (
                        <Animated.View key={index} entering={FadeInDown} style={styles.storyItem}>
                          <Ionicons name="help-circle-outline" size={18} color={C.purple} style={{ marginRight: 8 }} />
                          <Text style={styles.storyText}>{story}</Text>
                        </Animated.View>
                      ))
                    )}
                  </View>
                </Animated.View>

                {/* Dynamic Story Input Form */}
                <View style={styles.listBuilderForm}>
                  <TextInput
                    style={styles.builderInput}
                    placeholder="e.g., They are ignoring me. They're angry."
                    placeholderTextColor="rgba(167, 139, 250, 0.3)"
                    value={storyInput}
                    onChangeText={setStoryInput}
                    onSubmitEditing={addStory}
                  />
                  <TouchableOpacity onPress={addStory} style={[styles.builderAddBtn, { backgroundColor: C.purple }]}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.actionBlock}>
                <GradBtn 
                  label="Continue →" 
                  onPress={() => setScreen('compare')} 
                  disabled={stories.length === 0} 
                  colors={[C.purple, '#7C3AED']}
                />
              </View>

            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Shutter panel slide overlays */}
        <Animated.View style={[styles.shutterHalf, styles.shutterTop, animatedShutterTop]} />
        <Animated.View style={[styles.shutterHalf, styles.shutterBottom, animatedShutterBottom]} />
      </View>
    );
  }

  // ──────── SCREEN 5 — COMPARE ────────
  if (screen === 'compare') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0A0914', '#15112B', '#080510']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('brain')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Reality vs Story</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Let's compare them side-by-side</Text>
                <Text style={styles.writeSubtitle}>Look at the difference between what was observed and what was imagined.</Text>
              </Animated.View>

              {/* Side by side cards */}
              <View style={styles.compareContainer}>
                
                {/* Reality Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={[styles.compareCard, styles.compareRealityCard]}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="camera-outline" size={20} color={C.blue} style={{ marginRight: 6 }} />
                    <Text style={[styles.compareCardTitle, { color: C.blue }]}>Reality (Camera)</Text>
                  </View>
                  <View style={styles.dividerBlue} />
                  {facts.map((fact, index) => (
                    <Text key={index} style={styles.compareTextLine}>✓ {fact}</Text>
                  ))}
                </Animated.View>

                {/* Story Card */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={[styles.compareCard, styles.compareStoryCard]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="brain" size={20} color={C.purple} style={{ marginRight: 6 }} />
                    <Text style={[styles.compareCardTitle, { color: C.purple }]}>Story (Brain)</Text>
                  </View>
                  <View style={styles.dividerPurple} />
                  {stories.map((story, index) => (
                    <Text key={index} style={styles.compareTextLine}>☁️ {story}</Text>
                  ))}
                </Animated.View>

              </View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Show Insight" 
                onPress={() => setScreen('insight')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 6 — INSIGHT METER (Concentric Circular SVG and Blur) ────────
  if (screen === 'insight') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#090914', '#15112B', '#080510']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('compare')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Insight Meter</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Here's what we found</Text>
              </Animated.View>

              {/* Concentric Circular Progress Dial */}
              <View style={styles.svgContainer}>
                <Svg width={160} height={160} viewBox="0 0 160 160">
                  <G rotation="-90" origin="80, 80">
                    {/* Background Circle */}
                    <Circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />

                    {/* Reality stroke arc */}
                    <AnimatedCircle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke={C.blue}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circum}
                      animatedProps={animatedSvgProps}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </G>
                </Svg>

                <View style={styles.svgCenterLabel}>
                  <Text style={styles.svgCenterNum}>{clarityScore}%</Text>
                  <Text style={styles.svgCenterTxt}>Clarity</Text>
                </View>
              </View>

              {/* Meter Stats Box */}
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: C.blue }]}>Camera Facts</Text>
                  <Text style={styles.metricVal}>{facts.length}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: C.purple }]}>Brain Stories</Text>
                  <Text style={styles.metricVal}>{stories.length}</Text>
                </View>
              </Animated.View>

              {/* Side comparison with visual focus (Facts sharp, stories blurred) */}
              <View style={styles.focusContainer}>
                <View style={[styles.focusCard, styles.focusRealityCard]}>
                  <Text style={[styles.focusTitle, { color: C.blue }]}>📷 Reality (Sharp)</Text>
                  <Text style={styles.focusBody} numberOfLines={2}>"{facts[0]}"</Text>
                </View>
                
                {/* Blurred Story card */}
                <View style={[styles.focusCard, styles.focusStoryCard, { opacity: 0.35 }]}>
                  <Text style={[styles.focusTitle, { color: C.purple }]}>🧠 Story (Blurred)</Text>
                  <Text style={[styles.focusBody, styles.textBlurred]} numberOfLines={2}>"{stories[0]}"</Text>
                </View>
              </View>

              <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.insightBox}>
                <Text style={styles.insightText}>
                  Your brain tried to explain uncertainty by creating a story. That doesn't make the story true.
                </Text>
              </Animated.View>

            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Continue" 
                onPress={() => setScreen('anchor')} 
                colors={[C.blue, C.purple]} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 7 — REALITY ANCHOR (Float Away Story Animation) ────────
  if (screen === 'anchor') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#090914', '#15112B', '#080510']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('insight')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Clarity Anchor</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Return to what you know</Text>
                <Text style={styles.writeSubtitle}>Watch the worries dissolve, leaving only clear facts.</Text>
              </Animated.View>

              <View style={styles.anchorWrapper}>
                
                {/* Stories floating away */}
                <Animated.View style={[styles.anchorStoryColumn, floatAwayStyle]}>
                  <Text style={styles.anchorColHeader}>🧠 Narrative Stories</Text>
                  {stories.map((story, i) => (
                    <View key={i} style={styles.storyBubble}>
                      <Text style={styles.storyBubbleText}>☁️ {story}</Text>
                    </View>
                  ))}
                </Animated.View>

                {/* Facts remaining anchored */}
                <View style={styles.anchorRealityColumn}>
                  <Text style={styles.anchorColHeader}>📷 Grounded Facts</Text>
                  {facts.map((fact, i) => (
                    <View key={i} style={styles.factBubble}>
                      <Text style={styles.factBubbleText}>✅ {fact}</Text>
                    </View>
                  ))}
                </View>

              </View>

              {/* Separation text */}
              <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.adviceBanner}>
                <Text style={styles.adviceBannerHeader}>Separating Facts vs Stories</Text>
                <Text style={styles.adviceBannerBody}>
                  Facts give clarity. Stories create possibilities—not certainty.
                </Text>
              </Animated.View>
            </ScrollView>

            <View style={styles.actionBlock}>
              {storyFloatOpacity.value === 1 ? (
                <GradBtn label="Let Stories Go" onPress={triggerAnchorFloat} colors={['#A78BFA', '#7C3AED']} />
              ) : (
                <GradBtn label="Finish" onPress={() => setScreen('success')} colors={[C.blue, '#0284C7']} />
              )}
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 8 — FINAL SUCCESS SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(56, 189, 248, 0.18)', 'rgba(10, 6, 22, 0.95)', '#0B0914']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.responsiveContainer}>
          
          <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
            
            <Animated.View entering={FadeInDown.duration(900)} style={styles.completeHeader}>
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.badgeSuccessText}>Reality Check Completed</Text>
              </View>
              <Text style={styles.completeTitle}>Great Job</Text>
              <Text style={styles.completeSubtitle}>
                You successfully separated what happened from the story your mind imagined.
              </Text>
            </Animated.View>

            {/* Statistics Row Grid */}
            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.statsSummaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>📷 Facts Found</Text>
                <Text style={[styles.summaryVal, { color: C.blue }]}>{facts.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>🧠 Stories Identified</Text>
                <Text style={[styles.summaryVal, { color: C.purple }]}>{stories.length}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>✨ Clarity Score</Text>
                <Text style={styles.summaryVal}>{clarityScore}%</Text>
              </View>
            </Animated.View>

            {/* Achievement advice */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.quoteBanner}>
              <Text style={styles.quoteBannerText}>
                "Separate what actually happened from the meaning you assign to it."
              </Text>
            </Animated.View>

          </ScrollView>

          <View style={styles.actionBlock}>
            <GradBtn label="Done" onPress={handleReturnHome} colors={[C.blue, C.purple]} />
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ── SVG Reanimated Binding ───────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Stylesheets ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg
  },
  safeArea: {
    flex: 1
  },
  keyboardContainer: {
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
  welcomeGraphicContainer: {
    marginTop: height * 0.06,
    height: height * 0.26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  graphicCircleBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.6,
    zIndex: -1
  },
  splitGraphicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 170,
    justifyContent: 'space-between'
  },
  graphicHalfCamera: {
    width: 85,
    overflow: 'hidden',
    alignItems: 'flex-end',
    paddingRight: 6
  },
  graphicHalfBrain: {
    width: 85,
    overflow: 'hidden',
    alignItems: 'flex-start',
    paddingLeft: 6
  },
  welcomeIntro: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
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
    paddingBottom: 24,
    paddingHorizontal: 4
  },
  writeHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  writeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28
  },
  writeSubtitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 20
  },
  worryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative'
  },
  worryCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.purple,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10
  },
  worryInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFF',
    minHeight: 120,
    paddingTop: 8,
    textAlignVertical: 'top'
  },
  worryCharCount: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600'
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },

  // Camera screen styles
  cameraBoxContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    padding: 20,
    position: 'relative',
    marginBottom: 16
  },
  cameraReticle: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    pointerEvents: 'none'
  },
  reticleCorner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: C.blue,
  },
  reticleTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2
  },
  reticleTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2
  },
  reticleBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2
  },
  reticleBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2
  },
  factsList: {
    width: '100%',
    zIndex: 2
  },
  listPlaceholder: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)'
  },
  factText: {
    color: C.textMid,
    fontSize: 14,
    flex: 1
  },
  listBuilderForm: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
    marginBottom: 10
  },
  builderInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBrd,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 14,
    marginRight: 10
  },
  builderAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3
  },

  // Brain screen styles
  brainBoxContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: 'rgba(167, 139, 250, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    padding: 20,
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center'
  },
  brainPulseWrapper: {
    position: 'absolute',
    top: 14,
    right: 18,
    opacity: 0.7
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    width: '100%'
  },
  storyText: {
    color: C.textMid,
    fontSize: 14,
    flex: 1
  },

  // Shutter panels styles
  shutterHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#07050E',
    height: height / 2,
    zIndex: 999,
  },
  shutterTop: {
    top: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#241B3E'
  },
  shutterBottom: {
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#241B3E'
  },

  // Compare screen styles
  compareContainer: {
    width: '100%',
    flexDirection: Platform.OS === 'web' && width > 500 ? 'row' : 'column',
    justifyContent: 'space-between',
    marginTop: 10
  },
  compareCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16
  },
  compareRealityCard: {
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginRight: Platform.OS === 'web' && width > 500 ? 10 : 0
  },
  compareStoryCard: {
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginLeft: Platform.OS === 'web' && width > 500 ? 10 : 0
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  compareCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  dividerBlue: {
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    width: '100%',
    marginBottom: 12
  },
  dividerPurple: {
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    width: '100%',
    marginBottom: 12
  },
  compareTextLine: {
    color: C.textMid,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },

  // Svg circular container
  svgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative'
  },
  svgCenterLabel: {
    position: 'absolute',
    alignItems: 'center'
  },
  svgCenterNum: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900'
  },
  svgCenterTxt: {
    color: C.textLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 5
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  metricVal: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900'
  },
  focusContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  focusCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 5
  },
  focusRealityCard: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  focusStoryCard: {
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  focusTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  focusBody: {
    color: C.textLight,
    fontSize: 13,
    lineHeight: 18
  },
  textBlurred: {
    // Simulated blur styling on elements
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    color: 'transparent'
  },
  insightBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 16,
    width: '100%',
    marginBottom: 10
  },
  insightText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  // Screen 7 Anchor styles
  anchorWrapper: {
    width: '100%',
    height: 320,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 16
  },
  anchorColHeader: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: 'center'
  },
  anchorStoryColumn: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16
  },
  anchorRealityColumn: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16
  },
  storyBubble: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    marginBottom: 6,
    maxWidth: '85%'
  },
  storyBubbleText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: '500'
  },
  factBubble: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 6,
    maxWidth: '85%'
  },
  factBubbleText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '600'
  },
  adviceBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  adviceBannerHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: C.lavender || '#C4B5FD',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4
  },
  adviceBannerBody: {
    color: C.textMid,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic'
  },

  // Final Success styles
  completeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: height * 0.05
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
  statsSummaryBox: {
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
  summaryLabel: {
    color: C.textMid,
    fontSize: 14,
    fontWeight: '700'
  },
  summaryVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '100%',
    marginVertical: 10
  },
  quoteBanner: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 20,
    width: '100%'
  },
  quoteBannerText: {
    color: C.purple,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24
  },

  // Button generic styles
  gradBtnWrap: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowColor: C.blue,
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
