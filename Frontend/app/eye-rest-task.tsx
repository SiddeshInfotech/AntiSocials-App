import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 120; // 2 minutes

// Animated Dog Component
const AnimatedDog = ({ scaleAnim }: any) => (
  <Animated.View style={{
    position: 'absolute',
    bottom: '10%',
    right: '15%',
    transform: [{ scale: scaleAnim }],
  }}>
    <Text style={{ fontSize: 120 }}>🐕</Text>
  </Animated.View>
);

// Animated Mountain Background
const Mountain = ({ translateX }: any) => (
  <Animated.View style={{
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    transform: [{ translateX }],
  }}>
    <Text style={{
      fontSize: 100,
      textAlign: 'center',
      opacity: 0.6,
    }}>⛰️</Text>
  </Animated.View>
);

export default function EyeRestTaskScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.5)).current;
  const dogScaleAnim = useRef(new Animated.Value(1)).current;
  const mountainTranslateAnim = useRef(new Animated.Value(0)).current;
  const breathingScale = useRef(new Animated.Value(1)).current;
  const uiFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Timer glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(timerGlowAnim, {
          toValue: 0.6,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle breathing animation for the scene
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: 1.05,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dog head turn animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dogScaleAnim, {
          toValue: 1.05,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dogScaleAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle mountain parallax
    Animated.loop(
      Animated.sequence([
        Animated.timing(mountainTranslateAnim, {
          toValue: 10,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mountainTranslateAnim, {
          toValue: -10,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any;

    if (isActive && !isCompleted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && isActive) {
      setIsCompleted(true);
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, isCompleted, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    // Hide UI slightly during task
    Animated.timing(uiFadeAnim, {
      toValue: 0.7,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isCompleted) {
    router.replace('/task-complete');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#ADD8E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Mountain Background */}
      <Mountain translateX={mountainTranslateAnim} />

      {/* Animated Dog */}
      <AnimatedDog scaleAnim={dogScaleAnim} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.6}
          >
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eye Rest</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Scrollable Content */}
        <View style={styles.content}>
          {!isActive && (
            <Animated.View
              style={[
                styles.infoContainer,
                { opacity: uiFadeAnim },
              ]}
            >
              <Text style={styles.taskTitle}>Look at Something Far Away</Text>
              <Text style={styles.taskDescription}>
                Relax your eyes and take slow breaths. Look at something at least 20 feet away.
              </Text>

              {/* Benefits Section */}
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Benefits</Text>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>👁️</Text>
                  <Text style={styles.benefitText}>Reduces eye strain</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>😌</Text>
                  <Text style={styles.benefitText}>Relieves your eyes</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🎯</Text>
                  <Text style={styles.benefitText}>Improves focus</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✨</Text>
                  <Text style={styles.benefitText}>Refreshes your mind</Text>
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Instructions</Text>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionText}>Look at something at least 20 feet away</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionText}>Blink naturally</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionText}>Take slow breaths</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Timer Section */}
          {isActive && (
            <View style={styles.timerContainer}>
              <Animated.View
                style={[
                  styles.timerCircle,
                  {
                    transform: [{ scale: timerGlowAnim }],
                    shadowOpacity: timerGlowAnim,
                  },
                ]}
              >
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </Animated.View>
              <Text style={styles.timerLabel}>Time Remaining</Text>

              {/* Instructions During Task */}
              <View style={styles.duringTaskInstructions}>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepIcon}>👀</Text>
                  <Text style={styles.stepText}>Look at something far away</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepIcon}>😌</Text>
                  <Text style={styles.stepText}>Relax your eye muscles</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepIcon}>🌬️</Text>
                  <Text style={styles.stepText}>Take slow breaths</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Button */}
        {!isActive && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Eye Rest</Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              setIsCompleted(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>I Rested My Eyes</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  safeArea: {
    flex: 1,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  infoContainer: {
    paddingVertical: 20,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  taskDescription: {
    fontSize: 16,
    color: '#f0f9ff',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#f0f9ff',
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    color: '#f0f9ff',
    flex: 1,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
  },
  timerLabel: {
    fontSize: 16,
    color: '#f0f9ff',
    marginBottom: 28,
  },
  duringTaskInstructions: {
    marginTop: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#f0f9ff',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
