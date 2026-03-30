import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CallFriendTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, 
      duration: 600, 
      useNativeDriver: true
    }).start();
  }, []);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleComplete = () => {
    router.replace({ pathname: '/task-success', params: { points: '300' } } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fafafa" />
      
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity style={styles.backBtnLight} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks')}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
          
          <View style={styles.iconContainer}>
            <Text style={styles.heroEmoji}>📞</Text>
          </View>

          <View style={styles.dayPill}>
             <Text style={styles.dayPillText}>Light Reconnection</Text>
          </View>

          <Text style={styles.mainTitle}>{isActive ? "You're doing great" : "Call an old friend"}</Text>
          <Text style={styles.subtitle}>
            {isActive ? "Take your time. Enjoy the conversation." : "Reconnect with someone you haven't spoken to in a while."}
          </Text>

          {!isActive && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why this matters:</Text>
              <View style={styles.rewardRow}>
                <Feather name="check-circle" size={18} color="#a855f7" />
                <Text style={styles.rewardText}>Earn 300 points after completion</Text>
              </View>
            </View>
          )}

          {isActive && (
            <View style={styles.activeContentBox}>
              <View style={styles.promptsCard}>
                <View style={styles.promptsHeader}>
                  <Feather name="phone-call" size={18} color="#6A61FF" />
                  <Text style={styles.promptsTitle}>Conversation Starters</Text>
                </View>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>• "I was just thinking about you..."</Text>
                  <Text style={styles.bulletItem}>• "It's been a while, how are you?"</Text>
                  <Text style={styles.bulletItem}>• "I miss our chats..."</Text>
                </View>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {!isActive ? (
          <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
            <LinearGradient
               colors={['#a855f7', '#3b82f6']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 0 }}
               style={styles.gradientBtn}
            >
               <Text style={styles.startText}>Start Task</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.completeBtn} 
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>End Call & Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#a855f7',
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
    marginBottom: 20,
  },
  dayPillText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
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
  activeContentBox: { width: '100%', alignItems: 'center' },
  promptsCard: {
    backgroundColor: '#f5f3ff', width: '100%', borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#ede9fe', marginBottom: 20
  },
  promptsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  promptsTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginLeft: 10 },
  bulletList: { marginLeft: 5 },
  bulletItem: { fontSize: 13, color: '#4b5563', lineHeight: 22 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#fafafa',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
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
  },
  completeBtn: {
    backgroundColor: '#10b981', 
    width: '100%', 
    height: 56,
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  completeBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
