import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming
} from "react-native-reanimated";

export default function TaskComplete() {
  const router = useRouter();

  const float = useSharedValue(0);

  // 🌊 Floating animation
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -8 }]
  }));

  return (
    <View style={styles.container}>

      {/* ☁️ Sky Background */}
      <LinearGradient
        colors={["#e0f2fe", "#bae6fd", "#7dd3fc"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 🌊 Soft Glow */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>

        {/* 💚 Floating Success */}
        <Animated.View style={[styles.iconCircle, floatStyle]}>
          <Text style={{ fontSize: 32 }}>✔</Text>
        </Animated.View>

        <Text style={styles.title}>Well done.</Text>
        <Text style={styles.subtitle}>You showed up today.</Text>

        {/* 🫧 Glass Card */}
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.points}>+150 points earned</Text>
          <Text style={styles.small}>Day complete</Text>
        </View>

        {/* Button */}
        <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
          <LinearGradient
            colors={["#38bdf8", "#0ea5e9"]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  back: {
    marginTop: 50,
    marginLeft: 20,
    color: "#0f172a",
    fontSize: 16,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#22c55e",
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
  },

  subtitle: {
    color: "#334155",
    marginTop: 5,
    marginBottom: 30,
  },

  card: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "#bae6fd",
    alignItems: "center",
    marginBottom: 30,
  },

  emoji: {
    fontSize: 30,
  },

  points: {
    color: "#0284c7",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },

  small: {
    color: "#334155",
    marginTop: 5,
  },

  button: {
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // 🌊 Glow shapes
  glow1: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "#38bdf8",
    borderRadius: 100,
    top: 100,
    left: -50,
    opacity: 0.3,
  },

  glow2: {
    position: "absolute",
    width: 250,
    height: 250,
    backgroundColor: "#0ea5e9",
    borderRadius: 125,
    bottom: 100,
    right: -80,
    opacity: 0.3,
  },
});