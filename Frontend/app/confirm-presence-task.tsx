import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 60;

// ========== PARTICLE COMPONENTS ==========

// Glowing Particle
const GlowingParticle = ({ index }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 200;
    const randomX = (Math.random() - 0.5) * 100;
    const randomDuration = 3000 + Math.random() * 2000;

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -80,
              duration: randomDuration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: randomX,
              duration: randomDuration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.3,
              duration: randomDuration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#FFD700',
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    />
  );
};

// Floating Leaf
const FloatingLeaf = ({ index }: any) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 60;
    const duration = 4000 + index * 500;

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -120,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: randomX,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 360,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotateInterpolate },
        ],
      }}
    >
      <Text style={{ fontSize: 16 }}>🍃</Text>
    </Animated.View>
  );
};

// Breathing Circle
const BreathingCircle = ({ size, duration, delay }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: '#87CEEB',
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    />
  );
};

// ========== PUPPY COMPONENT ==========

const AnimatedDogImage = ({ blinkAnim, isActive }: any) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 12,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.08,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [isActive]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
      {/* Breathing Circles Background */}
      <BreathingCircle size={200} duration={3000} delay={0} />
      <BreathingCircle size={160} duration={2500} delay={300} />
      <BreathingCircle size={120} duration={2000} delay={600} />

      {/* Glow Effect */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#FFD700',
          opacity: glowAnim.interpolate({
            inputRange: [0.5, 1],
            outputRange: [0.1, 0.25],
          }),
        }}
      />

      {/* Animated Dog Image */}
      <Animated.View
        style={{
          transform: [{ translateY: floatAnim }, { scale: breatheScale }],
        }}
      >
        <Image
          source={require('../assets/images/dog-puppy-on-garden-royalty-free-image-1586966191.avif')}
          style={styles.dogImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

// ========== CONFETTI COMPONENT ==========

const Confetti = ({ index }: any) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const translateX = useRef(new Animated.Value(width / 2)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * width * 1.2;
    const randomDelay = index * 50;

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    }, randomDelay);
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const emojis = ['🎉', '✨', '🌟', '💫', '🎊'];
  const emoji = emojis[index % emojis.length];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotateInterpolate },
        ],
      }}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  );
};

// ========== MAIN SCREEN COMPONENT ==========

export default function ConfirmPresenceTaskScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState(0); // 0: Details, 1: Active, 2: Success
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [checkedItems, setCheckedItems] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;
  const successOpacityAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, 5000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Active timer
  useEffect(() => {
    if (screen !== 1 || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setScreen(2);
          return 0;
        }
        return prev - 1;
      });

      // Check progress for green marks
      const progress = ((TASK_DURATION - timeLeft) / TASK_DURATION) * 4;
      setCheckedItems(Math.floor(progress));
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, timeLeft]);

  // Success animation
  useEffect(() => {
    if (screen === 2) {
      Animated.parallel([
        Animated.timing(successScaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.elastic(0.7),
          useNativeDriver: true,
        }),
        Animated.timing(successOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [screen]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const handleStartTask = () => {
    setScreen(1);
    setTimeLeft(TASK_DURATION);
    setCheckedItems(0);
  };

  const handleBackToHome = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/task-complete' as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF8E7', '#E0F6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        {/* ===== SCREEN 0: TASK DETAILS ===== */}
        {screen === 0 && (
          <Animated.ScrollView
            style={[styles.content, { opacity: fadeAnim }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToHome}
              >
                <Feather name="chevron-left" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Mindfulness</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Puppy */}
            <View style={styles.puppyContainer}>
              {[0, 1, 2, 3].map((i) => (
                <GlowingParticle key={`glow-${i}`} index={i} />
              ))}
              {[0, 1, 2].map((i) => (
                <FloatingLeaf key={`leaf-${i}`} index={i} />
              ))}
              <AnimatedDogImage blinkAnim={blinkAnim} isActive={false} />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Confirm Presence</Text>
            <Text style={styles.subtitle}>
              Pause for a moment and reconnect with your surroundings.
            </Text>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Take 60 seconds to simply notice where you are.
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>🧠</Text>
                <Text style={styles.benefitText}>Improves mindfulness</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>😌</Text>
                <Text style={styles.benefitText}>Reduces stress</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>🎯</Text>
                <Text style={styles.benefitText}>Brings attention back</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitEmoji}>📵</Text>
                <Text style={styles.benefitText}>Breaks screen addiction</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>Easy</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>60s</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Reward</Text>
                <Text style={styles.statValue}>+10 pts</Text>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartTask}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Start Presence Check</Text>
              <Feather name="play" size={16} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </Animated.ScrollView>
        )}

        {/* ===== SCREEN 1: ACTIVE TASK ===== */}
        {screen === 1 && (
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Ambient background elements */}
            {[0, 1, 2, 3, 4].map((i) => (
              <GlowingParticle key={`active-glow-${i}`} index={i} />
            ))}

            {/* Puppy */}
            <View style={styles.activePuppyContainer}>
              <AnimatedDogImage blinkAnim={blinkAnim} isActive={true} />
            </View>

            {/* Timer */}
            <View style={styles.timerSection}>
              <View style={styles.circularTimer}>
                <Text style={styles.timerText}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, TASK_DURATION],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Notice:</Text>

              <View style={styles.instruction}>
                <Text style={styles.instructionEmoji}>👀</Text>
                <Text style={styles.instructionText}>3 things you can see</Text>
                {checkedItems >= 1 && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.instruction}>
                <Text style={styles.instructionEmoji}>👂</Text>
                <Text style={styles.instructionText}>2 things you can hear</Text>
                {checkedItems >= 2 && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.instruction}>
                <Text style={styles.instructionEmoji}>🌬️</Text>
                <Text style={styles.instructionText}>Take one deep breath</Text>
                {checkedItems >= 3 && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.instruction}>
                <Text style={styles.instructionEmoji}>❤️</Text>
                <Text style={styles.instructionText}>Smile gently</Text>
                {checkedItems >= 4 && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>

            <Text style={styles.bottomText}>Stay in the present.</Text>
          </Animated.View>
        )}

        {/* ===== SCREEN 2: SUCCESS ===== */}
        {screen === 2 && (
          <View style={styles.content}>
            {/* Confetti */}
            {[...Array(15)].map((_, i) => (
              <Confetti key={`confetti-${i}`} index={i} />
            ))}

            {/* Success Content */}
            <Animated.View
              style={[
                styles.successContent,
                {
                  opacity: successOpacityAnim,
                  transform: [{ scale: successScaleAnim }],
                },
              ]}
            >
              {/* Happy Puppy */}
              <View style={styles.successPuppyContainer}>
                <AnimatedDogImage blinkAnim={blinkAnim} isActive={true} />
              </View>

              {/* Checkmark */}
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmarkLarge}>✓</Text>
              </View>

              {/* Title */}
              <Text style={styles.successTitle}>Wonderful!</Text>
              <Text style={styles.successSubtitle}>
                You checked in with yourself.
              </Text>

              {/* Reward Card */}
              <View style={styles.rewardCard}>
                <Text style={styles.rewardValue}>+10 Points</Text>
                <Text style={styles.rewardLabel}>Mindfulness Completed</Text>
              </View>

              {/* Quote */}
              <View style={styles.quoteBox}>
                <Text style={styles.quote}>
                  "The present moment is where life happens."
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ========== STYLES ==========

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667EEA',
    letterSpacing: 0.5,
  },

  // Task Details Screen
  puppyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    marginVertical: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  infoText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  benefitItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  benefitEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#667EEA',
  },
  primaryButton: {
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Active Task Screen
  activePuppyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginTop: 20,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  circularTimer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#667EEA',
    letterSpacing: -1,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667EEA',
    marginBottom: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  instructionEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '800',
  },
  bottomText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Success Screen
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successPuppyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginBottom: 20,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  checkmarkLarge: {
    fontSize: 56,
    color: '#fff',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  quoteBox: {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  quote: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Dog Image Style
  dogImage: {
    width: 160,
    height: 160,
  },
});
