import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions,
  Platform, ScrollView, Pressable, Image, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#120E23', // Warm midnight violet
  violet: '#8B5CF6',
  indigo: '#4F46E5',
  amber: '#D97706',
  gold: '#F59E0B',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBrd: 'rgba(255, 255, 255, 0.15)',
  textLight: 'rgba(255, 255, 255, 0.65)',
  textMid: 'rgba(255, 255, 255, 0.88)'
};

type ScreenState = 'welcome' | 'examples' | 'write' | 'loading' | 'analysis' | 'complete';

interface AIResult {
  insight: string;
  whyReturns: string;
  advice: string[];
  reframe: string;
  action: string;
}

// ── Custom Empathetic AI Insight Generator ───────────────────────────────
const generateAIResult = (thought: string): AIResult => {
  const text = thought.toLowerCase();
  
  // Default values
  let insight = "This recurring thought suggests that there is a topic or situation that is holding significant importance or feels unfinished in your mind. Recurring thoughts often reflect core goals, fears, or situations that are asking for resolution.";
  let whyReturns = "The mind repeats thoughts when it feels there is an unresolved emotion, a potential risk, or a target that hasn't been met yet. It acts as an internal alert system to keep you focused on what it perceives as important.";
  let advice = [
    "Write down one micro-action you can take today.",
    "Notice the thought without labeling it as bad or good.",
    "Practice shifting focus to your immediate surroundings."
  ];
  let reframe = "I am aware of my thoughts, and I can choose how to act on them.";
  let action = "Spend 10 minutes doing something completely unrelated to clear your mind.";

  // Keyword check for Failure/Mistakes
  if (text.includes("fail") || text.includes("mistake") || text.includes("perfect") || text.includes("lose") || text.includes("scared")) {
    insight = "This thought is often connected to a deep desire to succeed and do well, which manifests as a fear of making mistakes. Your mind is trying to protect you from failure, but it is doing so by keeping you on high alert.";
    whyReturns = "Fear of failure keeps repeating because your brain perceives mistakes as a threat to your security or self-worth. By repeating the thought, it hopes to keep you vigilant and prevent errors.";
    advice = [
      "Remind yourself that mistakes are simply points of learning.",
      "List three things you did well recently, no matter how small.",
      "Accept that perfection is not required to move forward."
    ];
    reframe = "Failure is not a reflection of my worth; it is just a step towards growth.";
    action = "Write down one mistake you made in the past and what you learned from it.";
  }
  // Keyword check for Work/Overwhelm
  else if (text.includes("work") || text.includes("job") || text.includes("busy") || text.includes("overwhelm") || text.includes("time") || text.includes("stress") || text.includes("office") || text.includes("study") || text.includes("exam")) {
    insight = "This thought indicates a high volume of mental load and pressure. You may feel like you are carrying a lot of responsibilities without sufficient space to process them, leading to work-related anxiety.";
    whyReturns = "Your mind repeats work stress because it is seeking relief or resolution. It is constantly reminding you of outstanding tasks in an attempt to ensure they are completed, even when you are trying to rest.";
    advice = [
      "Separate your identity from your output/workload.",
      "Practice setting one clear boundary for your time today.",
      "Take 5 deep breaths before opening your task list."
    ];
    reframe = "My productivity does not define my value. I am allowed to rest.";
    action = "Create a 'Done' list to celebrate what you have already finished today.";
  }
  // Keyword check for Money/Abundance
  else if (text.includes("money") || text.includes("financial") || text.includes("debt") || text.includes("business") || text.includes("poor") || text.includes("buy") || text.includes("bills")) {
    insight = "This thought reflects a need for security, stability, or independence. Focus on finances is natural, but recurring thoughts about it can indicate uncertainty about your future security.";
    whyReturns = "Financial anxiety repeats because survival and safety are core priorities for the brain. Any perceived risk to your stability triggers repeating survival warnings to force you to plan.";
    advice = [
      "Focus on the immediate next action you can take to manage your budget.",
      "Practice gratitude for the resources you currently have.",
      "Avoid checking financial status multiple times a day."
    ];
    reframe = "I am capable of taking smart steps toward financial stability and abundance.";
    action = "Spend 10 minutes tracking your actual expenses to replace worry with facts.";
  }
  // Keyword check for Relationships/Social
  else if (text.includes("say") || text.includes("wrong") || text.includes("friend") || text.includes("relationship") || text.includes("lonely") || text.includes("love") || text.includes("miss") || text.includes("people") || text.includes("him") || text.includes("her") || text.includes("them")) {
    insight = "This thought points to a deep valuing of connection, social acceptance, or harmony. Replaying social interactions or worrying about relationships indicates a desire to belong and feel valued by others.";
    whyReturns = "Human beings are wired for connection. Your mind replays social moments or relationship worries because it wants to ensure you are safe within your social circles and haven't created conflict.";
    advice = [
      "Remind yourself that people usually focus on themselves, not your minor slip-ups.",
      "Reach out to one friend with a simple, kind message.",
      "Practice self-compassion for any social awkwardness."
    ];
    reframe = "I am worthy of connection, and my relationships do not depend on being perfect.";
    action = "Send a text to a friend expressing appreciation for them.";
  }
  // Keyword check for Self-Worth/Comparison
  else if (text.includes("good enough") || text.includes("ugly") || text.includes("bad") || text.includes("worst") || text.includes("compare") || text.includes("hate") || text.includes("self") || text.includes("body") || text.includes("fat") || text.includes("useless")) {
    insight = "This thought shows a tendency toward self-criticism and comparison. It highlights a recurring pattern of measuring yourself against an external standard, which can deplete your self-worth.";
    whyReturns = "Comparison loops repeat because the brain is constantly checking your standing in the group. If it feels you are not meeting an expectation, it repeats criticism as a harsh way to motivate you.";
    advice = [
      "Treat yourself with the same kindness you would offer to a close friend.",
      "Limit social media usage which triggers comparison loops.",
      "Acknowledge your efforts rather than just your results."
    ];
    reframe = "I am enough exactly as I am in this moment. I don't need to prove my worth.";
    action = "Write down three things you genuinely appreciate about yourself.";
  }

  return { insight, whyReturns, advice, reframe, action };
};

// ── Particle Component ───────────────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.4);

  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-30 - delay * 0.05, { duration: 3200 + delay }),
      withTiming(10, { duration: 3200 + delay })
    ), -1, true);

    op.value = withRepeat(withSequence(
      withTiming(0.85, { duration: 2000 + delay }),
      withTiming(0.2, { duration: 2000 + delay })
    ), -1, true);
  }, []);

  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value
  }));

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color
      },
      s
    ]} />
  );
}

// ── Premium Gradient Button ──────────────────────────────────────────────
function GradBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={[styles.gradBtnWrap, s]}>
      <Pressable
        onPressIn={() => {
          if (!disabled) {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(e){}
            sc.value = withSpring(0.96);
          }
        }}
        onPressOut={() => { sc.value = withSpring(1); }}
        onPress={onPress}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={disabled ? ['#3A3050', '#25203A'] : [C.violet, C.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradBtn}
        >
          <Text style={[styles.gradBtnText, disabled && { color: 'rgba(255,255,255,0.25)' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MAIN SCREEN COMPONENT ────────────────────────────────────────────────
export default function WriteRecurringThoughtScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [thoughtText, setThoughtText] = useState('');
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  
  // Loading screen active texts state
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const zoomScale = useSharedValue(1);

  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          task_name: 'Write Recurring Thought', 
          points: 500,
          thought: thoughtText
        }),
      });
    } catch (e) {
      console.error('completeTask error:', e);
    }
  };

  useEffect(() => {
    // Cinematic Background slow scale (Ken Burns)
    zoomScale.value = 1;
    zoomScale.value = withTiming(1.15, { duration: 60000 });
  }, [screen]);

  // Loading text cycles
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (screen === 'loading') {
      const texts = [
        "Analyzing your recurring thought...",
        "Understanding emotional patterns...",
        "Finding supportive insights..."
      ];
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => {
          if (prev < texts.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            // Finished loading -> show analysis
            runOnJS(showAnalysisScreen)();
            return prev;
          }
        });
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen]);

  const showAnalysisScreen = () => {
    const analysis = generateAIResult(thoughtText);
    setAiResult(analysis);
    setScreen('analysis');
  };

  const handleStartAnalysis = () => {
    if (!thoughtText.trim()) return;
    setScreen('loading');
    setLoadingTextIndex(0);
  };

  const handleReturnHome = () => {
    completeTask();
    router.replace('/(tabs)' as any);
  };

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoomScale.value }]
  }));

  // ──────── SCREEN 1 — INTRODUCTION ────────
  if (screen === 'welcome') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        
        {/* Full-Screen Edge-to-Edge Background */}
        <View style={styles.backgroundContainer}>
          <Animated.Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={[styles.backgroundImage, zoomStyle]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(18, 14, 35, 0.45)', 'rgba(18, 14, 35, 0.85)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Ambient Particles */}
        {[
          { x: 40, y: 150, size: 6, color: '#C4B5FD', delay: 0 },
          { x: width - 80, y: 220, size: 4, color: '#FCD34D', delay: 400 },
          { x: 80, y: 360, size: 5, color: '#8B5CF6', delay: 800 },
          { x: width - 100, y: 480, size: 6, color: '#E0A96D', delay: 200 },
        ].map((p, i) => <Particle key={i} {...p} />)}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <Animated.View entering={FadeInDown.duration(1000)} style={styles.welcomeIntro}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🌱 Self-Reflection Task</Text>
              </View>
              <Text style={styles.welcomeTitle}>Write Recurring{'\n'}Thought</Text>
              <Text style={styles.welcomeSubtitle}>
                Sometimes the same thought keeps visiting us. Writing it down is the first step toward understanding it.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).duration(800)} style={styles.glassPromptCard}>
              <Text style={styles.glassPromptLabel}>Think of it as:</Text>
              <Text style={styles.glassPromptText}>
                "What is the one thought that keeps visiting your mind again and again?"
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700).duration(700)} style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn label="Begin Journey" onPress={() => setScreen('examples')} />
            </Animated.View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 2 — UNDERSTANDING / EXAMPLES ────────
  if (screen === 'examples') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        <View style={styles.backgroundContainer}>
          <Animated.Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={[styles.backgroundImage, zoomStyle]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(18, 14, 35, 0.65)', 'rgba(18, 14, 35, 0.9)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('welcome')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Examples</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Examples of Recurring Thoughts</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.gridContainer}>
                {/* Stress Category */}
                <View style={styles.exampleCard}>
                  <Text style={styles.categoryTitle}>🧠 Stress</Text>
                  <Text style={styles.exampleBullet}>• "What if I fail?"</Text>
                  <Text style={styles.exampleBullet}>• "I have too much work."</Text>
                </View>

                {/* Relationships Category */}
                <View style={styles.exampleCard}>
                  <Text style={styles.categoryTitle}>❤️ Relationships</Text>
                  <Text style={styles.exampleBullet}>• "Did I say the wrong thing?"</Text>
                  <Text style={styles.exampleBullet}>• "I miss that person."</Text>
                </View>

                {/* Goals Category */}
                <View style={styles.exampleCard}>
                  <Text style={styles.categoryTitle}>🎯 Goals</Text>
                  <Text style={styles.exampleBullet}>• "I need to start my business."</Text>
                  <Text style={styles.exampleBullet}>• "I want to become financially independent."</Text>
                </View>

                {/* Self Category */}
                <View style={styles.exampleCard}>
                  <Text style={styles.categoryTitle}>🌿 Self</Text>
                  <Text style={styles.exampleBullet}>• "Am I good enough?"</Text>
                  <Text style={styles.exampleBullet}>• "I should take better care of myself."</Text>
                </View>
              </Animated.View>

              <Text style={styles.bottomMessage}>
                There is no right or wrong thought. Simply notice what keeps returning.
              </Text>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn label="Continue" onPress={() => setScreen('write')} />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 3 — WRITE YOUR THOUGHT (Cream Paper Notebook) ────────
  if (screen === 'write') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        <View style={styles.backgroundContainer}>
          <Animated.Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={[styles.backgroundImage, zoomStyle]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(18, 14, 35, 0.7)', 'rgba(18, 14, 35, 0.95)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('examples')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Write Journal</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.writeHeader}>
                <Text style={styles.writeTitle}>Write Your Recurring Thought</Text>
                <Text style={styles.writeSubtitle}>Write honestly. No one else will see this.</Text>
              </Animated.View>

              {/* Lined Premium Notebook UI */}
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.notebookContainer}>
                {/* Decorative Pen Illustration */}
                <MaterialCommunityIcons name="feather" size={28} color="rgba(140, 125, 112, 0.5)" style={styles.featherPenIcon} />
                
                {/* Background paper lines */}
                <View style={styles.notebookLinesWrapper}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <View key={i} style={styles.notebookLine} />
                  ))}
                </View>

                <TextInput
                  style={styles.notebookInput}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  placeholder="I keep thinking about..."
                  placeholderTextColor="rgba(140, 125, 112, 0.45)"
                  value={thoughtText}
                  onChangeText={setThoughtText}
                  maxLength={500}
                />
              </Animated.View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn 
                label="Analyze My Thought" 
                onPress={handleStartAnalysis} 
                disabled={!thoughtText.trim()} 
              />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 4 — AI LOADING STATE ────────
  if (screen === 'loading') {
    const loadingTexts = [
      "Analyzing your recurring thought...",
      "Understanding emotional patterns...",
      "Finding supportive insights..."
    ];
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient colors={['#1F1C2C', '#3A6073', '#1F1C2C']} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.responsiveContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            
            <ActivityIndicator size="large" color={C.violet} style={{ marginBottom: 30 }} />
            
            <Animated.View entering={FadeIn.duration(500)} style={styles.loadingTextContainer}>
              <Text style={styles.loadingText}>{loadingTexts[loadingTextIndex]}</Text>
            </Animated.View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 5 — AI THOUGHT ANALYSIS DISPLAY ────────
  if (screen === 'analysis') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />

        <View style={styles.backgroundContainer}>
          <Animated.Image
            source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
            style={[styles.backgroundImage, zoomStyle]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(18, 14, 35, 0.7)', 'rgba(18, 14, 35, 0.95)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.responsiveContainer}>
            
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('write')} style={styles.glassBackBtn}>
                <Feather name="chevron-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>AI Insights</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeInDown.duration(800)} style={styles.analysisHeader}>
                <Text style={styles.analysisTitle}>Your Personal Insights</Text>
                <Text style={styles.analysisSubtitle}>Reflection and Reframes</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                {/* Card 1: Your Thought */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardHeader}>📝 Your Thought</Text>
                  <Text style={styles.cardBodyItalic}>"{thoughtText}"</Text>
                </View>

                {/* Card 2: AI Insight */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardHeader}>🧠 AI Insight</Text>
                  <Text style={styles.cardBodyText}>{aiResult?.insight}</Text>
                </View>

                {/* Card 3: Why It Keeps Returning */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardHeader}>💭 Why It Might Return</Text>
                  <Text style={styles.cardBodyText}>{aiResult?.whyReturns}</Text>
                </View>

                {/* Card 4: Gentle Advice */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardHeader}>❤️ Gentle Advice</Text>
                  {aiResult?.advice.map((bullet, index) => (
                    <View key={index} style={styles.bulletRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>

                {/* Card 5: Positive Reframe */}
                <View style={styles.glassCard}>
                  <Text style={styles.cardHeader}>✨ Positive Reframe</Text>
                  <View style={styles.reframeBox}>
                    <Text style={styles.reframeLabel}>Healthy Perspective:</Text>
                    <Text style={styles.reframeText}>"{aiResult?.reframe}"</Text>
                  </View>
                </View>

                {/* Card 6: Small Action */}
                <View style={[styles.glassCard, { borderColor: 'rgba(139, 92, 246, 0.4)' }]}>
                  <Text style={[styles.cardHeader, { color: '#C4B5FD' }]}>🌱 Small Action Today</Text>
                  <Text style={styles.cardBodyText}>{aiResult?.action}</Text>
                </View>
              </Animated.View>
            </ScrollView>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <GradBtn label="Finish Reflection" onPress={() => setScreen('complete')} />
            </View>

          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ──────── SCREEN 6 — COMPLETION SCREEN ────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      <View style={styles.backgroundContainer}>
        <Image
          source={require('../assets/images/sun_rise_from_moutain_phot_202607011041.jpeg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(28, 12, 48, 0.35)', 'rgba(18, 14, 35, 0.88)']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.responsiveContainer}>
          
          <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
            
            <Animated.View entering={FadeInDown.duration(900)} style={styles.completeHeader}>
              <Text style={styles.completeTitle}>✨ Reflection Complete</Text>
              <Text style={styles.completeSubtitle}>
                You took an important step by understanding your recurring thought instead of ignoring it.
              </Text>
            </Animated.View>

            {/* Statistics Card Grid */}
            <Animated.View entering={FadeInDown.delay(250).duration(800)} style={styles.statsGrid}>
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>📝</Text>
                  <Text style={styles.statValue}>1</Text>
                  <Text style={styles.statLabel}>Thought Written</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🧠</Text>
                  <Text style={styles.statValue}>Yes</Text>
                  <Text style={styles.statLabel}>Reflected</Text>
                </View>
              </View>
              <View style={[styles.statRow, { marginTop: 12 }]}>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>🌱</Text>
                  <Text style={styles.statValue}>Created</Text>
                  <Text style={styles.statLabel}>Positive Reframe</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statEmoji}>❤️</Text>
                  <Text style={styles.statValue}>Increased</Text>
                  <Text style={styles.statLabel}>Self Awareness</Text>
                </View>
              </View>
            </Animated.View>

            {/* Quote Banner */}
            <Animated.View entering={FadeInDown.delay(500).duration(800)} style={styles.quoteBanner}>
              <Text style={styles.quoteBannerText}>
                "Awareness is the beginning of change."
              </Text>
            </Animated.View>

          </ScrollView>

          <View style={styles.actionBlock}>
            <GradBtn label="Return Home" onPress={handleReturnHome} />
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Stylesheets ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg
  },
  safeArea: {
    flex: 1
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  glassBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  welcomeIntro: {
    marginTop: height * 0.08,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  welcomeTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 46,
    textAlign: 'center',
    marginBottom: 12
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: C.textLight,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22
  },
  glassPromptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 20,
  },
  glassPromptLabel: {
    color: C.violet,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center'
  },
  glassPromptText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 4
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  gridContainer: {
    width: '100%',
  },
  exampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8
  },
  exampleBullet: {
    fontSize: 14,
    color: C.textLight,
    lineHeight: 20,
    marginLeft: 6
  },
  bottomMessage: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic'
  },

  // Write screen styles
  writeHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  writeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6
  },
  writeSubtitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center'
  },
  notebookContainer: {
    backgroundColor: '#FAF6EE',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    height: 300,
    position: 'relative',
    shadowColor: '#120E23',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E6DEC9'
  },
  featherPenIcon: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10
  },
  notebookLinesWrapper: {
    ...StyleSheet.absoluteFillObject,
    top: 56,
    paddingHorizontal: 20,
    pointerEvents: 'none'
  },
  notebookLine: {
    height: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 125, 112, 0.15)',
    width: '100%'
  },
  notebookInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 28,
    color: '#4B3E32',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 28,
    paddingHorizontal: 4,
    paddingBottom: 20
  },

  // Loading screen styles
  loadingTextContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: C.textMid,
    fontWeight: '600',
    textAlign: 'center'
  },

  // Analysis display styles
  analysisHeader: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center'
  },
  analysisSubtitle: {
    fontSize: 14,
    color: C.textLight,
    marginTop: 4
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: C.violet,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10
  },
  cardBodyText: {
    fontSize: 15,
    color: C.textMid,
    lineHeight: 23
  },
  cardBodyItalic: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
    color: '#E0D8F0'
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  bulletPoint: {
    color: C.violet,
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20
  },
  bulletText: {
    fontSize: 15,
    color: C.textMid,
    lineHeight: 20,
    flex: 1
  },
  reframeBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)'
  },
  reframeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C4B5FD',
    marginBottom: 4
  },
  reframeText: {
    fontSize: 15,
    color: '#FFF',
    fontStyle: 'italic',
    lineHeight: 22
  },

  // Completion Screen styles
  completeScroll: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: height * 0.05
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10
  },
  completeSubtitle: {
    color: C.textLight,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22
  },
  statsGrid: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    marginBottom: 20
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10
  },
  statEmoji: {
    fontSize: 26,
    marginBottom: 6
  },
  statValue: {
    color: '#C4B5FD',
    fontSize: 16,
    fontWeight: '900'
  },
  statLabel: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center'
  },
  quoteBanner: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBrd,
    padding: 20,
    width: '100%'
  },
  quoteBannerText: {
    color: '#C4B5FD',
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },

  // Button styles
  gradBtnWrap: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    shadowColor: C.violet,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6
  },
  gradBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  gradBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
