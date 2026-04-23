import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string, purpose?: string, username?: string, email?: string, profession?: string, about?: string, imageUrl?: string }>();
  const phone = params.phone || '';
  const purpose = params.purpose || 'login';

  const displayPhone = phone ? phone.slice(-4) : '0000';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(26);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    setTimer(26);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
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
    // Filter out any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Only update if it's empty (cleared) or a valid number
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto focus next input if digit entered
    if (numericValue && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Auto focus previous input on backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const isComplete = otp.every(digit => digit !== '');

  const handleVerify = async () => {
    setError('');
    setIsLoading(true);
    const otpCode = otp.join('');
    try {
      // 1. Verify OTP
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otp: otpCode, purpose }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error || "Invalid OTP");
        setIsLoading(false);
        return;
      }

      // 2. Perform Login or Register
      if (purpose === 'signup') {
        const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone,
            username: params.username,
            email: params.email,
            profession: params.profession,
            about: params.about,
            imageUrl: params.imageUrl
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
        router.replace('/onboarding' as any);
      } else {
        // purpose === 'login'
        const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
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
        router.replace('/(tabs)' as any);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Feather name="shield" size={28} color="#10B981" />
            </View>

            {/* Headers */}
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.boldText}>{phone || '+91 XXXX XXXX'}</Text>
            </Text>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Description Text */}
            <Text style={styles.descriptionText}>
              This helps us confirm it's really you.
            </Text>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputs.current[index] = ref; }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  selectionColor="#9333EA"
                />
              ))}
            </View>

            {/* Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                isComplete && !isLoading ? styles.buttonActive : styles.buttonDisabled
              ]}
              disabled={!isComplete || isLoading}
              onPress={handleVerify}
            >
              {isLoading ? (
                 <ActivityIndicator color="#fff" />
              ) : (
                 <Text style={[
                   styles.buttonText,
                   isComplete ? styles.buttonTextActive : styles.buttonTextDisabled
                 ]}>
                   Verify & Continue
                 </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            {timer > 0 ? (
              <Text style={styles.footerText}>
                Resend code in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.footerText, styles.linkText]}>
                  Resend code
                </Text>
              </TouchableOpacity>
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5', // Light green background
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  boldText: {
    fontWeight: '500',
    color: '#374151',
  },
  descriptionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
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
});

