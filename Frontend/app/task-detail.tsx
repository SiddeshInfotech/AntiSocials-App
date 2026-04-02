import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line } from 'react-native-svg';

export default function TaskDetailScreen() {
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initial fade-in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, 
      duration: 600, 
      useNativeDriver: true
    }).start();
  }, []);

  // Timer run loop
  useEffect(() => {
    let interval: any = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

    } else if (timeLeft <= 0 && isActive) {
      clearInterval(interval);
      pulseAnim.stopAnimation();
      router.replace('/task-complete');
    } else {
      pulseAnim.stopAnimation();
    }
    
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, router]);

  const handleStart = () => setIsActive(true);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((3600 - timeLeft) / 3600) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <Feather name="arrow-left" size={24} color="#4b5563" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content inside ScrollView for flexible overflow */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          
          <Text style={styles.title}>Sit in silence</Text>
          <Text style={styles.subtitle}>Observe the sounds around you</Text>

          {/* New Custom Graphic matching Reference Image perfectly */}
          <Animated.View style={[styles.graphicsBox, { transform: [{ scale: pulseAnim }] }]}>
            
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              {/* Vertical audio-like wave lines */}
              <Line x1="30%" y1="15%" x2="30%" y2="85%" stroke="#c4b5fd" strokeWidth="2" strokeOpacity={0.5} strokeLinecap="round" />
              <Line x1="40%" y1="25%" x2="40%" y2="75%" stroke="#c4b5fd" strokeWidth="2" strokeOpacity={0.5} strokeLinecap="round" />
              <Line x1="50%" y1="8%" x2="50%" y2="92%" stroke="#a78bfa" strokeWidth="2" strokeOpacity={0.7} strokeLinecap="round" />
              <Line x1="60%" y1="20%" x2="60%" y2="80%" stroke="#c4b5fd" strokeWidth="2" strokeOpacity={0.5} strokeLinecap="round" />
              <Line x1="70%" y1="30%" x2="70%" y2="70%" stroke="#c4b5fd" strokeWidth="2" strokeOpacity={0.5} strokeLinecap="round" />
              
              {/* Concentric meditation rings */}
              <Circle cx="50%" cy="50%" r="45" stroke="#a78bfa" strokeWidth="1.5" strokeOpacity={0.6} fill="none" />
              <Circle cx="50%" cy="50%" r="75" stroke="#c4b5fd" strokeWidth="1" strokeOpacity={0.4} fill="none" />
            </Svg>

            {/* Custom Meditating Silhouette */}
            <View style={styles.meditator}>
              <View style={styles.medHead} />
              <View style={styles.medBody} />
              <View style={styles.medLegs} />
            </View>

            {/* Floating Elements */}
            <View style={{position: 'absolute', top: 40, left: 50, opacity: 0.8}}>
               <Feather name="music" size={24} color="#d8b4fe" />
            </View>
            <View style={{position: 'absolute', top: 50, right: 60, opacity: 0.9}}>
               <FontAwesome5 name="dove" size={20} color="#f472b6" />
            </View>

          </Animated.View>

          {/* Active Timer Display */}
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerSub}>Time remaining</Text>

          {/* Conditional UI based on state */}
          {isActive ? (
            <Animated.View style={styles.activeContentBox}>
              
              {/* Prompts list exactly like reference */}
              <View style={styles.promptsCard}>
                <View style={styles.promptsHeader}>
                  <Feather name="volume-2" size={18} color="#6A61FF" />
                  <Text style={styles.promptsTitle}>What sounds do you notice?</Text>
                </View>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• Distant voices or conversations</Text>
                  <Text style={styles.bulletItem}>• Nature sounds (birds, wind, leaves)</Text>
                  <Text style={styles.bulletItem}>• Your own breathing</Text>
                  <Text style={styles.bulletItem}>• Background hum or silence</Text>
                </View>
              </View>

              {/* Buttons Row */}
              <View style={{ gap: 12, marginTop: 15, width: '100%' }}>
                <TouchableOpacity 
                  style={styles.pauseBtn} 
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.pauseBtn, { backgroundColor: '#10b981', borderColor: '#059669' }]} 
                  onPress={() => router.replace({ pathname: '/task-success', params: { points: '200' } } as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pauseBtnText, { color: '#ffffff' }]}>Done Challenge</Text>
                </TouchableOpacity>
              </View>
              
            </Animated.View>
          ) : (
            <TouchableOpacity 
              style={styles.startBtn} 
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Begin Silent Observation</Text>
            </TouchableOpacity>
          )}

          {/* Always-visible Tooltip matched natively to image 1 and 2 */}
          <View style={styles.tooltipBox}>
            <Text style={{marginRight: 8}}>🔕</Text>
            <Text style={styles.tooltipText}>Put your phone on silent and simply observe the world around you</Text>
          </View>
          
        </Animated.View>
      </ScrollView>

      {/* Timer Progress Indicator at very bottom over tab area */}
      {isActive && (
        <View style={styles.progressBg}>
           <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#ffffff', zIndex: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: '#4b5563', marginLeft: 8 },
  scrollContent: { alignItems: 'center', paddingHorizontal: 25, paddingBottom: 60, paddingTop: 10 },
  
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 8 },
  
  graphicsBox: {
    backgroundColor: '#f5f3ff', width: '100%', height: 220, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginTop: 35, marginBottom: 35,
    overflow: 'hidden'
  },
  meditator: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  medHead: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#6A61FF', marginBottom: -2 },
  medBody: { width: 36, height: 26, borderRadius: 12, backgroundColor: '#6A61FF', zIndex: 2 },
  medLegs: { width: 48, height: 16, borderRadius: 10, backgroundColor: '#6A61FF', marginTop: -8, zIndex: 1 },

  timerText: { fontSize: 62, fontWeight: '300', color: '#111827', letterSpacing: 1 },
  timerSub: { fontSize: 13, color: '#9ca3af', marginBottom: 25 },
  
  startBtn: {
    backgroundColor: '#a78bfa', width: '100%', paddingVertical: 18,
    borderRadius: 12, alignItems: 'center', marginBottom: 20
  },
  startBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  activeContentBox: { width: '100%', alignItems: 'center' },
  promptsCard: {
    backgroundColor: '#f5f3ff', width: '100%', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#ede9fe', marginBottom: 20
  },
  promptsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptsTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginLeft: 10 },
  bulletList: { marginLeft: 5 },
  bulletItem: { fontSize: 13, color: '#4b5563', lineHeight: 22 },
  
  pauseBtn: {
    backgroundColor: '#e5e7eb', width: '100%', paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 20
  },
  pauseBtnText: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
  
  tooltipBox: {
    flexDirection: 'row', backgroundColor: '#faf5ff', width: '100%', borderRadius: 12,
    padding: 18, borderWidth: 1, borderColor: '#f3eafe', alignItems: 'center', justifyContent: 'center'
  },
  tooltipText: { color: '#4b5563', fontSize: 13, lineHeight: 20, flex: 1, textAlign: 'center' },
  
  progressBg: { width: '100%', height: 4, backgroundColor: '#f3f4f6', position: 'absolute', bottom: 0 },
  progressFill: { height: '100%', backgroundColor: '#10b981' }
});