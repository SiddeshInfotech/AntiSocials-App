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
  withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch, API_BASE_URL } from '../constants/Api';
import { Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#050508',
  purple: '#8A2BE2',
  pink: '#D946EF',
  orange: '#FF7A18',
  blue: '#4A90E2',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  accent: '#FFD700',
};

const IMAGES = {
  begin: require('../assets/images/sunset_connection.png'),
  share: require('../assets/images/coffee_shop_conversation.png'),
  surprised: require('../assets/images/indoor_evening_conversation.png'),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PrimaryButton = ({ title, onPress, hasArrow = false }: { title: string, onPress: () => void, hasArrow?: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <AnimatedPressable 
      onPressIn={() => {
        scale.value = withSpring(0.95);
        opacity.value = withTiming(0.8, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
        opacity.value = withTiming(1, { duration: 100 });
      }}
      onPress={onPress} 
      style={[styles.buttonContainer, animatedStyle]}
    >
      <LinearGradient
        colors={[COLORS.purple, COLORS.orange]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonGradient}
      >
        <Text style={styles.buttonText}>{title}</Text>
        {hasArrow && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: ViewStyle }) => {
  return (
    <BlurView intensity={25} tint="dark" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  );
};

export default function AskScreen() {
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
        body: JSON.stringify({ task_name: "Today's Connection" })
      });
      
      const data = await response.json();
      
      if (response.ok || data.success) {
        // Complete with visual feedback
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
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsCompleting(false);
    }
  };

  const renderBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.15)', 'transparent']}
        style={[styles.glow, { top: -100, left: -100, width: 400, height: 400 }]}
      />
      <LinearGradient
        colors={['rgba(255, 122, 24, 0.1)', 'transparent']}
        style={[styles.glow, { bottom: -100, right: -100, width: 400, height: 400 }]}
      />
      {[...Array(30)].map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.star, 
            { 
              top: Math.random() * height, 
              left: Math.random() * width,
              opacity: Math.random() * 0.4 + 0.1,
              transform: [{ scale: Math.random() * 0.8 + 0.2 }]
            }
          ]} 
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch(step) {
      case 1: return <BeginStep onNext={nextStep} />;
      case 2: return <StartersStep onNext={nextStep} onBack={prevStep} />;
      case 3: return <MissionStep onNext={nextStep} onBack={prevStep} />;
      case 4: return <ShareStep onNext={nextStep} onBack={prevStep} />;
      case 5: return <SurprisedStep onNext={nextStep} onBack={prevStep} />;
      case 6: return <ReflectionStep onComplete={handleComplete} onBack={prevStep} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderBackground()}
      <SafeAreaView style={styles.safeArea}>
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
}


// --- Icons & Headers ---
const Header = ({ title, subtitle, onBack }: { title: string, subtitle?: string, onBack: () => void }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="chevron-back" size={24} color="#FFF" />
    </TouchableOpacity>
    <View style={styles.headerTitleWrap}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// --- Screen 1: Begin ---
const BeginStep = ({ onNext }: { onNext: () => void }) => (
  <View style={styles.screenContent}>
    <View style={styles.stepOneTop}>
      <View style={styles.heartCircle}>
        <Ionicons name="heart" size={24} color="#FFF" />
      </View>
      <Text style={styles.titleLarge}>Today's Connection</Text>
    </View>
    
    <View style={styles.illustrationWrap}>
      <Image source={IMAGES.begin} style={styles.fullImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', COLORS.bg]} style={styles.imageFade} />
    </View>

    <View style={styles.bodyWrap}>
      <Text style={styles.bodyText}>Talk to one person today.</Text>
      <Text style={styles.bodyText}>Don't try to impress them.</Text>
      <Text style={styles.bodyText}>Don't rush the conversation.</Text>
      <Text style={styles.bodyText}>Simply be curious.</Text>
      <Text style={styles.bodyText}>Listen with your full attention.</Text>
    </View>

    <View style={styles.quoteWrap}>
      <Text style={styles.quoteText}>
        "Sometimes the greatest gift you can give someone is simply being present."
      </Text>
    </View>

    <View style={styles.footer}>
      <PrimaryButton title="Begin Conversation" onPress={onNext} hasArrow />
    </View>
  </View>
);

// --- Screen 2: Starters ---
interface StarterItem {
  text: string;
  icon: string;
  colors: [string, string];
}

const startersList: StarterItem[] = [
  { text: "What made you smile recently?", icon: "happy-outline", colors: [COLORS.orange, COLORS.pink] },
  { text: "What has been on your mind lately?", icon: "bulb-outline", colors: [COLORS.purple, COLORS.blue] },
  { text: "What are you looking forward to?", icon: "rocket-outline", colors: [COLORS.pink, COLORS.purple] },
  { text: "What has been the hardest part of your week?", icon: "cloud-outline", colors: [COLORS.blue, COLORS.purple] },
  { text: "If today had a title, what would it be?", icon: "book-outline", colors: [COLORS.orange, COLORS.purple] },
  { text: "What's something most people don't know about you?", icon: "star-outline", colors: [COLORS.purple, COLORS.pink] },
];


const StartersStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => (
  <View style={styles.screenContent}>
    <Header title="Conversation Starters" subtitle="Choose any question to ask." onBack={onBack} />

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
      {startersList.map((item, index) => (
        <Animated.View key={index} entering={SlideInRight.delay(index * 100)}>
          <GlassCard style={styles.starterCard}>
            <LinearGradient colors={item.colors} style={styles.cardIconBox}>
              <Ionicons name={item.icon as any} size={20} color="#FFF" />
            </LinearGradient>
            <Text style={styles.starterText}>{item.text}</Text>
            <TouchableOpacity style={styles.favButton}>
              <Ionicons name="star-outline" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      ))}
    </ScrollView>

    <View style={styles.footer}>
      <PrimaryButton title="Continue" onPress={onNext} />
    </View>
  </View>
);

// --- Screen 3: Mission ---
const MissionStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const glow = useSharedValue(0.8);
  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(1.2, { duration: 2000 }), withTiming(0.8, { duration: 2000 })), -1, true);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: interpolate(glow.value, [0.8, 1.2], [0.5, 0.9]),
  }));

  return (
    <View style={styles.screenContent}>
      <Header title="Your Mission" onBack={onBack} />
      
      <View style={styles.missionCenter}>
        <Animated.View style={[styles.orbGlow, orbStyle]}>
          <LinearGradient colors={[COLORS.purple, COLORS.orange, COLORS.pink]} style={styles.orbOuter} />
        </Animated.View>
        <LinearGradient colors={[COLORS.purple, COLORS.orange, COLORS.pink]} style={styles.orbInner}>
          <Ionicons name="people-outline" size={60} color="#FFF" />
        </LinearGradient>
        
        <View style={styles.missionTextWrap}>
          <Text style={styles.missionMain}>Talk to one person for at least{"\n"}5 minutes.</Text>
          <View style={styles.missionBullets}>
            <Text style={styles.bulletItem}>• Be present.</Text>
            <Text style={styles.bulletItem}>• Be curious.</Text>
            <Text style={styles.bulletItem}>• Be a good listener.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Let's Go" onPress={onNext} />
      </View>
    </View>
  );
};

// --- Screen 4: Share ---
const ShareStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [text, setText] = useState('');
  const choices = [
    { text: 'Great', icon: '😀' },
    { text: 'Meaningful', icon: '😍' },
    { text: 'Good', icon: '😊' },
    { text: 'Okay', icon: '😐' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Header title="Share Your Experience" subtitle="Welcome Back!" onBack={onBack} />

        <View style={styles.archedWrap}>
          <Image source={IMAGES.share} style={styles.archImage} />
        </View>

        <Text style={styles.questionLabel}>How did your conversation go?</Text>
        
        <View style={styles.emojiRow}>
          {choices.map((c, i) => (
            <GlassCard key={i} style={styles.emojiCard}>
              <Text style={styles.emojiChar}>{c.icon}</Text>
              <Text style={styles.emojiLabel}>{c.text}</Text>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.inputCard}>
          <TextInput
            multiline
            placeholder="Anything you'd like to add..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            maxLength={500}
          />
          <Text style={styles.counter}>{text.length}/500</Text>
        </GlassCard>

        <View style={styles.footer}>
          <PrimaryButton title="Continue" onPress={onNext} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Screen 5: Surprised ---
const SurprisedStep = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [text, setText] = useState('');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Header title="What Surprised You Most?" onBack={onBack} />

        <View style={styles.archedWrap}>
          <Image source={IMAGES.surprised} style={styles.archImage} />
        </View>

        <Text style={styles.questionLabel}>What surprised you the most from this conversation?</Text>

        <GlassCard style={styles.inputCard}>
          <TextInput
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            maxLength={500}
          />
          <Text style={styles.counter}>{text.length}/500</Text>
        </GlassCard>

        <View style={styles.footer}>
          <PrimaryButton title="Continue" onPress={onNext} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Screen 6: Reflection ---
const ReflectionStep = ({ onComplete, onBack }: { onComplete: () => void, onBack: () => void }) => {
  const feelings = [
    { text: 'More Connected', icon: '😊' },
    { text: 'Inspired', icon: '🤩' },
    { text: 'Understood', icon: '😍' },
    { text: 'Neutral', icon: '😐' },
  ];

  return (
    <View style={styles.screenContent}>
      <Header title="Beautiful Reflection" onBack={onBack} />

      <GlassCard style={styles.reflectionCard}>
        <Text style={styles.reflectionPara}>Every conversation is a window into another soul.</Text>
        <Text style={styles.reflectionPara}>Today, you didn't just ask questions.</Text>
        <Text style={styles.reflectionPara}>
          You gave someone your time, your presence, and your genuine interest.
        </Text>
        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            "You understood one more human being than you did yesterday."
          </Text>
        </View>
        <Text style={styles.closingPara}>Keep going, you're building a more connected world.</Text>
      </GlassCard>

      <View style={styles.moodSection}>
        <Text style={styles.questionLabelCenter}>How do you feel right now?</Text>
        <View style={styles.emojiRow}>
          {feelings.map((f, i) => (
            <GlassCard key={i} style={styles.emojiCardSmall}>
              <Text style={styles.emojiChar}>{f.icon}</Text>
              <Text style={styles.emojiLabelSmall}>{f.text}</Text>
            </GlassCard>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Complete Task" onPress={onComplete} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  glow: { position: 'absolute', borderRadius: 200 },
  star: { position: 'absolute', width: 2, height: 2, backgroundColor: '#FFF', borderRadius: 1 },
  screenContent: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center', marginRight: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginTop: 4 },
  stepOneTop: { alignItems: 'center', marginTop: 10 },
  heartCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.pink, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  titleLarge: { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  illustrationWrap: { height: height * 0.3, width: '100%', borderRadius: 30, overflow: 'hidden', marginVertical: 20 },
  fullImage: { width: '100%', height: '100%' },
  imageFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  bodyWrap: { alignItems: 'center' },
  bodyText: { color: 'rgba(255,255,255,0.9)', fontSize: 18, lineHeight: 28, textAlign: 'center' },
  quoteWrap: { marginTop: 20, paddingHorizontal: 20 },
  quoteText: { color: COLORS.textDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  footer: { paddingBottom: 20, alignItems: 'center' },
  buttonContainer: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden', elevation: 8 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  glassCard: { borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden', backgroundColor: COLORS.glass },
  scrollArea: { paddingBottom: 30 },
  starterCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  starterText: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
  favButton: { padding: 4 },
  missionCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orbGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  orbOuter: { width: '100%', height: '100%', borderRadius: 140, opacity: 0.2 },
  orbInner: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center', elevation: 20 },
  missionTextWrap: { marginTop: 50, alignItems: 'center' },
  missionMain: { fontSize: 24, color: '#FFF', fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  missionBullets: { alignItems: 'flex-start' },
  bulletItem: { color: COLORS.textDim, fontSize: 18, marginBottom: 8 },
  archedWrap: { height: height * 0.22, borderRadius: 100, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', marginVertical: 20 },
  archImage: { width: '100%', height: '100%' },
  questionLabel: { fontSize: 18, color: '#FFF', fontWeight: '700', marginBottom: 16 },
  questionLabelCenter: { fontSize: 18, color: '#FFF', fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  emojiCard: { flex: 1, marginHorizontal: 5, paddingVertical: 16, alignItems: 'center' },
  emojiCardSmall: { flex: 1, marginHorizontal: 4, paddingVertical: 12, alignItems: 'center' },
  emojiChar: { fontSize: 28, marginBottom: 8 },
  emojiLabel: { fontSize: 12, color: COLORS.textDim, fontWeight: '700' },
  emojiLabelSmall: { fontSize: 9, color: COLORS.textDim, fontWeight: '700', textAlign: 'center' },
  inputCard: { minHeight: 140, padding: 16, marginBottom: 20 },
  textInput: { flex: 1, color: '#FFF', fontSize: 16, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 },
  reflectionCard: { padding: 24, marginVertical: 20 },
  reflectionPara: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  highlightBox: { backgroundColor: 'rgba(255, 215, 0, 0.1)', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.accent, marginVertical: 8 },
  highlightText: { color: COLORS.accent, fontSize: 18, fontWeight: 'bold', fontStyle: 'italic' },
  closingPara: { color: COLORS.textDim, fontSize: 14, marginTop: 8 },
  moodSection: { marginTop: 20 },
});
