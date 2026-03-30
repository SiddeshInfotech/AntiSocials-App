import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function HelpCompleteScreen() {
  const router = useRouter();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(btnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#ec489920', '#131317', '#131317']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Confetti particles */}
      {[...Array(6)].map((_, i) => {
        const xStart = 30 + Math.random() * 300;
        const size = 6 + Math.random() * 6;
        const colours = ['#ec4899', '#f472b6', '#d9fc00', '#8b5cf6', '#3b82f6', '#10b981'];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: xStart,
              top: 120,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colours[i % colours.length],
              opacity: confettiAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0.3] }),
              transform: [
                { translateY: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 250 + Math.random() * 200] }) },
                { translateX: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() - 0.5) * 100] }) },
                { scale: confettiAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.5, 0.5] }) },
              ],
            }}
          />
        );
      })}

      <View style={styles.content}>

        {/* Success circle */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#f472b6', '#ec4899']} style={styles.successGradient}>
            <Feather name="heart" size={50} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>

          <Text style={styles.title}>Task Completed!</Text>
          <Text style={styles.subtitle}>
            You made someone's day better ❤️{'\n'}The world is a little warmer because of you.
          </Text>

          {/* Points badge */}
          <View style={styles.pointsBadge}>
            <FontAwesome5 name="fire-alt" size={22} color="#d9fc00" />
            <Text style={styles.pointsText}>+200 Points Earned</Text>
          </View>

          {/* Appreciation message */}
          <View style={styles.appreciationCard}>
            <Text style={styles.appreciationEmoji}>🌟</Text>
            <Text style={styles.appreciationText}>
              Kindness is never wasted. Every act of compassion plants a seed that blooms far beyond what you can see. Thank you for being human today.
            </Text>
          </View>

        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottomArea, { opacity: btnFade }]}>
        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)/tasks')}
        >
          <LinearGradient colors={['#ec4899', '#db2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
            <Text style={styles.continueBtnText}>Continue Journey</Text>
            <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131317' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  successCircle: {
    marginBottom: 30, shadowColor: '#ec4899', shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 10 }, shadowRadius: 30, elevation: 15,
  },
  successGradient: { width: 115, height: 115, borderRadius: 57, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#a1a1aa', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 28, fontWeight: '500' },

  pointsBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(217,252,0,0.12)', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(217,252,0,0.3)',
  },
  pointsText: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 10 },

  appreciationCard: {
    backgroundColor: '#1b1b22', width: '100%', borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: '#2d2d38', alignItems: 'center',
  },
  appreciationEmoji: { fontSize: 28, marginBottom: 10 },
  appreciationText: { color: '#a1a1aa', fontSize: 13, lineHeight: 22, textAlign: 'center', fontWeight: '500' },

  bottomArea: { paddingHorizontal: 24, paddingBottom: 38, paddingTop: 8 },
  continueBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#ec4899', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 10 },
  btnGradient: { paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.8 },
});
