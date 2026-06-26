import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

const TOTAL_SECONDS = 180;
const BREATH_CYCLE_SECONDS = 16;

const PHASES = [
  {
    label: 'Inhale',
    hint: 'Let your little buddy grow round and soft.',
    accent: '#38bdf8',
  },
  {
    label: 'Hold',
    hint: 'Stay still and cozy for a moment.',
    accent: '#818cf8',
  },
  {
    label: 'Exhale',
    hint: 'Let the air out slowly, like a tiny cloud.',
    accent: '#34d399',
  },
  {
    label: 'Hold',
    hint: 'Rest and reset before the next breath.',
    accent: '#f472b6',
  },
] as const;

function getBreathPhase(elapsedSeconds: number) {
  const cyclePosition = elapsedSeconds % BREATH_CYCLE_SECONDS;

  if (cyclePosition < 4) {
    return { ...PHASES[0], index: 0 };
  }

  if (cyclePosition < 8) {
    return { ...PHASES[1], index: 1 };
  }

  if (cyclePosition < 12) {
    return { ...PHASES[2], index: 2 };
  }

  return { ...PHASES[3], index: 3 };
}

export default function BreathTaskScreen() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [isActive, setIsActive] = useState(false);

  const breathAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.delay(2600),
      ]),
    );

    floatLoop.start();
    blinkLoop.start();

    return () => {
      floatLoop.stop();
      blinkLoop.stop();
    };
  }, [blinkAnim, floatAnim]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleCompleteTask = async () => {
    let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Breathe consciously for 3 minutes' })
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

  useEffect(() => {
    if (isActive && timeLeft <= 0) {
      handleCompleteTask();
    }
  }, [isActive, router, timeLeft]);

  useEffect(() => {
    if (isActive) {
      breathAnim.stopAnimation();
      breathAnim.setValue(0);

      const inhale = Animated.timing(breathAnim, {
        toValue: 0.5,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      const hold1 = Animated.timing(breathAnim, {
        toValue: 0.5,
        duration: 4000,
        useNativeDriver: true,
      });
      const exhale = Animated.timing(breathAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
      const hold2 = Animated.timing(breathAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      });

      const sequence = Animated.sequence([inhale, hold1, exhale, hold2]);
      
      const loop = Animated.loop(sequence);
      loop.start();

      return () => {
        loop.stop();
      };
    } else {
      breathAnim.stopAnimation();
      breathAnim.setValue(0);
    }
  }, [breathAnim, isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedSeconds = TOTAL_SECONDS - timeLeft;
  const phase = isActive ? getBreathPhase(elapsedSeconds) : null;

  const breathScale = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.13, 1],
  });

  const breathLift = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [10, 0, 10],
  });

  const ringScale = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.14, 0.98],
  });

  const ringOpacity = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.55, 0.3],
  });

  const cheekOpacity = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.55, 0.25],
  });

  const mouthOpen = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.95, 0.5],
  });

  const armLift = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [8, 0, 10],
  });

  const puffOpacity = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.1, 0.9],
  });

  const puffScale = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.75, 0.95, 1.18],
  });

  const puffTranslate = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [18, 10, -2],
  });

  const noseBounce = breathAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 1],
  });

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const floatRotate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const blinkScale = blinkAnim.interpolate({
    inputRange: [0.15, 1],
    outputRange: [0.15, 1],
  });

  const handleStart = () => {
    setIsActive(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(TOTAL_SECONDS);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0b1020', '#0f172a', '#111827', '#0b1328']}
        locations={[0, 0.42, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.main, { opacity: fadeAnim }]}>
        
        <View style={styles.topInfo}>
          <Text style={styles.title}>Breathe</Text>
          <Text style={styles.subtitle}>Watch the buddy breathe with you. Keep the timing soft and steady.</Text>
        </View>

        <View style={styles.animationArea}>
          <Animated.View
            style={[
              styles.mascotWrap,
              {
                transform: [{ translateY: floatTranslate }, { rotate: floatRotate }],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.puff,
                styles.puffLeft,
                {
                  opacity: puffOpacity,
                  transform: [{ translateY: puffTranslate }, { scale: puffScale }],
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.puff,
                styles.puffRight,
                {
                  opacity: puffOpacity,
                  transform: [{ translateY: puffTranslate }, { scale: puffScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.mascot,
                {
                  transform: [{ scale: breathScale }, { translateY: breathLift }],
                },
              ]}
            >
              <View style={styles.earLeft} />
              <View style={styles.earRight} />
              <View style={styles.bodyShadow} />
              <View style={styles.head}>
                <View style={styles.faceRow}>
                  <Animated.View style={[styles.eye, { transform: [{ scaleY: blinkScale }] }]} />
                  <Animated.View style={[styles.nose, { transform: [{ translateY: noseBounce }] }]} />
                  <Animated.View style={[styles.eye, { transform: [{ scaleY: blinkScale }] }]} />
                </View>
                <Animated.View style={[styles.mouth, { transform: [{ scaleY: mouthOpen }] }]} />
                <Animated.View style={[styles.cheekLeft, { opacity: cheekOpacity }]} />
                <Animated.View style={[styles.cheekRight, { opacity: cheekOpacity }]} />
              </View>
              <View style={styles.body}>
                <Animated.View
                  style={[
                    styles.belly,
                    {
                      transform: [{ scale: breathScale }],
                    },
                  ]}
                />
                <Animated.View style={[styles.armLeft, { transform: [{ rotate: '-24deg' }, { translateY: armLift }] }]} />
                <Animated.View style={[styles.armRight, { transform: [{ rotate: '24deg' }, { translateY: armLift }] }]} />
                <View style={styles.footLeft} />
                <View style={styles.footRight} />
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.phaseCard}>
            <View style={styles.phaseDots}>
              {PHASES.map((item, index) => (
                <View
                  key={item.label + index}
                  style={[
                    styles.phaseDot,
                    phase && index === phase.index && { backgroundColor: item.accent, transform: [{ scale: 1.2 }] },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.phaseText}>{phase ? phase.label : 'Ready to begin'}</Text>
            <Text style={styles.phaseHint}>{phase ? phase.hint : 'Tap Start Breathing and follow the little character.'}</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          
          {!isActive ? (
            <TouchableOpacity 
              style={styles.startBtn} 
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Start Breathing</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.stopBtn, { backgroundColor: '#10b981', borderColor: '#059669' }]} 
                onPress={handleCompleteTask}
                activeOpacity={0.8}
              >
                <Text style={styles.stopBtnText}>Done Challenge</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.stopBtn} 
                onPress={handleReset}
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
    backgroundColor: '#0b1020',
  },
  glowTopLeft: {
    position: 'absolute',
    top: -80,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  glowBottomRight: {
    position: 'absolute',
    right: -90,
    bottom: 120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
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
    paddingBottom: 42,
  },
  topInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 8,
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
    width: '100%',
    paddingHorizontal: 20,
  },
  mascotWrap: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 14,
    borderColor: 'rgba(56, 189, 248, 0.42)',
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
  },
  mascot: {
    width: 176,
    height: 216,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  puff: {
    position: 'absolute',
    top: 110,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(224, 242, 254, 0.9)',
    shadowColor: '#7dd3fc',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  puffLeft: {
    left: 52,
  },
  puffRight: {
    right: 52,
  },
  bodyShadow: {
    position: 'absolute',
    bottom: 24,
    width: 154,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  earLeft: {
    position: 'absolute',
    top: 10,
    left: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f9d5c4',
    borderWidth: 8,
    borderColor: '#ffd9be',
  },
  earRight: {
    position: 'absolute',
    top: 10,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f9d5c4',
    borderWidth: 8,
    borderColor: '#ffd9be',
  },
  head: {
    width: 154,
    height: 136,
    borderRadius: 60,
    backgroundColor: '#ffd7b6',
    borderWidth: 4,
    borderColor: '#f1b46d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f1b46d',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  faceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    marginTop: 10,
  },
  eye: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#3f2d24',
  },
  nose: {
    width: 18,
    height: 12,
    borderRadius: 9,
    backgroundColor: '#4b3326',
    marginTop: 4,
  },
  mouth: {
    width: 28,
    height: 14,
    borderBottomWidth: 4,
    borderColor: '#7c4b3a',
    borderRadius: 20,
    marginTop: 8,
  },
  cheekLeft: {
    position: 'absolute',
    left: 18,
    top: 64,
    width: 24,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#fb7185',
  },
  cheekRight: {
    position: 'absolute',
    right: 18,
    top: 64,
    width: 24,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#fb7185',
  },
  body: {
    position: 'absolute',
    bottom: 20,
    width: 136,
    height: 114,
    borderRadius: 52,
    backgroundColor: '#ffc07d',
    borderWidth: 4,
    borderColor: '#f1b46d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  belly: {
    width: 78,
    height: 68,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 248, 238, 0.72)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  armLeft: {
    position: 'absolute',
    left: -16,
    top: 34,
    width: 42,
    height: 18,
    borderRadius: 20,
    backgroundColor: '#ffc07d',
    borderWidth: 4,
    borderColor: '#f1b46d',
  },
  armRight: {
    position: 'absolute',
    right: -16,
    top: 34,
    width: 42,
    height: 18,
    borderRadius: 20,
    backgroundColor: '#ffc07d',
    borderWidth: 4,
    borderColor: '#f1b46d',
  },
  footLeft: {
    position: 'absolute',
    left: 26,
    bottom: -10,
    width: 30,
    height: 20,
    borderRadius: 16,
    backgroundColor: '#f4b977',
  },
  footRight: {
    position: 'absolute',
    right: 26,
    bottom: -10,
    width: 30,
    height: 20,
    borderRadius: 16,
    backgroundColor: '#f4b977',
  },
  phaseCard: {
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    marginTop: 10,
  },
  phaseDots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  phaseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  phaseHint: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
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
    marginBottom: 26,
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

