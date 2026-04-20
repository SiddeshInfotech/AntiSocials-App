import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacySettingsScreen() {
  const router = useRouter();

  const [privateAccount, setPrivateAccount] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [allowTags, setAllowTags] = useState(true);

  const handleSave = () => {
    // Save logic
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          <Text style={styles.sectionTitle}>Account Privacy</Text>
          <View style={styles.settingCard}>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Private Account</Text>
                <Text style={styles.switchSubtitle}>When your account is private, only people you approve can see your profile and activities.</Text>
              </View>
              <Switch
                value={privateAccount}
                onValueChange={setPrivateAccount}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={privateAccount ? '#8B00FF' : '#F9FAFB'}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Data & Permissions</Text>
          <View style={styles.settingCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Share Location</Text>
                <Text style={styles.switchSubtitle}>Allow AntiSocial to use your location to find nearby activities.</Text>
              </View>
              <Switch
                value={showLocation}
                onValueChange={setShowLocation}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={showLocation ? '#8B00FF' : '#F9FAFB'}
              />
            </View>

            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Allow Tagging</Text>
                <Text style={styles.switchSubtitle}>Let connections tag you in activity photos and posts.</Text>
              </View>
              <Switch
                value={allowTags}
                onValueChange={setAllowTags}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={allowTags ? '#8B00FF' : '#F9FAFB'}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <TouchableOpacity style={styles.navigationRow}>
            <Text style={styles.navigationText}>Manage blocked accounts</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

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
  navigationRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 16,
  },
  navigationText: { fontSize: 16, color: '#111827' },
});

