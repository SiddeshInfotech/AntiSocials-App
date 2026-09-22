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

const TASK_ID = 137;
const TASK_NAME = 'The Courage Conversation';
const TASK_POINTS = 600;

// Page 2: Recipient Options
const PERSON_OPTIONS = [
  { id: 'partner', label: 'Partner / Spouse', icon: 'heart' },
  { id: 'family', label: 'Parent / Family Member', icon: 'home' },
  { id: 'friend', label: 'Close Friend', icon: 'user-check' },
  { id: 'colleague', label: 'Colleague / Manager', icon: 'briefcase' },
  { id: 'other', label: 'Someone Else', icon: 'users' },
];

// Page 3: Approach Options
const APPROACH_OPTIONS = [
  {
    id: 'compassionate',
    title: 'Direct & Compassionate',
    desc: 'Speak your truth honestly without blame or defense.',
    tag: 'Honest & Gentle',
  },
  {
    id: 'i_statements',
    title: 'Non-Violent "I" Statements',
    desc: '"When X happens, I feel Y because I value Z."',
    tag: 'Clarity & Safety',
  },
  {
    id: 'gentle_inquiry',
    title: 'Curious & Inquiring',
    desc: 'Invite their perspective before sharing your own.',
    tag: 'Bridge Building',
  },
  {
    id: 'firm_boundary',
    title: 'Firm Boundary Setting',
    desc: 'Define what is and is not okay moving forward.',
    tag: 'Self-Respect',
  },
];

// Page 4: Prep Checklist Items
const PREP_ITEMS = [
  { id: 'p1', label: 'I identified my true core message (no hidden attacks).' },
  { id: 'p2', label: 'I committed to deep listening without interrupting.' },
  { id: 'p3', label: 'I accept that their initial reaction might be uncomfortable.' },
];

// Page 5: Conversation Execution Checklist
const EXECUTION_ITEMS = [
  { id: 'e1', label: 'Stepped into the conversation (in-person or voice call).' },
  { id: 'e2', label: 'Spoke with calm honesty and kept my posture relaxed.' },
  { id: 'e3', label: 'Stayed present even through moments of silence or friction.' },
];

// Page 6: Feelings after conversation
const REFLECTION_FEELINGS = [
  { id: 'relieved', label: 'Lighter & Relieved', emoji: '🕊️' },
  { id: 'proud', label: 'Proud of My Courage', emoji: '🦁' },
  { id: 'peaceful', label: 'Quiet Clarity', emoji: '🌿' },
  { id: 'open', label: 'More Connected', emoji: '🤝' },
  { id: 'learning', label: 'Growth in Progress', emoji: '🌱' },
];

export default function CourageConversationScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2 State
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [topicDescription, setTopicDescription] = useState<string>('');

  // Page 3 State
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);

  // Page 4 State
  const [checkedPrep, setCheckedPrep] = useState<string[]>([]);

  // Page 5 State
  const [checkedExecution, setCheckedExecution] = useState<string[]>([]);

  // Page 6 State
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

  const togglePrepItem = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedPrep((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleExecutionItem = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedExecution((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Completion
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
          person_type: selectedPerson,
          topic: topicDescription.trim(),
          approach: selectedApproach,
          reflection_emotion: selectedFeeling,
          reflection_sentence: reflectionText.trim(),
        }),
      });

      const responseText = await response.text();
      console.log(`[The Courage Conversation] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Courage Conversation JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
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
          message: 'You showed true bravery and expanded your emotional comfort zone.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('The Courage Conversation completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Crimson Obsidian Gradient */}
      <LinearGradient
        colors={['#18080c', '#240c14', '#0d0406']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
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
            <Text style={styles.headerTitle}>The Courage Conversation</Text>
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
                      colors={['#f43f5e', '#be123c']}
                      style={styles.heroIconGradient}
                    >
                      <Feather name="message-circle" size={44} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={styles.hardPill}>
                    <Ionicons name="flame" size={14} color="#f43f5e" />
                    <Text style={styles.hardPillText}>HARD MASTERY CHALLENGE</Text>
                  </View>

                  <Text style={styles.pageTitle}>Confront What You've Avoided</Text>
                  <Text style={styles.pageBody}>
                    The conversations you avoid are the boundaries of your personal freedom.
                    Growth demands saying the unsaid with calm dignity, non-reactivity, and care.
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="shield" size={18} color="#f43f5e" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      This challenge asks you to choose one real-world, meaningful conversation you have postponed, prepare your approach, and step through the discomfort.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToPage(2)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#f43f5e', '#e11d48']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Begin Preparation</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 2: IDENTIFY CONVERSATION */}
              {currentPage === 2 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 1: IDENTIFY</Text>
                  <Text style={styles.pageTitle}>Who do you need to speak with?</Text>
                  <Text style={styles.pageBody}>
                    Select the person and describe the core topic you have postponed addressing.
                  </Text>

                  <View style={styles.optionsList}>
                    {PERSON_OPTIONS.map((item) => {
                      const isSelected = selectedPerson === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipSelected,
                          ]}
                          onPress={() => setSelectedPerson(item.id)}
                          activeOpacity={0.75}
                        >
                          <Feather
                            name={item.icon as any}
                            size={16}
                            color={isSelected ? '#f43f5e' : '#9ca3af'}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.optionChipText,
                              isSelected && styles.optionChipTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                    What is the core subject or unresolved tension?
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., Talking about unshared responsibilities, boundary around overtime, or clearing up misunderstandings..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    value={topicDescription}
                    onChangeText={setTopicDescription}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedPerson || topicDescription.trim().length < 6) && styles.btnDisabled,
                    ]}
                    disabled={!selectedPerson || topicDescription.trim().length < 6}
                    onPress={() => goToPage(3)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedPerson && topicDescription.trim().length >= 6
                          ? ['#f43f5e', '#e11d48']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Choose Approach</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 3: CHOOSE APPROACH */}
              {currentPage === 3 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 2: ALIGN</Text>
                  <Text style={styles.pageTitle}>Choose Your Approach</Text>
                  <Text style={styles.pageBody}>
                    How will you anchor your communication so it stays constructive?
                  </Text>

                  <View style={styles.approachList}>
                    {APPROACH_OPTIONS.map((item) => {
                      const isSelected = selectedApproach === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.approachCard,
                            isSelected && styles.approachCardSelected,
                          ]}
                          onPress={() => setSelectedApproach(item.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.approachHeader}>
                            <Text style={styles.approachTitle}>{item.title}</Text>
                            <View style={styles.approachTag}>
                              <Text style={styles.approachTagText}>{item.tag}</Text>
                            </View>
                          </View>
                          <Text style={styles.approachDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !selectedApproach && styles.btnDisabled,
                    ]}
                    disabled={!selectedApproach}
                    onPress={() => goToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedApproach
                          ? ['#f43f5e', '#e11d48']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Ground & Prepare</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 4: PREPARATION */}
              {currentPage === 4 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 3: PREPARE</Text>
                  <Text style={styles.pageTitle}>Internal Grounding</Text>
                  <Text style={styles.pageBody}>
                    Check off each mental agreement before initiating the conversation.
                  </Text>

                  <View style={styles.checklistContainer}>
                    {PREP_ITEMS.map((item) => {
                      const isChecked = checkedPrep.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => togglePrepItem(item.id)}
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

                  <View style={styles.highlightBox}>
                    <Feather name="info" size={16} color="#f43f5e" style={{ marginRight: 8 }} />
                    <Text style={styles.highlightText}>
                      Tip: Slow down your speaking pace by 20%. Ground your feet flat on the floor.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      checkedPrep.length < PREP_ITEMS.length && styles.btnDisabled,
                    ]}
                    disabled={checkedPrep.length < PREP_ITEMS.length}
                    onPress={() => goToPage(5)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedPrep.length === PREP_ITEMS.length
                          ? ['#f43f5e', '#e11d48']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Execute Conversation</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 5: EXECUTION VERIFICATION */}
              {currentPage === 5 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 4: REAL-WORLD ACTION</Text>
                  <Text style={styles.pageTitle}>Hold The Conversation</Text>
                  <Text style={styles.pageBody}>
                    Carry out the conversation in real life. When finished, confirm what occurred below.
                  </Text>

                  <View style={styles.checklistContainer}>
                    {EXECUTION_ITEMS.map((item) => {
                      const isChecked = checkedExecution.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => toggleExecutionItem(item.id)}
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
                      checkedExecution.length < EXECUTION_ITEMS.length && styles.btnDisabled,
                    ]}
                    disabled={checkedExecution.length < EXECUTION_ITEMS.length}
                    onPress={() => goToPage(6)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedExecution.length === EXECUTION_ITEMS.length
                          ? ['#f43f5e', '#e11d48']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Proceed to Reflection</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 6: REFLECTION & COMPLETION */}
              {currentPage === 6 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 5: DEBRIEF & REWARD</Text>
                  <Text style={styles.pageTitle}>Reflect on the Shift</Text>
                  <Text style={styles.pageBody}>
                    How does your nervous system feel now that you spoke instead of holding back?
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
                    What is your key takeaway about yourself?
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., I realized waiting made it 10x scarier than the actual conversation was..."
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
                      <Text style={styles.rewardPoints}>+600 Points • High Courage</Text>
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
                          ? ['#f43f5e', '#e11d48']
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
    backgroundColor: '#18080c',
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
    color: '#f43f5e',
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
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f43f5e',
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
    backgroundColor: 'rgba(244, 63, 94, 0.5)',
  },
  progressDotCurrent: {
    backgroundColor: '#f43f5e',
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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
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
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    marginBottom: 12,
    gap: 4,
  },
  hardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 0.6,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f43f5e',
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
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#f43f5e',
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
  optionsList: {
    width: '100%',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionChipSelected: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: '#f43f5e',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  optionChipTextSelected: {
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
  approachList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  approachCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  approachCardSelected: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: '#f43f5e',
  },
  approachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  approachTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  approachTag: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  approachTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f43f5e',
  },
  approachDesc: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  checklistContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
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
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: '#f43f5e',
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
    backgroundColor: '#f43f5e',
    borderColor: '#f43f5e',
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
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderColor: '#f43f5e',
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
