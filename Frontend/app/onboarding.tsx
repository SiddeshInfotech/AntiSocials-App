import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from "react-native-reanimated";

import {
  GestureDetector,
  Gesture
} from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

const DATA = [
  {
    id: "1",
    title: "Welcome to AntiSocial",
    subtitle: "Reconnect with Real Life",
    desc: "Break free from endless scrolling.",
    colors: ["#9C27FF", "#3F51FF"] as const
  },
  {
    id: "2",
    title: "Join people, not profiles",
    subtitle: "Real connections matter",
    desc: "Meet verified people and build memories.",
    colors: ["#2962FF", "#1E88E5"] as const
  },
  {
    id: "3",
    title: "Your world, organised by trust",
    subtitle: "How it works",
    desc: "Add people to trust levels.",
    colors: ["#00C853", "#009624"] as const
  },
  {
    id: "4",
    title: "Grow through actions",
    subtitle: "Tasks & Points",
    desc: "Complete tasks and earn rewards.",
    colors: ["#FF9800", "#F57C00"] as const
  },
  {
    id: "5",
    title: "Meet through experiences",
    subtitle: "Community Activities",
    desc: "Join events and connect.",
    colors: ["#FF3D00", "#DD2C00"] as const
  },
  {
    id: "6",
    title: "Connections that go deeper",
    subtitle: "Heart & Legacy",
    desc: "Build long-term connections.",
    colors: ["#D50000", "#B71C1C"] as const
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const translateX = useSharedValue(0);

  const goNext = () => {
    if (index < DATA.length - 1) {
      setIndex((prev) => prev + 1);
      translateX.value = 0;
    } else {
      router.replace("/");
    }
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX < -100) {
        translateX.value = withSpring(-width, {}, () => {
          runOnJS(goNext)();
        });
      } else if (e.translationX > 100) {
        if (index > 0) {
          translateX.value = withSpring(width, {}, () => {
            runOnJS(() => {
              setIndex((prev) => prev - 1);
              translateX.value = 0;
            })();
          });
        } else {
          translateX.value = withSpring(0);
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${translateX.value / 20}deg` }
      ]
    };
  });

  const item = DATA[index];

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <LinearGradient colors={item.colors} style={styles.gradient}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>

      {/* Dots */}
      <View style={styles.dots}>
        {DATA.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot
            ]}
          />
        ))}
      </View>

      {/* 🔥 Glassy Black Button */}
      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {index === DATA.length - 1
            ? "Get Started"
            : "Continue →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    width: width * 0.85,
    height: "65%",
    borderRadius: 25,
    overflow: "hidden",
    elevation: 5
  },

  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center"
  },

  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    textAlign: "center"
  },

  desc: {
    color: "#eee",
    marginTop: 10,
    textAlign: "center"
  },

  dots: {
    flexDirection: "row",
    marginTop: 20
  },

  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    margin: 5
  },

  activeDot: {
    backgroundColor: "#7B61FF",
    width: 20
  },

  // 🔥 UPDATED BUTTON
  button: {
  position: "absolute",
  bottom: 40,
  backgroundColor: "#000", // ✅ simple black
  padding: 15,
  borderRadius: 25,
  width: "80%",
  alignItems: "center"
},

  buttonText: {
  color: "#fff",
  fontWeight: "600"
},
});