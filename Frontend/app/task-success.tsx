import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Confetti particle data
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  color: ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
  size: 6 + Math.random() * 8,
  delay: Math.random() * 600,
  duration: 1800 + Math.random() * 1000,
}));

const Particle = ({ x, color, size, delay, duration }: typeof PARTICLES[0]) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: height * 0.55, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: (Math.random() - 0.5) * 120, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 500, delay: duration - 700, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 3, duration, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '1080deg'] });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x,
      top: 0,
      width: size,
      height: size,
      borderRadius: size * 0.2,
      backgroundColor: color,
      opacity,
      transform: [{ translateY }, { translateX }, { rotate: spin }],
    }} />
  );
};

export default function TaskSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { points, totalPoints, streak } = useLocalSearchParams<{ points: string, totalPoints: string, streak: string }>();
  const displayPoints = points ?? '0';
  const displayTotal = totalPoints ?? '0';
  const displayStreak = streak ?? '0';

  // Animation refs
  const bgScale     = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0)).current;
  const iconBounce  = useRef(new Animated.Value(0)).current;
  const ring1       = useRef(new Animated.Value(0)).current;
  const ring2       = useRef(new Animated.Value(0)).current;
  const ring3       = useRef(new Animated.Value(0)).current;
  const cardSlide   = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide    = useRef(new Animated.Value(30)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const pointsCount = useRef(new Animated.Value(0)).current;

  const [showParticles, setShowParticles] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    // Show confetti immediately
    setShowParticles(true);

    // 1. Background blob springs in
    Animated.spring(bgScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }).start();

    // 2. Icon pops in with a bounce overshoot
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconScale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
    ]).start();

    // 3. Floating idle bounce after pop
    Animated.sequence([
      Animated.delay(700),
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, { toValue: -10, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(iconBounce, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ),
    ]).start();

    // 4. Ripple rings — staggered
    const doRing = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    setTimeout(() => { doRing(ring1, 0); doRing(ring2, 650); doRing(ring3, 1300); }, 400);

    // 5. Card slides up
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // 6. Button slides up after card
    Animated.sequence([
      Animated.delay(750),
      Animated.parallel([
        Animated.spring(btnSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // 7. Points count-up via listener
    pointsCount.addListener(({ value }) => setDisplayCount(Math.round(value)));
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(pointsCount, {
        toValue: parseInt(displayPoints),
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
    return () => pointsCount.removeAllListeners();
  }, []);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#a855f7',
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.3, 0] }),
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1a1035', '#0d1b4b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti particles */}
      {showParticles && PARTICLES.map(p => <Particle key={p.id} {...p} />)}

      {/* Decorative glowing blob */}
      <Animated.View style={[styles.glowBlob, { transform: [{ scale: bgScale }] }]} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 20, 60), paddingBottom: Math.max(insets.bottom + 20, 40) }]} showsVerticalScrollIndicator={false}>
        
        {/* Trophy / Icon with rings */}
        <View style={styles.iconArea}>
          <Animated.View style={ringStyle(ring1)} />
          <Animated.View style={ringStyle(ring2)} />
          <Animated.View style={ringStyle(ring3)} />

          <Animated.View style={[styles.iconCircle, {
            transform: [{ scale: iconScale }, { translateY: iconBounce }]
          }]}>
            <LinearGradient colors={['#a855f7', '#6366f1']} style={styles.iconGradient}>
              <Text style={styles.iconEmoji}>🏆</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Title area */}
        <Animated.View style={[styles.titleBlock, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
          <Text style={styles.title}>Well Done! 🎉</Text>
          <Text style={styles.subtitle}>You showed up and made it happen.</Text>
        </Animated.View>

        {/* Points card */}
        <Animated.View style={[styles.pointsCard, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
          <LinearGradient colors={['rgba(168,85,247,0.2)', 'rgba(99,102,241,0.1)']} style={styles.pointsCardInner}>
            <Text style={styles.pointsLabel}>Points Earned</Text>
            <Text style={styles.pointsValue}>+{displayCount}</Text>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={20} color="#f59e0b" />
                <Text style={styles.statNum}>{displayStreak}</Text>
                <Text style={styles.statLbl}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-done-circle" size={20} color="#22c55e" />
                <Text style={styles.statNum}>1</Text>
                <Text style={styles.statLbl}>Task Today</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={20} color="#a855f7" />
                <Text style={styles.statNum}>{displayTotal}</Text>
                <Text style={styles.statLbl}>Total Pts</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Message card */}
        <Animated.View style={[styles.msgCard, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}>
          <Feather name="zap" size={18} color="#f59e0b" style={{ marginRight: 10 }} />
          <Text style={styles.msgText}>
            Every small action builds who you become. Keep going — Day 2 awaits!
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.btnArea, { opacity: btnOpacity, transform: [{ translateY: btnSlide }] }]}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace({ pathname: '/(tabs)', params: { updatedPoints: displayTotal, updatedStreak: displayStreak } } as any)}>
            <LinearGradient
              colors={['#a855f7', '#6366f1']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Continue Journey</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.replace({ pathname: '/(tabs)', params: { updatedPoints: displayTotal, updatedStreak: displayStreak } } as any)}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  glowBlob: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    top: -width * 0.35,
    left: -width * 0.1,
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  iconArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 10,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 50 },

  titleBlock: { alignItems: 'center', marginBottom: 28 },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },

  pointsCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  pointsCardInner: {
    padding: 28,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#a855f7',
    lineHeight: 72,
    marginBottom: 4,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 20,
  },
  statRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 4 },
  statLbl: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', height: 40, alignSelf: 'center' },

  msgCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  msgText: {
    flex: 1,
    color: '#fde68a',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  btnArea: { width: '100%', gap: 14 },

  primaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  secondaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
});
