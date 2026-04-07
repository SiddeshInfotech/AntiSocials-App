import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WriteTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Animation Refs
  const fadeAnimIcon = useRef(new Animated.Value(0)).current;
  const fadeAnimText = useRef(new Animated.Value(0)).current;
  const translateAnimText = useRef(new Animated.Value(20)).current;
  const fadeAnimButton = useRef(new Animated.Value(0)).current;
  
  const iconFloatAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial Staggered Load Sequence
    Animated.sequence([
      Animated.timing(fadeAnimIcon, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnimText, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(translateAnimText, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(fadeAnimButton, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // 2. Icon Floating & Writing Motion (Continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloatAnim, { toValue: -12, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconFloatAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotateAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconRotateAnim, { toValue: -1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 3. Background Color Shift (Continuous)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = iconRotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '8deg'],
  });

  const handlePressIn = () => {
    Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(buttonScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Animated Soft Gradient Background */}
      <LinearGradient colors={['#fdf4ff', '#f3e8ff', '#ffffff']} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient colors={['#e0e7ff', '#f3e8ff', '#ffffff']} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      
      {/* Subtle Edge Dimming */}
      <View style={[StyleSheet.absoluteFillObject, styles.vignetteOverlay]} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity style={styles.backBtnLight} onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* Animated Icon */}
        <Animated.View style={[
          styles.iconContainer, 
          { opacity: fadeAnimIcon, transform: [{ translateY: iconFloatAnim }, { rotate: spin }] }
        ]}>
          <Text style={styles.heroEmoji}>✍️</Text>
        </Animated.View>

        {/* Animated Text Block */}
        <Animated.View style={{ opacity: fadeAnimText, transform: [{ translateY: translateAnimText }], alignItems: 'center', width: '100%' }}>
          <View style={styles.dayPill}>
             <Text style={styles.dayPillText}>Day</Text>
          </View>
          <Text style={styles.mainTitle}>Write 1 word about how you feel</Text>
          <Text style={styles.subtitle}>Text input</Text>

          <View style={styles.infoCard}>
             <Text style={styles.infoTitle}>Why this matters:</Text>
             <View style={styles.rewardRow}>
                <Feather name="check-circle" size={18} color="#a855f7" />
                <Text style={styles.rewardText}>Earn 300 points after completion</Text>
             </View>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Animated Button */}
        <Animated.View style={{ opacity: fadeAnimButton, transform: [{ scale: buttonScaleAnim }], width: '100%' }}>
          <Pressable 
            onPressIn={handlePressIn} 
            onPressOut={handlePressOut}
            onPress={() => router.push('/share-thoughts' as any)}
            style={styles.startButton}
          >
             <LinearGradient
                colors={['#a855f7', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
             >
                <Text style={styles.startText}>Start Task</Text>
                <View style={styles.buttonGlowOverlay} />
             </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  vignetteOverlay: {
    borderWidth: 30, // Creates a soft pseudo-vignette along edges
    borderColor: 'rgba(0,0,0,0.015)',
    borderRadius: 70,
  },
  headerLight: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)', 
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: '#a855f7',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    backgroundColor: 'rgba(255,255,255,0.4)', // Creates focus glow
    borderRadius: 60,
    padding: 10,
  },
  heroEmoji: {
    fontSize: 100, 
  },
  dayPill: {
    backgroundColor: 'rgba(243, 232, 255, 0.8)', 
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  dayPillText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(250, 245, 255, 0.7)', 
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.5)', 
  },
  infoTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: 10,
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 30, 
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  startText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    zIndex: 2,
  },
  buttonGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  }
});
