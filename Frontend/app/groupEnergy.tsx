import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

const COLORS = {
  purple: '#8B5CF6',
  indigo: '#6366F1',
  deepBlack: '#090A14',
  glowPurple: 'rgba(139, 92, 246, 0.45)',
  textWhite: '#FFFFFF',
  textDim: '#9CA3AF',
  glassBg: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  bgWhite: '#FFFFFF',
  textBlack: '#0F172A',
  textBlackSub: '#475569',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  white: '#FFFFFF',
};

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

// Particles spawned when typing
interface TypingParticle {
  id: string;
  xOffset: number;
  yStart: number;
  color: string;
}

const TypingParticleItem = React.memo(({ 
  id, 
  xOffset, 
  yStart, 
  color, 
  onComplete 
}: { 
  id: string; 
  xOffset: number; 
  yStart: number; 
  color: string; 
  onComplete: (id: string) => void;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) {
        runOnJS(onComplete)(id);
      }
    });
  }, []);

  const style = useAnimatedStyle(() => {
    const translateY = (1 - progress.value) * yStart - 180 * progress.value;
    const translateX = (1 - progress.value) * xOffset;
    const scale = 1 - progress.value * 0.4;
    const opacity = 1 - progress.value;

    return {
      transform: [
        { translateX },
        { translateY },
        { scale }
      ],
      opacity
    };
  });

  return (
    <Animated.View 
      style={[
        styles.typingParticle,
        style,
        {
          backgroundColor: color,
          shadowColor: color,
        }
      ]}
    />
  );
});

// Embers rising slowly in the background
const AmbientParticles = ({ 
  count = 15,
  width,
  height
}: { 
  count?: number;
  width: number;
  height: number;
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(count)].map((_, i) => {
        const pX = useSharedValue(Math.random() * width);
        const pY = useSharedValue(height + Math.random() * 80);
        const scaleBase = Math.random() * 0.35 + 0.2;
        const opacityBase = Math.random() * 0.25 + 0.1;

        useEffect(() => {
          const duration = 12000 + Math.random() * 8000;
          const delay = Math.random() * 4000;

          pY.value = withRepeat(
            withSequence(
              withTiming(height + 20, { duration: delay }),
              withTiming(-30, { duration, easing: Easing.linear })
            ),
            -1,
            false
          );

          pX.value = withRepeat(
            withSequence(
              withTiming(pX.value + (Math.random() * 30 - 15), {
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(pX.value - (Math.random() * 30 - 15), {
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            -1,
            true
          );
        }, []);

        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: pX.value },
            { translateY: pY.value },
            { scale: scaleBase },
          ],
          opacity: opacityBase,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              styles.ambientParticle,
              style,
              { backgroundColor: COLORS.purple },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function ObserveGroupEnergyScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  // Selected screen index for interactive zoomed preview modal (null means grid view)
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  // States inside interactive mockup simulation flow (replicated in the previewer)
  const [simStep, setSimStep] = useState<number>(1);
  const [fearText, setFearText] = useState('');
  const [intensity, setIntensity] = useState(4);
  const [bodySpot, setBodySpot] = useState('Chest');
  const [textureChip, setTextureChip] = useState('Heavy');
  const [shapeSelect, setShapeSelect] = useState('Cloud');
  const [reflectionChecks, setReflectionChecks] = useState<Record<string, boolean>>({
    real: true,
    stayed: true,
    noChange: true,
  });
  const [typingParticles, setTypingParticles] = useState<TypingParticle[]>([]);
  const [customReminder, setCustomReminder] = useState<string[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderInput, setNewReminderInput] = useState('');
  const [completionSavedData, setCompletionSavedData] = useState<{ pointsAdded: number; totalPoints: number; streak: number } | null>(null);

  // Background cloud drifting shared values
  const cloudTranslateX = useSharedValue(0);
  const cloudOpacity = useSharedValue(0.7);

  // Main background orb pulsing
  const orbPulse = useSharedValue(1.0);
  const orbGlow = useSharedValue(0.4);

  useEffect(() => {
    orbPulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbGlow.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Screen 8 drifting cloud animation loop
  useEffect(() => {
    cloudTranslateX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(260, { duration: 8000, easing: Easing.linear })
      ),
      -1,
      false
    );

    cloudOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 0 }),
        withTiming(0.0, { duration: 8000, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, []);

  const handleRemoveParticle = (id: string) => {
    setTypingParticles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSimTyping = (text: string) => {
    setFearText(text);
    if (text.length > fearText.length) {
      const id = Math.random().toString(36).substring(7);
      const xOffset = Math.random() * 120 - 60;
      const yStart = 90 + Math.random() * 20;
      setTypingParticles((prev) => [...prev, { id, xOffset, yStart, color: COLORS.purple }]);
    }
  };

  const handleSaveCompletion = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const response = await apiFetch('/api/tasks/observe-group-energy/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: true,
          progressPayload: {
            fearText,
            intensity,
            bodySpot,
            textureChip,
            shapeSelect,
            reflectionChecks
          }
        })
      });

      const data = await response.json();
      if (response.ok || data.success) {
        setCompletionSavedData({
          pointsAdded: data.pointsAdded,
          totalPoints: data.totalPoints,
          streak: data.streak
        });
      }
    } catch (e) {
      console.error('Error saving completion:', e);
    }
  };

  const handleFinishTask = () => {
    triggerHaptic('success');
    if (completionSavedData) {
      router.replace({
        pathname: '/task-success',
        params: {
          points: completionSavedData.pointsAdded?.toString() || '250',
          totalPoints: completionSavedData.totalPoints?.toString() || '0',
          streak: completionSavedData.streak?.toString() || '0',
        },
      } as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  // Format date helper
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  // 12 Screens rendering component dispatcher
  const renderScreenContent = (index: number, isZoomedView: boolean) => {
    const titleSize = isZoomedView ? 24 : 16;
    const bodySize = isZoomedView ? 14 : 10;
    const buttonHeight = isZoomedView ? 46 : 30;
    const paddingVal = isZoomedView ? 18 : 12;

    switch (index) {
      case 1:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <LinearGradient colors={['rgba(139, 92, 246, 0.15)', 'transparent']} style={styles.smokeOverlayTop} />
            <AmbientParticles count={8} width={isZoomedView ? 300 : 220} height={isZoomedView ? 580 : 430} />
            
            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize * 1.3, marginBottom: 8 }]}>Notice Fear</Text>
              <Text style={[styles.fearSubtitle, { fontSize: bodySize, lineHeight: bodySize * 1.5 }]}>
                Fear is only a visitor.{'\n'}You don't have to become it.
              </Text>
            </View>

            <View style={styles.mountainSilhouette}>
              <Feather name="triangle" size={isZoomedView ? 80 : 50} color="rgba(255, 255, 255, 0.04)" style={styles.mountainShape} />
            </View>

            <TouchableOpacity 
              onPress={() => isZoomedView && setSimStep(2)} 
              activeOpacity={0.8}
              style={[
                styles.simGlassBtn, 
                { 
                  height: buttonHeight, 
                  borderRadius: buttonHeight / 2,
                  shadowColor: COLORS.purple,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 5,
                }
              ]}
            >
              <BlurView intensity={25} tint="dark" style={styles.simGlassBtnBlur}>
                <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Begin Observation →</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        );

      case 2:
        const orbScaleStyle = useAnimatedStyle(() => ({
          transform: [{ scale: orbPulse.value }],
          shadowOpacity: orbGlow.value * 0.8,
          shadowRadius: orbGlow.value * 25 + 5,
        }));
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity 
              onPress={() => isZoomedView && setSimStep(1)} 
              style={styles.simBackBtn}
              disabled={!isZoomedView}
            >
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Animated.View style={[styles.simFearOrb, orbScaleStyle, { width: isZoomedView ? 110 : 80, height: isZoomedView ? 110 : 80, borderRadius: isZoomedView ? 55 : 40 }]}>
                <View style={styles.simOrbCore} />
              </Animated.View>

              <Text style={[styles.fearTitle, { fontSize: titleSize, marginTop: 24, marginBottom: 8 }]}>What is your fear?</Text>
              
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(3)} disabled={!isZoomedView}>
                <Text style={[styles.tapOrbText, { fontSize: bodySize }]}>Tap the orb to begin</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dotsRow}>
              {[...Array(4)].map((_, idx) => (
                <View key={idx} style={[styles.dotItem, idx === 1 && styles.dotActive]} />
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(2)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenTopAlign}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, alignSelf: 'flex-start', marginTop: 12 }]}>I'm afraid that...</Text>
              
              <View style={[styles.simInputBoxGlass, { height: isZoomedView ? 160 : 110, marginTop: 16 }]}>
                <TextInput
                  style={[styles.simTextInput, { fontSize: bodySize + 1 }]}
                  placeholder="Type your fear here..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  multiline
                  value={fearText}
                  onChangeText={handleSimTyping}
                  editable={isZoomedView}
                  maxLength={200}
                />
              </View>
            </View>

            <View style={{ width: '100%' }}>
              <TouchableOpacity 
                onPress={() => isZoomedView && setSimStep(4)} 
                activeOpacity={0.8}
                disabled={!isZoomedView || !fearText.trim()}
                style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2, opacity: (!fearText.trim()) ? 0.5 : 1 }]}
              >
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 14 }]}>
                {[...Array(4)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 2 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(3)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 20 }]}>How strong does it feel?</Text>
              
              <View style={[styles.intensityRing, { width: isZoomedView ? 130 : 90, height: isZoomedView ? 130 : 90, borderRadius: isZoomedView ? 65 : 45 }]}>
                <Text style={{ color: COLORS.textWhite, fontSize: titleSize * 1.5, fontWeight: '800' }}>{intensity}</Text>
                <Text style={{ color: COLORS.purple, fontSize: bodySize - 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Strong</Text>
              </View>

              <View style={[styles.sliderRow, { marginTop: 24 }]}>
                {[1, 2, 3, 4, 5].map((num) => {
                  const isActive = intensity === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      onPress={() => isZoomedView && setIntensity(num)}
                      disabled={!isZoomedView}
                      style={[
                        styles.sliderNumBtn,
                        isActive && styles.sliderNumActive,
                        {
                          width: isActive ? (isZoomedView ? 52 : 36) : (isZoomedView ? 34 : 22),
                          height: isZoomedView ? 34 : 22,
                          borderRadius: 12,
                        }
                      ]}
                    >
                      <Text style={[styles.sliderNumText, { fontSize: bodySize - 1 }, isActive && { fontWeight: '700' }]}>{num}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(5)} disabled={!isZoomedView} style={{ width: '100%' }}>
                <Text style={[styles.sliderSubtext, { fontSize: bodySize }]}>Notice it. Don't judge it.</Text>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 16 }]}>
                {[...Array(4)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 3 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(4)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 12 }]}>Where do you feel it?</Text>
              
              <View style={[styles.bodyMapWrapper, { height: isZoomedView ? 190 : 130 }]}>
                <Ionicons name="body-outline" size={isZoomedView ? 120 : 80} color="rgba(255, 255, 255, 0.15)" />
                <View style={[styles.hotspotNode, { top: '15%', left: '46%' }, bodySpot === 'Head' && styles.hotspotActive]} />
                <View style={[styles.hotspotNode, { top: '35%', left: '46%' }, bodySpot === 'Chest' && styles.hotspotActive]} />
                <View style={[styles.hotspotNode, { top: '50%', left: '46%' }, bodySpot === 'Stomach' && styles.hotspotActive]} />
                <View style={[styles.hotspotNode, { top: '75%', left: '42%' }, bodySpot === 'Legs' && styles.hotspotActive]} />
              </View>

              <View style={styles.bodyChipsRow}>
                {['Head', 'Chest', 'Stomach', 'Legs'].map((spot) => {
                  const isActive = bodySpot === spot;
                  return (
                    <TouchableOpacity
                      key={spot}
                      onPress={() => isZoomedView && setBodySpot(spot)}
                      disabled={!isZoomedView}
                      style={[
                        styles.bodyChip,
                        isActive && styles.bodyChipActive,
                        { paddingHorizontal: isZoomedView ? 12 : 8, paddingVertical: isZoomedView ? 6 : 4, borderRadius: 12 }
                      ]}
                    >
                      <Text style={[styles.bodyChipText, { fontSize: bodySize - 2 }, isActive && { color: '#FFF' }]}>{spot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(6)} disabled={!isZoomedView} style={{ width: '100%' }}>
                <Text style={[styles.sliderSubtext, { fontSize: bodySize }]}>Tap where fear appears</Text>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 16 }]}>
                {[...Array(4)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 0 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(5)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 4 }]}>Look at your fear...</Text>
              <Text style={[styles.fearSubtitle, { fontSize: bodySize - 1, marginBottom: 12 }]}>Without changing it... What does it feel like?</Text>
              
              <View style={[styles.smokeVisualWrapper, { height: isZoomedView ? 120 : 80 }]}>
                <LinearGradient 
                  colors={['rgba(99, 102, 241, 0.22)', 'rgba(139, 92, 246, 0.02)']} 
                  style={[styles.volumetricSmokeBall, { width: isZoomedView ? 90 : 60, height: isZoomedView ? 90 : 60 }]} 
                />
              </View>

              <View style={styles.textureGrid}>
                {['Heavy', 'Cold', 'Tight', 'Fast', 'Empty', 'Unknown'].map((chip) => {
                  const isActive = textureChip === chip;
                  return (
                    <TouchableOpacity
                      key={chip}
                      onPress={() => isZoomedView && setTextureChip(chip)}
                      disabled={!isZoomedView}
                      style={[
                        styles.textureChipItem,
                        isActive && styles.textureChipActive,
                        { paddingVertical: isZoomedView ? 8 : 4, width: isZoomedView ? 76 : 54, borderRadius: 10, margin: 4 }
                      ]}
                    >
                      <Text style={[styles.textureChipText, { fontSize: bodySize - 3 }, isActive && { color: '#FFF' }]}>{chip}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ width: '100%' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(7)} disabled={!isZoomedView} style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2 }]}>
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Next →</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 14 }]}>
                {[...Array(5)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 0 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 7:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(6)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 2 }]}>If fear had a shape...</Text>
              <Text style={[styles.fearSubtitle, { fontSize: bodySize - 1, marginBottom: 12 }]}>What would it be?</Text>
              
              <View style={styles.shapesGridContainer}>
                {['Cloud', 'Wave', 'Fire', 'Rock', 'Storm', 'Shadow'].map((shape) => {
                  const isActive = shapeSelect === shape;
                  return (
                    <TouchableOpacity
                      key={shape}
                      onPress={() => isZoomedView && setShapeSelect(shape)}
                      disabled={!isZoomedView}
                      style={[
                        styles.shapeGridItem,
                        isActive && styles.shapeGridActive,
                        { paddingVertical: isZoomedView ? 8 : 4, width: isZoomedView ? 72 : 50, borderRadius: 10, margin: 4 }
                      ]}
                    >
                      <Text style={[styles.shapeGridText, { fontSize: bodySize - 3 }, isActive && { color: '#FFF' }]}>{shape}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: isZoomedView ? 60 : 40, justifyContent: 'center', marginTop: 12 }}>
                <Ionicons name="cloudy" size={isZoomedView ? 50 : 32} color="rgba(139, 92, 246, 0.4)" />
              </View>
            </View>

            <View style={{ width: '100%' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(8)} disabled={!isZoomedView} style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2 }]}>
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Next →</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 14 }]}>
                {[...Array(5)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 1 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 8:
        const motionCloudStyle = useAnimatedStyle(() => {
          return {
            transform: [
              { translateX: cloudTranslateX.value },
            ],
            opacity: cloudOpacity.value,
          };
        });

        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(7)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 4 }]}>Watch it pass...</Text>
              <Text style={[styles.fearSubtitle, { fontSize: bodySize - 1, marginBottom: 20 }]}>Nothing lasts forever.</Text>
              
              <View style={[styles.cloudDriftingTrack, { height: isZoomedView ? 120 : 80, width: isZoomedView ? 240 : 160 }]}>
                <Animated.View style={[motionCloudStyle, { position: 'absolute', left: 0 }]}>
                  <Ionicons name="cloudy" size={isZoomedView ? 64 : 44} color="rgba(139, 92, 246, 0.5)" />
                </Animated.View>
              </View>
            </View>

            <View style={{ width: '100%', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(9)} disabled={!isZoomedView} style={{ width: '100%' }}>
                <Text style={[styles.sliderSubtext, { fontSize: bodySize }]}>Even fear changes.</Text>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 16 }]}>
                {[...Array(5)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 2 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 9:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(8)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize - 1, marginBottom: 12 }]}>What do you want{'\n'}to remind yourself?</Text>
              
              <ScrollView style={{ width: '100%', maxHeight: isZoomedView ? 240 : 160 }} showsVerticalScrollIndicator={false}>
                <View style={[styles.reminderGlassCard, { padding: isZoomedView ? 10 : 6, marginBottom: 6 }]}>
                  <Feather name="shield" size={isZoomedView ? 16 : 10} color={COLORS.purple} />
                  <Text style={[styles.reminderText, { fontSize: bodySize - 2, marginLeft: 8 }]}>I am safe in this moment</Text>
                </View>
                <View style={[styles.reminderGlassCard, { padding: isZoomedView ? 10 : 6, marginBottom: 6 }]}>
                  <Feather name="wind" size={isZoomedView ? 16 : 10} color={COLORS.cyan || '#06B6D4'} />
                  <Text style={[styles.reminderText, { fontSize: bodySize - 2, marginLeft: 8 }]}>This feeling will pass</Text>
                </View>
                <View style={[styles.reminderGlassCard, { padding: isZoomedView ? 10 : 6, marginBottom: 6 }]}>
                  <Feather name="heart" size={isZoomedView ? 16 : 10} color="#EF4444" />
                  <Text style={[styles.reminderText, { fontSize: bodySize - 2, marginLeft: 8 }]}>I can handle hard things</Text>
                </View>
                {customReminder.map((rem, rIdx) => (
                  <View key={rIdx} style={[styles.reminderGlassCard, { padding: isZoomedView ? 10 : 6, marginBottom: 6 }]}>
                    <Feather name="edit-3" size={isZoomedView ? 16 : 10} color={COLORS.amber} />
                    <Text style={[styles.reminderText, { fontSize: bodySize - 2, marginLeft: 8 }]} numberOfLines={1}>{rem}</Text>
                  </View>
                ))}
              </ScrollView>

              {isZoomedView && (
                <View style={{ width: '100%', marginTop: 8 }}>
                  {showAddReminder ? (
                    <View style={styles.addReminderInputWrapper}>
                      <TextInput
                        style={styles.addReminderField}
                        placeholder="Type reminder..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={newReminderInput}
                        onChangeText={setNewReminderInput}
                      />
                      <TouchableOpacity 
                        onPress={() => {
                          if (newReminderInput.trim()) {
                            setCustomReminder((prev) => [...prev, newReminderInput]);
                            setNewReminderInput('');
                            setShowAddReminder(false);
                          }
                        }} 
                        style={styles.addSaveBtn}
                      >
                        <Feather name="check" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setShowAddReminder(true)} style={styles.addCustomReminderBtn}>
                      <Text style={styles.addCustomText}>+ Add your own</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={{ width: '100%', marginTop: 8 }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(10)} disabled={!isZoomedView} style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2 }]}>
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 14 }]}>
                {[...Array(5)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 3 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 10:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <TouchableOpacity onPress={() => isZoomedView && setSimStep(9)} style={styles.simBackBtn} disabled={!isZoomedView}>
              <Feather name="arrow-left" size={isZoomedView ? 18 : 12} color={COLORS.textWhite} />
            </TouchableOpacity>

            <View style={styles.screenCenter}>
              <Text style={[styles.fearTitle, { fontSize: titleSize, marginBottom: 16 }]}>Today I noticed...</Text>
              
              <View style={{ width: '100%' }}>
                <TouchableOpacity
                  onPress={() => isZoomedView && setReflectionChecks(prev => ({ ...prev, real: !prev.real }))}
                  disabled={!isZoomedView}
                  style={[styles.checklistCard, { padding: isZoomedView ? 12 : 8, marginBottom: 6 }]}
                >
                  <View style={[styles.simCheckbox, reflectionChecks.real && styles.simCheckboxActive, { width: isZoomedView ? 20 : 12, height: isZoomedView ? 20 : 12, borderRadius: 4 }]}>
                    {reflectionChecks.real && <Feather name="check" size={isZoomedView ? 12 : 8} color={COLORS.white} />}
                  </View>
                  <Text style={[styles.checklistLabel, { fontSize: bodySize - 1, marginLeft: 10 }]}>My fear was real, and that's okay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => isZoomedView && setReflectionChecks(prev => ({ ...prev, stayed: !prev.stayed }))}
                  disabled={!isZoomedView}
                  style={[styles.checklistCard, { padding: isZoomedView ? 12 : 8, marginBottom: 6 }]}
                >
                  <View style={[styles.simCheckbox, reflectionChecks.stayed && styles.simCheckboxActive, { width: isZoomedView ? 20 : 12, height: isZoomedView ? 20 : 12, borderRadius: 4 }]}>
                    {reflectionChecks.stayed && <Feather name="check" size={isZoomedView ? 12 : 8} color={COLORS.white} />}
                  </View>
                  <Text style={[styles.checklistLabel, { fontSize: bodySize - 1, marginLeft: 10 }]}>I stayed with it, instead of avoiding</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => isZoomedView && setReflectionChecks(prev => ({ ...prev, noChange: !prev.noChange }))}
                  disabled={!isZoomedView}
                  style={[styles.checklistCard, { padding: isZoomedView ? 12 : 8 }]}
                >
                  <View style={[styles.simCheckbox, reflectionChecks.noChange && styles.simCheckboxActive, { width: isZoomedView ? 20 : 12, height: isZoomedView ? 20 : 12, borderRadius: 4 }]}>
                    {reflectionChecks.noChange && <Feather name="check" size={isZoomedView ? 12 : 8} color={COLORS.white} />}
                  </View>
                  <Text style={[styles.checklistLabel, { fontSize: bodySize - 1, marginLeft: 10 }]}>I didn't try to change it</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ width: '100%', marginTop: 8 }}>
              <TouchableOpacity 
                onPress={() => {
                  if (isZoomedView) {
                    handleSaveCompletion();
                    setSimStep(11);
                  }
                }} 
                disabled={!isZoomedView} 
                style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2 }]}
              >
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Save Reflection</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={[styles.dotsRow, { marginTop: 14 }]}>
                {[...Array(5)].map((_, idx) => (
                  <View key={idx} style={[styles.dotItem, idx === 4 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        );

      case 11:
        return (
          <View style={[styles.screenInner, { padding: paddingVal }]}>
            <View style={styles.screenCenter}>
              <View style={[styles.compNeonCircle, { width: isZoomedView ? 90 : 60, height: isZoomedView ? 90 : 60, borderRadius: isZoomedView ? 45 : 30 }]}>
                <Feather name="check" size={isZoomedView ? 40 : 26} color={COLORS.white} />
              </View>

              <Text style={[styles.fearTitle, { fontSize: titleSize * 1.1, marginTop: 20, marginBottom: 8 }]}>Observation{'\n'}Complete</Text>
              
              <Text style={[styles.compSummaryDesc, { fontSize: bodySize, lineHeight: bodySize * 1.6 }]}>
                Fear was acknowledged.{'\n'}
                Not defeated.{'\n'}
                Not ignored.{'\n'}
                Simply noticed.
              </Text>
            </View>

            <View style={{ width: '100%' }}>
              <TouchableOpacity onPress={() => isZoomedView && setSimStep(12)} disabled={!isZoomedView} style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2 }]}>
                <LinearGradient colors={[COLORS.purple, COLORS.indigo]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Continue →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 12:
        return (
          <View style={[styles.screenInner, { padding: 0 }]}>
            <LinearGradient
              colors={['#FDBA74', '#F59E0B', '#8B5CF6', COLORS.deepBlack]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={{ position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' }}>
              <Feather name="triangle" size={isZoomedView ? 160 : 100} color="rgba(9, 10, 20, 0.4)" style={{ transform: [{ scaleY: 0.6 }] }} />
            </View>

            <View style={[StyleSheet.absoluteFillObject, { padding: paddingVal, justifyContent: 'space-between' }]}>
              <View />

              <View style={styles.screenCenter}>
                <Text style={[styles.fearTitle, { fontSize: titleSize * 1.3, marginBottom: 8 }]}>Well done!</Text>
                <Text style={[styles.fearSubtitle, { fontSize: bodySize, lineHeight: bodySize * 1.5, color: '#FFF' }]}>
                  You showed up for yourself.{'\n'}That's something to be proud of.
                </Text>

                {isZoomedView && fearText.trim() !== '' && (
                  <BlurView intensity={25} tint="dark" style={[styles.simSummaryCard, { marginTop: 20 }]}>
                    <Text style={styles.summaryCardLabel}>Your fear was noted:</Text>
                    <Text style={styles.summaryCardValue} numberOfLines={2}>"{fearText}"</Text>
                    <Text style={styles.summaryCardDate}>{formattedDate} • Intensity {intensity}/5</Text>
                  </BlurView>
                )}
              </View>

              <TouchableOpacity 
                onPress={() => isZoomedView && handleFinishTask()} 
                activeOpacity={0.8}
                disabled={!isZoomedView}
                style={[styles.simPrimaryBtn, { height: buttonHeight, borderRadius: buttonHeight / 2, shadowColor: COLORS.amber }]}
              >
                <LinearGradient colors={[COLORS.amber, COLORS.purple]} style={styles.simGradient}>
                  <Text style={[styles.simBtnText, { fontSize: bodySize + 1 }]}>Finish</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const canvasWidth = 1180;
  const gridScale = width < 1240 ? (width - 40) / canvasWidth : 1;

  return (
    <View style={styles.canvasContainer}>
      <StatusBar style="dark" />

      {/* Case Study Header Canvas */}
      <View style={styles.canvasHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.canvasBackBtn}>
            <Feather name="arrow-left" size={20} color={COLORS.textBlack} />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.canvasTitle}>Notice Fear Mockups</Text>
            <Text style={styles.canvasSubtitle}>Premium mobile UX/UI case study presentation</Text>
          </View>
        </View>

        <View style={styles.canvasBadge}>
          <Text style={styles.canvasBadgeText}>📱 Tap any screen to zoom and interact</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.canvasScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mockupCanvasBlock, { width: canvasWidth, transform: [{ scale: gridScale }] }]}>
          <View style={styles.gridContainer}>
            {[...Array(12)].map((_, i) => {
              const screenIndex = i + 1;
              return (
                <View key={screenIndex} style={styles.mockupCol}>
                  <Text style={styles.screenGridLabel}>SCREEN {screenIndex}</Text>
                  
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      triggerHaptic('light');
                      setSimStep(screenIndex);
                      setZoomedIndex(screenIndex);
                    }}
                    style={styles.mockupShadowFrame}
                  >
                    <View style={styles.iphone16ProFrame}>
                      <View style={styles.speakerSlit} />
                      <View style={styles.dynamicIsland} />
                      <View style={styles.innerBezelFrame}>
                        {renderScreenContent(screenIndex, false)}
                      </View>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.0)', 'rgba(0,0,0,0.08)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Zooms Screen interactive full-size modal */}
      {zoomedIndex !== null && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setZoomedIndex(null)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setZoomedIndex(null)} />
            
            <BlurView intensity={35} tint="dark" style={styles.modalBlurBackground}>
              <View style={styles.zoomedHUD}>
                <Text style={styles.zoomedHUDTitle}>Interactive Simulation (Step {simStep}/12)</Text>
                
                <TouchableOpacity onPress={() => setZoomedIndex(null)} style={styles.zoomedCloseBtn}>
                  <Feather name="x" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.zoomedIPhoneWrapper}>
                <View style={[styles.iphone16ProFrame, styles.iphoneZoomSize]}>
                  <View style={[styles.speakerSlit, styles.speakerZoomSize]} />
                  <View style={[styles.dynamicIsland, styles.islandZoomSize]} />
                  <View style={styles.innerBezelFrame}>
                    {renderScreenContent(simStep, true)}
                  </View>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.0)', 'rgba(0,0,0,0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                </View>
              </View>

              <View style={styles.modalControllerRow}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setSimStep((prev) => Math.max(1, prev - 1));
                  }}
                  disabled={simStep === 1}
                  style={[styles.simNavBtn, simStep === 1 && { opacity: 0.4 }]}
                >
                  <Feather name="arrow-left" size={20} color={COLORS.white} />
                  <Text style={styles.simNavText}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.simStepProgressBadge}>
                  <Text style={styles.simStepText}>Screen {simStep} of 12</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    if (simStep === 10) {
                      handleSaveCompletion();
                    }
                    setSimStep((prev) => Math.min(12, prev + 1));
                  }}
                  disabled={simStep === 12}
                  style={[styles.simNavBtn, simStep === 12 && { opacity: 0.4 }]}
                >
                  <Text style={styles.simNavText}>Next</Text>
                  <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasHeader: {
    height: 72,
    backgroundColor: COLORS.bgWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  canvasBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textBlack,
    letterSpacing: -0.5,
  },
  canvasSubtitle: {
    fontSize: 12,
    color: COLORS.textBlackSub,
  },
  canvasBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  canvasBadgeText: {
    color: COLORS.indigo,
    fontSize: 12,
    fontWeight: '600',
  },
  canvasScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  mockupCanvasBlock: {
    backgroundColor: COLORS.bgWhite,
    borderRadius: 36,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mockupCol: {
    width: 260,
    alignItems: 'center',
    marginBottom: 40,
  },
  screenGridLabel: {
    color: COLORS.textBlackSub,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  mockupShadowFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  iphone16ProFrame: {
    width: 226,
    height: 460,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    borderWidth: 5,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  innerBezelFrame: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  speakerSlit: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#475569',
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    zIndex: 99,
  },
  dynamicIsland: {
    width: 68,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 99,
  },
  screenInner: {
    flex: 1,
    backgroundColor: COLORS.deepBlack,
    justifyContent: 'space-between',
  },
  smokeOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  screenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTopAlign: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mountainSilhouette: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    opacity: 0.5,
  },
  mountainShape: {
    transform: [{ scaleY: 0.5 }],
  },
  fearTitle: {
    color: COLORS.textWhite,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  fearSubtitle: {
    color: COLORS.textDim,
    textAlign: 'center',
  },
  simPrimaryBtn: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  simGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simBtnText: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  simBackBtn: {
    position: 'absolute',
    left: 12,
    top: 34,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  simFearOrb: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simOrbCore: {
    width: '45%',
    height: '45%',
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tapOrbText: {
    color: COLORS.purple,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 12,
  },
  dotItem: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.purple,
    width: 10,
  },
  simInputBoxGlass: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 12,
  },
  simTextInput: {
    flex: 1,
    color: COLORS.textWhite,
    textAlignVertical: 'top',
  },
  intensityRing: {
    borderWidth: 6,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  sliderNumBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderNumActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  sliderNumText: {
    color: COLORS.textWhite,
    fontWeight: '600',
  },
  sliderSubtext: {
    color: COLORS.textDim,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bodyMapWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotNode: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: COLORS.textWhite,
  },
  hotspotActive: {
    backgroundColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bodyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  bodyChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    margin: 3,
  },
  bodyChipActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  bodyChipText: {
    color: COLORS.textDim,
    fontWeight: '600',
  },
  smokeVisualWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumetricSmokeBall: {
    borderRadius: 99,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  textureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  textureChipItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  textureChipActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  textureChipText: {
    color: COLORS.textDim,
    fontWeight: '600',
  },
  shapesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  shapeGridItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  shapeGridActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  shapeGridText: {
    color: COLORS.textDim,
    fontWeight: '600',
  },
  cloudDriftingTrack: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reminderGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
  },
  reminderText: {
    color: COLORS.textWhite,
    fontWeight: '500',
  },
  addCustomReminderBtn: {
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
  },
  addCustomText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  addReminderInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.purple,
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  addReminderField: {
    flex: 1,
    color: COLORS.textWhite,
    fontSize: 12,
    padding: 0,
  },
  addSaveBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '100%',
  },
  simCheckbox: {
    borderWidth: 1.5,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simCheckboxActive: {
    backgroundColor: COLORS.purple,
  },
  checklistLabel: {
    color: COLORS.textWhite,
    fontWeight: '500',
  },
  compNeonCircle: {
    borderWidth: 3,
    borderColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
  },
  compSummaryDesc: {
    color: COLORS.textDim,
    textAlign: 'center',
    fontWeight: '500',
  },
  simSummaryCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
  },
  summaryCardLabel: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryCardValue: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  summaryCardDate: {
    color: COLORS.textDim,
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlurBackground: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  zoomedHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  zoomedHUDTitle: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  zoomedCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedIPhoneWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 12,
  },
  iphoneZoomSize: {
    width: 310,
    height: 630,
    borderRadius: 44,
    borderWidth: 7,
  },
  speakerZoomSize: {
    width: 60,
    height: 4,
    top: 6,
  },
  islandZoomSize: {
    width: 90,
    height: 20,
    top: 13,
  },
  modalControllerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  simNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  simNavText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  simStepProgressBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  simStepText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },
  simGlassBtn: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  simGlassBtnBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientParticle: {
    position: 'absolute',
    borderRadius: 99,
  },
  typingParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 99,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
});
