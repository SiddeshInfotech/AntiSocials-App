import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

const HERO_EAT_IMAGE = require('../assets/images/make_it_9_16_image_2K_202608051427.jpeg');
const EAT_VIDEO_BACKGROUND = require('../assets/videos/Eating_food_consciously_202608051401.mp4');

export default function EatTaskScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Page Step: 1: Introduction | 2: Mindful Bite Experience | 3: Share Moment | 4: Completion
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Page 3 State: Image Upload & Optional Note
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [reflectionNote, setReflectionNote] = useState<string>('');

  // Page 4 State: Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Page 1 Gentle Floating Movement for hero image
  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(7, { duration: 2800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { scale: glowScale.value }],
  }));

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  }, []);

  // Image Picker for Page 3
  const handlePickImage = async () => {
    triggerHaptic('light');
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access camera roll is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMealImage(result.assets[0].uri);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error('Image picker error:', e);
    }
  };

  // Complete Task Backend Integration (Page 4)
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
          body: JSON.stringify({
            task_name: 'Eat one bite consciously',
            note: reflectionNote,
            meal_image: mealImage,
          }),
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '10',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0',
          };
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

  // Dimensions for hero image card on Page 1
  const heroWidth = Math.min(width * 0.65, 230);
  const heroHeight = Math.round(heroWidth * 1.35);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* ========================================================
          PAGE 1 — INTRODUCTION SCREEN (EXACT UNTOUCHED DESIGN)
         ======================================================== */}
      {step === 1 && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* CLEAN BRIGHT WARM CREAM / WHITE BACKGROUND */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FAF8F5' }]} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <Animated.View entering={FadeIn.duration(600)} style={styles.flexContentWrapper}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.introScrollContent}>
                {/* Top Navigation Row */}
                <View style={styles.navRow}>
                  <TouchableOpacity style={styles.iconCircleBtn} onPress={() => router.back()} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1C1917" />
                  </TouchableOpacity>
                </View>

                {/* Top Section: Typography */}
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.serifMainTitle}>Eat One Bit</Text>
                  <Text style={styles.serifMainSubTitle}>Consciously</Text>
                  <Text style={styles.headerSubtitle}>
                    Slow down. Savor. Be present.{"\n"}
                    Turn one bite into a mindful moment.
                  </Text>
                </View>

                {/* Center Area: Central Hero Object (Food Bite on Fork) */}
                <View style={styles.heroCenterContainer}>
                  <Animated.View
                    style={[
                      styles.foodHeroCard,
                      { width: heroWidth, height: heroHeight },
                      animatedHeroStyle,
                    ]}
                  >
                    <Image
                      source={HERO_EAT_IMAGE}
                      style={styles.heroFoodImage}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </View>
              </ScrollView>

              {/* Bottom Button */}
              <View style={styles.bottomBarArea}>
                <TouchableOpacity
                  style={styles.blackPillBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    setStep(2);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.blackBtnText}>Begin Mindful Bite   →</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}

      {/* ========================================================
          PAGE 2 — MINDFUL BITE EXPERIENCE (BRIGHT VIDEO + 6 STEPS)
         ======================================================== */}
      {step === 2 && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Full-Screen Video Background */}
          <Video
            source={EAT_VIDEO_BACKGROUND}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />

          {/* Very Light Warm Translucent Gradient Overlay for Maximum Video Brightness */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.40)',
              'rgba(255, 255, 255, 0.10)',
              'rgba(255, 255, 255, 0.20)',
              'rgba(255, 255, 255, 0.50)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={styles.flexContentWrapper}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.introScrollContent}>
                {/* Top Navigation Row */}
                <View style={styles.navRow}>
                  <TouchableOpacity style={styles.iconCircleBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1C1917" />
                  </TouchableOpacity>
                </View>

                {/* Header Titles */}
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.page2Title}>Take One Small Bite</Text>
                  <Text style={styles.page2Subtitle}>Slow down. Notice. Experience.</Text>
                </View>

                {/* Animated 6-Step Mindful Instruction Card */}
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.instructionGlassCard}>
                  <View style={styles.instructionHeaderRow}>
                    <View style={styles.forkBadgeCircle}>
                      <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#1C1917" />
                    </View>
                    <Text style={styles.instructionCardTitle}>Mindful Bite Guidance</Text>
                  </View>

                  <View style={styles.stepsListWrapper}>
                    <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>🥢</Text>
                      <Text style={styles.stepItemText}>Pick one small bite.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>👁️</Text>
                      <Text style={styles.stepItemText}>Look at the food carefully.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>👃</Text>
                      <Text style={styles.stepItemText}>Smell it before eating.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>🧘</Text>
                      <Text style={styles.stepItemText}>Chew slowly.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(700).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>😋</Text>
                      <Text style={styles.stepItemText}>Notice the taste and texture.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(800).duration(400)} style={styles.stepItemRow}>
                      <Text style={styles.stepItemEmoji}>✨</Text>
                      <Text style={styles.stepItemText}>Swallow mindfully.</Text>
                    </Animated.View>
                  </View>
                </Animated.View>
              </ScrollView>

              {/* Bottom Button */}
              <View style={styles.bottomBarArea}>
                <TouchableOpacity
                  style={styles.blackPillBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    setStep(3);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.blackBtnText}>Continue Mindful Eating →</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}

      {/* ========================================================
          PAGE 3 — SHARE YOUR FOOD MOMENT (PHOTO + REFLECTION)
         ======================================================== */}
      {step === 3 && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FAF8F5' }]} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(400)} style={styles.flexContentWrapper}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.introScrollContent}>
                {/* Top Navigation Row */}
                <View style={styles.navRow}>
                  <TouchableOpacity style={styles.iconCircleBtn} onPress={() => setStep(2)} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1C1917" />
                  </TouchableOpacity>
                </View>

                {/* Header Titles */}
                <View style={styles.headerTextWrapper}>
                  <Text style={styles.page2Title}>What Did You Eat?</Text>
                  <Text style={styles.page2Subtitle}>Capture this mindful moment.</Text>
                </View>

                {/* Main Experience: Photo Upload Glass Card */}
                <TouchableOpacity
                  style={styles.uploadCardContainer}
                  onPress={handlePickImage}
                  activeOpacity={0.88}
                >
                  {mealImage ? (
                    <View style={styles.uploadedImageWrapper}>
                      <Image source={{ uri: mealImage }} style={styles.uploadedMealImage} resizeMode="cover" />
                      <View style={styles.uploadedBadgeBar}>
                        <View style={styles.badgeTagGreen}>
                          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                          <Text style={styles.badgeTagGreenText}>Meal captured ✓</Text>
                        </View>
                        <View style={styles.badgeTagPurple}>
                          <Text style={styles.badgeTagPurpleText}>Mindful moment saved</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyUploadBox}>
                      <Animated.View entering={ZoomIn.duration(500)} style={styles.cameraIconCircle}>
                        <Feather name="camera" size={26} color="#1C1917" />
                      </Animated.View>
                      <Text style={styles.uploadMainText}>Share a photo of your meal</Text>
                      <Text style={styles.uploadSubText}>Tap to open camera or gallery</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Optional Reflection Input */}
                <View style={styles.reflectionCardContainer}>
                  <Text style={styles.reflectionLabel}>What did you notice about this bite? (Optional)</Text>
                  <TextInput
                    style={styles.reflectionInput}
                    placeholder="E.g. It was sweet, crisp, and comforting..."
                    placeholderTextColor="rgba(28, 25, 23, 0.4)"
                    maxLength={100}
                    value={reflectionNote}
                    onChangeText={setReflectionNote}
                    multiline
                  />
                  <Text style={styles.charCountText}>{reflectionNote.length} / 100</Text>
                </View>
              </ScrollView>

              {/* Bottom Button */}
              <View style={styles.bottomBarArea}>
                <TouchableOpacity
                  style={styles.blackPillBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    setStep(4);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.blackBtnText}>Complete Moment →</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}

      {/* ========================================================
          PAGE 4 — COMPLETION SCREEN
         ======================================================== */}
      {step === 4 && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FAF8F5' }]} />

          <SafeAreaView style={styles.screenWrapper} edges={['top', 'bottom']}>
            <Animated.View entering={FadeIn.duration(800)} style={styles.flexContentWrapper}>
              <View style={styles.completionCenterContent}>
                {/* Large Glowing Check Animation */}
                <Animated.View entering={ZoomIn.duration(700)} style={styles.completionGlowCircle}>
                  <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
                </Animated.View>

                <Text style={styles.completionTitle}>Mindful Bite Complete</Text>
                <Text style={styles.completionSub}>
                  "You slowed down, noticed your food, and created a healthier connection with eating."
                </Text>

                {/* Reward Card */}
                <View style={styles.rewardCardWrapper}>
                  <View style={styles.rewardHeaderRow}>
                    <Text style={{ fontSize: 22 }}>🍽️</Text>
                    <Text style={styles.rewardTitle}>Mindful Eating</Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>+10 Points</Text>
                    </View>
                  </View>

                  <View style={styles.dividerLine} />

                  {/* Achievement Unlocked */}
                  <View style={styles.achievementSection}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={{ fontSize: 18 }}>🌱</Text>
                      <Text style={styles.achievementLabel}>Achievement Unlocked</Text>
                    </View>
                    <Text style={styles.achievementName}>Present Eater</Text>
                    <Text style={styles.achievementDesc}>
                      "You turned a simple bite into a moment of awareness."
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Action */}
              <View style={styles.bottomBarArea}>
                <TouchableOpacity
                  style={styles.blackPillBtn}
                  onPress={completeTaskBackend}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.blackBtnText}>Continue Journey →</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  screenWrapper: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  flexContentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  introScrollContent: {
    paddingBottom: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    height: 44,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTextWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  serifMainTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: '#1C1917',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  serifMainSubTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(28, 25, 23, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  heroCenterContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  foodHeroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.06)',
  },
  heroFoodImage: {
    width: '100%',
    height: '100%',
  },
  bottomBarArea: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    marginTop: 10,
  },
  blackPillBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    backgroundColor: '#000000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  blackBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Page 2 Styles
  page2Title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  page2Subtitle: {
    fontSize: 14,
    color: '#1C1917',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  instructionGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  instructionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  forkBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
  },
  instructionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },
  stepsListWrapper: {
    gap: 10,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.05)',
  },
  stepItemEmoji: {
    fontSize: 18,
  },
  stepItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1917',
  },

  // Page 3 Styles
  uploadCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyUploadBox: {
    alignItems: 'center',
  },
  cameraIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
  },
  uploadMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 12,
    color: 'rgba(28, 25, 23, 0.5)',
  },
  uploadedImageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  uploadedMealImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 12,
  },
  uploadedBadgeBar: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeTagGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeTagGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  badgeTagPurple: {
    backgroundColor: '#faf5ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeTagPurpleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9333ea',
  },

  reflectionCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },
  reflectionInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1C1917',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCountText: {
    fontSize: 10,
    color: 'rgba(28, 25, 23, 0.4)',
    textAlign: 'right',
    marginTop: 6,
  },

  // Page 4 Styles
  completionCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  completionGlowCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSub: {
    fontSize: 14,
    color: 'rgba(28, 25, 23, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rewardCardWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(28, 25, 23, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.06)',
    marginVertical: 14,
  },
  achievementSection: {
    gap: 4,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: 'rgba(28, 25, 23, 0.65)',
    lineHeight: 18,
    marginTop: 2,
  },
});
