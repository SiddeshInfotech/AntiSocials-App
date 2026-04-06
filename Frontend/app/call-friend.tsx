import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

export default function CallFriendTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [step, setStep] = useState<'info' | 'mock' | 'calling' | 'done'>('info');
  const [callDuration, setCallDuration] = useState(0);

  // Animations - Info Screen
  const fadeAnimTop = useRef(new Animated.Value(0)).current;
  const fadeAnimText = useRef(new Animated.Value(0)).current;
  const translateAnimText = useRef(new Animated.Value(20)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const iconFloatAnim = useRef(new Animated.Value(0)).current;
  const actionBtnScale = useRef(new Animated.Value(1)).current;

  // Animations - Mock / Calling Screen
  const darkBgAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const callPulse1 = useRef(new Animated.Value(0)).current;
  const callPulse2 = useRef(new Animated.Value(0)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  // On Mount: Load Info Screen
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnimTop, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnimText, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(translateAnimText, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ])
    ]).start();

    // Bg shift (Warm Peach / Orange)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.linear), useNativeDriver: true })
      ])
    ).start();

    // Soft Phone Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloatAnim, { toValue: -8, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconFloatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

  // When step changes to 'mock', crossfade to dark BG
  useEffect(() => {
    if (step === 'mock') {
      Animated.timing(darkBgAnim, { toValue: 1, duration: 600, useNativeDriver: false }).start();
    }
  }, [step]);

  // When step changes to 'calling', start ringing pulses and timer
  useEffect(() => {
    let timer: any;
    if (step === 'calling') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      const makePulse = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
          ])
        ).start();
      };
      makePulse(callPulse1, 0);
      makePulse(callPulse2, 1000);

      // Subtle avatar breath
      Animated.loop(
        Animated.sequence([
          Animated.timing(avatarScale, { toValue: 1.05, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(avatarScale, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ])
      ).start();

    } else {
      callPulse1.stopAnimation();
      callPulse2.stopAnimation();
      avatarScale.stopAnimation();
    }
    return () => clearInterval(timer);
  }, [step]);

  const handlePressIn = () => Animated.timing(actionBtnScale, { toValue: 0.95, duration: 150, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.timing(actionBtnScale, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  const handleStartTask = () => setStep('mock');
  const handleInitiateCall = () => setStep('calling');
  
  const handleEndCall = () => {
    setStep('done');
    Animated.timing(successFade, { toValue: 1, duration: 1000, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        router.replace({ pathname: '/task-success', params: { points: '300' } } as any);
      }, 1500);
    });
  };

  const padZero = (num: number) => num.toString().padStart(2, '0');
  const formattedTime = `${padZero(Math.floor(callDuration / 60))}:${padZero(callDuration % 60)}`;

  // Interpolations
  const bgColor = darkBgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#0f172a'] // Transitions to dark slate for mock mock
  });

  return (
    <AnimatedSafeArea style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={step === 'info' ? "dark" : "light"} />

      {step === 'info' && (
        <>
          {/* Animated Warm Gradients */}
          <LinearGradient colors={['#fff0f5', '#ffedd5', '#ffffff']} style={StyleSheet.absoluteFillObject} />
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
            <LinearGradient colors={['#fff7ed', '#fce7f3', '#ffffff']} style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </>
      )}

      {/* Header */}
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5), zIndex: 10 }]}>
        <TouchableOpacity 
          style={[styles.backBtnLight, step !== 'info' && { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
          onPress={() => {
            if (step === 'info') router.canGoBack() ? router.back() : router.replace('/(tabs)');
            else setStep('info'); // go back to info
          }}
          disabled={step === 'done'}
        >
          <Feather name="arrow-left" size={24} color={step === 'info' ? "#111111" : "#ffffff"} />
        </TouchableOpacity>
      </View>

      {/* INFO SCREEN STATE */}
      {step === 'info' && (
        <View style={styles.content}>
          <Animated.View style={[styles.heroBox, { opacity: fadeAnimTop, transform: [{ translateY: iconFloatAnim }] }]}>
            <View style={styles.humanIconBase}>
              <View style={styles.humanIconGlow} />
              <Ionicons name="people" size={54} color="#f97316" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnimText, transform: [{ translateY: translateAnimText }], alignItems: 'center', width: '100%' }}>
            <View style={styles.dayPill}>
               <Text style={styles.dayPillText}>Connection</Text>
            </View>
            <Text style={styles.mainTitle}>Call an old friend</Text>
            <Text style={styles.subtitle}>Reach out to someone important who you haven't spoken to in a while. A simple call means everything.</Text>

            <View style={styles.infoCard}>
               <Text style={styles.infoTitle}>Why this matters:</Text>
               <View style={styles.rewardRow}>
                  <Feather name="check-circle" size={18} color="#f97316" />
                  <Text style={styles.rewardText}>Earn 300 points after completion</Text>
               </View>
            </View>
          </Animated.View>

          <View style={{ flex: 1 }} />

          <Animated.View style={{ opacity: fadeAnimText, transform: [{ scale: actionBtnScale }], width: '100%' }}>
            <Pressable 
              onPressIn={handlePressIn} 
              onPressOut={handlePressOut}
              onPress={handleStartTask}
              style={styles.startButton}
            >
               <LinearGradient colors={['#f97316', '#fbbf24']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.gradientBtn}>
                  <Feather name="phone" size={20} color="#fff" style={{marginRight: 10}} />
                  <Text style={styles.startText}>Start Connection</Text>
               </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* MOCK CALL & CALLING STATE */}
      {(step === 'mock' || step === 'calling' || step === 'done') && (
        <View style={styles.mockContainer}>
          
          <View style={styles.mockTopSection}>
            <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
              {/* Pulse rings during call */}
              {step === 'calling' && (
                <>
                  <Animated.View style={[styles.callPulse, { transform: [{ scale: callPulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }], opacity: callPulse1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }) }]} />
                  <Animated.View style={[styles.callPulse, { transform: [{ scale: callPulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }], opacity: callPulse2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }) }]} />
                </>
              )}
              
              <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.avatarGradient}>
                <Feather name="user" size={60} color="#ffffff" style={{ opacity: 0.8 }} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.mockName}>Someone you miss</Text>

            {step === 'mock' && (
              <Text style={styles.mockStatus}>Ready to reconnect?</Text>
            )}

            {step === 'calling' && (
              <View style={styles.activeCallInfo}>
                <Text style={styles.ringingStatus}>Calling... {formattedTime}</Text>
                <Text style={styles.guidanceText}>Take your time. Even a short call makes a difference.</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.mockBottomSection}>
            {step === 'mock' && (
              <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={handleInitiateCall}>
                <Ionicons name="call" size={32} color="#ffffff" />
              </TouchableOpacity>
            )}

            {step === 'calling' && (
              <TouchableOpacity style={[styles.actionBtn, styles.btnRed]} onPress={handleEndCall}>
                <Ionicons name="call" size={32} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            )}
          </View>

          {/* SUCCESS OVERLAY */}
          {step === 'done' && (
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.successOverlay, { opacity: successFade }]}>
               <Text style={styles.successEmoji}>🤝</Text>
               <Text style={styles.successMessage}>Nice, you reconnected</Text>
            </Animated.View>
          )}

        </View>
      )}

    </AnimatedSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6', 
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroBox: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  humanIconBase: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  humanIconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: '#ffedd5',
    opacity: 0.5,
    transform: [{ scale: 1.2 }],
  },
  dayPill: {
    backgroundColor: '#ffedd5', 
    paddingVertical: 6, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    marginBottom: 20,
  },
  dayPillText: {
    color: '#ea580c', 
    fontWeight: '600', 
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 28, 
    fontWeight: '600', 
    color: '#111111', 
    textAlign: 'center', 
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15, 
    color: '#6b7280', 
    textAlign: 'center', 
    lineHeight: 22,
    marginBottom: 40,
  },
  infoCard: {
    width: '100%', 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(253, 186, 116, 0.3)', 
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
    color: '#ea580c', 
    fontSize: 14, 
    fontWeight: '500',
  },
  startButton: {
    width: '100%', 
    height: 60, 
    borderRadius: 30, 
    overflow: 'hidden',
    shadowColor: '#ea580c', 
    shadowOpacity: 0.3, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 5,
  },
  gradientBtn: {
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  startText: {
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '600',
  },

  // MOCK CALL UI STYLES
  mockContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  mockTopSection: {
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    zIndex: 2,
  },
  callPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8b5cf6',
    zIndex: 1,
  },
  mockName: {
    fontSize: 28,
    fontWeight: '400',
    color: '#f8fafc',
    marginBottom: 10,
  },
  mockStatus: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '300',
  },
  activeCallInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  ringingStatus: {
    fontSize: 18,
    fontWeight: '400',
    color: '#10b981', // green tint indicating active
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  guidanceText: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  mockBottomSection: {
    alignItems: 'center',
  },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  btnGreen: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  btnRed: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  successOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 26,
    fontWeight: '500',
    color: '#f8fafc',
  }
});
