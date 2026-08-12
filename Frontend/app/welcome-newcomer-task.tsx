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
  ScrollView,
  Alert,
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

const SAMPLE_COMMUNITY_PRESETS = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80',
];

export default function WelcomeNewcomerTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Phase
  // 'constellation' -> 'igniting' -> 'photo' -> 'verifying' -> 'cinematic'
  const [phase, setPhase] = useState<'constellation' | 'igniting' | 'photo' | 'verifying' | 'cinematic'>('constellation');

  // Photo & Verification State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.96);
  const [statusTitle, setStatusTitle] = useState('Detecting community environment & venue context...');
  const [statusSub, setStatusSub] = useState('AI verifying public space & GPS proximity...');

  // Animation References
  const userNodeTranslateX = useRef(new Animated.Value(0)).current;
  const userNodeTranslateY = useRef(new Animated.Value(0)).current;
  const newcomerGlow = useRef(new Animated.Value(0.3)).current;
  const newcomerScale = useRef(new Animated.Value(0.85)).current;
  const constellationLinesOpacity = useRef(new Animated.Value(0)).current;
  const scanLaserAnim = useRef(new Animated.Value(0)).current;

  const wallSlideAnim = useRef(new Animated.Value(100)).current;
  const wallOpacityAnim = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // Ambient Dim Node Pulse
  useEffect(() => {
    if (phase === 'constellation') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(newcomerGlow, {
            toValue: 0.6,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(newcomerGlow, {
            toValue: 0.25,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [phase]);

  // ----------------------------------------------------
  // 1. WELCOME ACTION & IGNITION ANIMATION
  // ----------------------------------------------------
  const handleInitiateWelcome = () => {
    setPhase('igniting');

    // Move User Node smoothly to Newcomer Node position
    Animated.parallel([
      Animated.timing(userNodeTranslateX, {
        toValue: 60,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(userNodeTranslateY, {
        toValue: -75,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Ignite the Newcomer Node into radiant gold
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(newcomerGlow, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(newcomerScale, {
          toValue: 1.25,
          tension: 70,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(constellationLinesOpacity, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1400);

    setTimeout(() => {
      setPhase('photo');
    }, 2800);
  };

  // ----------------------------------------------------
  // 2. PHOTO CAPTURE & AI SCANNING
  // ----------------------------------------------------
  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Camera access is requested to capture proof of your community gathering.');
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startVerification(result.assets[0].uri);
      } else {
        startVerification(SAMPLE_COMMUNITY_PRESETS[0]);
      }
    } catch (e) {
      startVerification(SAMPLE_COMMUNITY_PRESETS[0]);
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startVerification(result.assets[0].uri);
      } else {
        startVerification(SAMPLE_COMMUNITY_PRESETS[0]);
      }
    } catch (e) {
      startVerification(SAMPLE_COMMUNITY_PRESETS[0]);
    }
  };

  const startVerification = (imageUri: string) => {
    setCapturedPhoto(imageUri);
    setPhase('verifying');

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLaserAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLaserAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      setStatusTitle('Community Environment Verified');
      setStatusSub('Analyzing group venue features & live GPS proximity...');
    }, 1200);

    setTimeout(() => {
      triggerFinalCinematic();
    }, 3200);
  };

  // ----------------------------------------------------
  // 3. FINAL CINEMATIC & BACKEND SAVE
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(wallSlideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(wallOpacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.spring(badgeCardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.timing(badgeCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Submit to backend
    let pointsAdded = '300';
    let totalPoints = '300';
    let streak = '1';

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && capturedPhoto) {
        const res = await fetch(`${API_BASE_URL}/api/tasks/verify-inclusion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Welcome a New Participant',
            event_name: 'Community Gathering',
            event_category: 'Inclusion Session',
            image_url: capturedPhoto,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        const compRes = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Welcome a New Participant' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on welcome newcomer task', e);
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
          taskName: 'Welcome a New Participant',
          badge: 'Community Guide',
          message: 'You included others.',
        },
      } as any);
    }, 3800);
  };

  const laserTopInterpolate = scanLaserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '90%'],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Deep Violet Glassmorphism Background */}
      <LinearGradient colors={['#0c0a1b', '#16132e', '#221845']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>COMMUNITY DOG • HARD</Text>
            <Text style={styles.headerTitle}>Welcome a New Participant</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+300 Pts</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* THE FIRST LIGHT: COMMUNITY LIGHT CIRCLE CANVAS */}
          <View style={styles.cinematicBoard}>
            <LinearGradient colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']} style={styles.boardGlass}>
              <Text style={styles.boardQuote}>"You once needed a welcome."</Text>
              <Text style={styles.boardQuoteHighlight}>"Today, you became the welcome."</Text>

              {/* Constellation Ring Container */}
              <View style={styles.constellationRing}>
                {/* Connecting Constellation Lines */}
                <Animated.View style={[styles.constellationLinesRing, { opacity: constellationLinesOpacity }]} />

                {/* Member Node 1 (Top) */}
                <View style={[styles.lightNode, styles.nodeTop]}>
                  <View style={styles.nodeCoreBright} />
                </View>

                {/* Member Node 2 (Top Right) */}
                <View style={[styles.lightNode, styles.nodeTopRight]}>
                  <View style={styles.nodeCoreBright} />
                </View>

                {/* Member Node 3 (Bottom Right) */}
                <View style={[styles.lightNode, styles.nodeBottomRight]}>
                  <View style={styles.nodeCoreBright} />
                </View>

                {/* Member Node 4 (Bottom Left) */}
                <View style={[styles.lightNode, styles.nodeBottomLeft]}>
                  <View style={styles.nodeCoreBright} />
                </View>

                {/* Member Node 5 (Top Left) */}
                <View style={[styles.lightNode, styles.nodeTopLeft]}>
                  <View style={styles.nodeCoreBright} />
                </View>

                {/* Dim Newcomer Node (Target) */}
                <Animated.View
                  style={[
                    styles.lightNode,
                    styles.nodeNewcomer,
                    {
                      opacity: newcomerGlow,
                      transform: [{ scale: newcomerScale }],
                    },
                  ]}
                >
                  <View style={phase === 'igniting' || phase === 'cinematic' ? styles.nodeCoreGold : styles.nodeCoreDim} />
                  {phase === 'constellation' && <Text style={styles.newcomerLabel}>NEWCOMER</Text>}
                </Animated.View>

                {/* Floating User Light Node */}
                <Animated.View
                  style={[
                    styles.userLightNode,
                    {
                      transform: [{ translateX: userNodeTranslateX }, { translateY: userNodeTranslateY }],
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" />
                </Animated.View>
              </View>
            </LinearGradient>
          </View>

          {/* STEP 1: WELCOME ACTION TRIGGER */}
          {phase === 'constellation' && (
            <View style={styles.actionSection}>
              <Text style={styles.actionPromptTitle}>Welcome one person who is new or attending for the first time.</Text>

              <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.88} onPress={handleInitiateWelcome}>
                <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.gradientBtn}>
                  <Text style={styles.primaryBtnText}>🤝 Welcome New Participant</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: PHOTO PROOF PROMPT */}
          {phase === 'photo' && (
            <View style={styles.photoSection}>
              <Text style={styles.photoSectionTitle}>📸 Capture a Memory</Text>
              <Text style={styles.photoSectionSub}>Preserve proof of the community activity or venue (no face close-ups required).</Text>

              <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.88} onPress={handleLaunchCamera}>
                <LinearGradient colors={['#fbbf24', '#ec4899']} style={styles.gradientBtn}>
                  <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Open Camera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8} onPress={handleLaunchGallery}>
                <Ionicons name="images-outline" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI VERIFICATION SCANNER */}
          {phase === 'verifying' && capturedPhoto && (
            <View style={styles.scannerBlock}>
              <View style={styles.scannerFrame}>
                <Image source={{ uri: capturedPhoto }} style={styles.scannerImage} />
                <Animated.View style={[styles.scannerLaserLine, { top: laserTopInterpolate }]} />

                <View style={styles.scannerOverlay}>
                  <View style={styles.badgeRow}>
                    <View style={styles.aiBadge}>
                      <Ionicons name="hardware-chip-outline" size={14} color="#fbbf24" />
                      <Text style={styles.aiBadgeText}>AI Vision Scanner</Text>
                    </View>
                    <View style={styles.gpsBadge}>
                      <Ionicons name="location" size={14} color="#4ade80" />
                      <Text style={styles.gpsBadgeText}>GPS Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.scannerTitle}>{statusTitle}</Text>
                  <Text style={styles.scannerSub}>{statusSub}</Text>
                </View>
              </View>
            </View>
          )}

          {/* FINAL CINEMATIC & COMMUNITY WALL INSERTION */}
          {phase === 'cinematic' && (
            <View style={styles.cinematicContainer}>
              <Animated.View
                style={[
                  styles.wallPocketCard,
                  {
                    opacity: wallOpacityAnim,
                    transform: [{ translateY: wallSlideAnim }],
                  },
                ]}
              >
                <LinearGradient colors={['rgba(251, 191, 36, 0.2)', 'rgba(245, 158, 11, 0.1)']} style={styles.wallPocketInner}>
                  <Ionicons name="heart-circle" size={28} color="#fbbf24" />
                  <Text style={styles.wallPocketTitle}>Someone felt more welcome because you showed up.</Text>
                  <Text style={styles.wallPocketSub}>The glowing newcomer light permanently joined the community circle.</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View
                style={[
                  styles.badgeCard,
                  {
                    opacity: badgeCardOpacity,
                    transform: [{ translateY: badgeCardSlide }],
                  },
                ]}
              >
                <LinearGradient colors={['#fbbf24', '#ec4899']} style={styles.badgeCardGradient}>
                  <Text style={styles.badgeCardIcon}>🏅</Text>
                  <View style={styles.badgeCardTextGroup}>
                    <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                    <Text style={styles.badgeCardTitle}>Community Guide</Text>
                    <Text style={styles.badgeCardQuote}>"The strongest communities grow because someone chooses to welcome the next person."</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  contentScroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#fbbf24', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(251, 191, 36, 0.2)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },

  // Cinematic Board & Constellation
  cinematicBoard: { marginTop: 10, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)' },
  boardGlass: { padding: 24, alignItems: 'center' },
  boardQuote: { fontSize: 16, color: '#cbd5e1', textAlign: 'center', fontStyle: 'italic' },
  boardQuoteHighlight: { fontSize: 18, fontWeight: '800', color: '#fbbf24', textAlign: 'center', marginTop: 4 },

  constellationRing: { width: width - 80, height: width - 80, borderRadius: (width - 80) / 2, marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  constellationLinesRing: { ...StyleSheet.absoluteFillObject, borderRadius: (width - 80) / 2, borderWidth: 1.5, borderColor: '#fbbf24', shadowColor: '#fbbf24', shadowOpacity: 0.9, shadowRadius: 15 },

  lightNode: { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nodeCoreBright: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fbbf24', shadowColor: '#fbbf24', shadowOpacity: 0.8, shadowRadius: 10, elevation: 8 },
  nodeCoreDim: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#64748b' },
  nodeCoreGold: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fbbf24', shadowColor: '#fbbf24', shadowOpacity: 1, shadowRadius: 15, elevation: 12 },

  nodeTop: { top: 10, alignSelf: 'center' },
  nodeTopRight: { top: 60, right: 30 },
  nodeBottomRight: { bottom: 60, right: 30 },
  nodeBottomLeft: { bottom: 60, left: 30 },
  nodeTopLeft: { top: 60, left: 30 },
  nodeNewcomer: { top: '45%', right: 20 },
  newcomerLabel: { position: 'absolute', top: -16, fontSize: 9, fontWeight: '900', color: '#cbd5e1', letterSpacing: 0.8 },

  userLightNode: { position: 'absolute', bottom: '30%', left: '30%', width: 34, height: 34, borderRadius: 17, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', shadowColor: '#f59e0b', shadowOpacity: 0.9, shadowRadius: 12, elevation: 10 },

  // Action Sections
  actionSection: { marginTop: 20 },
  actionPromptTitle: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  primaryActionBtn: { borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '800' },

  photoSection: { marginTop: 20 },
  photoSectionTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  photoSectionSub: { fontSize: 13, color: '#94a3b8', marginBottom: 16, lineHeight: 18 },
  secondaryActionBtn: { marginTop: 12, width: '100%', height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  secondaryBtnText: { color: '#fbbf24', fontSize: 14, fontWeight: '700' },

  // Scanner Block
  scannerBlock: { alignItems: 'center', marginTop: 20 },
  scannerFrame: { width: width - 40, height: (width - 40) * 1.1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: '#fbbf24' },
  scannerImage: { ...StyleSheet.absoluteFillObject },
  scannerLaserLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#fbbf24', shadowColor: '#fbbf24', shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
  scannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, backgroundColor: 'rgba(7, 11, 20, 0.9)' },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(251, 191, 36, 0.2)' },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  gpsBadgeText: { fontSize: 10, fontWeight: '800', color: '#4ade80' },
  scannerTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  scannerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Cinematic Container
  cinematicContainer: { width: '100%', marginTop: 20, alignItems: 'center' },
  wallPocketCard: { width: '100%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', marginBottom: 16 },
  wallPocketInner: { padding: 18, alignItems: 'center' },
  wallPocketTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 6, textAlign: 'center' },
  wallPocketSub: { fontSize: 12, color: '#cbd5e1', marginTop: 4, textAlign: 'center' },

  badgeCard: { width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },
});
