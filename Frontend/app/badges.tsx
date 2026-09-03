import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

const CATEGORIES = [
  { key: 'all', label: 'All Badges' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'community', label: 'Community' },
  { key: 'social', label: 'Social' },
  { key: 'categories', label: 'Task Types' },
  { key: 'special', label: 'Special' },
];

export default function BadgesScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ unlockedCount: 0, totalCount: 0, lockedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        router.replace('/welcome' as any);
        return;
      }

      const res = await apiFetch('/api/badges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
        setStats(data.stats || { unlockedCount: 0, totalCount: 0, lockedCount: 0 });
      }
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory);

  const formatUnlockDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const unlockPercentage = stats.totalCount > 0 
    ? Math.round((stats.unlockedCount / stats.totalCount) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Top Nav Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements & Badges</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Banner Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Progress</Text>
              <Text style={styles.summaryValue}>
                {stats.unlockedCount} of {stats.totalCount} Unlocked
              </Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{unlockPercentage}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${unlockPercentage}%` }]} />
          </View>

          <Text style={styles.summarySubtitle}>
            Complete daily tasks, streaks, and community activities to earn meaningful badges!
          </Text>
        </View>

        {/* Category Selector Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesScroll}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Badges Grid / Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9333EA" />
          </View>
        ) : filteredBadges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No badges found in this category.</Text>
          </View>
        ) : (
          <View style={styles.badgesListContainer}>
            {filteredBadges.map(badge => {
              const isUnlocked = badge.isUnlocked;
              const progressPct = badge.maxProgress > 0 
                ? Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100))
                : 0;

              return (
                <View 
                  key={badge.id} 
                  style={[
                    styles.badgeCard,
                    isUnlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked
                  ]}
                >
                  <View style={styles.badgeCardHeader}>
                    <View style={[styles.iconContainer, isUnlocked ? styles.iconContainerUnlocked : styles.iconContainerLocked]}>
                      <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeIconFaded]}>
                        {badge.icon}
                      </Text>
                      {!isUnlocked && (
                        <View style={styles.lockOverlayBadge}>
                          <Feather name="lock" size={12} color="#6B7280" />
                        </View>
                      )}
                    </View>

                    <View style={styles.badgeCardMain}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}>
                          {badge.name}
                        </Text>
                        <View style={[styles.statusTag, isUnlocked ? styles.statusUnlockedTag : styles.statusLockedTag]}>
                          <Text style={[styles.statusTagText, isUnlocked ? styles.statusUnlockedTagText : styles.statusLockedTagText]}>
                            {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.badgeDesc}>{badge.description}</Text>

                      {/* Requirement & Progress */}
                      {isUnlocked ? (
                        <View style={styles.unlockedDateRow}>
                          <Feather name="check-circle" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={styles.unlockedDateText}>
                            Unlocked {badge.unlockedAt ? formatUnlockDate(badge.unlockedAt) : 'Earned'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressTextRow}>
                            <Text style={styles.progressLabel}>Requirement Progress</Text>
                            <Text style={styles.progressValue}>
                              {badge.progress} / {badge.maxProgress}
                            </Text>
                          </View>
                          <View style={styles.smallProgressBg}>
                            <View style={[styles.smallProgressFill, { width: `${progressPct}%` }]} />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFB',
  },
  summaryCard: {
    margin: 20,
    backgroundColor: '#9333EA',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#E9D5FF',
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  percentageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#F3E8FF',
    lineHeight: 18,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  badgesListContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  badgeCardUnlocked: {
    borderColor: '#E9D5FF',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeCardLocked: {
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFB',
  },
  badgeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  iconContainerUnlocked: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#F3E8FF',
  },
  iconContainerLocked: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeIcon: {
    fontSize: 26,
  },
  badgeIconFaded: {
    opacity: 0.4,
  },
  lockOverlayBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeCardMain: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badgeNameLocked: {
    color: '#4B5563',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusUnlockedTag: {
    backgroundColor: '#DCFCE7',
  },
  statusLockedTag: {
    backgroundColor: '#F3F4F6',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusUnlockedTagText: {
    color: '#16A34A',
  },
  statusLockedTagText: {
    color: '#6B7280',
  },
  badgeDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  unlockedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  unlockedDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  smallProgressBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  smallProgressFill: {
    height: '100%',
    backgroundColor: '#9333EA',
    borderRadius: 3,
  },
});
