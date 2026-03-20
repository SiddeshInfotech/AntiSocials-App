import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();

  const tasksData = [
    { emoji: '🫁', difficulty: 'easy', title: 'Breathe consciously for 3 minutes', subtitle: 'Guided breathing animation + timer', points: '+100 points' },
    { emoji: '💧', difficulty: 'easy', title: 'Drink a glass of water mindfully', subtitle: '60s timer + confirm', points: '+150 points' },
    { emoji: '🤫', difficulty: 'medium', title: 'Sit without phone for 2 minutes', subtitle: 'Lock-screen mode', points: '+200 points' },
    { emoji: '🧘‍♀️', difficulty: 'medium', title: 'Stretch neck & shoulders', subtitle: 'Animation + timer', points: '+250 points' },
    { emoji: '👀', difficulty: 'easy', title: 'Look outside for 2 minutes', subtitle: 'Timer', points: '+150 points' },
    { emoji: '✍️', difficulty: 'medium', title: 'Write 1 word about how you feel', subtitle: 'Text input', points: '+300 points' },
    { emoji: '😊', difficulty: 'easy', title: 'Smile intentionally', subtitle: 'Self-confirm button', points: '+100 points' },
  ];

  const unlocksData = [
    { title: 'Join Events', day: 'Day 21', points: '5,000 points needed', progress: '10%' },
    { title: 'Host Events', day: 'Day 50', points: '15,000 points needed', progress: '5%' },
    { title: 'Heart Connect', day: 'Day 60', points: '20,000 points needed', progress: '2%' },
    { title: 'Legacy Video', day: 'Day 75', points: '28,000 points needed', progress: '1%' },
    { title: 'Stranger Meet', day: 'Day 100', points: '40,000 points needed', progress: '0%' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* --- Header Gradient Section --- */}
        <LinearGradient 
          colors={['#4f46e5', '#9333ea']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }} 
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Your Journey</Text>

          {/* Stats Boxes */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>👌</Text>
              <Text style={styles.statValue}>1 day</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statValue}>200</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>

          {/* Next Unlock Box */}
          <View style={styles.unlockContainer}>
             <View style={styles.unlockHeaderRow}>
               <Text style={styles.unlockTitle}>Next Unlock: Join Events</Text>
               <Feather name="lock" size={14} color="#ffffff" />
             </View>
             <View style={styles.progressBarBgHeader}>
               <View style={[styles.progressBarFillHeader, { width: '15%' }]} />
             </View>
             <Text style={styles.unlockSubtitle}>4,800 points needed • ~20 days with streaks</Text>
          </View>
        </LinearGradient>

        {/* --- Navigation Tabs Pill Menu --- */}
        <View style={styles.navBarWrapper}>
           <View style={styles.navBarBlack}>
             <Feather name="chevron-left" size={20} color="#a1a1aa" />
             <View style={styles.navPills}>
               <TouchableOpacity style={[styles.navPill, styles.navPillActive]} activeOpacity={0.8}>
                 <Feather name="calendar" size={12} color="#ffffff" style={{marginRight: 6}} />
                 <Text style={styles.navPillActiveText}>100-Day Journey</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.navPill} activeOpacity={0.6}>
                 <Text style={styles.navPillInactiveText}>Monthly Buckets</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.navPill} activeOpacity={0.6}>
                 <Text style={styles.navPillInactiveText}>Lifetime</Text>
               </TouchableOpacity>
             </View>
             <Feather name="chevron-right" size={20} color="#a1a1aa" />
           </View>
        </View>

        {/* --- Missing Streak Orange Box --- */}
        <View style={styles.streakAlertCard}>
          <View style={styles.streakAlertTop}>
            <Feather name="alert-circle" size={16} color="#ea580c" />
            <Text style={styles.streakAlertTitle}>Complete 1 task to maintain streak</Text>
            <Text style={styles.streakAlertCount}>0/1</Text>
          </View>
          <Text style={styles.streakAlertDesc}>Complete at least 1 task. Up to 3 tasks for bonus points.</Text>
        </View>

        {/* --- Minimal Day Badges --- */}
        <View style={styles.dayPillsScroll}>
          <View style={[styles.dayPillBtn, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
             <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>Day 1</Text>
          </View>
          <View style={[styles.dayPillBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
             <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>Day 25</Text>
          </View>
          <View style={[styles.dayPillBtn, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
             <Text style={{ color: '#a855f7', fontSize: 12, fontWeight: '600' }}>Day 45</Text>
          </View>
          <View style={[styles.dayPillBtn, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
             <Text style={{ color: '#ea580c', fontSize: 12, fontWeight: '600' }}>Day 75</Text>
          </View>
        </View>

        {/* --- Big Foundation Card --- */}
        <View style={styles.bigJourneyCard}>
           <View style={styles.dayHeaderRow}>
             <View style={styles.largeGreenCircle}>
                <Text style={styles.largeGreenCircleText}>1</Text>
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.dayOfText}>Day 1 of 100</Text>
                <Text style={styles.stageTitleText}>Stage 1: Habit Foundation</Text>
             </View>
           </View>
           
           <View style={styles.stageIconsRow}>
             <View style={styles.stageIconItem}>
               <Feather name="calendar" size={22} color="#16a34a" />
               <Text style={[styles.stageIconRange, {color: '#16a34a'}]}>Day 1-21</Text>
               <Text style={[styles.stageIconLabel, {color: '#16a34a'}]}>Habits</Text>
             </View>
             <View style={styles.stageIconItem}>
               <Feather name="heart" size={22} color="#e5e7eb" />
               <Text style={styles.stageIconRange}>Day 22-40</Text>
               <Text style={styles.stageIconLabel}>Social</Text>
             </View>
             <View style={styles.stageIconItem}>
               <Feather name="users" size={22} color="#e5e7eb" />
               <Text style={styles.stageIconRange}>Day 41-70</Text>
               <Text style={styles.stageIconLabel}>Community</Text>
             </View>
             <View style={styles.stageIconItem}>
               <Feather name="star" size={22} color="#e5e7eb" />
               <Text style={styles.stageIconRange}>Day 71-100</Text>
               <Text style={styles.stageIconLabel}>Leadership</Text>
             </View>
           </View>
        </View>

        {/* --- Today's Tasks Section --- */}
        <View style={styles.sectionHeaderRow}>
           <Text style={styles.sectionTitle}>Today's Tasks</Text>
           <View style={styles.pickTasksPill}>
             <Text style={styles.pickTasksText}>Pick 1-3 tasks</Text>
           </View>
        </View>

        <View style={styles.stageInfoBox}>
           <Text style={styles.stageInfoTitle}>Stage 1: Habit Foundation</Text>
           <Text style={styles.stageInfoDesc}>
             Build self awareness and discipline through simple daily actions. No photos, no social pressure -- just you showing up for yourself.
           </Text>
        </View>

        {/* Individual Task Cards */}
        {tasksData.map((task, idx) => (
           <TouchableOpacity key={idx} style={styles.taskCard} activeOpacity={0.7}>
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

        {/* --- Feature Unlocks Section --- */}
        <Text style={[styles.sectionTitle, { marginTop: 25, marginBottom: 15, paddingHorizontal: 15 }]}>
            Feature Unlocks
        </Text>
        
        {unlocksData.map((u, idx) => (
          <View key={idx} style={styles.unlockCard}>
             <View style={styles.unlockCardTop}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                   <Feather name="lock" size={16} color="#9ca3af" style={{marginRight: 8}} />
                   <Text style={styles.unlockCardTitle}>{u.title}</Text>
                </View>
                <Text style={styles.unlockCardDay}>{u.day}</Text>
             </View>
             <View style={styles.unlockCardBarBg}>
                <View style={[styles.unlockCardBarFill, { width: u.progress as any }]} />
             </View>
             <Text style={styles.unlockCardPoints}>{u.points}</Text>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerGradient: {
    paddingBottom: 25,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  unlockContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
  },
  unlockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressBarBgHeader: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    marginVertical: 12,
  },
  progressBarFillHeader: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  unlockSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  navBarWrapper: {
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
    paddingHorizontal: 15,
  },
  navBarBlack: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-evenly',
  },
  navPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navPillActive: {
    backgroundColor: '#a855f7',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  navPillActiveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  navPillInactiveText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  streakAlertCard: {
    marginHorizontal: 15,
    marginTop: 25,
    padding: 15,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
  },
  streakAlertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakAlertTitle: {
    color: '#ea580c',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  streakAlertCount: {
    color: '#ea580c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  streakAlertDesc: {
    color: '#ea580c',
    fontSize: 13,
    marginLeft: 24,
  },
  dayPillsScroll: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  dayPillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  bigJourneyCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  largeGreenCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeGreenCircleText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  dayOfText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  stageTitleText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  stageIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  stageIconItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageIconRange: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  stageIconLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickTasksPill: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pickTasksText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stageInfoBox: {
    marginHorizontal: 15,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stageInfoTitle: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  stageInfoDesc: {
    color: '#15803d',
    fontSize: 13,
    lineHeight: 18,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
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
    textTransform: 'lowercase',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskPoints: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#a855f7',
  },
  unlockCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  unlockCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unlockCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  unlockCardDay: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  unlockCardBarBg: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginBottom: 10,
  },
  unlockCardBarFill: {
    height: 4,
    backgroundColor: '#9333ea',
    borderRadius: 2,
  },
  unlockCardPoints: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});