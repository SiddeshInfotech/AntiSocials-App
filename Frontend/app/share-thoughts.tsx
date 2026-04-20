import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, Easing, Keyboard, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Floating background particle component
const FloatingParticle = ({ size, color, left, top, duration, delay }: any) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -50, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: duration * 0.8, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: duration * 0.8, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      opacity: pulseAnim, transform: [{ translateY: floatAnim }],
      shadowColor: color, shadowRadius: size, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }
    }} />
  );
};

const prompts = ["How do you feel?", "Calm?", "Tired?", "Happy?", "Anxious?", "Peaceful?"];

export default function ShareThoughtsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Rotating Prompts
  const [promptIdx, setPromptIdx] = useState(0);
  const promptFade = useRef(new Animated.Value(1)).current;

  // Emotion Mapping
  const [emotionColor, setEmotionColor] = useState('transparent');
  const emotionOpacity = useRef(new Animated.Value(0)).current;

  // Animations
  const breathAnim = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const uiFadeAnim = useRef(new Animated.Value(1)).current;
  const wordFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.05, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Rotate placeholder text ONLY if they aren't actively typing things and not submitted
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(promptFade, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(promptFade, { toValue: 1, duration: 800, useNativeDriver: true })
      ]).start();
      setTimeout(() => setPromptIdx(prev => (prev + 1) % prompts.length), 600);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const handleChangeText = (val: string) => {
    setText(val);
    
    // Tiny pop animation on type
    inputScale.setValue(1.08);
    Animated.timing(inputScale, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    if (val.length === 1 && text.length === 0) {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Emotion Color Shifting
    const checkVal = val.toLowerCase().trim();
    let newColor = null;
    if (['calm', 'peaceful', 'relaxed', 'chill', 'zen'].includes(checkVal)) newColor = '#bae6fd'; // soft blue
    else if (['happy', 'good', 'joy', 'excited', 'great', 'love'].includes(checkVal)) newColor = '#fef08a'; // soft yellow
    else if (['sad', 'tired', 'down', 'low', 'exhausted'].includes(checkVal)) newColor = '#e2e8f0'; // gray slate
    else if (['angry', 'mad', 'stressed', 'anxious'].includes(checkVal)) newColor = '#fecaca'; // soft red

    if (newColor) {
      setEmotionColor(newColor);
      Animated.timing(emotionOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    } else {
      Animated.timing(emotionOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }).start();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Keyboard.dismiss();
    setIsSubmitted(true);

    // Submission flow: everything else fades out, word floats up
    Animated.parallel([
      Animated.timing(uiFadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(emotionOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      Animated.timing(wordFloatAnim, { toValue: -height * 0.25, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      router.replace({ pathname: '/task-success', params: { points: '300' } } as any);
    });
  };

  const isButtonActive = text.trim().length > 0;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      
      {/* Immersive Breathing Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: breathAnim }] }]}>
        <LinearGradient
          colors={['#fdf4ff', '#f3e8ff', '#ffffff']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Reactive Emotion Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: emotionColor, opacity: emotionOpacity }]} pointerEvents="none" />

      {/* Micro-animations / Floating Glow Particles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <FloatingParticle size={150} color="rgba(216, 180, 254, 0.4)" left={-50} top={height * 0.1} duration={8000} delay={0} />
        <FloatingParticle size={200} color="rgba(191, 219, 254, 0.3)" left={width * 0.6} top={height * 0.4} duration={12000} delay={1000} />
        <FloatingParticle size={100} color="rgba(253, 186, 116, 0.2)" left={width * 0.2} top={height * 0.7} duration={9000} delay={2000} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Header (Fades out gently on submit) */}
        <Animated.View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5), opacity: uiFadeAnim }]} pointerEvents={isSubmitted ? 'none' : 'auto'}>
          <TouchableOpacity style={styles.backBtnLight} onPress={() => !isSubmitted && router.back()}>
            <Feather name="arrow-left" size={24} color="#5b21b6" />
          </TouchableOpacity>
        </Animated.View>

        {/* Vertical Container for Prompt and Input (Fixes absolute positioning overlaps) */}
        <Animated.View style={[styles.content, { transform: [{ translateY: wordFloatAnim }] }]}>
          
          <Animated.View style={[styles.titleContainer, { opacity: uiFadeAnim }]}>
             <Animated.Text style={[styles.titlePrompt, { opacity: promptFade }]}>
               {prompts[promptIdx]}
             </Animated.Text>
          </Animated.View>

          <Animated.View style={[styles.inputWrapper, { transform: [{ scale: inputScale }] }]}>
            <TextInput
              style={styles.textInput}
              autoFocus
              maxLength={25}
              multiline={false}
              value={text}
              placeholder="1 word..."
              placeholderTextColor="rgba(139, 92, 246, 0.4)"
              onChangeText={handleChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              selectionColor="#8b5cf6"
              textAlign="center"
            />
          </Animated.View>

        </Animated.View>

        {/* Continue Button (Bottom anchored, fades out on submit) */}
        <Animated.View style={[styles.bottomContainer, { opacity: uiFadeAnim }]} pointerEvents={isSubmitted ? 'none' : 'auto'}>
          <Animated.View style={{ opacity: isButtonActive ? 1 : 0, width: '100%' }}>
            <TouchableOpacity 
              style={styles.saveButton} 
              disabled={!isButtonActive}
              activeOpacity={0.8}
              onPress={handleSubmit}
            >
              <LinearGradient
                 colors={['#a855f7', '#8b5cf6']}
                 start={{ x: 0, y:0 }}
                 end={{ x:1, y:1 }}
                 style={styles.saveGradient}
              >
                 <Text style={styles.saveButtonText}>Continue</Text>
                 <Feather name="arrow-up" size={20} color="#ffffff" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerLight: {
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 20,
  },
  titlePrompt: {
    fontSize: 22,
    fontWeight: '400',
    color: '#8b5cf6',
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  textInput: {
    fontSize: 52,
    fontWeight: '300',
    color: '#4c1d95', 
    textAlign: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    // Provide an elegant soft background highlight on the input itself instead of absolute shapes
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    shadowColor: '#a855f7',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  saveButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  }
});
