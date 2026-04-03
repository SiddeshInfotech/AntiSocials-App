import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';

// ─── Step-based mission flow ─────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    icon: 'eye' as const,
    iconLib: 'feather',
    title: 'Look Around You',
    body: 'Notice someone near you who could use a hand — a neighbour, a friend, a stranger carrying heavy bags, or someone who simply looks like they need a conversation.',
    motivational: '"Awareness is the first step to compassion."',
  },
  {
    id: 2,
    icon: 'hand-holding-heart' as const,
    iconLib: 'fa5',
    title: 'Extend Your Kindness',
    body: 'Take real action. Help them carry something, offer directions, buy them a coffee, listen to their story, or simply share a genuine smile and warm words.',
    motivational: '"Small actions create the biggest ripples."',
  },
  {
    id: 3,
    icon: 'edit-3' as const,
    iconLib: 'feather',
    title: 'Reflect & Share',
    body: 'Write about what you did and how it felt. Reflecting on kindness deepens its impact — on you and the world around you.',
    motivational: '"A single act of kindness can change someone\'s entire day."',
  },
];

const MIN_WORDS = 100;

export default function HelpTaskScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [experienceText, setExperienceText] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  // Word count
  const wordCount = experienceText.trim() === '' ? 0 : experienceText.trim().split(/\s+/).length;
  const isValid = wordCount >= MIN_WORDS;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Soft pulse on the step icon
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [currentStep]);

  // Stop speech when leaving screen or changing step
  useEffect(() => {
    return () => { Speech.stop(); };
  }, [currentStep]);

  // Handle image picking
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ── Text-to-Speech ─────────────────────────────────────────────────────────
  const toggleSpeech = async () => {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const textToRead = `${step.title}. ${step.body}`;
      Speech.speak(textToRead, {
        language: 'en',
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
      setIsSpeaking(true);
    }
  };

  // ── Step transitions ───────────────────────────────────────────────────────
  const transitionTo = (nextIndex: number) => {
    Speech.stop();
    setIsSpeaking(false);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextIndex);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── Shake animation for error ──────────────────────────────────────────────
  const triggerShake = () => {
    errorShake.setValue(0);
    Animated.sequence([
      Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!isValid) {
      setShowError(true);
      triggerShake();
      return;
    }
    setShowError(false);
    Speech.stop();
    router.replace('/help-complete');
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      transitionTo(currentStep + 1);
    }
  };

  // Gradient colours per step
  const stepColours = ['#8b5cf6', '#ec4899', '#f59e0b'];
  const accentColour = stepColours[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[`${accentColour}25`, '#131317', '#131317']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Speech.stop(); router.back(); }} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.stepDot, i <= currentStep && { backgroundColor: accentColour }]} />
          ))}
        </View>

        {/* Speaker button */}
        <TouchableOpacity onPress={toggleSpeech} style={[styles.speakerBtn, isSpeaking && { backgroundColor: `${accentColour}30`, borderColor: accentColour }]} activeOpacity={0.7}>
          <Feather name={isSpeaking ? 'volume-x' : 'volume-2'} size={20} color={isSpeaking ? accentColour : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Animated progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: accentColour,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Step content with cross-fade */}
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Step number badge */}
            <View style={[styles.stepBadge, { backgroundColor: `${accentColour}20`, borderColor: `${accentColour}50` }]}>
              <Text style={[styles.stepBadgeText, { color: accentColour }]}>STEP {step.id} OF {STEPS.length}</Text>
            </View>

            {/* Animated icon orb */}
            <Animated.View style={[styles.iconOrb, { borderColor: `${accentColour}40`, shadowColor: accentColour, transform: [{ scale: pulseAnim }] }]}>
              {step.iconLib === 'feather' ? (
                <Feather name={step.icon as any} size={38} color={accentColour} />
              ) : (
                <FontAwesome5 name={step.icon} size={34} color={accentColour} />
              )}
            </Animated.View>

            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepBody}>{step.body}</Text>

            {/* Motivational quote strip */}
            <View style={[styles.quoteStrip, { borderLeftColor: accentColour }]}>
              <Text style={styles.quoteText}>{step.motivational}</Text>
            </View>

            {/* ── Experience Writing Section (only on last step) ───────────── */}
            {isLastStep && (
              <Animated.View style={[styles.writeSection, { transform: [{ translateX: errorShake }] }]}>
                <View style={styles.writeSectionHeader}>
                  <Feather name="edit-3" size={18} color={accentColour} />
                  <Text style={styles.writeSectionTitle}>Write Your Experience</Text>
                </View>

                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Describe what you did, who you helped, and how it made you feel..."
                  placeholderTextColor="#52525b"
                  value={experienceText}
                  onChangeText={(text) => {
                    setExperienceText(text);
                    if (showError) setShowError(false);
                  }}
                  textAlignVertical="top"
                />

                {/* Word counter */}
                <View style={styles.wordCountRow}>
                  <Text style={[styles.wordCountText, isValid && styles.wordCountValid]}>
                    {wordCount} / {MIN_WORDS} words
                  </Text>
                  {isValid && <Feather name="check-circle" size={16} color="#10b981" style={{ marginLeft: 6 }} />}
                </View>

                {/* Photo attachment section */}
                <View style={styles.photoContainer}>
                  {imageUri ? (
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.attachedImage} />
                      <TouchableOpacity 
                        style={styles.removeImageBtn} 
                        onPress={() => setImageUri(null)}
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.7}>
                      <Feather name="camera" size={20} color={accentColour} />
                      <Text style={[styles.addPhotoText, { color: accentColour }]}>Add a Photo (Optional)</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Error message */}
                {showError && (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>Please write at least 100 words to complete the task</Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Mission instruction card (steps 1 & 2) */}
            {!isLastStep && (
              <View style={styles.missionCard}>
                <Feather name="info" size={16} color={accentColour} />
                <Text style={styles.missionText}>
                  Do an act of kindness, then capture the moment to complete your mission
                </Text>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom actions */}
      <View style={styles.bottomArea}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.nextBtn, { overflow: 'hidden' }]}
            activeOpacity={0.85}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
            onPress={handleNext}
          >
            <LinearGradient colors={[accentColour, accentColour + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
              <Text style={styles.nextBtnText}>{isLastStep ? 'Submit & Complete Task' : 'Continue'}</Text>
              <Feather name={isLastStep ? 'check' : 'arrow-right'} size={20} color="#fff" style={{ marginLeft: 10 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131317' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3f3f46' },

  speakerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },

  progressTrack: { height: 3, backgroundColor: '#27272a', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },

  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 20, paddingTop: 10 },

  stepContent: { alignItems: 'center' },

  stepBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, marginBottom: 25 },
  stepBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  iconOrb: {
    width: 105, height: 105, borderRadius: 52, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10,
  },

  stepTitle: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 14 },
  stepBody: { color: '#a1a1aa', fontSize: 15, lineHeight: 24, textAlign: 'center', fontWeight: '500', marginBottom: 24, paddingHorizontal: 5 },

  quoteStrip: { borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 4, marginBottom: 24, width: '100%' },
  quoteText: { color: '#71717a', fontSize: 13, fontStyle: 'italic', lineHeight: 20 },

  missionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1b1b22', width: '100%',
    borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#2d2d38',
  },
  missionText: { flex: 1, color: '#d4d4d8', fontSize: 13, lineHeight: 20, marginLeft: 12, fontWeight: '500' },

  // ── Write section ──
  writeSection: { width: '100%', marginBottom: 10 },
  writeSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  writeSectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginLeft: 10 },

  textInput: {
    backgroundColor: '#1b1b22', borderRadius: 18, padding: 18, color: '#e4e4e7',
    fontSize: 15, lineHeight: 24, minHeight: 180, borderWidth: 1, borderColor: '#2d2d38',
    fontWeight: '400',
  },

  wordCountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 },
  wordCountText: { color: '#71717a', fontSize: 13, fontWeight: '700' },
  wordCountValid: { color: '#10b981' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', marginLeft: 10, flex: 1 },

  // ── Photo Attachment ──
  photoContainer: { marginTop: 24, marginBottom: 10, width: '100%' },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#3f3f46', backgroundColor: 'rgba(255,255,255,0.02)'
  },
  addPhotoText: { marginLeft: 10, fontSize: 15, fontWeight: '600' },
  imageWrapper: { position: 'relative', width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2d2d38' },
  attachedImage: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center'
  },

  // ── Bottom ──
  bottomArea: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8 },
  nextBtn: { borderRadius: 20, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8 },
  btnGradient: { paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.6 },
});
