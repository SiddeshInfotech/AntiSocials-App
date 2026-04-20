import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const INTERESTS_LIST = [
  'Cycling', 'Cricket', 'Meditation & Mindfulness', 'Photography', 'Reading', 'Gym', 'Travel', 'Art & Design', 'Music', 'Cooking', 'Gaming', 'Technology'
];

export default function YourInterestsScreen() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set(['Cycling', 'Cricket', 'Meditation & Mindfulness']));

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

  const handleSave = () => {
    console.log("Interests updated", Array.from(selectedInterests));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Interests</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.helperText}>
            Select interests to help us recommend the best activities and connections for you.
          </Text>

          <View style={styles.pillsContainer}>
            {INTERESTS_LIST.map((interest, index) => {
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
