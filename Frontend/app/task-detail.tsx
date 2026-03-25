import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function TaskDetail() {
  const router = useRouter();

  // 🔮 Floating blob animation
  const move = useSharedValue(0);

  useEffect(() => {
    move.value = withRepeat(
      withTiming(1, { duration: 6000 }),
      -1,
      true
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: move.value * 40 },
        { translateY: move.value * -30 }
      ],
    };
  });

  return (
    <View style={styles.container}>

      {/* 🌌 Gradient Background */}
      <LinearGradient
        colors={["#0f172a", "#1e1b4b", "#4c1d95"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 🔮 3D Blobs */}
      <Animated.View style={[styles.blob1, blobStyle]} />
      <Animated.View style={[styles.blob2, blobStyle]} />

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.icon}>🫁</Text>

        <Text style={styles.title}>
          Breathe consciously for 3 minutes
        </Text>

        <Text style={styles.subtitle}>
          Relax your mind. Follow your breath.
        </Text>

        {/* ✅ UPDATED BUTTON */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/start-task")}
        >
          <Text style={styles.buttonText}>Start Task</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  back: {
    color: "#fff",
    fontSize: 16,
    marginTop: 50,
    marginLeft: 20,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 60,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    color: "#cbd5f5",
    marginTop: 10,
    textAlign: "center",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#9333ea",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // 🔮 Blob styles (fake 3D)
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "#a855f7",
    borderRadius: 100,
    top: 100,
    left: -50,
    opacity: 0.4,
  },

  blob2: {
    position: "absolute",
    width: 250,
    height: 250,
    backgroundColor: "#6366f1",
    borderRadius: 125,
    bottom: 100,
    right: -80,
    opacity: 0.3,
  },
});