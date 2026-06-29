import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  Dimensions, ScrollView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue,
  withSpring, withTiming, withRepeat, withSequence, runOnJS, withDelay,
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg:         '#0F0A1E',
  midnight:   '#1A0A2E',
  purple:     '#7C3AED',
  violet:     '#8B5CF6',
  indigo:     '#4F46E5',
  lavender:   '#C4B5FD',
  gold:       '#F59E0B',
  golden:     '#FCD34D',
  sunrise:    '#FF6B35',
  white:      '#FFFFFF',
  offWhite:   '#F5F3FF',
  glass:      'rgba(255,255,255,0.08)',
  glassBrd:   'rgba(255,255,255,0.15)',
  textLight:  'rgba(255,255,255,0.55)',
  textMid:    'rgba(255,255,255,0.8)',
};

type Screen = 'intro'|'catch'|'analyze'|'break'|'replace'|'believe'|'plant'|'reflect'|'complete';

const PROGRESS: Record<Screen,number> = {
  intro:0, catch:0.12, analyze:0.25, break:0.37,
  replace:0.5, believe:0.62, plant:0.75, reflect:0.87, complete:1,
};

const AFFIRMATIONS = [
  { id:'1', icon:'⭐', text:'I am learning every day.' },
  { id:'2', icon:'🌿', text:'Failure teaches me.' },
  { id:'3', icon:'💎', text:'I deserve good things.' },
  { id:'4', icon:'🛡️', text:'I am stronger than my fears.' },
];

const MOODS = [
  { emoji:'😊', label:'Better' },
  { emoji:'😌', label:'Calm' },
  { emoji:'💪', label:'Motivated' },
  { emoji:'❤️', label:'Hopeful' },
];

// ── Floating Particle ─────────────────────────────────────────────────────
function Particle({ x, y, size, color, delay }: any) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0.4);
  useEffect(() => {
    ty.value = withRepeat(withSequence(
      withTiming(-(15 + delay * 0.01), { duration: 2500 + delay }),
      withTiming(5, { duration: 2500 + delay })
    ), -1, true);
    op.value = withRepeat(withSequence(
      withTiming(0.8, { duration: 1800 + delay }),
      withTiming(0.15, { duration: 1800 + delay })
    ), -1, true);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));
  return <Animated.View style={[{ position:'absolute', left:x, top:y, width:size, height:size, borderRadius:size/2, backgroundColor:color }, s]} />;
}

// ── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withSpring(progress * (width - 60), { damping: 18 }); }, [progress]);
  const s = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <View style={ss.progressTrack}>
      <Animated.View style={[ss.progressFill, s]} />
    </View>
  );
}

// ── Header ────────────────────────────────────────────────────────────────
function Header({ screen }: { screen: Screen }) {
  return (
    <View style={ss.header}>
      <Text style={ss.headerTitle} numberOfLines={1}>Replace One Negative Thought</Text>
      <ProgressBar progress={PROGRESS[screen]} />
    </View>
  );
}

// ── Gradient Button ───────────────────────────────────────────────────────
function GradBtn({ label, onPress, disabled }: { label:string; onPress:()=>void; disabled?:boolean }) {
  const sc = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform:[{ scale:sc.value }] }));
  return (
    <Animated.View style={[ss.gradBtnWrap, s]}>
      <Pressable onPressIn={() => { sc.value = withSpring(0.96); }}
                 onPressOut={() => { sc.value = withSpring(1); }}
                 onPress={onPress} disabled={disabled} style={{ flex:1 }}>
        <LinearGradient colors={disabled ? ['#3D3D5C','#2D2D4E'] : [C.violet, C.indigo]}
          start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={ss.gradBtn}>
          <Text style={[ss.gradBtnText, disabled && { color:'rgba(255,255,255,0.3)' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Intro
// ══════════════════════════════════════════════════════════════════════════
function IntroScreen({ onBegin }: { onBegin:()=>void }) {
  const sunGlow = useSharedValue(0.6);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    sunGlow.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000 }), withTiming(0.5, { duration: 2000 })
    ), -1, true);
    btnScale.value = withRepeat(withSequence(
      withTiming(1.04, { duration: 1600 }), withTiming(1, { duration: 1600 })
    ), -1, true);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: sunGlow.value }));
  const btnStyle  = useAnimatedStyle(() => ({ transform:[{ scale: btnScale.value }] }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#050110','#0F0A1E','#1A0A2E','#2D1060']} style={StyleSheet.absoluteFill} />

      {/* Particles */}
      {[
        { x:30,  y:130, size:6, color:C.violet, delay:0   },
        { x:width-50, y:200, size:4, color:C.gold,   delay:500 },
        { x:70,  y:310, size:5, color:C.lavender, delay:800 },
        { x:width-80, y:400, size:7, color:C.violet, delay:300 },
        { x:width/2, y:90, size:4, color:C.golden,  delay:1000},
        { x:130, y:height*0.55, size:5, color:C.gold, delay:600},
        { x:width-130, y:height*0.6, size:3, color:C.lavender, delay:200},
      ].map((p,i) => <Particle key={i} {...p} />)}

      <SafeAreaView style={{ flex:1, paddingHorizontal:28 }}>
        {/* Illustration */}
        <Animated.View entering={FadeIn.duration(1200)} style={ss.introIllus}>
          <Animated.View style={[ss.sunGlow, glowStyle]} />
          <LinearGradient colors={['#F59E0B','#FF6B35','#7C3AED']} style={ss.sunCircle} />
          <View style={ss.mtnLeft}  />
          <View style={ss.mtnRight} />
          <View style={ss.mtnCenter}/>
          <Text style={ss.meditEmoji}>🧘</Text>
        </Animated.View>

        {/* Text */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={{ flex:1, justifyContent:'center' }}>
          <View style={ss.introBadge}>
            <Text style={ss.introBadgeText}>🧠  Medium  •  20 Minutes</Text>
          </View>
          <Text style={ss.introTitle}>Replace One{'\n'}<Text style={{ color:C.violet }}>Negative</Text> Thought</Text>
          <Text style={ss.introDesc}>
            Your thoughts shape your reality.{'\n'}Today we'll transform one limiting belief into a stronger mindset.
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={{ marginBottom:40 }}>
          <Animated.View style={btnStyle}>
            <TouchableOpacity onPress={onBegin} activeOpacity={0.85}>
              <LinearGradient colors={[C.violet, C.indigo,'#3730A3']}
                start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={ss.introBtn}>
                <Text style={ss.introBtnText}>Begin Journey</Text>
                <Ionicons name="arrow-forward" size={20} color={C.white} style={{ marginLeft:10 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Catch Your Thought
// ══════════════════════════════════════════════════════════════════════════
function CatchScreen({ thought, setThought, onContinue }: any) {
  return (
    <View style={{ flex:1 }}>
      <StatusBar style="dark" />
      <LinearGradient colors={[C.offWhite,'#EDE9FE','#DDD6FE']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="catch" />
        <ScrollView contentContainerStyle={{ padding:24, paddingBottom:130 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.catchTitle}>What's bothering{'\n'}you today?</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={ss.catchInputCard}>
            <TextInput style={ss.catchInput} placeholder="Write your negative thought..."
              placeholderTextColor="#A78BFA" value={thought} onChangeText={setThought}
              multiline maxLength={200} />
            <Text style={ss.charCount}>{thought.length}/200</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={ss.exLabel}>Examples</Text>
            {['I always fail.','Nobody likes me.',"I can't do this."].map((ex,i) => (
              <TouchableOpacity key={i} style={ss.exPill} onPress={() => setThought(ex)} activeOpacity={0.7}>
                <Text style={ss.exPillText}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

        <View style={ss.fixedFooter}>
          <GradBtn label="Continue" onPress={onContinue} disabled={!thought.trim()} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Thought Analyzer
// ══════════════════════════════════════════════════════════════════════════
function AnalyzeScreen({ onContinue }: any) {
  const [revealed, setRevealed] = useState(false);
  const cloudY = useSharedValue(0);
  const ringRot = useSharedValue(0);

  useEffect(() => {
    cloudY.value = withRepeat(withSequence(
      withTiming(-12, { duration: 2000 }), withTiming(8, { duration: 2000 })
    ), -1, true);
    ringRot.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
    const t = setTimeout(() => setRevealed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const cloudStyle = useAnimatedStyle(() => ({ transform:[{ translateY: cloudY.value }] }));
  const ringStyle  = useAnimatedStyle(() => ({ transform:[{ rotate:`${ringRot.value}deg` }] }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#050110','#0F0A1E','#1A0A2E']} style={StyleSheet.absoluteFill} />
      {[...Array(5)].map((_,i) => <Particle key={i} x={60+i*60} y={60+i*30} size={3} color={i%2?C.violet:C.gold} delay={i*400} />)}
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="analyze" />
        <View style={{ flex:1, alignItems:'center', justifyContent:'space-around', padding:24 }}>
          <Animated.View entering={FadeIn.duration(800)} style={{ alignItems:'center' }}>
            <View style={{ alignItems:'center', justifyContent:'center' }}>
              <Animated.View style={[ss.analyzeRing, ringStyle]} />
              <Animated.View style={cloudStyle}>
                <Text style={{ fontSize:90, textShadowColor:C.violet, textShadowRadius:30 }}>⛈️</Text>
              </Animated.View>
            </View>
            <Text style={ss.analyzeTitle}>{revealed ? 'Your thought contains' : 'Analyzing your thought…'}</Text>
            {!revealed && <Text style={ss.analyzeSub}>Finding thinking patterns…</Text>}
          </Animated.View>

          {revealed && (
            <Animated.View entering={FadeInDown.duration(700)} style={{ width:'100%' }}>
              <View style={ss.analyzeCard}>
                {['Self-doubt','Overthinking','Fear'].map((item,i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i*200).duration(500)} style={ss.analyzeRow}>
                    <View style={ss.analyzeCheckCircle}>
                      <Ionicons name="checkmark" size={15} color={C.white} />
                    </View>
                    <Text style={ss.analyzeItemText}>{item}</Text>
                  </Animated.View>
                ))}
                <Text style={ss.analyzeHelp}>We'll help you transform this.</Text>
              </View>
            </Animated.View>
          )}

          {revealed && (
            <Animated.View entering={FadeInUp.delay(700).duration(600)} style={{ width:'100%' }}>
              <GradBtn label="Continue" onPress={onContinue} />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Break the Thought
// ══════════════════════════════════════════════════════════════════════════
function BreakScreen({ tapsLeft, setTapsLeft, onComplete }: any) {
  const shake = useSharedValue(0);
  const cScale = useSharedValue(1);
  const lightOp = useSharedValue(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    shake.value = withRepeat(withSequence(
      withTiming(-5, { duration: 1800 }), withTiming(5, { duration: 1800 })
    ), -1, true);
  }, []);

  const handleTap = () => {
    if (tapsLeft <= 0 || broken) return;
    Haptics.impactAsync(tapsLeft === 1 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    shake.value = withSequence(
      withTiming(-18,{ duration:60 }), withTiming(18,{ duration:60 }),
      withTiming(-10,{ duration:60 }), withTiming(0,{ duration:60 })
    );
    cScale.value = withSequence(withTiming(1.15,{ duration:100 }), withSpring(1,{ damping:8 }));
    const next = tapsLeft - 1;
    setTapsLeft(next);
    if (next === 0) {
      setBroken(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cScale.value = withSequence(withTiming(1.5,{ duration:300 }), withTiming(0,{ duration:400 }));
      lightOp.value = withTiming(1, { duration: 700 });
      setTimeout(onComplete, 2200);
    }
  };

  const cloudStyle = useAnimatedStyle(() => ({ transform:[{ translateX:shake.value },{ scale:cScale.value }] }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: lightOp.value }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#050110','#0F0A1E','#1A0A2E']} style={StyleSheet.absoluteFill} />
      {[...Array(8)].map((_,i) => <Particle key={i} x={20+i*(width/8)} y={50+i*20} size={2} color={i%3?C.violet:C.gold} delay={i*200} />)}
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="break" />
        <View style={{ flex:1, alignItems:'center', padding:24 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.breakTitle}>Break the Negative Thought</Text>
            <Text style={ss.breakSub}>Tap {tapsLeft} times to break this thought.</Text>
          </Animated.View>

          <TouchableOpacity onPress={handleTap} activeOpacity={0.85} style={{ alignItems:'center', marginTop:16 }} disabled={broken}>
            <Animated.View style={cloudStyle}>
              <Text style={{ fontSize:110, textShadowColor:C.violet, textShadowRadius:40 }}>⛈️</Text>
            </Animated.View>
            <Animated.View style={[ss.lightBurst, lightStyle]}>
              <LinearGradient colors={['rgba(253,224,71,0)','rgba(253,224,71,0.45)','rgba(253,224,71,0)']}
                style={{ flex:1, borderRadius:200 }} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View entering={FadeIn.duration(600)} style={ss.counterWrap}>
            <Text style={ss.counterNum}>{String(tapsLeft).padStart(2,'0')}</Text>
            <Text style={ss.counterLabel}>TAPS LEFT</Text>
          </Animated.View>

          <View style={ss.breakHintCard}>
            <Ionicons name="flash" size={16} color={C.gold} />
            <Text style={ss.breakHintText}>Every tap makes it lighter. You are in control.</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 5 — Replace It
// ══════════════════════════════════════════════════════════════════════════
function ReplaceScreen({ selected, setSelected, custom, setCustom, onContinue }: any) {
  const canContinue = selected || custom.trim();
  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0A1E','#1A0832','#2D1B69']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="replace" />
        <ScrollView contentContainerStyle={{ padding:24, paddingBottom:130 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.replaceTitle}>Choose a healthier{'\n'}thought</Text>
            <Text style={ss.replaceSub}>Replace it with something positive and empowering.</Text>
          </Animated.View>

          <View style={{ marginTop:22, gap:12 }}>
            {AFFIRMATIONS.map((a,i) => {
              const sel = selected === a.id;
              return (
                <Animated.View key={a.id} entering={FadeInDown.delay(i*100).duration(500)}>
                  <TouchableOpacity style={[ss.affirmCard, sel && ss.affirmCardSel]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(a.id); setCustom(''); }}
                    activeOpacity={0.75}>
                    <Text style={ss.affirmIcon}>{a.icon}</Text>
                    <Text style={[ss.affirmText, sel && { color:C.white }]}>{a.text}</Text>
                    {sel && <Ionicons name="checkmark-circle" size={20} color={C.golden} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <View style={[ss.orRow,{ marginVertical:20 }]}>
            <View style={[ss.orLine,{ backgroundColor:'rgba(255,255,255,0.2)' }]} />
            <Text style={[ss.orText,{ color:C.textLight }]}>or</Text>
            <View style={[ss.orLine,{ backgroundColor:'rgba(255,255,255,0.2)' }]} />
          </View>

          <View style={ss.customRow}>
            <Feather name="edit-3" size={18} color={C.textLight} style={{ marginRight:12 }} />
            <TextInput style={ss.customInput} placeholder="Write your own thought"
              placeholderTextColor={C.textLight} value={custom}
              onChangeText={t => { setCustom(t); setSelected(''); }} />
          </View>
        </ScrollView>
        <View style={ss.fixedFooter}><GradBtn label="Continue" onPress={onContinue} disabled={!canContinue} /></View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 6 — Believe It
// ══════════════════════════════════════════════════════════════════════════
function BelieveScreen({ affirmation, onComplete }: any) {
  const breathe = useSharedValue(1);
  const glow    = useSharedValue(0.5);
  const fill    = useSharedValue(0);
  const [progress, setProgress] = useState(0);
  const interval = useRef<any>(null);

  useEffect(() => {
    breathe.value = withRepeat(withSequence(
      withTiming(1.12,{ duration:4000 }), withTiming(0.95,{ duration:4000 })
    ), -1, true);
    glow.value = withRepeat(withSequence(
      withTiming(1,{ duration:4000 }), withTiming(0.35,{ duration:4000 })
    ), -1, true);
  }, []);

  const startHold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const start = Date.now();
    interval.current = setInterval(() => {
      const pct = Math.min((Date.now()-start)/5000, 1);
      setProgress(pct);
      fill.value = withTiming(pct*(width-96),{ duration:100 });
      if (pct >= 1) {
        clearInterval(interval.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
      }
    }, 80);
  };

  const endHold = () => {
    clearInterval(interval.current);
    if (progress < 1) { setProgress(0); fill.value = withTiming(0,{ duration:300 }); }
  };

  const breatheStyle = useAnimatedStyle(() => ({ transform:[{ scale:breathe.value }] }));
  const glowStyle    = useAnimatedStyle(() => ({ opacity: glow.value }));
  const fillStyle    = useAnimatedStyle(() => ({ width: fill.value }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0A1E','#1A0832','#2D1B69']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="believe" />
        <View style={{ flex:1, alignItems:'center', justifyContent:'space-around', padding:24 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.believeTitle}>Believe your{'\n'}new thought</Text>
            <Text style={ss.believeSub}>Repeat it to yourself and feel the change.</Text>
          </Animated.View>

          {/* Breathing circle */}
          <Animated.View style={[ss.breathCircleOuter, breatheStyle]}>
            <Animated.View style={[ss.breathGlow, glowStyle]} />
            <LinearGradient colors={[C.violet,'#C026D3','#7C3AED']} style={ss.breathRing}>
              <View style={ss.breathInner}>
                <Text style={ss.breathAffirm}>{affirmation}</Text>
                <Text style={{ fontSize:20, marginTop:8 }}>💜</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={ss.believeInstruct}>Hold to absorb this positive thought</Text>

          {/* Hold button */}
          <Pressable
            onPressIn={startHold}
            onPressOut={endHold}
            style={ss.holdBtnOuter}
          >
            <LinearGradient colors={['#EC4899','#A855F7']}
              start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={ss.holdBtnBg}>
              <Animated.View style={[ss.holdFill, fillStyle]} />
              <Text style={ss.holdBtnText}>
                {progress >= 1 ? '✓ Absorbed!' : 'Hold for 5 seconds'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 7 — Plant Your Thought
// ══════════════════════════════════════════════════════════════════════════
function PlantScreen({ affirmation, onContinue }: any) {
  const seedY = useSharedValue(-150);
  const seedScale = useSharedValue(0);
  const rippleScale = useSharedValue(0.5);
  const rippleOpacity = useSharedValue(0);
  
  const sproutScale = useSharedValue(0);
  const stemHeight = useSharedValue(0);
  const leaf1Scale = useSharedValue(0);
  const leaf2Scale = useSharedValue(0);
  const leafGlow = useSharedValue(0.5);
  const affirmOpacity = useSharedValue(0);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    // 1. Seed scale: appear at 0ms, fall, bounce, fade out at 1300ms
    seedScale.value = withSequence(
      withTiming(1, { duration: 200 }), // appear
      withDelay(800, withSequence( // drop duration is 800ms, then bounce:
        withTiming(1.2, { duration: 100 }),
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 }) // fade out/shrink
      ))
    );

    // 2. Seed Y: drop from -150 to 0
    seedY.value = withSequence(
      withTiming(-150, { duration: 200 }), // hold at start
      withTiming(0, { duration: 800 })     // drop
    );

    // 3. Ripple
    rippleScale.value = withDelay(1000, withTiming(2.5, { duration: 600 }));
    rippleOpacity.value = withDelay(1000, withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 500 })
    ));

    // 4. Sprout scale
    sproutScale.value = withDelay(1300, withTiming(1, { duration: 600 }));

    // 5. Stem grow
    stemHeight.value = withDelay(1900, withTiming(100, { duration: 1200 }));

    // 6. Leaves
    leaf1Scale.value = withDelay(2800, withSpring(1, { damping: 10 }));
    leaf2Scale.value = withDelay(3200, withSpring(1, { damping: 10 }));

    // 7 & 8. Affirmation & final glow
    affirmOpacity.value = withDelay(3800, withTiming(1, { duration: 800 }, (finished) => {
      if (finished) {
        runOnJS(setAnimationFinished)(true);
      }
    }));

    // Glow pulsing
    leafGlow.value = withRepeat(withSequence(
      withTiming(1, { duration: 2000 }), withTiming(0.4, { duration: 2000 })
    ), -1, true);
  }, []);

  const seedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: seedY.value }, { scale: seedScale.value }],
    opacity: seedScale.value > 0 ? 1 : 0
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value
  }));

  const sproutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sproutScale.value }],
    opacity: sproutScale.value
  }));

  const stemStyle = useAnimatedStyle(() => ({
    height: stemHeight.value
  }));

  const l1Style = useAnimatedStyle(() => {
    const currentHeight = stemHeight.value;
    const opacity = currentHeight >= 45 ? leaf1Scale.value : 0;
    return {
      bottom: 24 + Math.min(currentHeight, 55),
      transform: [{ scale: leaf1Scale.value }],
      opacity,
    };
  });

  const l2Style = useAnimatedStyle(() => {
    const currentHeight = stemHeight.value;
    const opacity = currentHeight >= 75 ? leaf2Scale.value : 0;
    return {
      bottom: 24 + Math.min(currentHeight, 80),
      transform: [{ scale: leaf2Scale.value }],
      opacity,
    };
  });

  const affirmStyle = useAnimatedStyle(() => {
    const currentHeight = stemHeight.value;
    const opacity = currentHeight >= 95 ? affirmOpacity.value : 0;
    return {
      bottom: 24 + currentHeight,
      transform: [{ scale: affirmOpacity.value }],
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({ opacity: leafGlow.value }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A150A','#0D1F0D','#1A3A1A','#0A150A']} style={StyleSheet.absoluteFill} />
      {[...Array(6)].map((_,i) => <Particle key={i} x={30+i*50} y={50+i*30} size={3+i%3} color={i%2?'#86EFAC':'#FCD34D'} delay={i*350} />)}
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="plant" />
        <View style={{ flex:1, alignItems:'center', justifyContent:'space-around', padding:24 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.plantTitle}>Plant your{'\n'}new thought</Text>
            <Text style={ss.plantSub}>Let's grow this positive belief within you.</Text>
          </Animated.View>

          {/* Plant illustration container */}
          <View style={{ width: 300, height: 260, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' }}>
            
            {/* 1. Soil / Ground */}
            <View style={[ss.ground, { position: 'absolute', bottom: 10, width: 220, height: 14 }]} />

            {/* 2. Water Ripple */}
            <Animated.View style={[{ position: 'absolute', bottom: 12, width: 40, height: 10, borderRadius: 20, borderWidth: 2, borderColor: '#60A5FA', alignSelf: 'center' }, rippleStyle]} />

            {/* 3. Seed */}
            <Animated.View style={[{ position: 'absolute', bottom: 15, width: 14, height: 18, borderRadius: 7, backgroundColor: '#D97706', alignSelf: 'center' }, seedStyle]} />

            {/* 4. Tiny Sprout */}
            <Animated.View style={[{ position: 'absolute', bottom: 12, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', alignSelf: 'center' }, sproutStyle]} />

            {/* 5. Stem (grows upwards) */}
            <Animated.View style={[ss.stem, { position: 'absolute', bottom: 24, alignSelf: 'center' }, stemStyle]} />

            {/* 6. Leaf 1 (branches to left) */}
            <Animated.View style={[ss.leaf1Wrap, { position: 'absolute', right: 150, width: 70, height: 40 }, l1Style]}>
              <LinearGradient colors={['#4ADE80','#22C55E']} style={ss.leaf1} />
            </Animated.View>

            {/* 7. Leaf 2 (branches to right) */}
            <Animated.View style={[ss.leaf2Wrap, { position: 'absolute', left: 150, width: 60, height: 35 }, l2Style]}>
              <LinearGradient colors={['#86EFAC','#4ADE80']} style={ss.leaf2} />
            </Animated.View>

            {/* 8. Glowing Affirmation Top Leaf */}
            <Animated.View style={[{ position: 'absolute', left: 150 - 120, width: 240, alignItems: 'center' }, affirmStyle]}>
              <Animated.View style={[ss.affirmLeafGlow, glowStyle]} />
              <View style={ss.affirmLeaf}>
                <Text style={ss.affirmLeafText}>{affirmation}</Text>
              </View>
            </Animated.View>

          </View>

          <Text style={ss.plantNourish}>Nourish it with patience,{'\n'}consistency and self-belief.</Text>

          <GradBtn label="Continue" onPress={onContinue} disabled={!animationFinished} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 8 — Reflection
// ══════════════════════════════════════════════════════════════════════════
function ReflectScreen({ selected, setSelected, onContinue }: any) {
  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1A0A0A','#2D1005','#FF6B3520','#0F0A1E']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex:1 }}>
        <Header screen="reflect" />
        <View style={{ flex:1, justifyContent:'space-around', padding:24 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <Text style={ss.reflectTitle}>How do you feel now?</Text>
          </Animated.View>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:14, justifyContent:'center' }}>
            {MOODS.map((m,i) => {
              const sel = selected === m.label;
              return (
                <Animated.View key={m.label} entering={FadeInDown.delay(i*120).duration(500)}>
                  <TouchableOpacity
                    style={[ss.moodCard, sel && ss.moodCardSel]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(m.label); }}
                    activeOpacity={0.75}>
                    <Text style={ss.moodEmoji}>{m.emoji}</Text>
                    <Text style={[ss.moodLabel, sel && { color:C.golden }]}>{m.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
          <GradBtn label="Continue" onPress={onContinue} disabled={!selected} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN COMPLETE
// ══════════════════════════════════════════════════════════════════════════
function CompleteScreen({ affirmation, onHome }: any) {
  const confettiOpacity = useSharedValue(0);
  const sunScale = useSharedValue(0.7);
  const cardScale = useSharedValue(0.85);

  useEffect(() => {
    confettiOpacity.value = withTiming(1, { duration:800 });
    sunScale.value = withSpring(1, { damping:12 });
    setTimeout(() => { cardScale.value = withSpring(1, { damping:14 }); }, 400);
  }, []);

  const confStyle = useAnimatedStyle(() => ({ opacity: confettiOpacity.value }));
  const sunStyle  = useAnimatedStyle(() => ({ transform:[{ scale: sunScale.value }] }));
  const cardStyle = useAnimatedStyle(() => ({ transform:[{ scale: cardScale.value }] }));

  const confetti = [...Array(22)].map((_,i) => ({
    x: (i*(width/22)) % width,
    top: -10 + (i % 5)*5,
    color: [C.gold,C.violet,C.golden,'#4ADE80',C.sunrise,'#EC4899'][i%6],
    size: 5 + (i%4)*2,
    delay: i * 60,
  }));

  return (
    <View style={{ flex:1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0F0A1E','#1A0A2E','#2D1B40','#0F0A1E']} style={StyleSheet.absoluteFill} />

      {/* Confetti */}
      <Animated.View style={[StyleSheet.absoluteFill, confStyle, { overflow:'hidden' }]} pointerEvents="none">
        {confetti.map((c,i) => (
          <Particle key={i} x={c.x} y={c.top} size={c.size} color={c.color} delay={c.delay} />
        ))}
      </Animated.View>

      <SafeAreaView style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ padding:24, alignItems:'center' }} showsVerticalScrollIndicator={false}>
          {/* Sun glow illustration */}
          <Animated.View entering={FadeIn.duration(1000)} style={[ss.completeSunWrap, sunStyle]}>
            <LinearGradient colors={[C.gold,C.sunrise,'#7C3AED']} style={ss.completeSun} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(700)}>
            <Text style={ss.completeTitle}>🎉 Journey Complete!</Text>
            <Text style={ss.completeSub}>You did something amazing for your mind today.</Text>
          </Animated.View>

          {/* Stats card */}
          <Animated.View style={[ss.statsCard, cardStyle]}>
            <View style={ss.statsRow}>
              {[
                { icon:'🧠', label:'Thought\nTransformed', val:'1'         },
                { icon:'⏱️', label:'Time\nSpent',         val:'20 Min'     },
                { icon:'⭐', label:'Transformation',      val:'100%'       },
              ].map((s,i) => (
                <View key={i} style={ss.statItem}>
                  <Text style={ss.statIcon}>{s.icon}</Text>
                  <Text style={ss.statVal}>{s.val}</Text>
                  <Text style={ss.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Quote */}
          <Animated.View entering={FadeInDown.delay(700).duration(600)} style={ss.quoteCard}>
            <Text style={ss.quoteText}>"The mind believes what you repeatedly tell it."</Text>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(900).duration(600)} style={{ width:'100%', marginTop:10 }}>
            <GradBtn label="Return Home" onPress={onHome} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function NegativeThoughtScreen() {
  const router = useRouter();
  const [screen, setScreen]       = useState<Screen>('intro');
  const [thought, setThought]     = useState('');
  const [tapsLeft, setTapsLeft]   = useState(10);
  const [selectedAff, setSelAff]  = useState('');
  const [customAff, setCustomAff] = useState('');
  const [selectedMood, setSelMood]= useState('');

  const go = (s: Screen) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(s); };

  const completeTask = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      await fetch(`${API_BASE_URL}/api/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ task_name:'Replace One Negative Thought', points:600 }),
      });
    } catch (e) { console.error('completeTask error:', e); }
  };

  const finalAff = selectedAff
    ? (AFFIRMATIONS.find(a => a.id === selectedAff)?.text || '')
    : customAff || 'I am enough.';

  if (screen === 'intro')    return <IntroScreen onBegin={() => go('catch')} />;
  if (screen === 'catch')    return <CatchScreen thought={thought} setThought={setThought} onContinue={() => go('analyze')} />;
  if (screen === 'analyze')  return <AnalyzeScreen onContinue={() => go('break')} />;
  if (screen === 'break')    return <BreakScreen tapsLeft={tapsLeft} setTapsLeft={setTapsLeft} onComplete={() => { setTapsLeft(10); go('replace'); }} />;
  if (screen === 'replace')  return <ReplaceScreen selected={selectedAff} setSelected={setSelAff} custom={customAff} setCustom={setCustomAff} onContinue={() => go('believe')} />;
  if (screen === 'believe')  return <BelieveScreen affirmation={finalAff} onComplete={() => go('plant')} />;
  if (screen === 'plant')    return <PlantScreen affirmation={finalAff} onContinue={() => go('reflect')} />;
  if (screen === 'reflect')  return <ReflectScreen selected={selectedMood} setSelected={setSelMood} onContinue={() => { completeTask(); go('complete'); }} />;
  return <CompleteScreen affirmation={finalAff} onHome={() => router.replace('/(tabs)' as any)} />;
}

// ══════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════
const ss = StyleSheet.create({
  // ─ Progress & Header
  progressTrack: { height:4, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:2, width:'100%', overflow:'hidden', marginTop:6 },
  progressFill:  { height:'100%', backgroundColor:C.violet, borderRadius:2 },
  header:        { paddingHorizontal:30, paddingTop:10, paddingBottom:4 },
  headerTitle:   { fontSize:14, fontWeight:'700', color:C.textMid, letterSpacing:0.3 },

  // ─ Gradient button
  gradBtnWrap:   { height:58, borderRadius:29, overflow:'hidden', width:'100%', elevation:8, shadowColor:C.violet, shadowOpacity:0.4, shadowOffset:{ width:0, height:6 }, shadowRadius:12 },
  gradBtn:       { flex:1, alignItems:'center', justifyContent:'center' },
  gradBtnText:   { color:C.white, fontSize:18, fontWeight:'700' },

  // ─ Fixed footer
  fixedFooter:   { position:'absolute', bottom:30, left:24, right:24 },

  // ─ Intro
  introIllus:    { height:260, alignItems:'center', justifyContent:'flex-end', position:'relative', marginTop:10 },
  sunGlow:       { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(245,158,11,0.2)', top:10 },
  sunCircle:     { width:120, height:120, borderRadius:60, position:'absolute', top:40 },
  mtnLeft:       { position:'absolute', bottom:30, left:10,  width:0, height:0, borderLeftWidth:60, borderRightWidth:80, borderBottomWidth:110, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#1A0832' },
  mtnRight:      { position:'absolute', bottom:30, right:10, width:0, height:0, borderLeftWidth:80, borderRightWidth:60, borderBottomWidth:110, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#1A0832' },
  mtnCenter:     { position:'absolute', bottom:30, width:0,  height:0, borderLeftWidth:80, borderRightWidth:80, borderBottomWidth:130, borderLeftColor:'transparent', borderRightColor:'transparent', borderBottomColor:'#2D1B69' },
  meditEmoji:    { fontSize:48, position:'absolute', bottom:32, zIndex:10 },
  introBadge:    { backgroundColor:'rgba(124,58,237,0.25)', borderWidth:1, borderColor:C.glassBrd, borderRadius:20, paddingHorizontal:16, paddingVertical:6, alignSelf:'flex-start', marginBottom:16 },
  introBadgeText:{ color:C.lavender, fontSize:13, fontWeight:'600' },
  introTitle:    { fontSize:38, fontWeight:'900', color:C.white, lineHeight:46, marginBottom:16 },
  introDesc:     { fontSize:16, color:C.textLight, lineHeight:26, marginBottom:32 },
  introBtn:      { height:62, borderRadius:31, flexDirection:'row', alignItems:'center', justifyContent:'center', elevation:10, shadowColor:C.violet, shadowOpacity:0.5, shadowOffset:{ width:0, height:8 }, shadowRadius:16 },
  introBtnText:  { color:C.white, fontSize:18, fontWeight:'800' },

  // ─ Catch
  catchTitle:    { fontSize:30, fontWeight:'900', color:'#1F1447', lineHeight:38, marginBottom:8 },
  catchSub:      { fontSize:15, color:'#6D28D9', marginBottom:20 },
  catchInputCard:{ backgroundColor:C.white, borderRadius:20, padding:16, marginBottom:20, shadowColor:'#7C3AED', shadowOpacity:0.1, shadowRadius:12, elevation:4 },
  catchInput:    { fontSize:16, color:'#1F1447', minHeight:100, textAlignVertical:'top', lineHeight:24 },
  charCount:     { fontSize:11, color:'#A78BFA', textAlign:'right', marginTop:4 },
  exLabel:       { fontSize:13, fontWeight:'700', color:'#6D28D9', marginBottom:10, letterSpacing:0.5 },
  exPill:        { backgroundColor:'rgba(124,58,237,0.08)', borderWidth:1, borderColor:'rgba(124,58,237,0.2)', borderRadius:12, paddingHorizontal:16, paddingVertical:12, marginBottom:8 },
  exPillText:    { color:'#4C1D95', fontSize:15, fontWeight:'500' },
  orRow:         { flexDirection:'row', alignItems:'center', gap:12, marginVertical:16 },
  orLine:        { flex:1, height:1, backgroundColor:'#E9D5FF' },
  orText:        { color:'#A78BFA', fontSize:14, fontWeight:'600' },
  micCircle:     { width:80, height:80, borderRadius:40, overflow:'hidden', elevation:8 },
  micInner:      { flex:1, alignItems:'center', justifyContent:'center' },
  micLabel:      { color:'#6D28D9', fontSize:14, fontWeight:'600', marginTop:10 },

  // ─ Analyze
  analyzeRing:   { position:'absolute', width:200, height:200, borderRadius:100, borderWidth:3, borderColor:C.violet, borderStyle:'dashed', opacity:0.5 },
  analyzeTitle:  { color:C.white, fontSize:22, fontWeight:'800', textAlign:'center', marginTop:24 },
  analyzeSub:    { color:C.textLight, fontSize:14, textAlign:'center', marginTop:8 },
  analyzeCard:   { backgroundColor:'rgba(124,58,237,0.15)', borderRadius:24, padding:24, borderWidth:1, borderColor:C.glassBrd },
  analyzeRow:    { flexDirection:'row', alignItems:'center', marginBottom:14 },
  analyzeCheckCircle:{ width:26, height:26, borderRadius:13, backgroundColor:C.violet, alignItems:'center', justifyContent:'center', marginRight:12 },
  analyzeItemText:   { color:C.textMid, fontSize:16, fontWeight:'600' },
  analyzeHelp:       { color:C.textLight, fontSize:13, marginTop:12, textAlign:'center' },

  // ─ Break
  breakTitle:    { color:C.white, fontSize:24, fontWeight:'900', textAlign:'center', marginBottom:8 },
  breakSub:      { color:C.textLight, fontSize:14, textAlign:'center', marginBottom:8 },
  lightBurst:    { position:'absolute', width:300, height:300, borderRadius:150 },
  counterWrap:   { alignItems:'center', marginTop:20 },
  counterNum:    { color:C.violet, fontSize:64, fontWeight:'900', letterSpacing:-2 },
  counterLabel:  { color:C.textLight, fontSize:12, fontWeight:'700', letterSpacing:2, marginTop:-8 },
  breakHintCard: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(245,158,11,0.1)', borderRadius:16, padding:16, gap:10, marginTop:20, borderWidth:1, borderColor:'rgba(245,158,11,0.2)' },
  breakHintText: { color:C.textMid, fontSize:14, flex:1, lineHeight:20 },

  // ─ Replace
  replaceTitle:  { color:C.white, fontSize:28, fontWeight:'900', lineHeight:36, marginBottom:8 },
  replaceSub:    { color:C.textLight, fontSize:14, lineHeight:22 },
  affirmCard:    { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:18, padding:18, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', gap:14 },
  affirmCardSel: { backgroundColor:'rgba(124,58,237,0.3)', borderColor:C.violet },
  affirmIcon:    { fontSize:22 },
  affirmText:    { color:C.textMid, fontSize:16, fontWeight:'600', flex:1 },
  customRow:     { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.06)', borderRadius:18, padding:18, borderWidth:1, borderColor:'rgba(255,255,255,0.1)' },
  customInput:   { color:C.textMid, fontSize:15, flex:1 },

  // ─ Believe
  believeTitle:  { color:C.white, fontSize:28, fontWeight:'900', textAlign:'center', lineHeight:38, marginBottom:8 },
  believeSub:    { color:C.textLight, fontSize:14, textAlign:'center' },
  breathCircleOuter:{ width:240, height:240, alignItems:'center', justifyContent:'center' },
  breathGlow:    { position:'absolute', width:260, height:260, borderRadius:130, backgroundColor:'rgba(124,58,237,0.25)' },
  breathRing:    { width:240, height:240, borderRadius:120, padding:4, alignItems:'center', justifyContent:'center' },
  breathInner:   { width:228, height:228, borderRadius:114, backgroundColor:'#1A0832', alignItems:'center', justifyContent:'center', padding:24 },
  breathAffirm:  { color:C.white, fontSize:18, fontWeight:'700', textAlign:'center', lineHeight:26 },
  believeInstruct:{ color:C.textLight, fontSize:14, textAlign:'center' },
  holdBtnOuter:  { width:'100%', height:60, borderRadius:30, overflow:'hidden' },
  holdBtnBg:     { flex:1, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  holdFill:      { position:'absolute', left:0, top:0, bottom:0, backgroundColor:'rgba(255,255,255,0.15)' },
  holdBtnText:   { color:C.white, fontSize:16, fontWeight:'800', zIndex:1 },

  // ─ Plant
  plantTitle:    { color:C.white, fontSize:28, fontWeight:'900', textAlign:'center', lineHeight:36, marginBottom:8 },
  plantSub:      { color:'#86EFAC', fontSize:14, textAlign:'center' },
  stem:          { width:6, height:100, backgroundColor:'#4ADE80', borderRadius:3 },
  leaf1Wrap:     { position:'absolute', top:20, right:'50%', marginRight:-50 },
  leaf1:         { width:70, height:40, borderRadius:50, transform:[{ rotate:'-30deg' }] },
  leaf2Wrap:     { position:'absolute', top:40, left:'50%', marginLeft:-20 },
  leaf2:         { width:60, height:35, borderRadius:50, transform:[{ rotate:'30deg' }] },
  affirmLeafGlow:{ position:'absolute', top:-20, width:200, height:60, borderRadius:100, backgroundColor:'rgba(74,222,128,0.2)' },
  affirmLeaf:    { backgroundColor:'rgba(0,0,0,0.5)', borderRadius:16, padding:14, maxWidth:240, borderWidth:1, borderColor:'rgba(74,222,128,0.4)', marginTop:8 },
  affirmLeafText:{ color:'#86EFAC', fontSize:16, fontWeight:'700', textAlign:'center' },
  ground:        { width:width*0.6, height:14, backgroundColor:'#2D4A2D', borderRadius:8, marginTop:12 },
  plantNourish:  { color:'rgba(134,239,172,0.7)', fontSize:14, textAlign:'center', lineHeight:22 },

  // ─ Reflect
  reflectTitle:  { color:C.white, fontSize:30, fontWeight:'900', textAlign:'center' },
  moodCard:      { width:(width-60)/2, height:100, borderRadius:24, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.07)', borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  moodCardSel:   { backgroundColor:'rgba(124,58,237,0.35)', borderColor:C.violet },
  moodEmoji:     { fontSize:34, marginBottom:6 },
  moodLabel:     { color:C.textMid, fontSize:15, fontWeight:'700' },

  // ─ Complete
  completeSunWrap:{ width:180, height:180, borderRadius:90, overflow:'hidden', marginBottom:24, elevation:16, shadowColor:C.gold, shadowOpacity:0.6, shadowRadius:20 },
  completeSun:    { flex:1 },
  completeTitle:  { color:C.white, fontSize:32, fontWeight:'900', textAlign:'center', marginBottom:8 },
  completeSub:    { color:C.textMid, fontSize:16, textAlign:'center', marginBottom:30, lineHeight:24 },
  statsCard:      { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:28, padding:24, width:'100%', borderWidth:1, borderColor:C.glassBrd, marginBottom:20 },
  statsRow:       { flexDirection:'row', justifyContent:'space-around' },
  statItem:       { alignItems:'center', flex:1 },
  statIcon:       { fontSize:28, marginBottom:8 },
  statVal:        { color:C.golden, fontSize:18, fontWeight:'900' },
  statLabel:      { color:C.textLight, fontSize:11, textAlign:'center', marginTop:4, lineHeight:16 },
  quoteCard:      { backgroundColor:'rgba(124,58,237,0.15)', borderRadius:20, padding:20, borderWidth:1, borderColor:C.glassBrd, marginBottom:20, width:'100%' },
  quoteText:      { color:C.lavender, fontSize:15, fontStyle:'italic', textAlign:'center', lineHeight:24 },

  screen: { flex:1 },
});
