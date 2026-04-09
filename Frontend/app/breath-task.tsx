import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function BreathTaskScreen() {
  const router = useRouter();
  
  const TOTAL_SECONDS = 180; // 3 minutes
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Ready to begin?');

  const circleScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Timer run loop
  useEffect(() => {
    let interval: any;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && isActive) {
      router.replace({ pathname: '/task-success', params: { points: '100' } } as any);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Breathing animation loop (Box Breathing: 4s Inhale, 4s Hold, 4s Exhale, 4s Hold)
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const inhale = Animated.timing(circleScale, {
        toValue: 1.8,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      const hold1 = Animated.timing(circleScale, {
        toValue: 1.8,
        duration: 4000,
        useNativeDriver: true,
      });
      const exhale = Animated.timing(circleScale, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      const hold2 = Animated.timing(circleScale, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      });

      const sequence = Animated.sequence([inhale, hold1, exhale, hold2]);
      
      const loop = Animated.loop(sequence);
      loop.start();
      
      // Phase text tracking
      let phaseInterval = setInterval(() => {
        setPhase((prev) => {
          if (prev === 'Hold') return 'Exhale';
          if (prev === 'Exhale') return 'Hold empty';
          if (prev === 'Hold empty') return 'Inhale';
          return 'Hold';
        });
      }, 4000);
      
      setPhase('Inhale'); // start with inhale

      return () => {
        loop.stop();
        clearInterval(phaseInterval);
      };
    } else {
      circleScale.stopAnimation();
      setPhase('Ready to begin?');
      circleScale.setValue(1);
    }
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
        
        <View style={styles.topInfo}>
          <Text style={styles.title}>Breathe</Text>
          <Text style={styles.subtitle}>Box breathing (4-4-4-4) relaxes the nervous system.</Text>
        </View>

        <View style={styles.animationArea}>
          <Animated.View style={[styles.breathingCircle, { transform: [{ scale: circleScale }] }]} />
          <View style={styles.circleOverlay}>
            <Text style={styles.phaseText}>{phase}</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          
          {!isActive ? (
            <TouchableOpacity 
              style={styles.startBtn} 
              onPress={() => setIsActive(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Start Breathing</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.stopBtn, { backgroundColor: '#10b981', borderColor: '#059669' }]} 
                onPress={() => {
                  router.replace({ pathname: '/task-success', params: { points: '100' } } as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.stopBtnText}>Done Challenge</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.stopBtn} 
                onPress={() => {
                  setIsActive(false);
                  setTimeLeft(TOTAL_SECONDS);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.stopBtnText}>Stop & Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // deep slate
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
  topInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  animationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
  },
  breathingCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#38bdf8',
    opacity: 0.15,
  },
  circleOverlay: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },
  phaseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#fff',
    marginBottom: 40,
  },
  startBtn: {
    backgroundColor: '#38bdf8',
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  startBtnText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

