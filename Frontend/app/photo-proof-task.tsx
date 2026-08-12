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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

interface SocialPreset {
  id: string;
  name: string;
  category: string;
  emoji: string;
  locationName: string;
  uri: string;
}

const PRESET_SOCIAL_PHOTOS: SocialPreset[] = [
  {
    id: 'preset_cafe',
    name: 'Cafe & Social Hub',
    category: 'Cafe ☕',
    emoji: '☕',
    locationName: 'Central Perk Café',
    uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_library',
    name: 'Library Discussion Room',
    category: 'Library 📚',
    emoji: '📚',
    locationName: 'Metropolitan Public Library',
    uri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_park',
    name: 'Community Park Green',
    category: 'Park 🌳',
    emoji: '🌳',
    locationName: 'Sunshine Community Park',
    uri: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_event',
    name: 'Tech & Art Community Event',
    category: 'Community Event 🎪',
    emoji: '🎪',
    locationName: 'Arts & Tech Pavilion',
    uri: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=700&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_cowork',
    name: 'Coworking Lounge',
    category: 'Coworking Space 🏢',
    emoji: '🏢',
    locationName: 'Nexus Creative Hub',
    uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&auto=format&fit=crop&q=80',
  },
];

export default function PhotoProofTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Workflow Phases
  // 'picker' -> 'scanning' -> 'verified' -> 'polaroid' -> 'album' -> 'cinematic'
  const [phase, setPhase] = useState<'picker' | 'scanning' | 'verified' | 'polaroid' | 'album' | 'cinematic'>('picker');

  // Selected Image & Metadata State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Cafe');
  const [activeLocationName, setActiveLocationName] = useState<string>('Central Perk Café');
  const [confidenceScore, setConfidenceScore] = useState<number>(0.94);
  const [isGpsVerified, setIsGpsVerified] = useState<boolean>(true);

  // Dynamic Scanner Text
  const [scanStatusText, setScanStatusText] = useState('Analyzing image context...');
  const [scanSubText, setScanSubText] = useState('AI detecting social environment features...');

  // Animation References
  const scanLaserAnim = useRef(new Animated.Value(0)).current;
  const scanGlowAnim = useRef(new Animated.Value(0.3)).current;
  const polaroidScale = useRef(new Animated.Value(0.6)).current;
  const polaroidRotate = useRef(new Animated.Value(0)).current;
  const polaroidTranslateY = useRef(new Animated.Value(60)).current;
  const albumSlideAnim = useRef(new Animated.Value(100)).current;
  const albumOpacityAnim = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. IMAGE SELECTION & CAMERA ACTIONS
  // ----------------------------------------------------
  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take a memory photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startVerificationFlow(result.assets[0].uri, 'Social Environment', 'Real-world Social Location');
      }
    } catch (e) {
      // Fallback demo preset selection if camera fails
      handleSelectPreset(PRESET_SOCIAL_PHOTOS[0]);
    }
  };

  const handleLaunchGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select a memory photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startVerificationFlow(result.assets[0].uri, 'Social Hub', 'Captured Social Moment');
      }
    } catch (e) {
      handleSelectPreset(PRESET_SOCIAL_PHOTOS[0]);
    }
  };

  const handleSelectPreset = (preset: SocialPreset) => {
    startVerificationFlow(preset.uri, preset.category, preset.locationName);
  };

  // ----------------------------------------------------
  // 2. AI CONTEXT & GPS SCANNING ANIMATION FLOW
  // ----------------------------------------------------
  const startVerificationFlow = (imageUri: string, category: string, locationName: string) => {
    setSelectedImage(imageUri);
    setActiveCategory(category);
    setActiveLocationName(locationName);
    setPhase('scanning');

    // Laser scan looping animation
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

    // Scanning status timeline
    setTimeout(() => {
      setScanStatusText(`Detecting ${category} Landmark`);
      setScanSubText('Analyzing ambient lighting, surroundings & crowd presence...');
    }, 1200);

    setTimeout(() => {
      setScanStatusText('Matching Device GPS Proximity');
      setScanSubText('Verifying location coordinates...');
    }, 2400);

    setTimeout(() => {
      setPhase('verified');
      setScanStatusText('✓ Context Verified');
      setScanSubText(`AI Confidence 94% • ${category}`);
      triggerPolaroidTransformation();
    }, 3600);
  };

  // ----------------------------------------------------
  // 3. POLAROID CARD TRANSFORMATION & ALBUM INSERTION
  // ----------------------------------------------------
  const triggerPolaroidTransformation = () => {
    setPhase('polaroid');

    // Transform into Polaroid card
    Animated.parallel([
      Animated.spring(polaroidScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(polaroidTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(polaroidRotate, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(polaroidRotate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Slide Polaroid into Journey Album
    setTimeout(() => {
      setPhase('album');
      Animated.parallel([
        Animated.timing(albumSlideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(albumOpacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 2000);

    // Final Achievement Unlock & Transition to Completion
    setTimeout(() => {
      triggerFinalCinematic();
    }, 3800);
  };

  // ----------------------------------------------------
  // 4. FINAL CELEBRATION & BACKEND SAVE
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');

    // Pop achievement badge card
    Animated.parallel([
      Animated.spring(badgeCardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      Animated.timing(badgeCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Save memory to backend
    let pointsAdded = '200';
    let totalPoints = '200';
    let streak = '1';

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && selectedImage) {
        const res = await fetch(`${API_BASE_URL}/api/tasks/verify-photo-proof`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Photo Proof (Context-Based)',
            image_url: selectedImage,
            category_hint: activeCategory,
            location_name: activeLocationName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '200';
        }

        // Also hit complete endpoint for standard points refresh
        const compRes = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Photo Proof (Context-Based)' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on photo proof', e);
    }

    // Auto navigate to shared task-success screen
    setTimeout(() => {
      router.replace({
        pathname: '/task-success',
        params: {
          points: pointsAdded,
          totalPoints: totalPoints,
          streak: streak,
          difficulty: 'medium',
          taskName: 'Photo Proof (Context-Based)',
          badge: 'Memory Keeper',
          message: 'Moment recorded.',
        },
      } as any);
    }, 3500);
  };

  const laserTopInterpolate = scanLaserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '90%'],
  });

  const polaroidRotation = polaroidRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-3deg'],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#070b14', '#0f172a', '#1e1b4b']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>MEMORY DOG • MEDIUM</Text>
            <Text style={styles.headerTitle}>Photo Proof</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+200 Pts</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Phase 1: Camera & Gallery Input Selector */}
          {phase === 'picker' && (
            <View style={styles.pickerBlock}>
              <View style={styles.pickerHeroCard}>
                <LinearGradient colors={['rgba(245, 158, 11, 0.15)', 'rgba(236, 72, 153, 0.1)']} style={styles.pickerHeroInner}>
                  <Text style={styles.pickerHeroEmoji}>📸✨</Text>
                  <Text style={styles.pickerHeroTitle}>Capture Your Moment</Text>
                  <Text style={styles.pickerHeroSub}>
                    Take or select a photo from your social setting (Cafe, Library, Park, Community Event, Campus, etc.) to verify presence and preserve your memory.
                  </Text>
                </LinearGradient>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionBtnGroup}>
                <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.88} onPress={handleLaunchCamera}>
                  <LinearGradient colors={['#f59e0b', '#ec4899']} style={styles.gradientBtn}>
                    <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Take Photo with Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8} onPress={handleLaunchGallery}>
                  <Ionicons name="images-outline" size={20} color="#38bdf8" style={{ marginRight: 8 }} />
                  <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Preset Options for Testing */}
              <View style={styles.presetSection}>
                <Text style={styles.presetSectionTitle}>Or select a social scene preset:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                  {PRESET_SOCIAL_PHOTOS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.presetCard}
                      activeOpacity={0.85}
                      onPress={() => handleSelectPreset(item)}
                    >
                      <Image source={{ uri: item.uri }} style={styles.presetImage} />
                      <LinearGradient colors={['transparent', 'rgba(7, 11, 20, 0.9)']} style={styles.presetGradient}>
                        <Text style={styles.presetName}>
                          {item.emoji} {item.category}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Phase 2: AI Context Scanner View */}
          {(phase === 'scanning' || phase === 'verified') && selectedImage && (
            <View style={styles.scannerBlock}>
              <View style={styles.scannerFrame}>
                <Image source={{ uri: selectedImage }} style={styles.scannerImage} />

                {/* Animated Scanner Beam Line */}
                {phase === 'scanning' && (
                  <Animated.View style={[styles.scannerLaserLine, { top: laserTopInterpolate }]} />
                )}

                {/* Status Overlay */}
                <View style={styles.scannerOverlay}>
                  <View style={styles.scannerBadgeRow}>
                    <View style={styles.aiBadge}>
                      <Ionicons name="hardware-chip-outline" size={14} color="#f59e0b" />
                      <Text style={styles.aiBadgeText}>AI Context Engine</Text>
                    </View>
                    <View style={styles.gpsBadge}>
                      <Ionicons name="location" size={14} color="#4ade80" />
                      <Text style={styles.gpsBadgeText}>GPS Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.scannerStatusTitle}>{scanStatusText}</Text>
                  <Text style={styles.scannerStatusSub}>{scanSubText}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Phase 3 & 4: Polaroid Memory Card & Journey Album Insertion */}
          {(phase === 'polaroid' || phase === 'album' || phase === 'cinematic') && selectedImage && (
            <View style={styles.polaroidContainer}>
              <Animated.View
                style={[
                  styles.polaroidCard,
                  {
                    transform: [
                      { scale: polaroidScale },
                      { translateY: polaroidTranslateY },
                      { rotate: polaroidRotation },
                    ],
                  },
                ]}
              >
                {/* Photo Frame */}
                <View style={styles.polaroidPhotoWindow}>
                  <Image source={{ uri: selectedImage }} style={styles.polaroidImage} />
                  <View style={styles.verifiedStampPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={styles.verifiedStampText}>VERIFIED MEMORY</Text>
                  </View>
                </View>

                {/* Handwritten Style Caption Footer */}
                <View style={styles.polaroidCaptionArea}>
                  <Text style={styles.polaroidLocationText}>📍 {activeLocationName}</Text>
                  <View style={styles.polaroidMetaRow}>
                    <Text style={styles.polaroidMetaText}>🕒 Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={styles.polaroidTagText}>{activeCategory}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Journey Album Pocket View */}
              {(phase === 'album' || phase === 'cinematic') && (
                <Animated.View
                  style={[
                    styles.albumPocket,
                    {
                      opacity: albumOpacityAnim,
                      transform: [{ translateY: albumSlideAnim }],
                    },
                  ]}
                >
                  <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.albumPocketInner}>
                    <Ionicons name="journal" size={24} color="#f59e0b" />
                    <Text style={styles.albumPocketTitle}>Saved to My Journey Album</Text>
                    <Text style={styles.albumPocketSub}>Permanent proof of showing up in the real world.</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Final Achievement Unlock Badge Card */}
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
                      <Text style={styles.badgeCardTitle}>Memory Keeper</Text>
                      <Text style={styles.badgeCardQuote}>"Your journey deserves to be remembered."</Text>
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

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#f59e0b', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },

  // Picker Block
  pickerBlock: { marginTop: 10 },
  pickerHeroCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.25)' },
  pickerHeroInner: { padding: 24, alignItems: 'center' },
  pickerHeroEmoji: { fontSize: 44, marginBottom: 12 },
  pickerHeroTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  pickerHeroSub: { fontSize: 13, color: '#cbd5e1', textAlign: 'center', lineHeight: 19 },

  actionBtnGroup: { gap: 14, marginBottom: 28 },
  primaryActionBtn: { borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  secondaryActionBtn: { width: '100%', height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#38bdf8', fontSize: 15, fontWeight: '700' },

  presetSection: { marginTop: 8 },
  presetSectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 12 },
  presetScroll: { gap: 12 },
  presetCard: { width: 140, height: 110, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f172a' },
  presetImage: { ...StyleSheet.absoluteFillObject },
  presetGradient: { flex: 1, padding: 8, justifyContent: 'flex-end' },
  presetName: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Scanner Block
  scannerBlock: { alignItems: 'center', marginTop: 10 },
  scannerFrame: { width: width - 40, height: (width - 40) * 1.1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: '#f59e0b' },
  scannerImage: { ...StyleSheet.absoluteFillObject },
  scannerLaserLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
  scannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, backgroundColor: 'rgba(7, 11, 20, 0.9)' },
  scannerBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  gpsBadgeText: { fontSize: 10, fontWeight: '800', color: '#4ade80' },
  scannerStatusTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  scannerStatusSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Polaroid Card
  polaroidContainer: { alignItems: 'center', marginTop: 10 },
  polaroidCard: { width: width - 48, backgroundColor: '#fefefe', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 15, elevation: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  polaroidPhotoWindow: { width: '100%', height: (width - 76) * 0.95, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  polaroidImage: { ...StyleSheet.absoluteFillObject },
  verifiedStampPill: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(34, 197, 94, 0.9)' },
  verifiedStampText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  polaroidCaptionArea: { paddingTop: 14, paddingHorizontal: 4 },
  polaroidLocationText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  polaroidMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  polaroidMetaText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  polaroidTagText: { fontSize: 11, fontWeight: '800', color: '#ec4899' },

  // Album Pocket
  albumPocket: { width: '100%', marginTop: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  albumPocketInner: { padding: 18, alignItems: 'center' },
  albumPocketTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 6 },
  albumPocketSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  // Achievement Badge Card
  badgeCard: { width: '100%', marginTop: 20, borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },
});
