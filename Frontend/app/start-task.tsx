import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming
} from "react-native-reanimated";

export default function StartTask() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(180);
  const [phase, setPhase] = useState("Inhale");

  const scale = useSharedValue(1);

  // ⏱ Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 🌬 Breathing animation
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 4000 }),
      -1,
      true
    );
  }, []);

  // 🔄 Inhale / Exhale switch
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev === "Inhale" ? "Exhale" : "Inhale"));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

      {/* Breathing Circle */}
      <View style={styles.center}>
        <Animated.View style={[styles.circle, animatedStyle]}>
          <Text style={styles.phaseInside}>{phase}</Text>
        </Animated.View>
      </View>

      {/* Button */}
      <TouchableOpacity 
        style={styles.completeBtn}
        onPress={() => 
          router.push({
            pathname: "/task-complete",
            params: { type: "breathing" }
          })
        }
      >
        <Text style={styles.buttonText}>Task Completed</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },

  header: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  back: {
    color: "#fff",
    fontSize: 16,
  },

  timer: {
    color: "#a855f7",
    fontSize: 40,
    fontWeight: "bold",
    marginTop: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  circle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#9333ea",
    justifyContent: "center",
    alignItems: "center",

    // ✨ Glow effect
    shadowColor: "#9333ea",
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },

  phaseInside: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  completeBtn: {
    width: "85%",
    marginBottom: 40,
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});