import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ShareThoughtsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [text, setText] = useState('');

  const isButtonActive = text.trim().length > 0;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" backgroundColor="#fafafa" />
      
      {/* Header */}
      <View style={[styles.headerLight, { paddingTop: Math.max(insets.top, 5) }]}>
        <TouchableOpacity style={styles.backBtnLight} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks' as any)}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
         
         {/* Title & Subtitle */}
         <Text style={styles.mainTitle}>Share your thoughts</Text>
         <Text style={styles.subtitle}>Write what comes to mind</Text>

         {/* Text Input */}
         <View style={styles.inputContainer}>
           <TextInput
             style={styles.textInput}
             placeholder="Start writing..."
             placeholderTextColor="#9ca3af"
             multiline
             autoFocus
             textAlignVertical="top"
             value={text}
             onChangeText={setText}
           />
         </View>

         {/* Character Count */}
         <View style={styles.charCountRow}>
            <Text style={styles.charCount}>{text.length} characters</Text>
         </View>

         {/* Save Button */}
         <TouchableOpacity 
            style={[styles.saveButton, isButtonActive ? styles.saveButtonActive : styles.saveButtonDisabled]} 
            disabled={!isButtonActive}
            activeOpacity={0.8}
            onPress={() => {
                router.push('/task-success' as any);
            }}
         >
            <Feather name="save" size={18} color={isButtonActive ? "#ffffff" : "#d1d5db"} />
            <Text style={[styles.saveButtonText, { color: isButtonActive ? "#ffffff" : "#d1d5db" }]}>
               Save & Continue
            </Text>
         </TouchableOpacity>

         {/* Info Box */}
         <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>💡</Text>
            <Text style={styles.infoBoxText}>Your reflections are private and saved automatically</Text>
         </View>

      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 70,
  },
  mainTitle: {
    fontSize: 27,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 35,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 260,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111111',
    lineHeight: 24,
  },
  charCountRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingLeft: 4,
  },
  charCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  saveButtonDisabled: {
    backgroundColor: '#f3f4f6', 
  },
  saveButtonActive: {
    backgroundColor: '#3b82f6', 
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 16,
    padding: 16,
  },
  infoBoxIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoBoxText: {
    flex: 1,
    color: '#4b5563', 
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  }
});

