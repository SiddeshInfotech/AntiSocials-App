import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, Pressable } from 'react-native';
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

export default function CreateActivityScreen() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const handleCreate = () => {
    // Basic validation
    if (!title || !category || !location) {
      alert("Please fill in the required fields");
      return;
    }

    // Usually you'd dispatch this to a state management store or API here
    // For now, we'll just navigate back
    console.log("Activity created!", { title, category, date, time, location, capacity });
    router.back();
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
            <TouchableOpacity style={styles.imageUploadContainer}>
              <View style={styles.imageUploadContent}>
                <Feather name="image" size={32} color="#9CA3AF" />
                <Text style={styles.imageUploadText}>Add Cover Image</Text>
              </View>
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
                  placeholder="e.g. Dec 25"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="map-pin" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="e.g. Central Park"
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Capacity</Text>
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

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.createButton, (!title || !category || !location) && styles.createButtonDisabled]} 
            onPress={handleCreate}
          >
            <Text style={styles.createButtonText}>Publish Activity</Text>
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

