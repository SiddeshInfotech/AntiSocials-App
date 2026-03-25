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

export default function DrinkTask() {
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
    transform: [
      { translateY: float.value * -15 }
    ]
  }));

  return (
    <View style={styles.container}>

      {/* 🌊 Background Gradient */}
      <LinearGradient
        colors={["#0f172a", "#0ea5e9", "#38bdf8"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back */}
      <TouchableOpacity style={styles.backWrap} onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>

        {/* 💧 Animated Drop */}
        <Animated.Text style={[styles.drop, floatStyle]}>
          💧
        </Animated.Text>

        <Text style={styles.title}>
          Drink a glass of water
        </Text>

        <Text style={styles.subtitle}>
          Stay hydrated. Refresh your body.
        </Text>

        {/* Info Box */}
        <View style={styles.card}>
          <Text style={styles.cardText}>
            ✔ Earn 150 points after completion
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push("/drink-active")}
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
  },

  backWrap: {
    marginTop: 50,
    marginLeft: 20,
  },

  back: {
    color: "#fff",
    fontSize: 16,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  drop: {
    fontSize: 80,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    color: "#e0f2fe",
    marginTop: 10,
    textAlign: "center",
  },

  card: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  cardText: {
    color: "#fff",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#0284c7",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});