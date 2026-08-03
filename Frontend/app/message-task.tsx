import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Pressable, Alert, AppState, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';
import { Feather, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 300; // 5 minutes in seconds

export default function MessageTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Steps:
  // 1: Introduction / Premium Layout
  // 2: Floating Contact Bubbles
  // 3: Inspiration Cards & Message Editor
  // 4: Animated Envelope Send (📨)
  // 5: 5-Minute Reflection Timer
  // 6: Success completion screen
  const [step, setStep] = useState(1);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isCustomMessage, setIsCustomMessage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Rotating reminders
  const reminders = [
    '💛 "That small message may brighten someone\'s day."',
    '🌸 "Connection grows through small actions."',
    '🌿 "Kindness always comes back."',
    '✨ "You chose connection over silence."'
  ];
  const [reminderIndex, setReminderIndex] = useState(0);

  // Message inspirations
  const inspirations = [
    { emoji: '💛', text: 'Thank you for always supporting me.' },
    { emoji: '🌸', text: 'I hope you\'re doing well.' },
    { emoji: '☀️', text: 'I was thinking about you today.' },
    { emoji: '🌿', text: 'Just wanted to say hello.' },
    { emoji: '🎉', text: 'I\'m grateful to have you.' }
  ];

  // Contact bubbles data
  const contacts = [
    { label: 'Mom', emoji: '👩', color: '#FEE2E2', textColor: '#991B1B' },
    { label: 'Dad', emoji: '👨', color: '#DBEAFE', textColor: '#1E40AF' },
    { label: 'Best Friend', emoji: '🧑', color: '#D1FAE5', textColor: '#065F46' },
    { label: 'Grandma', emoji: '👵', color: '#F3E8FF', textColor: '#6B21A8' },
    { label: 'Mentor', emoji: '👨‍🏫', color: '#FEF3C7', textColor: '#92400E' },
    { label: 'Someone Special', emoji: '❤️', color: '#FFE4E6', textColor: '#9F1239' },
    { label: 'Someone Else', emoji: '➕', color: '#E2E8F0', textColor: '#334155' }
  ];

  // Animated values
  const stepTransitionAnim = useRef(new Animated.Value(1)).current;
  const bgShiftAnim = useRef(new Animated.Value(0)).current;
  const floatMascotAnim = useRef(new Animated.Value(0)).current;
  const scaleMascotAnim = useRef(new Animated.Value(1)).current;
  const timerCircleBreathe = useRef(new Animated.Value(0.7)).current;
  const reminderFadeAnim = useRef(new Animated.Value(1)).current;

  // Contact bubbles individual hover animations
  const bubbleAnims = useRef(contacts.map(() => new Animated.Value(0))).current;

  // Envelope sending animations
  const envelopeFlap = useRef(new Animated.Value(0)).current; // 0 = open, 1 = closed
  const envelopeTranslateY = useRef(new Animated.Value(0)).current;
  const envelopeScale = useRef(new Animated.Value(1)).current;
  const envelopeOpacity = useRef(new Animated.Value(1)).current;

  // Confetti particles for envelope send
  const particleAnims = useRef(Array.from({ length: 6 }, () => ({
    x: new Animated.Value(width * 0.5),
    y: new Animated.Value(height * 0.4),
    op: new Animated.Value(0)
  }))).current;

  // Background AppState Recovery Tracking
  const appState = useRef(AppState.currentState);
  const endTimeRef = useRef<number>(0);

  // Sync background timer updates on resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (step === 5 && isActive && !isPaused) {
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            transitionToStep(6);
            setIsActive(false);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [step, isActive, isPaused]);

  // General animation loops setup
  useEffect(() => {
    // Mascot floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatMascotAnim, { toValue: -8, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatMascotAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Background color shifts
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShiftAnim, { toValue: 1, duration: 16000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
        Animated.timing(bgShiftAnim, { toValue: 0, duration: 16000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      ])
    ).start();

    // Mascot scale pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleMascotAnim, { toValue: 1.05, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleMascotAnim, { toValue: 0.95, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Timer circle breathe glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(timerCircleBreathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(timerCircleBreathe, { toValue: 0.7, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Contact bubbles independent hover oscillations
    bubbleAnims.forEach((anim, idx) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 250),
          Animated.timing(anim, { toValue: -10 - Math.random() * 8, duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2500 + Math.random() * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ])
      ).start();
    });
  }, []);

  // Timer countdown ticks
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused && timeLeft > 0) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            transitionToStep(6);
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, isActive, isPaused, timeLeft]);

  // Reminders rotation (Dev: 10s, Prod: 45s)
  useEffect(() => {
    let reminderTimer: ReturnType<typeof setInterval>;
    if (step === 5 && isActive && !isPaused) {
      const intervalMs = __DEV__ ? 10000 : 45000;
      reminderTimer = setInterval(() => {
        Animated.timing(reminderFadeAnim, { toValue: 0, duration: 550, useNativeDriver: true }).start(() => {
          setReminderIndex((prev) => (prev + 1) % reminders.length);
          Animated.timing(reminderFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        });
      }, intervalMs);
    }
    return () => {
      if (reminderTimer) clearInterval(reminderTimer);
    };
  }, [step, isActive, isPaused]);

  // Transition handler
  const transitionToStep = (nextStep: number) => {
    Animated.timing(stepTransitionAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(stepTransitionAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  // API Call: Start Task
  const handleStartTask = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ task_name: 'Message Someone You Know' })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(2);
  };

  // API Call: Save Message Contact
  const handleSelectContact = async (contactLabel: string) => {
    setSelectedContact(contactLabel);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-message-contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Message Someone You Know',
            contact_type: contactLabel
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(3);
  };

  // Select suggestion template
  const handleSelectTemplate = (templateText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessageText(templateText);
    setIsCustomMessage(false);
  };

  // API Call: Save Message Content
  const handleSaveMessageContent = async () => {
    if (!messageText.trim()) {
      Alert.alert('Empty Message', 'Please write or select a message before proceeding.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetch(`${API_BASE_URL}/api/tasks/save-message-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Message Someone You Know',
            contact_type: selectedContact,
            message_content: messageText,
            is_custom: isCustomMessage
          })
        });
      }
    } catch (e) {
      console.error(e);
    }
    transitionToStep(4);
  };

  // Screen 4: Trigger flying envelope animation
  const handleSendAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // 1. Fold flap down (closes the envelope)
    Animated.timing(envelopeFlap, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      // 2. Blast confetti particles outward
      const particleSprings = particleAnims.map((p, idx) => {
        const angle = (idx * 60 * Math.PI) / 180;
        const radius = 60 + Math.random() * 40;
        const targetX = width * 0.5 + Math.cos(angle) * radius;
        const targetY = height * 0.35 + Math.sin(angle) * radius;

        return Animated.parallel([
          Animated.timing(p.x, { toValue: targetX, duration: 800, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: targetY, duration: 800, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.op, { toValue: 0.8, duration: 150, useNativeDriver: true }),
            Animated.timing(p.op, { toValue: 0, duration: 650, delay: 100, useNativeDriver: true })
          ])
        ]);
      });

      // 3. Scale down and fly upward off-screen
      Animated.parallel([
        ...particleSprings,
        Animated.sequence([
          Animated.timing(envelopeScale, { toValue: 0.85, duration: 200, useNativeDriver: true }),
          Animated.timing(envelopeTranslateY, { toValue: -height * 0.75, duration: 800, easing: Easing.back(0.8), useNativeDriver: true }),
        ]),
        Animated.timing(envelopeOpacity, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true })
      ]).start(() => {
        // Transition to timer screen
        transitionToStep(5);
        setIsActive(true);
      });
    });
  };

  // API Call: complete task and claim points
  const handleCompleteTask = async () => {
    if (isLoading) return;
    setIsLoading(true);
    let pointsData = { pointsAdded: '200', totalPoints: '0', streak: '0' };
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            task_name: 'Message Someone You Know',
            contact_type: selectedContact,
            message_content: messageText,
            is_custom: isCustomMessage
          })
        });
        const data = await response.json();
        if (response.ok || data.success) {
          pointsData = {
            pointsAdded: data.pointsAdded?.toString() || '200',
            totalPoints: data.totalPoints?.toString() || '0',
            streak: data.streak?.toString() || '0'
          };
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Error', data.error || 'Failed to submit task completion');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Connection Error', 'Network request failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }

    // Route to success screen
    router.replace({
      pathname: '/task-success',
      params: {
        points: pointsData.pointsAdded,
        totalPoints: pointsData.totalPoints,
        streak: pointsData.streak,
        message: 'You reached out.',
        difficulty: 'medium'
      }
    } as any);
  };

  // Dev double tap skip
  const lastPress = useRef(0);
  const handleDevSkip = () => {
    if (__DEV__) {
      const time = Date.now();
      const delta = time - lastPress.current;
      lastPress.current = time;
      if (delta < 300) {
        setTimeLeft(3);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Interpolations for envelope flap folding
  const flapRotation = envelopeFlap.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />

      {/* Breathing cozy evening Room Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: scaleMascotAnim }] }]}>
        <LinearGradient
          colors={['#FFF1E6', '#FFF8F2', '#FFE5D9']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgShiftAnim }]}>
        <LinearGradient
          colors={['#FFF8F2', '#FFE5D9', '#FFD8BE']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Vignette Overlay */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation HUD Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Abort Message?",
                "Are you sure you want to stop? Your progress will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Abort", style: "destructive", onPress: () => router.back() }
                ]
              );
            }}
            style={styles.backBtn}
          >
            <View style={styles.backIconWrapper}>
              <Feather name="x" size={18} color="#EA580C" />
            </View>
            <Text style={styles.backText}>ABORT</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <View style={[styles.dotIndicator, step === 5 && isActive && !isPaused && { backgroundColor: '#EA580C', shadowColor: '#EA580C' }]} />
            <Text style={styles.statusText}>
              {step === 5 ? (isPaused ? 'TIMER.PAUSE' : 'TIMER.ACTIVE') : `MSG.STEP_${step}`}
            </Text>
          </View>
        </View>

        {/* Slide Step Content */}
        <Animated.View style={[styles.mainContent, { opacity: stepTransitionAnim }]}>

          {/* STEP 1: Details Greet Layout */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Animated.View style={[styles.mascotCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.mainEmoji}>💌</Text>
              </Animated.View>

              <View style={styles.introMeta}>
                <Text style={styles.taskTitle}>Message Someone You Know</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.mediumBadge]}>
                    <Text style={styles.mediumBadgeText}>⭐ Medium</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(234, 88, 12, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#EA580C' }]}>+200 Pts</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                    <Text style={[styles.badgeText, { color: '#4F46E5' }]}>5 Min</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.quoteText}>
                  "A message takes seconds to send but can stay in someone's heart forever."
                </Text>
                <View style={styles.divider} />
                <Text style={styles.illustrationText}>
                  "Someone might be happy to hear from you today."
                </Text>
                <Text style={styles.cardDescription}>
                  Reach out to a family member, friend, classmate, mentor, or someone who has supported you recently. A small message strengthens relationships.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTask} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>Choose Someone</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Playful Floating Contact Bubbles */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Who are you reaching?</Text>
              <Text style={styles.stepSubtitle}>
                Select one person to send a warm word of appreciation or hello.
              </Text>

              <View style={styles.bubblesContainer}>
                {contacts.map((contact, idx) => {
                  const floatY = bubbleAnims[idx];
                  return (
                    <Animated.View
                      key={contact.label}
                      style={[
                        styles.bubbleItem,
                        { transform: [{ translateY: floatY }] }
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.bubbleBtn, { backgroundColor: contact.color }]}
                        onPress={() => handleSelectContact(contact.label)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bubbleEmoji}>{contact.emoji}</Text>
                        <Text style={[styles.bubbleLabel, { color: contact.textColor }]}>{contact.label}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Inspiration Cards & Message Editor */}
          {step === 3 && (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Write to {selectedContact}</Text>
                <Text style={styles.stepSubtitle}>
                  Choose one of the suggestions below, or write a custom message from your heart.
                </Text>

                {/* Horizontal scroll inspiration cards */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.inspirationScroll}
                >
                  {inspirations.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.inspCard}
                      onPress={() => handleSelectTemplate(item.text)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.inspIcon}>{item.emoji}</Text>
                      <Text style={styles.inspText}>{item.text}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Text Editor Box */}
                <View style={styles.editorContainer}>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={6}
                    placeholder="Type your message here..."
                    placeholderTextColor="#94A3B8"
                    value={messageText}
                    onChangeText={(txt) => {
                      setMessageText(txt);
                      setIsCustomMessage(true);
                    }}
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveMessageContent} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#F97316', '#EA580C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.btnText}>Save Message</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* STEP 4: Animated Envelope Send */}
          {step === 4 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              {/* Confetti particles */}
              {particleAnims.map((p, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.confettiParticle,
                    {
                      transform: [{ translateX: p.x }, { translateY: p.y }],
                      opacity: p.op
                    }
                  ]}
                />
              ))}

              {/* Closed Envelope Layout */}
              <Animated.View
                style={[
                  styles.envelopeWrapper,
                  {
                    transform: [
                      { translateY: envelopeTranslateY },
                      { scale: envelopeScale }
                    ],
                    opacity: envelopeOpacity
                  }
                ]}
              >
                {/* Envelope Base */}
                <View style={styles.envelopeBase}>
                  {/* Flap */}
                  <Animated.View
                    style={[
                      styles.envelopeFlap,
                      { transform: [{ rotateX: flapRotation }], zIndex: 5 }
                    ]}
                  />
                  <Text style={styles.envelopeIcon}>📨</Text>
                </View>
              </Animated.View>

              <Text style={styles.sendHeading}>Ready to send?</Text>
              <Text style={styles.sendSubtext}>
                Copy the message you wrote and paste it into your favorite chat app (WhatsApp, iMessage, SMS) to send it to {selectedContact}.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendAnimation} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.btnText}>I've Sent It</Text>
                  <Feather name="send" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: 5-Minute Reflection Timer */}
          {step === 5 && (
            <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
              <Animated.View style={[styles.timerCircle, { transform: [{ translateY: floatMascotAnim }, { scale: scaleMascotAnim }] }]}>
                <Text style={styles.timerEmojiIcon}>💌</Text>
              </Animated.View>

              <Pressable onPress={handleDevSkip}>
                <Animated.Text style={[styles.timerTextDisplay, { opacity: timerCircleBreathe }]}>
                  {formatTime(timeLeft)}
                </Animated.Text>
              </Pressable>

              <Animated.View style={[styles.reminderCard, { opacity: reminderFadeAnim }]}>
                <Text style={styles.reminderText}>
                  {reminders[reminderIndex]}
                </Text>
              </Animated.View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, isPaused ? styles.resumeBtn : styles.pauseBtn]}
                  onPress={() => setIsPaused(!isPaused)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.controlBtnText, isPaused && { color: '#FFFFFF' }]}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 6: Success Completion Screen */}
          {step === 6 && (
            <View style={styles.successContainer}>
              <Text style={styles.successLargeEmoji}>💌</Text>
              <Text style={styles.successHeading}>You reached out.</Text>
              <Text style={styles.successContext}>
                Taking a moment to send a warm word of appreciation helps maintain strong real-world social relationships and makes the recipient feel deeply valued.
              </Text>

              <TouchableOpacity
                style={styles.claimBtn}
                onPress={handleCompleteTask}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientClaimBtn}
                >
                  <Text style={styles.claimBtnText}>
                    {isLoading ? "Saving response..." : "Claim +200 Task Points"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E6',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(234, 88, 12, 0.01)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(234,88,12,0.15)',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C2D12',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  mainEmoji: {
    fontSize: 70,
  },
  introMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediumBadge: {
    backgroundColor: '#FEF08A',
  },
  mediumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#7C2D12',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    marginVertical: 14,
  },
  illustrationText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  bubblesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    paddingTop: 10,
  },
  bubbleItem: {
    width: width * 0.4,
    height: width * 0.28,
  },
  bubbleBtn: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
  },
  bubbleEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  bubbleLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  inspirationScroll: {
    gap: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  inspCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.1)',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  inspIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  inspText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    lineHeight: 16,
  },
  editorContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.12)',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  textInput: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 140,
  },
  envelopeWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  envelopeBase: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF8F2',
    borderWidth: 2,
    borderColor: '#EA580C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#EA580C',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  envelopeFlap: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 120,
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#EA580C',
    backgroundColor: '#FFF3EB',
  },
  envelopeIcon: {
    fontSize: 64,
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  sendHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10,
  },
  sendSubtext: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 35,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#EA580C',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  timerEmojiIcon: {
    fontSize: 60,
  },
  timerTextDisplay: {
    fontSize: 78,
    fontWeight: '200',
    color: '#7C2D12',
    letterSpacing: 2,
    marginBottom: 15,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(234, 88, 12, 0.08)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  reminderCard: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C2D12',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerControls: {
    width: '60%',
    alignItems: 'center',
  },
  controlBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  pauseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  resumeBtn: {
    backgroundColor: '#EA580C',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  successLargeEmoji: {
    fontSize: 84,
    marginBottom: 20,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  successContext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  claimBtn: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  gradientClaimBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
