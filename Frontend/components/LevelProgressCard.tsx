import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUserLevelDetails, UserLevelDetails, MAX_LEVEL } from '../constants/levelConfig';

export interface LevelProgressCardProps {
  levelDetails?: UserLevelDetails | null;
  totalXp?: number;
  containerStyle?: ViewStyle;
}

export default function LevelProgressCard({
  levelDetails,
  totalXp,
  containerStyle,
}: LevelProgressCardProps) {
  // Use authoritative levelDetails if available, fallback to single source calculation
  const details =
    levelDetails || getUserLevelDetails(typeof totalXp === 'number' ? totalXp : 0);

  const currentLevel = details.current_level || details.level || 1;
  const isMaxLevel = details.is_max_level || currentLevel >= MAX_LEVEL;
  const currentXp = details.current_xp ?? details.total_xp ?? 0;
  const nextLevel = details.next_level;
  const xpToNext = details.xp_to_next_level ?? 0;
  const progressPercent = Math.min(100, Math.max(0, details.progress_percentage ?? 0));

  return (
    <View style={[styles.card, containerStyle]}>
      {/* Top Header Row: Level info & Total XP / MAX pill */}
      <View style={styles.headerRow}>
        <View style={styles.levelGroup}>
          <View style={[styles.levelIconWrapper, isMaxLevel && styles.levelIconWrapperMax]}>
            <Feather
              name={isMaxLevel ? 'award' : 'zap'}
              size={18}
              color={isMaxLevel ? '#D97706' : '#9333EA'}
            />
          </View>
          <View>
            <Text style={styles.cardSubtitle}>AntiSocial Level</Text>
            <Text style={styles.levelTitle}>Level {currentLevel}</Text>
          </View>
        </View>

        <View style={[styles.xpBadge, isMaxLevel && styles.maxBadge]}>
          {isMaxLevel ? (
            <Text style={styles.maxBadgeText}>MAX LEVEL</Text>
          ) : (
            <Text style={styles.xpBadgeText}>
              {currentXp.toLocaleString()} XP
            </Text>
          )}
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%` },
            isMaxLevel && styles.progressFillMax,
          ]}
        />
      </View>

      {/* Footer Info Row */}
      <View style={styles.footerRow}>
        <Text style={styles.footerProgressText}>
          Progress: {Math.round(progressPercent)}%
        </Text>
        <Text style={styles.footerRemainingText}>
          {isMaxLevel
            ? '50,000+ XP · Top Tier'
            : `${xpToNext.toLocaleString()} XP to Level ${nextLevel}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIconWrapperMax: {
    backgroundColor: '#FEF3C7',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  xpBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9333EA',
  },
  maxBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  maxBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 5,
  },
  progressFillMax: {
    backgroundColor: '#F59E0B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerProgressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  footerRemainingText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
});
