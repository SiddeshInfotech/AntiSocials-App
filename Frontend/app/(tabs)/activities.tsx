import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImageUrl } from '../../constants/ImageUtils';

import { API_BASE_URL } from '../../constants/Api';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';

export interface MemberPreview {
  id: string;
  name: string;
  profileImage: string | null;
}

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
  pincode?: string;
  city?: string;
  distance?: number;
  memberPreview?: MemberPreview[];
}

const AVATAR_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#14B8A6'];

const getAvatarColor = (name: string, index: number = 0) => {
  if (!name) return AVATAR_COLORS[index % AVATAR_COLORS.length];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};

export default function ActivitiesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

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

  const requestLocationAndFetch = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError("Please enable device location to continue.");
        setIsLocating(false);
        return;
      }

      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        setLocationError("Please enable device location to continue.");
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let pincode, city;
      if (reverseGeocode.length > 0) {
        pincode = reverseGeocode[0].postalCode;
        city = reverseGeocode[0].city || reverseGeocode[0].subregion;
      }

      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const meResponse = await fetch(`${API_BASE_URL}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          await fetch(`${API_BASE_URL}/user/${meData.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitude, longitude, pincode, city })
          });
          fetchActivities();
        }
      }
      setIsLocating(false);
    } catch (error: any) {
      console.log('Location fetch failed:', error.message || error);
      setLocationError("Location unavailable. Please check your GPS.");
      setIsLocating(false);
      
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const meResponse = await fetch(`${API_BASE_URL}/api/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            await fetch(`${API_BASE_URL}/user/${meData.id}`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: null, longitude: null })
            });
          }
        }
      } catch(e) {}
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      requestLocationAndFetch();
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
        const resData = await response.json();
        setActivities(prev => prev.map(a => {
          if (a.id === activity.id) {
            return {
              ...a,
              isJoined: isJoining,
              joined: resData.joined !== undefined ? resData.joined : (isJoining ? a.joined + 1 : Math.max(0, a.joined - 1)),
              memberPreview: resData.memberPreview !== undefined ? resData.memberPreview : a.memberPreview
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Activities</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/create-activity' as any)}
          >
            <Feather name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {isLocating ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#EA580C" />
            <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16 }}>Detecting location...</Text>
          </View>
        ) : locationError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <Feather name="map-pin" size={56} color="#D1D5DB" style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, color: '#111827', textAlign: 'center', marginBottom: 12, fontWeight: '700' }}>
              Location Unavailable
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
              {locationError}
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#EA580C', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: '100%' }}
              onPress={requestLocationAndFetch}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>Enable Location & Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                    <Text style={styles.detailText}>
                      {activity.location} {activity.city ? `(${activity.city})` : ''} 
                      {activity.distance ? ` • ${activity.distance.toFixed(1)} km away` : (activity.pincode ? ` • ${activity.pincode}` : '')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="users" size={16} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      {activity.joined}/{activity.capacity} joined
                    </Text>
                  </View>

                  {/* Joined Members Preview */}
                  {activity.memberPreview && activity.memberPreview.length > 0 && (
                    <View style={styles.memberPreviewContainer}>
                      <View style={styles.memberChipsRow}>
                        {activity.memberPreview.slice(0, 3).map((member, idx) => {
                          const imageUri = member.profileImage ? resolveImageUrl(member.profileImage) : null;
                          const initial = (member.name || 'U').charAt(0).toUpperCase();
                          return (
                            <View key={member.id || `member-${idx}`} style={styles.memberChip}>
                              {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.memberAvatarImage} />
                              ) : (
                                <View style={[styles.memberAvatarFallback, { backgroundColor: getAvatarColor(member.name, idx) }]}>
                                  <Text style={styles.memberAvatarInitial}>{initial}</Text>
                                </View>
                              )}
                              <Text style={styles.memberName} numberOfLines={1}>
                                {member.name}
                              </Text>
                            </View>
                          );
                        })}
                        {activity.joined > (activity.memberPreview?.length || 0) && (
                          <View style={styles.moreMembersBadge}>
                            <Text style={styles.moreMembersText}>
                              +{activity.joined - (activity.memberPreview?.length || 0)} more
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
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
        </>
        )}
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
  memberPreviewContainer: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  memberChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
    maxWidth: 140,
  },
  memberAvatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  memberAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  memberAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flexShrink: 1,
  },
  moreMembersBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  moreMembersText: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '600',
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

