import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

const COLORS = {
  purple: '#8B5CF6',
  indigo: '#6366F1',
  deepBlack: '#090A14',
  glowPurple: 'rgba(139, 92, 246, 0.45)',
  textWhite: '#FFFFFF',
  textDim: '#9CA3AF',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  white: '#FFFFFF',
};

const MAX_CHAR_COUNT = 300;

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

// Embers rising slowly in the background
const AmbientParticles = ({ 
  count = 20,
  width,
  height
}: { 
  count?: number;
  width: number;
  height: number;
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(count)].map((_, i) => {
        const pX = useSharedValue(Math.random() * width);
        const pY = useSharedValue(height + Math.random() * 80);
        const scaleBase = Math.random() * 0.4 + 0.15;
        const opacityBase = Math.random() * 0.3 + 0.1;

        useEffect(() => {
          const duration = 12000 + Math.random() * 8000;
          const delay = Math.random() * 5000;

          pY.value = withRepeat(
            withSequence(
              withTiming(height + 20, { duration: delay }),
              withTiming(-30, { duration, easing: Easing.linear })
            ),
            -1,
            false
          );

          pX.value = withRepeat(
            withSequence(
              withTiming(pX.value + (Math.random() * 40 - 20), {
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(pX.value - (Math.random() * 40 - 20), {
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
            { translateX: pX.value },
            { translateY: pY.value },
            { scale: scaleBase },
          ],
          opacity: opacityBase,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              styles.ambientParticle,
              style,
              { backgroundColor: COLORS.purple },
            ]}
          />
        );
      })}
    </View>
  );
};

// Leaves flying in the background for Screen 8
const FlyingLeaves = ({ 
  width, 
  height 
}: { 
  width: number; 
  height: number;
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(6)].map((_, i) => {
        const pX = useSharedValue(-50);
        const pY = useSharedValue(Math.random() * (height * 0.6));
        const rot = useSharedValue(0);
        const scale = Math.random() * 0.4 + 0.3;

        useEffect(() => {
          const duration = 6000 + Math.random() * 4000;
          const delay = Math.random() * 3000;

          pX.value = withRepeat(
            withSequence(
              withTiming(-50, { duration: delay }),
              withTiming(width + 50, { duration, easing: Easing.linear })
            ),
            -1,
            false
          );

          pY.value = withRepeat(
            withSequence(
              withTiming(pY.value + 60, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
              withTiming(pY.value - 60, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          );

          rot.value = withRepeat(
            withTiming(360, { duration: 4000, easing: Easing.linear }),
            -1,
            false
          );
        }, []);

        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: pX.value },
            { translateY: pY.value },
            { scale },
            { rotate: `${rot.value}deg` },
          ],
          opacity: 0.3,
        }));

        return (
          <Animated.View key={i} style={[styles.leafWrapper, style]}>
            <Feather name="feather" size={24} color={COLORS.purple} />
          </Animated.View>
        );
      })}
    </View>
  );
};

export default function NoticeFearScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Limit viewport width on desktop
  const isDesktop = windowWidth > 768;
  const containerWidth = isDesktop ? 650 : windowWidth;

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Experience Data States
  const [fearText, setFearText] = useState('');
  const [intensity, setIntensity] = useState(4);
  const [bodyLocation, setBodyLocation] = useState('Chest');
  const [feelingType, setFeelingType] = useState('Heavy');
  const [fearShape, setFearShape] = useState('Cloud');
  const [selectedReminder, setSelectedReminder] = useState('I am safe in this moment.');
  const [customReminderInput, setCustomReminderInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [reflectionChecks, setReflectionChecks] = useState<Record<string, boolean>>({
    real: false,
    stayed: false,
    noChange: false,
  });

  // DB Complete State response
  const [pointsAwarded, setPointsAwarded] = useState(300);
  const [totalPoints, setTotalPoints] = useState(0);

  // Background animations values
  const bgTranslateY = useSharedValue(0);
  const orbScale = useSharedValue(1.0);
  const orbOpacity = useSharedValue(0.4);
  const completionGlowScale = useSharedValue(0.8);
  const completionGlowOpacity = useSharedValue(0.5);

  // Drifting cloud inside Screen 8
  const cloudX = useSharedValue(0);
  const cloudOpacity = useSharedValue(0.8);

  // Init animations
  useEffect(() => {
    bgTranslateY.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Screen 8 cloud drift animation
  useEffect(() => {
    if (step === 8) {
      cloudX.value = 0;
      cloudOpacity.value = 0.8;
      cloudX.value = withTiming(containerWidth + 100, { duration: 7500, easing: Easing.linear });
      cloudOpacity.value = withTiming(0, { duration: 7500, easing: Easing.linear });
    }
  }, [step]);

  // Screen 11 completion check glow ripple
  useEffect(() => {
    if (step === 11) {
      completionGlowScale.value = 0.8;
      completionGlowOpacity.value = 0.5;
      completionGlowScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 2500, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 0 })
        ),
        -1,
        false
      );
      completionGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.0, { duration: 2500, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [step]);

  // Restore task progress if exits early
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/tasks/notice-fear/progress', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success && data.progressPayload) {
          const payload = data.progressPayload;
          if (payload.fearText) setFearText(payload.fearText);
          if (payload.intensity) setIntensity(payload.intensity);
          if (payload.bodyLocation) setBodyLocation(payload.bodyLocation);
          if (payload.feelingType) setFeelingType(payload.feelingType);
          if (payload.fearShape) setFearShape(payload.fearShape);
          if (payload.selectedReminder) setSelectedReminder(payload.selectedReminder);
          if (payload.reflectionChecks) setReflectionChecks(payload.reflectionChecks);
          if (payload.step && payload.step < 12) setStep(payload.step);
        }
      } catch (err) {
        console.warn('Error loading progress:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Save progress dynamically
  const saveProgress = async (nextStep: number) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      await apiFetch('/api/tasks/notice-fear/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: nextStep >= 12,
          progressPayload: {
            step: nextStep,
            fearText,
            intensity,
            bodyLocation,
            feelingType,
            fearShape,
            selectedReminder,
            reflectionChecks
          }
        })
      });
    } catch (err) {
      console.warn('Error saving progress:', err);
    }
  };

  const handleNextStep = () => {
    triggerHaptic('light');
    const nextStep = step + 1;
    setStep(nextStep);
    saveProgress(nextStep);
  };

  const handlePrevStep = () => {
    triggerHaptic('light');
    const prevStep = Math.max(1, step - 1);
    setStep(prevStep);
  };

  // Submit complete task to backend
  const handleCompleteTask = async () => {
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
          taskTitle: 'Notice Fear',
          fearText,
          intensity,
          bodyLocation,
          feelingType,
          fearShape,
          selectedReminder,
          customReminder: customReminderInput,
          reflectionChecks
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        setPointsAwarded(data.pointsEarned || 300);
        setTotalPoints(data.totalPoints || 0);
        triggerHaptic('success');
        setStep(12);
      } else {
        Alert.alert('Error', data.message || 'Could not complete task.');
      }
    } catch (e) {
      console.error('Error completing task:', e);
      Alert.alert('Error', 'Connection failed. Please try again.');
    }
  };

  const handleFinish = () => {
    triggerHaptic('success');
    router.replace({
      pathname: '/(tabs)',
      params: {
        updatedPoints: totalPoints ? totalPoints.toString() : '',
      }
    } as any);
  };

  // Animated styles
  const mistAnimatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: bgTranslateY.value }],
  }));

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    shadowRadius: orbOpacity.value * 30 + 10,
    opacity: orbOpacity.value + 0.3,
  }));

  const cloudAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudX.value }],
    opacity: cloudOpacity.value,
  }));

  const completionGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completionGlowScale.value }],
    opacity: completionGlowOpacity.value,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>Calming your mind...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <View style={styles.mainContainer}>
        <StatusBar style="light" />

        {/* Global Dark cosmic background with slow moving mist */}
        <View style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={[COLORS.deepBlack, '#0B0D1C', '#120D26']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* Slow moving mist layout */}
          <Animated.View style={[StyleSheet.absoluteFillObject, mistAnimatedStyle1]}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.15)', 'transparent', 'rgba(139, 92, 246, 0.08)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Glowing particles */}
          <AmbientParticles width={windowWidth} height={windowHeight} />

          {/* Small glowing moon in background (only on dark screens) */}
          {step <= 11 && (
            <View style={styles.glowingMoonContainer}>
              <View style={styles.glowingMoon} />
            </View>
          )}
        </View>

        {/* Desktop Wrapper Layout */}
        <View style={[styles.viewportWrapper, { width: containerWidth }]}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            
            {/* Header with back button */}
            {step > 1 && step <= 10 && (
              <View style={styles.headerBar}>
                <TouchableOpacity onPress={handlePrevStep} style={styles.backBtn} activeOpacity={0.7}>
                  <Feather name="chevron-left" size={24} color={COLORS.white} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitleText}>Notice Fear</Text>
                </View>

                {/* Empty slot to balance spacing */}
                <View style={{ width: 40 }} />
              </View>
            )}

            {/* Main Interactive Screen Router */}
            <View style={styles.contentContainer}>
              {step === 1 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.introTopSpace} />
                  
                  <Animated.View style={styles.centerSection} entering={FadeIn.duration(800)}>
                    <Text style={styles.immersiveTitle}>Notice Fear</Text>
                    <View style={styles.titleDivider} />
                    <Text style={styles.immersiveSubtitle}>
                      Fear is only a visitor.{"\n"}You don't have to become it.
                    </Text>
                  </Animated.View>

                  <Animated.View style={styles.buttonSection} entering={FadeInDown.delay(300).duration(800)}>
                    <TouchableOpacity 
                      onPress={handleNextStep} 
                      activeOpacity={0.8}
                      style={styles.glowingGlassBtn}
                    >
                      <BlurView intensity={20} tint="dark" style={styles.glassBtnBlur}>
                        <Text style={styles.glassBtnText}>Begin Observation →</Text>
                      </BlurView>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}

              {step === 2 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>What is your fear?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Large Glowing Pulsing Breathing Orb */}
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        triggerHaptic('medium');
                        handleNextStep();
                      }}
                      style={styles.orbHitbox}
                    >
                      <Animated.View style={[styles.breathingOrb, orbAnimatedStyle]}>
                        <View style={styles.orbCore} />
                      </Animated.View>
                    </TouchableOpacity>

                    <Text style={styles.tapOrbLabel}>Tap the orb to begin</Text>
                  </View>

                  <View style={styles.progressDotsContainer}>
                    {[...Array(4)].map((_, idx) => (
                      <View key={idx} style={[styles.dot, idx === 1 && styles.dotActive]} />
                    ))}
                  </View>
                </View>
              )}

              {step === 3 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>I'm afraid that...</Text>
                  </View>

                  <View style={styles.centerSection}>
                    <BlurView intensity={10} tint="dark" style={styles.glassTextareaCard}>
                      <TextInput
                        style={styles.textareaInput}
                        placeholder="Type your fear here..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        multiline
                        numberOfLines={6}
                        value={fearText}
                        onChangeText={setFearText}
                        maxLength={MAX_CHAR_COUNT}
                      />
                      <Text style={styles.charCounterText}>
                        {fearText.length} / {MAX_CHAR_COUNT}
                      </Text>
                    </BlurView>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      disabled={!fearText.trim()}
                      style={[styles.primaryActionBtn, !fearText.trim() && { opacity: 0.4 }]}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue →</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(4)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 2 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 4 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>How strong does it feel?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Glowing Circular Meter */}
                    <View style={styles.circularMeter}>
                      <Text style={styles.meterValueText}>{intensity}</Text>
                      <Text style={styles.meterLabelText}>
                        {intensity === 1 && 'Faint'}
                        {intensity === 2 && 'Mild'}
                        {intensity === 3 && 'Moderate'}
                        {intensity === 4 && 'Strong'}
                        {intensity === 5 && 'Intense'}
                      </Text>
                    </View>

                    {/* Numeric Selector Bar */}
                    <View style={styles.numericRow}>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = intensity === num;
                        return (
                          <TouchableOpacity
                            key={num}
                            onPress={() => {
                              triggerHaptic('light');
                              setIntensity(num);
                            }}
                            style={[
                              styles.numericItemBtn,
                              isSelected && styles.numericItemActive
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.numericItemText, isSelected && { fontWeight: '800' }]}>{num}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.judgeSubtext}>Notice it. Don't judge it.</Text>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue →</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(4)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 3 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 5 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>Where do you feel it?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Human silhouette outline */}
                    <View style={styles.silhouetteWrapper}>
                      <Ionicons name="body-outline" size={140} color="rgba(255, 255, 255, 0.12)" />

                      {/* Hotspots overlay */}
                      <View style={[styles.hotspotAnchor, { top: '15%', left: '46.5%' }]}>
                        <View style={[styles.silhouetteHotspot, bodyLocation === 'Head' && styles.silhouetteHotspotActive]} />
                      </View>
                      <View style={[styles.hotspotAnchor, { top: '33%', left: '46.5%' }]}>
                        <View style={[styles.silhouetteHotspot, bodyLocation === 'Chest' && styles.silhouetteHotspotActive]} />
                      </View>
                      <View style={[styles.hotspotAnchor, { top: '48%', left: '46.5%' }]}>
                        <View style={[styles.silhouetteHotspot, bodyLocation === 'Stomach' && styles.silhouetteHotspotActive]} />
                      </View>
                      <View style={[styles.hotspotAnchor, { top: '42%', left: '20%' }]}>
                        <View style={[styles.silhouetteHotspot, bodyLocation === 'Hands' && styles.silhouetteHotspotActive]} />
                      </View>
                      <View style={[styles.hotspotAnchor, { top: '75%', left: '43%' }]}>
                        <View style={[styles.silhouetteHotspot, bodyLocation === 'Legs' && styles.silhouetteHotspotActive]} />
                      </View>
                    </View>

                    {/* Horizontal select chips */}
                    <View style={styles.hotspotChipsContainer}>
                      {['Head', 'Chest', 'Stomach', 'Hands', 'Legs'].map((spot) => {
                        const isSelected = bodyLocation === spot;
                        return (
                          <TouchableOpacity
                            key={spot}
                            onPress={() => {
                              triggerHaptic('light');
                              setBodyLocation(spot);
                            }}
                            style={[styles.hotspotChipBtn, isSelected && styles.hotspotChipActive]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.hotspotChipText, isSelected && { color: COLORS.white }]}>{spot}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.bodyInstructionText}>Tap where fear appears</Text>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(4)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 0 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 6 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>Look at your fear.</Text>
                    <Text style={styles.screenSubtitle}>Without changing it... What does it feel like?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Animated Fog Cloud illustration */}
                    <View style={styles.cloudIllustrationWrapper}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.25)', 'rgba(99, 102, 241, 0.02)']}
                        style={styles.smokeCloudBall}
                      />
                    </View>

                    {/* Chips select container */}
                    <View style={styles.chipsGrid}>
                      {['Heavy', 'Cold', 'Tight', 'Fast', 'Empty', 'Unknown'].map((feeling) => {
                        const isSelected = feelingType === feeling;
                        return (
                          <TouchableOpacity
                            key={feeling}
                            onPress={() => {
                              triggerHaptic('light');
                              setFeelingType(feeling);
                            }}
                            style={[styles.glassChipItem, isSelected && styles.glassChipActive]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.glassChipText, isSelected && { color: COLORS.white }]}>{feeling}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(5)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 0 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 7 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>If fear had a shape...</Text>
                    <Text style={styles.screenSubtitle}>What would it be?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Grid choices */}
                    <View style={styles.shapeCardGrid}>
                      {[
                        { name: 'Cloud', emoji: '☁' },
                        { name: 'Wave', emoji: '🌊' },
                        { name: 'Fire', emoji: '🔥' },
                        { name: 'Rock', emoji: '🪨' },
                        { name: 'Storm', emoji: '⛈' },
                        { name: 'Shadow', emoji: '👤' },
                      ].map((item) => {
                        const isSelected = fearShape === item.name;
                        return (
                          <TouchableOpacity
                            key={item.name}
                            onPress={() => {
                              triggerHaptic('light');
                              setFearShape(item.name);
                            }}
                            style={[styles.glassShapeCard, isSelected && styles.glassShapeCardActive]}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.shapeCardEmoji}>{item.emoji}</Text>
                            <Text style={[styles.shapeCardLabel, isSelected && { color: COLORS.white }]}>{item.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(5)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 1 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 8 && (
                <View style={styles.screenWrapper}>
                  {/* Leaves flying layer */}
                  <FlyingLeaves width={windowWidth} height={windowHeight} />

                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>Watch it pass...</Text>
                    <Text style={styles.screenSubtitle}>Nothing lasts forever.</Text>
                  </View>

                  <View style={styles.centerSection}>
                    {/* Animated drifting cloud */}
                    <View style={styles.driftingCloudTrack}>
                      <Animated.View style={[styles.driftingCloudIcon, cloudAnimatedStyle]}>
                        {fearShape === 'Cloud' && <Ionicons name="cloudy" size={80} color="rgba(139, 92, 246, 0.45)" />}
                        {fearShape === 'Wave' && <Feather name="activity" size={80} color="rgba(139, 92, 246, 0.45)" />}
                        {fearShape === 'Fire' && <Ionicons name="flame-outline" size={80} color="rgba(139, 92, 246, 0.45)" />}
                        {fearShape === 'Rock' && <Feather name="box" size={80} color="rgba(139, 92, 246, 0.45)" />}
                        {fearShape === 'Storm' && <Ionicons name="thunderstorm-outline" size={80} color="rgba(139, 92, 246, 0.45)" />}
                        {fearShape === 'Shadow' && <Feather name="eye-off" size={80} color="rgba(139, 92, 246, 0.45)" />}
                      </Animated.View>
                    </View>

                    <Text style={styles.passInstructionText}>Even fear changes.</Text>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(5)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 2 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 9 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>What do you want to remind yourself?</Text>
                  </View>

                  <View style={styles.centerSection}>
                    <ScrollView style={styles.cardsScrollView} showsVerticalScrollIndicator={false}>
                      {[
                        { text: 'I am safe in this moment.', icon: 'shield' },
                        { text: 'This feeling will pass.', icon: 'wind' },
                        { text: 'I can handle hard things.', icon: 'heart' },
                      ].map((item) => {
                        const isSelected = selectedReminder === item.text && !showCustomInput;
                        return (
                          <TouchableOpacity
                            key={item.text}
                            onPress={() => {
                              triggerHaptic('light');
                              setSelectedReminder(item.text);
                              setShowCustomInput(false);
                            }}
                            style={[styles.reminderGlassCardItem, isSelected && styles.reminderGlassCardActive]}
                            activeOpacity={0.8}
                          >
                            <View style={styles.reminderCardLeft}>
                              <Feather name={item.icon as any} size={18} color={isSelected ? COLORS.white : COLORS.purple} />
                              <Text style={[styles.reminderCardLabelText, isSelected && { color: COLORS.white }]}>{item.text}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Custom reminder card option */}
                      {showCustomInput ? (
                        <View style={styles.customReminderInputWrapper}>
                          <TextInput
                            style={styles.customReminderField}
                            placeholder="Type reminder..."
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            value={customReminderInput}
                            onChangeText={setCustomReminderInput}
                          />
                          <TouchableOpacity 
                            onPress={() => {
                              if (customReminderInput.trim()) {
                                setSelectedReminder(customReminderInput);
                                triggerHaptic('light');
                              }
                            }} 
                            style={styles.customReminderSaveBtn}
                          >
                            <Feather name="check" size={16} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => {
                            triggerHaptic('light');
                            setShowCustomInput(true);
                          }} 
                          style={styles.addCustomCardBtn}
                          activeOpacity={0.8}
                        >
                          <Feather name="edit-2" size={16} color={COLORS.textDim} />
                          <Text style={styles.addCustomCardText}>Add your own reminder</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(5)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 3 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 10 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.headingSection}>
                    <Text style={styles.screenHeading}>Today I noticed...</Text>
                  </View>

                  <View style={styles.centerSection}>
                    <View style={styles.checklistWrapper}>
                      {[
                        { key: 'real', text: "My fear was real, and that's okay." },
                        { key: 'stayed', text: "I stayed with it, instead of avoiding it." },
                        { key: 'noChange', text: "I didn't try to change it." },
                      ].map((item) => {
                        const isChecked = reflectionChecks[item.key];
                        return (
                          <TouchableOpacity
                            key={item.key}
                            onPress={() => {
                              triggerHaptic('light');
                              setReflectionChecks(prev => ({
                                ...prev,
                                [item.key]: !isChecked
                              }));
                            }}
                            style={[styles.checklistGlassRow, isChecked && styles.checklistGlassRowActive]}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.checkboxOutline, isChecked && styles.checkboxActive]}>
                              {isChecked && <Feather name="check" size={12} color={COLORS.white} />}
                            </View>
                            <Text style={[styles.checklistRowText, isChecked && { color: COLORS.white }]}>{item.text}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleCompleteTask}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.progressDotsContainer, { marginTop: 24 }]}>
                      {[...Array(5)].map((_, idx) => (
                        <View key={idx} style={[styles.dot, idx === 4 && styles.dotActive]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {step === 11 && (
                <View style={styles.screenWrapper}>
                  <View style={styles.centerSection}>
                    {/* Checkmark expanding glow animation */}
                    <View style={styles.compGlowBase}>
                      <Animated.View style={[styles.compGlowRipple, completionGlowStyle]} />
                      <View style={styles.compCheckCircle}>
                        <Feather name="check" size={36} color={COLORS.white} />
                      </View>
                    </View>

                    <Text style={styles.compTitleText}>Observation Complete</Text>
                    
                    <Text style={styles.compMessageDesc}>
                      Fear was acknowledged.{"\n"}
                      Not defeated.{"\n"}
                      Not ignored.{"\n"}
                      Simply noticed.
                    </Text>
                  </View>

                  <View style={styles.buttonSection}>
                    <TouchableOpacity
                      onPress={handleNextStep}
                      style={styles.primaryActionBtn}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.actionBtnGradient}>
                        <Text style={styles.actionBtnText}>Continue</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {step === 12 && (
                <View style={styles.screenWrapper}>
                  {/* Sunrise warm background layout */}
                  <LinearGradient
                    colors={['#FDBA74', '#F59E0B', '#8B5CF6', COLORS.deepBlack]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                  />

                  {/* Silhouette mountain layer in completion */}
                  <View style={{ position: 'absolute', bottom: 120, width: '100%', alignItems: 'center' }}>
                    <Feather name="triangle" size={160} color="rgba(9, 10, 20, 0.4)" style={{ transform: [{ scaleY: 0.6 }] }} />
                  </View>

                  <View style={[StyleSheet.absoluteFillObject, { paddingHorizontal: 24, justifyContent: 'space-between', zIndex: 10 }]}>
                    <View />

                    <View style={styles.screenCenter}>
                      <Text style={styles.immersiveTitle}>Well Done!</Text>
                      
                      <Text style={[styles.immersiveSubtitle, { color: COLORS.white, opacity: 0.95 }]}>
                        You showed up for yourself.{"\n"}That's something to be proud of.
                      </Text>

                      {/* Reward Card */}
                      <BlurView intensity={25} tint="dark" style={styles.rewardGlassCard}>
                        <Text style={styles.rewardCardTitle}>Reward Earned</Text>
                        <Text style={styles.rewardCardValue}>✨ +{pointsAwarded} Mind Points</Text>
                        
                        <View style={styles.badgeContainer}>
                          <Feather name="award" size={14} color={COLORS.amber} />
                          <Text style={styles.badgeText}>Fear Observer</Text>
                        </View>
                      </BlurView>
                    </View>

                    <View style={styles.buttonSection}>
                      <TouchableOpacity 
                        onPress={handleFinish} 
                        activeOpacity={0.8}
                        style={[styles.primaryActionBtn, { shadowColor: COLORS.amber }]}
                      >
                        <LinearGradient colors={[COLORS.amber, COLORS.purple]} style={styles.actionBtnGradient}>
                          <Text style={styles.actionBtnText}>Finish</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

          </SafeAreaView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportWrapper: {
    flex: 1,
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  headerBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  introTopSpace: {
    height: '25%',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingSection: {
    marginTop: 20,
    width: '100%',
  },
  screenHeading: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  screenSubtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  immersiveTitle: {
    color: COLORS.textWhite,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
  },
  titleDivider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.purple,
    borderRadius: 2,
    marginVertical: 18,
    alignSelf: 'center',
  },
  immersiveSubtitle: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonSection: {
    width: '100%',
    marginBottom: 10,
  },
  glowingGlassBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 6,
  },
  glassBtnBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  orbHitbox: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbCore: {
    width: '45%',
    height: '45%',
    borderRadius: 99,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tapOrbLabel: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 30,
    letterSpacing: 0.5,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: COLORS.purple,
    width: 12,
  },
  glassTextareaCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: 16,
  },
  textareaInput: {
    color: COLORS.textWhite,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 140,
  },
  charCounterText: {
    color: COLORS.textDim,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '600',
  },
  primaryActionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  circularMeter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  meterValueText: {
    color: COLORS.textWhite,
    fontSize: 32,
    fontWeight: '800',
  },
  meterLabelText: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  numericRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 34,
  },
  numericItemBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numericItemActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
    width: 52,
    borderRadius: 12,
  },
  numericItemText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  judgeSubtext: {
    color: COLORS.textDim,
    fontSize: 13,
    marginTop: 28,
    letterSpacing: 0.5,
  },
  silhouetteWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotAnchor: {
    position: 'absolute',
  },
  silhouetteHotspot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  silhouetteHotspotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  hotspotChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    width: '90%',
  },
  hotspotChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    margin: 3,
  },
  hotspotChipActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  hotspotChipText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  bodyInstructionText: {
    color: COLORS.textDim,
    fontSize: 12,
    marginTop: 24,
    letterSpacing: 0.5,
  },
  cloudIllustrationWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokeCloudBall: {
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  glassChipItem: {
    width: '28%',
    margin: '2%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  glassChipActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  glassChipText: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  shapeCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  glassShapeCard: {
    width: '28%',
    margin: '2%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassShapeCardActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  shapeCardEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  shapeCardLabel: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  driftingCloudTrack: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  driftingCloudIcon: {
    position: 'absolute',
    left: -100,
  },
  passInstructionText: {
    color: COLORS.textDim,
    fontSize: 13,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  cardsScrollView: {
    width: '100%',
    maxHeight: 240,
  },
  reminderGlassCardItem: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  reminderGlassCardActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  reminderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderCardLabelText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 12,
  },
  customReminderInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  customReminderField: {
    flex: 1,
    color: COLORS.textWhite,
    fontSize: 13,
  },
  customReminderSaveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 14,
    marginTop: 4,
  },
  addCustomCardText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  checklistWrapper: {
    width: '100%',
  },
  checklistGlassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 8,
  },
  checklistGlassRowActive: {
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  checkboxOutline: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.purple,
  },
  checklistRowText: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 12,
  },
  compGlowBase: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compGlowRipple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  compCheckCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    backgroundColor: 'rgba(9, 10, 20, 0.8)',
  },
  compTitleText: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 24,
  },
  compMessageDesc: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    fontWeight: '500',
  },
  rewardGlassCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: '100%',
    marginTop: 28,
    alignItems: 'center',
  },
  rewardCardTitle: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardCardValue: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginTop: 12,
  },
  badgeText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  glowingMoonContainer: {
    position: 'absolute',
    top: 50,
    right: 40,
    opacity: 0.15,
  },
  glowingMoon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  ambientParticle: {
    position: 'absolute',
    borderRadius: 99,
  },
  leafWrapper: {
    position: 'absolute',
  },
});
