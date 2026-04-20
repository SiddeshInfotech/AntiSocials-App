import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Warm floating micro-particles
const FloatingParticle = ({ size, color, left, top, duration, delay }: any) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -80, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: duration * 0.8, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: duration * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      opacity: pulseAnim, transform: [{ translateY: floatAnim }],
      shadowColor: color, shadowRadius: size, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }
    }} />
  );
};

export default function SmileConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(60);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animations
  const breathAnim = useRef(new Animated.Value(1)).current;
  const smilePulse = useRef(new Animated.Value(1)).current;
  const emojiCrossfade0 = useRef(new Animated.Value(1)).current;
  const emojiCrossfade1 = useRef(new Animated.Value(0)).current;
  const emojiCrossfade2 = useRef(new Animated.Value(0)).current;
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  // Timers and progressions
  useEffect(() => {
    // Background Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.05, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Central smile gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(smilePulse, { toValue: 1.1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(smilePulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    // The countdown logic
    let timer: any;
    if (timeLeft > 0 && !isCompleted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isCompleted) {
      handleComplete();
    }

    // Emoji Evolution Logic (🙂 at 60s, 😊 at 40s, 😁 at 20s)
    if (timeLeft === 40) {
      Animated.timing(emojiCrossfade0, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
      Animated.timing(emojiCrossfade1, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
    } else if (timeLeft === 20) {
      Animated.timing(emojiCrossfade1, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
      Animated.timing(emojiCrossfade2, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
    }

    return () => clearInterval(timer);
  }, [timeLeft, isCompleted]);

  const handleComplete = () => {
    setIsCompleted(true);
    
    // Fade out timer and back button, fade in completion text
    Animated.parallel([
      Animated.timing(uiFadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(successFade, { toValue: 1, duration: 1500, useNativeDriver: true })
    ]).start(() => {
      // Pause to let them feel the happiness, then proceed
      setTimeout(() => {
        router.replace({ pathname: '/task-success', params: { points: '100' } } as any);
      }, 1800);
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Alive Breathing Warm Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <LinearGradient
          colors={['#fff7ed', '#fef3c7', '#fdf4ff']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Happiness Micro-Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <FloatingParticle size={180} color="rgba(253, 230, 138, 0.4)" left={-40} top={height * 0.15} duration={10000} delay={0} />
        <FloatingParticle size={240} color="rgba(254, 215, 170, 0.3)" left={width * 0.5} top={height * 0.35} duration={14000} delay={1500} />
        <FloatingParticle size={150} color="rgba(251, 207, 232, 0.3)" left={width * 0.1} top={height * 0.75} duration={11000} delay={500} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Header - Back Button */}
        <Animated.View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5), opacity: uiFadeAnim }]} pointerEvents={isCompleted ? 'none' : 'auto'}>
          <TouchableOpacity style={styles.backBtnLight} onPress={() => !isCompleted && router.back()}>
            <Feather name="arrow-left" size={24} color="#d97706" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.content}>
          {/* Central Evolving Face */}
          <Animated.View style={[styles.emojiCenterpiece, { transform: [{ scale: smilePulse }] }]}>
             <View style={styles.emojiBaseGlow} />
             
             {/* Stacking the emojis natively for smooth crossfading without re-rendering text strings */}
             <Animated.Text style={[styles.giantEmoji, { opacity: emojiCrossfade0 }]}>🙂</Animated.Text>
             <Animated.Text style={[styles.giantEmoji, { opacity: emojiCrossfade1 }]}>😊</Animated.Text>
             <Animated.Text style={[styles.giantEmoji, { opacity: emojiCrossfade2 }]}>😁</Animated.Text>
          </Animated.View>

          {/* Glowing Timer */}
          <Animated.View style={{ opacity: uiFadeAnim }}>
            <View style={styles.timerPill}>
               <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          </Animated.View>

          {/* Soft Completion Message */}
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.successOverlay, { opacity: successFade }]} pointerEvents="none">
             <Text style={styles.successMessage}>That felt good</Text>
          </Animated.View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerLight: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)', 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '20%', // Center bias
  },
  emojiCenterpiece: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emojiBaseGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 100,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ scale: 0.8 }], // Sits softly behind
  },
  giantEmoji: {
    position: 'absolute',
    fontSize: 120,
    textAlign: 'center',
  },
  timerPill: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.4)',
  },
  timerText: {
    fontSize: 26,
    fontWeight: '300',
    color: '#d97706',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  successOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: '20%', // Align with timer height
  },
  successMessage: {
    fontSize: 24,
    fontWeight: '400',
    color: '#d97706',
    letterSpacing: 0.5,
  }
});

