import { useRouter } from "expo-router";
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const router = useRouter();

  const tasksData = [
    { emoji: '🫁', difficulty: 'easy', title: 'Breathe consciously for 3 minutes', subtitle: 'Guided breathing animation + timer', points: '+100 points' },
    { emoji: '💧', difficulty: 'easy', title: 'Drink a glass of water mindfully', subtitle: '60s timer + confirm', points: '+150 points' },
    { emoji: '🤫', difficulty: 'medium', title: 'Sit without phone for 2 minutes', subtitle: 'Lock-screen mode', points: '+200 points' },
    { emoji: '🧘‍♀️', difficulty: 'medium', title: 'Stretch neck & shoulders', subtitle: 'Animation + timer', points: '+250 points' },
    { emoji: '👀', difficulty: 'easy', title: 'Look outside for 2 minutes', subtitle: 'Timer', points: '+150 points' },
    { emoji: '✍️', difficulty: 'medium', title: 'Write 1 word about how you feel', subtitle: 'Text input', points: '+300 points' },
    { emoji: '😊', difficulty: 'easy', title: 'Smile intentionally', subtitle: 'Self-confirm button', points: '+100 points' },
  ];

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" />}

      <LinearGradient 
        colors={['#4f46e5', '#9333ea']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }} 
        style={{ height: insets.top, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

          {/* Header */}
          <LinearGradient 
            colors={['#4f46e5', '#9333ea']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={[styles.headerGradient, { paddingTop: 20 }]}
          >
            <Text style={styles.headerTitle}>Your Journey</Text>
          </LinearGradient>

          {/* Tasks */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today s Tasks</Text>
          </View>

          {/* ✅ UPDATED NAVIGATION */}
          {tasksData.map((task, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.taskCard} 
              activeOpacity={0.7}
              onPress={() => {
                if (task.title === "Breathe consciously for 3 minutes") {
                  router.push("/task-detail");
                } 
                else if (task.title === "Drink a glass of water mindfully") {
                  router.push("/drink-task"); // ✅ NEW
                }
              }}
            >
              <Text style={styles.taskEmoji}>{task.emoji}</Text>

              <View style={styles.taskCardContent}>
                <View style={[styles.difficultyPill, { 
                  backgroundColor: task.difficulty === 'easy' ? '#dcfce7' : '#fef08a' 
                }]}>
                  <Text style={[styles.difficultyText, { 
                    color: task.difficulty === 'easy' ? '#16a34a' : '#ca8a04' 
                  }]}>
                    {task.difficulty}
                  </Text>
                </View>

                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                <Text style={styles.taskPoints}>{task.points}</Text>
              </View>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  headerGradient: {
    paddingBottom: 25,
    paddingHorizontal: 15,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  sectionHeaderRow: {
    margin: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },

  taskEmoji: {
    fontSize: 34,
    marginRight: 15,
  },

  taskCardContent: {
    flex: 1,
  },

  difficultyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },

  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  taskSubtitle: {
    fontSize: 12,
    color: 'gray',
  },

  taskPoints: {
    color: 'purple',
    marginTop: 5,
  },
});