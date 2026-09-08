import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

import { apiFetch } from '../constants/Api';
import {
  LIFE_EXPERIENCE_QUESTIONS,
  LIFE_EXPERIENCE_CATEGORIES,
  getCategoryById,
  LifeExperienceQuestion,
} from '../constants/lifeExperienceData';

const { width } = Dimensions.get('window');

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function LifeExperienceQuizScreen() {
  const router = useRouter();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  // Answers map: { "Q01": 2, "Q02": 3, ... } (1-indexed options: 1, 2, 3, 4)
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResult, setCompletedResult] = useState<any | null>(null);
  const [checkingCompleted, setCheckingCompleted] = useState(true);

  // Backend source of truth guard: never show quiz to a user who has already completed it
  useEffect(() => {
    let isMounted = true;
    async function verifyQuizStatus() {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          router.replace('/welcome' as any);
          return;
        }
        const res = await apiFetch('/api/life-score', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (
            data.quiz_completed ||
            data.quizCompleted ||
            data.data?.quiz_completed ||
            data.data?.quizCompleted
          ) {
            console.log('✅ User already completed quiz. Redirecting to home tabs...');
            router.replace('/(tabs)' as any);
            return;
          }
        }
      } catch (err) {
        console.warn('Quiz verification error:', err);
      } finally {
        if (isMounted) {
          setCheckingCompleted(false);
        }
      }
    }
    verifyQuizStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalQuestions = LIFE_EXPERIENCE_QUESTIONS.length;
  const currentQuestion: LifeExperienceQuestion = LIFE_EXPERIENCE_QUESTIONS[currentIndex];
  const currentCategory = useMemo(() => {
    return getCategoryById(currentQuestion?.categoryId);
  }, [currentQuestion]);

  const selectedOption = answers[currentQuestion?.id] ?? null;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optionIndex: number) => {
    // optionIndex is 0..3, so value is 1..4
    const value = optionIndex + 1;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (!selectedOption) {
      Alert.alert('Selection Required', 'Please select an option to continue.');
      return;
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Validate all 30 questions are answered
    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Incomplete Quiz',
        `You have answered ${answeredCount} of ${totalQuestions} questions. Please complete all questions.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Session Expired', 'Please log in again to save your score.');
        router.replace('/welcome' as any);
        return;
      }

      const response = await apiFetch('/api/life-score/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // Already completed
        Alert.alert(
          'Quiz Already Completed',
          'You have already established your baseline Life Experience Score.',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)' as any) }]
        );
        return;
      }

      if (!response.ok) {
        Alert.alert('Submission Error', data.error || 'Failed to submit quiz.');
        return;
      }

      // Success — show result screen
      const resultData = data.scores || data.data || data;
      setCompletedResult({
        overall_score: resultData.overallScore ?? resultData.overall_score ?? 0,
        categories: resultData.categoryScores ?? resultData.categories ?? {},
      });
    } catch (err) {
      console.error('Quiz submission error:', err);
      Alert.alert('Network Error', 'Could not submit your quiz. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading indicator while verifying backend source of truth for quiz status
  if (checkingCompleted) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </SafeAreaView>
    );
  }

  // Result / Reveal view once submitted
  if (completedResult) {
    const overall = completedResult.overall_score || 0;
    const catScores = completedResult.categories || {};

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.celebrationBadge}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.celebrationCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="star-four-points" size={42} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.resultTitle}>Life Experience Score</Text>
          <Text style={styles.resultSubtitle}>
            Your personal baseline has been calculated across 10 dimensions of real-life exploration.
          </Text>

          {/* Overall Score Card */}
          <View style={styles.overallScoreCard}>
            <LinearGradient
              colors={['#FAF5FF', '#F3E8FF']}
              style={styles.overallScoreGradient}
            >
              <Text style={styles.overallLabel}>OVERALL SCORE</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.overallScoreNumber}>{overall}</Text>
                <Text style={styles.overallScoreMax}>/ 100</Text>
              </View>
              <Text style={styles.scoreTip}>
                Complete real-world tasks and attend community activities to boost your score!
              </Text>
            </LinearGradient>
          </View>

          {/* Category Breakdown */}
          <Text style={styles.breakdownHeader}>Category Breakdown</Text>
          <View style={styles.categoryList}>
            {LIFE_EXPERIENCE_CATEGORIES.map((cat) => {
              const score = catScores[cat.id] ?? 0;
              return (
                <View key={cat.id} style={styles.catRow}>
                  <View style={styles.catHeader}>
                    <View style={styles.catNameGroup}>
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>
                    <Text style={styles.catScoreText}>{Number(score).toFixed(1)}/100</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Finish Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/(tabs)' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.continueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueText}>Enter AntiSocial</Text>
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={[styles.headerNavBtn, currentIndex === 0 && { opacity: 0.3 }]}
        >
          <Feather name="arrow-left" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.progressCounter}>
          <Text style={styles.progressCounterText}>
            Question <Text style={styles.boldText}>{currentIndex + 1}</Text> of {totalQuestions}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Main Question Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Pill */}
        {currentCategory && (
          <View style={[styles.categoryBadge, { backgroundColor: `${currentCategory.color}15` }]}>
            <Text style={styles.catBadgeIcon}>{currentCategory.icon}</Text>
            <Text style={[styles.catBadgeText, { color: currentCategory.color }]}>
              {currentCategory.name}
            </Text>
            <View style={[styles.weightDot, { backgroundColor: currentCategory.color }]} />
            <Text style={[styles.weightText, { color: currentCategory.color }]}>
              {Math.round(currentCategory.weight * 100)}% weight
            </Text>
          </View>
        )}

        {/* Question Text */}
        <Text style={styles.questionText}>{currentQuestion.text}</Text>

        {/* Subtitle helper */}
        <Text style={styles.questionSubtitle}>Choose the option that best reflects your life journey so far:</Text>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((optText, optIdx) => {
            const isSelected = selectedOption === optIdx + 1;
            return (
              <TouchableOpacity
                key={optIdx}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleSelectOption(optIdx)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.optionLabelBadge,
                    isSelected && styles.optionLabelBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabelText,
                      isSelected && styles.optionLabelTextSelected,
                    ]}
                  >
                    {OPTION_LABELS[optIdx]}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {optText}
                </Text>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedOption && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedOption || isSubmitting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              selectedOption
                ? ['#8B5CF6', '#6366F1']
                : ['#E5E7EB', '#D1D5DB']
            }
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text
                  style={[
                    styles.nextButtonText,
                    !selectedOption && styles.nextButtonTextDisabled,
                  ]}
                >
                  {currentIndex === totalQuestions - 1
                    ? 'Calculate My Life Score'
                    : 'Next Question'}
                </Text>
                <Feather
                  name={currentIndex === totalQuestions - 1 ? 'check' : 'arrow-right'}
                  size={18}
                  color={selectedOption ? '#FFFFFF' : '#9CA3AF'}
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerNavBtn: {
    padding: 8,
    borderRadius: 8,
  },
  progressCounter: {
    alignItems: 'center',
  },
  progressCounterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 38,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  catBadgeIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  catBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 30,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
  },
  optionCardSelected: {
    backgroundColor: '#FAF5FF',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  optionLabelBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelBadgeSelected: {
    backgroundColor: '#8B5CF6',
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  optionLabelTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: '#8B5CF6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Result View Styles
  resultContainer: {
    padding: 24,
    alignItems: 'center',
  },
  celebrationBadge: {
    marginBottom: 16,
    marginTop: 8,
  },
  celebrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  overallScoreCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 24,
  },
  overallScoreGradient: {
    padding: 22,
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  overallScoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#6B21A8',
  },
  overallScoreMax: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9333EA',
    marginLeft: 4,
  },
  scoreTip: {
    fontSize: 13,
    color: '#7E22CE',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  breakdownHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  categoryList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  catRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  catScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  barBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
