import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  Platform,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, apiFetch } from '../constants/Api';

const { width, height } = Dimensions.get('window');

// Premium Color Palette
const COLORS = {
  bg: '#06131F',
  bgLight: '#0B2034',
  bgDeep: '#123A57',
  primary: '#00B4DB', // Blue
  secondary: '#00D2FF', // Cyan
  accent: '#E0F7FA', // Sky Blue
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.7)',
  glass: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.15)',
};

const VIDEO_PATH = require('../assets/videos/walk_slowly_make_a_video_of_it.mp4');

// --- Reusable Components ---

const ParticleItem = ({ index }: { index: number }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(Math.random() * height);
  
  useEffect(() => {
    x.value = withRepeat(withTiming(x.value + (Math.random() * 60 - 30), { duration: 6000 + Math.random() * 4000 }), -1, true);
    y.value = withRepeat(withTiming(y.value + (Math.random() * 60 - 30), { duration: 6500 + Math.random() * 3500 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: 0.2,
  }));

  return (
    <Animated.View 
      style={[styles.particle, style, { 
        backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.secondary,
        width: 6,
        height: 6,
      }]} 
    />
  );
};

const FloatingBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 20 }).map((_, i) => (
        <ParticleItem key={i} index={i} />
      ))}
    </View>
  );
};

const GlassCard = ({ children, style }: { children: React.ReactNode, style?: any }) => (
  <BlurView intensity={25} tint="dark" style={[styles.glassCard, style]}>
    {children}
  </BlurView>
);

const CircularTimer = ({ progress, timeLeft }: { progress: number, timeLeft: number }) => {
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>
    </View>
  );
};

// --- Main Page ---

export default function WalkSlowlyScreen() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeData, setCompleteData] = useState<{ totalPoints: number; streak: number; pointsAdded: number } | null>(null);
  
  const videoPlayer = useVideoPlayer(VIDEO_PATH, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const completeTaskApi = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const response = await apiFetch('/api/tasks/complete', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: "Walk Slowly",
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        setCompleteData({
          totalPoints: data.totalPoints ?? data.total_points ?? 100,
          streak: data.currentStreak ?? data.current_streak ?? data.streak ?? 1,
          pointsAdded: data.pointsEarned ?? data.points_earned ?? 100
        });
      }
    } catch (e) {
      console.error("Complete task error:", e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsCompleted(true);
      setIsActive(false);
      completeTaskApi();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const progress = (600 - timeLeft) / 600;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[COLORS.bg, COLORS.bgLight, COLORS.bgDeep]} style={StyleSheet.absoluteFill} />
      <FloatingBackground />
      
      <SafeAreaView style={{ flex: 1 }}>
        <WalkHeader />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.delay(300).duration(1000)}>
            <Text style={styles.heroTitle}>Walk Slowly</Text>
            <Text style={styles.heroSubtitle}>
              Take ten peaceful minutes.{"\n"}
              Walk without rushing.{"\n"}
              Notice every breath.{"\n"}
              Notice every step.
            </Text>
          </Animated.View>

          <Animated.View entering={SlideInDown.delay(500)} style={styles.videoCardContainer}>
            <GlassCard style={styles.videoCardRoot}>
              <VideoView
                player={videoPlayer}
                style={styles.heroVideo}
                contentFit="cover"
                allowsPictureInPicture={false}
              />
              <View style={styles.vLabelWrap}>
                 <Ionicons name="play" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                 <Text style={styles.videoLabel}>Mindful Walking Guide</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(700)}>
            <GlassCard style={styles.timerCard}>
              <View style={styles.timerTopRow}>
                <MaterialCommunityIcons name="foot-print" size={32} color={COLORS.secondary} />
                <View style={{ marginLeft: 15 }}>
                   <Text style={styles.timerLimitText}>10 Minutes</Text>
                   <Text style={styles.timerLimitSub}>Walk gently</Text>
                </View>
              </View>
              
              <CircularTimer progress={progress} timeLeft={timeLeft} />
              
              <Text style={styles.timerDesc}>
                Match your breathing with your footsteps.{"\n"}Observe everything around you without judgment.
              </Text>
            </GlassCard>
          </Animated.View>

          <View style={styles.tipsSection}>
             <TipCard icon="eye" text="Look around slowly. Notice colors, light, and movement." delay={900} />
             <TipCard icon="leaf" text="Feel the ground beneath your feet. Walk gently." delay={1100} />
             <TipCard icon="water" text="Take slow natural breaths. No need to hurry." delay={1300} />
          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => {
            if (isCompleted) {
               // router.back();
            } else {
               setIsActive(!isActive);
            }
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainButton}
          >
            <Text style={styles.buttonText}>
              {isCompleted ? "Complete Task" : (isActive ? "Pause Walk" : (timeLeft < 600 ? "Resume Walk" : "Start Walking"))}
            </Text>
            <Ionicons 
              name={isCompleted ? "checkmark-done" : (isActive ? "pause" : "play")} 
              size={20} 
              color="#FFF" 
              style={{ marginLeft: 10 }} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={isCompleted} animationType="fade">
          <View style={styles.modalOverlay}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <Animated.View entering={FadeIn.duration(800)} style={styles.modalContent}>
                  <View style={styles.checkInner}>
                     <Ionicons name="checkmark-sharp" size={60} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Beautiful.</Text>
                  <Text style={styles.modalBody}>
                    You spent ten mindful minutes walking slowly.{"\n\n"}
                    Every step helped you reconnect with the present moment.
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    onPress={() => {
                      if (completeData) {
                        router.replace({
                          pathname: '/(tabs)',
                          params: {
                            updatedPoints: String(completeData.totalPoints),
                            updatedStreak: String(completeData.streak)
                          }
                        } as any);
                      } else {
                        router.replace('/(tabs)' as any);
                      }
                    }}
                  >
                     <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.modalButtonGradient}
                     >
                        <Text style={styles.modalButtonText}>Continue →</Text>
                     </LinearGradient>
                  </TouchableOpacity>
              </Animated.View>
          </View>
      </Modal>
    </View>
  );
}

// --- Sub-components ---

const WalkHeader = () => {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }} />
      <View style={styles.progressBadge}>
        <Text style={styles.progressText}>Step 3 of 6</Text>
      </View>
    </View>
  );
};

const TipCard = ({ icon, text, delay }: { icon: any, text: string, delay: number }) => (
  <Animated.View entering={FadeIn.delay(delay).duration(800)}>
    <GlassCard style={styles.tipCard}>
       <View style={styles.tipIconWrap}>
          <Ionicons name={icon} size={22} color={COLORS.secondary} />
       </View>
       <Text style={styles.tipText}>{text}</Text>
    </GlassCard>
  </Animated.View>
);

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 25, paddingTop: 5 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25,
    paddingVertical: 5 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.glass, justifyContent: 'center', alignItems: 'center' },
  progressBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.border },
  progressText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  
  heroTitle: { fontSize: 42, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  heroSubtitle: { fontSize: 18, color: COLORS.textDim, lineHeight: 26, marginBottom: 20 },
  
  videoCardContainer: { marginBottom: 25 },
  videoCardRoot: { borderRadius: 32, overflow: 'hidden', padding: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroVideo: { width: '100%', height: 260, borderRadius: 24, overflow: 'hidden' },
  vLabelWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingLeft: 10 },
  videoLabel: { color: COLORS.textDim, fontSize: 14, fontWeight: '500' },
  
  timerCard: { padding: 30, borderRadius: 32, alignItems: 'center', marginBottom: 35 },
  timerTopRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 25 },
  timerLimitText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  timerLimitSub: { fontSize: 14, color: COLORS.textDim },
  timerContainer: { marginVertical: 20, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 36, fontWeight: 'bold', color: '#FFF', textAlign: 'center', position: 'absolute' },
  timerDesc: { fontSize: 15, color: COLORS.textDim, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  
  tipsSection: { gap: 15 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24 },
  tipIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tipText: { flex: 1, color: '#FFF', fontSize: 15, lineHeight: 21 },
  
  stickyFooter: { position: 'absolute', bottom: 40, left: 25, right: 25 },
  mainButton: { height: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  particle: { position: 'absolute', borderRadius: 10 },
  glassCard: { overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.04)' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, padding: 40, borderRadius: 40, alignItems: 'center', backgroundColor: 'rgba(10,24,35,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  checkInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  modalBody: { fontSize: 17, color: COLORS.textDim, textAlign: 'center', lineHeight: 26, marginBottom: 35 },
  modalButton: { width: '100%', height: 60, borderRadius: 30, overflow: 'hidden' },
  modalButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
