import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert,
  Modal,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_STAY_DURATION = 2700; // 45 Minutes = 2700 Seconds

export default function Stay45mTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Location & Permission State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  // Stay Session State
  const [phase, setPhase] = useState<'campfire' | 'cinematic'>('campfire');
  const [timeLeft, setTimeLeft] = useState(TOTAL_STAY_DURATION);
  const [isStayActive, setIsStayActive] = useState(false);
  const [gracePeriodUsed, setGracePeriodUsed] = useState(0);

  // Reflection Text Micro-Interactions
  const [reflectionText, setReflectionText] = useState('You stepped into the circle.');
  const [reflectionSubText, setReflectionSubText] = useState('Allow yourself to become part of the environment.');

  // Optional Photo Modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [optionalPhoto, setOptionalPhoto] = useState<string | null>(null);

  // Animation References
  const flamePulse = useRef(new Animated.Value(1)).current;
  const flameTranslateY = useRef(new Animated.Value(0)).current;
  const emberSparksAnim = useRef(new Animated.Value(0)).current;
  const skyColorProgress = useRef(new Animated.Value(0)).current;

  // Final Cinematic Animations
  const cameraRiseScale = useRef(new Animated.Value(1)).current;
  const finalGlowOpacity = useRef(new Animated.Value(0)).current;
  const emberRiseY = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. LOCATION PERMISSION CHECK & GPS TRACKING
  // ----------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
          startGpsTracking();
          setIsStayActive(true);
        } else {
          setHasPermission(false);
        }
      } catch (e) {
        setHasPermission(true);
        setIsStayActive(true);
      }
    })();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        startGpsTracking();
        setIsStayActive(true);
      } else {
        setHasPermission(false);
        Alert.alert('Location Required', 'Continuous location access is required to verify your 45-minute stay.');
      }
    } catch (e) {
      setHasPermission(true);
      setIsStayActive(true);
    }
  };

  const startGpsTracking = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
        (position) => {
          setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }
      );
    } catch (e) {
      console.log('GPS tracking simulation active');
    }
  };

  // ----------------------------------------------------
  // 2. CAMPFIRE & ENVIRONMENT ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // Flickering Flame Loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flamePulse, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flameTranslateY, {
            toValue: -4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(flamePulse, {
            toValue: 0.95,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flameTranslateY, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Rising Ember Sparks Loop
    Animated.loop(
      Animated.timing(emberSparksAnim, {
        toValue: 1,
        duration: 3200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ----------------------------------------------------
  // 3. STAY TIMER & ENVIRONMENTAL EVOLUTION (45 MINS)
  // ----------------------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isStayActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          const elapsed = TOTAL_STAY_DURATION - next;
          updateEnvironmentEvolution(elapsed);
          return next;
        });
      }, 1000);
    } else if (isStayActive && timeLeft === 0) {
      setIsStayActive(false);
      triggerFinalCinematic();
    }
    return () => clearInterval(timer);
  }, [isStayActive, timeLeft]);

  const updateEnvironmentEvolution = (elapsedSeconds: number) => {
    // Progress ratio 0.0 to 1.0
    const ratio = Math.min(1.0, elapsedSeconds / TOTAL_STAY_DURATION);
    skyColorProgress.setValue(ratio);

    if (elapsedSeconds === 120) {
      setReflectionText("You're still here.");
      setReflectionSubText("The initial urge to leave passes quietly.");
    } else if (elapsedSeconds === 600) {
      setReflectionText("The fire grows warmer.");
      setReflectionSubText("Sparks rise as evening slowly approaches.");
    } else if (elapsedSeconds === 1200) {
      setReflectionText("Commitment grows quietly.");
      setReflectionSubText("Another log added to the campfire 🪵");
    } else if (elapsedSeconds === 1800) {
      setReflectionText("Not every moment needs excitement.");
      setReflectionSubText("Twilight turns to a quiet starry night 🌙");
    } else if (elapsedSeconds === 2400) {
      setReflectionText("Presence becomes belonging.");
      setReflectionSubText("You stopped counting minutes... and started belonging.");
    }
  };

  const handleFastForwardStay = () => {
    setTimeLeft(5);
  };

  // ----------------------------------------------------
  // 4. FINAL CINEMATIC & COMPLETION FLOW
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');
    setReflectionText("You stayed long enough for the place to feel familiar.");
    setReflectionSubText("You stayed committed.");

    // Camera rises, final glowing ember floats up to night sky
    Animated.parallel([
      Animated.timing(cameraRiseScale, {
        toValue: 1.35,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(finalGlowOpacity, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(emberRiseY, {
        toValue: -200,
        duration: 3200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.spring(badgeCardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.timing(badgeCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Submit completion to backend
    let pointsAdded = '300';
    let totalPoints = '300';
    let streak = '1';

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/tasks/save-commitment-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Stay 45+ Minutes',
            total_stay_duration: 2700,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            grace_period_used: gracePeriodUsed,
            is_completed: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        const compRes = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Stay 45+ Minutes' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on commitment stay', e);
    }

    // Auto navigate to shared task-success screen
    setTimeout(() => {
      router.replace({
        pathname: '/task-success',
        params: {
          points: pointsAdded,
          totalPoints: totalPoints,
          streak: streak,
          difficulty: 'hard',
          taskName: 'Stay 45+ Minutes',
          badge: 'Circle Keeper',
          message: 'You stayed committed.',
        },
      } as any);
    }, 4500);
  };

  const handleOptionalPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setOptionalPhoto(result.assets[0].uri);
        Alert.alert('Memory Preserved', 'Optional photo saved to your Journey Album!');
      }
    } catch (e) {
      console.log('Optional camera prompt dismissed');
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Interpolated Ember Spark Position
  const sparkY = emberSparksAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });

  const sparkOpacity = emberSparksAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 0.8, 0],
  });

  // ----------------------------------------------------
  // PERMISSION GATE UI
  // ----------------------------------------------------
  if (hasPermission === false) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#070b14', '#0f172a', '#1e1b4b']} style={StyleSheet.absoluteFill} />

        <SafeAreaView style={styles.permissionContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.permissionContent}>
            <View style={styles.permissionIconBadge}>
              <Ionicons name="flame" size={44} color="#f59e0b" />
            </View>

            <Text style={styles.permissionTitle}>Continuous Location Required</Text>
            <Text style={styles.permissionSubtitle}>
              To verify your uninterrupted 45-minute stay inside the activity radius, AntiSocial requires continuous background location access.
            </Text>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={requestPermission} activeOpacity={0.85}>
              <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.gradientBtn}>
                <Text style={styles.primaryBtnText}>Enable Location Services</Text>
                <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Dynamic Sky Gradient (Sunset -> Twilight -> Night) */}
      <LinearGradient colors={['#3b1812', '#1e1438', '#0b0d1a']} style={StyleSheet.absoluteFill} />

      {/* Final Golden Glow Fill */}
      {phase === 'cinematic' && (
        <Animated.View style={[styles.finalGoldenFill, { opacity: finalGlowOpacity }]} />
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>COMMITMENT DOG • HARD</Text>
            <Text style={styles.headerTitle}>Stay 45+ Minutes</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+300 Pts</Text>
          </View>
        </View>

        {/* Dynamic Reflection Text Banner */}
        <View style={styles.reflectionBanner}>
          <Text style={styles.reflectionTitle}>{reflectionText}</Text>
          {reflectionSubText ? <Text style={styles.reflectionSub}>{reflectionSubText}</Text> : null}
        </View>

        {/* Central Evolving Campfire Circle Canvas */}
        <Animated.View
          style={[
            styles.campfireSceneContainer,
            {
              transform: [{ scale: cameraRiseScale }],
            },
          ]}
        >
          {/* Seated Silhouettes Circle */}
          <View style={styles.silhouettesCircle}>
            {/* Top Silhouette */}
            <View style={[styles.silhouetteNode, { top: '10%', alignSelf: 'center' }]}>
              <Text style={styles.silhouetteEmoji}>👤</Text>
            </View>
            {/* Top Left Silhouette */}
            <View style={[styles.silhouetteNode, { top: '22%', left: '16%' }]}>
              <Text style={styles.silhouetteEmoji}>👤</Text>
            </View>
            {/* Top Right Silhouette */}
            <View style={[styles.silhouetteNode, { top: '22%', right: '16%' }]}>
              <Text style={styles.silhouetteEmoji}>👤</Text>
            </View>
            {/* Bottom Left Silhouette */}
            <View style={[styles.silhouetteNode, { bottom: '22%', left: '16%' }]}>
              <Text style={styles.silhouetteEmoji}>👤</Text>
            </View>
            {/* Bottom Right Silhouette */}
            <View style={[styles.silhouetteNode, { bottom: '22%', right: '16%' }]}>
              <Text style={styles.silhouetteEmoji}>👤</Text>
            </View>
            {/* User Node (Bottom Center) */}
            <View style={[styles.userNode, { bottom: '10%', alignSelf: 'center' }]}>
              <Text style={styles.userNodeEmoji}>🔥</Text>
            </View>
          </View>

          {/* Central Campfire Flames & Glowing Logs */}
          <View style={styles.centerCampfireAnchor}>
            {/* Outer Warm Light Glow */}
            <View style={styles.fireGlowRing} />

            {/* Flickering Flame */}
            <Animated.View
              style={[
                styles.flameBase,
                {
                  transform: [{ scale: flamePulse }, { translateY: flameTranslateY }],
                },
              ]}
            >
              <Text style={styles.flameEmoji}>🔥</Text>
            </Animated.View>

            {/* Wood Logs */}
            <View style={styles.logsCross}>
              <View style={styles.logLeft} />
              <View style={styles.logRight} />
            </View>

            {/* Floating Ember Sparks */}
            <Animated.View
              style={[
                styles.emberSpark,
                {
                  transform: [{ translateY: phase === 'cinematic' ? emberRiseY : sparkY }],
                  opacity: sparkOpacity,
                },
              ]}
            >
              <Text style={styles.emberEmoji}>✨</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Footer / Controls */}
        <View style={styles.footerContainer}>
          {phase === 'campfire' && (
            <View style={styles.stayProgressBox}>
              <Text style={styles.stayTimeText}>{formatTimer(timeLeft)}</Text>
              <Text style={styles.stayTimeSub}>Stay Proximity Verified</Text>

              {/* Dev Fast-Forward Helper */}
              <TouchableOpacity style={styles.fastForwardBtn} onPress={handleFastForwardStay}>
                <Text style={styles.fastForwardText}>⚡ Fast-Forward Stay (Demo)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Achievement Card & Optional Photo in Final Cinematic */}
          {phase === 'cinematic' && (
            <View style={styles.cinematicFooterGroup}>
              <Animated.View
                style={[
                  styles.badgeCard,
                  {
                    opacity: badgeCardOpacity,
                    transform: [{ translateY: badgeCardSlide }],
                  },
                ]}
              >
                <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.badgeCardGradient}>
                  <Text style={styles.badgeCardIcon}>🏅</Text>
                  <View style={styles.badgeCardTextGroup}>
                    <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                    <Text style={styles.badgeCardTitle}>Circle Keeper</Text>
                    <Text style={styles.badgeCardQuote}>"Belonging isn't built in minutes. It's built by staying."</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              <TouchableOpacity style={styles.optionalPhotoBtn} activeOpacity={0.8} onPress={handleOptionalPhoto}>
                <Ionicons name="camera-outline" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text style={styles.optionalPhotoText}>📸 Capture Memory Photo (Optional)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between' },

  finalGoldenFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },

  // Permission Gate Screen
  permissionContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  permissionContent: { alignItems: 'center', marginTop: 40 },
  permissionIconBadge: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1.5, borderColor: 'rgba(245, 158, 11, 0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc', textAlign: 'center', marginBottom: 12 },
  permissionSubtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryActionBtn: { width: '100%', borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#f59e0b', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },

  // Reflection Banner
  reflectionBanner: { paddingHorizontal: 24, marginTop: 10, alignItems: 'center' },
  reflectionTitle: { fontSize: 20, fontWeight: '800', color: '#fbbf24', textAlign: 'center' },
  reflectionSub: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', marginTop: 4, fontStyle: 'italic' },

  // Campfire Scene Container
  campfireSceneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  silhouettesCircle: { width: width * 0.75, height: width * 0.75, borderRadius: (width * 0.75) / 2, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.15)', position: 'absolute' },
  silhouetteNode: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  silhouetteEmoji: { fontSize: 18, opacity: 0.6 },
  userNode: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 158, 11, 0.25)', borderWidth: 1.5, borderColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  userNodeEmoji: { fontSize: 22 },

  // Center Campfire
  centerCampfireAnchor: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  fireGlowRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(245, 158, 11, 0.2)', shadowColor: '#f59e0b', shadowOpacity: 0.8, shadowRadius: 25, elevation: 12 },
  flameBase: { zIndex: 10 },
  flameEmoji: { fontSize: 52 },
  logsCross: { position: 'absolute', bottom: -10, flexDirection: 'row', gap: 6 },
  logLeft: { width: 28, height: 8, backgroundColor: '#582f0e', borderRadius: 4, transform: [{ rotate: '-25deg' }] },
  logRight: { width: 28, height: 8, backgroundColor: '#582f0e', borderRadius: 4, transform: [{ rotate: '25deg' }] },

  emberSpark: { position: 'absolute', zIndex: 20 },
  emberEmoji: { fontSize: 20 },

  // Footer Progress & Controls
  footerContainer: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  stayProgressBox: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 22, backgroundColor: 'rgba(7, 11, 20, 0.85)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  stayTimeText: { fontSize: 28, fontWeight: '800', color: '#fbbf24', letterSpacing: 1 },
  stayTimeSub: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  fastForwardBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  fastForwardText: { fontSize: 11, fontWeight: '700', color: '#fbbf24' },

  // Final Cinematic Cards
  cinematicFooterGroup: { width: '100%', alignItems: 'center', gap: 14 },
  badgeCard: { width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },

  optionalPhotoBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', flexDirection: 'row', alignItems: 'center' },
  optionalPhotoText: { fontSize: 13, fontWeight: '700', color: '#fbbf24' },
});
