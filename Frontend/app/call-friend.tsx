import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

export default function CallFriendTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [isActive, setIsActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bgTransition = useRef(new Animated.Value(0)).current;
  
  // Pulse animations for active state
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  // Initial load fade in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, 
      duration: 800, 
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  // Ringing effect when inactive
  useEffect(() => {
    if (!isActive) {
      const shake = () => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
        ]).start();
      };
      const interval = setInterval(shake, 2500);
      return () => clearInterval(interval);
    }
  }, [isActive, shakeAnim]);

  // Timers and pulses when active
  useEffect(() => {
    let interval: any;
    if (isActive) {
      // Start call timer
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Transition background to dark mode
      Animated.timing(bgTransition, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false // Color interpolation requires false
      }).start();

      // Start pulses
      const createPulse = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ])
        ).start();
      };

      createPulse(pulse1, 0);
      createPulse(pulse2, 1000);
      createPulse(pulse3, 2000);

    } else {
      Animated.timing(bgTransition, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false
      }).start();
      
      pulse1.stopAnimation();
      pulse2.stopAnimation();
      pulse3.stopAnimation();
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isActive, pulse1, pulse2, pulse3, bgTransition]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleComplete = () => {
    router.replace({ pathname: '/task-success', params: { points: '300' } } as any);
  };

  // Interpolations
  const shakeInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  const bgColorData = bgTransition.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fafafa', '#0f172a'] // light to dark slate
  });

  const textColorData = bgTransition.interpolate({
    inputRange: [0, 1],
    outputRange: ['#111827', '#f8fafc']
  });
  
  const subtitleColorData = bgTransition.interpolate({
    inputRange: [0, 1],
    outputRange: ['#6b7280', '#94a3b8']
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderPulse = (anim: Animated.Value) => {
    return (
      <Animated.View style={[
        styles.pulseRing,
        {
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.5] }) }
          ],
          opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] })
        }
      ]} />
    );
  };

  return (
    <AnimatedSafeArea style={[styles.container, { backgroundColor: bgColorData }]}>
      <StatusBar style={isActive ? "light" : "dark"} backgroundColor={isActive ? "#0f172a" : "#fafafa"} />
      
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity 
          style={[styles.backBtnLight, isActive && {backgroundColor: 'rgba(255,255,255,0.1)'}]} 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks' as any)}
        >
          <Feather name="arrow-left" size={24} color={isActive ? "#ffffff" : "#111111"} />
        </TouchableOpacity>
        
        {isActive && (
          <View style={styles.activePillHeader}>
            <View style={styles.recordingDot} />
            <Text style={styles.activePillText}>In Progress</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          
          <View style={styles.heroBox}>
            {isActive && (
              <>
                {renderPulse(pulse1)}
                {renderPulse(pulse2)}
                {renderPulse(pulse3)}
              </>
            )}
            
            <Animated.View style={[
              styles.iconWrapper, 
              isActive ? styles.iconWrapperActive : styles.iconWrapperInactive,
              { transform: [{ rotate: isActive ? '0deg' : shakeInterpolate }] }
            ]}>
              <Text style={styles.heroEmoji}>{isActive ? "🎧" : "📞"}</Text>
            </Animated.View>
          </View>

          {isActive ? (
            <Text style={styles.timerText}>{formatTime(callDuration)}</Text>
          ) : (
            <View style={styles.dayPill}>
               <Text style={styles.dayPillText}>Light Reconnection</Text>
            </View>
          )}

          <Animated.Text style={[styles.mainTitle, { color: textColorData }]}>
            {isActive ? "Catching Up..." : "Call an old friend"}
          </Animated.Text>
          
          <Animated.Text style={[styles.subtitle, { color: subtitleColorData }]}>
            {isActive ? "It's amazing how much happens when we listen." : "Reconnect with someone you haven't spoken to in a while."}
          </Animated.Text>

          {!isActive && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why this matters:</Text>
              <View style={styles.rewardRow}>
                <Feather name="check-circle" size={18} color="#a855f7" />
                <Text style={styles.rewardText}>Earn 300 points after completion</Text>
              </View>
            </View>
          )}

          {isActive && (
            <View style={styles.activeContentBox}>
              <Text style={styles.promptsSecTitle}>Icebreakers</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
                {[
                  { icon: 'smile', text: "I was just thinking about you and wanted to say hi." },
                  { icon: 'coffee', text: "It's been so long! What's new in your world?" },
                  { icon: 'sun', text: "I missed our chats. How have you been?" }
                ].map((item, i) => (
                  <View key={i} style={styles.glassCard}>
                    <Feather name={item.icon as any} size={24} color="#a855f7" style={{marginBottom: 10}} />
                    <Text style={styles.glassCardText}>"{item.text}"</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
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
               <Feather name="phone" size={20} color="#fff" style={{marginRight: 10}} />
               <Text style={styles.startText}>Start Call</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endCallWrap} activeOpacity={0.8} onPress={handleComplete}>
            <View style={styles.endCallBtn}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{rotate: '135deg'}] }} />
            </View>
            <Text style={styles.endCallLabel}>End & Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerLight: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6', 
  },
  activePillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  recordingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 6
  },
  activePillText: {
    color: '#fff', fontSize: 13, fontWeight: '600'
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
    paddingBottom: 40,
  },
  heroBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#a855f7', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    zIndex: 5, backgroundColor: '#fff',
  },
  iconWrapperInactive: {
    backgroundColor: '#ffffff',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.5)'
  },
  heroEmoji: {
    fontSize: 50, 
  },
  pulseRing: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#a855f7',
    zIndex: 1,
  },
  timerText: {
    fontSize: 48, fontWeight: '200', color: '#f8fafc', marginBottom: 15, fontVariant: ['tabular-nums']
  },
  dayPill: {
    backgroundColor: '#f3e8ff', paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20, marginBottom: 20,
  },
  dayPillText: {
    color: '#a855f7', fontWeight: '600', fontSize: 14,
  },
  mainTitle: {
    fontSize: 28, fontWeight: '600', textAlign: 'center', marginBottom: 10, lineHeight: 34,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10,
  },
  infoCard: {
    width: '100%', backgroundColor: '#faf5ff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e9d5ff', 
  },
  infoTitle: {
    fontSize: 16, color: '#1f2937', marginBottom: 16, fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  rewardText: {
    marginLeft: 10, color: '#9333ea', fontSize: 14, fontWeight: '500',
  },
  activeContentBox: { width: '100%', marginTop: 20 },
  promptsSecTitle: { fontSize: 18, color: '#fff', fontWeight: '600', marginBottom: 15, marginLeft: 5 },
  cardsScroll: { paddingRight: 20, gap: 15 },
  glassCard: {
    width: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 15
  },
  glassCardText: { color: '#f8fafc', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  footer: {
    paddingHorizontal: 24, paddingTop: 10,
  },
  startButton: {
    width: '100%', height: 60, borderRadius: 30, overflow: 'hidden',
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  gradientBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  startText: {
    color: '#ffffff', fontSize: 18, fontWeight: '600',
  },
  endCallWrap: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  endCallBtn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 8,
    marginBottom: 10
  },
  endCallLabel: { color: '#ef4444', fontWeight: '600', fontSize: 15 }
});

