import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence
} from "react-native-reanimated";

export default function DrinkActive() {
  const router = useRouter();

  const fill = useSharedValue(0);
  const float = useSharedValue(0);
  const blink = useSharedValue(1);
  const wave = useSharedValue(0);

  const [isHappy, setIsHappy] = useState(false);

  // 💧 Water fill
  useEffect(() => {
    fill.value = withTiming(1, { duration: 5000 });
  }, []);

  // 🌊 Floating bottle
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  // 😉 Natural blink
  useEffect(() => {
    const blinkLoop = () => {
      blink.value = withTiming(0.1, { duration: 150 });

      setTimeout(() => {
        blink.value = withTiming(1, { duration: 150 });
      }, 150);

      setTimeout(blinkLoop, 2000 + Math.random() * 2000);
    };

    blinkLoop();
  }, []);

  // 😄 Become happy
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHappy(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // 🌊 Wave animation
  useEffect(() => {
    wave.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000 }),
        withTiming(-10, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const waterStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wave.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -10 }],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  return (
    <View style={styles.container}>

      {/* 🌊 Background */}
      <LinearGradient
        colors={["#0f172a", "#0284c7", "#38bdf8"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back */}
      <TouchableOpacity style={styles.backWrap} onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>

        <Text style={styles.title}>Drink mindfully</Text>
        <Text style={styles.subtitle}>Take your time and feel each sip</Text>

        {/* 🧴 Bottle */}
        <Animated.View style={[styles.bottleContainer, floatStyle]}>

          <View style={styles.cap} />

          <View style={styles.bottle}>

            {/* 💧 Water */}
            <Animated.View style={[styles.water, waterStyle]}>
              <Animated.View style={[styles.wave, waveStyle]} />
            </Animated.View>

            {/* 😊 Face */}
            <View style={styles.face}>
              <Animated.View style={[styles.eye, eyeStyle]} />
              <Animated.View style={[styles.eye, eyeStyle]} />
            </View>

            <View style={isHappy ? styles.smileHappy : styles.smile} />

            {/* 💕 Blush */}
            <View style={styles.blushLeft} />
            <View style={styles.blushRight} />

            {/* ✨ Shine */}
            <View style={styles.shine} />

          </View>
        </Animated.View>

        {/* 🫧 Floating bubbles */}
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💧 Stay hydrated and enjoy your sip!
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/task-complete",
              params: { type: "water" }
            })
          }
        >
          <Text style={styles.buttonText}>Done Drinking</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  backWrap: { marginTop: 50, marginLeft: 20 },
  back: { color: "#fff", fontSize: 16 },

  content: { flex: 1, alignItems: "center", justifyContent: "center" },

  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "#e0f2fe", marginBottom: 20 },

  bottleContainer: { alignItems: "center", marginBottom: 30 },

  cap: {
    width: 40,
    height: 25,
    backgroundColor: "#0284c7",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },

  bottle: {
    width: 140,
    height: 260,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  water: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#38bdf8",
    overflow: "hidden",
  },

  wave: {
    position: "absolute",
    top: -10,
    width: "200%",
    height: 20,
    backgroundColor: "#7dd3fc",
    borderRadius: 50,
  },

  face: {
    position: "absolute",
    top: "42%",
    flexDirection: "row",
    gap: 18,
  },

  eye: {
    width: 10,
    height: 10,
    backgroundColor: "#0f172a",
    borderRadius: 5,
  },

  smile: {
    position: "absolute",
    top: "50%",
    width: 25,
    height: 8,
    borderBottomWidth: 2,
    borderColor: "#0f172a",
    borderRadius: 20,
  },

  smileHappy: {
    position: "absolute",
    top: "50%",
    width: 35,
    height: 15,
    borderBottomWidth: 3,
    borderColor: "#0f172a",
    borderRadius: 20,
  },

  blushLeft: {
    position: "absolute",
    top: "48%",
    left: 25,
    width: 12,
    height: 12,
    backgroundColor: "#fda4af",
    borderRadius: 6,
    opacity: 0.6,
  },

  blushRight: {
    position: "absolute",
    top: "48%",
    right: 25,
    width: 12,
    height: 12,
    backgroundColor: "#fda4af",
    borderRadius: 6,
    opacity: 0.6,
  },

  shine: {
    position: "absolute",
    top: 30,
    left: 20,
    width: 20,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
  },

  bubble1: {
    position: "absolute",
    bottom: 200,
    left: 50,
    width: 12,
    height: 12,
    backgroundColor: "#bae6fd",
    borderRadius: 6,
  },

  bubble2: {
    position: "absolute",
    bottom: 250,
    right: 60,
    width: 8,
    height: 8,
    backgroundColor: "#bae6fd",
    borderRadius: 4,
  },

  infoBox: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },

  infoText: { color: "#fff" },

  button: {
    backgroundColor: "#0284c7",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  buttonText: { color: "#fff", fontWeight: "bold" },
});