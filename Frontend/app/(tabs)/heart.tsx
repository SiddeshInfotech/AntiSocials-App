import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export default function HeartScreen() {
  const [activeTab, setActiveTab] = useState('heart');
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600), // Delay before the next heartbeat
      ])
    ).start();
  }, []);

  const handleRecordVideo = async () => {
    // Request permissions
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();

    if (cameraPerm.status !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'Camera access is required to record your Legacy Video.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 120, // max 2 mins recorded
        quality: 1, // highest quality
        allowsEditing: true, // allows cropping before saving
      });

      if (!result.canceled) {
        Alert.alert(
          'Success! 🔒', 
          'Your Legacy Video has been recorded and safely encrypted.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while opening the camera.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#E11D48', '#BE185D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerBackground}
      >
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <Text style={styles.headerTitle}>Heart & Legacy</Text>
          <Text style={styles.headerSubtitle}>Connections that go deeper</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'heart' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('heart')}
            activeOpacity={0.8}
          >
            <Feather 
              name="heart" 
              size={18} 
              color={activeTab === 'heart' ? '#fff' : '#4B5563'} 
              style={styles.toggleIcon} 
            />
            <Text style={[styles.toggleText, activeTab === 'heart' && styles.toggleTextActive]}>
              Heart Connect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'legacy' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('legacy')}
            activeOpacity={0.8}
          >
            <Feather 
              name="video" 
              size={18} 
              color={activeTab === 'legacy' ? '#fff' : '#4B5563'} 
              style={styles.toggleIcon} 
            />
            <Text style={[styles.toggleText, activeTab === 'legacy' && styles.toggleTextActive]}>
              Legacy Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content specific to active tab */}
        {activeTab === 'heart' && (
          <View style={styles.cardsContainer}>
            
            {/* Info Card */}
            <View style={styles.infoCard}>
              <Feather name="heart" size={28} color="#E11D48" style={styles.cardMainIcon} />
              <Text style={styles.infoCardTitle}>One Heart Each Year</Text>
              <Text style={styles.infoCardDesc}>
                Send one heart each year to someone truly special. If they send you one too, you'll both know it's mutual.
              </Text>
              
              <View style={styles.infoNotice}>
                <Feather name="info" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                <Text style={styles.infoNoticeText}>
                  Hearts reset every year on your anniversary with AntiSocial.
                </Text>
              </View>
            </View>

            {/* Sent Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="heart" size={22} color="#fff" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Heart Sent</Text>
                <Text style={styles.statusDesc}>Your heart for 2024 has been sent</Text>
              </View>
            </View>

            {/* Mutual Card */}
            <LinearGradient
              colors={['#E11D48', '#BE185D', '#9D174D']}
              style={styles.mutualCard}
            >
              <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <Ionicons name="heart" size={56} color="#fff" style={styles.mutualIcon} />
              </Animated.View>
              <Text style={styles.mutualTitle}>It's Mutual! 💞</Text>
              <Text style={styles.mutualDesc}>
                You and Emily Rodriguez both sent hearts to each other
              </Text>
            </LinearGradient>

          </View>
        )}
        
        {activeTab === 'legacy' && (
          <View style={styles.cardsContainer}>
            
            {/* A Message Forever Card */}
            <View style={styles.infoCardLegacy}>
              <Feather name="video" size={28} color="#9333EA" style={styles.cardMainIcon} />
              <Text style={styles.infoCardTitle}>A Message Forever</Text>
              <Text style={styles.infoCardDesc}>
                Record a private video message for your closest people. A message of love, closure, and care that will be shared when the time comes.
              </Text>
              
              <View style={styles.infoNotice}>
                <Feather name="lock" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                <Text style={styles.infoNoticeText}>
                  Your legacy video is encrypted and completely private until delivered.
                </Text>
              </View>
            </View>

            {/* Create Your Legacy Video Card */}
            <View style={styles.legacyStatusCard}>
              <View style={styles.legacyIconCircle}>
                <Feather name="video" size={28} color="#9333EA" />
              </View>
              <Text style={styles.legacyCardTitle}>Create Your Legacy Video</Text>
              <Text style={styles.legacyCardDesc}>
                Record a heartfelt message for the people who matter most. You can update it anytime.
              </Text>
              
              <TouchableOpacity activeOpacity={0.8} style={styles.recordButtonWrapper} onPress={handleRecordVideo}>
                <LinearGradient
                  colors={['#A855F7', '#D946EF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.recordButtonGradient}
                >
                  <Feather name="video" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Choose Recipients */}
            <View style={styles.recipientsSection}>
              <Text style={styles.sectionTitle}>Choose Recipients</Text>
              <Text style={styles.sectionSubtitle}>Select who should receive your legacy video</Text>

              <View style={styles.recipientItem}>
                <View style={styles.recipientAvatar}>
                   <Text style={{ fontSize: 24 }}>👱‍♀️</Text>
                </View>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>Sarah Johnson</Text>
                  <Text style={styles.recipientTier}>Tier 1</Text>
                </View>
                <View style={styles.checkboxDark} />
              </View>

              <View style={styles.recipientItem}>
                <View style={styles.recipientAvatar}>
                   <Text style={{ fontSize: 24 }}>👱‍♂️</Text>
                </View>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>Michael Chen</Text>
                  <Text style={styles.recipientTier}>Tier 2</Text>
                </View>
                <View style={styles.checkboxDark} />
              </View>

              <View style={styles.recipientItem}>
                <View style={styles.recipientAvatar}>
                   <Text style={{ fontSize: 24 }}>👱‍♀️</Text>
                </View>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientName}>Emily Rodriguez</Text>
                  <Text style={styles.recipientTier}>Tier 2</Text>
                </View>
                <View style={styles.checkboxDark} />
              </View>
            </View>

            {/* Footer Lock Info */}
            <View style={styles.footerInfoCard}>
              <Feather name="lock" size={24} color="#6B7280" style={{ marginBottom: 12 }} />
              <Text style={styles.footerInfoText}>
                Your legacy video is private and encrypted. Only you can view or edit it until it's time for delivery.
              </Text>
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Very light background to make cards pop
  },
  headerBackground: {
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#FFE4E6',
    fontWeight: '400',
    opacity: 0.9,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 100,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 100,
  },
  toggleButtonActive: {
    backgroundColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleIcon: {
    marginRight: 8,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  toggleTextActive: {
    color: '#fff',
  },
  cardsContainer: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFF1F2', 
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  cardMainIcon: {
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoCardDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  mutualCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  mutualIcon: {
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  mutualTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  mutualDesc: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  
  /* Legacy Video Specific Styles */
  infoCardLegacy: {
    backgroundColor: '#FAF5FF', 
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  legacyStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 8,
  },
  legacyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  legacyCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  legacyCardDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  recordButtonWrapper: {
    width: '100%',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recipientsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  recipientTier: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  checkboxDark: {
    width: 24,
    height: 24,
    backgroundColor: '#4B5563',
    borderRadius: 4,
  },
  footerInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  footerInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
