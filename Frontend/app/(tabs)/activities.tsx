import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImageUrl } from '../../constants/ImageUtils';

import { API_BASE_URL } from '../../constants/Api';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';

interface Activity {
  id: string;
  category: string;
  title: string;
  date: string;
  time: string;
  location: string;
  joined: number;
  capacity: number;
  isJoined: boolean;
  creator: {
    name: string;
    initial: string;
    color: string;
  };
  imageColor: string;
  imageUrl: string | null;
  emoji: string;
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      fetchActivities();
    }
  }, [isFocused]);

  const handleToggleJoin = async (activity: Activity) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const isJoining = !activity.isJoined;
      const method = isJoining ? 'POST' : 'DELETE';
      const endpoint = isJoining ? 'join' : 'leave';

      const response = await fetch(`${API_BASE_URL}/api/activities/${activity.id}/${endpoint}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state for immediate UI feedback
        setActivities(prev => prev.map(a => {
          if (a.id === activity.id) {
            return {
              ...a,
              isJoined: isJoining,
              joined: isJoining ? a.joined + 1 : a.joined - 1
            };
          }
          return a;
        }));
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to update activity status');
      }
    } catch (error) {
      console.error('Error toggling join:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const displayedActivities = activeTab === 'joined' 
    ? activities.filter(a => a.isJoined)
    : activities;

  const joinedCount = activities.filter(a => a.isJoined).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activities</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/create-activity' as any)}
          >
            <Feather name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'discover' && styles.tabButtonActive]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'joined' && styles.tabButtonActive]}
            onPress={() => setActiveTab('joined')}
          >
            <Text style={[styles.tabText, activeTab === 'joined' && styles.tabTextActive]}>
              Joined ({joinedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={16} color="#4B5563" />
          <Text style={styles.filterText}>Filter by interests</Text>
        </TouchableOpacity>

        <ScrollView 
          style={styles.listContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchActivities(); }} />
          }
        >
          {loading && !refreshing ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
               <ActivityIndicator color="#EA580C" />
            </View>
          ) : displayedActivities.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'joined' ? "You haven't joined any activities yet." : "No activities found."}
              </Text>
              <TouchableOpacity onPress={() => activeTab === 'joined' ? setActiveTab('discover') : router.push('/create-activity' as any)} style={styles.discoverButton}>
                 <Text style={styles.discoverButtonText}>
                   {activeTab === 'joined' ? 'Discover Activities' : 'Create First Activity'}
                 </Text>
              </TouchableOpacity>
            </View>
          ) : displayedActivities.map((activity) => {
            return (
            <View key={activity.id} style={styles.card}>
              {/* Card Image Placeholder */}
              <View style={[styles.cardImage, { backgroundColor: activity.imageColor || '#f3f4f6' }]}>
                {activity.imageUrl ? (
                  <Image source={{ uri: resolveImageUrl(activity.imageUrl) }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={styles.emojiPlaceholder}>{activity.emoji}</Text>
                )}
              </View>

              {/* Card Content */}
              <View style={styles.cardContent}>
                {/* Category Pill */}
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{activity.category}</Text>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>{activity.title}</Text>

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{activity.date} • {activity.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={16} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>{activity.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="users" size={16} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      {activity.joined}/{activity.capacity} joined
                    </Text>
                  </View>
                </View>

                {/* Footer Divider */}
                <View style={styles.divider} />

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.creatorContainer}>
                    <View style={[styles.avatar, { backgroundColor: activity.creator.color }]}>
                      <Text style={styles.avatarText}>{activity.creator.initial}</Text>
                    </View>
                    <Text style={styles.creatorName}>by {activity.creator.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.joinButton, activity.isJoined && styles.joinButtonActive]}
                    onPress={() => handleToggleJoin(activity)}
                  >
                    <Text style={[styles.joinButtonText, activity.isJoined && styles.joinedButtonTextActive]}>
                      {activity.isJoined ? 'Joined ✓' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            );
          })}
          
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Feather name="heart" size={24} color="#EA580C" style={styles.infoIcon} />
            <Text style={styles.infoTitle}>Real Connections</Text>
            <Text style={styles.infoDescription}>
              Join local activities based on your interests. Meet verified people and create memories together in real life.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    marginHorizontal: -20, // To stretch the background color to edges
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    padding: 4,
    marginVertical: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#EA580C',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardImage: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPlaceholder: {
    fontSize: 60,
  },
  cardContent: {
    padding: 20,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  creatorName: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonActive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  joinedButtonTextActive: {
    color: '#4B5563',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  discoverButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  infoIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});

