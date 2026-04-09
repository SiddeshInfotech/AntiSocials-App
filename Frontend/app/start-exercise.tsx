import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 1,
    title: "How much experience do you have with stretching?",
    options: ["Quite a lot", "A moderate amount", "A little bit", "Barely any"]
  },
  {
    id: 2,
    title: "What would you say is your current flexibility level?",
    options: ["I'm quite flexible", "I'm kinda flexible", "I'm not very flexible"]
  },
  {
    id: 3,
    title: "Is stretching important?",
    options: ["Yes", "Yes, but..."]
  }
];

export default function StartExerciseScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQ = QUESTIONS[currentStep];
  const selectedOption = answers[currentQ.id];

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    if (currentStep < QUESTIONS.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -40, duration: 200, useNativeDriver: true })
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
        slideAnim.setValue(40);

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
        ]).start();
      });
    } else {
      // Direct Navigation to the Exercise Detail screen (The premium UI)
      router.push('/exercise-detail' as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 200, useNativeDriver: true })
      ]).start(() => {
        setCurrentStep(prev => prev - 1);
        slideAnim.setValue(-40);

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
        ]).start();
      });
    } else {
      router.back();
    }
  };

  const progressWidth = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
        </View>

        <Animated.View style={[styles.questionArea, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.questionTitle}>{currentQ.title}</Text>

          <View style={styles.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt}</Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Feather name="check" size={16} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.continueBtn, !selectedOption && { opacity: 0.3 }]}
            onPress={handleContinue}
            disabled={!selectedOption}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2c2c2c',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d9fc00',
    borderRadius: 2,
  },
  questionArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  questionTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsList: {
    flexDirection: 'column',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#d9fc00',
    backgroundColor: 'rgba(217, 252, 0, 0.05)',
  },
  optionText: {
    color: '#a1a1aa',
    fontSize: 17,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d9fc00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#d9fc00',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  }
});
