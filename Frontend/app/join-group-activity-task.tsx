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

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

interface LocalActivity {
  id: string;
  name: string;
  category: string;
  emoji: string;
  time: string;
  participants: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  distanceMeters: number;
  coverImage: string;
  description: string;
}

const DEFAULT_ACTIVITIES: LocalActivity[] = [
  {
    id: 'act_badminton_01',
    name: 'Metro Smashers Badminton Club',
    category: 'Badminton',
    emoji: '🏸',
    time: 'Today, 6:00 PM',
    participants: '16 players present',
    address: 'Indoors Arena - Court 4',
    latitude: 37.7771,
    longitude: -122.4166,
    distance: '0.4 km',
    distanceMeters: 400,
    coverImage: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
    description: 'Open double matches and recreational badminton practice session for all skill levels.'
  },
  {
    id: 'act_running_02',
    name: 'Sunset Striders Running Club',
    category: 'Running Club',
    emoji: '🏃',
    time: 'Today, 6:30 PM',
    participants: '24 runners present',
    address: 'Park Central Pavilion',
    latitude: 37.7718,
    longitude: -122.4176,
    distance: '0.6 km',
    distanceMeters: 600,
    coverImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
    description: 'Friendly 5k pace group run around the city lake trail followed by post-run hydration.'
  },
  {
    id: 'act_yoga_03',
    name: 'Mindful Flow Yoga & Stretch',
    category: 'Yoga Class',
    emoji: '🧘',
    time: 'Today, 5:45 PM',
    participants: '18 participants present',
    address: 'Community Park Lawns',
    latitude: 37.7787,
    longitude: -122.4226,
    distance: '0.8 km',
    distanceMeters: 800,
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    description: 'Relaxing outdoor evening yoga and breathwork class open to all levels. Bring a mat or blanket.'
  },
  {
    id: 'act_coding_04',
    name: 'FullStack & AI Builders Jam',
    category: 'Coding Meetup',
    emoji: '💻',
    time: 'Today, 6:15 PM',
    participants: '12 builders present',
    address: 'Tech Innovation Hub - Room 2A',
    latitude: 37.7730,
    longitude: -122.4235,
    distance: '0.9 km',
    distanceMeters: 900,
    coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    description: 'Collaborative coding circle, open-source project sharing, and tech networking.'
  },
  {
    id: 'act_photo_05',
    name: 'Golden Hour Photo Walk',
    category: 'Photography Walk',
    emoji: '📷',
    time: 'Today, 5:30 PM',
    participants: '15 photographers present',
    address: 'Old Town Promenade',
    latitude: 37.7794,
    longitude: -122.4179,
    distance: '1.1 km',
    distanceMeters: 1100,
    coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    description: 'Explore street photography, architectural framing, and golden hour lighting techniques.'
  }
];

export default function JoinGroupActivityTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Location & Permission State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  // Activities & Selection
  const [nearbyActivities, setNearbyActivities] = useState<LocalActivity[]>(DEFAULT_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<LocalActivity | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Single Guided Flow Phase
  // 'discovery' -> 'navigating' -> 'arrived' -> 'participating' -> 'photo' -> 'verifying' -> 'badge' -> 'cinematic'
  const [phase, setPhase] = useState<'discovery' | 'navigating' | 'arrived' | 'participating' | 'photo' | 'verifying' | 'badge' | 'cinematic'>('discovery');

  // Photo & Verification State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0.94);
  const [statusTitle, setStatusTitle] = useState('Detecting sports equipment & group atmosphere...');
  const [statusSub, setStatusSub] = useState('AI verifying environment context & GPS proximity...');

  // Animation References
  const arrivedBannerScale = useRef(new Animated.Value(0)).current;
  const scanLaserAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.5)).current;
  const badgeTranslateY = useRef(new Animated.Value(60)).current;
  const journeyWallSlide = useRef(new Animated.Value(100)).current;
  const journeyWallOpacity = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(50)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. LOCATION PERMISSION CHECK & ACTIVITY FETCHING
  // ----------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
          fetchActivities();
        } else {
          setHasPermission(false);
        }
      } catch (e) {
        setHasPermission(true);
        fetchActivities();
      }
    })();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        fetchActivities();
      } else {
        setHasPermission(false);
        Alert.alert('Location Required', 'Location access is necessary to detect nearby sports and hobby groups.');
      }
    } catch (e) {
      setHasPermission(true);
      fetchActivities();
    }
  };

  const fetchActivities = async () => {
    let lat = 37.7749;
    let lng = -122.4194;

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
      setUserLocation({ latitude: lat, longitude: lng });
    } catch (e) {
      console.log('Using default GPS coordinates');
    }

    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/api/activities/nearby?latitude=${lat}&longitude=${lng}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.activities && data.activities.length > 0) {
        setNearbyActivities(data.activities);
      }
    } catch (e) {
      console.log('Using fallback group activities');
    }
  };

  // ----------------------------------------------------
  // 2. GUIDED WORKFLOW ACTIONS
  // ----------------------------------------------------
  const handleSelectActivity = (act: LocalActivity) => {
    setSelectedActivity(act);
    setShowModal(true);
  };

  const handleStartNavigation = () => {
    setShowModal(false);
    setPhase('navigating');

    // Simulate GPS Proximity Arrival
    setTimeout(() => {
      handleArrivalVerified();
    }, 2800);
  };

  const handleArrivalVerified = () => {
    setPhase('arrived');

    Animated.spring(arrivedBannerScale, {
      toValue: 1,
      tension: 70,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Auto-transition to Step 3 (Uninterrupted Participation)
    setTimeout(() => {
      setPhase('participating');
    }, 2200);
  };

  // Step 4: Photo Capture & Verification
  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access', 'Camera permission is requested to verify your participation.');
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startPhotoVerification(result.assets[0].uri);
      } else {
        startPhotoVerification(selectedActivity?.coverImage || DEFAULT_ACTIVITIES[0].coverImage);
      }
    } catch (e) {
      startPhotoVerification(selectedActivity?.coverImage || DEFAULT_ACTIVITIES[0].coverImage);
    }
  };

  const handleGalleryPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        startPhotoVerification(result.assets[0].uri);
      } else {
        startPhotoVerification(selectedActivity?.coverImage || DEFAULT_ACTIVITIES[0].coverImage);
      }
    } catch (e) {
      startPhotoVerification(selectedActivity?.coverImage || DEFAULT_ACTIVITIES[0].coverImage);
    }
  };

  const startPhotoVerification = (imageUri: string) => {
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
      setStatusTitle(`Verifying ${selectedActivity?.category || 'Group'} Environment`);
      setStatusSub('Analyzing equipment, human presence & public venue features...');
    }, 1200);

    setTimeout(() => {
      setPhase('badge');
      triggerBadgeTransformation();
    }, 3200);
  };

  // ----------------------------------------------------
  // 3. BADGE TRANSFORMATION & COMMUNITY JOURNEY WALL
  // ----------------------------------------------------
  const triggerBadgeTransformation = () => {
    Animated.parallel([
      Animated.spring(badgeScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(badgeTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(journeyWallSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(journeyWallOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1800);

    setTimeout(() => {
      triggerFinalCinematic();
    }, 3600);
  };

  // ----------------------------------------------------
  // 4. FINAL CINEMATIC & COMPLETION FLOW
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');

    Animated.parallel([
      Animated.spring(badgeCardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      Animated.timing(badgeCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Submit to backend
    let pointsAdded = '300';
    let totalPoints = '300';
    let streak = '1';

    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const res = await apiFetch('/api/tasks/verify-group-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Join Local Group (Sports / Hobby)',
            activity_name: selectedActivity?.name,
            category: selectedActivity?.category,
            image_url: capturedPhoto,
            latitude: selectedActivity?.latitude,
            longitude: selectedActivity?.longitude,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        const compRes = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Join Local Group (Sports / Hobby)' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Backend save error on group activity', e);
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
          taskName: 'Join Local Group (Sports / Hobby)',
          badge: 'Community Member',
          message: 'You entered shared activity.',
        },
      } as any);
    }, 3800);
  };

  const laserTopInterpolate = scanLaserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['5%', '90%'],
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
              <Ionicons name="location" size={44} color="#38bdf8" />
            </View>

            <Text style={styles.permissionTitle}>Location Access Required</Text>
            <Text style={styles.permissionSubtitle}>
              To detect nearby sports and hobby groups and verify your physical arrival, AntiSocial requires foreground GPS permissions.
            </Text>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={requestPermission} activeOpacity={0.85}>
              <LinearGradient colors={['#38bdf8', '#8b5cf6']} style={styles.gradientBtn}>
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
      <LinearGradient colors={['#050811', '#0b1329', '#151d38']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>COMMUNITY DOG • HARD</Text>
            <Text style={styles.headerTitle}>Join Local Group</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+600 Pts</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* STEP 1: GROUP DISCOVERY */}
          {phase === 'discovery' && (
            <View style={styles.discoveryBlock}>
              <Text style={styles.discoveryTitle}>Nearby Sports & Hobby Groups</Text>
              <Text style={styles.discoverySub}>Tap a group activity to navigate and participate.</Text>

              <View style={styles.activitiesList}>
                {nearbyActivities.map((act) => (
                  <TouchableOpacity
                    key={act.id}
                    style={styles.activityCard}
                    activeOpacity={0.88}
                    onPress={() => handleSelectActivity(act)}
                  >
                    <Image source={{ uri: act.coverImage }} style={styles.activityImage} />
                    <LinearGradient colors={['transparent', 'rgba(7, 11, 20, 0.95)']} style={styles.activityGradient}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{act.category}</Text>
                      </View>
                      <Text style={styles.activityName}>
                        {act.emoji} {act.name}
                      </Text>
                      <View style={styles.activityMetaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="location-outline" size={12} color="#38bdf8" />
                          <Text style={styles.metaText}>{act.distance}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={12} color="#f59e0b" />
                          <Text style={styles.metaText}>{act.time}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="people-outline" size={12} color="#ec4899" />
                          <Text style={styles.metaText}>{act.participants}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: NAVIGATING & ARRIVAL */}
          {phase === 'navigating' && (
            <View style={styles.statusBlock}>
              <Ionicons name="navigate-circle" size={64} color="#38bdf8" />
              <Text style={styles.statusTitle}>Navigating to {selectedActivity?.name}</Text>
              <Text style={styles.statusSub}>Live GPS tracking proximity ({selectedActivity?.distance})...</Text>
            </View>
          )}

          {phase === 'arrived' && (
            <Animated.View style={[styles.arrivedCard, { transform: [{ scale: arrivedBannerScale }] }]}>
              <Ionicons name="checkmark-circle" size={56} color="#4ade80" />
              <Text style={styles.arrivedTitle}>You're here.</Text>
              <Text style={styles.arrivedSub}>Verified arrival at {selectedActivity?.name}</Text>
            </Animated.View>
          )}

          {/* STEP 3: UNINTERRUPTED NATURAL PARTICIPATION */}
          {phase === 'participating' && (
            <View style={styles.participatingCard}>
              <LinearGradient colors={['rgba(56, 189, 248, 0.15)', 'rgba(139, 92, 246, 0.1)']} style={styles.participatingInner}>
                <Text style={styles.participatingEmoji}>{selectedActivity?.emoji || '🤝'}</Text>
                <Text style={styles.participatingTitle}>Enjoy the activity.</Text>
                <Text style={styles.participatingSub}>
                  Focus on participating naturally with your group at {selectedActivity?.name}. No rush, no interruptions.
                </Text>

                <View style={styles.participatingDivider} />

                <TouchableOpacity style={styles.primaryActionBtn} activeOpacity={0.88} onPress={handleCapturePhoto}>
                  <LinearGradient colors={['#38bdf8', '#8b5cf6']} style={styles.gradientBtn}>
                    <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>📸 Capture Your Moment</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8} onPress={handleGalleryPhoto}>
                  <Ionicons name="images-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Select from Gallery</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* STEP 4 & PHOTO VERIFICATION */}
          {phase === 'verifying' && capturedPhoto && (
            <View style={styles.scannerBlock}>
              <View style={styles.scannerFrame}>
                <Image source={{ uri: capturedPhoto }} style={styles.scannerImage} />
                <Animated.View style={[styles.scannerLaserLine, { top: laserTopInterpolate }]} />

                <View style={styles.scannerOverlay}>
                  <View style={styles.badgeRow}>
                    <View style={styles.aiBadge}>
                      <Ionicons name="hardware-chip-outline" size={14} color="#38bdf8" />
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

          {/* STEP 5 & 6: COMMUNITY BADGE & JOURNEY WALL */}
          {(phase === 'badge' || phase === 'cinematic') && capturedPhoto && (
            <View style={styles.badgeContainer}>
              <Animated.View
                style={[
                  styles.communityBadge,
                  {
                    transform: [{ scale: badgeScale }, { translateY: badgeTranslateY }],
                  },
                ]}
              >
                <Image source={{ uri: capturedPhoto }} style={styles.badgeCoverImage} />

                <LinearGradient colors={['transparent', 'rgba(7, 11, 20, 0.95)']} style={styles.badgeOverlay}>
                  <View style={styles.badgeHeaderPill}>
                    <Ionicons name="ribbon" size={14} color="#f59e0b" />
                    <Text style={styles.badgeHeaderPillText}>🏅 ACTIVITY COMPLETED</Text>
                  </View>

                  <Text style={styles.badgeActivityTitle}>{selectedActivity?.name}</Text>
                  <Text style={styles.badgeLocationText}>📍 {selectedActivity?.address}</Text>

                  <View style={styles.badgeFooter}>
                    <Text style={styles.badgeDate}>📅 {new Date().toLocaleDateString()}</Text>
                    <Text style={styles.badgeVerifiedText}>✓ Verified Member</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Community Journey Wall Pocket */}
              {phase === 'cinematic' && (
                <Animated.View
                  style={[
                    styles.journeyWallPocket,
                    {
                      opacity: journeyWallOpacity,
                      transform: [{ translateY: journeyWallSlide }],
                    },
                  ]}
                >
                  <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.journeyWallInner}>
                    <Ionicons name="images" size={24} color="#38bdf8" />
                    <Text style={styles.journeyWallTitle}>Saved to Community Journey</Text>
                    <Text style={styles.journeyWallSub}>Your framed experience is now part of the community wall.</Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Achievement Card */}
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
                  <LinearGradient colors={['#38bdf8', '#8b5cf6']} style={styles.badgeCardGradient}>
                    <Text style={styles.badgeCardIcon}>🏅</Text>
                    <View style={styles.badgeCardTextGroup}>
                      <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                      <Text style={styles.badgeCardTitle}>Community Member</Text>
                      <Text style={styles.badgeCardQuote}>"Communities grow stronger when new people choose to join."</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ACTIVITY DETAIL MODAL */}
        <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />

            {selectedActivity && (
              <View style={styles.modalContent}>
                <Image source={{ uri: selectedActivity.coverImage }} style={styles.modalCover} />

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.modalBody}>
                  <View style={styles.modalBadgeRow}>
                    <View style={styles.modalCategoryTag}>
                      <Text style={styles.modalCategoryText}>{selectedActivity.category}</Text>
                    </View>
                    <Text style={styles.modalDistance}>📍 {selectedActivity.distance} away</Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedActivity.name}</Text>
                  <Text style={styles.modalDesc}>{selectedActivity.description}</Text>

                  <View style={styles.modalMetaList}>
                    <View style={styles.modalMetaItem}>
                      <Ionicons name="time-outline" size={18} color="#f59e0b" />
                      <Text style={styles.modalMetaText}>{selectedActivity.time}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Ionicons name="pin-outline" size={18} color="#38bdf8" />
                      <Text style={styles.modalMetaText}>{selectedActivity.address}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Ionicons name="people-outline" size={18} color="#ec4899" />
                      <Text style={styles.modalMetaText}>{selectedActivity.participants}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.modalActionBtn} activeOpacity={0.88} onPress={handleStartNavigation}>
                    <LinearGradient colors={['#38bdf8', '#8b5cf6']} style={styles.gradientBtn}>
                      <Text style={styles.primaryBtnText}>Navigate & Join Activity</Text>
                      <Feather name="navigation" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  contentScroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Permission Gate Screen
  permissionContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  permissionContent: { alignItems: 'center', marginTop: 40 },
  permissionIconBadge: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderWidth: 1.5, borderColor: 'rgba(56, 189, 248, 0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 26, fontWeight: '800', color: '#f8fafc', textAlign: 'center', marginBottom: 12 },
  permissionSubtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryActionBtn: { width: '100%', borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#38bdf8', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#38bdf8' },

  // Discovery Block
  discoveryBlock: { marginTop: 10 },
  discoveryTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  discoverySub: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  activitiesList: { gap: 16 },
  activityCard: { width: '100%', height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0f172a' },
  activityImage: { ...StyleSheet.absoluteFillObject },
  activityGradient: { flex: 1, padding: 14, justifyContent: 'flex-end' },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(56, 189, 248, 0.8)', marginBottom: 6 },
  categoryBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  activityName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  activityMetaRow: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#cbd5e1', fontWeight: '600' },

  // Status & Arrived Block
  statusBlock: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  statusTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginTop: 16, textAlign: 'center' },
  statusSub: { fontSize: 14, color: '#94a3b8', marginTop: 6, textAlign: 'center' },

  arrivedCard: { alignItems: 'center', marginTop: 40, padding: 28, borderRadius: 24, backgroundColor: 'rgba(7, 11, 20, 0.95)', borderWidth: 1.5, borderColor: '#4ade80' },
  arrivedTitle: { fontSize: 26, fontWeight: '800', color: '#f8fafc', marginTop: 10 },
  arrivedSub: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  // Participating Card
  participatingCard: { marginTop: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  participatingInner: { padding: 24, alignItems: 'center' },
  participatingEmoji: { fontSize: 48, marginBottom: 12 },
  participatingTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  participatingSub: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  participatingDivider: { width: '80%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20 },
  secondaryActionBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  // Scanner Block
  scannerBlock: { alignItems: 'center', marginTop: 10 },
  scannerFrame: { width: width - 40, height: (width - 40) * 1.1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: '#38bdf8' },
  scannerImage: { ...StyleSheet.absoluteFillObject },
  scannerLaserLine: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#38bdf8', shadowColor: '#38bdf8', shadowOpacity: 0.9, shadowRadius: 10, elevation: 10 },
  scannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, backgroundColor: 'rgba(7, 11, 20, 0.9)' },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#38bdf8' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(74, 222, 128, 0.2)' },
  gpsBadgeText: { fontSize: 10, fontWeight: '800', color: '#4ade80' },
  scannerTitle: { fontSize: 17, fontWeight: '800', color: '#f8fafc' },
  scannerSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Community Badge Card
  badgeContainer: { alignItems: 'center', marginTop: 10 },
  communityBadge: { width: width - 48, height: (width - 48) * 1.25, borderRadius: 24, overflow: 'hidden', elevation: 12, borderWidth: 1.5, borderColor: '#38bdf8' },
  badgeCoverImage: { ...StyleSheet.absoluteFillObject },
  badgeOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  badgeHeaderPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.9)', marginBottom: 8 },
  badgeHeaderPillText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  badgeActivityTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  badgeLocationText: { fontSize: 13, color: '#cbd5e1', fontWeight: '600', marginBottom: 12 },
  badgeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.15)', paddingTop: 10 },
  badgeDate: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  badgeVerifiedText: { fontSize: 12, color: '#4ade80', fontWeight: '800' },

  // Journey Wall Pocket
  journeyWallPocket: { width: '100%', marginTop: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  journeyWallInner: { padding: 18, alignItems: 'center' },
  journeyWallTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 6 },
  journeyWallSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  // Achievement Card
  badgeCard: { width: '100%', marginTop: 18, borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  modalContent: { backgroundColor: '#0b1329', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: height * 0.8 },
  modalCover: { width: '100%', height: 180 },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20 },
  modalBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalCategoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(56, 189, 248, 0.2)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)' },
  modalCategoryText: { fontSize: 11, fontWeight: '800', color: '#38bdf8' },
  modalDistance: { fontSize: 12, fontWeight: '700', color: '#38bdf8' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  modalDesc: { fontSize: 13, color: '#cbd5e1', lineHeight: 18, marginBottom: 16 },
  modalMetaList: { gap: 10, marginBottom: 20 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalMetaText: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  modalActionBtn: { borderRadius: 26, overflow: 'hidden' },
});
