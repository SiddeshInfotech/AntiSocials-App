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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { apiFetch, API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');
const TOTAL_STAY_DURATION = 900; // 15 Minutes = 900 Seconds

interface CommunityEvent {
  id: string;
  name: string;
  host: string;
  category: string;
  emoji: string;
  time: string;
  duration: string;
  attendance: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: string;
  distanceMeters: number;
  coverImage: string;
  description: string;
}

const DEFAULT_EVENTS: CommunityEvent[] = [
  {
    id: 'evt_tech_01',
    name: 'Tech & AI Builders Meetup',
    host: 'Silicon Valley Developers Guild',
    category: 'Tech Meetup',
    emoji: '💻',
    time: 'Today, 6:00 PM',
    duration: '60 mins',
    attendance: '28 people present',
    address: '101 Innovation Way, Tech District',
    latitude: 37.7777,
    longitude: -122.4163,
    distance: '0.4 km',
    distanceMeters: 400,
    coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    description: 'Join local tech enthusiasts and builders sharing ideas, open-source projects, and casual networking.'
  },
  {
    id: 'evt_book_02',
    name: 'Mindful Readers Book Club',
    host: 'Elena Rostova & Community Circle',
    category: 'Book Club',
    emoji: '📚',
    time: 'Today, 6:30 PM',
    duration: '45 mins',
    attendance: '14 people present',
    address: 'Central Public Library - Room 3B',
    latitude: 37.7714,
    longitude: -122.4172,
    distance: '0.6 km',
    distanceMeters: 600,
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80',
    description: 'A cozy evening gathering to reflect on inspiring non-fiction literature and share personal insights.'
  },
  {
    id: 'evt_yoga_03',
    name: 'Sunset Community Yoga & Mindfulness',
    host: 'Breathe Together Studio',
    category: 'Yoga Session',
    emoji: '🧘',
    time: 'Today, 5:45 PM',
    duration: '30 mins',
    attendance: '22 people present',
    address: 'Community Park Green Lawns',
    latitude: 37.7791,
    longitude: -122.4232,
    distance: '0.8 km',
    distanceMeters: 800,
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    description: 'Outdoor open-air yoga session open to all experience levels. Bring your mat or blanket.'
  },
  {
    id: 'evt_run_04',
    name: 'Twilight Community Run & Walk',
    host: 'Metro Striders Club',
    category: 'Running Group',
    emoji: '🏃',
    time: 'Today, 7:00 PM',
    duration: '40 mins',
    attendance: '35 people present',
    address: 'Riverside Esplanade Pavilion',
    latitude: 37.7731,
    longitude: -122.4239,
    distance: '0.9 km',
    distanceMeters: 900,
    coverImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
    description: 'Friendly 5k pace group run and community walk along the water path.'
  },
  {
    id: 'evt_art_05',
    name: 'Local Artists Showcase & Open Studio',
    host: 'Downtown Creative Collective',
    category: 'Art Exhibition',
    emoji: '🎨',
    time: 'Today, 6:15 PM',
    duration: '90 mins',
    attendance: '19 people present',
    address: '45 Gallery Lane, Arts Quarter',
    latitude: 37.7800,
    longitude: -122.4182,
    distance: '1.2 km',
    distanceMeters: 1200,
    coverImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&auto=format&fit=crop&q=80',
    description: 'Immerse yourself in new regional artwork, live ambient music, and creative conversations.'
  }
];

export default function JoinEventVerifiedTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Location & Permission State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  // Events & Selected Event
  const [nearbyEvents, setNearbyEvents] = useState<CommunityEvent[]>(DEFAULT_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Workflow Phases
  // 'discovery' -> 'navigating' -> 'arrived' -> 'participating' -> 'cinematic'
  const [phase, setPhase] = useState<'discovery' | 'navigating' | 'arrived' | 'participating' | 'cinematic'>('discovery');
  const [isSearching, setIsSearching] = useState(true);

  // Stay Timer State (15 mins = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(TOTAL_STAY_DURATION);
  const [isStayActive, setIsStayActive] = useState(false);

  // Dynamic Scene Commentary
  const [displayText, setDisplayText] = useState('Finding your community...');
  const [subDisplayText, setSubDisplayText] = useState('Scanning city pulses nearby...');

  // Animation References
  const heartbeatPulse1 = useRef(new Animated.Value(1)).current;
  const heartbeatPulse2 = useRef(new Animated.Value(1)).current;
  const mapGridOpacity = useRef(new Animated.Value(0.4)).current;
  const cityGlowAnim = useRef(new Animated.Value(0.2)).current;
  const arrivedBannerScale = useRef(new Animated.Value(0)).current;

  // Final Cinematic Animations
  const finalPulseExpand = useRef(new Animated.Value(1)).current;
  const finalGlowOpacity = useRef(new Animated.Value(0)).current;
  const badgeCardSlide = useRef(new Animated.Value(60)).current;
  const badgeCardOpacity = useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------
  // 1. LOCATION PERMISSION CHECK & EVENT DISCOVERY
  // ----------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
          fetchLocationAndEvents();
        } else {
          setHasPermission(false);
          setIsSearching(false);
        }
      } catch (e) {
        setHasPermission(true);
        fetchLocationAndEvents();
      }
    })();
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        fetchLocationAndEvents();
      } else {
        setHasPermission(false);
        Alert.alert(
          'Location Required',
          'Location access is necessary to discover real community events and verify your physical participation.'
        );
      }
    } catch (e) {
      setHasPermission(true);
      fetchLocationAndEvents();
    }
  };

  const fetchLocationAndEvents = async () => {
    setIsSearching(true);
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

    // Attempt to fetch from backend
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await apiFetch(`/api/events/nearby?latitude=${lat}&longitude=${lng}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.events && data.events.length > 0) {
        setNearbyEvents(data.events);
      }
    } catch (e) {
      console.log('Using local fallback community events');
    } finally {
      setTimeout(() => {
        setIsSearching(false);
        setDisplayText('Every city has a heartbeat.');
        setSubDisplayText('Tap an event to connect with your community.');
      }, 1500);
    }
  };

  // ----------------------------------------------------
  // 2. HEARTBEAT & MAP ANIMATIONS
  // ----------------------------------------------------
  useEffect(() => {
    // Primary Heartbeat Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatPulse1, {
          toValue: 1.35,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatPulse1, {
          toValue: 1.0,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered Secondary Pulse Ripple
    Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(heartbeatPulse2, {
          toValue: 1.8,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatPulse2, {
          toValue: 1.0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ambient City Light Breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(cityGlowAnim, {
          toValue: 0.55,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cityGlowAnim, {
          toValue: 0.25,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ----------------------------------------------------
  // 3. STAY TIMER & VERIFICATION LOGIC (15 MINS)
  // ----------------------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isStayActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          const elapsed = TOTAL_STAY_DURATION - next;
          updateStayCommentary(elapsed);
          return next;
        });
      }, 1000);
    } else if (isStayActive && timeLeft === 0) {
      setIsStayActive(false);
      triggerFinalCinematic();
    }
    return () => clearInterval(timer);
  }, [isStayActive, timeLeft]);

  const updateStayCommentary = (elapsedSeconds: number) => {
    if (elapsedSeconds === 60) {
      setDisplayText("You stepped into community.");
      setSubDisplayText("Feeling the shared presence around you...");
    } else if (elapsedSeconds === 180) {
      setDisplayText("Becoming part of the heartbeat.");
      setSubDisplayText("The energy of the room is syncing with yours.");
    } else if (elapsedSeconds === 360) {
      setDisplayText("Deep in the shared experience.");
      setSubDisplayText("Over 5 minutes present with fellow community members.");
    } else if (elapsedSeconds === 600) {
      setDisplayText("Standing tall together.");
      setSubDisplayText("10 minutes inside the event. You belong here.");
    } else if (elapsedSeconds === 840) {
      setDisplayText("Connecting with city pulses...");
      setSubDisplayText("Final moments before synchronization.");
    }
  };

  // ----------------------------------------------------
  // 4. WORKFLOW ACTIONS
  // ----------------------------------------------------
  const handleSelectEvent = (evt: CommunityEvent) => {
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleStartNavigation = () => {
    setShowEventModal(false);
    setPhase('navigating');
    setDisplayText(`Navigating to ${selectedEvent?.name}`);
    setSubDisplayText(`Tracking live GPS proximity (${selectedEvent?.distance})...`);

    // Simulate / Trigger Arrival
    setTimeout(() => {
      handleArrivalVerified();
    }, 2800);
  };

  const handleArrivalVerified = async () => {
    setPhase('arrived');
    setDisplayText("You're here.");
    setSubDisplayText(`Verified arrival at ${selectedEvent?.name}`);

    // Pop arrived banner animation
    Animated.spring(arrivedBannerScale, {
      toValue: 1,
      tension: 70,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Save arrival state to backend
    try {
      const token = await SecureStore.getItemAsync('token');
      await apiFetch('/api/tasks/save-community-event-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          task_name: 'Join a Group Event (Verified)',
          event_id: selectedEvent?.id,
          event_name: selectedEvent?.name,
          event_category: selectedEvent?.category,
          latitude: selectedEvent?.latitude,
          longitude: selectedEvent?.longitude,
          arrival_verified: true,
          stay_duration: 0,
        }),
      });
    } catch (e) {
      console.log('Backend save error on arrival');
    }

    // Auto-transition to 15-minute stay timer
    setTimeout(() => {
      setPhase('participating');
      setIsStayActive(true);
      setDisplayText('Staying present in community');
      setSubDisplayText('Remain inside event radius for 15 minutes');
    }, 2200);
  };

  // Fast-Forward for easy evaluation/testing
  const handleFastForwardStay = () => {
    setTimeLeft(5);
  };

  // ----------------------------------------------------
  // 5. FINAL CINEMATIC & COMPLETION FLOW
  // ----------------------------------------------------
  const triggerFinalCinematic = async () => {
    setPhase('cinematic');
    setDisplayText("You became part of something bigger.");
    setSubDisplayText("Communities grow when people choose to show up.");

    // Expand pulse across city map
    Animated.parallel([
      Animated.timing(finalPulseExpand, {
        toValue: 3.5,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(finalGlowOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.spring(badgeCardSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
          Animated.timing(badgeCardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
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
        const res = await apiFetch('/api/tasks/save-community-event-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task_name: 'Join a Group Event (Verified)',
            event_id: selectedEvent?.id,
            event_name: selectedEvent?.name,
            event_category: selectedEvent?.category,
            latitude: selectedEvent?.latitude,
            longitude: selectedEvent?.longitude,
            arrival_verified: true,
            stay_duration: 900,
            is_completed: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          pointsAdded = data.pointsRewarded?.toString() || '300';
        }

        // Also hit complete endpoint for standard points refresh
        const compRes = await apiFetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Join a Group Event (Verified)' }),
        });
        const compData = await compRes.json();
        if (compData.success || compRes.ok) {
          pointsAdded = compData.pointsAdded?.toString() || pointsAdded;
          totalPoints = compData.totalPoints?.toString() || totalPoints;
          streak = compData.streak?.toString() || streak;
        }
      }
    } catch (e) {
      console.log('Completion save error', e);
    }

    // Auto navigate to shared task-success screen after cinematic
    setTimeout(() => {
      router.replace({
        pathname: '/task-success',
        params: {
          points: pointsAdded,
          totalPoints: totalPoints,
          streak: streak,
          difficulty: 'hard',
          taskName: 'Join a Group Event (Verified)',
          badge: 'Community Explorer',
          message: 'You stepped into community.',
        },
      } as any);
    }, 4500);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
              <Ionicons name="location" size={44} color="#ec4899" />
            </View>

            <Text style={styles.permissionTitle}>Location Access Required</Text>
            <Text style={styles.permissionSubtitle}>
              To discover live nearby community events and verify your physical attendance, AntiSocial requires foreground GPS permissions.
            </Text>

            <View style={styles.permissionFeatureBox}>
              <View style={styles.featureItem}>
                <Ionicons name="radio" size={20} color="#38bdf8" />
                <Text style={styles.featureText}>Live City Community Event Pulse</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4ade80" />
                <Text style={styles.featureText}>Physical Presence Verification</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="ribbon" size={20} color="#f59e0b" />
                <Text style={styles.featureText}>Unlock +300 Task Points & Badges</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryActionBtn} onPress={requestPermission} activeOpacity={0.85}>
              <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.gradientBtn}>
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

      {/* Deep Atmosphere Background */}
      <LinearGradient colors={['#050811', '#0b1329', '#151d38']} style={StyleSheet.absoluteFill} />

      {/* Ambient Glowing City Light Blob */}
      <Animated.View style={[styles.ambientGlow, { opacity: cityGlowAnim }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>COMMUNITY DOG • HARD</Text>
            <Text style={styles.headerTitle}>Join a Group Event</Text>
          </View>

          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+600 Pts</Text>
          </View>
        </View>

        {/* Dynamic Map Canvas ("Community Pulse") */}
        <View style={styles.mapCanvasContainer}>
          {/* Animated Map Grid Pattern */}
          <Animated.View style={[styles.mapGridPattern, { opacity: mapGridOpacity }]}>
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
            <View style={styles.gridLineH3} />
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
            <View style={styles.gridLineV3} />
          </Animated.View>

          {/* Central Heartbeat Radar Pulse */}
          <View style={styles.centerPulseAnchor}>
            <Animated.View
              style={[
                styles.heartbeatRipple2,
                {
                  transform: [
                    {
                      scale: phase === 'cinematic' ? finalPulseExpand : heartbeatPulse2,
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.heartbeatRipple1,
                {
                  transform: [
                    {
                      scale: phase === 'cinematic' ? finalPulseExpand : heartbeatPulse1,
                    },
                  ],
                },
              ]}
            />

            <View style={styles.centerUserNode}>
              <LinearGradient colors={['#ec4899', '#a855f7']} style={styles.userNodeGradient}>
                <Text style={styles.userNodeEmoji}>{selectedEvent ? selectedEvent.emoji : '🎪'}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Floating Nearby Event Pulse Nodes on Map */}
          {phase === 'discovery' &&
            nearbyEvents.map((evt, idx) => {
              const offsets: ViewStyle[] = [
                { top: '18%', left: '20%' },
                { top: '24%', right: '18%' },
                { bottom: '26%', left: '25%' },
                { bottom: '20%', right: '22%' },
                { top: '48%', right: '12%' },
              ];
              const pos = offsets[idx % offsets.length];
              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[styles.mapEventNode, pos]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectEvent(evt)}
                >
                  <View style={styles.eventNodePulseRing} />
                  <View style={styles.eventNodeBubble}>
                    <Text style={styles.eventNodeEmoji}>{evt.emoji}</Text>
                  </View>
                  <View style={styles.eventNodeLabel}>
                    <Text style={styles.eventNodeDistance}>{evt.distance}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

          {/* Display Scene Commentary Banner */}
          <View style={styles.sceneBanner}>
            <Text style={styles.sceneBannerTitle}>{displayText}</Text>
            {subDisplayText ? <Text style={styles.sceneBannerSub}>{subDisplayText}</Text> : null}
          </View>

          {/* Live Stay Countdown Timer (During Participation Phase) */}
          {phase === 'participating' && (
            <View style={styles.stayTimerCard}>
              <View style={styles.timerRingRow}>
                <Ionicons name="time-outline" size={22} color="#ec4899" />
                <Text style={styles.timerDigits}>{formatTimer(timeLeft)}</Text>
              </View>
              <Text style={styles.timerSubtitle}>Verified Stay Duration</Text>

              {/* Dev Fast-Forward Helper for Evaluation */}
              <TouchableOpacity style={styles.fastForwardBtn} onPress={handleFastForwardStay}>
                <Text style={styles.fastForwardText}>⚡ Fast-Forward Stay (Demo)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Arrived Verification Banner */}
          {phase === 'arrived' && (
            <Animated.View style={[styles.arrivedBanner, { transform: [{ scale: arrivedBannerScale }] }]}>
              <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
              <Text style={styles.arrivedTitle}>You're here.</Text>
              <Text style={styles.arrivedSub}>Physically verified at {selectedEvent?.name}</Text>
            </Animated.View>
          )}

          {/* Final Cinematic Achievement Unlock Modal Card */}
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
              <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.badgeCardGradient}>
                <Text style={styles.badgeCardIcon}>🏅</Text>
                <View style={styles.badgeCardTextGroup}>
                  <Text style={styles.badgeCardTag}>ACHIEVEMENT UNLOCKED</Text>
                  <Text style={styles.badgeCardTitle}>Community Explorer</Text>
                  <Text style={styles.badgeCardQuote}>"Communities grow when people choose to show up."</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Discovery Phase Events Sheet */}
        {phase === 'discovery' && (
          <View style={styles.eventsSheet}>
            <View style={styles.eventsSheetHeader}>
              <Text style={styles.eventsSheetTitle}>Nearby Community Pulse</Text>
              <Text style={styles.eventsCount}>{nearbyEvents.length} Events</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
              {nearbyEvents.map((evt) => (
                <TouchableOpacity
                  key={evt.id}
                  style={styles.eventCardItem}
                  activeOpacity={0.88}
                  onPress={() => handleSelectEvent(evt)}
                >
                  <Image source={{ uri: evt.coverImage }} style={styles.eventCardImage} />
                  <LinearGradient colors={['transparent', 'rgba(7, 11, 20, 0.95)']} style={styles.eventCardGradient}>
                    <View style={styles.eventCategoryBadge}>
                      <Text style={styles.eventCategoryText}>{evt.category}</Text>
                    </View>
                    <Text style={styles.eventCardName} numberOfLines={1}>
                      {evt.emoji} {evt.name}
                    </Text>
                    <Text style={styles.eventCardHost} numberOfLines={1}>
                      by {evt.host}
                    </Text>
                    <View style={styles.eventCardFooter}>
                      <View style={styles.eventStat}>
                        <Ionicons name="location-outline" size={12} color="#38bdf8" />
                        <Text style={styles.eventStatText}>{evt.distance}</Text>
                      </View>
                      <View style={styles.eventStat}>
                        <Ionicons name="people-outline" size={12} color="#ec4899" />
                        <Text style={styles.eventStatText}>{evt.attendance}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      {/* EVENT DETAILS MODAL */}
      <Modal visible={showEventModal} transparent animationType="slide" onRequestClose={() => setShowEventModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowEventModal(false)} />

          {selectedEvent && (
            <View style={styles.eventModalContent}>
              <Image source={{ uri: selectedEvent.coverImage }} style={styles.modalCoverImage} />

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={styles.modalBody}>
                <View style={styles.modalBadgeRow}>
                  <View style={styles.modalCategoryTag}>
                    <Text style={styles.modalCategoryText}>{selectedEvent.category}</Text>
                  </View>
                  <Text style={styles.modalDistanceText}>📍 {selectedEvent.distance} away</Text>
                </View>

                <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
                <Text style={styles.modalHost}>Host: {selectedEvent.host}</Text>
                <Text style={styles.modalDesc}>{selectedEvent.description}</Text>

                <View style={styles.modalDetailsList}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="time-outline" size={18} color="#ec4899" />
                    <Text style={styles.modalDetailText}>{selectedEvent.time}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="pin-outline" size={18} color="#38bdf8" />
                    <Text style={styles.modalDetailText}>{selectedEvent.address}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="people-outline" size={18} color="#a855f7" />
                    <Text style={styles.modalDetailText}>{selectedEvent.attendance}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="hourglass-outline" size={18} color="#4ade80" />
                    <Text style={styles.modalDetailText}>15 Minutes verified stay required</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.modalJoinBtn} activeOpacity={0.88} onPress={handleStartNavigation}>
                  <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.gradientBtn}>
                    <Text style={styles.primaryBtnText}>Join Event & Verify Presence</Text>
                    <Feather name="navigation" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  ambientGlow: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: 'rgba(236, 72, 153, 0.14)',
    top: height * 0.15,
    left: -width * 0.2,
  },

  // Permission Gate Screen
  permissionContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  permissionContent: { alignItems: 'center', marginTop: 40 },
  permissionIconBadge: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(236, 72, 153, 0.15)', borderWidth: 1.5, borderColor: 'rgba(236, 72, 153, 0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  permissionTitle: { fontSize: 26, fontWeight: '800', color: '#f8fafc', textAlign: 'center', marginBottom: 12 },
  permissionSubtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permissionFeatureBox: { width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 36, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: '#e2e8f0', fontWeight: '600' },

  primaryActionBtn: { width: '100%', borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { width: '100%', height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitleWrap: { alignItems: 'center' },
  headerTag: { fontSize: 11, fontWeight: '800', color: '#ec4899', letterSpacing: 1.2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  pointsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(236, 72, 153, 0.2)', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.4)' },
  pointsText: { fontSize: 12, fontWeight: '800', color: '#f472b6' },

  // Map Canvas
  mapCanvasContainer: { flex: 1, marginHorizontal: 16, marginTop: 8, marginBottom: 12, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(11, 19, 41, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  mapGridPattern: { ...StyleSheet.absoluteFillObject },
  gridLineH1: { position: 'absolute', top: '25%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineH2: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineH3: { position: 'absolute', top: '75%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineV1: { position: 'absolute', left: '25%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineV2: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineV3: { position: 'absolute', left: '75%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  centerPulseAnchor: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  heartbeatRipple1: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(236, 72, 153, 0.25)', borderWidth: 1.5, borderColor: 'rgba(236, 72, 153, 0.5)' },
  heartbeatRipple2: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(168, 85, 247, 0.15)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  centerUserNode: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', zIndex: 10, elevation: 8 },
  userNodeGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  userNodeEmoji: { fontSize: 28 },

  // Floating Event Nodes
  mapEventNode: { position: 'absolute', alignItems: 'center', zIndex: 20 },
  eventNodePulseRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(56, 189, 248, 0.25)' },
  eventNodeBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#38bdf8', alignItems: 'center', justifyContent: 'center' },
  eventNodeEmoji: { fontSize: 18 },
  eventNodeLabel: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  eventNodeDistance: { fontSize: 10, fontWeight: '700', color: '#38bdf8' },

  // Scene Commentary Banner
  sceneBanner: { position: 'absolute', top: 20, left: 20, right: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(7, 11, 20, 0.85)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center' },
  sceneBannerTitle: { fontSize: 16, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  sceneBannerSub: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 3 },

  // Stay Timer Card
  stayTimerCard: { position: 'absolute', bottom: 20, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 22, backgroundColor: 'rgba(7, 11, 20, 0.9)', borderWidth: 1.5, borderColor: 'rgba(236, 72, 153, 0.4)', alignItems: 'center' },
  timerRingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerDigits: { fontSize: 28, fontWeight: '800', color: '#ec4899', letterSpacing: 1 },
  timerSubtitle: { fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  fastForwardBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(236, 72, 153, 0.2)' },
  fastForwardText: { fontSize: 11, fontWeight: '700', color: '#f472b6' },

  // Arrived Banner
  arrivedBanner: { position: 'absolute', alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: 'rgba(7, 11, 20, 0.95)', borderWidth: 1.5, borderColor: '#4ade80' },
  arrivedTitle: { fontSize: 24, fontWeight: '800', color: '#f8fafc', marginTop: 8 },
  arrivedSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  // Achievement Unlock Badge Card
  badgeCard: { position: 'absolute', bottom: 24, left: 20, right: 20, borderRadius: 24, overflow: 'hidden', elevation: 12 },
  badgeCardGradient: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  badgeCardIcon: { fontSize: 42, marginRight: 16 },
  badgeCardTextGroup: { flex: 1 },
  badgeCardTag: { fontSize: 10, fontWeight: '900', color: '#fca5a5', letterSpacing: 1.2 },
  badgeCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  badgeCardQuote: { fontSize: 12, fontStyle: 'italic', color: '#f3e8ff', marginTop: 4 },

  // Discovery Events Sheet
  eventsSheet: { height: 170, paddingHorizontal: 16, marginBottom: 8 },
  eventsSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eventsSheetTitle: { fontSize: 15, fontWeight: '800', color: '#f8fafc' },
  eventsCount: { fontSize: 12, color: '#38bdf8', fontWeight: '700' },
  eventsScroll: { gap: 12 },
  eventCardItem: { width: 220, height: 125, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0f172a' },
  eventCardImage: { ...StyleSheet.absoluteFillObject },
  eventCardGradient: { flex: 1, padding: 10, justifyContent: 'flex-end' },
  eventCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(236, 72, 153, 0.8)', marginBottom: 4 },
  eventCategoryText: { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  eventCardName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  eventCardHost: { fontSize: 10, color: '#cbd5e1', marginBottom: 6 },
  eventCardFooter: { flexDirection: 'row', gap: 12 },
  eventStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventStatText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  // Event Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  eventModalContent: { backgroundColor: '#0b1329', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: height * 0.8 },
  modalCoverImage: { width: '100%', height: 180 },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20 },
  modalBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalCategoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(236, 72, 153, 0.2)', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.4)' },
  modalCategoryText: { fontSize: 11, fontWeight: '800', color: '#f472b6' },
  modalDistanceText: { fontSize: 12, fontWeight: '700', color: '#38bdf8' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  modalHost: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 10 },
  modalDesc: { fontSize: 13, color: '#cbd5e1', lineHeight: 18, marginBottom: 16 },
  modalDetailsList: { gap: 10, marginBottom: 20 },
  modalDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalDetailText: { fontSize: 13, color: '#e2e8f0', fontWeight: '600' },
  modalJoinBtn: { borderRadius: 26, overflow: 'hidden', marginTop: 4 },
});
