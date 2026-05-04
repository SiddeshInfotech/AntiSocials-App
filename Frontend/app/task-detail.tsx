import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bgScaleAnim = useRef(new Animated.Value(1)).current;

  // Background and fade in
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScaleAnim, { toValue: 1.05, duration: 25000, useNativeDriver: true }),
        Animated.timing(bgScaleAnim, { toValue: 1, duration: 25000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Timer run loop & pulse
  useEffect(() => {
    let interval: any = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      // HUD Breathing glow on timer
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

    } else if (timeLeft <= 0 && isActive) {
      clearInterval(interval);
      pulseAnim.stopAnimation();
      
      const completeTask = async () => {
        let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
        try {
          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ task_name: 'Sit without phone for 2 minutes' })
            });
            const data = await response.json();
            if (response.ok || data.success) {
              pointsData = { 
                pointsAdded: data.pointsAdded?.toString() || "0", 
                totalPoints: data.totalPoints?.toString() || "0",
                streak: data.streak?.toString() || "0"
              };
            }
          }
        } catch(e) { console.error(e); }

        router.replace({ 
          pathname: '/task-success', 
          params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak } 
        } as any);
      };
      completeTask();
    } else {
      pulseAnim.stopAnimation();
    }
    
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, router]);

  const handleStart = () => setIsActive(true);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((3600 - timeLeft) / 3600) * 100;

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
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        
        {/* Minimal HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <View style={styles.hudBackIcon}>
              <Feather name="x" size={20} color="#06B6D4" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>
          <View style={styles.systemStatus}>
            <View style={[styles.dotIndicator, isActive && !isPaused && { backgroundColor: '#10B981', shadowColor: '#10B981' }, isActive && isPaused && { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]} />
            <Text style={styles.statusText}>{isActive ? (isPaused ? 'SYS.PAUSED' : 'SYS.ACTIVE') : 'SYS.RDY'}</Text>
          </View>
        </View>

        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          
          <View style={styles.topText}>
            <Text style={styles.kicker}>PROTOCOL 01</Text>
            <Text style={styles.title}>{isActive ? 'ZONE ACTIVE' : 'AWAITING INITIATION'}</Text>
          </View>

          {/* Cinematic Timer Centerpiece */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerGlowHUD, { transform: [{ scale: isActive && !isPaused ? pulseAnim : 1 }] }]} />
            <View style={styles.timerInner}>
              <Text style={[styles.timerDigits, isPaused && { color: '#6B7280' }]}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>REMAINING DURATION</Text>
            </View>
          </View>

          <View style={styles.guidanceArea}>
            <Text style={styles.hudMessage}>
              {isActive 
                ? (isPaused ? 'PROTOCOL SUSPENDED.' : 'YOU ARE IN CONTROL NOW.')
                : 'NO DISTRACTIONS. JUST FOCUS.'}
            </Text>
          </View>

          <View style={styles.bottomControls}>
            {isActive ? (
              <View style={styles.activeBtnGroup}>
                <TouchableOpacity 
                  style={styles.pauseBtn} 
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>{isPaused ? 'CONTINUE' : 'PAUSE'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={async () => {
                    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
                    try {
                      const token = await SecureStore.getItemAsync('token');
                      if (token) {
                        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ task_name: 'Sit without phone for 2 minutes' })
                        });
                        const data = await response.json();
                        if (response.ok || data.success) {
                          pointsData = { 
                            pointsAdded: data.pointsAdded?.toString() || "0", 
                            totalPoints: data.totalPoints?.toString() || "0",
                            streak: data.streak?.toString() || "0"
                          };
                        }
                      }
                    } catch(e) { console.error(e); }

                    router.replace({ 
                      pathname: '/task-success', 
                      params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak } 
                    } as any);
                  }}
                  style={styles.completeBtnWrap}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.completeBtn}
                  >
                    <Text style={styles.completeBtnText}>COMPLETE SESSION</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.9} onPress={handleStart} style={styles.startBtnWrap}>
                <LinearGradient
                  colors={['#4F46E5', '#2563EB', '#06B6D4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.startBtn}
                >
                  <View style={styles.btnInnerGlow}>
                    <Text style={styles.startBtnText}>START FOCUS</Text>
                    <MaterialCommunityIcons name="chevron-double-right" size={24} color="#FFF" style={styles.btnIcon} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          
        </Animated.View>

        {/* HUD Progress Bar */}
        {isActive && (
          <View style={styles.hudProgressWrap}>
            <View style={styles.hudProgressBg}>
               <LinearGradient 
                 colors={['#06B6D4', '#3B82F6', '#4F46E5']} 
                 start={{x:0, y:0}} end={{x:1, y:0}} 
                 style={[styles.hudProgressFill, { width: `${progressPercentage}%` }]} 
               />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020205' },
  safeArea: { flex: 1 },
  
  vignetteTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.3, backgroundColor: 'rgba(2, 2, 5, 0.7)' },
  vignetteBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.4, backgroundColor: 'rgba(2, 2, 5, 0.9)' },
  
  header: { paddingHorizontal: 25, paddingTop: 15, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  hudBackIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)' },
  backText: { fontSize: 13, color: '#06B6D4', marginLeft: 10, fontWeight: '700', letterSpacing: 2 },
  
  systemStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dotIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#06B6D4', marginRight: 6, shadowColor: '#06B6D4', shadowOpacity: 1, shadowRadius: 5, shadowOffset: {width: 0, height: 0} },
  statusText: { fontSize: 10, color: '#8A94A6', fontWeight: '800', letterSpacing: 1.5 },

  mainContent: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25, paddingBottom: 40 },
  
  topText: { alignItems: 'center', marginTop: 40 },
  kicker: { fontSize: 12, color: '#8A94A6', fontWeight: '800', letterSpacing: 4, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },

  timerContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  timerGlowHUD: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: 'rgba(6, 182, 212, 0.05)', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)', shadowColor: '#06B6D4', shadowOpacity: 0.1, shadowRadius: 40, elevation: 1 },
  timerInner: { alignItems: 'center' },
  timerDigits: { fontSize: 96, fontWeight: '300', color: '#FFFFFF', letterSpacing: 4, fontVariant: ['tabular-nums'], textShadowColor: '#4F46E5', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  timerLabel: { fontSize: 12, color: '#8A94A6', fontWeight: '800', letterSpacing: 4, marginTop: 15 },
  
  guidanceArea: { backgroundColor: 'rgba(10, 12, 20, 0.6)', padding: 25, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center' },
  hudMessage: { color: '#06B6D4', fontSize: 14, fontWeight: '800', letterSpacing: 3, textAlign: 'center', textShadowColor: 'rgba(6, 182, 212, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  
  bottomControls: { width: '100%' },
  
  startBtnWrap: { width: '100%', borderRadius: 6, shadowColor: '#2563EB', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, elevation: 12 },
  startBtn: { width: '100%', borderRadius: 6, paddingVertical: 1, paddingHorizontal: 1 },
  btnInnerGlow: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 22, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  startBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  btnIcon: { marginLeft: 15, textShadowColor: 'rgba(255, 255, 255, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  
  activeBtnGroup: { flexDirection: 'column', gap: 15 },
  pauseBtn: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 20, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  pauseBtnText: { color: '#D1D5DB', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  
  completeBtnWrap: { width: '100%', borderRadius: 6, shadowColor: '#10B981', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, elevation: 8 },
  completeBtn: { width: '100%', paddingVertical: 22, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  
  hudProgressWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  hudProgressBg: { flex: 1 },
  hudProgressFill: { height: '100%', shadowColor: '#06B6D4', shadowOpacity: 1, shadowRadius: 10, shadowOffset: {width: 0, height:0} }
});
