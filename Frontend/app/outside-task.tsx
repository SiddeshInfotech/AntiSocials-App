import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const TASK_DURATION = 120; // 2 minutes

// A more realistic fluffy cloud shape using overlapping views
const FluffyCloud = ({ animValueX, animValueY, scale = 1, opacity = 1 }: any) => (
  <Animated.View style={{
    position: 'absolute',
    opacity,
    transform: [{ translateX: animValueX }, { translateY: animValueY }, { scale }],
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    width: 200,
    height: 80,
  }}>
    <View style={{ width: 140, height: 45, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 25, position: 'absolute', bottom: 0, left: 20 }} />
    <View style={{ width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 35, position: 'absolute', bottom: 15, left: 40 }} />
    <View style={{ width: 55, height: 55, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 27.5, position: 'absolute', bottom: 10, left: 90 }} />
    <View style={{ width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 22.5, position: 'absolute', bottom: 5, left: 15 }} />
  </Animated.View>
);

export default function OutsideTaskScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);

  // Focus & Phase Animations
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const timerFadeAnim = useRef(new Animated.Value(0)).current;
  const timerGlowAnim = useRef(new Animated.Value(0.5)).current;
  
  // Immersive Background Animations
  const breathAnim = useRef(new Animated.Value(1)).current;
  const skyShiftAnim = useRef(new Animated.Value(0)).current;
  
  // Cloud Animations (Parallax Horizontal + Vertical Drift)
  const cloud1XAnim = useRef(new Animated.Value(-200)).current; // Foreground
  const cloud1YAnim = useRef(new Animated.Value(height * 0.65)).current; 
  
  const cloud2XAnim = useRef(new Animated.Value(width + 100)).current; // Midground
  const cloud2YAnim = useRef(new Animated.Value(height * 0.35)).current;
  
  const cloud3XAnim = useRef(new Animated.Value(-150)).current; // Background
  const cloud3YAnim = useRef(new Animated.Value(height * 0.12)).current;

  useEffect(() => {
    // Start continuous environment animations immediately to create depth and life

    // Sky Breathing Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.05, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Sky Color Shifts
    Animated.loop(
      Animated.sequence([
        Animated.timing(skyShiftAnim, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(skyShiftAnim, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer Glow Effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerGlowAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerGlowAnim, { toValue: 0.6, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Cloud Movements (Horizontal)
    Animated.loop(Animated.timing(cloud1XAnim, { toValue: width + 200, duration: 28000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(cloud2XAnim, { toValue: -250, duration: 42000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(cloud3XAnim, { toValue: width + 150, duration: 70000, easing: Easing.linear, useNativeDriver: true })).start();

    // Subtle Vertical Drift for Clouds to make it more natural
    const verticalSequence = (animMap: Animated.Value, baseVal: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animMap, { toValue: baseVal - 15, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animMap, { toValue: baseVal + 15, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
    
    verticalSequence(cloud1YAnim, height * 0.65);
    verticalSequence(cloud2YAnim, height * 0.35);
    verticalSequence(cloud3YAnim, height * 0.12);

    // Timer Logic
    let timer: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsCompleted(true);
      setIsActive(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, timeLeft]);

  const startTask = () => {
    setIsActive(true);
    
    // Crossfade UI and Timer
    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(timerFadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const finishTask = () => {
    router.replace({ pathname: '/task-success', params: { points: '150' } } as any);
  };

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      
      {/* Absolute Fullscreen Immersive Sky Environment */}
      <Animated.View style={[styles.skyContainer, { transform: [{ scale: breathAnim }] }]}>
        
        {/* Base Sky Depth Gradient */}
        <LinearGradient
          colors={['#74A5FC', '#B6DBFE', '#E6F4FF']}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Dynamic Light/Color Shifting Layer */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: skyShiftAnim }]}>
          <LinearGradient
            colors={['#5A91ED', '#9CCDF9', '#F4F9FF']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        {/* Ambient Light Rays */}
        <View style={[StyleSheet.absoluteFillObject, styles.raysContainer]}>
          <LinearGradient colors={['rgba(255,255,255,0.18)', 'transparent']} style={styles.ray1} />
          <LinearGradient colors={['rgba(255,255,255,0.12)', 'transparent']} style={styles.ray2} />
        </View>
        
        {/* Multi-layered Clouds with precise depth mapping */}
        <FluffyCloud animValueX={cloud3XAnim} animValueY={cloud3YAnim} scale={0.55} opacity={0.5} />
        <FluffyCloud animValueX={cloud2XAnim} animValueY={cloud2YAnim} scale={0.8} opacity={0.7} />
        <FluffyCloud animValueX={cloud1XAnim} animValueY={cloud1YAnim} scale={1.2} opacity={0.9} />

      </Animated.View>

      <SafeAreaView style={styles.foregroundLayer}>
        
        {/* Focused Timer State */}
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.timerCenter, { opacity: timerFadeAnim }]} pointerEvents={isActive ? 'auto' : 'none'}>
          {!isCompleted && (
            <>
              <Animated.Text style={[styles.timerText, { opacity: timerGlowAnim }]}>
                {formatTime(timeLeft)}
              </Animated.Text>
              <Text style={styles.focusSubtitle}>Observe your surroundings...</Text>
            </>
          )}

          {isCompleted && (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🌿</Text>
              <Text style={styles.successText}>You took a mindful pause</Text>
              <TouchableOpacity style={styles.finishButton} onPress={finishTask}>
                <Text style={styles.finishButtonText}>Claim Points</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Initial Onboarding UI */}
        <Animated.View style={[styles.uiWrapper, { opacity: uiFadeAnim }]} pointerEvents={!isActive && !isCompleted ? 'auto' : 'none'}>
          <View style={styles.glassPanel}>
            <Text style={styles.title}>Look outside for 2 minutes</Text>
            <Text style={styles.subtitle}>Take a moment to simply observe your surroundings outside without distractions.</Text>
            
            <TouchableOpacity style={styles.button} onPress={startTask}>
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  skyContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  foregroundLayer: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uiWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    marginBottom: 12, 
    textAlign: 'center',
    color: '#1f2937'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#4b5563', 
    textAlign: 'center', 
    marginBottom: 40,
    lineHeight: 24,
  },
  button: { 
    backgroundColor: '#8b5cf6', 
    paddingHorizontal: 30, 
    paddingVertical: 18, 
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  backButton: { padding: 12 },
  backText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 80,
    fontWeight: '200',
    color: '#ffffff',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 15,
    letterSpacing: 3,
  },
  focusSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 35,
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  successEmoji: {
    fontSize: 55,
    marginBottom: 15,
  },
  successText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 35,
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  raysContainer: {
    alignItems: 'center',
    transform: [{ rotate: '32deg' }, { scale: 1.5 }],
    top: -100,
    left: -50,
    pointerEvents: 'none',
  },
  ray1: {
    width: 220,
    height: height * 1.5,
    position: 'absolute',
    left: '15%',
  },
  ray2: {
    width: 150,
    height: height * 1.5,
    position: 'absolute',
    left: '55%',
  }
});
