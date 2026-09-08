import React, { useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, G, Line } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const DOMAINS = [
  { name: "Mental", color: "#b388ff", angle: 22.5, progress: 55, rotation: 0 },
  {
    name: "Physical",
    color: "#ff5252",
    angle: 67.5,
    progress: 45,
    rotation: 45,
  },
  {
    name: "Social",
    color: "#ff9100",
    angle: 112.5,
    progress: 65,
    rotation: 90,
  },
  {
    name: "Spiritual",
    color: "#448aff",
    angle: 157.5,
    progress: 50,
    rotation: 135,
  },
  {
    name: "Career",
    color: "#ffb300",
    angle: 202.5,
    progress: 60,
    rotation: 180,
  },
  {
    name: "Financial",
    color: "#00e676",
    angle: 247.5,
    progress: 40,
    rotation: 225,
  },
  {
    name: "Environment",
    color: "#00bfa5",
    angle: 292.5,
    progress: 70,
    rotation: 270,
  },
  {
    name: "Growth",
    color: "#00e5ff",
    angle: 337.5,
    progress: 35,
    rotation: 315,
  },
];

const InteractiveDomainItem = ({
  domain,
  isActive,
  hasActiveTask,
  onPress,
  x,
  y,
}: any) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: hasActiveTask && !isActive ? 0.35 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(scale, {
      toValue: isActive ? 1.25 : 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isActive, hasActiveTask]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isActive ? 1.25 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.domainLabelContainer,
        { left: x, top: y, opacity, transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[
          styles.domainPressable,
          isActive && {
            borderColor: domain.color,
            backgroundColor: "rgba(255,255,255,0.1)",
          },
        ]}
      >
        <Text
          style={[
            styles.domainLabel,
            { color: domain.color },
            isActive && { fontWeight: "bold" },
          ]}
        >
          {domain.name}
        </Text>
        <View
          style={[
            styles.domainDot,
            { backgroundColor: domain.color },
            isActive && { transform: [{ scale: 1.5 }] },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
};

const AnimatedOwl = () => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const blinkAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const interval = setInterval(() => {
      blink();
      if (Math.random() > 0.6) {
        setTimeout(blink, 200);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          pointerEvents: "none",
        },
      ]}
    >
      <Animated.View
        style={[styles.newOwlWrap, { transform: [{ translateY: floatAnim }] }]}
      >
        <View style={styles.owlEarNewLeft} />
        <View style={styles.owlEarNewRight} />
        <View style={styles.owlWingNewLeft} />
        <View style={styles.owlWingNewRight} />

        <View style={styles.owlBodyNew}>
          <LinearGradient
            colors={["#6A61FF", "#4C3BDB"]}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 42 }]}
          />

          <View style={styles.owlEyesRow}>
            <Animated.View
              style={[styles.owlNewEye, { transform: [{ scaleY: blinkAnim }] }]}
            >
              <View style={styles.owlPupilCyan}>
                <View style={styles.owlPupilBlack}>
                  <View style={styles.owlPupilHighlight} />
                </View>
              </View>
            </Animated.View>
            <Animated.View
              style={[styles.owlNewEye, { transform: [{ scaleY: blinkAnim }] }]}
            >
              <View style={styles.owlPupilCyan}>
                <View style={styles.owlPupilBlack}>
                  <View style={styles.owlPupilHighlight} />
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.owlNewBeak} />

          <View style={styles.owlChestLinesWrap}>
            <View style={styles.owlChestLine} />
            <View style={styles.owlChestLine} />
            <View style={styles.owlChestLine} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

interface LifeDomainsChartProps {
  lifeScoreData?: any;
}

const DOMAIN_CATEGORY_MAP: Record<string, string> = {
  Mental: 'personal_growth_courage',
  Physical: 'health_fitness_physical',
  Social: 'relationships_family',
  Spiritual: 'culture_social_experiences',
  Career: 'education_learning',
  Financial: 'age_life_stage',
  Environment: 'community_contribution',
  Growth: 'adventure_new_experiences',
};

export default function LifeDomainsChart({ lifeScoreData }: LifeDomainsChartProps = {}) {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  const isQuizCompleted = Boolean(
    lifeScoreData?.quizCompleted ??
    lifeScoreData?.quiz_completed ??
    lifeScoreData?.data?.quizCompleted ??
    lifeScoreData?.data?.quiz_completed
  );

  const rawOverall =
    lifeScoreData?.overallScore ??
    lifeScoreData?.overall_score ??
    lifeScoreData?.data?.overallScore ??
    lifeScoreData?.data?.overall_score ??
    lifeScoreData?.current?.overall ??
    lifeScoreData?.data?.currentScores?.overallScore ??
    0;
  const overallCurrent = Math.round(Number(rawOverall) * 10) / 10;

  const categoryScores: Record<string, number> =
    lifeScoreData?.categoryScores ??
    lifeScoreData?.current?.categories ??
    lifeScoreData?.data?.categoryScores ??
    lifeScoreData?.data?.currentScores ??
    {};

  const domainsList = DOMAINS.map((d) => {
    const catSlug = DOMAIN_CATEGORY_MAP[d.name];
    const realScore = isQuizCompleted && catSlug && categoryScores[catSlug] !== undefined
      ? Number(categoryScores[catSlug])
      : d.progress;
    // Scale 0..100 to arc length (max 80)
    const scaledProgress = Math.min(80, Math.max(10, Math.round((realScore / 100) * 80)));
    return {
      ...d,
      realScore: Math.round(realScore * 10) / 10,
      progress: scaledProgress,
    };
  });

  const activeDomainObj = domainsList.find((d) => d.name === activeDomain);

  const handleDomainPress = (name: string) => {
    setActiveDomain((prev) => (prev === name ? null : name));
  };

  return (
    <View style={styles.domainCard}>
      {/* Life Domains Header — Clearly showing Overall Score in XX/100 Format */}
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartHeaderTitle}>Life Domains</Text>
          <Text style={styles.chartHeaderSubtitle}>Equilibrium & Dimension Health</Text>
        </View>
        {isQuizCompleted ? (
          <View style={styles.chartScoreBadge}>
            <Text style={styles.chartScoreLabel}>TOTAL LIFE SCORE</Text>
            <Text style={styles.chartScoreValue}>{overallCurrent.toFixed(1)}/100</Text>
          </View>
        ) : (
          <View style={styles.chartPendingBadge}>
            <Text style={styles.chartPendingText}>Quiz Pending</Text>
          </View>
        )}
      </View>

      <View style={styles.svgChartContainer}>
        <Svg width="320" height="320" viewBox="0 0 320 320">
          {/* Thin axis lines intersecting the wheel */}
          <Line
            x1="160"
            y1="20"
            x2="160"
            y2="300"
            stroke="#333333"
            strokeWidth="1"
          />
          <Line
            x1="20"
            y1="160"
            x2="300"
            y2="160"
            stroke="#333333"
            strokeWidth="1"
          />
          <Line
            x1="61"
            y1="61"
            x2="259"
            y2="259"
            stroke="#333333"
            strokeWidth="1"
          />
          <Line
            x1="259"
            y1="61"
            x2="61"
            y2="259"
            stroke="#333333"
            strokeWidth="1"
          />

          {/* Inner decorative circle outline */}
          <Circle
            cx="160"
            cy="160"
            r="48"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            fill="none"
          />
          <Circle
            cx="160"
            cy="160"
            r="80"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            fill="none"
          />

          <G rotation="-90" origin="160, 160">
            {domainsList.map((d) => (
              <G key={d.name + "arc"} rotation={d.rotation} origin="160, 160">
                <Circle
                  cx="160"
                  cy="160"
                  r="105"
                  stroke={d.color}
                  strokeWidth="36"
                  opacity={0.2}
                  strokeDasharray="80 659.7"
                  strokeLinecap="butt"
                  fill="none"
                />
                <Circle
                  cx="160"
                  cy="160"
                  r="105"
                  stroke={d.color}
                  strokeWidth="36"
                  opacity={0.8}
                  strokeDasharray={`${d.progress} 659.7`}
                  strokeLinecap="butt"
                  fill="none"
                />
              </G>
            ))}
          </G>
        </Svg>

        <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
          {domainsList.map((d) => {
            const rad = (d.angle - 90) * (Math.PI / 180);
            const xPercentage = 50 + 44 * Math.cos(rad);
            const yPercentage = 50 + 44 * Math.sin(rad);
            return (
              <InteractiveDomainItem
                key={d.name}
                domain={d}
                x={`${xPercentage}%`}
                y={`${yPercentage}%`}
                isActive={activeDomain === d.name}
                hasActiveTask={activeDomain !== null}
                onPress={() => handleDomainPress(d.name)}
              />
            );
          })}
        </View>

        <AnimatedOwl />
      </View>

      {activeDomain ? (
        <Animated.View style={styles.domainActionSheet}>
          <Text style={styles.domainActionTitle}>
            Review {activeDomain} • {activeDomainObj?.realScore ?? 0}/100
          </Text>
          <TouchableOpacity
            style={styles.domainActionBtn}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              Alert.alert(
                "Intention Set",
                `You have chosen to focus heavily on ${activeDomain} today.`,
              );
              setActiveDomain(null);
            }}
          >
            <Text style={styles.domainActionBtnText}>Set Intention ✨</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Text style={styles.domainFocusText}>Tap any life domain to focus</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  domainCard: {
    marginHorizontal: 15,
    marginBottom: 40,
    backgroundColor: "#111111", // Exact black card
    borderRadius: 25,
    paddingTop: 24,
    paddingBottom: 35,
    alignItems: "center",
  },
  chartHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  chartHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  chartHeaderSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  chartScoreBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "flex-end",
  },
  chartScoreLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#C4B5FD",
    letterSpacing: 0.5,
  },
  chartScoreValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  chartPendingBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chartPendingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D1D5DB",
  },
  svgChartContainer: {
    width: 320,
    height: 320,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  domainLabelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    marginLeft: -40, // Anchor the center natively against percentage offset
    marginTop: -20,
  },
  domainPressable: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  domainLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  domainDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  newOwlWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  owlBodyNew: {
    width: 84,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  owlEarNewLeft: {
    position: "absolute",
    top: 6,
    left: 20,
    width: 14,
    height: 24,
    backgroundColor: "#6A61FF",
    borderRadius: 7,
    transform: [{ rotate: "-15deg" }],
    zIndex: 0,
  },
  owlEarNewRight: {
    position: "absolute",
    top: 6,
    right: 20,
    width: 14,
    height: 24,
    backgroundColor: "#6A61FF",
    borderRadius: 7,
    transform: [{ rotate: "15deg" }],
    zIndex: 0,
  },
  owlWingNewLeft: {
    position: "absolute",
    width: 32,
    height: 22,
    left: 5,
    top: 50,
    backgroundColor: "#6A61FF",
    borderRadius: 11,
    transform: [{ rotate: "-15deg" }],
    zIndex: 0,
  },
  owlWingNewRight: {
    position: "absolute",
    width: 32,
    height: 22,
    right: 5,
    top: 50,
    backgroundColor: "#6A61FF",
    borderRadius: 11,
    transform: [{ rotate: "15deg" }],
    zIndex: 0,
  },
  owlEyesRow: {
    flexDirection: "row",
    gap: 0,
    marginTop: -20,
    zIndex: 3,
  },
  owlNewEye: {
    width: 36,
    height: 36,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  owlPupilCyan: {
    width: 20,
    height: 20,
    backgroundColor: "#00D1FF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  owlPupilBlack: {
    width: 10,
    height: 10,
    backgroundColor: "#000000",
    borderRadius: 5,
    position: "relative",
    top: 2,
  },
  owlPupilHighlight: {
    width: 3,
    height: 3,
    backgroundColor: "#ffffff",
    borderRadius: 1.5,
    position: "absolute",
    top: 2,
    right: 2,
  },
  owlNewBeak: {
    position: "absolute",
    top: 48,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFB800",
    transform: [{ rotate: "180deg" }],
    zIndex: 3,
  },
  owlChestLinesWrap: {
    position: "absolute",
    bottom: 12,
    alignItems: "center",
    gap: 3,
    zIndex: 3,
  },
  owlChestLine: {
    width: 24,
    height: 8,
    borderBottomWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
  },
  domainFocusText: {
    color: "#a1a1aa",
    fontSize: 13,
    marginTop: 25,
  },
  domainActionSheet: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  domainActionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  domainActionBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 15,
  },
  domainActionBtnText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 13,
  },
});
