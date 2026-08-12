import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import DogCompanion from "./DogCompanion";
import { DOG_STAGES, getDogStage, DogStageResult, DogStageConfig } from "../constants/DogGrowth";

const { width } = Dimensions.get("window");

export interface CircularHabitDashboardProps {
  tasks?: any[];
  completedTasks?: number | string[];
  activeTask?: string | null;
  onSelectTask?: (taskLabel: string) => void;
  onStartTask?: (taskLabel: string) => void;
}

// Individual 360° Stage Circle Badge
const StageCircleBadge = ({
  stage,
  index,
  isCurrent,
  isUnlocked,
  onPress,
}: {
  stage: DogStageConfig;
  index: number;
  isCurrent: boolean;
  isUnlocked: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1.08, { damping: 5, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify().damping(12)}
      style={[styles.stageBadgeWrap, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.circularBadge,
          isCurrent && styles.circularBadgeCurrent,
          isUnlocked && !isCurrent && styles.circularBadgeUnlocked,
        ]}
      >
        {/* Small Purple Stage Number Badge */}
        <View style={[styles.stageNumberPill, isCurrent && styles.stageNumberPillCurrent]}>
          <Text style={styles.stageNumberText}>{stage.stage}</Text>
        </View>

        {/* Center Emoji Container for perfect optical alignment */}
        <View style={styles.emojiContainer}>
          <Text
            style={[
              styles.emojiText,
              stage.stage === 6 && styles.levitateEmojiText,
            ]}
          >
            {stage.emoji}
          </Text>
        </View>

        {/* Completed Checkmark Indicator for past unlocked stages */}
        {isUnlocked && !isCurrent && (
          <View style={styles.completedCheckMark}>
            <Text style={styles.checkMarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Stage Name Label */}
      <View style={[styles.labelPill, isCurrent && styles.labelPillCurrent]}>
        <Text
          style={[
            styles.labelText,
            isCurrent && styles.labelTextCurrent,
            isUnlocked && !isCurrent && styles.labelTextUnlocked,
          ]}
          numberOfLines={1}
        >
          {stage.name}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function CircularHabitDashboard({
  completedTasks = 0,
  activeTask = null,
  onSelectTask,
  onStartTask,
}: CircularHabitDashboardProps) {
  const [containerLayout, setContainerLayout] = useState<{ w: number; h: number }>({
    w: width - 32,
    h: 510,
  });

  const dogStage: DogStageResult = getDogStage(completedTasks);
  const currentStageNum = dogStage.stage;

  // Selected stage preview state (defaults to current stage)
  const [previewStage, setPreviewStage] = useState<number | null>(null);

  const BADGE_SIZE = 50;
  const WRAPPER_WIDTH = 76;

  const cx = containerLayout.w / 2;
  // Center of the 360° circle orbit (vertically balanced)
  const cy = containerLayout.h * 0.46;

  // Responsive radius calculation for 360° arrangement
  const radius = Math.min((containerLayout.w - 86) / 2, (containerLayout.h - 150) / 2, 144);

  const totalStages = DOG_STAGES.length; // Exactly 7 stages

  return (
    <View style={styles.dashboardContainer}>
      <View
        style={styles.orbitContainer}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 0 && h > 0) {
            setContainerLayout({ w, h });
          }
        }}
      >
        {/* Full 360° Decorative Orbit Ring Guideline */}
        <Svg
          width={containerLayout.w}
          height={containerLayout.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(215, 205, 190, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="4, 5"
          />
        </Svg>

        {/* 7 Circular Stage Badges Arranged in Full 360° Orbit (Angle = -90° + i * 360°/7) */}
        {DOG_STAGES.map((stage, index) => {
          // Start at top 12 o'clock (-90 deg), evenly distributed clockwise
          const angleDeg = -90 + index * (360 / totalStages);
          const angleRad = angleDeg * (Math.PI / 180);

          const x = cx + radius * Math.cos(angleRad) - WRAPPER_WIDTH / 2;
          const y = cy + radius * Math.sin(angleRad) - BADGE_SIZE / 2;

          const isCurrent = stage.stage === currentStageNum;
          const isUnlocked = stage.stage <= currentStageNum;

          return (
            <View
              key={stage.stage}
              style={[
                styles.positionedItemWrapper,
                {
                  left: x,
                  top: y,
                  width: WRAPPER_WIDTH,
                },
              ]}
            >
              <StageCircleBadge
                stage={stage}
                index={index}
                isCurrent={isCurrent}
                isUnlocked={isUnlocked}
                onPress={() => {
                  setPreviewStage(stage.stage);
                  if (onSelectTask) onSelectTask(stage.name);
                }}
              />
            </View>
          );
        })}

        {/* Center: Large Centered Companion Dog (Noticeably Enlarged) */}
        <View style={[styles.centerDogWrapper, { left: cx - 110, top: cy - 102.5 }]}>
          <DogCompanion
            completedTasks={completedTasks}
            activeTask={activeTask}
            onStartActiveTask={onStartTask}
            showBadge={false}
          />
        </View>

        {/* Bottom Section: Progress Indicator & Stage Info */}
        <View style={styles.bottomProgressSection}>
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
      </View>
    </View>
  );
}

// Named alias export for TaskArc / HabitArc
export const TaskArc = CircularHabitDashboard;
export const HabitArc = CircularHabitDashboard;

const styles = StyleSheet.create({
  dashboardContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 28,
    backgroundColor: "#FAF7F2", // Warm soft cream wellness background
    borderWidth: 1,
    borderColor: "rgba(230, 220, 205, 0.6)",
    shadowColor: "#B8A898",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
    overflow: "hidden",
  },
  orbitContainer: {
    width: "100%",
    height: 510,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerDogWrapper: {
    position: "absolute",
    width: 220,
    height: 205,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  positionedItemWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  stageBadgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  circularBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
    position: "relative",
  },
  circularBadgeCurrent: {
    borderColor: "#9333EA",
    backgroundColor: "#FAF5FF",
    shadowColor: "#9333EA",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    borderWidth: 2,
  },
  circularBadgeUnlocked: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  stageNumberPill: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    zIndex: 5,
  },
  stageNumberPillCurrent: {
    backgroundColor: "#7E22CE",
    transform: [{ scale: 1.08 }],
  },
  stageNumberText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  emojiContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 21,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    lineHeight: 25,
  },
  levitateEmojiText: {
    fontSize: 17.5,
    lineHeight: 21,
  },
  completedCheckMark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  checkMarkText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  labelPill: {
    marginTop: 2.5,
    paddingHorizontal: 5.5,
    paddingVertical: 1.5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    maxWidth: 74,
    alignItems: "center",
    justifyContent: "center",
  },
  labelPillCurrent: {
    backgroundColor: "#9333EA",
  },
  labelText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "center",
  },
  labelTextCurrent: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  labelTextUnlocked: {
    color: "#16A34A",
  },
  bottomProgressSection: {
    position: "absolute",
    bottom: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 15,
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 6,
  },
  stagePillDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  stagePillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#374151",
    marginRight: 6,
  },
  stageCountText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  progressBarBg: {
    width: 140,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2.25,
    backgroundColor: "#10B981",
  },
  progressBarZen: {
    backgroundColor: "#9333EA",
  },
  progressBarGolden: {
    backgroundColor: "#F59E0B",
  },
});
