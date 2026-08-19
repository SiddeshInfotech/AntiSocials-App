import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { resolveImageUrl } from '../constants/ImageUtils';
import { apiFetch } from '../constants/Api';

interface MemberPreview {
  id: string;
  name: string;
  profileImage: string | null;
}

interface OwnerFeedback {
  rating: number | null;
  participationRating: number | null;
  feedback: string;
  timestamp: string | null;
}

interface ActivityDetails {
  id: string;
  creatorId?: string;
  creator_id?: string;
  isCreator?: boolean;
  category: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  locationName?: string;
  address?: string;
  pincode?: string;
  city?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  joined: number;
  capacity: number;
  isJoined: boolean;
  status: 'upcoming' | 'completed';
  isCompleted: boolean;
  creator: {
    name: string;
    initial: string;
    color: string;
    image?: string | null;
  };
  imageColor?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  emoji?: string;
  memberPreview?: MemberPreview[];
  ownerFeedback?: OwnerFeedback | null;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Sports & Fitness': '#FF5722',
  'Music & Jamming': '#E91E63',
  'Reading & Book Club': '#9C27B0',
  'Study Groups': '#3F51B5',
  'Tech & Coding': '#00BCD4',
  'Networking & Meetups': '#4CAF50',
  'Arts & Creativity': '#FF9800',
  Gaming: '#795548',
  'Movies & Entertainment': '#607D8B',
  'Food & Dining': '#E64A19',
};

const CATEGORY_EMOJIS: { [key: string]: string } = {
  'Sports & Fitness': '⚽',
  'Music & Jamming': '🎸',
  'Reading & Book Club': '📚',
  'Study Groups': '📖',
  'Tech & Coding': '💻',
  'Networking & Meetups': '🤝',
  'Arts & Creativity': '🎨',
  Gaming: '🎮',
  'Movies & Entertainment': '🎬',
  'Food & Dining': '🍕',
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
  dec: '12', december: '12',
};

const formatToNumericDate = (rawDate?: string): string => {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (!trimmed) return '';

  const dmySlashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlashMatch) {
    const [, d, m, y] = dmySlashMatch;
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    }
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const dmyDashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDashMatch) {
    const [, d, m, y] = dmyDashMatch;
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
    }
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  const currentYear = new Date().getFullYear();
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

const formatFeedbackTimestamp = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' at ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
};

export default function ActivityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback modal state
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackParticipationRating, setFeedbackParticipationRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchActivity = async () => {
    if (!activityId) return;
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && !currentUserId) {
        const meRes = await apiFetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData?.id) setCurrentUserId(meData.id.toString());
        }
      }

      const res = await apiFetch(`/api/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setActivity(data);
        if (data.ownerFeedback) {
          setFeedbackRating(data.ownerFeedback.rating || 5);
          setFeedbackParticipationRating(data.ownerFeedback.participationRating || 5);
          setFeedbackText(data.ownerFeedback.feedback || '');
        }
      } else {
        Alert.alert('Error', 'Activity could not be found or has been removed.');
        router.back();
      }
    } catch (err) {
      console.error('Error fetching activity details:', err);
      Alert.alert('Error', 'Failed to load activity details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [activityId]);

  const handleToggleJoin = async () => {
    if (!activity) return;
    try {
      setActionLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const isJoining = !activity.isJoined;
      const method = isJoining ? 'POST' : 'DELETE';
      const endpoint = isJoining ? 'join' : 'leave';

      const response = await apiFetch(`/api/activities/${activity.id}/${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const resData = await response.json();
        setActivity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isJoined: isJoining,
            joined: resData.joined !== undefined ? resData.joined : (isJoining ? prev.joined + 1 : Math.max(0, prev.joined - 1)),
            memberPreview: resData.memberPreview !== undefined ? resData.memberPreview : prev.memberPreview,
          };
        });
      } else {
        const data = await response.json();
        Alert.alert('Unable to proceed', data.error || 'Failed to update activity status');
      }
    } catch (error) {
      console.error('Error toggling join in details:', error);
      Alert.alert('Network Error', 'Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activity) return;
    try {
      setDeleting(true);
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch(`/api/activities/${activity.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDeleteModalVisible(false);
        Alert.alert('Deleted', 'Activity has been deleted successfully.');
        router.back();
      } else {
        const data = await response.json().catch(() => ({}));
        Alert.alert('Error', data.error || 'Failed to delete activity.');
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      Alert.alert('Error', 'Network error while deleting activity.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenFeedbackModal = () => {
    if (activity?.ownerFeedback) {
      setFeedbackRating(activity.ownerFeedback.rating || 5);
      setFeedbackParticipationRating(activity.ownerFeedback.participationRating || 5);
      setFeedbackText(activity.ownerFeedback.feedback || '');
    } else {
      setFeedbackRating(5);
      setFeedbackParticipationRating(5);
      setFeedbackText('');
    }
    setFeedbackModalVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!activity) return;
    try {
      setSubmittingFeedback(true);
      const token = await SecureStore.getItemAsync('token');
      const response = await apiFetch(`/api/activities/${activity.id}/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          participationRating: feedbackParticipationRating,
          feedback: feedbackText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'completed',
            isCompleted: true,
            ownerFeedback: data.ownerFeedback,
          };
        });
        setFeedbackModalVisible(false);
        Alert.alert('Feedback Saved', 'Your owner feedback has been submitted successfully!');
      } else {
        const data = await response.json().catch(() => ({}));
        Alert.alert('Error', data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      Alert.alert('Error', 'Network error while submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingText}>Loading activity details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Activity Not Found</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonLargeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  const hasValidImage = !isImageInvalid && !imageError;
  const resolvedUri = hasValidImage ? resolveImageUrl(rawImageUrl) : null;
  const defaultBgColor = CATEGORY_COLORS[activity.category] || activity.imageColor || '#EA580C';
  const defaultEmoji = CATEGORY_EMOJIS[activity.category] || activity.emoji || '🎯';

  const isOwner = Boolean(
    activity.isCreator ||
    (currentUserId && activity.creatorId && String(activity.creatorId) === String(currentUserId)) ||
    (currentUserId && activity.creator_id && String(activity.creator_id) === String(currentUserId))
  );

  const isCompleted = activity.isCompleted || activity.status === 'completed';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navIconButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Activity Details
        </Text>

        {isOwner ? (
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => setDeleteModalVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Delete activity"
          >
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchActivity();
            }}
          />
        }
      >
        {/* Hero Image Banner */}
        <View style={[styles.heroBanner, { backgroundColor: hasValidImage ? '#F3F4F6' : defaultBgColor }]}>
          {hasValidImage && resolvedUri ? (
            <Image
              source={{ uri: resolvedUri }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>{defaultEmoji}</Text>
            </View>
          )}

          {/* Floating Category Pill */}
          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText}>{activity.category}</Text>
          </View>

          {/* Floating Status Badge */}
          <View style={[styles.heroStatusBadge, isCompleted ? styles.statusCompleted : styles.statusUpcoming]}>
            <Feather
              name={isCompleted ? 'check-circle' : 'clock'}
              size={12}
              color={isCompleted ? '#6366F1' : '#059669'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.heroStatusText, isCompleted ? styles.textCompleted : styles.textUpcoming]}>
              {isCompleted ? 'Completed' : 'Upcoming'}
            </Text>
          </View>
        </View>

        <View style={styles.contentBody}>
          {/* Activity Title */}
          <Text style={styles.activityTitle}>{activity.title}</Text>

          {/* Host / Creator Card */}
          <View style={styles.creatorCard}>
            <View style={[styles.creatorAvatar, { backgroundColor: activity.creator.color || '#A855F7' }]}>
              {activity.creator.image ? (
                <Image source={{ uri: resolveImageUrl(activity.creator.image) }} style={styles.creatorAvatarImg} />
              ) : (
                <Text style={styles.creatorAvatarText}>{activity.creator.initial}</Text>
              )}
            </View>
            <View style={styles.creatorInfo}>
              <View style={styles.creatorHeaderRow}>
                <Text style={styles.creatorLabel}>Hosted by</Text>
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <Text style={styles.ownerBadgeText}>You (Host)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.creatorName}>{activity.creator.name}</Text>
            </View>
          </View>

          {/* Key Info Details Grid */}
          <View style={styles.detailsCard}>
            {/* Date */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="calendar" size={18} color="#2563EB" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatToNumericDate(activity.date)}</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Time */}
            {activity.time ? (
              <>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconBox, { backgroundColor: '#FDF2F8' }]}>
                    <Feather name="clock" size={18} color="#DB2777" />
                  </View>
                  <View style={styles.detailTextCol}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{activity.time}</Text>
                  </View>
                </View>
                <View style={styles.rowDivider} />
              </>
            ) : null}

            {/* Location & Address */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Feather name="map-pin" size={18} color="#D97706" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Location & Venue</Text>
                <Text style={styles.detailValue}>{activity.location}</Text>
                {activity.address ? (
                  <Text style={styles.detailAddressText}>{activity.address}</Text>
                ) : null}
                {(activity.city || activity.pincode || activity.distance) && (
                  <Text style={styles.detailSubValue}>
                    {activity.city ? `${activity.city}` : ''}
                    {activity.distance ? ` • ${activity.distance.toFixed(1)} km away` : (activity.pincode ? ` • ${activity.pincode}` : '')}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Capacity & Joined */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="users" size={18} color="#059669" />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>Capacity & Attendance</Text>
                <Text style={styles.detailValue}>
                  {activity.joined} of {activity.capacity} spots joined
                </Text>
                <Text style={styles.detailSubValue}>
                  {Math.max(0, activity.capacity - activity.joined)} spots available
                </Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          {activity.description ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>About this Activity</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{activity.description}</Text>
              </View>
            </View>
          ) : null}

          {/* Joined Members Preview */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Joined Members ({activity.joined})
              </Text>
            </View>

            {activity.memberPreview && activity.memberPreview.length > 0 ? (
              <View style={styles.memberChipsContainer}>
                {activity.memberPreview.map((member, idx) => {
                  const avatarUri = resolveImageUrl(member.profileImage);
                  return (
                    <View key={member.id || `member-${idx}`} style={styles.memberChip}>
                      <Image source={{ uri: avatarUri }} style={styles.memberChipAvatar} />
                      <Text style={styles.memberChipName} numberOfLines={1}>
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
            ) : (
              <View style={styles.emptyMembersBox}>
                <Feather name="user-plus" size={24} color="#9CA3AF" />
                <Text style={styles.emptyMembersText}>No other members have joined yet.</Text>
              </View>
            )}
          </View>

          {/* ========================================================================= */}
          {/* SECTION: FEEDBACK BY OWNER */}
          {/* ========================================================================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.feedbackHeaderRow}>
              <View style={styles.feedbackTitleWithIcon}>
                <Feather name="star" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitleWithMargin}>Feedback by Owner</Text>
              </View>
              {isCompleted && isOwner && activity.ownerFeedback && (
                <TouchableOpacity onPress={handleOpenFeedbackModal} style={styles.editFeedbackLink}>
                  <Feather name="edit-2" size={14} color="#EA580C" style={{ marginRight: 4 }} />
                  <Text style={styles.editFeedbackLinkText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* STATE 1: Activity is upcoming */}
            {!isCompleted && (
              <View style={styles.upcomingFeedbackBox}>
                <Feather name="info" size={20} color="#3B82F6" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.upcomingFeedbackTitle}>Activity Not Yet Completed</Text>
                  <Text style={styles.upcomingFeedbackText}>
                    The host will be able to share their review and event highlights after the activity date has passed.
                  </Text>
                </View>
              </View>
            )}

            {/* STATE 2: Completed, feedback has been submitted */}
            {isCompleted && activity.ownerFeedback && (
              <View style={styles.feedbackCard}>
                {/* Header with Ratings */}
                <View style={styles.feedbackCardTop}>
                  <View style={styles.starRatingRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Feather
                        key={star}
                        name="star"
                        size={20}
                        color={star <= (activity.ownerFeedback?.rating || 0) ? '#F59E0B' : '#E5E7EB'}
                        style={star <= (activity.ownerFeedback?.rating || 0) ? styles.starFilled : undefined}
                      />
                    ))}
                    <Text style={styles.ratingScoreText}>
                      {Number(activity.ownerFeedback.rating || 0).toFixed(1)} / 5.0
                    </Text>
                  </View>

                  {activity.ownerFeedback.participationRating ? (
                    <View style={styles.participationBadge}>
                      <Text style={styles.participationBadgeText}>
                        Turnout: {activity.ownerFeedback.participationRating}/5 ⭐
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Feedback Written Comment */}
                {activity.ownerFeedback.feedback ? (
                  <View style={styles.feedbackQuoteBox}>
                    <Text style={styles.feedbackQuoteText}>
                      "{activity.ownerFeedback.feedback}"
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.feedbackEmptyText}>Host gave a {activity.ownerFeedback.rating}★ rating.</Text>
                )}

                {/* Footer Timestamp */}
                <View style={styles.feedbackFooter}>
                  <View style={styles.feedbackHostInfo}>
                    <View style={[styles.feedbackHostAvatar, { backgroundColor: activity.creator.color || '#A855F7' }]}>
                      <Text style={styles.feedbackHostAvatarText}>{activity.creator.initial}</Text>
                    </View>
                    <Text style={styles.feedbackHostName}>
                      {activity.creator.name} (Host)
                    </Text>
                  </View>
                  {activity.ownerFeedback.timestamp && (
                    <Text style={styles.feedbackTimestampText}>
                      {formatFeedbackTimestamp(activity.ownerFeedback.timestamp)}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* STATE 3: Completed, no feedback yet, user is Owner */}
            {isCompleted && !activity.ownerFeedback && isOwner && (
              <View style={styles.giveFeedbackPromptCard}>
                <View style={styles.giveFeedbackPromptIcon}>
                  <Feather name="award" size={28} color="#EA580C" />
                </View>
                <Text style={styles.giveFeedbackPromptTitle}>How did the activity go?</Text>
                <Text style={styles.giveFeedbackPromptDesc}>
                  As the activity creator, share your experience, member participation, and highlights with the community.
                </Text>
                <TouchableOpacity
                  style={styles.giveFeedbackButton}
                  onPress={handleOpenFeedbackModal}
                  activeOpacity={0.85}
                >
                  <Feather name="star" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.giveFeedbackButtonText}>Give Host Feedback</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STATE 4: Completed, no feedback yet, user is NOT Owner */}
            {isCompleted && !activity.ownerFeedback && !isOwner && (
              <View style={styles.noFeedbackYetBox}>
                <Feather name="message-square" size={22} color="#9CA3AF" />
                <Text style={styles.noFeedbackYetText}>
                  The host has not posted feedback for this completed activity yet.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {!isCompleted ? (
          <TouchableOpacity
            style={[styles.bottomActionButton, activity.isJoined && styles.bottomActionJoined]}
            onPress={handleToggleJoin}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather
                  name={activity.isJoined ? 'check-circle' : 'user-plus'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.bottomActionButtonText}>
                  {activity.isJoined ? 'Joined ✓ (Tap to Leave)' : 'Join Community Activity'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : isOwner && !activity.ownerFeedback ? (
          <TouchableOpacity
            style={[styles.bottomActionButton, { backgroundColor: '#EA580C' }]}
            onPress={handleOpenFeedbackModal}
            activeOpacity={0.85}
          >
            <Feather name="star" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.bottomActionButtonText}>Give Owner Feedback</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedStatusBanner}>
            <Feather name="check-circle" size={18} color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={styles.completedStatusBannerText}>This activity has concluded</Text>
          </View>
        )}
      </View>

      {/* ========================================================================= */}
      {/* OWNER FEEDBACK MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submittingFeedback) setFeedbackModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalFeedbackSheet}>
            {/* Modal Header */}
            <View style={styles.modalFeedbackHeader}>
              <View style={styles.feedbackModalIconWrap}>
                <Feather name="star" size={22} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalFeedbackTitle}>Activity Host Feedback</Text>
                <Text style={styles.modalFeedbackSubtitle}>Share your review of how the event went</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFeedbackModalVisible(false)}
                disabled={submittingFeedback}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Overall Rating (1–5 Stars) */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.inputGroupLabel}>Overall Event Rating</Text>
                <View style={styles.interactiveStarsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFeedbackRating(star)}
                      style={styles.starTouchable}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name="star"
                        size={32}
                        color={star <= feedbackRating ? '#F59E0B' : '#D1D5DB'}
                        style={star <= feedbackRating ? styles.starFilled : undefined}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.starRatingHint}>
                  {feedbackRating === 5 && '⭐️ Excellent Experience'}
                  {feedbackRating === 4 && '⭐️ Very Good'}
                  {feedbackRating === 3 && '⭐️ Good / Average'}
                  {feedbackRating === 2 && '⭐️ Fair'}
                  {feedbackRating === 1 && '⭐️ Poor'}
                </Text>
              </View>

              {/* Participation & Turnout Rating */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.inputGroupLabel}>Member Turnout & Participation</Text>
                <View style={styles.participationScaleRow}>
                  {[1, 2, 3, 4, 5].map(val => {
                    const isSelected = feedbackParticipationRating === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[styles.scalePill, isSelected && styles.scalePillActive]}
                        onPress={() => setFeedbackParticipationRating(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.scalePillText, isSelected && styles.scalePillTextActive]}>
                          {val} ★
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Written Feedback Input */}
              <View style={styles.feedbackInputGroup}>
                <Text style={styles.inputGroupLabel}>Written Feedback & Highlights</Text>
                <TextInput
                  style={styles.feedbackTextInput}
                  placeholder="How was the turnout, energy, location, and overall group vibe?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  maxLength={500}
                />
                <Text style={styles.charCountText}>{feedbackText.length}/500</Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setFeedbackModalVisible(false)}
                disabled={submittingFeedback}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmitFeedback}
                disabled={submittingFeedback}
                activeOpacity={0.85}
              >
                {submittingFeedback ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalIconBox}>
              <Feather name="trash-2" size={26} color="#EF4444" />
            </View>

            <Text style={styles.deleteModalTitle}>Delete Activity?</Text>
            <Text style={styles.deleteModalMessage}>
              This action cannot be undone and will permanently remove this activity.
            </Text>

            <View style={styles.deleteModalButtonRow}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalCancelBtn]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalConfirmBtn]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 20,
  },
  backButtonLarge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonLargeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  heroBanner: {
    width: '100%',
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 72,
  },
  heroCategoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusUpcoming: {
    backgroundColor: '#ECFDF5',
  },
  statusCompleted: {
    backgroundColor: '#EEF2FF',
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textUpcoming: {
    color: '#059669',
  },
  textCompleted: {
    color: '#6366F1',
  },
  contentBody: {
    padding: 20,
  },
  activityTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 16,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 18,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  creatorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  creatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  creatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  ownerBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  detailAddressText: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 3,
    lineHeight: 18,
  },
  detailSubValue: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  descriptionBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  memberChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberChipAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  memberChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    maxWidth: 100,
  },
  moreMembersBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    justifyContent: 'center',
  },
  moreMembersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyMembersBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  // Feedback Section Styles
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleWithMargin: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  editFeedbackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editFeedbackLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  upcomingFeedbackBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  upcomingFeedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  upcomingFeedbackText: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 18,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  feedbackCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starFilled: {
    // optional shadow or emphasis
  },
  ratingScoreText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  participationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  feedbackQuoteBox: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginBottom: 14,
  },
  feedbackQuoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 20,
  },
  feedbackEmptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feedbackHostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackHostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  feedbackHostAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackHostName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackTimestampText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  giveFeedbackPromptCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  giveFeedbackPromptIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  giveFeedbackPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 6,
  },
  giveFeedbackPromptDesc: {
    fontSize: 13,
    color: '#C2410C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  giveFeedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  giveFeedbackButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  noFeedbackYetBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  noFeedbackYetText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  // Bottom Sticky Bar
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 14,
  },
  bottomActionJoined: {
    backgroundColor: '#10B981',
  },
  bottomActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  completedStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 14,
  },
  completedStatusBannerText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 15,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalFeedbackSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackModalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFeedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalFeedbackSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 6,
  },
  feedbackInputGroup: {
    marginBottom: 18,
  },
  inputGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  starTouchable: {
    padding: 2,
  },
  starRatingHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 4,
  },
  participationScaleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scalePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scalePillActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  scalePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  scalePillTextActive: {
    color: '#FFFFFF',
  },
  feedbackTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  charCountText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSubmitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Delete Modal
  deleteModalContainer: {
    margin: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  deleteModalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteModalCancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  deleteModalConfirmBtn: {
    backgroundColor: '#EF4444',
  },
  deleteModalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
