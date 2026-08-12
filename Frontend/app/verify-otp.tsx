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
  Easing,
  Image,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '../constants/Api';

const ORBIT_RADIUS = 48;
const DIGIT_NODE_SIZE = 34;

// Transitions for each of the 6 digits: from horizontal input coordinate to circle coordinate
const DIGIT_TRANSITIONS = [0, 1, 2, 3, 4, 5].map((i) => {
  const xStart = (i - 2.5) * 54;
  const yStart = 0;
  const angle = (i * 60 - 90) * (Math.PI / 180);
  const xCircle = ORBIT_RADIUS * Math.cos(angle);
  const yCircle = ORBIT_RADIUS * Math.sin(angle);
  return { xStart, yStart, xCircle, yCircle };
});

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    purpose?: string;
    username?: string;
    email?: string;
    profession?: string;
    about?: string;
    imageUrl?: string;
    pincode?: string;
    city?: string;
    state?: string;
  }>();

  const phone = params.phone || '';
  const purpose = params.purpose || 'login';
  const displayPhone = phone ? `******${phone.slice(-4)}` : '+91 XXXX XXXX';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVerifiedState, setIsVerifiedState] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 1. Morphing & Orbit Animation Values
  const formProgress = useRef(new Animated.Value(0)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const colorProgress = useRef(new Animated.Value(0)).current;
  const digitsCollapse = useRef(new Animated.Value(1)).current;
  const digitsOpacity = useRef(new Animated.Value(1)).current;

  // 2. Success Checkmark & Glow / Ripple Values
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.8)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;
  const confirmationOpacity = useRef(new Animated.Value(0)).current;
  const confirmationTranslateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    // Play intro animation on mount
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

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

    // Reset animation values
    formProgress.setValue(0);
    orbitRotation.setValue(0);
    colorProgress.setValue(0);
    digitsCollapse.setValue(1);
    digitsOpacity.setValue(1);

    successScale.setValue(0);
    successOpacity.setValue(0);
    rippleScale.setValue(0.8);
    rippleOpacity.setValue(0.6);
    confirmationOpacity.setValue(0);
    confirmationTranslateY.setValue(6);

    // =========================================================================
    // STEP 1: DIGITS MOVE FROM INPUT POSITIONS INTO CIRCULAR FORMATION (0-380ms)
    // =========================================================================
    Animated.parallel([
      Animated.timing(formProgress, {
        toValue: 1,
        duration: 380,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(colorProgress, {
        toValue: 1,
        duration: 2800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // =========================================================================
    // STEP 2: CIRCULAR ORBIT ROTATION (3.0 SECONDS, EQUIDISTANT & UPRIGHT)
    // =========================================================================
    setTimeout(() => {
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }, 380);

    // =========================================================================
    // STEP 3: DIGITS COLLAPSE/MERGE & GREEN SUCCESS WITH GLOW/RIPPLE APPEARS
    // =========================================================================
    setTimeout(() => {
      setIsVerifiedState(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch (_) {}

      Animated.parallel([
        Animated.timing(digitsCollapse, {
          toValue: 0.1,
          duration: 220,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(digitsOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),

        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),

        Animated.sequence([
          Animated.delay(60),
          Animated.parallel([
            Animated.timing(rippleScale, {
              toValue: 1.5,
              duration: 650,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 650,
              useNativeDriver: true,
            }),
          ]),
        ]),

        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(confirmationOpacity, {
              toValue: 1,
              duration: 240,
              useNativeDriver: true,
            }),
            Animated.timing(confirmationTranslateY, {
              toValue: 0,
              duration: 240,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }, 3380);

    // =========================================================================
    // STEP 4: AUTOMATICALLY OPEN ANTISOCIAL APP
    // =========================================================================
    setTimeout(() => {
      router.replace(destination as any);
    }, 4500);
  };

  const handleOtpChange = (value: string, index: number) => {
    setError('');
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) {
      const pastedDigits = numericValue.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (pastedDigits.length === 6) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (numericValue && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

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
      // 1. Verify OTP with the backend
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

      // 2. Perform Login or Register based on purpose
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
          setError(regData.error || "Registration failed.");
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
          setError(loginData.error || "Login failed.");
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
      console.error("OTP Verification Error: ", err);
      setError("Unable to connect to the server.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setTimer(30);
    try {
      const response = await apiFetch('/auth/send-otp', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, purpose }),
      });
      if (response.ok) {
        Alert.alert('OTP Resent', 'A new verification code has been sent to your WhatsApp.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError("Network error. Could not resend.");
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  // 3 Full continuous rotations (1080deg) over 3 seconds
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
          <View style={styles.card}>
            {/* Logo */}
            <Animated.View style={[
              styles.logoContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Headers */}
            <Text style={styles.title}>
              {isVerifiedState ? "Verified" : "Verify OTP"}
            </Text>
            <Text style={styles.subtitle}>
              {isVerifiedState ? (
                "Your mobile number is verified."
              ) : (
                <>
                  Enter the 6-digit code sent to{'\n'}
                  <Text style={styles.boldText}>{displayPhone}</Text> via WhatsApp.
                </>
              )}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Middle Section: Inputs OR In-Place Circular Animation */}
            <View style={styles.otpSection}>
              {!isAnimating ? (
                /* 6-Digit Horizontal Inputs */
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.otpInput,
                        error ? styles.otpInputError : null,
                        digit ? styles.otpInputFilled : null
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      selectionColor="#9333EA"
                      editable={!isLoading && !isAnimating}
                    />
                  ))}
                </View>
              ) : (
                /* Dynamic In-Place Circular Animation Stage */
                <View style={styles.animationStage}>
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

                  {/* Subtle Glow / Ripple Ring */}
                  <Animated.View
                    style={[
                      styles.glowRippleRing,
                      {
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
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
                    <Feather name="check" size={26} color="#FFFFFF" />
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
                    (!isOtpComplete || isLoading || isAnimating) ? styles.buttonDisabled : styles.buttonActive
                  ]}
                  disabled={!isOtpComplete || isLoading || isAnimating}
                  onPress={() => handleVerify()}
                >
                  {isLoading || isAnimating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons 
                        name="whatsapp" 
                        size={22} 
                        color={!isOtpComplete ? "#9CA3AF" : "#FFFFFF"} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={[
                        styles.buttonText,
                        (!isOtpComplete) ? styles.buttonTextDisabled : styles.buttonTextActive
                      ]}>
                        Verify & Continue
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Resend Link */}
                <View style={styles.resendContainer}>
                  {timer > 0 ? (
                    <Text style={styles.resendText}>Resend code in {timer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} disabled={isLoading || isAnimating}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
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
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
    color: '#374151',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  otpSection: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
    width: '100%',
  },
  otpInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 45,
    height: 55,
    fontSize: 22,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dynamic In-Place Stage
  animationStage: {
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitContainer: {
    width: 140,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  orbitingDigitNode: {
    position: 'absolute',
    left: 70 - DIGIT_NODE_SIZE / 2,
    top: 60 - DIGIT_NODE_SIZE / 2,
    width: DIGIT_NODE_SIZE,
    height: DIGIT_NODE_SIZE,
    borderRadius: DIGIT_NODE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  orbitingDigitText: {
    fontSize: 15,
    fontWeight: '700',
  },
  glowRippleRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
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
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
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
