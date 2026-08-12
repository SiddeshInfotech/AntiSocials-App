import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '../constants/Api';

const ORBIT_RADIUS = 50;
const DIGIT_NODE_SIZE = 34;

// Precise coordinates for each of the 6 digits: from input positions to 60-degree circular orbit
const DIGIT_TRANSITIONS = [0, 1, 2, 3, 4, 5].map((i) => {
  const xStart = (i - 2.5) * 54;
  const yStart = 0;
  const angle = (i * 60 - 90) * (Math.PI / 180);
  const xCircle = ORBIT_RADIUS * Math.cos(angle);
  const yCircle = ORBIT_RADIUS * Math.sin(angle);
  return { xStart, yStart, xCircle, yCircle };
});

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    purpose?: string;
    username?: string;
    email?: string;
    profession?: string;
    about?: string;
    imageUrl?: string;
    devOtp?: string;
    pincode?: string;
    city?: string;
    state?: string;
  }>();

  const phone = params.phone || '';
  const purpose = params.purpose || 'login';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(26);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVerifiedState, setIsVerifiedState] = useState(false);
  const [error, setError] = useState('');

  // 1. Cinematic Detach, Orbit & Verification Energy Values
  const formProgress = useRef(new Animated.Value(0)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const colorProgress = useRef(new Animated.Value(0)).current;
  const digitsCollapse = useRef(new Animated.Value(1)).current;
  const digitsOpacity = useRef(new Animated.Value(1)).current;
  const trailGlowOpacity = useRef(new Animated.Value(0)).current;

  // 2. Center Merge, Success Badge & Aura Ripple Values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.6)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const auraRippleScale = useRef(new Animated.Value(0.9)).current;
  const auraRippleOpacity = useRef(new Animated.Value(0.5)).current;

  // 3. Confirmation Label Values
  const confirmationOpacity = useRef(new Animated.Value(0)).current;
  const confirmationTranslateY = useRef(new Animated.Value(8)).current;

  // 4. Cinematic App Transition Values (Zoom & Dissolve)
  const screenScale = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Resend cooldown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const triggerSuccessAnimation = (destination: string) => {
    setIsAnimating(true);

    // Reset all animated properties
    formProgress.setValue(0);
    orbitRotation.setValue(0);
    colorProgress.setValue(0);
    digitsCollapse.setValue(1);
    digitsOpacity.setValue(1);
    trailGlowOpacity.setValue(0);

    successScale.setValue(0);
    successOpacity.setValue(0);
    checkScale.setValue(0.6);
    checkOpacity.setValue(0);
    auraRippleScale.setValue(0.9);
    auraRippleOpacity.setValue(0.5);

    confirmationOpacity.setValue(0);
    confirmationTranslateY.setValue(8);
    screenScale.setValue(1);
    screenOpacity.setValue(1);

    // =========================================================================
    // STEP 1: FLUID DETACHMENT & MOVE INTO CIRCULAR ORBIT (0 - 450ms)
    // =========================================================================
    Animated.parallel([
      Animated.timing(formProgress, {
        toValue: 1,
        duration: 450,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(trailGlowOpacity, {
        toValue: 0.35,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(colorProgress, {
        toValue: 1,
        duration: 2800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // =========================================================================
    // STEP 2: 3-SECOND CINEMATIC ORBIT ROTATION (400ms - 3400ms)
    // =========================================================================
    setTimeout(() => {
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.bezier(0.25, 0.1, 0.15, 1),
        useNativeDriver: true,
      }).start();
    }, 400);

    // =========================================================================
    // STEP 3: DECELERATE, MERGE INWARD & REVEAL SUCCESS BADGE (3400ms)
    // =========================================================================
    setTimeout(() => {
      setIsVerifiedState(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (_) {}

      Animated.parallel([
        // Digits smoothly move toward center & fade
        Animated.timing(digitsCollapse, {
          toValue: 0.1,
          duration: 240,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(digitsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(trailGlowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),

        // Green verification circle springs into center
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),

        // Animated checkmark reveal
        Animated.sequence([
          Animated.delay(60),
          Animated.parallel([
            Animated.timing(checkOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(checkScale, {
              toValue: 1,
              friction: 6,
              tension: 70,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // Soft aura ripple wave
        Animated.sequence([
          Animated.delay(80),
          Animated.parallel([
            Animated.timing(auraRippleScale, {
              toValue: 1.6,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(auraRippleOpacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // "Verified Successfully" text
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(confirmationOpacity, {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(confirmationTranslateY, {
              toValue: 0,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }, 3400);

    // =========================================================================
    // STEP 4: CINEMATIC ZOOM/FADE APP TRANSITION (4600ms)
    // =========================================================================
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(screenScale, {
          toValue: 1.04,
          duration: 280,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace(destination as any);
      });
    }, 4600);
  };

  const handleResend = async () => {
    setTimer(26);
    setError('');
    try {
      const response = await apiFetch('/auth/send-otp', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, purpose }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Network error.");
    }
  };

  const handleChange = (text: string, index: number) => {
    setError('');
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) {
      const pastedDigits = numericValue.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputs.current[nextIndex]?.focus();
      if (pastedDigits.length === 6) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (numericValue && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  const handleVerify = async (codeToVerify?: string) => {
    const otpCode = typeof codeToVerify === 'string' ? codeToVerify : otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (isLoading || isAnimating) return;

    setError('');
    setIsLoading(true);

    try {
      // 1. Verify OTP with backend
      const verifyRes = await apiFetch('/auth/verify-otp', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otp: otpCode, purpose }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "Invalid OTP. Please try again.");
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        } catch (_) {}
        setIsLoading(false);
        return;
      }

      // 2. Perform Login or Register
      if (purpose === 'signup') {
        const regRes = await apiFetch('/auth/register', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone,
            username: params.username,
            email: params.email,
            profession: params.profession,
            about: params.about,
            imageUrl: params.imageUrl,
            pincode: params.pincode,
            city: params.city,
            state: params.state,
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) {
          setError(regData.error || "Failed to register");
          setIsLoading(false);
          return;
        }
        await SecureStore.setItemAsync('token', regData.token);
        if (regData.user && regData.user.id) {
          await SecureStore.setItemAsync('userId', regData.user.id.toString());
        }
        setIsLoading(false);
        triggerSuccessAnimation('/onboarding');
      } else {
        // purpose === 'login'
        const loginRes = await apiFetch('/auth/login', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          setError(loginData.error || "Login failed");
          setIsLoading(false);
          return;
        }
        await SecureStore.setItemAsync('token', loginData.token);
        if (loginData.user && loginData.user.id) {
          await SecureStore.setItemAsync('userId', loginData.user.id.toString());
        }
        setIsLoading(false);
        triggerSuccessAnimation('/(tabs)');
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Unable to connect to the server.");
      setIsLoading(false);
    }
  };

  // 3 Full rotations (1080deg) over 3 seconds
  const spin = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  // Counter-rotation keeps numbers strictly upright and readable while rotating
  const counterSpin = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1080deg'],
  });

  // Color interpolations to verified green
  const nodeBorderColor = colorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9333EA', '#10B981'],
  });

  const nodeBgColor = colorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FAF5FF', '#ECFDF5'],
  });

  const nodeTextColor = colorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#7E22CE', '#059669'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#8A2BE2', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: screenOpacity,
                transform: [{ scale: screenScale }],
              },
            ]}
          >
            {/* Security Shield Icon */}
            <View style={styles.iconContainer}>
              <Feather
                name={isVerifiedState ? "check-circle" : "shield"}
                size={28}
                color="#10B981"
              />
            </View>

            {/* Screen Headers */}
            <Text style={styles.title}>
              {isVerifiedState ? "Verified" : "Verify your number"}
            </Text>
            <Text style={styles.subtitle}>
              {isVerifiedState ? (
                "Your mobile number is verified."
              ) : (
                <>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.boldText}>{phone || '+91 XXXX XXXX'}</Text>
                </>
              )}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!isVerifiedState && !isAnimating ? (
              <Text style={styles.descriptionText}>
                This helps us confirm it's really you.
              </Text>
            ) : null}

            {/* Middle Section: Static Inputs OR Interactive Smooth Circular Orbit */}
            <View style={styles.otpSection}>
              {!isAnimating ? (
                /* Standard 6-Digit Horizontal Input Fields */
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        error ? styles.otpInputError : null,
                        digit ? styles.otpInputFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      selectionColor="#9333EA"
                      editable={!isLoading && !isAnimating}
                    />
                  ))}
                </View>
              ) : (
                /* Cinematic In-Place Orbit Stage */
                <View style={styles.animationStage}>
                  {/* Subtle Light Trail Halo Ring */}
                  <Animated.View
                    style={[
                      styles.trailGlowRing,
                      { opacity: trailGlowOpacity },
                    ]}
                  />

                  {/* Rotating Orbit Container */}
                  <Animated.View
                    style={[
                      styles.orbitContainer,
                      {
                        transform: [{ rotate: spin }],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          opacity: digitsOpacity,
                          transform: [{ scale: digitsCollapse }],
                        },
                      ]}
                    >
                      {DIGIT_TRANSITIONS.map((item, index) => {
                        // Fluid detachment from input position to circular orbit coordinate
                        const translateX = formProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [item.xStart, item.xCircle],
                        });
                        const translateY = formProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [item.yStart, item.yCircle],
                        });

                        return (
                          <Animated.View
                            key={index}
                            style={[
                              styles.orbitingDigitNode,
                              {
                                transform: [
                                  { translateX },
                                  { translateY },
                                ],
                                borderColor: nodeBorderColor,
                                backgroundColor: nodeBgColor,
                              },
                            ]}
                          >
                            <Animated.View
                              style={{
                                transform: [{ rotate: counterSpin }],
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Animated.Text
                                style={[
                                  styles.orbitingDigitText,
                                  { color: nodeTextColor },
                                ]}
                              >
                                {otp[index] || ''}
                              </Animated.Text>
                            </Animated.View>
                          </Animated.View>
                        );
                      })}
                    </Animated.View>
                  </Animated.View>

                  {/* Soft Aura Ripple Wave */}
                  <Animated.View
                    style={[
                      styles.auraRipple,
                      {
                        opacity: auraRippleOpacity,
                        transform: [{ scale: auraRippleScale }],
                      },
                    ]}
                  />

                  {/* Minimal Green Success Circle */}
                  <Animated.View
                    style={[
                      styles.successCheckCircle,
                      {
                        opacity: successOpacity,
                        transform: [{ scale: successScale }],
                      },
                    ]}
                  >
                    <Animated.View
                      style={{
                        opacity: checkOpacity,
                        transform: [{ scale: checkScale }],
                      }}
                    >
                      <Feather name="check" size={26} color="#FFFFFF" />
                    </Animated.View>
                  </Animated.View>
                </View>
              )}
            </View>

            {/* Bottom Actions OR Minimal Confirmation */}
            {isVerifiedState ? (
              <Animated.View
                style={[
                  styles.verifiedConfirmationWrap,
                  {
                    opacity: confirmationOpacity,
                    transform: [{ translateY: confirmationTranslateY }],
                  },
                ]}
              >
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={16} color="#047857" style={{ marginRight: 6 }} />
                  <Text style={styles.verifiedBadgeText}>Verified Successfully</Text>
                </View>
              </Animated.View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    isComplete && !isLoading && !isAnimating ? styles.buttonActive : styles.buttonDisabled,
                  ]}
                  disabled={!isComplete || isLoading || isAnimating}
                  onPress={() => handleVerify()}
                >
                  {isLoading || isAnimating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isComplete ? styles.buttonTextActive : styles.buttonTextDisabled,
                      ]}
                    >
                      Verify & Continue
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Resend Footer */}
                {timer > 0 ? (
                  <Text style={styles.footerText}>Resend code in {timer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={isLoading || isAnimating}>
                    <Text style={[styles.footerText, styles.linkText]}>Resend code</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '600',
    color: '#374151',
  },
  descriptionText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  otpSection: {
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: '#9333EA',
    backgroundColor: '#FAF5FF',
  },
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonActive: {
    backgroundColor: '#9333EA',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  linkText: {
    color: '#9333EA',
    fontWeight: '500',
  },

  // Cinematic Orbit Stage
  animationStage: {
    width: 144,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trailGlowRing: {
    position: 'absolute',
    width: ORBIT_RADIUS * 2 + 10,
    height: ORBIT_RADIUS * 2 + 10,
    borderRadius: (ORBIT_RADIUS * 2 + 10) / 2,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  orbitContainer: {
    width: 144,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  orbitingDigitNode: {
    position: 'absolute',
    left: 72 - DIGIT_NODE_SIZE / 2,
    top: 62 - DIGIT_NODE_SIZE / 2,
    width: DIGIT_NODE_SIZE,
    height: DIGIT_NODE_SIZE,
    borderRadius: DIGIT_NODE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  orbitingDigitText: {
    fontSize: 15,
    fontWeight: '700',
  },
  auraRipple: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  successCheckCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 6,
  },
  verifiedConfirmationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
  },
});
