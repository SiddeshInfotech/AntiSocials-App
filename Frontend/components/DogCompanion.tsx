import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getDogStage, DogStageResult } from "../constants/DogGrowth";

const { width } = Dimensions.get("window");

interface DogCompanionProps {
  completedTasks: number | string[];
  activeTask?: string | null;
  onStartActiveTask?: (task: string) => void;
  onPet?: () => void;
  showBadge?: boolean;
}

// Floating Sparkle for Stage Evolution Celebration
const SparkleParticle = ({ index }: { index: number }) => {
  const posX = useSharedValue((Math.random() - 0.5) * 160);
  const posY = useSharedValue(15);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    const delay = index * 90;
    scale.value = withSequence(
      withTiming(0, { duration: delay }),
      withSpring(1, { damping: 6, stiffness: 120 }),
      withTiming(0, { duration: 700 })
    );
    posY.value = withSequence(
      withTiming(15, { duration: delay }),
      withTiming(-60 - Math.random() * 40, {
        duration: 1000,
        easing: Easing.out(Easing.quad),
      })
    );
    opacity.value = withSequence(
      withTiming(0.85, { duration: delay }),
      withTiming(0, { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.sparkleItem, animatedStyle]}>
      <Ionicons
        name="sparkles"
        size={index % 2 === 0 ? 17 : 13}
        color={index % 3 === 0 ? "#F59E0B" : "#9333EA"}
      />
    </Animated.View>
  );
};

export default function DogCompanion({
  completedTasks = 0,
  activeTask,
  onStartActiveTask,
  onPet,
  showBadge = true,
}: DogCompanionProps) {
  const dogStage: DogStageResult = getDogStage(completedTasks);

  // Smooth Animations
  const breatheAnim = useSharedValue(1);
  const floatAnim = useSharedValue(0);
  const bounceScale = useSharedValue(1);
  const imageFadeAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);
  const auraGlow = useSharedValue(0.35);

  // Stage change celebration state
  const previousStageRef = useRef<number>(dogStage.stage);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Start continuous subtle idle breathing & float animation
  useEffect(() => {
    breatheAnim.value = withRepeat(
      withTiming(1.025, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    floatAnim.value = withRepeat(
      withTiming(-4, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    auraGlow.value = withRepeat(
      withTiming(0.65, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Detect Stage Evolution & trigger growth transition animation
  useEffect(() => {
    if (previousStageRef.current !== dogStage.stage) {
      // Stage Changed!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCelebration(true);

      // Smooth cross-fade and scale animation on stage growth
      imageFadeAnim.value = withSequence(
        withTiming(0.3, { duration: 150 }),
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      );

      bounceScale.value = withSequence(
        withTiming(0.88, { duration: 200, easing: Easing.in(Easing.quad) }),
        withSpring(1.18, { damping: 4, stiffness: 130 }),
        withSpring(1, { damping: 8, stiffness: 110 })
      );

      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 4000);

      previousStageRef.current = dogStage.stage;
      return () => clearTimeout(timer);
    }
  }, [dogStage.stage, dogStage.tasksCompleted]);

  // Handle petting the dog
  const handlePetDog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Joyful tap wobble & bounce
    bounceScale.value = withSequence(
      withTiming(0.93, { duration: 90 }),
      withSpring(1.08, { damping: 5, stiffness: 200 }),
      withSpring(1, { damping: 7, stiffness: 150 })
    );

    rotateAnim.value = withSequence(
      withTiming(-3, { duration: 75 }),
      withTiming(3, { duration: 75 }),
      withTiming(0, { duration: 75 })
    );

    if (onPet) onPet();
  };

  const animatedPuppyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheAnim.value * bounceScale.value },
      { translateY: floatAnim.value },
      { rotate: `${rotateAnim.value}deg` },
    ],
    opacity: imageFadeAnim.value,
  }));

  const animatedAuraStyle = useAnimatedStyle(() => ({
    opacity: auraGlow.value,
    transform: [{ scale: breatheAnim.value * 1.06 }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      {/* Dog Character Interactive Area (Large Premium Centered Size) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePetDog}
        style={styles.puppyWrapper}
      >
        {/* Soft Radial Glow Aura */}
        <Animated.View
          style={[
            styles.glowAura,
            dogStage.stage >= 5 && styles.zenAura,
            dogStage.isCompleted100 && styles.goldenAura,
            animatedAuraStyle,
          ]}
        />

        {/* Shimmering celebration sparkles on evolution */}
        {showCelebration && (
          <View style={styles.sparklesContainer} pointerEvents="none">
            {Array.from({ length: 14 }).map((_, i) => (
              <SparkleParticle key={i} index={i} />
            ))}
          </View>
        )}

        {/* Puppy Asset - Large Noticeable Size */}
        <Animated.Image
          source={dogStage.asset}
          style={[styles.puppyImage, animatedPuppyStyle]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Stage Badge & Progress Indicator (if requested) */}
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View style={styles.stagePill}>
            <View style={styles.stagePillDot} />
            <Text style={styles.stagePillText}>
              Stage {dogStage.stage}: {dogStage.stageName}
            </Text>
            <Text style={styles.stageCountText}>
              {dogStage.tasksCompleted} / 100
            </Text>
          </View>

          {/* Micro progress bar towards 100 tasks */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(4, dogStage.totalProgress * 100)}%` },
                dogStage.stage >= 5 && styles.progressBarZen,
                dogStage.isCompleted100 && styles.progressBarGolden,
              ]}
            />
          </View>
        </View>
      )}

      {/* Active Task Hero CTA */}
      {activeTask && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.activeTaskActionWrap}>
          <TouchableOpacity
            style={styles.startHeroBtn}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              if (onStartActiveTask) onStartActiveTask(activeTask);
            }}
          >
            <Feather name="play-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.startHeroBtnText}>Start {activeTask}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  puppyWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 220,
    height: 205,
    position: "relative",
  },
  puppyImage: {
    width: 210,
    height: 200,
    zIndex: 3,
  },
  glowAura: {
    position: "absolute",
    width: 195,
    height: 195,
    borderRadius: 97.5,
    backgroundColor: "rgba(254, 243, 199, 0.6)", // Warm soft amber glow
    zIndex: 0,
  },
  zenAura: {
    backgroundColor: "rgba(243, 232, 255, 0.7)", // Soft violet zen aura
  },
  goldenAura: {
    backgroundColor: "rgba(253, 230, 138, 0.85)",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
  },
  sparklesContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sparkleItem: {
    position: "absolute",
  },
  activeTaskActionWrap: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    zIndex: 25,
  },
  startHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9333EA",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  startHeroBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  badgeContainer: {
    marginTop: 8,
    alignItems: "center",
    width: "100%",
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  stagePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    marginRight: 6,
  },
  stageCountText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  progressBarBg: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#9333EA",
  },
  progressBarZen: {
    backgroundColor: "#7C3AED",
  },
  progressBarGolden: {
    backgroundColor: "#F59E0B",
  },
});
