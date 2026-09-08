import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { apiFetch } from '../constants/Api';

const REFERENCE_IMAGE = require('../assets/images/Gemini_Generated_Image_akyus8akyus8akyu.png');

const COLORS = {
  bgCream: '#FFFDF9',
  bgBeige: '#FDF6EC',
  bgSky: '#EEF6FF',
  primary: '#16342F', // Forest Teal
  accent: '#D4AF37',  // Gold
  textDark: '#1E293B',
  textGray: '#64748B',
  whiteGlass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(22, 52, 47, 0.1)',
  activeGreen: '#10B981',
};

const TOPICS = [
  { id: 'env', emoji: '🌱', title: 'Environment', desc: "Reflect on our planet's future and sustainability." },
  { id: 'anim', emoji: '🐾', title: 'Animals', desc: 'Explore our bond and harmony with the animal kingdom.' },
  { id: 'nat', emoji: '🌿', title: 'Nature', desc: 'Describe the serenity and lessons of natural spaces.' },
  { id: 'habits', emoji: '💙', title: 'Good Habits', desc: 'The power of daily consistency and positive routines.' },
  { id: 'read', emoji: '📚', title: 'Importance of Reading', desc: 'How books expand our horizons and spark creativity.' },
];

const HANDWRITING_SAMPLES = [
  { id: 'sample1', name: 'Warm Sepia Ink', preview: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=500&auto=format&fit=crop&q=60' },
  { id: 'sample2', name: 'Classic Fountain Pen', preview: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60' },
  { id: 'sample3', name: 'Pencil Journal Notes', preview: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&auto=format&fit=crop&q=60' },
];

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

export default function HardestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Desktop width limits
  const isDesktop = width > 768;
  const containerWidth = isDesktop ? 650 : width;

  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState<'intro' | 'loading' | 'success'>('intro');

  // Interactive configurations
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [tempCapturedPhoto, setTempCapturedPhoto] = useState<string | null>(null);
  const [showSimulatedCamera, setShowSimulatedCamera] = useState(false);

  // Animated Shared Values
  const notebookFold = useSharedValue(1.0);
  const notebookRotate = useSharedValue(0);
  const checkmarkScale = useSharedValue(0);
  const particlesY = useSharedValue(height);
  const successOpacity = useSharedValue(0);
  const successScale = useSharedValue(0.9);

  // Floating paper sparks
  const paper1X = useSharedValue(10);
  const paper1Y = useSharedValue(120);
  const paper2X = useSharedValue(-20);
  const paper2Y = useSharedValue(150);

  // Points metadata
  const [pointsAdded, setPointsAdded] = useState(300);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  // Load persistence progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/tasks/hardest/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success && data.progress) {
          const progress = data.progress;
          if (progress.selectedTopic) setSelectedTopic(progress.selectedTopic);
          if (progress.uploadedImage) setUploadedImage(progress.uploadedImage);
          if (progress.completed) setSessionState('success');
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
  const saveProgress = async (completed: boolean, currentTopic = selectedTopic, currentImg = uploadedImage) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      await apiFetch('/api/tasks/hardest/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed,
          progressPayload: {
            selectedTopic: currentTopic,
            uploadedImage: currentImg,
            completed,
          }
        })
      });
    } catch (err) {
      console.warn('Error saving progress:', err);
    }
  };

  const handleSelectTopic = (id: string) => {
    setSelectedTopic(id);
    triggerHaptic('light');
    saveProgress(false, id, uploadedImage);
  };

  const openCamera = async () => {
    triggerHaptic('light');

    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera permission is required to capture your handwritten essay.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTempCapturedPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("Camera not available on simulator, launching mock camera:", err);
      // Open simulated camera overlay
      setShowSimulatedCamera(true);
    }
  };

  const handleSimulateCapture = () => {
    triggerHaptic('success');

    // Pick one of the samples randomly
    const idx = Math.floor(Math.random() * HANDWRITING_SAMPLES.length);
    const sampleUri = HANDWRITING_SAMPLES[idx].preview;

    setTempCapturedPhoto(sampleUri);
    setShowSimulatedCamera(false);
  };

  const handleUsePhoto = () => {
    triggerHaptic('success');

    // Simulate image quality blurry check (15% chance)
    const isBlurry = Math.random() < 0.15;
    if (isBlurry) {
      Alert.alert(
        "Image Blurry",
        "Please capture a clear photo of your handwritten essay.",
        [{ text: "Retake", onPress: () => openCamera() }]
      );
      return;
    }

    setUploadedImage(tempCapturedPhoto);
    setTempCapturedPhoto(null);
    saveProgress(false, selectedTopic, tempCapturedPhoto);
  };

  const handleRetakePhoto = () => {
    openCamera();
  };

  const handleRemovePhoto = () => {
    setUploadedImage(null);
    triggerHaptic('light');
    saveProgress(false, selectedTopic, null);
  };

  const handleCompleteChallenge = () => {
    if (!selectedTopic || !uploadedImage) return;
    triggerHaptic('medium');
    setSessionState('loading');

    // Notebook folding/closing animation sequence
    notebookFold.value = withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) });
    notebookRotate.value = withTiming(-15, { duration: 800 });

    // Golden checkmark fades in
    checkmarkScale.value = withDelay(
      600,
      withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 200 })
      )
    );

    // Floating paper particles ascending
    particlesY.value = withTiming(-150, { duration: 1800, easing: Easing.out(Easing.cubic) });
    paper1X.value = withTiming(40, { duration: 1800 });
    paper1Y.value = withTiming(-100, { duration: 1800 });
    paper2X.value = withTiming(-50, { duration: 1600 });
    paper2Y.value = withTiming(-130, { duration: 1600 });

    setTimeout(() => {
      executeCompleteChallenge();
    }, 2000);
  };

  const executeCompleteChallenge = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      // Save complete progress payload
      await saveProgress(true);

      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskName: 'Start Hardest Task',
          task_name: 'Start Hardest Task',
          taskTitle: 'Start Hardest Task'
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        setPointsAdded(data.pointsAdded || 300);
        setTotalPoints(data.totalPoints || 0);
        setStreakCount(data.streak || 0);
      }

      triggerHaptic('success');
      setSessionState('success');

      // Success card fade in
      successOpacity.value = withTiming(1.0, { duration: 600 });
      successScale.value = withTiming(1.0, { duration: 600, easing: Easing.out(Easing.back()) });
    } catch (err) {
      console.warn('Error completing essay challenge:', err);
      // Fallback transition
      setSessionState('success');
      successOpacity.value = withTiming(1.0, { duration: 600 });
      successScale.value = withTiming(1.0, { duration: 600, easing: Easing.out(Easing.back()) });
    }
  };

  const handleContinue = () => {
    triggerHaptic('success');
    router.replace({
      pathname: '/task-success',
      params: {
        type: 'breathing',
        points: pointsAdded.toString(),
        totalPoints: totalPoints.toString(),
        streak: streakCount.toString(),
      }
    } as any);
  };

  // Reanimated style bindings
  const animatedNotebookStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: notebookFold.value },
      { rotate: `${notebookRotate.value}deg` },
    ],
    opacity: notebookFold.value,
  }));

  const animatedCheckmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
    opacity: checkmarkScale.value > 0.05 ? 1 : 0,
  }));

  const animatedParticlesStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: paper1X.value },
      { translateY: particlesY.value + paper1Y.value },
    ],
    opacity: withDelay(800, withTiming(0, { duration: 1000 })),
  }));

  const animatedParticlesStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: paper2X.value },
      { translateY: particlesY.value + paper2Y.value },
    ],
    opacity: withDelay(800, withTiming(0, { duration: 1000 })),
  }));

  const successCardStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calming your mind...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Warm background gradient layers */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={[COLORS.bgCream, COLORS.bgBeige, COLORS.bgSky]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Desktop Wrapper boundaries */}
      <View style={[styles.viewportWrapper, { width: containerWidth }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

          {/* HEADER */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Feather name="arrow-left" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Daily Essay</Text>

            <View style={{ width: 40 }} />
          </View>

          {sessionState !== 'success' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

              {/* ILLUSTRATION & TITLES */}
              <View style={styles.topSection}>
                <Image source={REFERENCE_IMAGE} style={styles.headerRefImage} resizeMode="cover" />
                <View style={styles.notebookIconFloat}>
                  <Ionicons name="journal-outline" size={28} color={COLORS.primary} />
                </View>

                <Text style={styles.titleText}>Write an Essay</Text>
                <Text style={styles.subtitleText}>
                  Choose one topic, write it by hand, then take a clear photo using your camera.
                </Text>
              </View>

              {/* MAIN TOPIC CARD */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Choose Your Topic</Text>

                <View style={styles.topicsList}>
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic.id;
                    return (
                      <TouchableOpacity
                        key={topic.id}
                        onPress={() => handleSelectTopic(topic.id)}
                        activeOpacity={0.8}
                        style={[styles.topicRowBtn, isSelected && styles.topicRowBtnActive]}
                      >
                        <View style={styles.topicRowLeft}>
                          <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                          <View style={styles.topicTextContainer}>
                            <Text style={styles.topicName}>{topic.title}</Text>
                            <Text style={styles.topicDesc}>{topic.desc}</Text>
                          </View>
                        </View>
                        <View style={styles.radioContainer}>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={isSelected ? COLORS.primary : COLORS.textGray}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* CAMERA CAPTURE SECTION */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Handwritten Work</Text>

                {!uploadedImage && !tempCapturedPhoto && (
                  <View style={styles.cameraCaptureBox}>
                    <View style={styles.uploadIconBackground}>
                      <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                    </View>
                    <Text style={styles.cameraCaptureTitleText}>Capture Your Handwritten Essay</Text>
                    <Text style={styles.cameraCaptureSubText}>
                      Write your essay on paper, then take a clear photo using your camera.
                    </Text>

                    <TouchableOpacity
                      onPress={openCamera}
                      activeOpacity={0.8}
                      style={styles.openCameraBtn}
                    >
                      <Feather name="camera" size={16} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.openCameraBtnText}>Open Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Captured Photo Verification Preview */}
                {tempCapturedPhoto && !uploadedImage && (
                  <View style={styles.previewContainer}>
                    <View style={styles.linedPaperBase}>
                      <View style={styles.paperRedLine} />
                      <View style={styles.paperBlueLinesGrid}>
                        {[...Array(6)].map((_, i) => <View key={i} style={styles.paperBlueLine} />)}
                      </View>
                      <Image source={{ uri: tempCapturedPhoto }} style={styles.previewImage} resizeMode="cover" />
                    </View>

                    <View style={styles.previewControls}>
                      <TouchableOpacity
                        onPress={handleRetakePhoto}
                        activeOpacity={0.7}
                        style={[styles.controlBtn, styles.controlBtnDanger]}
                      >
                        <Feather name="refresh-cw" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={[styles.controlBtnText, { color: '#EF4444' }]}>Retake Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleUsePhoto}
                        activeOpacity={0.7}
                        style={[styles.controlBtn, styles.controlBtnSuccess]}
                      >
                        <Feather name="check" size={14} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={[styles.controlBtnText, { color: '#FFF' }]}>Use This Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Confirmed / Approved Image state */}
                {uploadedImage && (
                  <View style={styles.previewContainer}>
                    <View style={styles.linedPaperBase}>
                      <View style={styles.paperRedLine} />
                      <View style={styles.paperBlueLinesGrid}>
                        {[...Array(6)].map((_, i) => <View key={i} style={styles.paperBlueLine} />)}
                      </View>
                      <Image source={{ uri: uploadedImage }} style={styles.previewImage} resizeMode="cover" />
                    </View>

                    <View style={styles.previewControls}>
                      <TouchableOpacity
                        onPress={openCamera}
                        activeOpacity={0.7}
                        style={styles.controlBtn}
                      >
                        <Feather name="camera" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.controlBtnText}>Retake Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleRemovePhoto}
                        activeOpacity={0.7}
                        style={[styles.controlBtn, styles.controlBtnDanger]}
                      >
                        <Feather name="trash-2" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                        <Text style={[styles.controlBtnText, { color: '#EF4444' }]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* COMPLETE CHALLENGE ACTION BUTTON */}
              <View style={styles.actionBtnWrapper}>
                {sessionState === 'loading' ? (
                  // Closing Animation views placeholder
                  <View style={styles.animationScene}>
                    <Animated.View style={[styles.animNotebook, animatedNotebookStyle]}>
                      <View style={styles.linedPaperBase}>
                        <View style={styles.paperRedLine} />
                        {[...Array(5)].map((_, i) => <View key={i} style={styles.paperBlueLine} />)}
                      </View>
                    </Animated.View>

                    {/* Golden checkmark overlay */}
                    <Animated.View style={[styles.animCheckmark, animatedCheckmarkStyle]}>
                      <Ionicons name="checkmark-circle" size={54} color={COLORS.accent} style={styles.checkmarkGlow} />
                    </Animated.View>

                    {/* Floating paper sparks */}
                    <Animated.View style={[styles.paperSpark, animatedParticlesStyle1]}>
                      <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                    </Animated.View>
                    <Animated.View style={[styles.paperSpark, animatedParticlesStyle2]}>
                      <Ionicons name="document-outline" size={18} color={COLORS.primary} />
                    </Animated.View>

                    <Text style={styles.animationText}>Closing Notebook...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleCompleteChallenge}
                    disabled={!selectedTopic || !uploadedImage}
                    activeOpacity={0.85}
                    style={[
                      styles.completePillBtn,
                      (!selectedTopic || !uploadedImage) && { opacity: 0.45 }
                    ]}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, '#2D6A4F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtnContent}
                    >
                      <Text style={styles.btnText}>Complete Challenge</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView>
          ) : (
            // SUCCESS SCREEN CARD
            <Animated.View style={[styles.successContainer, successCardStyle]}>
              <View style={styles.successCard}>

                {/* Large open book / essay success illustration */}
                <View style={styles.successIconOuterCircle}>
                  <View style={styles.successIconInnerCircle}>
                    <Ionicons name="book" size={56} color={COLORS.primary} />
                  </View>
                  <View style={[styles.successSparkleDecor, { top: 0, right: 10 }]}>
                    <Ionicons name="sparkles" size={16} color={COLORS.accent} />
                  </View>
                  <View style={[styles.successSparkleDecor, { bottom: 10, left: 0 }]}>
                    <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                  </View>
                </View>

                <Text style={styles.successTitle}>Excellent Work!</Text>

                <Text style={styles.successSubtitle}>
                  Writing regularly strengthens your focus, creativity, and thinking skills.
                </Text>

                {/* Reward Badge */}
                <View style={styles.rewardBadge}>
                  <MaterialCommunityIcons name="feather" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.rewardBadgeText}>+1 Writing Habit</Text>
                </View>

              </View>

              {/* CONTINUE BUTTON */}
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  style={styles.completePillBtn}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#2C5E4E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtnContent}
                  >
                    <Text style={styles.btnText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* SIMULATED CAMERA VIEWPORT OVERLAY */}
          <Modal
            visible={showSimulatedCamera}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSimulatedCamera(false)}
          >
            <View style={styles.cameraSimulatorContainer}>
              {/* Viewfinder Grid */}
              <View style={styles.cameraViewfinder}>
                <View style={styles.cameraFocusBox}>
                  <View style={[styles.focusCorner, styles.focusTopLeft]} />
                  <View style={[styles.focusCorner, styles.focusTopRight]} />
                  <View style={[styles.focusCorner, styles.focusBottomLeft]} />
                  <View style={[styles.focusCorner, styles.focusBottomRight]} />
                </View>

                <Text style={styles.cameraHintText}>Align your handwritten paper within the frame</Text>
              </View>

              {/* Shutter Bar */}
              <View style={styles.shutterBar}>
                <TouchableOpacity
                  onPress={() => setShowSimulatedCamera(false)}
                  style={styles.cameraCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSimulateCapture}
                  style={styles.shutterBtnTouch}
                >
                  <View style={styles.shutterBtnInner} />
                </TouchableOpacity>

                <View style={{ width: 40 }} />
              </View>
            </View>
          </Modal>

        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textGray,
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22, 52, 47, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerRefImage: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  notebookIconFloat: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  titleText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: COLORS.textGray,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  sectionCard: {
    backgroundColor: COLORS.whiteGlass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topicsList: {
    width: '100%',
  },
  topicRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  topicRowBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(22, 52, 47, 0.04)',
  },
  topicRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
  },
  topicEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicName: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  topicDesc: {
    color: COLORS.textGray,
    fontSize: 11,
    marginTop: 2,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Upload Zone CSS
  dashedUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 52, 47, 0.02)',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 52, 47, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadTitleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  uploadSubText: {
    color: COLORS.textGray,
    fontSize: 11,
    marginTop: 4,
  },
  // Lined notebook sheet
  linedPaperBase: {
    width: '100%',
    height: 160,
    backgroundColor: '#FFFDF0',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(22, 52, 47, 0.1)',
  },
  paperRedLine: {
    position: 'absolute',
    left: 28,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    zIndex: 1,
  },
  paperBlueLinesGrid: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  paperBlueLine: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    width: '100%',
  },
  previewContainer: {
    width: '100%',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    opacity: 0.95,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 52, 47, 0.05)',
  },
  controlBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  controlBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  // Footer pill button
  actionBtnWrapper: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  completePillBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  gradientBtnContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Simulated closing scene
  animationScene: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  animNotebook: {
    width: 110,
    height: 80,
    position: 'absolute',
  },
  animCheckmark: {
    position: 'absolute',
    zIndex: 3,
  },
  checkmarkGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  paperSpark: {
    position: 'absolute',
  },
  animationText: {
    position: 'absolute',
    bottom: 12,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  // Success Card Styling
  successContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    backgroundColor: COLORS.whiteGlass,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    borderRadius: 30,
    paddingVertical: 35,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    marginBottom: 30,
  },
  successIconOuterCircle: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(22, 52, 47, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successSparkleDecor: {
    position: 'absolute',
  },
  successTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    color: COLORS.textGray,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '600',
    opacity: 0.8,
    paddingHorizontal: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  rewardBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal Backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 31, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalDescText: {
    color: COLORS.textGray,
    fontSize: 12,
    marginBottom: 20,
    lineHeight: 16,
  },
  sampleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleCard: {
    width: '31%',
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sampleImageThumbnail: {
    width: '100%',
    height: 80,
  },
  sampleCardBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#FFFDF9',
  },
  sampleCardNameText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    width: '80%',
  },
  cameraCaptureBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCaptureTitleText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  cameraCaptureSubText: {
    color: COLORS.textGray,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
    marginBottom: 16,
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  openCameraBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  controlBtnSuccess: {
    backgroundColor: COLORS.activeGreen,
  },
  cameraSimulatorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  cameraViewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 20,
    borderColor: 'rgba(0,0,0,0.8)',
  },
  cameraFocusBox: {
    width: 250,
    height: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.activeGreen,
  },
  focusTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  focusTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  focusBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  focusBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraHintText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  shutterBar: {
    height: 120,
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnTouch: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
});
