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

  // Animated values for input fade & success circle stage
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formScale = useRef(new Animated.Value(1)).current;

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const auraRippleScale = useRef(new Animated.Value(0.8)).current;
  const auraRippleOpacity = useRef(new Animated.Value(0)).current;

  // Confirmation Label Values
  const confirmationOpacity = useRef(new Animated.Value(0)).current;
  const confirmationTranslateY = useRef(new Animated.Value(10)).current;

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

  const triggerSuccessAnimation = (destination: string = '/(tabs)') => {
    setIsAnimating(true);

    // Reset animated values
    formOpacity.setValue(1);
    formScale.setValue(1);
    successScale.setValue(0);
    successOpacity.setValue(0);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    auraRippleScale.setValue(0.8);
    auraRippleOpacity.setValue(0);
    confirmationOpacity.setValue(0);
    confirmationTranslateY.setValue(10);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (_) {}

    // STEP 1: Smoothly scale down and fade out OTP input fields in place
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formScale, {
        toValue: 0.85,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // STEP 2: Spring reveal centered green success circle & checkmark
    setTimeout(() => {
      setIsVerifiedState(true);

      Animated.parallel([
        // Green success circle spring expand
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }),

        // Soft outer green aura ripple
        Animated.sequence([
          Animated.timing(auraRippleOpacity, {
            toValue: 0.6,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(auraRippleScale, {
              toValue: 1.8,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(auraRippleOpacity, {
              toValue: 0,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),

        // Animated checkmark pop
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(checkOpacity, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
            Animated.spring(checkScale, {
              toValue: 1,
              friction: 5,
              tension: 75,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // Verified confirmation badge reveal below
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(confirmationOpacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(confirmationTranslateY, {
              toValue: 0,
              duration: 220,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }, 120);

    // STEP 3: Continue to destination tab cleanly after animation completes
    setTimeout(() => {
      router.replace(destination as any);
    }, 1350);
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

      // 2. Perform Login or Register (Both navigate directly to Home tabs)
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
        triggerSuccessAnimation('/(tabs)');
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

            {/* Middle Section: Stable Centered OTP Section */}
            <View style={styles.otpSection}>
              {/* 6-Digit Horizontal Inputs */}
              <Animated.View
                style={[
                  styles.otpContainer,
                  {
                    opacity: formOpacity,
                    transform: [{ scale: formScale }],
                  },
                ]}
                pointerEvents={isAnimating ? 'none' : 'auto'}
              >
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
              </Animated.View>

              {/* Perfectly Centered Green Success Circle Stage */}
              {isAnimating && (
                <View style={styles.animationStage} pointerEvents="none">
                  {/* Soft Green Outer Aura Ripple */}
                  <Animated.View
                    style={[
                      styles.auraRipple,
                      {
                        opacity: auraRippleOpacity,
                        transform: [{ scale: auraRippleScale }],
                      },
                    ]}
                  />

                  {/* Main Centered Green Success Check Circle */}
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
                      <Feather name="check" size={30} color="#FFFFFF" />
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
    height: 110,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
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

  // Cinematic Orbit Stage
  // Centered Success Stage
  animationStage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraRipple: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
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
