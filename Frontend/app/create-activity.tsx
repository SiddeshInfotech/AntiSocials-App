import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  "Sports & Fitness",
  "Music & Jamming",
  "Reading & Book Club",
  "Study Groups",
  "Tech & Coding",
  "Networking & Meetups",
  "Arts & Creativity",
  "Gaming",
  "Movies & Entertainment",
  "Food & Dining"
];
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import * as Location from 'expo-location';

import { API_BASE_URL, apiFetch } from '../constants/Api';
import * as SecureStore from 'expo-secure-store';

export default function CreateActivityScreen() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [suggestionCache, setSuggestionCache] = useState<Record<string, any[]>>({});
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [userCity, setUserCity] = useState('');
  const [locationFocused, setLocationFocused] = useState(false);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Location Required", "Please allow location permission to create activities.");
          return;
        }
        
        const providerStatus = await Location.getProviderStatusAsync();
        if (!providerStatus.locationServicesEnabled) {
          Alert.alert("Location Required", "Please enable GPS/location services to create activities.");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
        
        let reverseGeocode = await Location.reverseGeocodeAsync({ 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        });
        
        if (reverseGeocode.length > 0) {
          if (reverseGeocode[0].postalCode) setPincode(reverseGeocode[0].postalCode);
          if (reverseGeocode[0].city || reverseGeocode[0].subregion) {
             const foundCity = reverseGeocode[0].city || reverseGeocode[0].subregion || '';
             setCity(foundCity);
             setUserCity(foundCity);
          }
        }
      } catch (e: any) {
        console.log("Location fetch skipped/failed:", e.message || e);
        Alert.alert("Location Unavailable", "Please ensure your GPS is enabled and functioning.");
      }
    };
    fetchUserLocation();
  }, []);

  useEffect(() => {
    if (!location || location.length < 3 || selectedLocation?.name === location || selectedLocation?.display_name === location) {
      setLocationSuggestions([]);
      return;
    }

    if (suggestionCache[location]) {
      setLocationSuggestions(suggestionCache[location]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        let queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&addressdetails=1&limit=3`;
        if (userCity) {
          queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', ' + userCity)}&addressdetails=1&limit=3`;
        }
        
        const response = await fetch(queryUrl, {
          headers: { 'User-Agent': 'AntiSocialsApp/1.0' }
        });
        const data = await response.json();
        setSuggestionCache(prev => ({ ...prev, [location]: data }));
        setLocationSuggestions(data);
      } catch (error) {
        // Silently fail, do not block user
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [location, userCity, selectedLocation]);

  const handleSelectLocation = (item: any) => {
    const addr = item.address || {};
    const itemCity = addr.city || addr.town || addr.village || addr.county || '';
    
    setSelectedLocation(item);
    setLocation(item.name || item.display_name.split(',')[0]);
    if (!address) {
      setAddress(item.display_name || '');
    }
    setLatitude(parseFloat(item.lat));
    setLongitude(parseFloat(item.lon));
    
    if (addr.postcode) setPincode(addr.postcode);
    if (itemCity) setCity(itemCity);
    
    setLocationSuggestions([]);
    setLocationFocused(false);
  };

  const pickImage = async () => {
    console.log("📸 pickImage pressed");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("📸 permission result:", permission.status);
    
    if (permission.status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow gallery access to upload a cover image.');
      return;
    }

    try {
      console.log("📸 opening image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      console.log("📸 picker result:", result.canceled ? "canceled" : "selected");

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log("📸 selected file:", selectedUri);
        setImageUri(selectedUri);
      }
    } catch (error) {
      console.error("📸 picker error:", error);
      Alert.alert("Error", "Could not open image picker.");
    }
  };

  const uploadImageToServer = async (uri: string) => {
    try {
      console.log("🚀 uploading image to server:", uri);
      const filename = uri.split('/').pop() || 'activity.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type } as any);

      const response = await apiFetch('/upload', {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("🚀 upload failed:", data);
        return null;
      }
      console.log("🚀 upload success:", data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error("🚀 upload error:", error);
      return null;
    }
  };

  const handleCreate = async () => {
    if (!title || !category || !location || !address.trim() || !capacity) {
      Alert.alert("Missing Information", "Please fill in all required fields marked with * including Venue / Address.");
      return;
    }

    if (!pincode && (!latitude || !longitude)) {
      Alert.alert("Missing Location", "Please provide a pincode or allow location access.");
      return;
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      Alert.alert("Invalid Pincode", "Please enter a valid 6-digit Indian pincode.");
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');

      let uploadedImageUrl = null;
      if (imageUri) {
        uploadedImageUrl = await uploadImageToServer(imageUri);
        if (!uploadedImageUrl) {
          Alert.alert("Upload Error", "Failed to upload image. Continue without image?");
          // Option to return or continue
        }
      }

      const response = await apiFetch('/api/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          category,
          date,
          time,
          location,
          address: address.trim(),
          capacity: parseInt(capacity),
          description,
          image_url: uploadedImageUrl,
          emoji: imageUri ? null : '📅',
          pincode,
          city,
          latitude,
          longitude,
          location_name: location
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Activity created successfully!");
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to create activity");
      }
    } catch (error) {
      console.error("Create Activity Error:", error);
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Create Activity</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Image Placeholder */}
            <TouchableOpacity 
              style={[styles.imageUploadContainer, imageUri && { borderStyle: 'solid' }]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <View style={styles.changeImageOverlay}>
                    <Feather name="camera" size={20} color="#FFF" />
                    <Text style={styles.changeImageText}>Change Cover</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imageUploadContent}>
                  <Feather name="image" size={32} color="#9CA3AF" />
                  <Text style={styles.imageUploadText}>Add Cover Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Weekend Hiking Trip"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity 
                style={styles.dropdownSelector}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownText, !category && styles.placeholderText]}>
                  {category ? category : "Select Category"}
                </Text>
                <Feather name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 17/08/2026"
                  placeholderTextColor="#9CA3AF"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10:00 AM"
                  placeholderTextColor="#9CA3AF"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { zIndex: 1000 }]}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="map-pin" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder={userCity ? `e.g. Shivaji Garden, ${userCity}` : "e.g. Cafe Buddy"}
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={(text) => {
                    setLocation(text);
                    if (selectedLocation && text !== selectedLocation.name && text !== selectedLocation.display_name) {
                      setSelectedLocation(null);
                    }
                  }}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setTimeout(() => setLocationFocused(false), 200)}
                />
              </View>
              
              {locationFocused && locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {locationSuggestions.map((item, index) => (
                    <TouchableOpacity 
                      key={item.place_id || index} 
                      style={styles.suggestionItem}
                      onPress={() => handleSelectLocation(item)}
                    >
                      <Feather name="map-pin" size={16} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue / Full Address *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="map" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="e.g. Court 3, Sports Complex, MG Road"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode (Indian) {(!latitude || !longitude) ? '*' : ''}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 440001"
                placeholderTextColor="#9CA3AF"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Nagpur"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Capacity *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="users" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="e.g. 15"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={capacity}
                  onChangeText={setCapacity}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="What is this activity about?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.createButton, (!title || !category || !location || !address.trim() || !capacity || (!pincode && (!latitude || !longitude)) || loading) && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Publishing...' : 'Publish Activity'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isCategoryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.closeModalButton}>
                  <Feather name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      category === item && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setCategory(item);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      category === item && styles.categoryOptionTextSelected
                    ]}>
                      {item}
                    </Text>
                    {category === item && (
                      <Feather name="check" size={20} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>

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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  imageUploadContainer: {
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden', // Add this
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  changeImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageUploadContent: {
    alignItems: 'center',
  },
  imageUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  row: {
    flexDirection: 'row',
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
  inputIcon: {
    marginRight: 10,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'flex-start',
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#FDBA74', // Lighter orange when roughly invalid
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeModalButton: {
    padding: 4,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#EA580C',
    fontWeight: '600',
  },
});

