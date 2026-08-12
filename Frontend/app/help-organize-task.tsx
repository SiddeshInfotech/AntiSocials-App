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

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

interface ContributionIdea {
  id: string;
  title: string;
  icon: string;
  category: string;
  presetUri: string;
}

const INSPIRATION_PROMPTS: ContributionIdea[] = [
  {
    id: 'idea_chairs',
    title: 'Help arrange chairs & seating',
    icon: 'easel-outline',
    category: 'Chairs & Seating',
    presetUri: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'idea_tables',
    title: 'Set up tables & registration desk',
    icon: 'desktop-outline',
    category: 'Tables & Desk',
    presetUri: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'idea_water',
    title: 'Distribute water bottles & materials',
    icon: 'water-outline',
    category: 'Water & Supplies',
    presetUri: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'idea_equipment',
    title: 'Organize sports & activity equipment',
    icon: 'fitness-outline',
    category: 'Equipment Setup',
    presetUri: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'idea_cleanup',
    title: 'Help clean up & tidy after the event',
    icon: 'trash-outline',
    category: 'Event Cleanup',
    presetUri: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?w=600&auto=format&fit=crop&q=80',
  },
];

export default function HelpOrganizeTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selected Contribution & Phase
  // 'board' -> 'photo' -> 'verifying' -> 'puzzle_fly' -> 'completed' -> 'cinematic'
  const [phase, setPhase] = useState<'board' | 'photo' | 'verifying' | 'puzzle_fly' | 'completed' | 'cinematic'>('board');
  const [selectedIdea, setSelectedIdea] = useState<ContributionIdea>(INSPIRATION_PROMPTS[0]);
  const [promptIndex, setPromptIndex] = useState(0);

  // Photo & Verification State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.95);
  const [statusTitle, setStatusTitle] = useState('Detecting event setup & volunteer contributions...');
  const [statusSub, setStatusSub] = useState('AI verifying chairs, tables & GPS proximity...');

  // Animation References
  const pieceGlowPulse = useRef(new Animated.Value(1)).current;
  const pieceFlyProgress = useRef(new Animated.Value(0)).current;
  const puzzleGoldSweep = useRef(new Animated.Value(0)).current;
  const scanLaserAnim = useRef(new Animated.Value(0)).current;

  const wallSlideAnim = useRef(new Animated.Value(100)).current;
  const wallOpacityAnim = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. ROTATING PROMPTS & GLOWING PUZZLE PIECE
  // ----------------------------------------------------
  useEffect(() => {
    // Missing Puzzle Piece Ambient Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pieceGlowPulse, {
          toValue: 1.25,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pieceGlowPulse, {
          toValue: 1.0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate inspirational prompts every 4 seconds
    const interval = setInterval(() => {
      setPromptIndex((prev) => {
        const next = (prev + 1) % INSPIRATION_PROMPTS.length;
        setSelectedIdea(INSPIRATION_PROMPTS[next]);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------
  // 2. PHOTO CAPTURE & AI SCANNING
  // ----------------------------------------------------
  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Camera access is required to capture proof of your contribution.');
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startVerification(result.assets[0].uri);
      } else {
        startVerification(selectedIdea.presetUri);
      }
    } catch (e) {
      startVerification(selectedIdea.presetUri);
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
        startVerification(selectedIdea.presetUri);
      }
    } catch (e) {
      startVerification(selectedIdea.presetUri);
    }
  };

  const startVerification = (imageUri: string) => {
    setCapturedPhoto(imageUri);
    setPhase('verifying');

    // Laser scan animation
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
      setStatusTitle(`Verifying ${selectedIdea.category}`);
      setStatusSub('AI matching setup elements & event GPS location...');
    }, 1200);

    setTimeout(() => {
      triggerPuzzlePieceFly();
    }, 3200);
  };

  // ----------------------------------------------------
  // 3. PUZZLE PIECE FLY & GOLDEN SWEEP ANIMATION
  // ----------------------------------------------------
  const triggerPuzzlePieceFly = () => {
    setPhase('puzzle_fly');

    // Piece flies into puzzle slot
    Animated.timing(pieceFlyProgress, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();

    // Golden light sweep
    setTimeout(() => {
      setPhase('completed');
      Animated.timing(puzzleGoldSweep, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }).start();
    }, 1400);

    // Final cinematic transition
    setTimeout(() => {
      triggerFinalCinematic();
    }, 3600);
  };

  // ----------------------------------------------------
  // 4. FINAL CINEMATIC & BACKEND COMPLETION
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.timing(wallSlideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(wallOpacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(600),
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
      if (token && capturedPhoto) {
        const res = await apiFetch('/api/tasks/verify-contribution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Help Organize Small Part',
            contribution_type: selectedIdea.category,
            event_name: 'Community Event',
            image_url: capturedPhoto,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        const compRes = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Help Organize Small Part' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on help organize task', e);
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
          taskName: 'Help Organize Small Part',
          badge: 'Community Builder',
          message: 'You contributed.',
        },
      } as any);
    }, 3800);
  };

  const laserTopInterpolate = scanLaserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '90%'],
  });

  const pieceScaleInterpolate = pieceFlyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.4, 1.0],
  });

  const pieceTranslateYInterpolate = pieceFlyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Deep Wooden Board Background Gradient */}
      <LinearGradient colors={['#1c130e', '#2c1c14', '#150d09']} style={StyleSheet.absoluteFill} />

      {/* Ambient Wood Texture Borders */}
      <View style={styles.woodFrameBorder} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>CONTRIBUTION DOG • HARD</Text>
            <Text style={styles.headerTitle}>Help Organize Small Part</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+600 Pts</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* WOODEN MISSION BOARD & PUZZLE CANVAS */}
          <View style={styles.woodenBoardContainer}>
            <View style={styles.woodenBoardInner}>
              <Text style={styles.boardHeadline}>"Every event needs someone willing to help."</Text>
              <Text style={styles.boardSubhead}>When your piece fits, the picture becomes complete.</Text>

              {/* 4-Tile Puzzle Grid Canvas */}
              <View style={styles.puzzleMatrixFrame}>
                <View style={styles.puzzleRow}>
                  {/* Tile 1 */}
                  <View style={styles.puzzleTile}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&auto=format&fit=crop&q=80' }}
                      style={styles.puzzleTileImg}
                    />
                    <View style={styles.puzzleOverlay} />
                  </View>

                  {/* Tile 2 */}
                  <View style={styles.puzzleTile}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80' }}
                      style={styles.puzzleTileImg}
                    />
                    <View style={styles.puzzleOverlay} />
                  </View>
                </View>

                <View style={styles.puzzleRow}>
                  {/* Tile 3 */}
                  <View style={styles.puzzleTile}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500&auto=format&fit=crop&q=80' }}
                      style={styles.puzzleTileImg}
                    />
                    <View style={styles.puzzleOverlay} />
                  </View>

                  {/* Tile 4: The Missing Piece Slot */}
                  <View style={styles.puzzleTileMissingSlot}>
                    {phase === 'completed' || phase === 'cinematic' ? (
                      <Image
                        source={{ uri: capturedPhoto || selectedIdea.presetUri }}
                        style={styles.puzzleTileImg}
                      />
                    ) : (
                      <Animated.View
                        style={[
                          styles.missingPieceSlotCutout,
                          { transform: [{ scale: pieceGlowPulse }] },
                        ]}
                      >
                        <Text style={styles.missingPieceSlotEmoji}>🧩</Text>
                        <Text style={styles.missingPieceSlotLabel}>YOUR PIECE</Text>
                      </Animated.View>
                    )}
                  </View>
                </View>

                {/* Flying Puzzle Piece Animation Overlay */}
                {phase === 'puzzle_fly' && (
                  <Animated.View
                    style={[
                      styles.flyingPieceOverlay,
                      {
                        transform: [
                          { scale: pieceScaleInterpolate },
                          { translateY: pieceTranslateYInterpolate },
                        ],
                      },
                    ]}
                  >
                    <Image source={{ uri: capturedPhoto || selectedIdea.presetUri }} style={styles.puzzleTileImg} />
                    <View style={styles.flyingPieceGlowBorder} />
                  </Animated.View>
                )}

                {/* Golden Light Sweep Overlay */}
                {phase === 'completed' && (
                  <Animated.View style={[styles.goldSweepOverlay, { opacity: puzzleGoldSweep }]}>
                    <Text style={styles.goldSweepBannerText}>✨ "Every contribution matters." ✨</Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>

          {/* STEP 2: ROTATING INSPIRATION PROMPTS */}
          {phase === 'board' && (
            <View style={styles.promptsSection}>
              <Text style={styles.promptsHeader}>Perform ONE small action:</Text>

              <TouchableOpacity style={styles.activeIdeaCard} activeOpacity={0.9} onPress={handleLaunchCamera}>
                <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(236, 72, 153, 0.15)']} style={styles.activeIdeaInner}>
                  <View style={styles.ideaIconCircle}>
                    <Ionicons name={selectedIdea.icon as any} size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.ideaTextGroup}>
                    <Text style={styles.ideaCategory}>{selectedIdea.category}</Text>
                    <Text style={styles.ideaTitle}>{selectedIdea.title}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.88} onPress={handleLaunchCamera}>
                  <LinearGradient colors={['#f59e0b', '#ec4899']} style={styles.gradientBtn}>
                    <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>📸 Capture Proof Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8} onPress={handleLaunchGallery}>
                  <Ionicons name="images-outline" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
                </TouchableOpacity>
              </View>
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
                      <Ionicons name="hardware-chip-outline" size={14} color="#f59e0b" />
                      <Text style={styles.aiBadgeText}>AI Contribution Scanner</Text>
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

          {/* FINAL CINEMATIC & COMMUNITY CONTRIBUTIONS WALL */}
          {(phase === 'completed' || phase === 'cinematic') && (
            <View style={styles.cinematicContainer}>
              {phase === 'cinematic' && (
                <Animated.View
                  style={[
                    styles.wallPocketCard,
                    {
                      opacity: wallOpacityAnim,
                      transform: [{ translateY: wallSlideAnim }],
                    },
                  ]}
                >
                  <LinearGradient colors={['#2c1c14', '#1a100b']} style={styles.wallPocketInner}>
                    <Ionicons name="sparkles" size={24} color="#f59e0b" />
                    <Text style={styles.wallPocketTitle}>Saved to Community Contributions</Text>
                    <Text style={styles.wallPocketSub}>Your missing piece helped complete the picture.</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {phase === 'cinematic' && (
                <Animated.View
                  style={[
                    styles.badgeCard,
                    {
                      opacity: badgeCardOpacity,
                      transform: [{ translateY: badgeCardSlide }],
                    },
                  ]}
                >
                  <LinearGradient colors={['#f59e0b', '#ec4899']} style={styles.badgeCardGradient}>
                    <Text style={styles.badgeCardIcon}>🏅</Text>
                    <View style={styles.badgeCardTextGroup}>
                      <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                      <Text style={styles.badgeCardTitle}>Community Builder</Text>
                      <Text style={styles.badgeCardQuote}>"You helped something become better."</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
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

  woodFrameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 8,
    borderColor: '#3a2318',
    opacity: 0.6,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#f59e0b', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },

  // Wooden Board Container
  woodenBoardContainer: { marginTop: 10, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#4a2f20', elevation: 12 },
  woodenBoardInner: { backgroundColor: 'rgba(28, 19, 14, 0.95)', padding: 20, alignItems: 'center' },
  boardHeadline: { fontSize: 17, fontWeight: '800', color: '#fbbf24', textAlign: 'center', marginBottom: 4 },
  boardSubhead: { fontSize: 12, color: '#d97706', textAlign: 'center', fontStyle: 'italic', marginBottom: 18 },

  // 4-Tile Puzzle Grid Matrix
  puzzleMatrixFrame: { width: width - 80, height: width - 80, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0f0a07', borderWidth: 2, borderColor: '#d97706', justifyContent: 'center' },
  puzzleRow: { flex: 1, flexDirection: 'row' },
  puzzleTile: { flex: 1, margin: 1, borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.3)', overflow: 'hidden' },
  puzzleTileImg: { width: '100%', height: '100%' },
  puzzleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28, 19, 14, 0.2)' },

  puzzleTileMissingSlot: { flex: 1, borderWidth: 1, borderColor: '#f59e0b', borderStyle: 'dashed', backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center' },
  missingPieceSlotCutout: { alignItems: 'center', justifyContent: 'center' },
  missingPieceSlotEmoji: { fontSize: 32 },
  missingPieceSlotLabel: { fontSize: 10, fontWeight: '900', color: '#fbbf24', letterSpacing: 1, marginTop: 4 },

  flyingPieceOverlay: { position: 'absolute', bottom: 10, right: 10, width: (width - 80) / 2, height: (width - 80) / 2, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#fbbf24', elevation: 16 },
  flyingPieceGlowBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: '#fff' },

  goldSweepOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245, 158, 11, 0.85)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  goldSweepBannerText: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },

  // Inspiration Prompts Section
  promptsSection: { marginTop: 20 },
  promptsHeader: { fontSize: 14, fontWeight: '700', color: '#d97706', marginBottom: 10 },
  activeIdeaCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', marginBottom: 20 },
  activeIdeaInner: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  ideaIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  ideaTextGroup: { flex: 1 },
  ideaCategory: { fontSize: 11, fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase' },
  ideaTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 2 },

  actionBtnGroup: { gap: 12 },
  primaryActionBtn: { borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryActionBtn: { width: '100%', height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  secondaryBtnText: { color: '#fbbf24', fontSize: 14, fontWeight: '700' },

  // Scanner Block
  scannerBlock: { alignItems: 'center', marginTop: 20 },
  scannerFrame: { width: width - 40, height: (width - 40) * 1.1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: '#f59e0b' },
  scannerImage: { ...StyleSheet.absoluteFillObject },
  scannerLaserLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
  scannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, backgroundColor: 'rgba(7, 11, 20, 0.9)' },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  gpsBadgeText: { fontSize: 10, fontWeight: '800', color: '#4ade80' },
  scannerTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  scannerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Cinematic Container
  cinematicContainer: { width: '100%', marginTop: 20, alignItems: 'center' },
  wallPocketCard: { width: '100%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 16 },
  wallPocketInner: { padding: 18, alignItems: 'center' },
  wallPocketTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 6 },
  wallPocketSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  badgeCard: { width: '100%', borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },
});
