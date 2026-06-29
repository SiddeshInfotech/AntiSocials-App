import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0B071E',
  sunsetStart: '#E0A96D',
  sunsetEnd: '#201A30',
  purple: '#7C3AED',
  violet: '#8B5CF6',
  indigo: '#4F46E5',
  lavender: '#C4B5FD',
  gold: '#F59E0B',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBrd: 'rgba(255, 255, 255, 0.15)',
  textLight: 'rgba(255, 255, 255, 0.6)',
  textMid: 'rgba(255, 255, 255, 0.85)',
};

type ScreenState = 'welcome' | 'prepare' | 'session' | 'complete';

const SLIDE_DURATION_SECONDS = 112.5; // 15 mins total = 900 seconds. 900 / 8 slides = 112.5s
const TOTAL_DURATION_SECONDS = 900;   // 15 minutes

const SLIDES = [
  {
    image: require('../assets/images/download.png'),
    audio: require('../assets/videos/mixkit-forest-treasure-138.mp3'),
    quote: "Thoughts are like clouds. Let them pass."
  },
  {
    image: require('../assets/images/download (1).png'),
    audio: require('../assets/videos/mixkit-rest-now-584.mp3'),
    quote: "You are the observer, not the thought."
  },
  {
    image: require('../assets/images/download (2).png'),
    audio: require('../assets/videos/mixkit-relaxation-05-749.mp3'),
    quote: "Breathe deeply. Everything is okay."
  },
  {
    image: require('../assets/images/download (3).png'),
    audio: require('../assets/videos/mixkit-relax-beat-292.mp3'),
    quote: "Peace begins within."
  },
  {
    image: require('../assets/images/download (4).png'),
    audio: require('../assets/videos/mixkit-spirit-in-the-woods-139.mp3'),
    quote: "Notice your thoughts without judgment."
  },
  {
    image: require('../assets/images/download (5).png'),
    audio: require('../assets/videos/mixkit-classical-vibes-2-682.mp3'),
    quote: "Every breath brings a new beginning."
  },
  {
    image: require('../assets/images/download (6).png'),
    audio: require('../assets/videos/mixkit-meditation-441.mp3'),
    quote: "Calmness is your natural state."
  },
  {
    image: require('../assets/images/download (7).png'),
    audio: require('../assets/videos/mixkit-thinking-about-you-234.mp3'),
    quote: "This moment is enough."
  }
];

// ── Floating Light Particles ─────────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.4);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-30 - delay * 0.05, { duration: 3000 + delay }),
      withTiming(10, { duration: 3000 + delay })
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
function GradBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[styles.gradBtnWrap, s]}>
      <Pressable
        onPressIn={() => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){} sc.value = withSpring(0.96); }}
        onPressOut={() => { sc.value = withSpring(1); }}
        onPress={onPress}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={disabled ? ['#3D3D5C', '#2D2D4E'] : [C.violet, C.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={[styles.gradBtnText, disabled && { color: 'rgba(255,255,255,0.3)' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MAIN SCREEN COMPONENT ────────────────────────────────────────────────
export default function ObserveThoughtsScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ken Burns & slide fade animations
  const slideOpacity = useSharedValue(1);
  const zoomScale = useSharedValue(1);

  // Breathing animation guide values
  const breathScale = useSharedValue(1);
  const breathGlow = useSharedValue(0.5);

  // 1. Audio setup & playback controller
  const loadAndPlayTrack = async (index: number, playImmediate: boolean = true) => {
    try {
      setIsAudioLoading(true);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        SLIDES[index].audio,
        {
          shouldPlay: playImmediate && isPlaying,
          volume: volume,
          isLooping: true
        }
      );
      soundRef.current = sound;
      setIsAudioLoading(false);
    } catch (err) {
      console.error('Audio load error:', err);
      setIsAudioLoading(false);
    }
  };

  // Trigger task completions
  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_name: 'Observe Thoughts', points: 500 }),
      });
    } catch (e) {
      console.error('completeTask error:', e);
    }
  };

  // Start breathing animation
  useEffect(() => {
    if (screen === 'prepare') {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 4000 }),
          withTiming(0.95, { duration: 4000 })
        ),
        -1,
        true
      );
      breathGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000 }),
          withTiming(0.35, { duration: 4000 })
        ),
        -1,
        true
      );
    } else {
      breathScale.value = 1;
      breathGlow.value = 0.5;
    }
  }, [screen]);

  // Load and play audio when the active slide changes
  useEffect(() => {
    if (screen === 'session') {
      loadAndPlayTrack(currentSlide);
      // Reset zoom scale
      zoomScale.value = 1;
      zoomScale.value = withTiming(1.15, { duration: SLIDE_DURATION_SECONDS * 1000 });
      
      // Fade in slide
      slideOpacity.value = 0;
      slideOpacity.value = withTiming(1, { duration: 1000 });
    }
  }, [currentSlide, screen]);

  // Manage timer progress & autoplay logic
  useEffect(() => {
    if (screen === 'session' && isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 1;
          // Progress-based slide selection
          const computedSlideIndex = Math.min(
            SLIDES.length - 1,
            Math.floor(next / SLIDE_DURATION_SECONDS)
          );

          if (computedSlideIndex !== currentSlide) {
            // Smoothly crossfade slide content
            slideOpacity.value = withTiming(0, { duration: 500 }, (finished) => {
              if (finished) {
                runOnJS(setCurrentSlide)(computedSlideIndex);
              }
            });
          }

          if (next >= TOTAL_DURATION_SECONDS) {
            // End session
            clearInterval(progressTimerRef.current!);
            runOnJS(handleSessionEnd)();
          }

          // Periodic progress saving
          if (next % 10 === 0) {
            runOnJS(saveProgressLocally)(next);
          }

          return next;
        });
      }, 1000);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [screen, isPlaying, currentSlide]);

  const handleSessionEnd = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    await SecureStore.deleteItemAsync('observe_thoughts_progress');
    setScreen('complete');
    completeTask();
  };

  const saveProgressLocally = async (time: number) => {
    try {
      await SecureStore.setItemAsync('observe_thoughts_progress', String(time));
    } catch (e) {}
  };

  // Try to restore session on mount
  useEffect(() => {
    const restoreProgress = async () => {
      try {
        const saved = await SecureStore.getItemAsync('observe_thoughts_progress');
        if (saved) {
          const time = parseInt(saved);
          if (time > 0 && time < TOTAL_DURATION_SECONDS) {
            setElapsedTime(time);
            setCurrentSlide(Math.floor(time / SLIDE_DURATION_SECONDS));
            setScreen('session');
          }
        }
      } catch (e) {}
    };
    restoreProgress();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {}
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const nextSlide = currentSlide + 1;
      slideOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(changeSlideExplicitly)(nextSlide);
        }
      });
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      slideOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(changeSlideExplicitly)(prevSlide);
        }
      });
    }
  };

  const changeSlideExplicitly = (index: number) => {
    setCurrentSlide(index);
    setElapsedTime(Math.round(index * SLIDE_DURATION_SECONDS));
  };

  const handleVolumeChange = async () => {
    const nextVolume = volume >= 0.9 ? 0.1 : volume + 0.2;
    setVolume(nextVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(nextVolume);
    }
  };

  const handleReturnHome = () => {
    router.replace('/(tabs)' as any);
  };

  // Time format helper (MM:SS)
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Reanimated style bindings
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomScale.value }]
  }));
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: slideOpacity.value
  }));
  const breatheCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }]
  }));
  const breatheGlowStyle = useAnimatedStyle(() => ({
    opacity: breathGlow.value
  }));

  // ──────── WELCOME SCREEN ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#FF8E53', '#A83279', '#1C0C30']} style={StyleSheet.absoluteFillObject} />

        {/* Calming Particles */}
        {[
          { x: 40, y: 150, size: 6, color: '#FFD3B6', delay: 0 },
          { x: width - 80, y: 220, size: 4, color: '#FFAAA6', delay: 400 },
          { x: 80, y: 350, size: 5, color: '#C4B5FD', delay: 800 },
          { x: width - 100, y: 480, size: 6, color: '#D4AF37', delay: 200 },
          { x: 150, y: height * 0.58, size: 5, color: '#FF8E53', delay: 600 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentWrap}>
            
            <Animated.View entering={FadeInDown.duration(1000)} style={styles.welcomeIntro}>
              <View style={styles.sessionBadge}>
                <Text style={styles.badgeText}>🧘 Mindfulness Session</Text>
              </View>
              <Text style={styles.welcomeTitle}>Observe{'\n'}Thoughts</Text>
              <Text style={styles.welcomeSubtitle}>🧠 Medium  •  15 Minutes</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.quoteBox}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.motivationalText}>
                Thoughts come and go like clouds.{'\n'}There is nothing to control.{'\n'}Nothing to fix.{'\n'}Just observe.
              </Text>
              <Text style={[styles.quoteMark, { textAlign: 'right', marginTop: -15 }]}>”</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.actionWrap}>
              <GradBtn label="Begin Session" onPress={() => setScreen('prepare')} />
            </Animated.View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── PREPARE SCREEN ────────
  if (screen === 'prepare') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#1F1C2C', '#3A6073', '#1F1C2C']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Preparation</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.prepareScroll} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(800)} style={styles.breathCardWrap}>
              <Animated.View style={[styles.breatheCircleOuter, breatheCircleStyle]}>
                <Animated.View style={[styles.breatheGlow, breatheGlowStyle]} />
                <LinearGradient colors={[C.violet, '#22D3EE', C.indigo]} style={styles.breatheRing}>
                  <View style={styles.breatheInner}>
                    <Text style={styles.breatheText}>Breathe</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.instructionsCard}>
              <Text style={styles.instructTitle}>Prepare Yourself</Text>
              {[
                "Find a comfortable place to sit.",
                "Gently relax your shoulders.",
                "Take a slow, deep breath in and let it go.",
                "If you feel comfortable, gently close your eyes.",
                "Let every thought come and go naturally."
              ].map((text, i) => (
                <View key={i} style={styles.instructRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.instructText}>{text}</Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>

          <View style={styles.fixedFooter}>
            <GradBtn label="Start Meditation" onPress={() => setScreen('session')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SESSION SCREEN ────────
  if (screen === 'session') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        {/* Slow cinematic Ken Burns background */}
        <View style={StyleSheet.absoluteFill}>
          <Animated.Image
            source={SLIDES[currentSlide].image}
            style={[StyleSheet.absoluteFill, zoomStyle]}
            resizeMode="cover"
          />
          {/* Subtle color grading overlay */}
          <LinearGradient
            colors={['rgba(11,7,30,0.4)', 'rgba(0,0,0,0.15)', 'rgba(11,7,30,0.65)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Particle layers overlaying the slide */}
        {[
          { x: 30, y: 180, size: 5, color: 'rgba(255,255,255,0.4)', delay: 100 },
          { x: width - 60, y: 280, size: 4, color: 'rgba(255,255,255,0.3)', delay: 500 },
          { x: 100, y: 440, size: 6, color: '#C4B5FD', delay: 900 },
          { x: width - 110, y: 150, size: 5, color: '#FCD34D', delay: 300 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          {/* Top Panel — Progress & Exit */}
          <View style={styles.sessionHeader}>
            <TouchableOpacity
              onPress={async () => {
                if (soundRef.current) await soundRef.current.pauseAsync();
                router.back();
              }}
              style={styles.glassBackBtn}
            >
              <Feather name="x" size={20} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.progressTextWrap}>
              <Text style={styles.elapsedLabel}>
                {formatTime(elapsedTime)} / {formatTime(TOTAL_DURATION_SECONDS)}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Clean Thin Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(elapsedTime / TOTAL_DURATION_SECONDS) * 100}%` }]} />
            </View>
          </View>

          {/* Quote display inside premium glassmorphism layout */}
          <View style={styles.slideBody}>
            <Animated.View style={[styles.glassQuoteCard, fadeStyle]}>
              <Text style={styles.slideQuote}>“ {SLIDES[currentSlide].quote} ”</Text>
            </Animated.View>
          </View>

          {/* Floating Glassmorphic Audio Controls */}
          <View style={styles.glassControlsRow}>
            <View style={styles.glassControlsContainer}>
              <TouchableOpacity onPress={handlePrev} disabled={currentSlide === 0} style={styles.controlBtn}>
                <Ionicons name="play-back" size={24} color={currentSlide === 0 ? "rgba(255,255,255,0.25)" : "#FFF"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePlayPause} style={styles.controlPlayBtn}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNext} disabled={currentSlide === SLIDES.length - 1} style={styles.controlBtn}>
                <Ionicons name="play-forward" size={24} color={currentSlide === SLIDES.length - 1 ? "rgba(255,255,255,0.25)" : "#FFF"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleVolumeChange} style={styles.controlBtn}>
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name={volume === 0.1 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"} size={22} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── COMPLETION SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#FF8E53', '#A83279', '#1C0C30']} style={StyleSheet.absoluteFillObject} />

      {[
        { x: 30, y: 100, size: 5, color: '#FFF', delay: 200 },
        { x: width - 50, y: 150, size: 6, color: '#FFD3B6', delay: 700 },
        { x: 70, y: 280, size: 4, color: '#C4B5FD', delay: 100 },
        { x: width - 100, y: 380, size: 5, color: '#86EFAC', delay: 600 },
      ].map((p, i) => <Particle key={i} {...p} />)}

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.duration(1000)} style={styles.completeHeader}>
            <Text style={styles.completeTitle}>✨ Session Complete</Text>
            <Text style={styles.completeSubtitle}>You spent 15 peaceful minutes observing your thoughts.</Text>
          </Animated.View>

          {/* Grid of stats */}
          <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.statsCardGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🧠</Text>
                <Text style={styles.statVal}>Observe</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🎵</Text>
                <Text style={styles.statVal}>8 / 8</Text>
                <Text style={styles.statLabel}>Sounds</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🖼️</Text>
                <Text style={styles.statVal}>8 / 8</Text>
                <Text style={styles.statLabel}>Nature Images</Text>
              </View>
            </View>
            <View style={[styles.statsRow, { marginTop: 14 }]}>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statVal}>15 Min</Text>
                <Text style={styles.statLabel}>Time Spent</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statIcon}>🌿</Text>
                <Text style={styles.statVal}>100%</Text>
                <Text style={styles.statLabel}>Calm Level</Text>
              </View>
            </View>
          </Animated.View>

          {/* Inspirational quote */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.quoteBanner}>
            <Text style={styles.quoteBannerText}>"The quieter you become, the more you can hear."</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(900).duration(600)} style={{ width: '100%', marginTop: 20 }}>
            <GradBtn label="Return Home" onPress={handleReturnHome} />
          </Animated.View>

        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 40
  },
  welcomeIntro: {
    marginTop: height * 0.08,
    alignItems: 'flex-start'
  },
  sessionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  welcomeTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 52,
    marginBottom: 8
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: C.lavender,
    fontWeight: '700'
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 24,
    marginVertical: 20
  },
  quoteMark: {
    fontSize: 36,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 30
  },
  motivationalText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
    fontStyle: 'italic',
    paddingHorizontal: 10
  },
  actionWrap: {
    width: '100%'
  },

  // Prepare Yourself Screen
  prepareScroll: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 130
  },
  breathCardWrap: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24
  },
  breatheCircleOuter: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center'
  },
  breatheGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.3)'
  },
  breatheRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  breatheInner: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: '#1E1A33',
    alignItems: 'center',
    justifyContent: 'center'
  },
  breatheText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700'
  },
  instructionsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%'
  },
  instructTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center'
  },
  instructRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22D3EE',
    marginTop: 8,
    marginRight: 10
  },
  instructText: {
    fontSize: 15,
    color: C.textMid,
    lineHeight: 22,
    flex: 1
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24
  },

  // Session Screen
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  progressTextWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  elapsedLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginTop: 6
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22D3EE',
    borderRadius: 2
  },
  slideBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30
  },
  glassQuoteCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10
  },
  slideQuote: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4
  },
  glassControlsRow: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center'
  },
  glassControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 35,
    paddingHorizontal: 12,
    height: 70,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24
  },
  controlPlayBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },

  // Completion Screen
  completeScroll: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 40
  },
  completeHeader: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 24
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8
  },
  completeSubtitle: {
    color: C.textMid,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  statsCardGrid: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    marginBottom: 20
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10
  },
  statIcon: {
    fontSize: 26,
    marginBottom: 6
  },
  statVal: {
    color: '#FFD3B6',
    fontSize: 16,
    fontWeight: '900'
  },
  statLabel: {
    color: C.textLight,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2
  },
  quoteBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    marginBottom: 20,
    width: '100%'
  },
  quoteBannerText: {
    color: C.lavender,
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24
  },

  // Button Wrapper
  gradBtnWrap: {
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    width: '100%',
    elevation: 8,
    shadowColor: C.violet,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12
  },
  gradBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gradBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
