import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '../constants/Api';

const { width } = Dimensions.get('window');

const TASK_ID = 139;
const TASK_NAME = 'The Thing I Keep Avoiding';
const TASK_POINTS = 600;

// Page 2: Avoidance Category Options
const AVOIDANCE_CATEGORIES = [
  { id: 'admin', label: 'Financial / Bureaucracy', icon: 'file-text', desc: 'Taxes, bills, bank calls, forms' },
  { id: 'health', label: 'Health / Doctor', icon: 'heart', desc: 'Booking appointment, medical check, dental' },
  { id: 'decision', label: 'Difficult Life Decision', icon: 'compass', desc: 'Career path, relationship crossroad, moving' },
  { id: 'message', label: 'Uncomfortable Message', icon: 'mail', desc: 'Answering an overdue email or message' },
  { id: 'creative', label: 'Personal Project / Study', icon: 'book-open', desc: 'Writing, course assignment, portfolio' },
  { id: 'home', label: 'Physical Fix / Cleanout', icon: 'home', desc: 'Major repair, deep clutter cleanout' },
];

// Page 3: Friction Reasons
const FRICTION_REASONS = [
  { id: 'fear_failure', label: 'Fear of Doing It Imperfectly', tag: 'Perfectionism' },
  { id: 'overwhelm', label: 'Seems Too Massive to Start', tag: 'Cognitive Load' },
  { id: 'discomfort', label: 'Anticipated Emotional Awkwardness', tag: 'Vulnerability' },
  { id: 'boredom', label: 'Tedious with No Instant Reward', tag: 'Dopamine Void' },
  { id: 'uncertainty', label: 'Unclear First Next Step', tag: 'Ambiguity' },
];

// Page 5: Action Verification Checklist
const ACTION_CHECKLIST = [
  { id: 'a1', label: 'I set aside 15 focused minutes with zero distractions.' },
  { id: 'a2', label: 'I executed the concrete first micro-step without stopping.' },
  { id: 'a3', label: 'I broke through the inertia that kept me paralyzed.' },
];

// Page 6: Feelings after breaking avoidance
const REFLECTION_FEELINGS = [
  { id: 'massive_relief', label: 'Massive Mental Relief', emoji: '🎉' },
  { id: 'lighter', label: 'Weight Lifted Off Chest', emoji: '🕊️' },
  { id: 'unstoppable', label: 'Momentum Restored', emoji: '⚡' },
  { id: 'empowered', label: 'In Control of My Life', emoji: '🛡️' },
  { id: 'surprised', label: 'Easier Than I Feared', emoji: '💡' },
];

export default function AvoidingTaskScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2 State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState<string>('');

  // Page 3 State
  const [selectedFriction, setSelectedFriction] = useState<string | null>(null);

  // Page 4 State: The Micro-Step
  const [microStep, setMicroStep] = useState<string>('');

  // Page 5 State: Action Execution
  const [checkedActions, setCheckedActions] = useState<string[]>([]);

  // Page 6 State: Reflection
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animations
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  const goToPage = (page: 1 | 2 | 3 | 4 | 5 | 6) => {
    Haptics.selectionAsync?.();
    Animated.timing(pageFadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(page);
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleHeaderBack = () => {
    Haptics.selectionAsync?.();
    if (currentPage > 1) {
      goToPage((currentPage - 1) as any);
    } else {
      router.back();
    }
  };

  const toggleActionItem = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedActions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Authenticated Completion
  const handleCompleteTask = async () => {
    if (isSubmitting || hasClaimed) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setErrorMessage('Authentication token not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      const response = await apiFetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_name: TASK_NAME,
          taskId: TASK_ID,
          difficulty: 'Hard',
          avoidance_category: selectedCategory,
          avoided_task: taskDescription.trim(),
          friction_reason: selectedFriction,
          micro_step: microStep.trim(),
          reflection_emotion: selectedFeeling,
          reflection_sentence: reflectionText.trim(),
        }),
      });

      const responseText = await response.text();
      console.log(`[The Thing I Keep Avoiding] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Avoiding Task JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
        throw new Error(
          response.status === 503
            ? 'Backend service is currently unavailable (HTTP 503).'
            : `Server returned non-JSON response (HTTP ${response.status}).`
        );
      }

      if (!response.ok && !data?.success) {
        throw new Error(data?.error || data?.message || `Task completion failed (HTTP ${response.status})`);
      }

      setHasClaimed(true);
      Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);

      const isDuplicate = data.rewardClaimed === false || (data.pointsEarned === 0 && data.points_earned === 0);
      const pointsAwarded = isDuplicate ? 0 : (
        data.pointsEarned ??
        data.pointsAdded ??
        data.points_earned ??
        data.points_rewarded ??
        TASK_POINTS
      );
      const totalPoints = data.totalPoints ?? data.total_points ?? '0';
      const streak = data.currentStreak ?? data.streak ?? data.current_streak ?? '1';

      router.replace({
        pathname: '/task-success',
        params: {
          points: String(pointsAwarded),
          pointsAdded: String(pointsAwarded),
          pointsEarned: String(pointsAwarded),
          totalPoints: String(totalPoints),
          streak: String(streak),
          taskName: TASK_NAME,
          difficulty: 'hard',
          message: 'You broke the cycle of avoidance and reclaimed your power.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('The Thing I Keep Avoiding completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Amber Bronze Obsidian Gradient */}
      <LinearGradient
        colors={['#1c1306', '#2a1a08', '#0f0a03']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.stageTag}>DAY MASTERY • STAGE 15</Text>
            <Text style={styles.headerTitle}>The Thing I Keep Avoiding</Text>
          </View>

          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>+600</Text>
          </View>
        </View>

        {/* 6-Step Progress Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <View
              key={p}
              style={[
                styles.progressDot,
                currentPage >= p && styles.progressDotActive,
                currentPage === p && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Content Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: pageFadeAnim, flex: 1 }}>
              {/* PAGE 1: HERO INTRO */}
              {currentPage === 1 && (
                <View style={styles.pageCard}>
                  <Animated.View
                    style={[
                      styles.heroIconWrapper,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#f59e0b', '#d97706']}
                      style={styles.heroIconGradient}
                    >
                      <Feather name="target" size={44} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={styles.hardPill}>
                    <Ionicons name="flame" size={14} color="#fbbf24" />
                    <Text style={styles.hardPillText}>HARD MASTERY CHALLENGE</Text>
                  </View>

                  <Text style={styles.pageTitle}>Conquer Chronic Avoidance</Text>
                  <Text style={styles.pageBody}>
                    Postponed tasks consume far more mental energy in the background than they take to actually complete.
                    Unfinished obligations quietly drain your self-trust.
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="zap" size={18} color="#fbbf24" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      Identify the one nagging task you keep postponing. You will deconstruct the friction, break it into a 15-minute slice, and execute it today.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToPage(2)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#f59e0b', '#d97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Identify The Task</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 2: IDENTIFY POSTPONED ITEM */}
              {currentPage === 2 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 1: NAME IT</Text>
                  <Text style={styles.pageTitle}>What Have You Put Off?</Text>
                  <Text style={styles.pageBody}>
                    Select the domain of the avoided responsibility, then state it plainly:
                  </Text>

                  <View style={styles.categoryGrid}>
                    {AVOIDANCE_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryChip,
                            isSelected && styles.categoryChipSelected,
                          ]}
                          onPress={() => setSelectedCategory(cat.id)}
                          activeOpacity={0.75}
                        >
                          <Feather
                            name={cat.icon as any}
                            size={16}
                            color={isSelected ? '#fbbf24' : '#9ca3af'}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && styles.categoryChipTextSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                    Describe the specific avoided task:
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., Filing overdue expense reports, scheduling the dental checkup, or finally sorting out my storage room..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedCategory || taskDescription.trim().length < 6) && styles.btnDisabled,
                    ]}
                    disabled={!selectedCategory || taskDescription.trim().length < 6}
                    onPress={() => goToPage(3)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedCategory && taskDescription.trim().length >= 6
                          ? ['#f59e0b', '#d97706']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Examine Friction</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 3: DECONSTRUCT FRICTION */}
              {currentPage === 3 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 2: ROOT CAUSE</Text>
                  <Text style={styles.pageTitle}>Why Are You Avoiding It?</Text>
                  <Text style={styles.pageBody}>
                    Avoidance is almost never laziness; it is emotional friction. What is the real block?
                  </Text>

                  <View style={styles.frictionList}>
                    {FRICTION_REASONS.map((item) => {
                      const isSelected = selectedFriction === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.frictionCard,
                            isSelected && styles.frictionCardSelected,
                          ]}
                          onPress={() => setSelectedFriction(item.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.frictionHeader}>
                            <Text style={styles.frictionLabel}>{item.label}</Text>
                            <View style={styles.frictionTag}>
                              <Text style={styles.frictionTagText}>{item.tag}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !selectedFriction && styles.btnDisabled,
                    ]}
                    disabled={!selectedFriction}
                    onPress={() => goToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedFriction
                          ? ['#f59e0b', '#d97706']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Define First Micro-Step</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 4: THE MICRO-STEP */}
              {currentPage === 4 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 3: BREAK THE INERTIA</Text>
                  <Text style={styles.pageTitle}>Define a 15-Minute Slice</Text>
                  <Text style={styles.pageBody}>
                    Do not attempt to finish everything at once. What is the single tangible micro-action you can execute in the next 15 minutes?
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="check-circle" size={18} color="#fbbf24" style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      Examples: "Drafting the email body", "Gathering all receipts onto one folder", "Making the 3-minute phone call".
                    </Text>
                  </View>

                  <Text style={styles.fieldLabel}>My immediate 15-minute micro-step:</Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., I will open the portal and submit the initial verification documents..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    value={microStep}
                    onChangeText={setMicroStep}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      microStep.trim().length < 6 && styles.btnDisabled,
                    ]}
                    disabled={microStep.trim().length < 6}
                    onPress={() => goToPage(5)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        microStep.trim().length >= 6
                          ? ['#f59e0b', '#d97706']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Execute Action</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 5: ACTION VERIFICATION */}
              {currentPage === 5 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 4: ACTION TAKEN</Text>
                  <Text style={styles.pageTitle}>Perform & Confirm</Text>
                  <Text style={styles.pageBody}>
                    Step away and perform your micro-step right now. Check all 3 boxes once done:
                  </Text>

                  <View style={styles.checklistContainer}>
                    {ACTION_CHECKLIST.map((item) => {
                      const isChecked = checkedActions.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => toggleActionItem(item.id)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isChecked && styles.checkboxChecked,
                            ]}
                          >
                            {isChecked && <Feather name="check" size={14} color="#ffffff" />}
                          </View>
                          <Text style={styles.checklistLabel}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      checkedActions.length < ACTION_CHECKLIST.length && styles.btnDisabled,
                    ]}
                    disabled={checkedActions.length < ACTION_CHECKLIST.length}
                    onPress={() => goToPage(6)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedActions.length === ACTION_CHECKLIST.length
                          ? ['#f59e0b', '#d97706']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Proceed to Debrief</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 6: REFLECTION & COMPLETION */}
              {currentPage === 6 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 5: DEBRIEF & REWARD</Text>
                  <Text style={styles.pageTitle}>The Relief of Action</Text>
                  <Text style={styles.pageBody}>
                    Notice how much lighter you feel after breaking the inertia:
                  </Text>

                  <View style={styles.feelingsGrid}>
                    {REFLECTION_FEELINGS.map((item) => {
                      const isSelected = selectedFeeling === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.feelingChip,
                            isSelected && styles.feelingChipSelected,
                          ]}
                          onPress={() => setSelectedFeeling(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.feelingEmoji}>{item.emoji}</Text>
                          <Text
                            style={[
                              styles.feelingLabel,
                              isSelected && styles.feelingLabelSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                    What will you tell yourself next time you start postponing?
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., The anticipation is always 10 times heavier than the actual 15 minutes of execution..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    value={reflectionText}
                    onChangeText={setReflectionText}
                  />

                  {errorMessage ? (
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  ) : null}

                  {/* Reward Summary Pill */}
                  <View style={styles.rewardBox}>
                    <Ionicons name="trophy" size={24} color="#fbbf24" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.rewardTitle}>Day Mastery Reward</Text>
                      <Text style={styles.rewardPoints}>+600 Points • High Discipline Mastery</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedFeeling || reflectionText.trim().length < 5 || isSubmitting) && styles.btnDisabled,
                    ]}
                    disabled={!selectedFeeling || reflectionText.trim().length < 5 || isSubmitting}
                    onPress={handleCompleteTask}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedFeeling && reflectionText.trim().length >= 5 && !isSubmitting
                          ? ['#f59e0b', '#d97706']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.btnText}>Complete Task (+600 Pts)</Text>
                          <Feather name="check-circle" size={18} color="#ffffff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1306',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stageTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#fbbf24',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  progressDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
  progressDotCurrent: {
    backgroundColor: '#fbbf24',
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 8,
  },
  pageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 22,
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    marginBottom: 12,
    gap: 4,
  },
  hardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.2,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  pageBody: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 19,
  },
  categoryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  multilineInput: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 22,
  },
  frictionList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  frictionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  frictionCardSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: '#fbbf24',
  },
  frictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  frictionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  frictionTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  frictionTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  checklistContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 14,
    padding: 14,
  },
  checklistItemChecked: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: '#fbbf24',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#d97706',
    borderColor: '#fbbf24',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 18,
  },
  feelingsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  feelingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  feelingChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#fbbf24',
  },
  feelingEmoji: {
    fontSize: 16,
  },
  feelingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  feelingLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  rewardPoints: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    width: '100%',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#fca5a5',
    flex: 1,
  },
});
