import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TaskSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { points } = useLocalSearchParams<{ points: string }>();
  const displayPoints = points ?? '300';

  // Animation values
  const circleScale   = useRef(new Animated.Value(0)).current;  // main circle: springs in
  const checkOpacity  = useRef(new Animated.Value(0)).current;  // check icon fades in after
  const ring1Scale    = useRef(new Animated.Value(1)).current;  // ripple ring 1
  const ring1Opacity  = useRef(new Animated.Value(0.6)).current;
  const ring2Scale    = useRef(new Animated.Value(1)).current;  // ripple ring 2 (delayed)
  const ring2Opacity  = useRef(new Animated.Value(0.4)).current;
  const contentSlide  = useRef(new Animated.Value(30)).current; // title+card slide up
  const contentOpacity= useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Circle spring pop
    Animated.spring(circleScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // 2. Check icon fades in slightly after circle settles
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Ripple ring 1 – starts after circle pops
    const ringLoop1 = () => {
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0.55);
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 2.2,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]).start(() => ringLoop1());
    };

    // 4. Ripple ring 2 – 500ms offset
    const ringLoop2 = () => {
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0.4);
      Animated.parallel([
        Animated.timing(ring2Scale, {
          toValue: 2.2,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]).start(() => ringLoop2());
    };

    setTimeout(() => ringLoop1(), 300);
    setTimeout(() => ringLoop2(), 700);

    // 5. Content slides up
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" backgroundColor="#fafafa" />

      <View style={styles.content}>
        {/* Ripple rings behind circle */}
        <View style={styles.circleWrapper}>
          <Animated.View
            style={[styles.ripple, {
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            }]}
          />
          <Animated.View
            style={[styles.ripple, {
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            }]}
          />

          {/* Main green check circle with spring pop */}
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: circleScale }] }]}>
            <Animated.View style={{ opacity: checkOpacity }}>
              <Feather name="check" size={46} color="#ffffff" />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Title & Subtitle slide up */}
        <Animated.View style={{ alignItems: 'center', opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
          <Text style={styles.title}>Well done.</Text>
          <Text style={styles.subtitle}>You showed up today.</Text>

          {/* Points Card */}
          <View style={styles.pointsCard}>
            <Text style={styles.partyEmoji}>🎉</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsValue}>+{displayPoints}</Text>
              <Text style={styles.pointsLabel}> points earned</Text>
            </View>
            <Text style={styles.dayComplete}>Day complete</Text>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Continue button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.continueButton}
          onPress={() => router.replace('/(tabs)/tasks')}
        >
          <LinearGradient
            colors={['#8b5cf6', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.continueText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 24,
  },
  circleWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  ripple: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#22c55e',
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    marginBottom: 40,
  },
  pointsCard: {
    width: '100%',
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  partyEmoji: {
    fontSize: 42,
    marginBottom: 14,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#7c3aed',
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 3,
  },
  dayComplete: {
    fontSize: 15,
    color: '#6b7280',
  },
  continueButton: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
});
