import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Switch, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

export default function EditProfileScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [profession, setProfession] = useState('');
  const [about, setAbout] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');
        const token = await SecureStore.getItemAsync('token');
        
        if (!userId || !token) {
          router.replace('/' as any);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          setProfession(data.profession || '');
          setAbout(data.about || '');
          setProfileImage(data.image_url || null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission to access camera is required!");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert("Permission to access gallery is required!");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      }

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error taking picture: ", error);
      Alert.alert("Error", "Something went wrong while choosing an image.");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Gallery", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      const token = await SecureStore.getItemAsync('token');

      const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          profession,
          about,
          image_url: profileImage
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      Alert.alert("Error", "Unable to connect to the server.");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color="#8B00FF" /> : <Text style={styles.saveButtonText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>

            {/* Avatar Edit */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={showImageOptions} style={styles.avatarPlaceholderContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Feather name="user" size={40} color="#4B2488" />
                  </View>
                )}
                <View style={styles.editAvatarBadge}>
                  <Feather name="camera" size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={showImageOptions}>
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Basic Info */}
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.prefixText}>@</Text>
                <TextInput
                  style={styles.inputInner}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title or Role</Text>
              <TextInput
                style={styles.input}
                value={profession}
                onChangeText={setProfession}
                placeholder="What do you do?"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={about}
                onChangeText={setAbout}
                placeholder="Write a short bio about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={150}
              />
              <Text style={styles.charCount}>{about.length}/150</Text>
            </View>

            {/* Privacy & Settings */}
            <Text style={styles.sectionTitle}>Privacy & Preferences</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Private Account</Text>
                <Text style={styles.switchSubtitle}>Only verified connections can see your activity.</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={isPrivate ? '#8B00FF' : '#F9FAFB'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

            <View style={[styles.switchRow, { borderBottomWidth: 0, marginBottom: 40 }]}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>Email Notifications</Text>
                <Text style={styles.switchSubtitle}>Receive updates about joined activities.</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                thumbColor={emailNotifications ? '#8B00FF' : '#F9FAFB'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButtonText: {
    color: '#8B00FF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatarPlaceholderContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FAF5FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B00FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoText: {
    color: '#8B00FF',
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  prefixText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginRight: 4,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

