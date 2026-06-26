import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

const INTERESTS_LIST = [
  'Sports & Fitness', 'Music & Jamming', 'Reading & Book Club', 'Study Groups',
  'Tech & Coding', 'Networking & Meetups', 'Cycling', 'Cricket',
  'Meditation & Mindfulness', 'Photography', 'Art & Design', 'Gaming', 'Cooking'
];

export default function YourInterestsScreen() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    const fetchInterests = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/profile/interests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const interestsArray = data.interests || (Array.isArray(data) ? data : []);
          
          // Normalize to match EXACT case of INTERESTS_LIST, or keep custom interest
          const normalizedInterests = interestsArray.map((savedInterest: string) => {
            const exactMatch = INTERESTS_LIST.find(
              (item) => item.toLowerCase() === savedInterest.toLowerCase().trim()
            );
            return exactMatch || savedInterest.trim();
          });

          setSelectedInterests(new Set(normalizedInterests));
        }
      } catch (err) {
        console.error("Error fetching interests:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterests();
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interest)) {
        newSet.delete(interest);
      } else {
        newSet.add(interest);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedInterests.size === 0) {
      Alert.alert("Error", "Please select at least one interest.");
      return;
    }

    setIsSaving(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/api/profile/interests`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interests: Array.from(selectedInterests) })
      });

      if (response.ok) {
        console.log("Interests updated");
        router.back();
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to update interests");
      }
    } catch (err) {
      console.error("Error updating interests:", err);
      Alert.alert("Error", "Network error while saving interests.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B00FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Interests</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButtonText, isSaving && { opacity: 0.5 }]}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.helperText}>
            Select interests to help us recommend the best activities and connections for you.
          </Text>

          <View style={styles.pillsContainer}>
            {Array.from(new Set([...INTERESTS_LIST, ...Array.from(selectedInterests)])).map((interest, index) => {
              const isSelected = selectedInterests.has(interest);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.interestPill, isSelected && styles.interestPillSelected]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.interestPillText, isSelected && styles.interestPillTextSelected]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  saveButtonText: { color: '#8B00FF', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20 },
  helperText: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  interestPill: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    marginRight: 12, marginBottom: 12,
  },
  interestPillSelected: {
    backgroundColor: '#FAF5FF', borderColor: '#C084FC',
  },
  interestPillText: {
    color: '#4B5563', fontSize: 15,
  },
  interestPillTextSelected: {
    color: '#9333EA', fontWeight: '500',
  },
});

