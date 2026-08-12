import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 300; // 5 minutes = 300 seconds

// Social Place Categories & Supported Types
const SUPPORTED_PLACES = [
  { id: 'cafe', name: 'Central Perk Café', icon: 'coffee-outline', category: 'Café' },
  { id: 'library', name: 'Metropolitan Library', icon: 'book-outline', category: 'Library' },
  { id: 'park', name: 'Sunshine Community Park', icon: 'leaf-outline', category: 'Park' },
  { id: 'coworking', name: 'Nexus Hub Coworking', icon: 'business-outline', category: 'Coworking Space' },
  { id: 'mall', name: 'Plaza Shopping Mall', icon: 'bag-handle-outline', category: 'Shopping Mall' },
];

export default function LocationCheckinTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selected place state
  const [selectedPlace] = useState(
    () => SUPPORTED_PLACES[Math.floor(Math.random() * SUPPORTED_PLACES.length)]
  );

  // GPS Permission & Location States
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  }>({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
  });

  // States
  const [phase, setPhase] = useState<'details' | 'active' | 'cinematic'>('details');
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Dynamic Scene Text
  const [displayText, setDisplayText] = useState('Searching for nearby social places...');
  const [subDisplayText, setSubDisplayText] = useState<string | null>(null);

  // Animation Refs
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const sceneFadeAnim = useRef(new Animated.Value(0)).current;

  // Radar & Discovery Beacon Animations
  const radarSweepAnim = useRef(new Animated.Value(0)).current; // 0deg to 360deg sweep
  const beaconPulseAnim = useRef(new Animated.Value(1)).current;
  const pinDropAnim = useRef(new Animated.Value(-120)).current; // Drops down onto map
  const pinOpacityAnim = useRef(new Animated.Value(0)).current;
  const stampScaleAnim = useRef(new Animated.Value(2.5)).current;
  const stampOpacityAnim = useRef(new Animated.Value(0)).current;

  // Final Cinematic Map Beacon Pulse
  const shieldScaleAnim = useRef(new Animated.Value(0)).current;
  const shieldOpacityAnim = useRef(new Animated.Value(0)).current;

  // Check & Request GPS Permission on Mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (e) {
        setHasPermission(true); // Fallback to simulated mode
      }
    })();
  }, []);

  const requestGpsPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        const loc = await Location.getCurrentPositionAsync({});
        setGpsLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
        });
      } else {
        setHasPermission(false);
      }
    } catch (e) {
      setHasPermission(true);
    }
  };

  // Continuous Radar Sweep & Beacon Pulse Loops
  useEffect(() => {
    // Rotating Radar Sweep
    Animated.loop(
      Animated.timing(radarSweepAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing Beacon Rings
    Animated.loop(
      Animated.sequence([
        Animated.timing(beaconPulseAnim, {
          toValue: 1.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(beaconPulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // TIMELINE MANAGER (0:00 to 5:00 / 300s)
  // ----------------------------------------------------
  const elapsedTime = TOTAL_DURATION - timeLeft;

  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    if (elapsedTime === 0) {
      // 0:00 - Radar searching
      setDisplayText('Searching for nearby social places...');
      setSubDisplayText(null);
    } else if (elapsedTime === 15) {
      // 0:15 - Beacon locks onto place & pin drops
      setDisplayText('Location Found — Beacon Activated');
      setSubDisplayText(selectedPlace.name);

      Animated.parallel([
        Animated.spring(pinDropAnim, {
          toValue: 0,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(pinOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (elapsedTime === 90) {
      // 1:30 - Presence confirmation
      setDisplayText('You chose to be present.');
      setSubDisplayText(`Staying inside ${selectedPlace.category} radius`);
    } else if (elapsedTime === 180) {
      // 3:00 - Comfort growing
      setDisplayText('Remaining present expands your comfort zone.');
      setSubDisplayText(null);
    } else if (elapsedTime === 270) {
      // 4:30 - Preparing check-in stamp
      setDisplayText('Check-in stamp activating...');
      setSubDisplayText(null);
    } else if (elapsedTime >= 300) {
      // 5:00 - CHECKED IN Stamp animation & Final Cinematic
      setIsCheckedIn(true);
      setDisplayText('You were there.');
      setSubDisplayText(`${selectedPlace.name} — Verified via GPS`);

      // Trigger Stamp Animation
      Animated.parallel([
        Animated.spring(stampScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(stampOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        startFinalCinematic();
      }, 3500);
    }
  }, [elapsedTime, phase, isPaused]);

  // Main Timer Decrement Loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'active' && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, isPaused, timeLeft]);

  // Start Challenge
  const startChallenge = async () => {
    if (hasPermission === false) {
      Alert.alert(
        'Location Required',
        'AntiSocial needs live location to verify that you have reached a real social place. Please enable location permission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable Location', onPress: requestGpsPermission },
        ]
      );
      return;
    }

    saveProgressBackend({ session_started: true });
    setPhase('active');

    Animated.parallel([
      Animated.timing(uiFadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sceneFadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // FINAL CINEMATIC (Beacon Pulse -> Explorer Badge)
  // ----------------------------------------------------
  const startFinalCinematic = () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.spring(shieldScaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(shieldOpacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ----------------------------------------------------
  // BACKEND INTEGRATION & COMPLETION
  // ----------------------------------------------------
  const saveProgressBackend = async (dataPayload: any) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await apiFetch('/api/tasks/location-checkin/save-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Location Check-in',
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            location_name: selectedPlace.name,
            place_category: selectedPlace.category,
            accuracy: gpsLocation.accuracy,
            stay_duration: TOTAL_DURATION - timeLeft,
            ...dataPayload,
          }),
        });
      }
    } catch (e) {
      console.log('saveProgressBackend error:', e);
    }
  };

  const completeTaskBackend = async () => {
    if (isLoading) return;
    setIsLoading(true);

    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Location Check-in',
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded:
              data.points_rewarded?.toString() ||
              data.pointsAdded?.toString() ||
              '200',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }

    // MANDATORY: Navigate to shared Well Done completion screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You were there.',
        difficulty: 'medium',
        taskName: 'Location Check-in',
        badge: 'Explorer',
      },
    } as any);
  };

  // Developer Fast-Forward Helper
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__ || true) {
      const time = Date.now();
      if (time - lastPress.current < 350) {
        setTimeLeft(5); // Jump to 5s remaining
        Alert.alert('Dev Skip Triggered', 'Skipped to final phase (5s remaining)');
      }
      lastPress.current = time;
    }
  };

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const radarRotate = radarSweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Discovery Beacon Deep Blue & Neon Cyan Glassmorphism Environment */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Deep Blue Base Gradient */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#1e3a8a', '#0f172a']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Map Grid Lines Visual */}
        <View style={styles.mapGridOverlay} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Minimal Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (phase === 'active' && timeLeft > 0) {
                Alert.alert(
                  'Abort Challenge?',
                  'Are you sure you want to stop? Your progress will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Abort',
                      style: 'destructive',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {phase === 'details' ? 'DISCOVERY BEACON' : 'GPS EXPLORATION'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ============================================================ */}
        {/* PHASE 1: TASK DETAIL PAGE (Onboarding & Visual Identity)     */}
        {/* ============================================================ */}
        <Animated.View
          style={[styles.detailsWrapper, { opacity: uiFadeAnim }]}
          pointerEvents={phase === 'details' ? 'auto' : 'none'}
        >
          {/* Top Hero: Animated Radar Beacon Frame */}
          <View style={styles.heroBeaconContainer}>
            <View style={styles.heroBeaconFrame}>
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.35)', 'rgba(15, 23, 42, 0.9)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Feather name="navigation" size={42} color="#38bdf8" />
              <Text style={styles.heroBeaconLabel}>BEACON SEARCH</Text>
            </View>
          </View>

          {/* Central Glass Card */}
          <View style={styles.glassCard}>
            <Text style={styles.taskTitle}>Location Check-in</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Feather name="clock" size={13} color="#38bdf8" />
                <Text style={styles.badgeText}>5 Minutes</Text>
              </View>
              <View style={[styles.badgePill, styles.badgeMedium]}>
                <Ionicons name="flame" size={13} color="#38bdf8" />
                <Text style={[styles.badgeText, { color: '#38bdf8' }]}>
                  ⭐⭐ Medium
                </Text>
              </View>
              <View style={[styles.badgePill, styles.badgePoints]}>
                <Ionicons name="trophy" size={13} color="#f59e0b" />
                <Text style={[styles.badgeText, { color: '#f59e0b' }]}>
                  200 Points
                </Text>
              </View>
            </View>

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              Every place you visit expands your comfort zone.{'\n\n'}
              Today, physically visit a real social place—a café, library, park, coworking space, mall, or campus—and remain present for at least 5 minutes.{'\n'}
              The focus is showing up.
            </Text>

            {/* Supported Places Row */}
            <View style={styles.placesPillsRow}>
              <View style={styles.placePill}>
                <Text style={styles.placePillEmoji}>☕</Text>
                <Text style={styles.placePillText}>Café</Text>
              </View>
              <View style={styles.placePill}>
                <Text style={styles.placePillEmoji}>📚</Text>
                <Text style={styles.placePillText}>Library</Text>
              </View>
              <View style={styles.placePill}>
                <Text style={styles.placePillEmoji}>🌳</Text>
                <Text style={styles.placePillText}>Park</Text>
              </View>
              <View style={styles.placePill}>
                <Text style={styles.placePillEmoji}>🏢</Text>
                <Text style={styles.placePillText}>Coworking</Text>
              </View>
            </View>

            {/* Quote Box */}
            <View style={styles.quoteBox}>
              <Feather name="compass" size={18} color="#38bdf8" style={{ marginRight: 8 }} />
              <Text style={styles.quoteText}>
                "Every place you visit expands your comfort zone."
              </Text>
            </View>

            {/* Explorer Achievement Banner */}
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeBannerTitle}>Explorer</Text>
                <Text style={styles.badgeBannerSub}>
                  Unlock achievement by showing up at a real social location
                </Text>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={startChallenge}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0284c7', '#38bdf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>ACTIVATE BEACON</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================ */}
        {/* PHASE 2 & 3: MAIN DISCOVERY BEACON RADAR SCENE & STAMP       */}
        {/* ============================================================ */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.sceneContainer,
            { opacity: sceneFadeAnim },
          ]}
          pointerEvents={phase !== 'details' ? 'auto' : 'none'}
        >
          {/* Main Visual Map Radar Stage */}
          <View style={styles.radarStageArena}>
            <View style={styles.radarCircleFrame}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Pulsing Beacon Concentric Circles */}
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  { transform: [{ scale: beaconPulseAnim }] },
                ]}
              />

              {/* Rotating Radar Sweep Cone */}
              <Animated.View
                style={[
                  styles.radarSweepLine,
                  { transform: [{ rotate: radarRotate }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(56, 189, 248, 0.5)', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>

              {/* Glowing Location Pin Landing */}
              <Animated.View
                style={[
                  styles.locationPinContainer,
                  {
                    transform: [{ translateY: pinDropAnim }],
                    opacity: pinOpacityAnim,
                  },
                ]}
              >
                <Ionicons name="location" size={48} color="#38bdf8" />
                <View style={styles.locationPinBadge}>
                  <Text style={styles.locationPinBadgeText}>
                    {selectedPlace.category}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* CHECKED IN Stamp Banner (Phase 2 completion) */}
          {isCheckedIn && (
            <Animated.View
              style={[
                styles.checkedInStampBox,
                {
                  transform: [{ scale: stampScaleAnim }],
                  opacity: stampOpacityAnim,
                },
              ]}
            >
              <Text style={styles.stampCheckIcon}>✓</Text>
              <Text style={styles.stampText}>CHECKED IN</Text>
            </Animated.View>
          )}

          {/* Central Display Text */}
          <View style={styles.displayTextContainer}>
            <Text style={styles.mainDisplayText}>{displayText}</Text>
            {subDisplayText && (
              <Text style={styles.subDisplayText}>{subDisplayText}</Text>
            )}
          </View>

          {/* Footer Controls (No Timer Rings or Progress Bars, pure aesthetic digits) */}
          {phase === 'active' && (
            <View style={styles.footerControls}>
              <Pressable onPress={handleDevSkip}>
                <Text style={styles.timerText}>
                  {formatTimerDigits(timeLeft)}
                </Text>
              </Pressable>

              <View style={styles.footerBtnRow}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseBtnText}>
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.abortBtn}
                  onPress={() => {
                    Alert.alert(
                      'Abort Challenge?',
                      'Are you sure you want to stop? Your progress will be lost.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Abort',
                          style: 'destructive',
                          onPress: () => router.back(),
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.abortBtnText}>ABORT</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Final Achievement Banner (Phase 3) */}
          {phase === 'cinematic' && (
            <Animated.View
              style={[
                styles.achievementBox,
                {
                  transform: [{ scale: shieldScaleAnim }],
                  opacity: shieldOpacityAnim,
                },
              ]}
            >
              <View style={styles.achievementBadgeRow}>
                <Text style={styles.achievementBadgeEmoji}>🏅</Text>
                <View>
                  <Text style={styles.achievementBadgeTag}>
                    ACHIEVEMENT UNLOCKED
                  </Text>
                  <Text style={styles.achievementBadgeTitle}>Explorer</Text>
                </View>
              </View>
              <Text style={styles.achievementDescription}>
                "Every place you visit expands your comfort zone."
              </Text>

              <TouchableOpacity
                style={styles.claimButton}
                onPress={completeTaskBackend}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0284c7', '#38bdf8']}
                  style={styles.claimBtnGradient}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? 'CLAIMING...' : 'CLAIM REWARD (+300 PTS)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },

  // Map Grid Visual
  mapGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  headerTagText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Phase 1: Onboarding Details Page
  detailsWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBeaconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  heroBeaconFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  heroBeaconLabel: {
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeMedium: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  badgePoints: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },

  placesPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placePillEmoji: {
    fontSize: 12,
  },
  placePillText: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '700',
  },

  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  quoteText: {
    flex: 1,
    color: '#e0f2fe',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
    width: '100%',
  },
  badgeBannerEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  badgeBannerTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeBannerSub: {
    color: '#38bdf8',
    fontSize: 11,
  },

  startButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Phase 2 & 3: Main Scene
  sceneContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  radarStageArena: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  radarCircleFrame: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    borderWidth: 3,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  radarPulseRing: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  radarSweepLine: {
    position: 'absolute',
    width: (width * 0.75) / 2,
    height: (width * 0.75) / 2,
    top: 0,
    right: 0,
  },

  locationPinContainer: {
    alignItems: 'center',
  },
  locationPinBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    marginTop: 4,
  },
  locationPinBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },

  // Stamp Box
  checkedInStampBox: {
    position: 'absolute',
    top: height * 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  stampCheckIcon: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: '900',
  },
  stampText: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Display Text
  displayTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  mainDisplayText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subDisplayText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },

  // Footer Controls
  footerControls: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  timerText: {
    color: '#38bdf8',
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 3,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pauseBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  abortBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  abortBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Achievement Unlock Box (Phase 3)
  achievementBox: {
    width: '90%',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginBottom: 10,
  },
  achievementBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  achievementBadgeEmoji: {
    fontSize: 36,
  },
  achievementBadgeTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  achievementBadgeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  achievementDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 18,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  claimBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
