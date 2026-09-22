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

const TASK_ID = 140;
const TASK_NAME = 'Deep Connection Challenge';
const TASK_POINTS = 600;

// Page 2: Person & Setting
const RELATION_OPTIONS = [
  { id: 'friend', label: 'Close Friend', icon: 'user-check' },
  { id: 'partner', label: 'Romantic Partner', icon: 'heart' },
  { id: 'family', label: 'Parent / Sibling', icon: 'home' },
  { id: 'mentor', label: 'Mentor / Elder', icon: 'award' },
  { id: 'colleague', label: 'Work Colleague', icon: 'briefcase' },
];

const SETTING_OPTIONS = [
  { id: 'walk', label: 'Outdoor Walk (No Headphones)', icon: 'compass' },
  { id: 'tea', label: 'Tea / Coffee Sitting', icon: 'coffee' },
  { id: 'meal', label: 'Shared Sit-Down Meal', icon: 'utensils' },
  { id: 'park', label: 'Park Bench / Nature', icon: 'sun' },
];

// Page 3: Depth Prompts (choose 2)
const DEPTH_PROMPTS = [
  {
    id: 'p1',
    category: 'Vulnerability',
    prompt: '“What has been weighing on your mind lately that you rarely talk about?”',
  },
  {
    id: 'p2',
    category: 'Growth',
    prompt: '“What is an unexpected lesson or change you have experienced this past year?”',
  },
  {
    id: 'p3',
    category: 'Gratitude',
    prompt: '“What is something small that brings you genuine peace right now?”',
  },
  {
    id: 'p4',
    category: 'Support',
    prompt: '“In what way can I show up as a better friend / presence in your life?”',
  },
  {
    id: 'p5',
    category: 'Dreams',
    prompt: '“If fear and opinions were irrelevant, what would you pursue next?”',
  },
];

// Page 4: Connection Agreement Checklist
const AGREEMENT_ITEMS = [
  { id: 'c1', label: 'Phones tucked away completely face-down on silent.' },
  { id: 'c2', label: 'Full eye contact without fidgeting or multi-tasking.' },
  { id: 'c3', label: 'Active listening: Hear to understand, not to prepare my reply.' },
];

// Page 5: Interaction Debrief Checklist
const DEBRIEF_ITEMS = [
  { id: 'd1', label: 'Met offline and engaged in undivided conversation.' },
  { id: 'd2', label: 'Asked meaningful questions and allowed silence without rushing.' },
  { id: 'd3', label: 'Felt a genuine shift from surface small talk to real presence.' },
];

// Page 6: Feelings after deep connection
const REFLECTION_FEELINGS = [
  { id: 'connected', label: 'Deeply Connected', emoji: '🤝' },
  { id: 'warmed', label: 'Emotionally Warmed', emoji: '💛' },
  { id: 'understood', label: 'Seen & Heard', emoji: '✨' },
  { id: 'grateful', label: 'Grateful for Them', emoji: '🌿' },
  { id: 'nourished', label: 'Nourished', emoji: '🕊️' },
];

export default function DeepConnectionTaskScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2 State
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  // Page 3 State: Selected Prompts (up to 2)
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  // Page 4 State
  const [checkedAgreements, setCheckedAgreements] = useState<string[]>([]);

  // Page 5 State
  const [checkedDebrief, setCheckedDebrief] = useState<string[]>([]);

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
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2400,
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

  const togglePrompt = (id: string) => {
    Haptics.selectionAsync?.();
    setSelectedPrompts((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[1], id];
    });
  };

  const toggleAgreement = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedAgreements((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleDebrief = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedDebrief((prev) =>
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
          relation_type: selectedRelation,
          setting: selectedSetting,
          prompts_used: selectedPrompts,
          reflection_emotion: selectedFeeling,
          reflection_sentence: reflectionText.trim(),
        }),
      });

      const responseText = await response.text();
      console.log(`[Deep Connection Challenge] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Deep Connection JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
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
          message: 'You gave the rare gift of undivided presence and strengthened a real bond.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('Deep Connection Challenge completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Emerald Forest Obsidian Gradient */}
      <LinearGradient
        colors={['#061a12', '#0c271c', '#04100b']}
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
            <Text style={styles.headerTitle}>Deep Connection Challenge</Text>
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
                      colors={['#10b981', '#059669']}
                      style={styles.heroIconGradient}
                    >
                      <Feather name="users" size={44} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={styles.hardPill}>
                    <Ionicons name="flame" size={14} color="#10b981" />
                    <Text style={styles.hardPillText}>HARD MASTERY CHALLENGE</Text>
                  </View>

                  <Text style={styles.pageTitle}>Undivided Human Presence</Text>
                  <Text style={styles.pageBody}>
                    In a world of constant partial attention, giving someone your 100% undivided offline presence is the rarest and most impactful form of intimacy.
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="heart" size={18} color="#10b981" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      Meet with someone face-to-face. Put all devices completely away. Use thoughtful prompts to bypass mundane surface talk and connect authentically.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToPage(2)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Choose Person & Setting</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 2: PERSON & SETTING */}
              {currentPage === 2 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 1: ALIGN THE ENCOUNTER</Text>
                  <Text style={styles.pageTitle}>Who Will You Meet?</Text>
                  <Text style={styles.pageBody}>
                    Choose the person and the setting where you can talk uninterrupted:
                  </Text>

                  <Text style={styles.fieldLabel}>Person:</Text>
                  <View style={styles.chipsRow}>
                    {RELATION_OPTIONS.map((item) => {
                      const isSelected = selectedRelation === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.chipBtn,
                            isSelected && styles.chipBtnSelected,
                          ]}
                          onPress={() => setSelectedRelation(item.id)}
                          activeOpacity={0.75}
                        >
                          <Feather
                            name={item.icon as any}
                            size={15}
                            color={isSelected ? '#10b981' : '#9ca3af'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.chipBtnText,
                              isSelected && styles.chipBtnTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Setting:</Text>
                  <View style={styles.chipsRow}>
                    {SETTING_OPTIONS.map((item) => {
                      const isSelected = selectedSetting === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.chipBtn,
                            isSelected && styles.chipBtnSelected,
                          ]}
                          onPress={() => setSelectedSetting(item.id)}
                          activeOpacity={0.75}
                        >
                          <Feather
                            name={item.icon as any}
                            size={15}
                            color={isSelected ? '#10b981' : '#9ca3af'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.chipBtnText,
                              isSelected && styles.chipBtnTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedRelation || !selectedSetting) && styles.btnDisabled,
                    ]}
                    disabled={!selectedRelation || !selectedSetting}
                    onPress={() => goToPage(3)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedRelation && selectedSetting
                          ? ['#10b981', '#059669']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Select Conversation Prompts</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 3: DEPTH PROMPTS */}
              {currentPage === 3 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 2: DEPTH PROMPTS</Text>
                  <Text style={styles.pageTitle}>Choose 1 or 2 Questions</Text>
                  <Text style={styles.pageBody}>
                    Select questions to steer the conversation past small talk into real substance:
                  </Text>

                  <View style={styles.promptsList}>
                    {DEPTH_PROMPTS.map((item) => {
                      const isSelected = selectedPrompts.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.promptCard,
                            isSelected && styles.promptCardSelected,
                          ]}
                          onPress={() => togglePrompt(item.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.promptHeader}>
                            <View style={styles.promptTag}>
                              <Text style={styles.promptTagText}>{item.category}</Text>
                            </View>
                            {isSelected && (
                              <Feather name="check-circle" size={16} color="#10b981" />
                            )}
                          </View>
                          <Text style={styles.promptText}>{item.prompt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      selectedPrompts.length === 0 && styles.btnDisabled,
                    ]}
                    disabled={selectedPrompts.length === 0}
                    onPress={() => goToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedPrompts.length > 0
                          ? ['#10b981', '#059669']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Commit to Presence</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 4: CONNECTION AGREEMENT */}
              {currentPage === 4 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 3: THE AGREEMENT</Text>
                  <Text style={styles.pageTitle}>Ground Rules for Presence</Text>
                  <Text style={styles.pageBody}>
                    Confirm your personal agreements before initiating the meeting:
                  </Text>

                  <View style={styles.checklistContainer}>
                    {AGREEMENT_ITEMS.map((item) => {
                      const isChecked = checkedAgreements.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => toggleAgreement(item.id)}
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
                      checkedAgreements.length < AGREEMENT_ITEMS.length && styles.btnDisabled,
                    ]}
                    disabled={checkedAgreements.length < AGREEMENT_ITEMS.length}
                    onPress={() => goToPage(5)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedAgreements.length === AGREEMENT_ITEMS.length
                          ? ['#10b981', '#059669']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Hold The Meeting</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 5: INTERACTION DEBRIEF */}
              {currentPage === 5 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 4: DEBRIEF INTERACTION</Text>
                  <Text style={styles.pageTitle}>Did the Connection Land?</Text>
                  <Text style={styles.pageBody}>
                    Once the face-to-face interaction is complete, check off what unfolded:
                  </Text>

                  <View style={styles.checklistContainer}>
                    {DEBRIEF_ITEMS.map((item) => {
                      const isChecked = checkedDebrief.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.checklistItem,
                            isChecked && styles.checklistItemChecked,
                          ]}
                          onPress={() => toggleDebrief(item.id)}
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
                      checkedDebrief.length < DEBRIEF_ITEMS.length && styles.btnDisabled,
                    ]}
                    disabled={checkedDebrief.length < DEBRIEF_ITEMS.length}
                    onPress={() => goToPage(6)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedDebrief.length === DEBRIEF_ITEMS.length
                          ? ['#10b981', '#059669']
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
                  <Text style={styles.pageTitle}>The Power of Shared Presence</Text>
                  <Text style={styles.pageBody}>
                    How did it feel to connect without screens or rapid distractions?
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
                    What was a memorable insight from your time together?
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., We talked for an hour and lost track of time completely. It made me realize how much screens degrade casual meetings..."
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
                      <Text style={styles.rewardPoints}>+600 Points • High Relational Mastery</Text>
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
                          ? ['#10b981', '#059669']
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
    backgroundColor: '#061a12',
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
    color: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
  },
  progressDotCurrent: {
    backgroundColor: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    marginBottom: 12,
    gap: 4,
  },
  hardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.6,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d1d5db',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipBtnSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
  },
  chipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
  },
  chipBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  promptsList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  promptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
  },
  promptCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: '#10b981',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  promptTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  promptText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    fontStyle: 'italic',
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
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: '#10b981',
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
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  checklistLabel: {
    flex: 1,
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 18,
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
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
