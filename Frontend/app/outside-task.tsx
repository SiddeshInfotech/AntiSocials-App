import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OutsideTaskScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>👀</Text>
        <Text style={styles.title}>Look outside for 2 minutes</Text>
        <Text style={styles.subtitle}>Take a moment to simply observe your surroundings outside.</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace({ pathname: '/task-success', params: { points: '150' } } as any)}
        >
          <Text style={styles.buttonText}>Complete Task</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  button: { 
    backgroundColor: '#8b5cf6', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 25,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backButton: { padding: 10 },
  backText: { color: '#6b7280', fontSize: 16 }
});
