import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const SPACING = 16;
const CARD_WIDTH = (width - (SPACING * 3)) / 2;

const CAUSES = [
  { id: 'older', title: 'Older People', emoji: '🧓' },
  { id: 'community', title: 'Community', emoji: '🤝' },
  { id: 'crisis', title: 'Crisis and Welfare', emoji: '🤲' },
  { id: 'animal', title: 'Animal Welfare', emoji: '🐶' },
  { id: 'art', title: 'Sport, Art and Culture', emoji: '🎨' },
  { id: 'youth', title: 'Young People and Children', emoji: '🧒' },
  { id: 'health', title: 'Health and Social Care', emoji: '🏥' },
  { id: 'environment', title: 'Sustainability, Heritage and Environment', emoji: '🌍' },
];

export default function VolunteerInterestScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Render smooth entry
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleNext = () => {
    if (selectedId) {
      router.push({ pathname: '/volunteer-task', params: { categoryId: selectedId } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Intensely Emotional Headings */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.mainTitle}>Ignite a Life with Kindness</Text>
          <Text style={styles.subtitle}>
            Your time is the most profoundly beautiful gift you can ever offer. Where will you shine your light today?
          </Text>
          
          <View style={styles.instructionBadge}>
            <Text style={styles.instructionText}>Select any one</Text>
          </View>
        </Animated.View>

        {/* 2-Column Responsive Grid Area */}
        <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
          {CAUSES.map((cause) => {
            const isSelected = selectedId === cause.id;

            return (
              <TouchableOpacity
                key={cause.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected // Exclusive highly-visible active state
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedId(cause.id)}
              >
                <Text style={styles.cardEmoji}>{cause.emoji}</Text>
                <Text style={[
                  styles.cardTitle,
                  isSelected && styles.cardTitleSelected
                ]}>
                  {cause.title}
                </Text>

                {/* Optional visual indicator mark natively in the card */}
                {isSelected && (
                    <View style={styles.checkIcon}>
                        <Feather name="check" size={14} color="#000" />
                    </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={{ height: 120 }} />

      </ScrollView>

      {/* Floating Sticky Layout Action Area */}
      <View style={styles.bottomArea}>
         <TouchableOpacity 
            style={[styles.properBtn, !selectedId && styles.properBtnDisabled]} 
            activeOpacity={0.9}
            disabled={!selectedId}
            onPress={handleNext}
         >
            <Text style={[styles.properBtnText, !selectedId && styles.properBtnTextDisabled]}>Start Task</Text>
            {selectedId && <Feather name="arrow-right" size={20} color="#000" style={{marginLeft: 10}}/>}
         </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131317' },
  
  header: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 5 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { paddingHorizontal: SPACING, paddingTop: 10 },
  
  mainTitle: { color: '#ffffff', fontSize: 34, fontWeight: '900', letterSpacing: 0.5, lineHeight: 42 },
  subtitle: { color: '#a1a1aa', fontSize: 16, lineHeight: 24, marginTop: 15, marginBottom: 25, fontWeight: '500' },
  
  instructionBadge: { 
      alignSelf: 'flex-start', backgroundColor: 'rgba(217, 252, 0, 0.15)', 
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 35,
      borderWidth: 1, borderColor: '#d9fc00'
  },
  instructionText: { color: '#d9fc00', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  grid: { 
      flexDirection: 'row', flexWrap: 'wrap', 
      justifyContent: 'space-between'
  },
  
  // Custom Rendered Impact Cards
  card: {
      width: CARD_WIDTH,
      backgroundColor: '#1b1b22',
      borderRadius: 24,
      padding: 20,
      marginBottom: SPACING,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#2d2d38',
      minHeight: 140,
  },
  cardSelected: {
      backgroundColor: 'rgba(217, 252, 0, 0.15)', // Neon glow selection
      borderColor: '#d9fc00',
      shadowColor: '#d9fc00',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 15,
      elevation: 5
  },
  
  checkIcon: {
      position: 'absolute', top: 10, right: 10,
      width: 22, height: 22, borderRadius: 11, backgroundColor: '#d9fc00',
      alignItems: 'center', justifyContent: 'center'
  },

  cardEmoji: { fontSize: 44, marginBottom: 15 },
  cardTitle: { color: '#e5e7eb', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  cardTitleSelected: { color: '#ffffff', fontWeight: '800' },
  
  // Fixed Bottom Button Module
  bottomArea: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20,
      backgroundColor: '#131317', 
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  
  properBtn: { 
      height: 65, width: '100%', backgroundColor: '#d9fc00', borderRadius: 20, 
      alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
      shadowColor: '#d9fc00', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {height: 4, width: 0}, elevation: 8
  },
  properBtnDisabled: {
      backgroundColor: '#272730', shadowOpacity: 0, elevation: 0
  },
  properBtnText: { color: '#000000', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  properBtnTextDisabled: { color: '#6b7280' }
});
