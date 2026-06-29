import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type ScreenKey = 1 | 2 | 3 | 4 | 5 | 6;
type MoodKey = 'Great' | 'Meaningful' | 'Good' | 'Okay';
type FeelingKey = 'More Connected' | 'Inspired' | 'Understood' | 'Neutral';

type PromptItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
};

const prompts: PromptItem[] = [
  { id: 'smile', icon: 'sun', title: 'What made you smile recently?' },
  { id: 'mind', icon: 'cloud', title: 'What has been on your mind lately?' },
  { id: 'forward', icon: 'star', title: 'What are you looking forward to?' },
  { id: 'hard', icon: 'moon', title: 'What has been the hardest part of your week?' },
  { id: 'title', icon: 'award', title: 'If today had a title, what would it be?' },
  { id: 'know', icon: 'zap', title: "What's something most people don't know about you?" },
];

const moodOptions: MoodKey[] = ['Great', 'Meaningful', 'Good', 'Okay'];
const feelingOptions: FeelingKey[] = ['More Connected', 'Inspired', 'Understood', 'Neutral'];

export default function TodaysConnectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<ScreenKey>(1);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([]);
  const [experienceText, setExperienceText] = useState('');
  const [surprisedText, setSurprisedText] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<FeelingKey | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateIn();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(starPulse, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [animateIn, floatAnim, glowAnim, orbAnim, starPulse]);

  const goNext = () => {
    if (screen < 6) {
      setScreen((prev) => (prev + 1) as ScreenKey);
      animateIn();
    }
  };

  const goBack = () => {
    if (screen === 1) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)');
      }
      return;
    }
    setScreen((prev) => (prev - 1) as ScreenKey);
    animateIn();
  };

  const toggleFavorite = (id: string) => {
    setFavoritePrompts((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const renderStars = () =>
    Array.from({ length: 18 }).map((_, index) => {
      const left = (index * 17) % 100;
      const top = (index * 29) % 100;
      const opacity = 0.2 + ((index % 5) / 10);
      return (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: 3 + (index % 3),
            height: 3 + (index % 3),
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.75)',
            opacity: Animated.add(starPulse, opacity),
          }}
        />
      );
    });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#040816', '#0b1224', '#060911']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.starField}>{renderStars()}</View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Feather name="chevron-left" size={20} color="rgba(255,255,255,0.82)" />
          </TouchableOpacity>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>Step {screen} of 6</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.contentWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {screen === 1 && (
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
              <View style={styles.heroArt}>
                <Animated.View style={[styles.heroIllustration, { transform: [{ translateY: floatAnim }] }]}>
                  <LinearGradient colors={['#ffb977', '#ff8b3d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sunGlow} />
                  <View style={styles.mountainOne} />
                  <View style={styles.mountainTwo} />
                  <View style={styles.mountainThree} />
                  <View style={styles.treeLeft} />
                  <View style={styles.treeRight} />
                  <Animated.View style={[styles.spark, styles.sparkA, { opacity: glowAnim }]} />
                  <Animated.View style={[styles.spark, styles.sparkB, { opacity: starPulse }]} />
                  <View style={styles.peopleScene}>
                    <View style={styles.personOne} />
                    <View style={styles.personTwo} />
                  </View>
                </Animated.View>
              </View>

              <Text style={styles.heroTitle}>Today&apos;s Connection</Text>
              <Text style={styles.heroBody}>
                Talk to one person today.{'\n'}
                Don&apos;t try to impress them.{'\n'}
                Don&apos;t rush the conversation.{'\n'}
                Simply be curious.{'\n'}
                Listen with your full attention.
              </Text>
              <Text style={styles.quoteText}>
                “Sometimes the greatest gift you can give someone is simply being present.”
              </Text>

              <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.primaryBtn}>
                <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                  <Text style={styles.primaryText}>Begin Conversation</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {screen === 2 && (
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Conversation Starters</Text>
              <Text style={styles.sectionSubtitle}>Choose any question to ask.</Text>

              <View style={styles.promptList}>
                {prompts.map((prompt) => {
                  const active = selectedPrompt === prompt.id;
                  const favorite = favoritePrompts.includes(prompt.id);
                  return (
                    <TouchableOpacity key={prompt.id} activeOpacity={0.9} onPress={() => setSelectedPrompt(prompt.id)}>
                      <Animated.View style={[styles.promptCard, active && styles.promptCardActive]}>
                        <View style={styles.promptIconWrap}>
                          <Feather name={prompt.icon as never} size={17} color="#fff" />
                        </View>
                        <Text style={styles.promptTitle}>{prompt.title}</Text>
                        <TouchableOpacity onPress={() => toggleFavorite(prompt.id)} style={styles.favoriteBtn}>
                          <Feather name={favorite ? 'star' : 'star'} size={16} color={favorite ? '#ffca28' : 'rgba(255,255,255,0.65)'} />
                        </TouchableOpacity>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.primaryBtn}>
                <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                  <Text style={styles.primaryText}>Continue</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {screen === 3 && (
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Your Mission</Text>
              <View style={styles.orbWrap}>
                <Animated.View style={[styles.orb, { transform: [{ translateY: orbAnim }, { scale: Animated.add(orbAnim, 0.95) }] }]}>
                  <LinearGradient colors={['#ff7a18', '#d946ef', '#8a2be2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.orbGlow} />
                  <View style={styles.orbIconWrap}>
                    <Feather name="users" size={34} color="#fff" />
                  </View>
                </Animated.View>
              </View>
              <Text style={styles.missionText}>Talk to one person for at least 5 minutes.</Text>
              <View style={styles.missionList}>
                <Text style={styles.missionItem}>• Be present.</Text>
                <Text style={styles.missionItem}>• Be curious.</Text>
                <Text style={styles.missionItem}>• Be a good listener.</Text>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.primaryBtn}>
                <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                  <Text style={styles.primaryText}>Let&apos;s Go</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {screen === 4 && (
            <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
              <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Share Your Experience</Text>
                <Text style={styles.sectionSubtitle}>Welcome Back!</Text>
                <View style={styles.illustrationCard}>
                  <View style={styles.coffeeScene}>
                    <LinearGradient colors={['#ffb87f', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coffeeGlow} />
                    <View style={styles.windowPanel} />
                    <View style={styles.tableTop} />
                    <View style={styles.personSeatA} />
                    <View style={styles.personSeatB} />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>How did your conversation go?</Text>
                <View style={styles.moodRow}>
                  {moodOptions.map((mood) => {
                    const active = selectedMood === mood;
                    return (
                      <TouchableOpacity key={mood} activeOpacity={0.9} onPress={() => setSelectedMood(mood)}>
                        <View style={[styles.moodCard, active && styles.moodCardActive]}>
                          <Text style={[styles.moodText, active && styles.moodTextActive]}>{mood}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.textBox}
                  placeholder="Anything you'd like to add..."
                  placeholderTextColor="rgba(255,255,255,0.26)"
                  multiline
                  maxLength={500}
                  value={experienceText}
                  onChangeText={setExperienceText}
                  textAlignVertical="top"
                />
                <Text style={styles.counterText}>{experienceText.length}/500</Text>
                <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.primaryBtn}>
                  <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                    <Text style={styles.primaryText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {screen === 5 && (
            <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
              <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>What Surprised You Most?</Text>
                <View style={styles.illustrationCard}>
                  <View style={styles.lampScene}>
                    <LinearGradient colors={['#ffb87f', '#8a2be2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lampGlow} />
                    <View style={styles.lamp} />
                    <View style={styles.personSeatC} />
                    <View style={styles.personSeatD} />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>What surprised you the most from this conversation?</Text>
                <TextInput
                  style={styles.textBox}
                  placeholder="Write your thoughts..."
                  placeholderTextColor="rgba(255,255,255,0.26)"
                  multiline
                  maxLength={500}
                  value={surprisedText}
                  onChangeText={setSurprisedText}
                  textAlignVertical="top"
                />
                <Text style={styles.counterText}>{surprisedText.length}/500</Text>
                <TouchableOpacity activeOpacity={0.9} onPress={goNext} style={styles.primaryBtn}>
                  <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                    <Text style={styles.primaryText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#fff" style={styles.btnIcon} />
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {screen === 6 && (
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Beautiful Reflection</Text>
              <View style={styles.reflectionCard}>
                <Text style={styles.reflectionText}>
                  Every conversation is a window into another soul. Today, you didn&apos;t just ask questions. You gave someone your time, your presence, and your genuine interest.
                </Text>
                <Text style={styles.highlightText}>
                  “You understood one more human being than you did yesterday.”
                </Text>
                <Text style={styles.reflectionText}>Keep going, you&apos;re building a more connected world.</Text>
              </View>
              <Text style={styles.fieldLabel}>How do you feel right now?</Text>
              <View style={styles.feelingRow}>
                {feelingOptions.map((feeling) => {
                  const active = selectedFeeling === feeling;
                  return (
                    <TouchableOpacity key={feeling} activeOpacity={0.9} onPress={() => setSelectedFeeling(feeling)}>
                      <View style={[styles.feelingCard, active && styles.feelingCardActive]}>
                        <Text style={[styles.feelingText, active && styles.feelingTextActive]}>{feeling}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={() => router.back()} style={styles.primaryBtn}>
                <LinearGradient colors={['#8a2be2', '#ff7a18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}>
                  <Text style={styles.primaryText}>Complete Task</Text>
                  <Feather name="check" size={18} color="#fff" style={styles.btnIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030711' },
  safeArea: { flex: 1 },
  starField: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  contentWrap: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 6 },
  flexOne: { flex: 1 },
  heroArt: { alignItems: 'center', marginBottom: 18 },
  heroIllustration: {
    width: width - 44,
    height: 270,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#8a2be2',
    shadowOpacity: 0.24,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  sunGlow: {
    position: 'absolute',
    top: 24,
    left: 46,
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  mountainOne: {
    position: 'absolute',
    bottom: 72,
    left: 22,
    width: 140,
    height: 110,
    backgroundColor: '#31435e',
    borderRadius: 70,
    transform: [{ rotate: '-12deg' }],
  },
  mountainTwo: {
    position: 'absolute',
    bottom: 62,
    right: 28,
    width: 170,
    height: 120,
    backgroundColor: '#243546',
    borderRadius: 85,
    transform: [{ rotate: '10deg' }],
  },
  mountainThree: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 126,
    backgroundColor: '#172436',
  },
  treeLeft: {
    position: 'absolute',
    bottom: 34,
    left: 90,
    width: 20,
    height: 60,
    backgroundColor: '#243a4e',
    borderRadius: 10,
  },
  treeRight: {
    position: 'absolute',
    bottom: 30,
    right: 86,
    width: 18,
    height: 56,
    backgroundColor: '#243a4e',
    borderRadius: 9,
  },
  spark: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  sparkA: { width: 8, height: 8, left: 74, top: 90 },
  sparkB: { width: 5, height: 5, right: 72, top: 78 },
  peopleScene: {
    position: 'absolute',
    left: 86,
    bottom: 36,
    width: 180,
    height: 92,
    justifyContent: 'center',
  },
  personOne: {
    position: 'absolute',
    left: 20,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1c2b3c',
  },
  personTwo: {
    position: 'absolute',
    right: 24,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#32495f',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  quoteText: {
    color: '#fbd8b8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 22,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 14,
    marginBottom: 18,
  },
  promptList: { gap: 10, marginBottom: 16 },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  promptCardActive: {
    borderColor: '#ff7a18',
    backgroundColor: 'rgba(255,122,24,0.12)',
    transform: [{ scale: 1.01 }],
  },
  promptIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(138,43,226,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promptTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  favoriteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  orbWrap: { alignItems: 'center', marginVertical: 16 },
  orb: {
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.31,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#d946ef',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  orbGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  orbIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  missionText: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 14,
    textAlign: 'center',
  },
  missionList: { marginBottom: 20, alignItems: 'center' },
  missionItem: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    marginBottom: 6,
  },
  illustrationCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  coffeeScene: {
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  coffeeGlow: { ...StyleSheet.absoluteFillObject },
  windowPanel: {
    position: 'absolute',
    bottom: 44,
    left: 44,
    right: 44,
    height: 84,
    backgroundColor: 'rgba(7, 14, 28, 0.75)',
    borderRadius: 24,
  },
  tableTop: {
    position: 'absolute',
    bottom: 16,
    left: 26,
    right: 26,
    height: 18,
    backgroundColor: '#2b3950',
    borderRadius: 9,
  },
  personSeatA: {
    position: 'absolute',
    left: 70,
    bottom: 24,
    width: 42,
    height: 54,
    borderRadius: 24,
    backgroundColor: '#243447',
  },
  personSeatB: {
    position: 'absolute',
    right: 72,
    bottom: 24,
    width: 42,
    height: 56,
    borderRadius: 24,
    backgroundColor: '#34495e',
  },
  lampScene: {
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  lampGlow: { ...StyleSheet.absoluteFillObject },
  lamp: {
    position: 'absolute',
    top: 24,
    left: 138,
    width: 28,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f3d7af',
  },
  personSeatC: {
    position: 'absolute',
    left: 84,
    bottom: 24,
    width: 40,
    height: 54,
    borderRadius: 22,
    backgroundColor: '#243447',
  },
  personSeatD: {
    position: 'absolute',
    right: 88,
    bottom: 24,
    width: 40,
    height: 54,
    borderRadius: 22,
    backgroundColor: '#31495e',
  },
  fieldLabel: {
    color: '#f7d6ff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  moodCard: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  moodCardActive: {
    borderColor: '#ff7a18',
    backgroundColor: 'rgba(255,122,24,0.16)',
  },
  moodText: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600' },
  moodTextActive: { color: '#fff4eb' },
  feelingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  feelingCard: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  feelingCardActive: {
    borderColor: '#ff7a18',
    backgroundColor: 'rgba(255,122,24,0.16)',
  },
  feelingText: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600' },
  feelingTextActive: { color: '#fff4eb' },
  textBox: {
    minHeight: 120,
    maxHeight: 180,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 6,
  },
  counterText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginBottom: 14,
  },
  primaryBtn: { marginTop: 4, marginBottom: 8 },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: '#8a2be2',
    shadowOpacity: 0.30,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  btnIcon: { marginLeft: 8 },
  reflectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16,
  },
  reflectionText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  highlightText: {
    color: '#ffd97d',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 10,
  },
});
