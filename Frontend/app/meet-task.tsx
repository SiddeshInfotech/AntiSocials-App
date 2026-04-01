import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

type Phase = 'plan' | 'confirm';

export default function MeetTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const basePoints = 700;
  const streakBonus = 150;
  const challengeWindowMs = 48 * 60 * 60 * 1000;

  const [phase, setPhase] = useState<Phase>('plan');
  const [friendName, setFriendName] = useState('');
  const [meetingPlan, setMeetingPlan] = useState('');
  const [startsAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const formCardRef = useRef<View>(null);
  const friendInputRef = useRef<View>(null);
  const meetingInputRef = useRef<View>(null);

  const progress = useMemo(() => (phase === 'plan' ? 0.5 : 1), [phase]);
  const pulse = useRef(new Animated.Value(1)).current;

  const canContinue = friendName.trim().length > 1 && meetingPlan.trim().length > 5;
  const deadline = startsAt + challengeWindowMs;
  const remainingMs = Math.max(deadline - now, 0);
  const withinChallenge = remainingMs > 0;
  const totalPoints = withinChallenge ? basePoints + streakBonus : basePoints;

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleContinue = () => {
    if (!canContinue) return;

    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 140, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => setPhase('confirm'));
  };

  const handleComplete = () => {
    router.replace({
      pathname: '/task-complete',
      params: {
        type: 'meet',
        points: String(totalPoints),
      },
    } as any);
  };

  const scrollToField = (fieldRef: React.RefObject<View | null>) => {
    if (!fieldRef.current || !formCardRef.current || !scrollRef.current) return;

    setTimeout(() => {
      fieldRef.current?.measureLayout(
        formCardRef.current as any,
        (_x, y) => {
          scrollRef.current?.scrollTo({ y: Math.max(y + 320, 0), animated: true });
        },
        () => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      );
    }, 80);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0f766e', '#155e75']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 6 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tasks'))}
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Real-World Connection</Text>
        <Text style={styles.headerSubtitle}>Meet one friend in real life</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 22) + 90 + Math.max(0, keyboardHeight - 40) },
        ]}
      >
        <Animated.View style={[styles.heroCard, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.emoji}>🧑‍🤝‍🧑</Text>
          <Text style={styles.heroTitle}>One in-person meetup</Text>
          <Text style={styles.heroText}>
            Keep it simple: chai, coffee, a short walk, or even 20 minutes at a park bench.
          </Text>
          <View style={styles.pointsPill}>
            <Feather name="award" size={14} color="#0f766e" />
            <Text style={styles.pointsText}>+{totalPoints} points</Text>
          </View>
        </Animated.View>

        <View style={styles.timerCard}>
          <View style={styles.timerTitleRow}>
            <Feather name="clock" size={16} color="#0f766e" />
            <Text style={styles.timerTitle}>48-Hour Challenge Window</Text>
          </View>
          <Text style={styles.timerValue}>{formatRemaining(remainingMs)}</Text>
          <Text style={styles.timerNote}>
            {withinChallenge
              ? `Finish in time to get +${streakBonus} streak bonus points.`
              : 'Challenge expired. Base points are still available.'}
          </Text>
        </View>

        {phase === 'plan' ? (
          <View style={styles.formCard} ref={formCardRef}>
            <Text style={styles.sectionTitle}>Step 1: Set your plan</Text>
            <Text style={styles.inputLabel}>Friend name</Text>
            <View ref={friendInputRef}>
            <TextInput
              value={friendName}
              onChangeText={setFriendName}
              placeholder="Who will you meet?"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              autoCapitalize="words"
              onFocus={() => scrollToField(friendInputRef)}
            />
            </View>

            <Text style={styles.inputLabel}>When/where?</Text>
            <View ref={meetingInputRef}>
            <TextInput
              value={meetingPlan}
              onChangeText={setMeetingPlan}
              placeholder="Example: Friday 6 PM at the tea stall"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.multilineInput]}
              multiline
              textAlignVertical="top"
              onFocus={() => scrollToField(meetingInputRef)}
            />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!canContinue}
            >
              <Text style={styles.primaryBtnText}>Save Plan & Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Step 2: Confirm completion</Text>
            <Text style={styles.confirmText}>
              Nice. You planned to meet {friendName.trim()} at: {meetingPlan.trim()}
            </Text>
            <Text style={styles.tipText}>
              Spend a few minutes fully present: no notifications, no rushing, just conversation.
            </Text>

            <View style={styles.bonusCard}>
              <Text style={styles.bonusLine}>Base points: +{basePoints}</Text>
              <Text style={styles.bonusLine}>Streak bonus: {withinChallenge ? `+${streakBonus}` : '+0'}</Text>
              <Text style={styles.bonusTotal}>Total on completion: +{totalPoints}</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Complete Task</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPhase('plan')} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Edit Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    marginTop: 2,
    marginBottom: 14,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    backgroundColor: '#fef08a',
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  pointsPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  pointsText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    gap: 10,
  },
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#99f6e4',
    padding: 16,
  },
  timerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerTitle: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '700',
  },
  timerValue: {
    marginTop: 8,
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timerNote: {
    marginTop: 4,
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#0f172a',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 92,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#0f766e',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  tipText: {
    marginTop: 2,
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  bonusCard: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
    padding: 12,
    gap: 4,
  },
  bonusLine: {
    color: '#155e75',
    fontSize: 13,
    fontWeight: '600',
  },
  bonusTotal: {
    marginTop: 3,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#0f766e',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  secondaryBtnText: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '700',
  },
});
