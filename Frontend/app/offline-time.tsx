import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OfflineTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes (1200 seconds)
  const [isActive, setIsActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    if (isActive && timeLeft > 0) {
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
      router.replace({ pathname: '/task-success', params: { points: '400' } } as any);
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, router]);

  const handleStart = () => setIsActive(true);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((1200 - timeLeft) / 1200) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fafafa" />
      
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity style={styles.backBtnLight} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks')}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.heroEmoji}>🤝</Text>
          </Animated.View>

          <View style={styles.dayPill}>
             <Text style={styles.dayPillText}>Light Reconnection</Text>
          </View>

          <Text style={styles.mainTitle}>{isActive ? "Time to disconnect" : "Spend 20 mins offline"}</Text>
          <Text style={styles.subtitle}>
            {isActive ? "Focus on the present moment with someone." : "Put your phone away and give someone your undivided attention."}
          </Text>

          {!isActive ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why this matters:</Text>
              <View style={styles.rewardRow}>
                <Feather name="check-circle" size={18} color="#a855f7" />
                <Text style={styles.rewardText}>Earn 400 points after completion</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerSub}>Time remaining</Text>
              
              <View style={styles.activeContentBox}>
                <View style={styles.promptsCard}>
                  <View style={styles.promptsHeader}>
                    <Feather name="wifi-off" size={18} color="#6A61FF" />
                    <Text style={styles.promptsTitle}>Stay fully present</Text>
                  </View>
                  <View style={styles.bulletList}>
                    <Text style={styles.bulletItem}>• Keep your phone on silent or in another room</Text>
                    <Text style={styles.bulletItem}>• Give them your full eye contact</Text>
                    <Text style={styles.bulletItem}>• Ask open-ended questions</Text>
                  </View>
                </View>
              </View>
            </>
          )}

        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {!isActive ? (
          <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
            <LinearGradient
               colors={['#a855f7', '#3b82f6']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 0 }}
               style={styles.gradientBtn}
            >
               <Text style={styles.startText}>Start Timer</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.completeBtn} 
            onPress={() => router.replace({ pathname: '/task-success', params: { points: '400' } } as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>Complete Early</Text>
          </TouchableOpacity>
        )}
      </View>

      {isActive && (
        <View style={styles.progressBg}>
           <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  headerLight: {
    backgroundColor: '#fafafa',
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6', 
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#a855f7',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroEmoji: {
    fontSize: 100, 
  },
  dayPill: {
    backgroundColor: '#f3e8ff', 
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  dayPillText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#faf5ff', 
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9d5ff', 
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
  timerText: { fontSize: 62, fontWeight: '300', color: '#111827', letterSpacing: 1 },
  timerSub: { fontSize: 13, color: '#9ca3af', marginBottom: 25 },
  activeContentBox: { width: '100%', alignItems: 'center' },
  promptsCard: {
    backgroundColor: '#f5f3ff', width: '100%', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#ede9fe', marginBottom: 20
  },
  promptsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptsTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginLeft: 10 },
  bulletList: { marginLeft: 5 },
  bulletItem: { fontSize: 13, color: '#4b5563', lineHeight: 22 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#fafafa',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeBtn: {
    backgroundColor: '#e5e7eb', 
    width: '100%', 
    height: 56,
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  completeBtnText: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
  progressBg: { width: '100%', height: 4, backgroundColor: '#f3f4f6', position: 'absolute', bottom: 0 },
  progressFill: { height: '100%', backgroundColor: '#10b981' }
});
