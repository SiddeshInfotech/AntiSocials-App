import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

export default function TechBreakActive() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(3600);

  const float = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 5000 }), -1, true);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2500 }),
        withTiming(1, { duration: 2500 })
      ),
      -1
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -10 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* 🌿 Soft Calm Gradient */}
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#334155"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ☁️ Floating Clouds */}
      <Animated.View style={[styles.cloud, styles.cloud1, floatStyle]} />
      <Animated.View style={[styles.cloud, styles.cloud2, floatStyle]} />

      {/* 🌿 Soft Nature Blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Take a Break 🌿</Text>

        <Animated.Text style={[styles.timer, pulseStyle]}>
          {formatTime(timeLeft)}
        </Animated.Text>

        <Text style={styles.subtitle}>
          Relax. Breathe. Enjoy your moment ☕
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/task-complete",
              params: { type: "tech" },
            })
          }
        >
          <Text style={styles.buttonText}>Feeling Refreshed ✨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#e2e8f0",
    fontSize: 22,
    fontWeight: "600",
  },

  timer: {
    fontSize: 48,
    color: "#a5b4fc",
    marginTop: 20,
  },

  subtitle: {
    color: "#cbd5f5",
    marginTop: 20,
    textAlign: "center",
  },

  button: {
    marginTop: 40,
    backgroundColor: "#6366f1",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // ☁️ Clouds
  cloud: {
    position: "absolute",
    backgroundColor: "#ffffff",
    opacity: 0.08,
    borderRadius: 50,
  },

  cloud1: {
    top: 120,
    left: 30,
    width: 120,
    height: 60,
  },

  cloud2: {
    bottom: 200,
    right: 40,
    width: 150,
    height: 70,
  },

  // 🌿 Blobs (nature feel)
  blob1: {
    position: "absolute",
    top: 80,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#22c55e",
    opacity: 0.08,
  },

  blob2: {
    position: "absolute",
    bottom: 100,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 150,
    backgroundColor: "#4f46e5",
    opacity: 0.08,
  },
});
