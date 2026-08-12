import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  TextInput,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInRight, 
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  useSharedValue,
  withSpring,
  Layout
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 24;

// Premium Color Palette
const COLORS = {
  bg: '#090B17', // Deep Navy
  primary: '#7E3AF2', // Purple
  secondary: '#FF9A3D', // Orange
  accent: '#FFD700', // Golden
  text: '#FFFFFF',
  textDim: '#A1A1AA',
  glass: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
  indigo: '#1E1B4B',
};

const ASSETS = {
  begin: 'file:///C:/Users/mili0/.gemini/antigravity/brain/e918a672-4b69-4219-8eb3-be79aff02788/gratitude_begin_bg_1782464436665.png',
  meditation: 'file:///C:/Users/mili0/.gemini/antigravity/brain/e918a672-4b69-4219-8eb3-be79aff02788/gratitude_meditation_center_1782464449374.png',
  writing: 'file:///C:/Users/mili0/.gemini/antigravity/brain/e918a672-4b69-4219-8eb3-be79aff02788/gratitude_writing_room_1782464460467.png',
};

// --- Reusable Premium Components ---

const ParticleItem = ({ index }: { index: number }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(Math.random() * height);
  const opacity = useSharedValue(Math.random() * 0.4 + 0.1);
  
  useEffect(() => {
    x.value = withRepeat(withTiming(x.value + (Math.random() * 40 - 20), { duration: 5000 + Math.random() * 5000 }), -1, true);
    y.value = withRepeat(withTiming(y.value + (Math.random() * 40 - 20), { duration: 5000 + Math.random() * 5000 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[styles.particle, style, { 
        backgroundColor: index % 2 === 0 ? COLORS.accent : COLORS.primary,
        width: 3,
        height: 3,
      }]} 
    />
  );
};

const FloatingParticles = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 40 }).map((_, i) => (
        <ParticleItem key={i} index={i} />
      ))}
    </View>
  );
};

const AnimatedBackground = ({ imageUri, blurAmount = 0, currentStep }: { imageUri?: string, blurAmount?: number, currentStep: number }) => {
  const blob1X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(withTiming(50, { duration: 8000 }), -1, true);
    blob2Y.value = withRepeat(withTiming(50, { duration: 10000 }), -1, true);
  }, []);

  const b1 = useAnimatedStyle(() => ({ transform: [{ translateX: blob1X.value }] }));
  const b2 = useAnimatedStyle(() => ({ transform: [{ translateY: blob2Y.value }] }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      {imageUri && (
        <Animated.Image 
          entering={FadeIn.duration(1000)}
          source={{ uri: imageUri }} 
          style={[StyleSheet.absoluteFill, { opacity: 0.35, width: width, height: height }]} 
          blurRadius={blurAmount}
          resizeMode={currentStep === 1 ? 'cover' : 'cover'}
        />
      )}
      <Animated.View style={[styles.blob, b1, { top: -100, right: -50, backgroundColor: COLORS.primary + '22', width: 400, height: 400 }]} />
      <Animated.View style={[styles.blob, b2, { bottom: -100, left: -50, backgroundColor: COLORS.indigo + '44', width: 500, height: 500 }]} />
      <FloatingParticles />
      <LinearGradient colors={['rgba(9,11,23,0.3)', 'rgba(9,11,23,0.8)', COLORS.bg]} style={StyleSheet.absoluteFill} />
    </View>
  );
};

// --- Keyframe Components ---

import { StyleProp } from 'react-native';

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) => (
  <BlurView intensity={20} tint="dark" style={[styles.glassCard, style]}>
    {children}
  </BlurView>
);

const PrimaryButton = ({ title, onPress, icon = "arrow-forward" }: { title: string, onPress: () => void, icon?: any }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.primaryButton}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
      <Ionicons name={icon} size={20} color="#FFF" style={{ marginLeft: 8 }} />
    </LinearGradient>
  </TouchableOpacity>
);

const Header = ({ title, subtitle, onBack }: { title: string, subtitle?: string, onBack?: () => void }) => (
  <View style={styles.header}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>
    )}
    <View style={styles.headerTextWrap}>
      <Text style={[styles.headerTitle, { marginLeft: onBack ? 0 : 5 }]}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// --- Individual Journey Steps ---

const BeginStep = ({ onNext }: { onNext: () => void }) => (
  <View style={styles.fullScreen}>
    <View style={styles.contentWrapSide}>
      <Animated.View entering={FadeIn.delay(300).duration(800)}>
        <Ionicons name="heart-outline" size={24} color={COLORS.textDim} style={{ marginBottom: 15 }} />
        <Text style={styles.stepTitleSide}>Gratitude{"\n"}for Body</Text>
        <View style={styles.accentLineSide} />
      </Animated.View>

      <View style={styles.introTextWrap}>
        <Text style={[styles.bodyParaSide, { textAlign: 'left' }]}>
          Your body is your home.{"\n"}
          It carries you, heals you,{"\n"}supports you and stays{"\n"}with you...{"\n"}always.{"\n\n"}
          Today, let's take a{"\n"}moment to say{"\n"}thank you.
        </Text>
      </View>

      <GlassCard style={styles.quoteCardSide}>
        <Text style={styles.quoteTextSide}>
          "Appreciate where you are in your journey, even if it's not where you want to be. Every step matters."
        </Text>
      </GlassCard>

      <View style={styles.footerBegin}>
        <PrimaryButton title="Begin Gratitude" onPress={onNext} />
      </View>
    </View>
  </View>
);

const AppreciateStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const items = [
    { label: 'My Heart', icon: 'heart', color: '#ff4b2b' },
    { label: 'My Breath', icon: 'air', color: '#2b95ff' },
    { label: 'My Mind', icon: 'brain', color: '#a133ff' },
    { label: 'My Eyes', icon: 'eye', color: '#ffd700' },
    { label: 'My Hands', icon: 'hand-front-right', color: '#ff8c00' },
    { label: 'My Legs', icon: 'walk', color: '#50c878' },
    { label: 'My Skin', icon: 'sparkles', color: '#ffb6c1' },
    { label: 'My Strength', icon: 'arm-flex', color: '#ff0000' },
    { label: 'My Energy', icon: 'lightning-bolt', color: '#ffff00' },
  ];

  const toggle = (label: string) => {
    setSelected(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  return (
    <View style={styles.fullScreen}>
       <Header title="What are you thankful for?" subtitle="Select all that you feel grateful for." onBack={onBack} />
       <View style={styles.illustrationWrapperMini}>
          {/* Subtle icon instead of mini image when full background is active */}
          <MaterialCommunityIcons name={"sparkles" as any} size={40} color={COLORS.accent} style={{ opacity: 0.6 }} />
       </View>
       <ScrollView contentContainerStyle={styles.gridContainer}>
          <View style={styles.grid}>
            {items.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => toggle(item.label)}
                style={styles.gridItemWrapper}
              >
                <GlassCard style={[styles.gridCard, selected.includes(item.label) && styles.gridCardActive]}>
                  {item.icon.includes('lightning') || item.icon.includes('hand') || item.icon.includes('brain') || item.icon.includes('arm') ? (
                    <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                  ) : (
                    <Ionicons name={item.icon as any} size={32} color={item.color} />
                  )}
                  <Text style={styles.gridLabel}>{item.label}</Text>
                  {selected.includes(item.label) && (
                    <Animated.View entering={FadeIn} style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                    </Animated.View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
       </ScrollView>
       <View style={[styles.footer, { paddingHorizontal: HORIZONTAL_MARGIN }]}>
         <PrimaryButton title="Continue" onPress={onNext} />
       </View>
    </View>
  );
};

const TodayGratitudeStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => (
  <View style={styles.fullScreen}>
    <Header title="Take a Moment" onBack={onBack} />
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}>
      <View style={styles.meditationView}>
        <View style={styles.promptWrapper}>
           <Text style={styles.meditationPrompt}>
            Close your eyes,{"\n"}take a deep breath,{"\n"}and thank your body{"\n"}for everything it does for you.
          </Text>
        </View>
      </View>
      
      <View style={styles.pillRow}>
        <GlassCard style={styles.pillButton}><Text style={styles.pillText}>🌿 Breathe Deeply</Text></GlassCard>
        <GlassCard style={styles.pillButton}><Text style={styles.pillText}>💛 Feel Grateful</Text></GlassCard>
        <GlassCard style={styles.pillButton}><Text style={styles.pillText}>🪷 Be Present Within</Text></GlassCard>
      </View>
    </ScrollView>

    <View style={[styles.footer, { paddingHorizontal: HORIZONTAL_MARGIN }]}>
      <PrimaryButton title="I'm Ready" onPress={onNext} />
    </View>
  </View>
);

const WriteStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [text, setText] = useState('');
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fullScreen}>
      <Header title="Write Your Gratitude" subtitle="What would you like to thank your body for today?" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Image source={{ uri: ASSETS.writing }} style={styles.writingImage} />
        <GlassCard style={styles.textAreaCard}>
          <TextInput
            multiline
            placeholder="Write your gratitude here..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.textArea}
            value={text}
            onChangeText={setText}
            maxLength={500}
          />
          <Text style={styles.charCounter}>{text.length}/500</Text>
        </GlassCard>
        <Text style={styles.helperText}>"There is no right or wrong. Just be real."</Text>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={onNext} />
      </View>
    </KeyboardAvoidingView>
  );
};

const PromiseStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [tasks, setTasks] = useState<string[]>([]);
  const options = ['Drink more water', 'Move your body', 'Eat nourishing food', 'Rest and sleep well', 'Take breaks', 'Do something you love'];
  const [promise, setPromise] = useState('');

  const toggleTask = (t: string) => {
    setTasks(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fullScreen}>
      <Header title="A Promise to Yourself" subtitle="How will you take care of your body today?" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
        <Image source={{ uri: ASSETS.writing }} style={[styles.writingImage, { marginBottom: 30 }]} />
        <View style={styles.checklist}>
          {options.map((opt, i) => (
            <TouchableOpacity key={i} onPress={() => toggleTask(opt)} style={styles.checkItem}>
              <View style={[styles.checkbox, tasks.includes(opt) && styles.checkboxActive]}>
                {tasks.includes(opt) && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={styles.checkLabel}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <GlassCard style={styles.textAreaCard}>
          <TextInput
            multiline
            placeholder="Write your self-care promise..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.textArea}
            value={promise}
            onChangeText={setPromise}
            maxLength={500}
          />
          <Text style={styles.charCounter}>{promise.length}/500</Text>
        </GlassCard>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={onNext} />
      </View>
    </KeyboardAvoidingView>
  );
};

const ReflectionStep = ({ onComplete, onBack }: { onComplete: () => void, onBack: () => void }) => {
  const [mood, setMood] = useState<string | null>(null);
  const moods = [
    { label: 'Grateful', icon: '😊' },
    { label: 'Loved', icon: '❤️' },
    { label: 'Peaceful', icon: '🌿' },
    { label: 'Motivated', icon: '⭐' },
  ];

  return (
    <View style={styles.fullScreen}>
      <Header title="Beautiful Reflection" onBack={onBack} />
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: ASSETS.begin }} style={[styles.heroImageSide, { opacity: 0.15 }]} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: HORIZONTAL_MARGIN }}>
        <GlassCard style={styles.reflectionCard}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <MaterialCommunityIcons name="spa" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.reflectionTitle}>Beautiful Reflection</Text>
          <Text style={styles.reflectionText}>
            Your body listens to you, supports you, and stands by you in every moment.{"\n"}{"\n"}
            It deserves your love, your care, and your kindness.
          </Text>
          <View style={styles.scriptQuoteWrap}>
            <Text style={styles.scriptQuote}>Treat your body like your best friend. ♡</Text>
          </View>
          <Text style={styles.reflectionFooter}>Gratitude today, love forever.</Text>
        </GlassCard>

        <Text style={styles.moodQuestion}>How do you feel right now?</Text>
        <View style={styles.moodGrid}>
          {moods.map((m, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => setMood(m.label)}
              style={styles.moodItem}
            >
              <GlassCard style={[styles.moodCard, mood === m.label && styles.moodCardActive]}>
                <Text style={styles.moodIcon}>{m.icon}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title="Complete Task" icon="sparkles" onPress={onComplete} />
      </View>
    </View>
  );
};

// --- Main Screen Exporter ---

export default function GratitudeScreen() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ task_name: "Gratitude for Body" })
      });
      
      const data = await response.json();
      
      if (response.ok || data.success) {
        router.replace({
          pathname: '/(tabs)',
          params: { 
            updatedPoints: data.totalPoints?.toString(), 
            updatedStreak: data.streak?.toString() 
          }
        } as any);
      } else {
        Alert.alert("Error", data.error || "Failed to complete task");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Network error while completing task.");
    } finally {
      setIsCompleting(false);
    }
  };

  const getBgConfig = () => {
    switch(step) {
      case 1: return { uri: ASSETS.begin, blur: 0 };
      case 2: return { uri: ASSETS.meditation, blur: 30 };
      case 3: return { uri: ASSETS.meditation, blur: 0 };
      case 4: return { uri: ASSETS.writing, blur: 0 };
      case 5: return { uri: ASSETS.writing, blur: 15 };
      case 6: return { uri: ASSETS.begin, blur: 10 };
      default: return { uri: undefined, blur: 0 };
    }
  };

  const bgConfig = getBgConfig();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AnimatedBackground imageUri={bgConfig.uri} blurAmount={bgConfig.blur} currentStep={step} />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View 
          key={step} 
          entering={FadeIn.duration(600)} 
          exiting={FadeOut.duration(400)}
          style={{ flex: 1 }}
        >
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );

  function renderStep() {
    switch(step) {
      case 1: return <BeginStep onNext={nextStep} />;
      case 2: return <AppreciateStep onNext={nextStep} onBack={prevStep} />;
      case 3: return <TodayGratitudeStep onNext={nextStep} onBack={prevStep} />;
      case 4: return <WriteStep onNext={nextStep} onBack={prevStep} />;
      case 5: return <PromiseStep onNext={nextStep} onBack={prevStep} />;
      case 6: return <ReflectionStep onComplete={handleComplete} onBack={prevStep} />;
      default: return null;
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  fullScreen: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginTop: 4 },
  heroImageSide: { 
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 1.5,
    height: height,
    resizeMode: 'cover',
    opacity: 0.8
  },
  heroOverlaySide: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: height,
    width: width,
    zIndex: 1
  },
  contentWrapSide: { 
    flex: 1, 
    zIndex: 2,
    paddingHorizontal: 30, 
    paddingTop: height * 0.1,
    paddingBottom: 40
  },
  stepTitleSide: { 
    fontSize: 48, 
    fontWeight: '800', 
    color: '#FFF',
    lineHeight: 56
  },
  accentLineSide: { 
    width: 40, 
    height: 3, 
    backgroundColor: COLORS.secondary, 
    marginTop: 15, 
    borderRadius: 1.5 
  },
  bodyParaSide: { 
    fontSize: 18, 
    color: '#E4E4E7', 
    lineHeight: 28,
    marginTop: 30,
    fontWeight: '400'
  },
  quoteCardSide: { 
    padding: 20, 
    borderRadius: 24, 
    marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  quoteTextSide: { 
    fontSize: 14, 
    color: '#FFF', 
    fontStyle: 'italic', 
    textAlign: 'left', 
    lineHeight: 20,
    opacity: 0.9
  },
  footerBegin: {
    marginTop: 'auto',
  },
  particle: { position: 'absolute', borderRadius: 10 },
  primaryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 64, 
    borderRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  primaryButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  footer: { paddingBottom: 20, paddingHorizontal: 20 },
  introTextWrap: { flex: 1 },
  gridContainer: { padding: 20, paddingTop: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItemWrapper: { width: '31%', aspectRatio: 0.9, marginBottom: 15 },
  gridCard: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  gridCardActive: { 
    borderColor: COLORS.primary, 
    backgroundColor: 'rgba(126, 58, 242, 0.25)',
    transform: [{ scale: 1.05 }]
  },
  gridLabel: { fontSize: 12, color: '#FFF', marginTop: 10, fontWeight: 'bold', textAlign: 'center' },
  checkIcon: { position: 'absolute', top: 10, right: 10 },

  meditationView: { alignItems: 'center', justifyContent: 'center' },
  meditationCircleWrap: { 
    width: width, 
    height: width, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: -40 
  },
  meditationImage: { width: width, height: width, resizeMode: 'contain', opacity: 0.9 },
  promptWrapper: { paddingVertical: 20 },
  meditationPrompt: { 
    fontSize: 21, 
    color: '#FFF', 
    textAlign: 'center', 
    lineHeight: 34, 
    fontWeight: '300',
    paddingHorizontal: 25
  },
  pillRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 12, 
    paddingHorizontal: 20,
    marginBottom: 50
  },
  pillButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)' },
  pillText: { color: '#E4E4E7', fontSize: 14, fontWeight: '500' },

  writingImage: { width: '100%', height: 220, borderRadius: 24, marginBottom: 25, resizeMode: 'cover' },
  textAreaCard: { borderRadius: 24, padding: 20, minHeight: 220, backgroundColor: 'rgba(0,0,0,0.3)' },
  textArea: { fontSize: 16, color: '#FFF', textAlignVertical: 'top', height: 160 },
  charCounter: { alignSelf: 'flex-end', color: COLORS.textDim, fontSize: 12, marginTop: 10 },
  helperText: { textAlign: 'center', color: COLORS.textDim, fontSize: 13, marginTop: 20 },

  checklist: { marginBottom: 35 },
  checkItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 18, 
    borderRadius: 20 
  },
  checkbox: { 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: COLORS.border, 
    marginRight: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel: { color: '#FFF', fontSize: 16, fontWeight: '500' },

  reflectionCard: { padding: 35, borderRadius: 32, marginBottom: 40, borderBottomWidth: 0 },
  reflectionTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 25, textAlign: 'center' },
  reflectionText: { fontSize: 17, color: '#E4E4E7', lineHeight: 28, textAlign: 'center' },
  
  moodQuestion: { fontSize: 20, color: '#FFF', textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50 },
  moodItem: { width: '23%' },
  moodCard: { aspectRatio: 0.85, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  moodCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  moodIcon: { fontSize: 36, marginBottom: 10 },
  moodLabel: { fontSize: 12, color: '#FFF', fontWeight: 'bold' },

  glassCard: { 
    overflow: 'hidden', 
    backgroundColor: COLORS.glass, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: 24,
  },
  blob: { position: 'absolute', borderRadius: 250, opacity: 0.5, filter: 'blur(60px)' } as any,
  safeArea: { flex: 1 },
  scriptQuoteWrap: {
    marginVertical: 30,
    paddingHorizontal: 15,
  },
  scriptQuote: {
    fontSize: 32,
    color: COLORS.accent,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
  },
  reflectionFooter: { textAlign: 'center', color: COLORS.textDim, fontSize: 15, fontWeight: '500' },
  illustrationWrapperMini: {
    height: 120,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  illustrationMini: {
    width: width * 0.8,
    height: 100,
    resizeMode: 'contain',
  },
});
