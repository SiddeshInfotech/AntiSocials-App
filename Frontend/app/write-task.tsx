import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function WriteTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fafafa" />
      
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity style={styles.backBtnLight} onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/tasks')}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
         <View style={styles.iconContainer}>
            <Text style={styles.heroEmoji}>✍️</Text>
         </View>

         <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>Day</Text>
         </View>

         <Text style={styles.mainTitle}>Write 1 word about how you feel</Text>
         <Text style={styles.subtitle}>Text input</Text>

         <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why this matters:</Text>
            <View style={styles.rewardRow}>
               <Feather name="check-circle" size={18} color="#a855f7" />
               <Text style={styles.rewardText}>Earn 300 points after completion</Text>
            </View>
         </View>

         <View style={{ flex: 1 }} />

         <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={() => router.push('/share-thoughts' as any)}>
            <LinearGradient
               colors={['#a855f7', '#3b82f6']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 0 }}
               style={styles.gradientBtn}
            >
               <Text style={styles.startText}>Start Task</Text>
            </LinearGradient>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  headerLight: {
    backgroundColor: '#fafafa',
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtnLight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6', 
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroEmoji: {
    fontSize: 100, 
  },
  dayPill: {
    backgroundColor: '#f3e8ff', 
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  dayPillText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#faf5ff', 
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e9d5ff', 
  },
  infoTitle: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: 10,
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 30, 
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradientBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
