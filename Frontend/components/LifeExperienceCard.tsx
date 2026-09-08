import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  LIFE_EXPERIENCE_CATEGORIES,
  LifeExperienceCategory,
} from '../constants/lifeExperienceData';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LifeExperienceCardProps {
  scoreData?: any;
  isLoading?: boolean;
}

export default function LifeExperienceCard({
  scoreData,
  isLoading = false,
}: LifeExperienceCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  // Safely extract quiz completion state from any supported response shape
  const isQuizCompleted = Boolean(
    scoreData?.quizCompleted ??
    scoreData?.quiz_completed ??
    scoreData?.data?.quizCompleted ??
    scoreData?.data?.quiz_completed
  );

  // If user hasn't completed quiz, display an invitation card
  if (!isQuizCompleted) {
    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={['#7C3AED', '#4F46E5']}
          style={styles.uncompletedCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.uncompletedHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="compass-rose" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.uncompletedTitleWrap}>
              <Text style={styles.uncompletedTitle}>Life Experience Score</Text>
              <Text style={styles.uncompletedSubtitle}>
                Discover your baseline across 10 life dimensions
              </Text>
            </View>
          </View>

          <Text style={styles.uncompletedDescription}>
            Take our 30-question baseline quiz to map your real-world experiences, relationships, and growth. Your total score is calculated out of 100 and updates dynamically as you complete activities.
          </Text>

          <TouchableOpacity
            style={styles.takeQuizBtn}
            onPress={() => router.push('/life-experience-quiz' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.takeQuizBtnText}>Take 3-Min Quiz</Text>
            <Feather name="arrow-right" size={16} color="#7C3AED" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Extract overall scores
  const rawOverall =
    scoreData?.overallScore ??
    scoreData?.overall_score ??
    scoreData?.data?.overallScore ??
    scoreData?.data?.overall_score ??
    scoreData?.current?.overall ??
    scoreData?.data?.currentScores?.overallScore ??
    0;
  const overallCurrent = Math.round(Number(rawOverall) * 10) / 10;

  // Extract category scores map
  const categoryScores: Record<string, number> =
    scoreData?.categoryScores ??
    scoreData?.current?.categories ??
    scoreData?.data?.categoryScores ??
    scoreData?.data?.currentScores ??
    {};

  // Extract baseline scores map
  const baselineScores: Record<string, number> =
    scoreData?.baselineScores ??
    scoreData?.baseline?.categories ??
    scoreData?.data?.baselineScores ??
    {};

  const rawBaseline =
    scoreData?.baseline?.overall ??
    scoreData?.data?.baselineScores?.overallScore ??
    overallCurrent;
  const overallBaseline = Math.round(Number(rawBaseline) * 10) / 10;
  const overallGain = Math.max(0, Math.round((overallCurrent - overallBaseline) * 10) / 10);

  // Determine tier based on overall score
  const getTierLabel = (score: number) => {
    if (score >= 80) return { label: 'Master Explorer', color: '#10B981', bg: '#D1FAE5' };
    if (score >= 65) return { label: 'Adventurer', color: '#8B5CF6', bg: '#EDE9FE' };
    if (score >= 45) return { label: 'Active Seeker', color: '#3B82F6', bg: '#DBEAFE' };
    return { label: 'Growing Pathfinder', color: '#F59E0B', bg: '#FEF3C7' };
  };

  const tier = getTierLabel(overallCurrent);

  // Toggle expand/collapse animation
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const displayedCategories = isExpanded
    ? LIFE_EXPERIENCE_CATEGORIES
    : LIFE_EXPERIENCE_CATEGORIES.slice(0, 4);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.mainCard}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons name="certificate-outline" size={22} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Life Experience Score</Text>
              <Text style={styles.headerSubtitle}>Real-World Growth Index</Text>
            </View>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
            <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
          </View>
        </View>

        {/* Overall Score Highlight Banner — Clean XX/100 Format */}
        <View style={styles.scoreHighlightBanner}>
          <LinearGradient
            colors={['#F5F3FF', '#EDE9FE']}
            style={styles.scoreHighlightGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.scoreHighlightLeft}>
              <Text style={styles.scoreHighlightLabel}>TOTAL OVERALL SCORE</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLargeNumber}>{overallCurrent.toFixed(1)}</Text>
                <Text style={styles.scoreDenominator}>/ 100</Text>
              </View>
              {overallGain > 0 ? (
                <View style={styles.gainBadge}>
                  <Feather name="trending-up" size={13} color="#10B981" />
                  <Text style={styles.gainText}>+{overallGain} pts from real activities</Text>
                </View>
              ) : (
                <Text style={styles.scoreSubtext}>Calculated across 10 life dimensions</Text>
              )}
            </View>

            <View style={styles.scoreHighlightRight}>
              <View style={styles.scoreRingCircle}>
                <Text style={styles.ringScoreText}>
                  {Math.round(overallCurrent)}
                </Text>
                <Text style={styles.ringSubtext}>/ 100</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Category Breakdown Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category-Wise Scores</Text>
          <Text style={styles.sectionSubtitle}>
            {isExpanded ? '10 of 10 Categories' : 'Top Categories'}
          </Text>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesList}>
          {displayedCategories.map((category: LifeExperienceCategory) => {
            const currentCatScore = Number(categoryScores[category.id] ?? 0);
            const baselineCatScore = Number(baselineScores[category.id] ?? currentCatScore);
            const catGain = Math.max(0, Math.round((currentCatScore - baselineCatScore) * 10) / 10);

            return (
              <View key={category.id} style={styles.catItem}>
                <View style={styles.catTopRow}>
                  <View style={styles.catIdentity}>
                    <Text style={styles.catEmoji}>{category.icon}</Text>
                    <Text style={styles.catName} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </View>
                  <View style={styles.catScoreValues}>
                    {catGain > 0 && (
                      <Text style={styles.catGainText}>+{catGain}</Text>
                    )}
                    <Text style={styles.catScoreText}>
                      {currentCatScore.toFixed(1)}
                      <Text style={styles.catScoreMax}>/100</Text>
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(0, currentCatScore))}%`,
                        backgroundColor: category.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Expand / Collapse Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Show Less' : 'View All 10 Categories'}
          </Text>
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#7C3AED"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Subtle Footer Note */}
        <View style={styles.footerNote}>
          <Feather name="info" size={13} color="#9CA3AF" style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            Total score updates dynamically when you complete offline tasks and attend community activities.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scoreHighlightBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  scoreHighlightGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scoreHighlightLeft: {
    flex: 1,
  },
  scoreHighlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreLargeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#5B21B6',
  },
  scoreDenominator: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  scoreSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  gainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  scoreHighlightRight: {
    marginLeft: 12,
  },
  scoreRingCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ringScoreText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5B21B6',
  },
  ringSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoriesList: {
    gap: 12,
  },
  catItem: {
    gap: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  catEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  catScoreValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catGainText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 2,
  },
  catScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  catScoreMax: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#6B7280',
    flex: 1,
    lineHeight: 15,
  },
  // Uncompleted Quiz Banner Styles
  uncompletedCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  uncompletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uncompletedTitleWrap: {
    flex: 1,
  },
  uncompletedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  uncompletedSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  uncompletedDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 16,
  },
  takeQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  takeQuizBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
