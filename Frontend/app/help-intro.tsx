import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HelpIntroScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }),
      ]),
      Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
    ]).start();

    // Continuous soft breathing glow on the heart ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#4c1d9520', '#131317', '#131317']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Emotional Heart Orb */}
        <Animated.View style={[styles.heartOrb, { transform: [{ scale: heartScale }], opacity: glowAnim }]}>
          <LinearGradient colors={['#f472b6', '#ec4899', '#db2777']} style={styles.heartGradient}>
            <FontAwesome5 name="hand-holding-heart" size={44} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Radiant rings */}
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, styles.ringOuter, { opacity: glowAnim }]} />
          <Animated.View style={[styles.ring, styles.ringInner, { opacity: glowAnim }]} />
        </View>

        <Text style={styles.heading}>One Small Act.{'\n'}One Giant Ripple.</Text>
        <Text style={styles.subheading}>
          Somewhere nearby, someone is waiting for a moment of kindness only you can give. Step away from the screen and into someone's world.
        </Text>

        {/* Inspirational quote cards */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteEmoji}>💡</Text>
          <Text style={styles.quoteText}>
            "The best way to find yourself is to lose yourself in the service of others."
          </Text>
          <Text style={styles.quoteAuthor}>— Mahatma Gandhi</Text>
        </View>

        {/* What to expect */}
        <View style={styles.expectRow}>
          <View style={styles.expectItem}>
            <Feather name="users" size={18} color="#f472b6" />
            <Text style={styles.expectLabel}>Real People</Text>
          </View>
          <View style={styles.expectDot} />
          <View style={styles.expectItem}>
            <Feather name="heart" size={18} color="#f472b6" />
            <Text style={styles.expectLabel}>Real Impact</Text>
          </View>
          <View style={styles.expectDot} />
          <View style={styles.expectItem}>
            <Feather name="camera" size={18} color="#f472b6" />
            <Text style={styles.expectLabel}>Capture It</Text>
          </View>
        </View>

      </Animated.View>

      {/* Bottom CTA */}
      <View style={styles.bottomArea}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.85}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
            onPress={() => router.push('/help-task')}
          >
            <LinearGradient colors={['#ec4899', '#db2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              <Text style={styles.startBtnText}>Start Helping</Text>
              <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131317' },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 15 },

  // Heart orb
  heartOrb: { marginBottom: 10, zIndex: 2 },
  heartGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#ec4899', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 8 }, shadowRadius: 25, elevation: 15 },

  // Rings behind heart
  ringWrap: { position: 'absolute', top: 30, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderRadius: 999 },
  ringOuter: { width: 160, height: 160, borderColor: 'rgba(244,114,182,0.15)' },
  ringInner: { width: 130, height: 130, borderColor: 'rgba(244,114,182,0.25)' },

  heading: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 42, marginTop: 10 },
  subheading: { color: '#a1a1aa', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 16, marginBottom: 28, fontWeight: '500', paddingHorizontal: 5 },

  // Quote card
  quoteCard: { backgroundColor: '#1b1b22', width: '100%', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#2d2d38', alignItems: 'center', marginBottom: 28 },
  quoteEmoji: { fontSize: 28, marginBottom: 10 },
  quoteText: { color: '#d4d4d8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  quoteAuthor: { color: '#71717a', fontSize: 12, marginTop: 8, fontWeight: '600' },

  // Expect row
  expectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  expectItem: { alignItems: 'center' },
  expectLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', marginTop: 6 },
  expectDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3f3f46', marginHorizontal: 18 },

  // Bottom area
  bottomArea: { paddingHorizontal: 24, paddingBottom: 38, paddingTop: 10 },
  startBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#ec4899', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 10 },
  btnGradient: { paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.8 },
});

