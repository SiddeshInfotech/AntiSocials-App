import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resolveImageUrl } from '../../constants/ImageUtils';

import { API_BASE_URL, apiFetch } from '../../constants/Api';
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
  creatorId?: string;
  creator_id?: string;
  isCreator?: boolean;
  category: string;
  title: string;
  date: string;
  time: string;
  location: string;
  locationName?: string;
  address?: string;
  joined: number;
  capacity: number;
  isJoined: boolean;
  creator: {
    name: string;
    initial: string;
    color: string;
    image?: string | null;
  };
  imageColor: string;
  imageUrl: string | null;
  image_url?: string | null;
  emoji: string;
  pincode?: string;
  city?: string;
  distance?: number;
  memberPreview?: MemberPreview[];
}

const CATEGORY_COLORS: { [key: string]: string } = {
  "Sports & Fitness": "#FF5722",
  "Music & Jamming": "#E91E63",
  "Reading & Book Club": "#9C27B0",
  "Study Groups": "#3F51B5",
  "Tech & Coding": "#00BCD4",
  "Networking & Meetups": "#4CAF50",
  "Arts & Creativity": "#FF9800",
  "Gaming": "#795548",
  "Movies & Entertainment": "#607D8B",
  "Food & Dining": "#E64A19"
};

const CATEGORY_EMOJIS: { [key: string]: string } = {
  "Sports & Fitness": "⚽",
  "Music & Jamming": "🎸",
  "Reading & Book Club": "📚",
  "Study Groups": "📖",
  "Tech & Coding": "💻",
  "Networking & Meetups": "🤝",
  "Arts & Creativity": "🎨",
  "Gaming": "🎮",
  "Movies & Entertainment": "🎬",
  "Food & Dining": "🍕"
};

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const getAvatarColor = (name: string, index: number): string => {
  if (!name) return AVATAR_COLORS[index % AVATAR_COLORS.length];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

const formatToNumericDate = (rawDate?: string): string => {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (!trimmed) return '';

  // Handle DD/MM/YYYY or D/M/YYYY
  const dmySlashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlashMatch) {
    const [, d, m, y] = dmySlashMatch;
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      // MM/DD/YYYY to DD/MM/YYYY
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    }
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Handle DD-MM-YYYY or D-M-YYYY
  const dmyDashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDashMatch) {
    const [, d, m, y] = dmyDashMatch;
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    }
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const currentYear = new Date().getFullYear();

  // Pattern 1: "Aug 12" or "Aug 12, 2026" or "August 12 2026"
  const monthFirstMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/i);
  if (monthFirstMatch) {
    const monthKey = monthFirstMatch[1].toLowerCase();
    if (MONTH_MAP[monthKey]) {
      const month = MONTH_MAP[monthKey];
      const day = monthFirstMatch[2].padStart(2, '0');
      const year = monthFirstMatch[3] || String(currentYear);
      return `${day}/${month}/${year}`;
    }
  }

  // Pattern 2: "12 Aug" or "12 Aug, 2026" or "12 August 2026"
  const dayFirstMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)(?:[,\s]+(\d{4}))?/i);
  if (dayFirstMatch) {
    const monthKey = dayFirstMatch[2].toLowerCase();
    if (MONTH_MAP[monthKey]) {
      const month = MONTH_MAP[monthKey];
      const day = dayFirstMatch[1].padStart(2, '0');
      const year = dayFirstMatch[3] || String(currentYear);
      return `${day}/${month}/${year}`;
    }
  }

  // Try parsing standard Date string
  const parsed = Date.parse(trimmed.includes(' ') || trimmed.includes(',') || trimmed.length > 6 ? trimmed : `${trimmed} ${currentYear}`);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      if (token && !currentUserId) {
        const meRes = await apiFetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData?.id) setCurrentUserId(meData.id.toString());
        }
      }
      const endpoint = activeTab === 'joined' ? '/api/activities/joined' : '/api/activities';
      const response = await apiFetch(endpoint, {
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
        const meResponse = await apiFetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData?.id) setCurrentUserId(meData.id.toString());
          await apiFetch(`/user/${meData.id}`, {
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
          const meResponse = await apiFetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData?.id) setCurrentUserId(meData.id.toString());
            await apiFetch(`/user/${meData.id}`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude: null, longitude: null })
            });
          }
        }
      } catch(e) {}
    }
  };

  useEffect(() => {
    if (isFocused) {
      requestLocationAndFetch();
    }
  }, [isFocused]);

  useEffect(() => {
    fetchActivities();
  }, [activeTab]);

  const handleOpenDeleteDialog = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    const actId = activityToDelete.id;
    try {
      setDeletingId(actId);
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch(`/api/activities/${actId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Instantly remove from feed
        setActivities(prev => prev.filter(a => a.id !== actId));
        setDeleteModalVisible(false);
        setActivityToDelete(null);
      } else {
        const data = await response.json().catch(() => ({}));
        Alert.alert("Error", data.error || "Failed to delete activity. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
      Alert.alert("Error", "Network error while deleting activity.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleJoin = async (activity: Activity) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const isJoining = !activity.isJoined;
      const method = isJoining ? 'POST' : 'DELETE';
      const endpoint = isJoining ? 'join' : 'leave';

      const response = await apiFetch(`/api/activities/${activity.id}/${endpoint}`, {
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
          <View style={styles.locatingContainer}>
            <View style={styles.locatingContent}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.locatingText}>Detecting location...</Text>
            </View>
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
            const rawImageUrl = (activity.imageUrl || activity.image_url || '').trim();
            const isImageInvalid = 
              !rawImageUrl || 
              rawImageUrl.toLowerCase() === 'null' || 
              rawImageUrl.toLowerCase() === 'undefined' || 
              rawImageUrl === '[object Object]' ||
              rawImageUrl === 'uploads/' || 
              rawImageUrl === '/uploads/' ||
              rawImageUrl.endsWith('/null') ||
              rawImageUrl.endsWith('/undefined');
            
            const hasValidImage = !isImageInvalid && !imageErrors[activity.id];
            const resolvedUri = hasValidImage ? resolveImageUrl(rawImageUrl) : null;
            const defaultBgColor = CATEGORY_COLORS[activity.category] || activity.imageColor || '#EA580C';
            const defaultEmoji = CATEGORY_EMOJIS[activity.category] || activity.emoji || '🎯';

            const isOwner = Boolean(
              activity.isCreator || 
              (currentUserId && activity.creatorId && String(activity.creatorId) === String(currentUserId)) ||
              (currentUserId && (activity as any).creator_id && String((activity as any).creator_id) === String(currentUserId))
            );

            const otherMembers = (activity.memberPreview || [])
              .filter(m => String(m.id) !== String(activity.creatorId) && m.name !== activity.creator?.name)
              .slice(0, 4);

            return (
            <TouchableOpacity 
              key={activity.id} 
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => router.push({ pathname: '/activity-detail', params: { id: activity.id } })}
            >
              {/* 1. Top Activity Image (150–165px prominent) */}
              <View style={[styles.cardImage, { backgroundColor: hasValidImage ? '#f3f4f6' : defaultBgColor }]}>
                {hasValidImage && resolvedUri ? (
                  <Image 
                    source={{ uri: resolvedUri }} 
                    style={styles.cardImageInner} 
                    resizeMode="cover"
                    onError={() => {
                      setImageErrors(prev => ({ ...prev, [activity.id]: true }));
                    }}
                  />
                ) : (
                  <View style={styles.defaultPlaceholderContainer}>
                    <Text style={styles.emojiPlaceholder}>{defaultEmoji}</Text>
                  </View>
                )}

                {/* Owner Delete Menu (Floating on image) */}
                {isOwner ? (
                  <TouchableOpacity 
                    style={styles.moreMenuFloating}
                    onPress={(e) => {
                      (e as any)?.stopPropagation?.();
                      handleOpenDeleteDialog(activity);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Activity options"
                  >
                    <Feather name="more-vertical" size={18} color="#111827" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* 2. Information Section (Starts immediately below image) */}
              <View style={styles.cardContent}>
                {/* 3. Host Profile Picture & Joined Member Avatars Stack + Attendance */}
                <View style={styles.cardMetaRow}>
                  <View style={styles.creatorAttendanceGroup}>
                    <View style={styles.avatarStackContainer}>
                      {/* Host Avatar (Primary, 36px) */}
                      <View
                        style={[
                          styles.hostAvatar,
                          { backgroundColor: activity.creator?.color || '#A855F7', zIndex: 10 }
                        ]}
                      >
                        {activity.creator?.image ? (
                          <Image
                            source={{ uri: resolveImageUrl(activity.creator.image) }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <Text style={styles.hostAvatarText}>{activity.creator?.initial || 'U'}</Text>
                        )}
                      </View>

                      {/* Joined Members (Up to 4, 28px, overlapping, max 5 total circles) */}
                      {otherMembers.map((member, idx) => {
                        const memberImg = member.profileImage ? resolveImageUrl(member.profileImage) : null;
                        const memberInitial = member.name ? member.name.charAt(0).toUpperCase() : 'U';
                        const memberColor = AVATAR_COLORS[idx % AVATAR_COLORS.length] || '#6366F1';
                        return (
                          <View
                            key={member.id || `member-${idx}`}
                            style={[
                              styles.joinedAvatar,
                              { backgroundColor: memberColor, zIndex: 9 - idx }
                            ]}
                          >
                            {memberImg ? (
                              <Image source={{ uri: memberImg }} style={styles.avatarImg} />
                            ) : (
                              <Text style={styles.joinedAvatarText}>{memberInitial}</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    <Text style={styles.attendanceText}>
                      {activity.joined}/{activity.capacity} going
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.compactJoinButton, activity.isJoined && styles.compactJoinButtonActive]}
                    onPress={(e) => {
                      (e as any)?.stopPropagation?.();
                      handleToggleJoin(activity);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.compactJoinButtonText, activity.isJoined && styles.compactJoinButtonTextActive]}>
                      {activity.isJoined ? 'Joined ✓' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4. Activity Title (18px bold) */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {activity.title}
                </Text>

                {/* 5. Address (14px with map-pin icon) */}
                <View style={styles.compactInfoRow}>
                  <Feather name="map-pin" size={15} color="#6B7280" style={styles.compactInfoIcon} />
                  <Text style={styles.compactInfoText} numberOfLines={1}>
                    {activity.address || activity.location || 'Location'}
                  </Text>
                </View>

                {/* 6. Date and Time (14px with calendar icon) */}
                <View style={styles.compactInfoRow}>
                  <Feather name="calendar" size={15} color="#6B7280" style={styles.compactInfoIcon} />
                  <Text style={styles.compactInfoText} numberOfLines={1}>
                    {formatToNumericDate(activity.date)}{activity.time ? ` • ${activity.time}` : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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

      {/* Delete Confirmation Dialog */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingId) {
            setDeleteModalVisible(false);
            setActivityToDelete(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Feather name="trash-2" size={26} color="#EF4444" />
            </View>
            
            <Text style={styles.modalTitle}>Delete Activity?</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone.
            </Text>

            {activityToDelete && (
              <View style={styles.modalActivityPreview}>
                <Text style={styles.modalActivityTitle} numberOfLines={1}>
                  {activityToDelete.title}
                </Text>
                <Text style={styles.modalActivityMeta}>
                  {activityToDelete.category} • {activityToDelete.joined}/{activityToDelete.capacity} members
                </Text>
              </View>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setActivityToDelete(null);
                }}
                disabled={Boolean(deletingId)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                activeOpacity={0.8}
              >
                {deletingId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#EA580C',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  filterText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    height: 160,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardImageInner: {
    width: '100%',
    height: '100%',
  },
  defaultPlaceholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPlaceholder: {
    fontSize: 56,
  },
  moreMenuFloating: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorAttendanceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarStackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  joinedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  hostAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  joinedAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  compactJoinButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compactJoinButtonActive: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactJoinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  compactJoinButtonTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 8,
    lineHeight: 23,
  },
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  compactInfoIcon: {
    marginRight: 8,
  },
  compactInfoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 19,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActivityPreview: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 20,
  },
  modalActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modalActivityMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalDeleteButton: {
    backgroundColor: '#EF4444',
  },
  modalDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locatingContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locatingContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locatingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
});
