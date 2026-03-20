import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Activity {
  id: string;
  category: string;
  title: string;
  date: string;
  location: string;
  joined: number;
  capacity: number;
  creator: {
    name: string;
    initial: string;
    color: string;
  };
  imageColor: string;
  emoji: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    category: 'Photography',
    title: 'Photography Walk',
    date: 'Sunday, Dec 22 • 9:00 AM',
    location: 'Old Town District • 1.5 km away',
    joined: 8,
    capacity: 15,
    creator: {
      name: 'Michael Chen',
      initial: 'M',
      color: '#A855F7', // Purple avatar
    },
    imageColor: '#EA580C', // Orange
    emoji: '📸',
  },
  {
    id: '2',
    category: 'Yoga & Wellness',
    title: 'Morning Park Yoga',
    date: 'Monday, Dec 23 • 7:00 AM',
    location: 'Riverside Park • 3.2 km away',
    joined: 12,
    capacity: 20,
    creator: {
      name: 'Emma Wilson',
      initial: 'E',
      color: '#3B82F6', // Blue avatar
    },
    imageColor: '#EA580C', // Orange
    emoji: '🧘‍♂️',
  },
  {
    id: '3',
    category: 'Book Reading',
    title: 'Book Club Meetup',
    date: 'Wednesday, Dec 25 • 6:00 PM',
    location: 'Cozy Café • 0.8 km away',
    joined: 6,
    capacity: 10,
    creator: {
      name: 'David Kim',
      initial: 'D',
      color: '#A855F7', // Purple avatar
    },
    imageColor: '#EA580C', // Orange
    emoji: '📚',
  },
  {
    id: '4',
    category: 'Running & Walking',
    title: 'Trail Running Group',
    date: 'Saturday, Dec 28 • 6:30 AM',
    location: 'Mountain Trail • 5.2 km away',
    joined: 10,
    capacity: 15,
    creator: {
      name: 'Lisa Anderson',
      initial: 'L',
      color: '#A855F7', // Purple avatar
    },
    imageColor: '#EA580C', // Orange
    emoji: '🏃‍♂️',
  },
];

export default function ActivitiesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
  const [joinedActivities, setJoinedActivities] = useState<Set<string>>(new Set());

  const handleToggleJoin = (id: string) => {
    setJoinedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const displayedActivities = activeTab === 'joined' 
    ? MOCK_ACTIVITIES.filter(a => joinedActivities.has(a.id))
    : MOCK_ACTIVITIES;

  return (
    <SafeAreaView style={styles.safeArea}>
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
              Joined ({joinedActivities.size})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={16} color="#4B5563" />
          <Text style={styles.filterText}>Filter by interests</Text>
        </TouchableOpacity>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {displayedActivities.length === 0 && activeTab === 'joined' ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>You haven't joined any activities yet.</Text>
              <TouchableOpacity onPress={() => setActiveTab('discover')} style={styles.discoverButton}>
                 <Text style={styles.discoverButtonText}>Discover Activities</Text>
              </TouchableOpacity>
            </View>
          ) : displayedActivities.map((activity) => {
            const isJoined = joinedActivities.has(activity.id);
            return (
            <View key={activity.id} style={styles.card}>
              {/* Card Image Placeholder */}
              <View style={[styles.cardImage, { backgroundColor: activity.imageColor }]}>
                {/* Normally an image goes here, we'll use an emoji as a placeholder matching the design */}
                <Text style={styles.emojiPlaceholder}>{activity.emoji}</Text>
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
                    <Text style={styles.detailText}>{activity.date}</Text>
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
                    style={[styles.joinButton, isJoined && styles.joinButtonActive]}
                    onPress={() => handleToggleJoin(activity.id)}
                  >
                    <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonTextActive]}>
                      {isJoined ? 'Joined ✓' : 'Join'}
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
