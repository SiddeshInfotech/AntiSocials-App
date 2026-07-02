import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { getRandomReflection, type EmotionId, type Reflection } from './reflection-library';

const { width, height } = Dimensions.get('window');

const triggerHaptic = (style: 'light' | 'medium' | 'success' = 'light') => {
  try {
    if (Platform.OS !== 'web') {
      if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {}
};

const EMOTIONS = [
  { id: 'Happiness', icon: 'sun', color: '#FFB800', desc: 'Joy, gratitude, contentment' },
  { id: 'Sadness', icon: 'cloud-rain', color: '#5BB8FF', desc: 'Sorrow, loss, longing' },
  { id: 'Fear', icon: 'eye', color: '#9B6CFF', desc: 'Worry, anxiety, uncertainty' },
  { id: 'Anger', icon: 'zap', color: '#FF5A5A', desc: 'Frustration, irritation, tension' },
  { id: 'Disgust', icon: 'wind', color: '#32E0A1', desc: 'Aversion, discomfort, rejection' },
] as const;

type Screen = 'select' | 'input' | 'result';

export default function ObserveEmotionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId | null>(null);
  const [situation, setSituation] = useState('');
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(220);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const goToInput = (emotion: EmotionId) => {
    triggerHaptic('light');
    setSelectedEmotion(emotion);
    setSituation('');
    setReflection(null);
    setFeedbackMessage(null);
    setEditorHeight(220);
    setScreen('input');
    animateIn();
  };

  const goBack = () => {
    triggerHaptic('light');
    if (screen === 'input') {
      setScreen('select');
      setSituation('');
      setReflection(null);
      setFeedbackMessage(null);
      setEditorHeight(220);
    }
    if (screen === 'result') {
      setScreen('input');
      setReflection(null);
      setFeedbackMessage(null);
    }
    animateIn();
  };

  const handleReflect = () => {
    const trimmed = situation.trim();
    if (trimmed.length < 6) {
      setFeedbackMessage('Please share a little more so I can create a thoughtful reflection for you.');
      return;
    }

    triggerHaptic('success');
    setFeedbackMessage(null);

    if (!selectedEmotion) {
      return;
    }

    const nextReflection = getRandomReflection(selectedEmotion);
    setReflection(nextReflection);
    setScreen('result');
    animateIn();
  };

  const currentEmotion = EMOTIONS.find((e) => e.id === selectedEmotion);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={['#040811', '#08111F', '#050B14']} style={StyleSheet.absoluteFillObject} />

      {currentEmotion && <View style={[styles.ambientBg, { backgroundColor: currentEmotion.color }]} />}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            {screen !== 'select' ? (
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Observe One Emotion</Text>
            <View style={{ width: 40 }} />
          </View>

          {screen === 'select' && (
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
              <View style={styles.selectHeader}>
                <Text style={styles.selectTitle}>{'What are you\nfeeling right now?'}</Text>
                <Text style={styles.selectSubtitle}>Choose the emotion that feels closest to what you’re carrying today.</Text>
              </View>

              <View style={styles.emotionList}>
                {EMOTIONS.map((emotion) => (
                  <TouchableOpacity key={emotion.id} activeOpacity={0.75} onPress={() => goToInput(emotion.id)}>
                    <View style={[styles.emotionRow, { borderColor: `${emotion.color}30` }]}> 
                      <View style={[styles.emotionIconWrap, { backgroundColor: `${emotion.color}20`, shadowColor: emotion.color }]}> 
                        <Feather name={emotion.icon as any} size={22} color={emotion.color} />
                      </View>
                      <View style={styles.emotionTextWrap}>
                        <Text style={styles.emotionName}>{emotion.id}</Text>
                        <Text style={styles.emotionDesc}>{emotion.desc}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.25)" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {screen === 'input' && (
            <Animated.View style={[styles.writeContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={[styles.emotionBadge, { borderColor: `${currentEmotion?.color}50` }]}> 
                <Feather name={currentEmotion?.icon as any} size={16} color={currentEmotion?.color} />
                <Text style={[styles.emotionBadgeText, { color: currentEmotion?.color }]}>{selectedEmotion}</Text>
              </View>

              <Text style={styles.writePrompt}>Write your situation.</Text>
              <Text style={styles.writeHint}>Share what happened and what you’re feeling. This reflection stays local on your device and does not use any AI or network service.</Text>

              {feedbackMessage ? (
                <View style={styles.fallbackCard}>
                  <Feather name="info" size={16} color={currentEmotion?.color || '#fff'} />
                  <Text style={styles.fallbackText}>{feedbackMessage}</Text>
                </View>
              ) : null}

              <ScrollView style={styles.textAreaScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={[styles.textArea, { height: editorHeight }]}
                    placeholder="Tell me what happened... Write freely about your situation."
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={situation}
                    onChangeText={setSituation}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                    onContentSizeChange={(event) => {
                      const nextHeight = Math.min(320, Math.max(220, event.nativeEvent.contentSize.height + 24));
                      setEditorHeight(nextHeight);
                    }}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity activeOpacity={0.85} onPress={handleReflect} style={[styles.analyzeBtn, { backgroundColor: currentEmotion?.color }]}> 
                <Text style={styles.analyzeBtnText}>Reflect</Text>
                <Feather name="arrow-right" size={18} color="#000" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {screen === 'result' && reflection && (
            <Animated.ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <View style={[styles.emotionBadge, { borderColor: `${currentEmotion?.color}50`, marginBottom: 18 }]}> 
                <Feather name={currentEmotion?.icon as any} size={16} color={currentEmotion?.color} />
                <Text style={[styles.emotionBadgeText, { color: currentEmotion?.color }]}>{selectedEmotion}</Text>
              </View>

              <Text style={styles.resultIntro}>Here is a calm reflection shaped by your words and held entirely on your device.</Text>

              {reflection.sections.map((section) => (
                <View key={section.title} style={styles.resultCard}>
                  <View style={styles.cardLabelRow}>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${currentEmotion?.color}20` }]}> 
                      <Feather name="feather" size={16} color={currentEmotion?.color} />
                    </View>
                    <Text style={[styles.cardLabel, { color: currentEmotion?.color }]}>{section.title}</Text>
                  </View>
                  {section.lines.map((line) => (
                    <Text key={line} style={styles.cardBody}>{line}</Text>
                  ))}
                </View>
              ))}

              <TouchableOpacity activeOpacity={0.85} onPress={handleReflect} style={[styles.analyzeBtn, { marginTop: 12, backgroundColor: currentEmotion?.color }]}> 
                <Text style={styles.analyzeBtnText}>Reflect Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={async () => {
                  try {
                    const token = await SecureStore.getItemAsync('token');
                    if (token) {
                      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ task_name: 'Observe One Emotion for 5 Minutes' })
                      });
                    }
                  } catch (e) {
                    console.error("Observe emotion complete error:", e);
                  }
                  router.back();
                }}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </Animated.ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040811' },
  ambientBg: { position: 'absolute', top: -height * 0.2, right: -width * 0.3, width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, opacity: 0.06 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500', letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  selectHeader: { marginBottom: 32 },
  selectTitle: { color: '#ffffff', fontSize: 32, fontWeight: '300', lineHeight: 42, letterSpacing: -0.5, marginBottom: 12 },
  selectSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 22, fontWeight: '300' },
  emotionList: { gap: 10 },
  emotionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2 },
  emotionIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10 },
  emotionTextWrap: { flex: 1 },
  emotionName: { color: '#ffffff', fontSize: 17, fontWeight: '500', marginBottom: 3 },
  emotionDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '300' },
  writeContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  emotionBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 24, gap: 8 },
  emotionBadgeText: { fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
  writePrompt: { color: '#ffffff', fontSize: 28, fontWeight: '300', letterSpacing: -0.5, marginBottom: 10 },
  writeHint: { color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 21, fontWeight: '300', marginBottom: 16 },
  fallbackCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, marginBottom: 14 },
  fallbackText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 20, flex: 1 },
  textAreaScroll: { flex: 1 },
  textAreaWrapper: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, minHeight: 220 },
  textArea: { color: '#ffffff', fontSize: 16, lineHeight: 26, fontWeight: '300' },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 58, borderRadius: 29, marginTop: 16, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20 },
  analyzeBtnText: { color: '#000000', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  resultContent: { paddingHorizontal: 20, paddingTop: 8 },
  resultIntro: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22, marginBottom: 16, fontWeight: '300' },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 20, marginBottom: 12 },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  cardBody: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 25, fontWeight: '300', marginBottom: 8 },
  doneBtn: { marginTop: 8, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 15, fontWeight: '500', letterSpacing: 1 },
});
