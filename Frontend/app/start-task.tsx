import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function StartTaskScreen() {
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const bgScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Cinematic entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
    ]).start();

    // Slow cinematic background zoom
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScaleAnim, { toValue: 1.05, duration: 25000, useNativeDriver: true }),
        Animated.timing(bgScaleAnim, { toValue: 1, duration: 25000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handlePressIn = () => Animated.timing(btnScale, { toValue: 0.96, duration: 150, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.timing(btnScale, { toValue: 1, duration: 250, useNativeDriver: true }).start();

  const handleStart = () => router.push('/task-detail');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Cinematic Deep Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: bgScaleAnim }] }]}>
        <LinearGradient
          colors={['#020205', '#0B0818', '#210C2B', '#4D1227', '#80261E']}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1.1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Dark vignette overlay for depth */}
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>

        {/* Minimal HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <View style={styles.hudBackIcon}>
              <Feather name="arrow-left" size={20} color="#06B6D4" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>
          <View style={styles.systemStatus}>
            <View style={styles.dotIndicator} />
            <Text style={styles.statusText}>SYS.RDY</Text>
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Main Cinematic Title Area */}
          <View style={styles.titleArea}>
            <Text style={styles.kicker}>PROTOCOL 01</Text>
            <Text style={styles.heroTitle}>DISCONNECT.</Text>
            <Text style={styles.heroSub}>OWN YOUR TIME.</Text>

            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#06B6D4" />
              <Text style={styles.timerBadgeText}>1 HOUR TARGET</Text>
            </View>
          </View>

          {/* HUD Content panel */}
          <View style={styles.hudPanel}>
            <View style={styles.panelEdgeIndicator} />
            <Text style={styles.panelTitle}>OBJECTIVE</Text>
            <Text style={styles.panelText}>Maintain complete detachment from the device. Silence sharpens the mind.</Text>

            <View style={styles.divider} />

            <Text style={styles.panelTitle}>YIELD</Text>
            <Text style={styles.panelText}>Discipline builds control. Complete this protocol to forge mental resilience.</Text>
          </View>

        </Animated.View>

        {/* Action Area */}
        <View style={styles.bottomArea}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleStart} activeOpacity={0.9}>
              <LinearGradient
                colors={['#4F46E5', '#2563EB', '#06B6D4']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.actionBtn}
              >
                <View style={styles.btnInnerGlow}>
                  <Text style={styles.actionBtnText}>START FOCUS</Text>
                  <MaterialCommunityIcons name="chevron-double-right" size={24} color="#FFF" style={styles.btnIcon} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1 },

  vignetteTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.3, backgroundColor: 'rgba(2, 2, 5, 0.7)' },
  vignetteBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.4, backgroundColor: 'rgba(2, 2, 5, 0.9)' },

  header: { paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  hudBackIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)' },
  backText: { fontSize: 13, color: '#06B6D4', marginLeft: 10, fontWeight: '700', letterSpacing: 2 },

  systemStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dotIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#06B6D4', marginRight: 6, shadowColor: '#06B6D4', shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  statusText: { fontSize: 10, color: '#8A94A6', fontWeight: '800', letterSpacing: 1.5 },

  content: { flex: 1, paddingTop: 40, paddingHorizontal: 25 },

  titleArea: { marginBottom: 50 },
  kicker: { fontSize: 12, color: '#06B6D4', fontWeight: '800', letterSpacing: 4, marginBottom: 15, opacity: 0.8 },
  heroTitle: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginBottom: 5, textShadowColor: 'rgba(255, 255, 255, 0.2)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  heroSub: { fontSize: 32, fontWeight: '900', color: 'rgba(255, 255, 255, 0.3)', letterSpacing: 1 },

  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(6, 182, 212, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 25, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)' },
  timerBadgeText: { color: '#06B6D4', fontSize: 14, fontWeight: '800', letterSpacing: 2, marginLeft: 8 },

  hudPanel: { width: '100%', backgroundColor: 'rgba(10, 12, 20, 0.6)', padding: 25, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', position: 'relative' },
  panelEdgeIndicator: { position: 'absolute', left: -1, top: 20, bottom: 20, width: 3, backgroundColor: '#06B6D4', shadowColor: '#06B6D4', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  panelTitle: { color: '#8A94A6', fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 8 },
  panelText: { color: '#D1D5DB', fontSize: 16, fontWeight: '400', lineHeight: 26, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: 20 },

  bottomArea: { paddingHorizontal: 25, paddingBottom: Platform.OS === 'ios' ? 20 : 40, width: '100%' },
  actionBtn: { width: '100%', borderRadius: 6, paddingVertical: 1, paddingHorizontal: 1, shadowColor: '#2563EB', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, elevation: 12 },
  btnInnerGlow: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 22, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  actionBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  btnIcon: { marginLeft: 15, textShadowColor: 'rgba(255, 255, 255, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }
});
