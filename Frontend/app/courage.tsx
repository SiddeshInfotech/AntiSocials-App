import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
  Rect,
  ClipPath,
} from 'react-native-svg';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 24;
const MAX_CHAR_COUNT = 300;

const COLORS = {
  bg: '#080914',
  bgLight: '#11142A',
  primary: '#7C3AED',   // Purple
  secondary: '#2563EB', // Blue
  accent: '#FBBF24',    // Gold
  pink: '#DB2777',      // Pink
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  glass: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.08)',
};

const STORAGE_DRAFT_KEY = '@courage_moment_draft';
const STORAGE_HISTORY_KEY = '@courage_wall_history';

// --- Shared Types ---
interface CourageMemory {
  id: string;
  text: string;
  date: string;
  timestamp: number;
}

// --- Background Components ---

const FloatingParticles = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(25)].map((_, i) => {
        const x = useSharedValue(Math.random() * width);
        const y = useSharedValue(Math.random() * height);
        const scale = useSharedValue(Math.random() * 0.8 + 0.4);
        const opacity = useSharedValue(Math.random() * 0.4 + 0.15);

        useEffect(() => {
          x.value = withRepeat(
            withTiming(x.value + (Math.random() * 60 - 30), {
              duration: 6000 + Math.random() * 4000,
              easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
          );
          y.value = withRepeat(
            withTiming(y.value - (50 + Math.random() * 50), {
              duration: 8000 + Math.random() * 4000,
              easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
          );
        }, []);

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: x.value },
            { translateY: y.value },
            { scale: scale.value },
          ],
          opacity: opacity.value,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              animatedStyle,
              {
                backgroundColor: i % 3 === 0 ? COLORS.accent : i % 2 === 0 ? COLORS.primary : COLORS.secondary,
                width: i % 4 === 0 ? 5 : 3,
                height: i % 4 === 0 ? 5 : 3,
                borderRadius: 3,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const AnimatedBackground = ({ step }: { step: number }) => {
  const blob1X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(
      withTiming(80, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withTiming(-60, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const b1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1X.value * 0.5 }],
  }));
  const b2 = useAnimatedStyle(() => ({
    transform: [{ translateY: blob2Y.value }, { translateX: blob2Y.value * 0.3 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      
      {/* Moving Ambient Glow Blobs */}
      <Animated.View
        style={[
          styles.blob,
          b1,
          {
            top: -50,
            right: -50,
            backgroundColor: COLORS.primary + '18',
            width: width * 0.9,
            height: width * 0.9,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          b2,
          {
            bottom: -50,
            left: -50,
            backgroundColor: COLORS.secondary + '12',
            width: width * 1.1,
            height: width * 1.1,
          },
        ]}
      />

      <FloatingParticles />
      <LinearGradient
        colors={['rgba(8,9,20,0.1)', 'rgba(8,9,20,0.6)', COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

// --- Custom SVG Illustrations & Animations ---

// Sunrise Mountain Peak SVG
const MountainSunriseSVG = () => {
  const sunY = useSharedValue(70);

  useEffect(() => {
    sunY.value = withDelay(
      500,
      withTiming(20, { duration: 2500, easing: Easing.out(Easing.back(1)) })
    );
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sunY.value }],
  }));

  return (
    <View style={styles.mountainSvgContainer}>
      <Svg width="100%" height="240" viewBox="0 0 320 240" fill="none">
        <Defs>
          <SvgRadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFE066" stopOpacity="1" />
            <Stop offset="30%" stopColor="#FBBF24" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#7C3AED" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#080914" stopOpacity="0" />
          </SvgRadialGradient>
          <SvgLinearGradient id="mountainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#2E1A47" />
            <Stop offset="100%" stopColor="#0D0A1C" />
          </SvgLinearGradient>
          <SvgLinearGradient id="mountainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1B1E3F" />
            <Stop offset="100%" stopColor="#060710" />
          </SvgLinearGradient>
        </Defs>

        {/* Sunrise Glowing Sun */}
        <Animated.View style={sunStyle}>
          <Svg height="240" width="320">
            <Circle cx="160" cy="100" r="50" fill="url(#sunGlow)" />
            <Circle cx="160" cy="100" r="18" fill="#FFE066" />
          </Svg>
        </Animated.View>

        {/* Back Mountain Range */}
        <Path
          d="M-20,240 L70,120 L150,170 L230,100 L340,240 Z"
          fill="url(#mountainGrad1)"
          opacity="0.8"
        />

        {/* Front Mountain Range (Highest peak at 160) */}
        <Path
          d="M20,240 L110,150 L160,80 L220,130 L300,75 L360,240 Z"
          fill="url(#mountainGrad2)"
        />

        {/* Silhouette of a person standing at the peak (x=160, y=80) */}
        <G transform="translate(155, 62)">
          {/* Head */}
          <Circle cx="5" cy="5" r="2.5" fill="#FFF" opacity="0.95" />
          {/* Torso & arms raised wide in triumph */}
          <Path
            d="M5,7.5 L5,14 L3,18 M5,14 L7,18 M5,8.5 Q1,5 0,3 M5,8.5 Q9,5 10,3"
            stroke="#FFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.95"
          />
        </G>
      </Svg>
    </View>
  );
};

// Premium Courage Shield SVG with liquid filling
const CourageShieldSVG = ({ fillPercent = 0 }: { fillPercent?: number }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const pathD = "M50,8 C76,8 86,20 86,20 C86,20 86,60 50,92 C14,60 14,20 14,20 C14,20 24,8 50,8 Z";

  return (
    <Animated.View style={[styles.shieldWrapper, pulseStyle]}>
      <Svg width="120" height="120" viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgLinearGradient id="goldGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#EAB308" />
            <Stop offset="50%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#FDE047" />
          </SvgLinearGradient>
          <SvgLinearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="50%" stopColor="#7C3AED" />
            <Stop offset="100%" stopColor="#2563EB" />
          </SvgLinearGradient>
          <ClipPath id="shieldClip">
            <Path d={pathD} />
          </ClipPath>
          <SvgRadialGradient id="aura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FBBF24" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>

        {/* Aura Glow Behind Shield */}
        <Circle cx="50" cy="50" r="45" fill="url(#aura)" opacity={0.6 + fillPercent * 0.4} />

        {/* Base / Background Inactive Shield */}
        <Path
          d={pathD}
          fill="rgba(17, 20, 42, 0.7)"
          stroke="url(#shieldBorder)"
          strokeWidth="2.5"
        />

        {/* Golden Fill Liquid (Clipped to Shield Shape) */}
        <G clipPath="url(#shieldClip)">
          <Rect
            x="0"
            y={95 - fillPercent * 87}
            width="100"
            height="100"
            fill="url(#goldGradient)"
            opacity={0.9}
          />
        </G>

        {/* Star Icon in Center */}
        <Path
          d="M50,32 L53.5,41.5 L63,42 L55.5,48 L58,57.5 L50,52 L42,57.5 L44.5,48 L37,42 L46.5,41.5 Z"
          fill={fillPercent > 0.4 ? "#471B00" : "#FBBF24"}
          opacity={0.9}
        />
      </Svg>
    </Animated.View>
  );
};

// Premium Glowing Trophy SVG
const TrophySVG = () => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1.0, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });
    opacity.value = withTiming(1.0, { duration: 1000 });
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.trophyWrapper, trophyStyle]}>
      <Svg width="140" height="140" viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgLinearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" />
            <Stop offset="40%" stopColor="#FBBF24" />
            <Stop offset="80%" stopColor="#D97706" />
            <Stop offset="100%" stopColor="#78350F" />
          </SvgLinearGradient>
          <SvgRadialGradient id="trophyGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>

        {/* Back Aura */}
        <Circle cx="50" cy="45" r="40" fill="url(#trophyGlow)" />

        {/* Left Handle */}
        <Path
          d="M33,35 C20,35 20,55 33,55"
          stroke="url(#trophyGold)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Right Handle */}
        <Path
          d="M67,35 C80,35 80,55 67,55"
          stroke="url(#trophyGold)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Pedestal Base */}
        <Path
          d="M30,85 L70,85 L65,72 L35,72 Z"
          fill="url(#trophyGold)"
        />

        {/* Pedestal Bottom Block */}
        <Rect x="25" y="85" width="50" height="7" rx="2" fill="#451A03" />

        {/* Stem */}
        <Path
          d="M44,55 L56,55 L52,73 L48,73 Z"
          fill="url(#trophyGold)"
        />

        {/* Main Cup Body */}
        <Path
          d="M32,25 C32,55 68,55 68,25 Z"
          fill="url(#trophyGold)"
        />

        {/* Cup Rim Top */}
        <Path
          d="M32,25 Q50,28 68,25 Q50,22 32,25"
          fill="#FFE066"
        />

        {/* Courage Shield Badge inside Trophy */}
        <Path
          d="M50,33 C58,33 61,37 61,37 C61,37 61,50 50,60 C39,50 39,37 39,37 C39,37 42,33 50,33 Z"
          fill="#451A03"
          opacity="0.8"
        />

        {/* Tiny star in shield badge */}
        <Path
          d="M50,42 L51.5,45.5 L55,45.5 L52,47.5 L53,51 L50,49 L47,51 L48,47.5 L45,45.5 L48.5,45.5 Z"
          fill="#FBBF24"
        />
      </Svg>
    </Animated.View>
  );
};

// Animated Flying Birds SVG (Horizontal movement)
const FlyingBirdsSVG = () => {
  const translate1 = useSharedValue(-60);
  const translate2 = useSharedValue(-100);

  useEffect(() => {
    translate1.value = withRepeat(
      withTiming(width + 60, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
    translate2.value = withRepeat(
      withTiming(width + 100, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const birdStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: translate1.value }, { translateY: 30 }],
  }));
  const birdStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: translate2.value }, { translateY: 80 }],
  }));

  const birdPath = "M0,6 Q5,1 10,6 Q15,1 20,6 L20,7 Q15,2 10,7 Q5,2 0,7 Z";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.bird, birdStyle1]}>
        <Svg width="30" height="15" viewBox="0 0 20 10">
          <Path d={birdPath} fill="#FFE066" opacity="0.65" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.bird, birdStyle2]}>
        <Svg width="25" height="12" viewBox="0 0 20 10">
          <Path d={birdPath} fill="#7C3AED" opacity="0.45" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Confetti Particle Shower for Relive Step
const ConfettiShower = ({ trigger }: { trigger: boolean }) => {
  const particlesCount = 35;
  const particles = useMemo(() => {
    return [...Array(particlesCount)].map((_, i) => {
      const angle = (i / particlesCount) * 2 * Math.PI + Math.random() * 0.3;
      const velocity = 80 + Math.random() * 120;
      return {
        id: i,
        destX: Math.cos(angle) * velocity,
        destY: Math.sin(angle) * velocity - 20,
        color: i % 3 === 0 ? COLORS.accent : i % 2 === 0 ? COLORS.primary : COLORS.secondary,
        size: Math.random() * 8 + 4,
      };
    });
  }, [trigger]);

  if (!trigger) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        return <ConfettiItem key={p.id} {...p} />;
      })}
    </View>
  );
};

const ConfettiItem = ({ destX, destY, color, size }: { destX: number; destY: number; color: string; size: number }) => {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    x.value = withTiming(destX, { duration: 1500, easing: Easing.out(Easing.cubic) });
    y.value = withTiming(destY, { duration: 1500, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) });
    rotation.value = withTiming(Math.random() * 720, { duration: 1500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        {
          left: width / 2 - size / 2,
          top: height * 0.35 - size / 2,
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size % 2 === 0 ? 0 : size / 2,
        },
      ]}
    />
  );
};

// --- Reusable Premium Buttons & Containers ---

const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <BlurView intensity={25} tint="dark" style={[styles.glassCard, style]}>
    {children}
  </BlurView>
);

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    disabled={disabled || loading}
    style={(disabled || loading) ? styles.btnDisabled : null}
  >
    <LinearGradient
      colors={disabled ? ['#374151', '#1F2937'] : [COLORS.primary, COLORS.secondary, COLORS.pink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.primaryButton}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <>
          <Text style={styles.primaryButtonText}>{title}</Text>
          {icon && <Ionicons name={icon as any} size={20} color="#FFF" style={{ marginLeft: 8 }} />}
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(12, insets.top) }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    </View>
  );
};

// --- Step Screens ---

// Screen 1: Introduction
const IntroStep = ({ onNext }: { onNext: () => void }) => {
  return (
    <View style={styles.fullScreenContent}>
      <MountainSunriseSVG />
      <View style={styles.introContent}>
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={{ alignItems: 'center' }}>
          <CourageShieldSVG fillPercent={0.0} />
          <Text style={styles.introTitle}>Write a Courage Moment</Text>
          <Text style={styles.introSubtitle}>
            Courage isn't the absence of fear.{"\n"}
            It's choosing to move forward despite it.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={{ width: '100%' }}>
          <GlassCard style={styles.quoteCard}>
            <Feather name={"quote" as any} size={24} color={COLORS.accent} style={styles.quoteIcon} />
            <Text style={styles.quoteText}>
              "The strongest version of you is built one brave moment at a time."
            </Text>
          </GlassCard>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Begin Journey" icon="arrow-forward" onPress={onNext} />
      </View>
    </View>
  );
};

// Screen 2: What counts as courage?
const WhatIsCourageStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const items = [
    { label: 'Speaking honestly', icon: 'chatbubble-ellipses-outline' },
    { label: 'Giving a presentation', icon: 'mic-outline' },
    { label: 'Saying sorry', icon: 'heart-outline' },
    { label: 'Making a difficult call', icon: 'call-outline' },
    { label: 'Attending an interview', icon: 'briefcase-outline' },
    { label: 'Studying / working hard', icon: 'book-outline' },
    { label: 'Trying something new', icon: 'rocket-outline' },
    { label: 'Asking for help', icon: 'help-circle-outline' },
  ];

  return (
    <View style={styles.fullScreenContent}>
      <Header title="What counts as courage?" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubtitle}>
          Courage doesn't have to be something extraordinary.{"\n"}
          Sometimes it's simply showing up when things feel difficult.
        </Text>

        <View style={styles.grid}>
          {items.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 100).duration(600)}
              style={styles.gridItemWrapper}
            >
              <GlassCard style={styles.gridItemCard}>
                <Ionicons name={item.icon as any} size={28} color={COLORS.accent} />
                <Text style={styles.gridItemLabel}>{item.label}</Text>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        <Text style={styles.bottomHighlight}>Every small brave step matters.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={onNext} />
      </View>
    </View>
  );
};

// Screen 3: Write your Courage Moment
const WriteStep = ({
  onNext,
  onBack,
  text,
  setText,
  isSavingDraft = false,
  isSavingContinue = false,
}: {
  onNext: () => void;
  onBack: () => void;
  text: string;
  setText: (t: string) => void;
  isSavingDraft?: boolean;
  isSavingContinue?: boolean;
}) => {
  const fillPercent = Math.min(text.length / MAX_CHAR_COUNT, 1.0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.fullScreenContent}
    >
      <Header title="Write Your Courage" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.writeIllustrationArea}>
          <CourageShieldSVG fillPercent={fillPercent} />
        </View>

        <GlassCard style={styles.writingCard}>
          <Text style={styles.writingHeading}>Describe your courage moment.</Text>
          <Text style={styles.writingSubheading}>What is one moment where you were brave?</Text>

          <TextInput
            multiline
            placeholder='Example: "I was nervous before my interview, but I still showed up and gave my best."'
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.textArea}
            value={text}
            onChangeText={setText}
            maxLength={MAX_CHAR_COUNT}
            textAlignVertical="top"
          />

          <View style={styles.charCountRow}>
            {isSavingDraft ? (
              <Text style={styles.savingText}>Saving draft...</Text>
            ) : fillPercent >= 1.0 ? (
              <Text style={styles.charWarning}>Maximum length reached</Text>
            ) : (
              <View />
            )}
            <Text style={[styles.charCounter, text.length >= MAX_CHAR_COUNT && { color: COLORS.pink }]}>
              {text.length}/{MAX_CHAR_COUNT}
            </Text>
          </View>
        </GlassCard>

        <Text style={styles.helperText}>Auto-saves as you type.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continue"
          disabled={text.trim().length === 0}
          loading={isSavingContinue}
          onPress={onNext}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

// Screen 4: Relive your Bravery
const ReliveStep = ({ text, onNext }: { text: string; onNext: () => void }) => {
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTriggerConfetti(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.fullScreenContent}>
      <ConfettiShower trigger={triggerConfetti} />
      <View style={[styles.scrollContent, { justifyContent: 'center', flex: 1, paddingBottom: 40 }]}>
        <Animated.View entering={FadeInDown.duration(800)} style={{ alignItems: 'center', width: '100%' }}>
          <CourageShieldSVG fillPercent={1.0} />

          <Text style={styles.reliveHeadline}>Relive Your Bravery</Text>
          <Text style={styles.reliveSubtitle}>Take a moment to appreciate what you did.</Text>

          <GlassCard style={styles.reliveMomentCard}>
            <Feather name="shield" size={24} color={COLORS.accent} style={{ alignSelf: 'center', marginBottom: 15 }} />
            <Text style={styles.reliveMomentText}>"{text}"</Text>
          </GlassCard>

          <Text style={styles.reliveParagraph}>
            You faced discomfort and kept moving forward.{"\n"}
            Your courage deserves recognition.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="I'm Proud of This Moment" icon="star" onPress={onNext} />
      </View>
    </View>
  );
};

// Screen 5: Courage Trophy
const TrophyStep = ({ onNext }: { onNext: () => void }) => {
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stats = [
    { title: '🛡 Courage Remembered', val: '1' },
    { title: '✨ Brave Action', val: 'Completed' },
    { title: '💪 Confidence', val: '+1' },
    { title: '🌱 Personal Growth', val: 'Unlocked' },
  ];

  return (
    <View style={styles.fullScreenContent}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <TrophySVG />
          <Text style={styles.trophyTitle}>Your Courage Trophy</Text>
          <View style={styles.badgeWrapper}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGrad}
            >
              <Text style={styles.badgeText}>🛡 Bravery Collector</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(300 + i * 150).duration(500)}
              style={styles.statsCardWrapper}
            >
              <GlassCard style={styles.statCard}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.val}</Text>
              </GlassCard>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={{ width: '100%', marginTop: 15 }}>
          <Text style={styles.trophyQuote}>
            "Courage grows every time you choose action over fear."
          </Text>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={onNext} />
      </View>
    </View>
  );
};

// Screen 6: Courage Wall
const WallStep = ({
  currentMoment,
  history,
  onNext,
}: {
  currentMoment: string;
  history: CourageMemory[];
  onNext: () => void;
}) => {
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const allMoments = useMemo(() => {
    const fresh: CourageMemory = {
      id: 'current',
      text: currentMoment,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
    };
    return [fresh, ...history.filter((h) => h.text !== currentMoment)];
  }, [currentMoment, history]);

  return (
    <View style={styles.fullScreenContent}>
      <Header title="Your Wall of Courage" />
      <View style={{ flex: 1, paddingHorizontal: HORIZONTAL_MARGIN }}>
        <Text style={styles.wallSubtitle}>
          Your collection of brave decisions. Tap below to continue.
        </Text>

        <FlatList
          data={allMoments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isNew = item.id === 'current';
            return (
              <Animated.View
                layout={Layout.springify()}
                entering={
                  isNew
                    ? FadeInUp.duration(1000).springify()
                    : FadeInDown.delay(index * 150).duration(600)
                }
                style={[
                  styles.wallFrameWrapper,
                  isNew && { borderColor: COLORS.accent, borderWidth: 1.5, borderRadius: 24 },
                ]}
              >
                <GlassCard style={styles.wallFrameCard}>
                  <View style={styles.frameHeader}>
                    <View style={styles.frameHeaderLeft}>
                      <Ionicons
                        name="shield"
                        size={16}
                        color={isNew ? COLORS.accent : COLORS.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.frameDate, isNew && { color: COLORS.accent, fontWeight: 'bold' }]}>
                        {isNew ? 'New Brave Moment' : item.date}
                      </Text>
                    </View>
                    {isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>FRESH</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.frameText}>"{item.text}"</Text>
                </GlassCard>
              </Animated.View>
            );
          }}
        />

        <View style={styles.wallMessageCard}>
          <Text style={styles.wallMessageText}>
            Every time you complete this task, another courage memory will be added here. Over time, you'll build your own Wall of Courage.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="See Completion" onPress={onNext} />
      </View>
    </View>
  );
};

// Screen 7: Completion
const CompletionStep = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.fullScreenContent}>
      <FlyingBirdsSVG />
      <MountainSunriseSVG />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={{ alignItems: 'center' }}>
          <Text style={styles.completeTitle}>Journey Complete</Text>
          <Text style={styles.completeSubtitle}>
            Today you remembered something important.{"\n"}
            You are braver than you often give yourself credit for.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(800)} style={{ width: '100%', marginVertical: 20 }}>
          <GlassCard style={styles.rewardCard}>
            <View style={styles.rewardIconCircle}>
              <Ionicons name="trophy-outline" size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.rewardPoints}>🏆 +300 Mind Points</Text>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementText}>🛡 Courage Keeper</Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(1000)}>
          <GlassCard style={styles.completeQuoteCard}>
            <Text style={styles.completeQuoteText}>
              "Courage isn't one big moment. It's hundreds of small decisions to keep going."
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Return Home" onPress={onComplete} />
      </View>
    </View>
  );
};

// --- Helper Premium Interaction Components ---

const SkeletonLoader = () => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.fullScreenContent}>
      <Header title="Write Your Courage" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.writeIllustrationArea, animatedStyle]}>
          <View style={styles.skeletonShield} />
        </Animated.View>

        <Animated.View style={[styles.writingCard, animatedStyle, { height: 260, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
          <View style={[styles.skeletonLine, { width: '60%', height: 20, marginBottom: 12 }]} />
          <View style={[styles.skeletonLine, { width: '80%', height: 14, marginBottom: 25 }]} />
          <View style={[styles.skeletonLine, { width: '100%', height: 120, borderRadius: 16 }]} />
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={[styles.skeletonButton, { opacity: 0.2 }]} />
      </View>
    </View>
  );
};

const SuccessToast = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOut.duration(300)} style={styles.toastContainer}>
      <GlassCard style={styles.toastCard}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
        <Text style={styles.toastText}>✓ Saved Successfully</Text>
      </GlassCard>
    </Animated.View>
  );
};

const ErrorSnackbar = ({
  message,
  onRetry,
  onClear,
}: {
  message: string | null;
  onRetry: () => void;
  onClear: () => void;
}) => {
  if (!message) return null;
  return (
    <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOut.duration(300)} style={styles.errorContainer}>
      <GlassCard style={styles.errorCard}>
        <View style={styles.errorTextCol}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.errorText} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeErrorButton} onPress={onClear}>
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
};

// --- Main Container Screen ---

export default function CourageScreen() {
  const [step, setStep] = useState(1);
  const [text, setText] = useState('');
  const [history, setHistory] = useState<CourageMemory[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New Integration States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingContinue, setIsSavingContinue] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const router = useRouter();

  // Load draft & history on mount
  useEffect(() => {
    loadDraftAndHistory();
  }, []);

  // Debounced auto-save effect
  useEffect(() => {
    if (step === 3 && text.trim().length > 0) {
      const delayDebounceFn = setTimeout(() => {
        autoSaveDraft(text);
      }, 800); // 800ms debounce

      return () => clearTimeout(delayDebounceFn);
    }
  }, [text, step]);

  const loadDraftAndHistory = async () => {
    setIsInitialLoading(true);
    setErrorText(null);
    try {
      // 1. Fetch user's previous courage moment from backend
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/courage/previous', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.courageMoment) {
            setText(data.courageMoment);
          }
        } else {
          console.warn("Failed to fetch previous courage moment from backend");
        }
      }
      
      // 2. Load History from AsyncStorage for the Courage Wall
      const histStr = await AsyncStorage.getItem(STORAGE_HISTORY_KEY);
      if (histStr) {
        setHistory(JSON.parse(histStr));
      }
    } catch (e) {
      console.warn("Failed to load backend or local storage:", e);
      setErrorText("Failed to sync previous courage moment. Check connection.");
      setRetryAction(() => () => loadDraftAndHistory());
    } finally {
      setIsInitialLoading(false);
    }
  };

  const autoSaveDraft = async (currentText: string) => {
    setIsSavingDraft(true);
    setErrorText(null);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            taskName: "Write a Courage Moment",
            courageMoment: currentText.trim()
          })
        });

        if (response.ok) {
          setShowSuccessToast(true);
          setTimeout(() => setShowSuccessToast(false), 2000);
        } else {
          const data = await response.json();
          setErrorText(data.error || "Failed to auto-save draft");
          setRetryAction(() => () => autoSaveDraft(currentText));
        }
      }
    } catch (e) {
      console.warn("Failed to auto-save draft:", e);
      setErrorText("Connection error. Draft auto-save failed.");
      setRetryAction(() => () => autoSaveDraft(currentText));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((prev) => Math.min(prev + 1, 7));
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleContinue = async () => {
    if (text.trim().length === 0) {
      Alert.alert("Input Required", "Please describe a moment where you were brave.");
      return;
    }

    setIsSavingContinue(true);
    setErrorText(null);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            taskName: "Write a Courage Moment",
            courageMoment: text.trim()
          })
        });

        if (response.ok) {
          setShowSuccessToast(true);
          setTimeout(() => {
            setShowSuccessToast(false);
            nextStep();
          }, 1500);
        } else {
          const data = await response.json();
          setErrorText(data.error || "Failed to save courage moment");
          setRetryAction(() => () => handleContinue());
        }
      } else {
        setErrorText("Session expired. Please log in again.");
      }
    } catch (e) {
      console.warn("Failed to save on continue:", e);
      setErrorText("Connection error. Failed to save courage moment.");
      setRetryAction(() => () => handleContinue());
    } finally {
      setIsSavingContinue(false);
    }
  };

  const handleComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorText(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Save new moment to history in local storage
      const newMemory: CourageMemory = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: Date.now(),
      };
      const updatedHistory = [newMemory, ...history];
      await AsyncStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // 2. Remove draft
      await AsyncStorage.removeItem(STORAGE_DRAFT_KEY);

      // 3. Request Backend Complete Task
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskName: "Write a Courage Moment",
          completed: true,
          courageMoment: text.trim(),
          completedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        router.replace({
          pathname: '/task-success',
          params: {
            points: data.pointsAdded?.toString() || '300',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          },
        } as any);
      } else {
        setErrorText(data.error || "Failed to complete task");
        setRetryAction(() => () => handleComplete());
      }
    } catch (e) {
      console.error("Failed to save and complete:", e);
      setErrorText("Connection error. Failed to complete task.");
      setRetryAction(() => () => handleComplete());
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 3 && isInitialLoading) {
      return <SkeletonLoader />;
    }

    switch (step) {
      case 1:
        return <IntroStep onNext={nextStep} />;
      case 2:
        return <WhatIsCourageStep onNext={nextStep} onBack={prevStep} />;
      case 3:
        return (
          <WriteStep
            text={text}
            setText={setText}
            isSavingDraft={isSavingDraft}
            isSavingContinue={isSavingContinue}
            onNext={handleContinue}
            onBack={prevStep}
          />
        );
      case 4:
        return <ReliveStep text={text} onNext={nextStep} />;
      case 5:
        return <TrophyStep onNext={nextStep} />;
      case 6:
        return <WallStep currentMoment={text} history={history} onNext={nextStep} />;
      case 7:
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AnimatedBackground step={step} />

      {/* Premium Save Success Toast */}
      <SuccessToast visible={showSuccessToast} />

      {/* Premium Error Snackbar with Retry */}
      <ErrorSnackbar
        message={errorText}
        onRetry={() => {
          if (retryAction) retryAction();
        }}
        onClear={() => setErrorText(null)}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <Animated.View
          key={step}
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(350)}
          style={{ flex: 1 }}
        >
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingBottom: 30,
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: 10,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  particle: {
    position: 'absolute',
  },
  blob: {
    position: 'absolute',
    borderRadius: 300,
    opacity: 0.45,
    filter: Platform.OS === 'web' ? 'blur(80px)' : undefined,
  } as any,

  // Buttons & Glass Elements
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  glassCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.glass,
    overflow: 'hidden',
  },

  // Screen 1: Intro
  mountainSvgContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 20,
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_MARGIN,
    marginTop: -20,
  },
  shieldWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  introSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 12,
  },
  quoteCard: {
    marginTop: 35,
    paddingVertical: 22,
    paddingHorizontal: 25,
    width: '100%',
    alignItems: 'center',
  },
  quoteIcon: {
    opacity: 0.3,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#E5E7EB',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Screen 2: What counts as courage
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
  },
  gridItemWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  gridItemCard: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 22,
  },
  gridItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 10,
  },
  bottomHighlight: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
  },

  // Screen 3: Write Step
  writeIllustrationArea: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  writingCard: {
    width: '100%',
    maxWidth: 600,
    padding: 24,
    borderRadius: 24,
  },
  writingHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  writingSubheading: {
    fontSize: 14,
    color: COLORS.textDim,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  charWarning: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: '600',
  },
  charCounter: {
    fontSize: 12,
    color: COLORS.textDim,
    marginLeft: 'auto',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },

  // Screen 4: Relive Step
  confetti: {
    position: 'absolute',
    zIndex: 99,
  },
  reliveHeadline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 25,
  },
  reliveSubtitle: {
    fontSize: 15,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  reliveMomentCard: {
    width: '100%',
    maxWidth: 500,
    paddingVertical: 30,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowRadius: 20,
    shadowOpacity: 0.15,
  },
  reliveMomentText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#FFE066',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  reliveParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 15,
  },

  // Screen 5: Trophy
  trophyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 15,
  },
  badgeWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  badgeGrad: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
    marginTop: 30,
  },
  statsCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  statCard: {
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statTitle: {
    fontSize: 11,
    color: COLORS.textDim,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  trophyQuote: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 30,
    lineHeight: 20,
  },

  // Screen 6: Wall of Courage
  wallSubtitle: {
    fontSize: 14,
    color: COLORS.textDim,
    textAlign: 'center',
    marginBottom: 20,
  },
  wallFrameWrapper: {
    marginBottom: 16,
  },
  wallFrameCard: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  frameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  frameHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frameDate: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  newBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  frameText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFF',
    fontStyle: 'italic',
  },
  wallMessageCard: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    marginVertical: 15,
  },
  wallMessageText: {
    fontSize: 12,
    color: COLORS.textDim,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Screen 7: Completion Screen
  bird: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
  },
  completeTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 15,
  },
  completeSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textDim,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  rewardCard: {
    width: '100%',
    maxWidth: 500,
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  rewardIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  rewardPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 12,
  },
  achievementBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  achievementText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  completeQuoteCard: {
    width: '100%',
    maxWidth: 500,
    paddingVertical: 18,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  completeQuoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Skeleton Loading & Interaction Styles
  skeletonShield: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonLine: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
  },
  skeletonButton: {
    width: '100%',
    height: 52,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  savingText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90,
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
    zIndex: 9999,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  errorTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  retryText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeErrorButton: {
    padding: 4,
  },
});
