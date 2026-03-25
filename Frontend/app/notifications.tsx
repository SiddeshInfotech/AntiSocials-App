import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [newActivity, setNewActivity] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <View style={styles.settingCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Allow Push Notifications</Text>
                <Text style={styles.switchSubtitle}>Master toggle for all push notifications.</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={pushEnabled ? '#8B00FF' : '#F9FAFB'}
              />
            </View>

            {pushEnabled && (
              <>
                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>New Activities</Text>
                    <Text style={styles.switchSubtitle}>Get notified when an activity matching your interests is created.</Text>
                  </View>
                  <Switch
                    value={newActivity}
                    onValueChange={setNewActivity}
                    trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                    thumbColor={newActivity ? '#8B00FF' : '#F9FAFB'}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>Messages</Text>
                    <Text style={styles.switchSubtitle}>Alerts for direct messages and group chats.</Text>
                  </View>
                  <Switch
                    value={messages}
                    onValueChange={setMessages}
                    trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                    thumbColor={messages ? '#8B00FF' : '#F9FAFB'}
                  />
                </View>

                <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>Reminders</Text>
                    <Text style={styles.switchSubtitle}>Activity start times and daily streak reminders.</Text>
                  </View>
                  <Switch
                    value={reminders}
                    onValueChange={setReminders}
                    trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                    thumbColor={reminders ? '#8B00FF' : '#F9FAFB'}
                  />
                </View>
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>Email Notifications</Text>
          <View style={styles.settingCard}>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Weekly Digest</Text>
                <Text style={styles.switchSubtitle}>A summary of top activities and network updates.</Text>
              </View>
              <Switch
                value={emailDigest}
                onValueChange={setEmailDigest}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={emailDigest ? '#8B00FF' : '#F9FAFB'}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF'
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12, marginTop: 16 },
  settingCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 16, marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  switchTextContainer: { flex: 1, paddingRight: 16 },
  switchTitle: { fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 4 },
  switchSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});
