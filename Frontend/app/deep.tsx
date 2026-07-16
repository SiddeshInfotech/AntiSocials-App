import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  PanResponder,
  Image,
  Animated as RNAnimated,
  TextInput,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Video, ResizeMode } from 'expo-av';
import { apiFetch } from '../constants/Api';

const COLORS = {
  navyDark: '#040815',
  glassCard: 'rgba(10, 18, 42, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  neonBlue: '#3B82F6',
  neonPurple: '#8B5CF6',
  glowCyan: '#06B6D4',
  textWhite: '#FFFFFF',
  textDim: '#94A3B8',
  gold: '#FBBF24',
};

const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (err) {
    console.warn('Haptics not supported:', err);
  }
};

interface AvailableApp {
  id: string;
  name: string;
  iconName: string;
  iconType: 'ionicons' | 'material';
  color: string;
}

const AVAILABLE_APPS: AvailableApp[] = [
  { id: 'instagram', name: 'Instagram', iconName: 'logo-instagram', iconType: 'ionicons', color: '#E1306C' },
  { id: 'whatsapp', name: 'WhatsApp', iconName: 'logo-whatsapp', iconType: 'ionicons', color: '#25D366' },
  { id: 'youtube', name: 'YouTube', iconName: 'logo-youtube', iconType: 'ionicons', color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', iconName: 'logo-facebook', iconType: 'ionicons', color: '#1877F2' },
  { id: 'discord', name: 'Discord', iconName: 'discord', iconType: 'material', color: '#5865F2' },
  { id: 'snapchat', name: 'Snapchat', iconName: 'snapchat', iconType: 'material', color: '#FFFC00' },
  { id: 'twitter', name: 'X (Twitter)', iconName: 'twitter', iconType: 'material', color: '#1DA1F2' },
  { id: 'reddit', name: 'Reddit', iconName: 'reddit', iconType: 'material', color: '#FF4500' },
  { id: 'telegram', name: 'Telegram', iconName: 'paper-plane', iconType: 'ionicons', color: '#0088CC' },
  { id: 'netflix', name: 'Netflix', iconName: 'netflix', iconType: 'material', color: '#E50914' },
  { id: 'chrome', name: 'Chrome', iconName: 'google-chrome', iconType: 'material', color: '#4285F4' },
  { id: 'other', name: 'Other', iconName: 'plus', iconType: 'material', color: '#4B5563' },
];

interface AppIconData {
  id: string;
  name: string;
  iconName: string;
  iconType: 'ionicons' | 'material';
  color: string;
  initialX: number;
  initialY: number;
}

// Draggable App Icon Component using native React Native Animated driver
const DraggableAppIcon = ({
  data,
  vaultCenter,
  onLocked,
  screenHeight,
}: {
  data: AppIconData;
  vaultCenter: { x: number; y: number };
  onLocked: (id: string) => void;
  screenHeight: number;
}) => {
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const [isLocked, setIsLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const scale = useRef(new RNAnimated.Value(1.0)).current;
  const opacity = useRef(new RNAnimated.Value(1.0)).current;

  // Floating idle motion
  const floatX = useRef(new RNAnimated.Value(0)).current;
  const floatY = useRef(new RNAnimated.Value(0)).current;

  const onLockedRef = useRef(onLocked);
  useEffect(() => {
    onLockedRef.current = onLocked;
  }, [onLocked]);

  useEffect(() => {
    let active = true;

    const startFloating = () => {
      if (!active || isLocked || isDragging) return;
      const toX = Math.random() * 16 - 8;
      const toY = Math.random() * 16 - 8;
      const duration = 2500 + Math.random() * 2000;

      RNAnimated.parallel([
        RNAnimated.timing(floatX, {
          toValue: toX,
          duration,
          useNativeDriver: false,
        }),
        RNAnimated.timing(floatY, {
          toValue: toY,
          duration,
          useNativeDriver: false,
        })
      ]).start(() => {
        if (active) startFloating();
      });
    };

    startFloating();

    return () => {
      active = false;
    };
  }, [isLocked, isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLocked,
      onMoveShouldSetPanResponder: () => !isLocked,
      onPanResponderGrant: () => {
        setIsDragging(true);
        triggerHaptic('light');
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });

        RNAnimated.timing(scale, {
          toValue: 1.1, // Increase scale to 1.1 on drag
          duration: 150,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: RNAnimated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();

        // Calculate absolute coordinate collision using screen touch position (moveX / moveY)
        const touchX = gestureState.moveX;
        const touchY = gestureState.moveY;

        // Vault boundary matching
        const inVaultX = touchX > (vaultCenter.x - 60) && touchX < (vaultCenter.x + 150);
        const inVaultY = touchY > (vaultCenter.y - 60);

        if (inVaultX && inVaultY) {
          // Locked / Absorbed inside Vault!
          setIsLocked(true);
          
          RNAnimated.parallel([
            RNAnimated.spring(pan, {
              toValue: { x: vaultCenter.x - data.initialX, y: vaultCenter.y - data.initialY },
              useNativeDriver: false,
            }),
            RNAnimated.timing(scale, {
              toValue: 0.1,
              duration: 250,
              useNativeDriver: false,
            }),
            RNAnimated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            })
          ]).start(() => {
            onLockedRef.current(data.id);
          });
        } else {
          // Bounce back to center
          RNAnimated.parallel([
            RNAnimated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }),
            RNAnimated.timing(scale, {
              toValue: 1.0,
              duration: 200,
              useNativeDriver: false,
            })
          ]).start();
          triggerHaptic('light');
        }
      },
    })
  ).current;

  return (
    <RNAnimated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableAppWrapper,
        {
          left: data.initialX,
          top: data.initialY,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { translateX: floatX },
            { translateY: floatY },
            { scale: scale },
          ],
          opacity: opacity,
          // Stronger shadow and scale feedback during drag
          shadowOpacity: isDragging ? 0.35 : 0.15,
          shadowRadius: isDragging ? 12 : 6,
          elevation: isDragging ? 8 : 2,
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
        style={styles.draggableAppGradient}
      >
        <View style={[styles.draggableIconContainer, { backgroundColor: data.color }]}>
          {data.iconType === 'ionicons' ? (
            <Ionicons name={data.iconName as any} size={22} color={data.name === 'Snapchat' ? '#000' : '#FFF'} />
          ) : (
            <MaterialCommunityIcons name={data.iconName as any} size={22} color={data.name === 'Snapchat' ? '#000' : '#FFF'} />
          )}
        </View>
        <Text style={styles.draggableLabelText} numberOfLines={1}>{data.name}</Text>
      </LinearGradient>
    </RNAnimated.View>
  );
};

export default function DeepScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Desktop limits
  const isDesktop = width > 768;
  const containerWidth = isDesktop ? 650 : width;

  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'onboarding' | 'interaction' | 'success'>('onboarding');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [otherAppName, setOtherAppName] = useState('');
  const [activeAppList, setActiveAppList] = useState<AppIconData[]>([]);
  const [lockedApps, setLockedApps] = useState<string[]>([]);

  // Layout points
  const vaultCenter = { x: containerWidth / 2 - 45, y: height - 160 };

  // Reanimated animations
  const vaultScale = useSharedValue(1.0);
  const vaultPulseOpacity = useSharedValue(0);
  const successCardScale = useSharedValue(0.85);
  const successCardOpacity = useSharedValue(0);
  const lockRotate = useSharedValue(0);
  const finalPulseScale = useSharedValue(0.9);
  const finalPulseOpacity = useSharedValue(0);

  // Fetch initial completion parameters
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/tasks/deep/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success && data.progress) {
          const progress = data.progress;
          if (progress.completed) {
            // Already locked previously, show success directly
            setViewState('success');
            successCardOpacity.value = 1.0;
            successCardScale.value = 1.0;
          }
        }
      } catch (err) {
        console.warn('Error fetching Deep Work status:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Continue to locking screen
  const handleContinueOnboarding = () => {
    triggerHaptic('medium');

    const list: AppIconData[] = [];
    selectedAppIds.forEach((id) => {
      if (id === 'other') {
        if (otherAppName.trim()) {
          list.push({
            id: 'other_custom',
            name: otherAppName.trim(),
            iconName: 'apps-outline',
            iconType: 'ionicons',
            color: '#4B5563',
            initialX: 0,
            initialY: 0,
          });
        }
      } else {
        const app = AVAILABLE_APPS.find((a) => a.id === id);
        if (app) {
          list.push({
            id: app.id,
            name: app.name,
            iconName: app.iconName,
            iconType: app.iconType,
            color: app.color,
            initialX: 0,
            initialY: 0,
          });
        }
      }
    });

    // Calculate circular distribution coordinates
    const N = list.length;
    const R = 85; // Constellation radius
    const centerY = height * 0.38;
    const centerX = containerWidth / 2 - 45; // Offset by half app width (90/2)

    list.forEach((item, index) => {
      const theta = (2 * Math.PI * index) / N;
      item.initialX = centerX + R * Math.cos(theta);
      item.initialY = centerY + R * Math.sin(theta);
    });

    setActiveAppList(list);
    setViewState('interaction');
  };

  const handleAppLocked = (id: string) => {
    setLockedApps((prev) => {
      if (prev.includes(id)) return prev;
      const newList = [...prev, id];
      
      // Auto-trigger completion sequence immediately on locking all selected apps
      if (newList.length === activeAppList.length) {
        setTimeout(triggerFinalSequence, 400);
      }
      return newList;
    });
    triggerHaptic('medium');

    // Bounce vault scale
    vaultScale.value = withSequence(
      withTiming(1.12, { duration: 120 }),
      withTiming(1.0, { duration: 180 })
    );

    // Expand vault pulse glow ring
    vaultPulseOpacity.value = 0.8;
    vaultPulseOpacity.value = withTiming(0, { duration: 550 });
  };

  const triggerFinalSequence = () => {
    triggerHaptic('success');
    
    // Rotate lock, animate click shut
    lockRotate.value = withTiming(360, { duration: 800, easing: Easing.out(Easing.back()) });

    // Shockwave pulse spreading outwards
    finalPulseOpacity.value = 0.9;
    finalPulseScale.value = withTiming(3.0, { duration: 1000, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) {
        finalPulseOpacity.value = 0;
      }
    });

    // Fade in Success Card details
    setTimeout(() => {
      setViewState('success');
      successCardOpacity.value = withTiming(1.0, { duration: 600 });
      successCardScale.value = withSpring(1.0);
    }, 600);
  };

  const handleBeginDeepWork = async () => {
    triggerHaptic('success');
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskName: 'Remove Distraction',
          task_name: 'Remove Distraction',
          taskTitle: 'Remove Distraction'
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        router.replace({
          pathname: '/task-success',
          params: {
            type: 'breathing',
            points: (data.pointsAdded || 300).toString(),
            totalPoints: (data.totalPoints || 0).toString(),
            streak: (data.streak || 3).toString(),
          }
        } as any);
      }
    } catch (err) {
      console.warn('Error finalizing Deep Work:', err);
      router.replace({
        pathname: '/task-success',
        params: {
          type: 'breathing',
          points: '300',
          totalPoints: '300',
          streak: '3',
        }
      } as any);
    }
  };

  const toggleAppSelection = (id: string) => {
    triggerHaptic('light');
    setSelectedAppIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((appId) => appId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Reanimated style binds
  const animatedVaultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vaultScale.value }],
  }));

  const animatedVaultPulseStyle = useAnimatedStyle(() => ({
    opacity: vaultPulseOpacity.value,
  }));

  const animatedSuccessCardStyle = useAnimatedStyle(() => ({
    opacity: successCardOpacity.value,
    transform: [{ scale: successCardScale.value }],
  }));

  const animatedLockRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lockRotate.value}deg` }],
  }));

  const animatedFinalPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: finalPulseScale.value }],
    opacity: finalPulseOpacity.value,
  }));

  const isContinueOnboardingDisabled =
    selectedAppIds.length === 0 ||
    (selectedAppIds.includes('other') && !otherAppName.trim());

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.neonBlue} />
        <Text style={styles.loadingText}>Initializing deep background...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen looping background video */}
      <View style={StyleSheet.absoluteFillObject}>
        <Video
          source={require('../assets/videos/animated_phot.mp4')}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
        {/* Dark overlay: 55% during activity, lighter 42% on completion */}
        <View
          style={[
            styles.darkVideoOverlay,
            { backgroundColor: `rgba(4, 8, 21, ${viewState === 'success' ? 0.42 : 0.55})` },
          ]}
        />
      </View>

      {/* Shockwave ripple pulse expanding on lock success */}
      <Animated.View style={[styles.shockwavePulseCircle, animatedFinalPulseStyle]} />

      <View style={[styles.viewportWrapper, { width: containerWidth }]}>
        <SafeAreaView style={styles.safeArea}>

          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => {
                if (viewState === 'interaction') {
                  setLockedApps([]);
                  setViewState('onboarding');
                } else {
                  router.back();
                }
              }}
              style={styles.glassHeaderBtn}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={20} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>REMOVE DISTRACTION</Text>

            <View style={{ width: 38 }} />
          </View>

          {/* ONBOARDING SCREEN: APP SELECTION CHIPS */}
          {viewState === 'onboarding' && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.largeTitle}>Which apps distract you the most?</Text>
                <Text style={styles.subtitleText}>
                  Think for a moment.{"\n"}Choose the apps that usually steal your attention during work or study.
                </Text>
              </View>

              <BlurView intensity={20} tint="dark" style={styles.selectionGlassCard}>
                <Text style={styles.selectionCardHeader}>Select Your Biggest Distractions</Text>
                
                <ScrollView contentContainerStyle={styles.chipsScrollContainer} showsVerticalScrollIndicator={false}>
                  <View style={styles.chipsGrid}>
                    {AVAILABLE_APPS.map((app) => {
                      const isSelected = selectedAppIds.includes(app.id);
                      return (
                        <TouchableOpacity
                          key={app.id}
                          onPress={() => toggleAppSelection(app.id)}
                          activeOpacity={0.8}
                          style={[
                            styles.appChip,
                            isSelected && {
                              borderColor: COLORS.neonBlue,
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            },
                          ]}
                        >
                          <View style={[styles.chipIconContainer, { backgroundColor: app.color }]}>
                            {app.iconType === 'ionicons' ? (
                              <Ionicons name={app.iconName as any} size={15} color={app.name === 'Snapchat' ? '#000' : '#FFF'} />
                            ) : (
                              <MaterialCommunityIcons name={app.iconName as any} size={15} color={app.name === 'Snapchat' ? '#000' : '#FFF'} />
                            )}
                          </View>
                          <Text style={styles.chipText}>{app.name}</Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={13} color={COLORS.neonBlue} style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Input field for Custom App "Other" */}
                  {selectedAppIds.includes('other') && (
                    <View style={styles.otherInputWrapper}>
                      <TextInput
                        style={styles.otherTextInput}
                        placeholder="Write the app name..."
                        placeholderTextColor={COLORS.textDim}
                        value={otherAppName}
                        onChangeText={setOtherAppName}
                        autoCapitalize="words"
                      />
                    </View>
                  )}
                </ScrollView>
              </BlurView>

              <View style={styles.bottomTextWrapperOnboarding}>
                <Text style={styles.onboardingBottomText}>
                  The apps you select will be locked in the next step so you can fully focus on your work.
                </Text>

                <TouchableOpacity
                  onPress={handleContinueOnboarding}
                  disabled={isContinueOnboardingDisabled}
                  activeOpacity={0.8}
                  style={[
                    styles.successPillBtn,
                    isContinueOnboardingDisabled && { opacity: 0.5 },
                  ]}
                >
                  <LinearGradient
                    colors={[COLORS.neonBlue, COLORS.neonPurple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientSuccessBtn}
                  >
                    <Text style={styles.successBtnText}>Continue</Text>
                    <Feather name="chevron-right" size={16} color="#FFF" style={styles.successBtnCaret} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ACTIVE DRAGGABLE LOCK INTERACTION */}
          {viewState === 'interaction' && (
            <View style={styles.stepContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.largeTitle}>Lock Your Distractions</Text>
                <Text style={styles.subtitleText}>Protect your attention before you begin.</Text>
              </View>

              {/* Displaying dynamically selected app items in a constellation */}
              <View style={styles.draggablesPlane}>
                {activeAppList.map((app) => {
                  if (lockedApps.includes(app.id)) return null;
                  return (
                    <DraggableAppIcon
                      key={app.id}
                      data={app}
                      vaultCenter={vaultCenter}
                      onLocked={handleAppLocked}
                      screenHeight={height}
                    />
                  );
                })}
              </View>

              {/* Status Counter */}
              <View style={styles.statusLabelSection}>
                <Text style={styles.statusNumberText}>
                  {lockedApps.length} / {activeAppList.length} Locked
                </Text>
              </View>

              {/* Focus Vault Drop target */}
              <View style={styles.vaultWrapper}>
                <Animated.View style={[styles.vaultPulseRing, animatedVaultPulseStyle]} />

                <Animated.View style={[styles.vaultGlassCard, animatedVaultStyle]}>
                  <BlurView intensity={25} tint="dark" style={styles.vaultBlurContainer}>
                    <View style={styles.vaultLockBase}>
                      <Animated.View style={animatedLockRotateStyle}>
                        <Feather name="unlock" size={22} color={COLORS.neonBlue} style={styles.vaultGlowBlueIcon} />
                      </Animated.View>
                    </View>
                    <Text style={styles.vaultTitleText}>Focus Vault</Text>
                    <Text style={styles.vaultSubtitleText}>Drag distracting apps here.</Text>
                  </BlurView>
                </Animated.View>
              </View>
            </View>
          )}

          {/* SUCCESS ATTENTION CARD POPUP */}
          {viewState === 'success' && (
            <Animated.View style={[styles.successCardWrapper, animatedSuccessCardStyle]}>
              <BlurView intensity={35} tint="dark" style={styles.successGlassCard}>
                <View style={styles.shieldGlowRing}>
                  <Ionicons name="shield-checkmark" size={54} color={COLORS.glowCyan} style={styles.shieldCenterGlow} />
                </View>

                <Text style={styles.successTitle}>Your Attention Is Protected</Text>
                <Text style={styles.successSubtitle}>
                  You've locked away the distractions that steal your focus.{"\n\n"}
                  Now keep your phone aside, avoid these apps, and give your full attention to your work.
                </Text>

                {/* Reminder glass card */}
                <BlurView intensity={20} tint="dark" style={styles.reminderGlassCard}>
                  <Text style={styles.reminderHeader}>📱 Reminder</Text>
                  <Text style={styles.reminderBody}>
                    "The apps that distract you are now locked.{"\n\n"}Put your phone away and focus on what truly matters."
                  </Text>
                </BlurView>

                {/* Begin Focus Action */}
                <TouchableOpacity
                  onPress={handleBeginDeepWork}
                  disabled={lockedApps.length < activeAppList.length && activeAppList.length > 0}
                  activeOpacity={0.8}
                  style={[
                    styles.successPillBtn,
                    lockedApps.length < activeAppList.length && activeAppList.length > 0 && { opacity: 0.5 },
                  ]}
                >
                  <LinearGradient
                    colors={[COLORS.neonBlue, COLORS.neonPurple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientSuccessBtn}
                  >
                    <Text style={styles.successBtnText}>Start Deep Work</Text>
                    <Feather name="chevron-right" size={16} color="#FFF" style={styles.successBtnCaret} />
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}

        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 14,
    marginTop: 16,
  },
  viewportWrapper: {
    flex: 1,
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  glassHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.0,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  largeTitle: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitleText: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Selection Onboarding styles
  selectionGlassCard: {
    flex: 1,
    marginVertical: 14,
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassCard,
    padding: 16,
    overflow: 'hidden',
  },
  selectionCardHeader: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  chipsScrollContainer: {
    paddingBottom: 20,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appChip: {
    width: '48%',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  chipIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chipText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  otherInputWrapper: {
    width: '100%',
    marginTop: 10,
  },
  otherTextInput: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#FFF',
    paddingHorizontal: 14,
    fontSize: 12,
  },
  bottomTextWrapperOnboarding: {
    paddingHorizontal: 20,
  },
  onboardingBottomText: {
    color: COLORS.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
  },
  // Draggable apps plane
  draggablesPlane: {
    flex: 1,
    position: 'relative',
  },
  draggableAppWrapper: {
    position: 'absolute',
    width: 90,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  draggableAppGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  draggableIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  draggableLabelText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  // Counter status
  statusLabelSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  statusNumberText: {
    color: COLORS.glowCyan,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  // Vault bottom target
  vaultWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  vaultPulseRing: {
    position: 'absolute',
    width: '96%',
    height: 120,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: COLORS.neonBlue,
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  vaultGlassCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassCard,
    overflow: 'hidden',
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  vaultBlurContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  vaultLockBase: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vaultGlowBlueIcon: {
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  vaultTitleText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
  vaultSubtitleText: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  // Success Card Wrapper
  successCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successGlassCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassCard,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: COLORS.glowCyan,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  shieldGlowRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.glowCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  shieldCenterGlow: {
    shadowColor: COLORS.glowCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  successTitle: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  badgeLabelContainer: {
    marginVertical: 18,
    borderRadius: 14,
    overflow: 'hidden',
  },
  badgeGradientFrame: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  successPillBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: COLORS.neonBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  gradientSuccessBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  successBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.0,
  },
  successBtnCaret: {
    position: 'absolute',
    right: 24,
  },
  // Background / overlay video
  darkVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  shockwavePulseCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: COLORS.glowCyan,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    pointerEvents: 'none',
    zIndex: 5,
    alignSelf: 'center',
    bottom: 50,
  },
  pollenDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  reminderGlassCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    marginVertical: 18,
  },
  reminderHeader: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  reminderBody: {
    color: COLORS.textDim,
    fontSize: 11,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
