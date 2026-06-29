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

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#050508',
  purple: '#8A2BE2',
  pink: '#D946EF',
  orange: '#FF7A18',
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable 
      onPressIn={() => (scale.value = withSpring(0.96))}
      onPressOut={() => (scale.value = withSpring(1))}
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

export default function ConnectionTaskFlow() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const renderBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
      {/* Background Gradients */}
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.12)', 'transparent']}
        style={[styles.glow, { top: -150, left: -100, width: 450, height: 450 }]}
      />
      <LinearGradient
        colors={['rgba(255, 122, 24, 0.08)', 'transparent']}
        style={[styles.glow, { bottom: -100, right: -100, width: 400, height: 400 }]}
      />
      {/* Star Particles */}
      {[...Array(25)].map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.star, 
            { 
              top: Math.random() * height, 
              left: Math.random() * width,
              opacity: Math.random() * 0.4 + 0.1,
              width: Math.random() > 0.8 ? 3 : 2,
              height: Math.random() > 0.8 ? 3 : 2,
            }
          ]} 
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch(step) {
      case 1: return <BeginScreen onNext={nextStep} />;
      case 2: return <StartersScreen onNext={nextStep} onBack={prevStep} />;
      case 3: return <MissionScreen onNext={nextStep} onBack={prevStep} />;
      case 4: return <ShareScreen onNext={nextStep} onBack={prevStep} />;
      case 5: return <SurprisedScreen onNext={nextStep} onBack={prevStep} />;
      case 6: return <ReflectionScreen onComplete={() => setStep(1)} onBack={prevStep} />;
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
          entering={FadeIn.duration(500)} 
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// --- Icons / Small Components ---
const StepHeader = ({ title, subtitle, onBack }: { title: string, subtitle?: string, onBack: () => void }) => (
  <View style={styles.stepHeader}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="chevron-back" size={24} color="#FFF" />
    </TouchableOpacity>
    <View style={{ alignItems: 'center', flex: 1, marginRight: 40 }}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// --- Screen 1: Begin ---
const BeginScreen = ({ onNext }: { onNext: () => void }) => (
  <View style={styles.screenContent}>
    <View style={styles.topIcon}>
      <LinearGradient colors={[COLORS.purple, COLORS.pink]} style={styles.heartIconCircle}>
        <Ionicons name="heart" size={24} color="#FFF" />
      </LinearGradient>
    </View>

    <Text style={styles.mainTitle}>Today's Connection</Text>
    
    <View style={styles.illustrationWrap}>
      <Image source={IMAGES.begin} style={styles.fullImage} resizeMode="cover" />
      <LinearGradient 
        colors={['transparent', COLORS.bg]} 
        style={styles.imageOverlay} 
      />
    </View>

    <View style={styles.introSteps}>
      <Text style={styles.introLine}>Talk to one person today.</Text>
      <Text style={styles.introLine}>Don't try to impress them.</Text>
      <Text style={styles.introLine}>Don't rush the conversation.</Text>
      <Text style={styles.introLine}>Simply be curious.</Text>
      <Text style={styles.introLine}>Listen with your full attention.</Text>
    </View>

    <View style={styles.quoteBox}>
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
const startersSet = [
  { text: "What made you smile recently?", icon: "heart", color: "#FF4D6D" },
  { text: "What has been on your mind lately?", icon: "cloud", color: "#8093F1" },
  { text: "What are you looking forward to?", icon: "sunny", color: "#FFD700" },
  { text: "What has been the hardest part of your week?", icon: "flash", color: "#B388EB" },
  { text: "If today had a title, what would it be?", icon: "help-circle", color: "#F72585" },
  { text: "What's something most people don't know about you?", icon: "person", color: "#FF9E00" },
];

const StartersScreen = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => (
  <View style={styles.screenContent}>
    <StepHeader title="Conversation Starters" subtitle="Choose any question to ask." onBack={onBack} />

    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      {startersSet.map((item, index) => (
        <Animated.View key={index} entering={SlideInRight.delay(index * 80)}>
          <GlassCard style={styles.starterCard}>
            <LinearGradient colors={[item.color, item.color + '80']} style={styles.cardIconBox}>
              <Ionicons name={item.icon as any} size={20} color="#FFF" />
            </LinearGradient>
            <Text style={styles.starterLabel}>{item.text}</Text>
            <TouchableOpacity hitSlop={10}>
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
const MissionScreen = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const glow = useSharedValue(0.9);

  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(1.1, { duration: 1500 }), withTiming(0.9, { duration: 1500 })), -1, true);
  }, []);

  const orbAnim = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: interpolate(glow.value, [0.9, 1.1], [0.8, 1]),
  }));

  return (
    <View style={styles.screenContent}>
      <StepHeader title="Your Mission" onBack={onBack} />
      
      <View style={styles.orbArea}>
        <Animated.View style={[styles.orbShadow, orbAnim]}>
          <LinearGradient colors={['rgba(255,122,24,0.4)', 'rgba(138,43,226,0.4)', 'rgba(217,70,239,0.4)']} style={styles.orbOuter} />
        </Animated.View>
        <LinearGradient colors={[COLORS.orange, COLORS.purple, COLORS.pink]} style={styles.orbInner}>
          <Ionicons name="people-outline" size={50} color="#FFF" />
        </LinearGradient>
        
        <Text style={styles.missionTitle}>Talk to one person for at least{"\n"}5 minutes.</Text>
      </View>

      <View style={styles.missionRules}>
        <Text style={styles.ruleItem}>Be present. Be curious.</Text>
        <Text style={styles.ruleItem}>Be a good listener.</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Let's Go" onPress={onNext} />
      </View>
    </View>
  );
};

// --- Screen 4: Share ---
const ShareScreen = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [val, setVal] = useState('');
  const choices = [
    { label: 'Great!', emoji: '😀' },
    { label: 'Meaningful', emoji: '😍' },
    { label: 'Good', emoji: '😊' },
    { label: 'Okay', emoji: '😐' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <StepHeader title="Share Your Experience" subtitle="Welcome Back!" onBack={onBack} />

        <View style={styles.archedImageWrap}>
          <Image source={IMAGES.share} style={styles.archedImage} />
        </View>

        <Text style={styles.question}>How did your conversation go?</Text>
        
        <View style={styles.emojiGrid}>
          {choices.map((c, i) => (
            <GlassCard key={i} style={styles.emojiCardSmall}>
              <Text style={styles.emojiImg}>{c.emoji}</Text>
              <Text style={styles.emojiTxt}>{c.label}</Text>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.textAreaBox}>
          <TextInput
            multiline
            placeholder="Anything you'd like to add..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.inputStyle}
            value={val}
            onChangeText={setVal}
            maxLength={500}
          />
          <Text style={styles.counter}>{val.length}/500</Text>
        </GlassCard>

        <View style={styles.footer}>
          <PrimaryButton title="Continue" onPress={onNext} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Screen 5: Surprised ---
const SurprisedScreen = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const [val, setVal] = useState('');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <StepHeader title="What Surprised You Most?" onBack={onBack} />

        <View style={styles.archedImageWrap}>
          <Image source={IMAGES.surprised} style={styles.archedImage} />
        </View>

        <Text style={styles.question}>What surprised you the most{"\n"}from this conversation?</Text>

        <GlassCard style={styles.textAreaBox}>
          <TextInput
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.inputStyle}
            value={val}
            onChangeText={setVal}
            maxLength={500}
          />
          <Text style={styles.counter}>{val.length}/500</Text>
        </GlassCard>

        <View style={styles.footer}>
          <PrimaryButton title="Continue" onPress={onNext} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Screen 6: Reflection ---
const ReflectionScreen = ({ onComplete, onBack }: { onComplete: () => void, onBack: () => void }) => {
  const moods = [
    { label: 'More connected', emoji: '😊' },
    { label: 'Inspired', emoji: '🤩' },
    { label: 'Understood', emoji: '😍' },
    { label: 'Neutral', emoji: '😐' },
  ];

  return (
    <View style={styles.screenContent}>
      <StepHeader title="Beautiful Reflection" onBack={onBack} />

      <View style={styles.sparkleIcon}>
        <Ionicons name="sparkles" size={32} color={COLORS.orange} />
      </View>

      <GlassCard style={styles.reflectionGlass}>
        <Text style={styles.reflectP}>Every conversation is a window into another soul.</Text>
        <Text style={styles.reflectP}>Today, you didn't just ask questions.</Text>
        <Text style={styles.reflectP}>You gave someone your time, your presence, and your genuine interest.</Text>
        <Text style={styles.highlightP}>
          "You understood one more human being than you did yesterday."
        </Text>
        <Text style={styles.reflectP}>Keep going, you're building a more connected world. 🌎💜</Text>
      </GlassCard>

      <View style={styles.moodSection}>
        <Text style={styles.questionCenter}>How do you feel right now?</Text>
        <View style={styles.emojiGrid}>
          {moods.map((m, i) => (
            <GlassCard key={i} style={styles.emojiCardSmall}>
              <Text style={styles.emojiImg}>{m.emoji}</Text>
              <Text style={[styles.emojiTxt, { fontSize: 9 }]}>{m.label}</Text>
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
  glow: { position: 'absolute', borderRadius: 250 },
  star: { position: 'absolute', backgroundColor: '#FFF', borderRadius: 2 },
  screenContent: { flex: 1, padding: 24, justifyContent: 'space-between' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: COLORS.textDim, marginTop: 4 },
  topIcon: { alignItems: 'center', marginTop: 10 },
  heartIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center', marginTop: 16 },
  illustrationWrap: { height: height * 0.3, width: '100%', borderRadius: 24, overflow: 'hidden', marginVertical: 20 },
  fullImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  introSteps: { alignItems: 'center' },
  introLine: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 28, textAlign: 'center' },
  quoteBox: { marginTop: 20, paddingHorizontal: 30 },
  quoteText: { color: COLORS.textDim, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  footer: { paddingBottom: 20, alignItems: 'center' },
  buttonContainer: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden', elevation: 5 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  glassCard: { borderRadius: 24, borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden', backgroundColor: COLORS.glass },
  scrollPadding: { paddingBottom: 30 },
  starterCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  starterLabel: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '500' },
  orbArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orbShadow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, justifyContent: 'center', alignItems: 'center' },
  orbOuter: { width: '100%', height: '100%', borderRadius: 120, opacity: 0.3 },
  orbInner: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center', elevation: 20 },
  missionTitle: { fontSize: 24, color: '#FFF', fontWeight: '800', textAlign: 'center', marginTop: 60 },
  missionRules: { alignItems: 'center', marginBottom: 40 },
  ruleItem: { color: COLORS.textDim, fontSize: 16, lineHeight: 24 },
  archedImageWrap: { height: height * 0.22, borderRadius: 100, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden', marginVertical: 20 },
  archedImage: { width: '100%', height: '100%' },
  question: { fontSize: 19, color: '#FFF', fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  emojiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  emojiCardSmall: { flex: 1, marginHorizontal: 5, paddingVertical: 14, alignItems: 'center' },
  emojiImg: { fontSize: 28, marginBottom: 6 },
  emojiTxt: { fontSize: 11, color: COLORS.textDim, fontWeight: '600', textAlign: 'center' },
  textAreaBox: { minHeight: 140, padding: 16, marginBottom: 20 },
  inputStyle: { flex: 1, color: '#FFF', fontSize: 16, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 8 },
  sparkleIcon: { alignItems: 'center', marginBottom: 10 },
  reflectionGlass: { padding: 24, marginBottom: 20 },
  reflectP: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 24, marginBottom: 16 },
  highlightP: { color: COLORS.accent, fontSize: 19, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 16, lineHeight: 26 },
  moodSection: { marginTop: 10 },
  questionCenter: { textAlign: 'center', color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 16 },
});
