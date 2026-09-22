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

const TASK_ID = 141;
const TASK_NAME = 'One Brave Step';
const TASK_POINTS = 600;

// Page 2: Brave Action Archetypes
const BRAVE_CATEGORIES = [
  {
    id: 'speak_up',
    title: 'Speak Up Authentically',
    emoji: '🗣️',
    desc: 'Voice your true opinion or disagreement in a meeting or group setting.',
  },
  {
    id: 'ask_help',
    title: 'Ask for Help Vulnerably',
    emoji: '🙋',
    desc: 'Reach out to someone for assistance instead of struggling in isolation.',
  },
  {
    id: 'boundary',
    title: 'Set a Healthy Boundary',
    emoji: '🛡️',
    desc: 'Say a respectful "No" to a request or dynamic that depletes you.',
  },
  {
    id: 'start_important',
    title: 'Start Something Important',
    emoji: '🚀',
    desc: 'Submit that application, publish that work, or take the first concrete leap.',
  },
  {
    id: 'try_new',
    title: 'Try Something New',
    emoji: '🧭',
    desc: 'Walk into an unfamiliar class, event, or social environment alone.',
  },
  {
    id: 'face_fear',
    title: 'Face a Small Daily Fear',
    emoji: '⚡',
    desc: 'Make the call you dread, speak to a stranger, or perform in public.',
  },
];

// Page 4: Execution Checklist
const EXECUTION_CHECKLIST = [
  { id: 'b1', label: 'Felt the surge of physical discomfort/resistance in my body.' },
  { id: 'b2', label: 'Took the brave step anyway without backing down.' },
  { id: 'b3', label: 'Stayed present throughout the action and survived it fully.' },
];

// Page 6: Feelings after the brave step
const REFLECTION_FEELINGS = [
  { id: 'exhilarated', label: 'Exhilarated & Alive', emoji: '🔥' },
  { id: 'proud', label: 'Deeply Proud of Myself', emoji: '🦁' },
  { id: 'expanded', label: 'My World Just Expanded', emoji: '🌌' },
  { id: 'relieved', label: 'Relieved & Unburdened', emoji: '🕊️' },
  { id: 'unstoppable', label: 'Ready for Next Challenge', emoji: '⚡' },
];

export default function OneBraveStepTaskScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Page 2 State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Page 3 State: Preparation & Specific Action
  const [actionDescription, setActionDescription] = useState<string>('');
  const [courageAnchor, setCourageAnchor] = useState<string>('Even if my hands shake, my dignity and growth come first.');

  // Page 4 State: Execution Checklist
  const [checkedExecution, setCheckedExecution] = useState<string[]>([]);

  // Page 5 State: Reality vs Illusion debrief
  const [debriefText, setDebriefText] = useState<string>('');

  // Page 6 State: Final Reflection & Completion
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

  const toggleExecutionItem = (id: string) => {
    Haptics.selectionAsync?.();
    setCheckedExecution((prev) =>
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
          brave_category: selectedCategory,
          action_taken: actionDescription.trim(),
          courage_anchor: courageAnchor.trim(),
          debrief_note: debriefText.trim(),
          reflection_emotion: selectedFeeling,
          reflection_sentence: reflectionText.trim(),
        }),
      });

      const responseText = await response.text();
      console.log(`[One Brave Step] POST /api/tasks/complete status: ${response.status}`);

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[One Brave Step JSON Parse Error] HTTP ${response.status}:`, responseText.slice(0, 300));
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
          message: 'You chose courage over comfort and created lasting expansion.',
          rewardClaimed: isDuplicate ? 'false' : 'true',
        },
      } as any);
    } catch (err: any) {
      console.error('One Brave Step completion error:', err);
      setErrorMessage(err?.message || 'Network request failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Royal Violet Obsidian Gradient */}
      <LinearGradient
        colors={['#140a26', '#210e3e', '#0b0416']}
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
            <Text style={styles.headerTitle}>One Brave Step</Text>
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
                      colors={['#a855f7', '#7c3aed']}
                      style={styles.heroIconGradient}
                    >
                      <Feather name="zap" size={44} color="#ffffff" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={styles.hardPill}>
                    <Ionicons name="flame" size={14} color="#a855f7" />
                    <Text style={styles.hardPillText}>HARD MASTERY CHALLENGE</Text>
                  </View>

                  <Text style={styles.pageTitle}>Take One Uncomfortable Step</Text>
                  <Text style={styles.pageBody}>
                    Courage is not something you wait to feel; it is a choice you practice before the fear subsides. One brave constructive action rewires how you perceive your limits.
                  </Text>

                  <View style={styles.highlightBox}>
                    <Feather name="compass" size={18} color="#a855f7" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={styles.highlightText}>
                      Choose an action that gives you butterflies in the stomach. Prepare your grounding anchor, take the action in the real world, and discover the truth on the other side.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => goToPage(2)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#a855f7', '#7c3aed']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Choose Your Brave Step</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 2: CHOOSE CATEGORY */}
              {currentPage === 2 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 1: CHOOSE</Text>
                  <Text style={styles.pageTitle}>Which Frontier Calls You?</Text>
                  <Text style={styles.pageBody}>
                    Select the arena where an uncomfortable, courageous move will deliver the highest growth:
                  </Text>

                  <View style={styles.categoryList}>
                    {BRAVE_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryCard,
                            isSelected && styles.categoryCardSelected,
                          ]}
                          onPress={() => setSelectedCategory(cat.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.categoryTitle}>{cat.title}</Text>
                            <Text style={styles.categoryDesc}>{cat.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !selectedCategory && styles.btnDisabled,
                    ]}
                    disabled={!selectedCategory}
                    onPress={() => goToPage(3)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        selectedCategory
                          ? ['#a855f7', '#7c3aed']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Define Specific Step</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 3: DEFINE & PREPARE */}
              {currentPage === 3 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 2: PREPARE</Text>
                  <Text style={styles.pageTitle}>Define Your Exact Action</Text>
                  <Text style={styles.pageBody}>
                    Ambiguity breeds hesitation. State the concrete action in exact, specific terms:
                  </Text>

                  <Text style={styles.fieldLabel}>What exact step will you take?</Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., I will raise my hand to speak during today's meeting, or ask the store manager for help directly..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    value={actionDescription}
                    onChangeText={setActionDescription}
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                    Your Courage Anchor Statement:
                  </Text>
                  <TextInput
                    style={[styles.multilineInput, { minHeight: 70 }]}
                    value={courageAnchor}
                    onChangeText={setCourageAnchor}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      actionDescription.trim().length < 6 && styles.btnDisabled,
                    ]}
                    disabled={actionDescription.trim().length < 6}
                    onPress={() => goToPage(4)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        actionDescription.trim().length >= 6
                          ? ['#a855f7', '#7c3aed']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Proceed to Execution</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 4: DO (EXECUTION) */}
              {currentPage === 4 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 3: DO IT</Text>
                  <Text style={styles.pageTitle}>Step Past the Boundary</Text>
                  <Text style={styles.pageBody}>
                    Perform your brave step in the physical world. Check all 3 items once you have stepped through:
                  </Text>

                  <View style={styles.checklistContainer}>
                    {EXECUTION_CHECKLIST.map((item) => {
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
                      checkedExecution.length < EXECUTION_CHECKLIST.length && styles.btnDisabled,
                    ]}
                    disabled={checkedExecution.length < EXECUTION_CHECKLIST.length}
                    onPress={() => goToPage(5)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        checkedExecution.length === EXECUTION_CHECKLIST.length
                          ? ['#a855f7', '#7c3aed']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Verify & Debrief</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 5: VERIFY & DEBRIEF */}
              {currentPage === 5 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 4: REALITY VS ILLUSION</Text>
                  <Text style={styles.pageTitle}>What Proved to Be True?</Text>
                  <Text style={styles.pageBody}>
                    Our brain exaggerates danger before action. What did you observe about the actual consequence versus your imagination?
                  </Text>

                  <Text style={styles.fieldLabel}>Debrief notes:</Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., The other person smiled and was super receptive. My heart was pounding for 30 seconds, but then everything felt completely natural..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    value={debriefText}
                    onChangeText={setDebriefText}
                  />

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      debriefText.trim().length < 8 && styles.btnDisabled,
                    ]}
                    disabled={debriefText.trim().length < 8}
                    onPress={() => goToPage(6)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        debriefText.trim().length >= 8
                          ? ['#a855f7', '#7c3aed']
                          : ['#374151', '#1f2937']
                      }
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>Proceed to Celebration</Text>
                      <Feather name="arrow-right" size={18} color="#ffffff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* PAGE 6: REFLECTION & COMPLETION */}
              {currentPage === 6 && (
                <View style={styles.pageCard}>
                  <Text style={styles.sectionOverline}>STAGE 5: DEBRIEF & REWARD</Text>
                  <Text style={styles.pageTitle}>Your Comfort Zone Expanded</Text>
                  <Text style={styles.pageBody}>
                    How does your relationship with courage feel right now?
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
                    One sentence on how this brave step moved your life forward:
                  </Text>
                  <TextInput
                    style={styles.multilineInput}
                    placeholder="E.g., I proved to myself that discomfort cannot stop me from doing what matters..."
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
                      <Text style={styles.rewardPoints}>+600 Points • High Courage Mastery</Text>
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
                          ? ['#a855f7', '#7c3aed']
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
    backgroundColor: '#140a26',
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
    color: '#a855f7',
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
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a855f7',
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
    backgroundColor: 'rgba(168, 85, 247, 0.5)',
  },
  progressDotCurrent: {
    backgroundColor: '#a855f7',
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
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
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    marginBottom: 12,
    gap: 4,
  },
  hardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a855f7',
    letterSpacing: 0.6,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a855f7',
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
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
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
  categoryList: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderColor: '#a855f7',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
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
    minHeight: 80,
    marginBottom: 20,
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
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderColor: '#a855f7',
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
    backgroundColor: '#7c3aed',
    borderColor: '#a855f7',
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
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: '#a855f7',
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
