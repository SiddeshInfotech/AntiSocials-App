import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS,
  interpolate, interpolateColor, SharedValue
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  bg: '#1C0C1F', // Deep warm violet-black
  amber: '#D97706',
  orange: '#EA580C',
  gold: '#F59E0B',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBrd: 'rgba(255, 255, 255, 0.15)',
  textLight: 'rgba(255, 255, 255, 0.65)',
  textMid: 'rgba(255, 255, 255, 0.88)',
  autumnLeafColors: ['#E07A5F', '#F4A261', '#E76F51', '#D4A373', '#C15C3D', '#B5835A']
};

type ScreenState = 'welcome' | 'prepare' | 'session' | 'complete';

const TOTAL_DURATION_SECONDS = 900; // 15 minutes

const BACKGROUND_IMAGES = [
  require('../assets/images/beauful_nature_phtoo_202607011043.jpeg'),
  require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg'),
  require('../assets/images/sun_rise_from_moutain_phot_202607011041 (1).jpeg'),
  require('../assets/images/All_green_plants_photos_202607011041.jpeg'),
  require('../assets/images/All_green_plants_photos_202607011041 (1).jpeg'),
  require('../assets/images/Flower_girl_smelling_flower_202607011041.jpeg'),
  require('../assets/images/People_doing_yoga_in_garden_202607011044.jpeg'),
];

const THOUGHTS = [
  "Stress", "Fear", "Overthinking", "Regret", "Future", 
  "Failure", "Anxiety", "Comparison", "Anger", "Pressure", 
  "Worry", "Judgment", "Doubt", "Expectations", "Control"
];

const QUOTES = [
  "Notice your thoughts without judgment.",
  "Let go.",
  "Breathe.",
  "Stay here.",
  "You are not your thoughts.",
  "Everything passes.",
  "Peace is already inside you.",
  "Silence is strength.",
  "The quieter your mind becomes, the clearer life becomes."
];

// ── Falling Leaf Component ───────────────────────────────────────────────
interface FallingLeafProps {
  index: number;
  thought: string;
  elapsedShare: SharedValue<number>;
}

function FallingLeaf({ index, thought, elapsedShare }: FallingLeafProps) {
  const leafColor = C.autumnLeafColors[index % C.autumnLeafColors.length];
  
  // Starting parameters
  const startX = Math.random() * (width - 100);
  const startY = -120;
  
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const rotation = useSharedValue(Math.random() * 360);
  const scale = useSharedValue(0.85 + Math.random() * 0.35);
  const opacity = useSharedValue(0);

  const duration = 9000 + Math.random() * 7000; // Slow falling speed (9-16 seconds)
  const swayRange = 50 + Math.random() * 70; // Sway amplitude

  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      // Determine visibility threshold based on elapsed time:
      // index 12-14 hide after 3 minutes (180s)
      // index 9-11 hide after 6 minutes (360s)
      // index 6-8 hide after 10 minutes (600s)
      // index 3-5 hide after 13 minutes (780s)
      // index 1-2 hide after 14.5 minutes (870s)
      let maxTimeAllowed = 900;
      if (index >= 12) maxTimeAllowed = 180;
      else if (index >= 9) maxTimeAllowed = 360;
      else if (index >= 6) maxTimeAllowed = 600;
      else if (index >= 3) maxTimeAllowed = 780;
      else if (index >= 1) maxTimeAllowed = 870;

      if (elapsedShare.value > maxTimeAllowed) {
        opacity.value = withTiming(0, { duration: 1000 });
        return;
      }

      // Reset positioning to top
      x.value = Math.random() * (width - 100);
      y.value = -120 - Math.random() * 120;
      rotation.value = Math.random() * 360;
      opacity.value = 0;

      // Fade-in leaf
      opacity.value = withTiming(0.85, { duration: 2000 });

      // Falling translation
      y.value = withTiming(height + 150, { duration }, (finished) => {
        if (finished && active) {
          runOnJS(animate)();
        }
      });

      // Sway movement (sinusoidal path simulation)
      x.value = withRepeat(
        withSequence(
          withTiming(x.value - swayRange, { duration: duration / 3 }),
          withTiming(x.value + swayRange, { duration: duration / 3 }),
          withTiming(x.value, { duration: duration / 3 })
        ),
        -1,
        true
      );

      // Spin rotation
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: duration / 2 }),
        -1,
        false
      );
    };

    // Distribute entry times
    const startDelay = index * 1400;
    const timeout = setTimeout(() => {
      animate();
    }, startDelay);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    let currentOpacity = opacity.value;
    
    // Smoothly dissolve when approaching threshold
    let maxTimeAllowed = 900;
    if (index >= 12) maxTimeAllowed = 180;
    else if (index >= 9) maxTimeAllowed = 360;
    else if (index >= 6) maxTimeAllowed = 600;
    else if (index >= 3) maxTimeAllowed = 780;
    else if (index >= 1) maxTimeAllowed = 870;

    if (elapsedShare.value > maxTimeAllowed) {
      const diff = elapsedShare.value - maxTimeAllowed;
      currentOpacity = Math.max(0, currentOpacity * (1 - diff / 15)); // fade over 15s
    }

    return {
      position: 'absolute',
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
      opacity: currentOpacity
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.leafContainer}>
        <MaterialCommunityIcons name="leaf-maple" size={54} color={leafColor} style={styles.leafIconShadow} />
        <Text style={styles.leafText}>{thought}</Text>
      </View>
    </Animated.View>
  );
}

// ── Cinematic Sunrays & Particles ────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.3);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-40 - delay * 0.05, { duration: 4000 + delay }),
      withTiming(15, { duration: 4000 + delay })
    ), -1, true);

    op.value = withRepeat(withSequence(
      withTiming(0.9, { duration: 2500 + delay }),
      withTiming(0.15, { duration: 2500 + delay })
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
function GradBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[styles.gradBtnWrap, s]}>
      <Pressable
        onPressIn={() => {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
          sc.value = withSpring(0.96);
        }}
        onPressOut={() => { sc.value = withSpring(1); }}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['#E65C00', '#F9D423']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={styles.gradBtnText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MAIN EXPERIENCE COMPONENT ─────────────────────────────────────────────
export default function SilenceMindScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const elapsedShare = useSharedValue(0);
  const zoomScale = useSharedValue(1);
  const quoteOpacity = useSharedValue(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Background crossfade state and animation values
  const [bgIndex, setBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(0);
  const bgFade = useSharedValue(0);
  const [completionResult, setCompletionResult] = useState<{ pointsAdded: number; totalPoints: number; streak: number } | null>(null);


  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play ambient audio automatically when meditation starts
  const playAmbientTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });
      // Automatically load and start the loop track in the background without controls
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/videos/mixkit-spirit-in-the-woods-139.mp3'),
        {
          shouldPlay: true,
          volume: 0.45,
          isLooping: true
        }
      );
      soundRef.current = sound;
    } catch (e) {
      console.error("Ambient Audio Load Error:", e);
    }
  };

  const stopAmbientTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {}
  };

  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return null;
      const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_name: 'Silence Mind', points: 500 }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        return { pointsAdded: data.pointsAdded, totalPoints: data.totalPoints, streak: data.streak };
      }
      return null;
    } catch (e) {
      console.error('completeTask error:', e);
      return null;
    }
  };

  // Clean ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientTrack();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Manage meditation timers and quote loops
  useEffect(() => {
    if (screen === 'session' && isPlaying) {
      playAmbientTrack();

      // Slow cinematic camera Ken Burns effect
      zoomScale.value = 1;
      zoomScale.value = withTiming(1.18, { duration: TOTAL_DURATION_SECONDS * 1000 });

      // Initial quote fade-in
      quoteOpacity.value = 0;
      quoteOpacity.value = withTiming(1, { duration: 2500 });
      const initialQuoteTimeout = setTimeout(() => {
        quoteOpacity.value = withTiming(0, { duration: 2500 });
      }, 11000);

      // Main timer interval
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 1;
          elapsedShare.value = next;

          if (next >= TOTAL_DURATION_SECONDS) {
            clearInterval(timerRef.current!);
            runOnJS(handleMeditationEnd)();
          }
          return next;
        });
      }, 1000);

      // Quote crossfade transition loop (triggered every 35 seconds)
      const quoteInterval = setInterval(() => {
        quoteOpacity.value = withTiming(0, { duration: 2500 }, (finished) => {
          if (finished) {
            runOnJS(setQuoteIndex)((prev) => (prev + 1) % QUOTES.length);
          }
        });
      }, 35000);

      return () => {
        clearInterval(timerRef.current!);
        clearInterval(quoteInterval);
        clearTimeout(initialQuoteTimeout);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAmbientTrack();
    }
  }, [screen, isPlaying]);

  // Handle quote changes fading back in
  useEffect(() => {
    if (screen === 'session' && quoteIndex > 0) {
      quoteOpacity.value = withTiming(1, { duration: 2500 });
      const outTimeout = setTimeout(() => {
        quoteOpacity.value = withTiming(0, { duration: 2500 });
      }, 11000);

      return () => clearTimeout(outTimeout);
    }
  }, [quoteIndex]);

  // Transition backgrounds periodically based on elapsed time (every ~128 seconds)
  const bgChangeInterval = TOTAL_DURATION_SECONDS / BACKGROUND_IMAGES.length;
  useEffect(() => {
    if (screen === 'session') {
      const computedBgIndex = Math.min(
        BACKGROUND_IMAGES.length - 1,
        Math.floor(elapsedTime / bgChangeInterval)
      );
      if (computedBgIndex !== nextBgIndex) {
        setNextBgIndex(computedBgIndex);
        bgFade.value = 0;
        bgFade.value = withTiming(1, { duration: 3000 }, (finished) => {
          if (finished) {
            runOnJS(setBgIndex)(computedBgIndex);
          }
        });
      }
    }
  }, [elapsedTime, screen]);

  const handleMeditationEnd = async () => {
    await stopAmbientTrack();
    setScreen('complete');
    const result = await completeTask();
    setCompletionResult(result);
  };

  const handleReturnHome = () => {
    if (completionResult) {
      router.replace({
        pathname: '/task-success',
        params: {
          points: completionResult.pointsAdded?.toString() || '500',
          totalPoints: completionResult.totalPoints?.toString() || '0',
          streak: completionResult.streak?.toString() || '0',
        }
      } as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomScale.value }]
  }));

  const animatedQuoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value
  }));

  const nextBgStyle = useAnimatedStyle(() => ({
    opacity: bgFade.value
  }));

  // Dynamic colors / atmospheric lighting based on elapsed time:
  // Golden sunrise/brightening over time
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const progress = Math.min(elapsedTime / TOTAL_DURATION_SECONDS, 1);
    
    // Shifts gradient density/alpha towards a brighter, more sunlit golden hour near the end
    const backgroundColor = interpolateColor(
      progress,
      [0, 0.5, 1],
      ['rgba(28, 12, 48, 0.3)', 'rgba(230, 92, 0, 0.15)', 'rgba(255, 215, 0, 0.08)']
    );

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor
    };
  });

  // ──────── WELCOME SCREEN ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        
        {/* Full-Screen Edge-to-Edge Background Forest */}
        <View style={styles.backgroundContainer}>
          <Image
            source={require('../assets/images/beauful_nature_phtoo_202607011043.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          {/* Custom warm autumn tint gradient overlay */}
          <LinearGradient
            colors={['rgba(230, 92, 0, 0.35)', 'rgba(28, 12, 48, 0.78)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Ambient Floating Particles */}
        {[
          { x: 35, y: 120, size: 7, color: '#FCD34D', delay: 0 },
          { x: width - 70, y: 200, size: 5, color: '#F59E0B', delay: 300 },
          { x: 60, y: 380, size: 6, color: '#EF4444', delay: 700 },
          { x: width - 110, y: 490, size: 8, color: '#F59E0B', delay: 100 },
          { x: 130, y: height * 0.62, size: 5, color: '#EF4444', delay: 500 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <Animated.View entering={FadeInDown.duration(1000)} style={styles.welcomeIntro}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>🍂 Silence Mind</Text>
              </View>
              <Text style={styles.welcomeTitle}>Silence{'\n'}Mind</Text>
              <Text style={styles.welcomeSubtitle}>Let your thoughts{'\n'}fall away with the wind.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).duration(800)} style={styles.welcomeStatsRow}>
              <View style={styles.welcomeStatBadge}>
                <Text style={styles.welcomeStatText}>🕒 15 Minutes</Text>
              </View>
              <View style={styles.welcomeStatBadge}>
                <Text style={styles.welcomeStatText}>🍂 Medium</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700).duration(700)} style={styles.actionBlock}>
              <GradBtn label="Begin Journey" onPress={() => setScreen('prepare')} />
              <Text style={styles.bottomMantra}>"A journey from thoughts to silence."</Text>
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
        
        <View style={styles.backgroundContainer}>
          <Image
            source={require('../assets/images/beauful_nature_phtoo_202607011043.jpeg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(28, 12, 48, 0.65)', 'rgba(230, 92, 0, 0.45)', 'rgba(28, 12, 48, 0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Preparation</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.prepareScroll} 
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.prepareHeader}>
                <Text style={styles.prepareTitle}>Prepare Yourself</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.instructionGrid}>
                {[
                  { icon: '🍂', text: 'Find a quiet place' },
                  { icon: '🧘', text: 'Sit comfortably' },
                  { icon: '🌬️', text: 'Relax your shoulders' },
                  { icon: '👁️', text: 'Close your eyes if comfortable' },
                  { icon: '🍃', text: 'Let thoughts come and go' },
                  { icon: '❤️', text: 'There is nothing to fix today' }
                ].map((item, i) => (
                  <View key={i} style={styles.instructionCard}>
                    <Text style={styles.instructIcon}>{item.icon}</Text>
                    <Text style={styles.instructText}>{item.text}</Text>
                  </View>
                ))}
              </Animated.View>
            </ScrollView>

            <View style={styles.actionBlock}>
              <GradBtn label="Start Session" onPress={() => setScreen('session')} />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── MEDITATION SESSION SCREEN ────────
  if (screen === 'session') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        {/* Slow cinematic Ken Burns background with smooth crossfade */}
        <View style={styles.backgroundContainer}>
          {/* Base Background Image */}
          <Animated.Image
            source={BACKGROUND_IMAGES[bgIndex]}
            style={[styles.backgroundImage, zoomStyle]}
            resizeMode="cover"
          />

          {/* Fading Transition Background Image */}
          {nextBgIndex !== bgIndex && (
            <Animated.Image
              source={BACKGROUND_IMAGES[nextBgIndex]}
              style={[styles.backgroundImage, zoomStyle, nextBgStyle]}
              resizeMode="cover"
            />
          )}

          {/* Dynamic weather/lighting overlay shifting to brighter golden hour near the end */}
          <Animated.View style={animatedOverlayStyle} />
          {/* Static Linear Gradient for aesthetic contrast */}
          <LinearGradient
            colors={['rgba(28, 12, 48, 0.4)', 'rgba(0, 0, 0, 0.1)', 'rgba(28, 12, 48, 0.75)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Ambient Particles */}
        {[
          { x: 40, y: 150, size: 4, color: 'rgba(255, 215, 0, 0.4)', delay: 150 },
          { x: width - 80, y: 250, size: 5, color: 'rgba(255, 215, 0, 0.35)', delay: 550 },
          { x: 120, y: 460, size: 4, color: '#F4A261', delay: 850 },
          { x: width - 130, y: 180, size: 6, color: '#E76F51', delay: 350 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        {/* Automatically animated falling leaves */}
        {THOUGHTS.map((thought, idx) => (
          <FallingLeaf 
            key={idx} 
            index={idx} 
            thought={thought} 
            elapsedShare={elapsedShare} 
          />
        ))}

        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <View style={styles.responsiveContainer}>
            
            {/* Top Bar — Timer & Exit */}
            <View style={styles.sessionHeader}>
              <TouchableOpacity
                onPress={async () => {
                  await stopAmbientTrack();
                  router.back();
                }}
                style={styles.closeBtn}
              >
                <Feather name="x" size={20} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>
                  {formatTime(elapsedTime)} / {formatTime(TOTAL_DURATION_SECONDS)}
                </Text>
              </View>
              
              <View style={{ width: 40 }} />
            </View>

            {/* Premium Thin Progress Bar */}
            <View style={styles.progressWrapper}>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${(elapsedTime / TOTAL_DURATION_SECONDS) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Fading positive quotes */}
            <View style={styles.quoteBody}>
              <Animated.View style={[styles.glassQuoteBox, animatedQuoteStyle]}>
                <Text style={styles.quoteText}>{QUOTES[quoteIndex]}</Text>
              </Animated.View>
            </View>

            {/* Empty footer layout placeholder to preserve vertical align spacing */}
            <View style={{ height: 60 }} />

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── COMPLETION SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      <View style={styles.backgroundContainer}>
        <Image
          source={require('../assets/images/beauful_nature_phtoo_202607011043.jpeg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Soft, beautiful sunset-gold overlay */}
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.3)', 'rgba(230, 92, 0, 0.35)', 'rgba(28, 12, 48, 0.85)']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.responsiveContainer}>
          
          <ScrollView 
            contentContainerStyle={styles.completeScroll} 
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(900)} style={styles.completeHeader}>
              <Text style={styles.completeTitle}>✨ Silence Achieved</Text>
              <Text style={styles.completeSubtitle}>
                You spent 15 peaceful minutes allowing your thoughts to pass naturally.
              </Text>
            </Animated.View>

            {/* Stats Cards Row */}
            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🍂</Text>
                  <Text style={styles.statValText}>Released</Text>
                  <Text style={styles.statLabelText}>Thoughts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🕒</Text>
                  <Text style={styles.statValText}>15 Mins</Text>
                  <Text style={styles.statLabelText}>Time Spent</Text>
                </View>
              </View>
              <View style={[styles.statRow, { marginTop: 12 }]}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🌿</Text>
                  <Text style={styles.statValText}>Calm</Text>
                  <Text style={styles.statLabelText}>Mind State</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>❤️</Text>
                  <Text style={styles.statValText}>100%</Text>
                  <Text style={styles.statLabelText}>Inner Peace</Text>
                </View>
              </View>
            </Animated.View>

            {/* Reflection quote banner */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.finalQuoteCard}>
              <Text style={styles.finalQuoteText}>
                "Like leaves in the wind, every thought eventually passes."
              </Text>
            </Animated.View>
          </ScrollView>

          <View style={styles.actionBlock}>
            <GradBtn label="Return Home" onPress={handleReturnHome} />
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
  welcomeIntro: {
    marginTop: height * 0.08,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 50,
    textAlign: 'center',
    marginBottom: 12
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: C.textLight,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24
  },
  welcomeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20
  },
  welcomeStatBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8
  },
  welcomeStatText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  bottomMantra: {
    color: C.textLight,
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center'
  },

  // Prepare Yourself View
  prepareScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 4
  },
  prepareHeader: {
    marginTop: 20,
    marginBottom: 20
  },
  prepareTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  instructionGrid: {
    width: '100%',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructIcon: {
    fontSize: 22,
    marginRight: 16
  },
  instructText: {
    fontSize: 15,
    color: C.textMid,
    fontWeight: '600',
    flex: 1
  },

  // Session View
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  timerLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  progressWrapper: {
    marginTop: 6,
    width: '100%'
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2
  },
  quoteBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  glassQuoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  quoteText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },

  // Falling Leaves Physics
  leafContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    position: 'relative'
  },
  leafIconShadow: {
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3
  },
  leafText: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    transform: [{ rotate: '-12deg' }],
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3
  },

  // Completion View
  completeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: height * 0.04
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12
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
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.glassBrd,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10
  },
  statEmoji: {
    fontSize: 26,
    marginBottom: 6
  },
  statValText: {
    color: '#FCD34D',
    fontSize: 16,
    fontWeight: '900'
  },
  statLabelText: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 2
  },
  finalQuoteCard: {
    backgroundColor: 'rgba(230, 92, 0, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    width: '100%'
  },
  finalQuoteText: {
    color: '#FDE047',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500'
  },

  // Buttons
  gradBtnWrap: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#EA580C',
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
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  }
});
