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

const INTERESTS = [
  "Theatre & Acting",
  "Dance",
  "Startup & Entrepreneurship",
  "Business Networking",
  "Freelancing",
  "Tech & AI",
  "Personal Growth",
  "Mental Health",
  "Spirituality",
  "Volunteering & Social Work",
  "Fitness & Gym",
  "Running & Walking",
  "Yoga & Wellness",
  "Meditation & Mindfulness",
  "Cricket"
];

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
  },
  {
    id: "7",
    title: "Tell us what you're into",
    subtitle: "Choose at least 3 interests",
    desc: "You can update this later.",
    colors: ["#5398d5", "#15898f"] as const
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const translateX = useSharedValue(0);

  const goNext = () => {
    const item = DATA[index];

    if (item.id === "7" && selected.length < 3) {
      alert("Select at least 3 interests");
      return;
    }

    if (index < DATA.length - 1) {
      setIndex((prev) => prev + 1);
      translateX.value = 0;
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
      translateX.value = 0;
    }
  };

  const toggleInterest = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
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
        translateX.value = withSpring(width, {}, () => {
          runOnJS(goPrev)(); // ✅ FIXED CRASH
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${translateX.value / 20}deg` }
    ]
  }));

  const item = DATA[index];

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <LinearGradient colors={item.colors} style={styles.gradient}>
            
            {item.id === "7" ? (
              <>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.desc}>{item.desc}</Text>

                <View style={styles.interestContainer}>
                  {INTERESTS.map((interest) => {
                    const isSelected = selected.includes(interest);

                    return (
                      <TouchableOpacity
                        key={interest}
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected
                        ]}
                        onPress={() => toggleInterest(interest)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected
                          ]}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </>
            )}

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

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={goNext}>
        <Text style={styles.buttonText}>
          {index === DATA.length - 1 ? "Get Started" : "Continue →"}
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
    alignItems: "center",
    padding: 20
  },

  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center"
  },

  subtitle: {
    fontSize: 14,
    color: "#fff",
    marginTop: 10,
    textAlign: "center"
  },

  desc: {
    color: "#eee",
    marginTop: 5,
    textAlign: "center"
  },

  interestContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    justifyContent: "center"
  },

  chip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5
  },

  chipSelected: {
    backgroundColor: "#fff"
  },

  chipText: {
    color: "#fff",
    fontSize: 12
  },

  chipTextSelected: {
    color: "#000",
    fontWeight: "600"
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

  button: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 25,
    width: "80%",
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600"
  }
});
