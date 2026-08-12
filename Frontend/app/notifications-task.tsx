import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Platform,
  Alert,
  ActivityIndicator,
  AppState,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';
import DndModule from '../modules/dnd-module';

const VIDEO_INTRO = require('../assets/videos/turnn_off_notification_video_a.mp4');
const VIDEO_SESSION = require('../assets/videos/Smartphone_vibrating_on_surface_202608041636.mp4');
const ALARM_SOUND = require('../assets/videos/mixkit-relaxation-05-749.mp3');

const TASK_DURATION = 1800; // 30 minutes (1800 seconds)

const MOTIVATIONAL_QUOTES = [
  "Stay focused.",
  "Less noise. More clarity.",
  "Enjoy this quiet moment.",
  "Your attention belongs to you.",
];

// Floating Ambient Particles Component
const AmbientParticles = ({ color = '#10B981', count = 12 }: { color?: string; count?: number }) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => {
        const posX = useSharedValue(Math.random() * width);
        const posY = useSharedValue(height + 20);
        const pScale = useSharedValue(Math.random() * 0.8 + 0.4);
        const pOpacity = useSharedValue(Math.random() * 0.5 + 0.3);

        useEffect(() => {
          const duration = 9000 + Math.random() * 6000;
          const delay = Math.random() * 3000;

          posY.value = withRepeat(
            withSequence(
              withTiming(height + 20, { duration: delay }),
              withTiming(-40, { duration, easing: Easing.linear })
            ),
            -1,
            false
          );

          posX.value = withRepeat(
            withSequence(
              withTiming(posX.value + (Math.random() * 40 - 20), {
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(posX.value - (Math.random() * 40 - 20), {
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            -1,
            true
          );
        }, []);

        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: posX.value },
            { translateY: posY.value },
            { scale: pScale.value },
          ],
          opacity: pOpacity.value,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              styles.ambientParticle,
              style,
              { backgroundColor: color, shadowColor: color },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function NotificationsTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Screen Flow State: 'intro' | 'session' | 'reward'
  const [screen, setScreen] = useState<'intro' | 'session' | 'reward'>('intro');

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TASK_DURATION);
  const [isLoading, setIsLoading] = useState(false);
  const [dndActive, setDndActive] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const appState = useRef(AppState.currentState);
  const isWaitingForPermission = useRef(false);
  const endTimeRef = useRef<number>(0);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const lastPress = useRef(0);

  // Video Players Initialization
  const introPlayer = useVideoPlayer(VIDEO_INTRO, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const sessionPlayer = useVideoPlayer(VIDEO_SESSION, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      // Ignore haptic errors on unsupported platforms
    }
  }, []);

  // Phone Shaking Effect Animation for Session Screen
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  useEffect(() => {
    if (screen === 'session' && isActive && !isPaused) {
      shakeX.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 40, easing: Easing.linear }),
          withTiming(2.5, { duration: 40, easing: Easing.linear }),
          withTiming(-1.5, { duration: 40, easing: Easing.linear }),
          withTiming(1.5, { duration: 40, easing: Easing.linear }),
          withTiming(0, { duration: 250, easing: Easing.linear })
        ),
        -1,
        true
      );
      shakeY.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 50, easing: Easing.linear }),
          withTiming(1.5, { duration: 50, easing: Easing.linear }),
          withTiming(0, { duration: 250, easing: Easing.linear })
        ),
        -1,
        true
      );
    } else {
      shakeX.value = withTiming(0, { duration: 200 });
      shakeY.value = withTiming(0, { duration: 200 });
    }
  }, [screen, isActive, isPaused]);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  // AppState & DND listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isWaitingForPermission.current) {
          isWaitingForPermission.current = false;
          if (Platform.OS === 'android' && DndModule.isNative) {
            if (DndModule.checkDndPermission()) {
              startAndroidTask();
            } else {
              Alert.alert(
                "Permission Denied",
                "AntiSocial could not enable Do Not Disturb mode automatically because permission was not granted."
              );
            }
          }
        }

        if (isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (Platform.OS === 'android' && DndModule.isNative) {
            setDndActive(DndModule.isDndEnabled());
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, isPaused]);

  // Clean up DND on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'android' && DndModule.isNative) {
        try {
          DndModule.setDndMode(false);
        } catch (e) {}
      }
      if (alarmSoundRef.current) {
        alarmSoundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Quotes Rotation in Session Screen
  useEffect(() => {
    if (screen === 'session' && isActive && !isPaused) {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, 9000);
      return () => clearInterval(interval);
    }
  }, [screen, isActive, isPaused]);

  // Play Completion Sound
  const playCompletionSound = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      }
      const { sound } = await Audio.Sound.createAsync(
        ALARM_SOUND,
        { shouldPlay: true, volume: 0.85 }
      );
      alarmSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          alarmSoundRef.current = null;
        }
      });
    } catch (err) {
      console.warn('[NotificationsTask] Sound error:', err);
    }
  }, []);

  // Timer Tick Loop & Transition to Reward
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      if (Platform.OS === 'android' && DndModule.isNative) {
        setDndActive(DndModule.isDndEnabled());
      }

      timer = setInterval(() => {
        if (Platform.OS === 'android' && DndModule.isNative) {
          setDndActive(DndModule.isDndEnabled());
        }

        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (Platform.OS === 'android' && DndModule.isNative) {
              try {
                DndModule.setDndMode(false);
                setDndActive(false);
              } catch (e) {}
            }
            triggerHaptic('success');
            playCompletionSound();
            setScreen('reward');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, isPaused, timeLeft]);

  const startAndroidTask = () => {
    try {
      DndModule.setDndMode(true);
      setDndActive(true);
    } catch (e) {}
    startSessionFlow();
  };

  const startSessionFlow = () => {
    triggerHaptic('medium');
    setScreen('session');
    setIsActive(true);
    setIsPaused(false);
  };

  const handleBeginFocusPress = () => {
    triggerHaptic('medium');
    const isAutomationSupported = Platform.OS === 'android' && DndModule.isNative;

    if (isAutomationSupported) {
      const hasPermission = DndModule.checkDndPermission();
      if (!hasPermission) {
        Alert.alert(
          "DND Permission Required",
          "AntiSocial can enable Do Not Disturb mode automatically during your focus session.",
          [
            { text: "Skip & Start", onPress: () => startSessionFlow() },
            {
              text: "Grant Permission",
              onPress: () => {
                isWaitingForPermission.current = true;
                DndModule.requestDndPermission();
              },
            },
          ]
        );
      } else {
        startAndroidTask();
      }
    } else {
      startSessionFlow();
    }
  };

  // Backend Task Completion Logic (REUSING EXISTING TASK API)
  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);
    triggerHaptic('medium');

    let pointsData = { pointsAdded: '10', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task_name: 'Turn off notifications (30 min)' }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '10',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        } else {
          Alert.alert("Notice", data.error || "Task progress saved");
        }
      }
    } catch (e) {
      console.error('Backend completion error:', e);
    } finally {
      setIsLoading(false);
    }

    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
      },
    } as any);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Developer Fast-Forward Double Tap Helper
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 350) {
        triggerHaptic('warning');
        setTimeLeft(3);
      }
    }
  };

  // Circular Timer Math Calculations
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = timeLeft / TASK_DURATION;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ========================================================
          SCREEN 1 — CINEMATIC INTRODUCTION
         ======================================================== */}
      {screen === 'intro' && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(500)} style={StyleSheet.absoluteFillObject}>
          {/* Video Background with Boosted Brightness Overlay */}
          <VideoView
            player={introPlayer}
            style={StyleSheet.absoluteFillObject}
            nativeControls={false}
            contentFit="cover"
          />

          {/* Light Cinematic Overlay to boost brightness and clarify video phone screen */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.22)', 'rgba(15, 23, 42, 0.45)', 'rgba(7, 10, 22, 0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Header Controls */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.circleIconBtn}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.topInfoPill}>
                <Feather name="shield" size={14} color="#10B981" />
                <Text style={styles.topInfoPillText}>30 Min • Distraction-Free</Text>
              </View>
            </View>

            {/* Center Content Card */}
            <View style={styles.introCenterContent}>
              {/* Realistic Phone Card with Silenced Notifications */}
              <Animated.View entering={ZoomIn.duration(800)} style={styles.phoneDisplayCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.08)']}
                  style={styles.phoneDisplayInner}
                >
                  <View style={styles.phoneNotch} />
                  <View style={styles.phoneScreenHeader}>
                    <Text style={styles.phoneTimeText}>9:41</Text>
                    <View style={styles.phoneIconsRow}>
                      <Ionicons name="wifi" size={14} color="rgba(255,255,255,0.9)" />
                      <Ionicons name="battery-full" size={16} color="#10B981" />
                    </View>
                  </View>

                  <View style={styles.silencedCenterBadge}>
                    <View style={styles.bellPulseRing}>
                      <MaterialCommunityIcons name="bell-off" size={38} color="#10B981" />
                    </View>
                    <Text style={styles.silencedBadgeTitle}>Notifications Muted</Text>
                    <Text style={styles.silencedBadgeSub}>0 Alerts • Zero Distractions</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Title & Subtitle */}
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.textGroup}>
                <Text style={styles.introTitle}>Turn Off Notifications</Text>
                <Text style={styles.introSubtitle}>
                  Protect your attention.{"\n"}
                  Create a peaceful space without unnecessary interruptions.
                </Text>
              </Animated.View>
            </View>

            {/* Bottom Actions */}
            <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleBeginFocusPress}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtnGradient}
                >
                  <MaterialCommunityIcons name="shield-check" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Begin Focus</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 2 — NOTIFICATION FREE SESSION
         ======================================================== */}
      {screen === 'session' && (
        <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(500)} style={StyleSheet.absoluteFillObject}>
          {/* Background Video with Bright Overlay */}
          <VideoView
            player={sessionPlayer}
            style={StyleSheet.absoluteFillObject}
            nativeControls={false}
            contentFit="cover"
          />

          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(15, 23, 42, 0.50)', 'rgba(7, 10, 22, 0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <AmbientParticles color="#10B981" count={14} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.dndActiveBadge}>
                <Feather name="shield" size={14} color="#10B981" />
                <Text style={styles.dndActiveBadgeText}>Notifications: OFF ✅</Text>
              </View>

              <TouchableOpacity
                style={styles.abortTextBtn}
                onPress={() => {
                  triggerHaptic('warning');
                  Alert.alert(
                    "Pause Session?",
                    "Are you sure you want to exit? Your focus progress will be cancelled.",
                    [
                      { text: "Keep Focusing", style: "cancel" },
                      {
                        text: "Exit",
                        style: "destructive",
                        onPress: () => {
                          setIsActive(false);
                          setScreen('intro');
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.abortTextBtnText}>Abort</Text>
              </TouchableOpacity>
            </View>

            {/* Center Focus Session Experience with Phone Shake Effect */}
            <Animated.View style={[styles.sessionCenterContent, animatedShakeStyle]}>
              {/* Glass Timer Card */}
              <View style={styles.glassTimerCard}>
                {/* SVG Countdown Ring */}
                <View style={styles.timerRingContainer}>
                  <Svg width={250} height={250} viewBox="0 0 250 250">
                    <Circle
                      cx={125}
                      cy={125}
                      r={radius}
                      stroke="rgba(255, 255, 255, 0.15)"
                      strokeWidth={10}
                      fill="transparent"
                    />
                    <Circle
                      cx={125}
                      cy={125}
                      r={radius}
                      stroke="#10B981"
                      strokeWidth={10}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform="rotate(-90 125 125)"
                    />
                  </Svg>

                  <Pressable onPress={handleDevSkip} style={styles.timerTextContainer}>
                    <Text style={styles.timerDigitsText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerSubText}>
                      {isPaused ? "SESSION PAUSED" : "FOCUS MODE ACTIVE"}
                    </Text>
                  </Pressable>
                </View>

                {/* Rotating Motivational Message */}
                <Animated.View key={quoteIndex} entering={FadeIn.duration(800)} style={styles.quoteBox}>
                  <Text style={styles.quoteText}>"{MOTIVATIONAL_QUOTES[quoteIndex]}"</Text>
                </Animated.View>
              </View>

              {/* Status Message */}
              <Text style={styles.sessionFooterMsg}>Your attention belongs to you.</Text>
            </Animated.View>

            {/* Bottom Controls */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.controlPillBtn, isPaused ? styles.resumePill : styles.pausePill]}
                onPress={() => {
                  triggerHaptic('light');
                  setIsPaused(!isPaused);
                }}
                activeOpacity={0.85}
              >
                <Feather name={isPaused ? "play" : "pause"} size={20} color={isPaused ? "#FFFFFF" : "#10B981"} />
                <Text style={[styles.controlPillText, isPaused && { color: '#FFFFFF' }]}>
                  {isPaused ? "Resume Session" : "Pause Focus"}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* ========================================================
          SCREEN 3 — COMPLETION REWARD
         ======================================================== */}
      {screen === 'reward' && (
        <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFillObject}>
          {/* Golden Celebration Background */}
          <LinearGradient
            colors={['#064e3b', '#022c22', '#090d16']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <AmbientParticles color="#F59E0B" count={18} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <View style={styles.rewardCenterContent}>
              {/* Glowing Phone Transformation Icon */}
              <Animated.View entering={ZoomIn.duration(900)} style={styles.glowingRewardCircle}>
                <LinearGradient
                  colors={['#F59E0B', '#10B981']}
                  style={styles.glowingRewardInner}
                >
                  <MaterialCommunityIcons name="bell-ring-outline" size={54} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>

              {/* Celebration Headers */}
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.rewardTextGroup}>
                <Text style={styles.rewardTitle}>Distraction Free!</Text>
                <Text style={styles.rewardSubtitle}>
                  You created space for focus by removing unnecessary interruptions.
                </Text>
              </Animated.View>

              {/* Reward Card */}
              <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.rewardCardContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
                  style={styles.rewardCardInner}
                >
                  <View style={styles.pointsBadgeRow}>
                    <Text style={styles.pointsSparkle}>✨</Text>
                    <Text style={styles.pointsValue}>+10 Points</Text>
                  </View>

                  <View style={styles.rewardDivider} />

                  <View style={styles.achievementRow}>
                    <View style={styles.achievementIconBg}>
                      <Text style={{ fontSize: 24 }}>🔕</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achievementTitle}>Notification Guardian</Text>
                      <Text style={styles.achievementSub}>Task Completed • Focus Mastered</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Bottom Continue Button */}
            <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtnGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Continue</Text>
                      <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  screenWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    height: 48,
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  topInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  topInfoPillText: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
  },
  introCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  phoneDisplayCard: {
    width: 220,
    height: 250,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 28,
  },
  phoneDisplayInner: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  phoneNotch: {
    width: 60,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    marginBottom: 10,
  },
  phoneScreenHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  phoneTimeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  phoneIconsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  silencedCenterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bellPulseRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 12,
  },
  silencedBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  silencedBadgeSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  textGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  introSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomBar: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dndActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  dndActiveBadgeText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  abortTextBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  abortTextBtnText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '600',
  },
  sessionCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  glassTimerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 32,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  timerRingContainer: {
    position: 'relative',
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigitsText: {
    fontSize: 54,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(16, 185, 129, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  timerSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  quoteBox: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  quoteText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  sessionFooterMsg: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
  },
  controlPillBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pausePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  resumePill: {
    backgroundColor: '#10B981',
  },
  controlPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  rewardCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  glowingRewardCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
    marginBottom: 24,
  },
  glowingRewardInner: {
    flex: 1,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardTextGroup: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  rewardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardCardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  rewardCardInner: {
    padding: 22,
    alignItems: 'center',
  },
  pointsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsSparkle: {
    fontSize: 24,
  },
  pointsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FBBF24',
  },
  rewardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 18,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  achievementIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  achievementSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  ambientParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
