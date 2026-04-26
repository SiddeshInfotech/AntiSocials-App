import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("Login Screen Mounted - Root Index");
    // Play logo animation on mount
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

    // Auto login check - disabled as requested to keep user on login page
    /*
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          router.replace('/(tabs)' as any);
        }
      } catch (e) {}
    };
    checkToken();
    */
  }, []);

  const handleSendOTP = async () => {
    setError('');
    
    // Basic phone validation (allowing optional + and digits)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Adding AbortController to prevent infinite loading on network failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          purpose: 'login'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        setIsLoading(false);
        return;
      }

      // Navigate to OTP screen
      router.push({ pathname: '/otp', params: { phone: phoneNumber, purpose: 'login' } });

    } catch (error) {
      console.error("OTP Error: ", error);
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Login to AntiSocial</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Feather name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter phone number (e.g. +91...)"
                  placeholderTextColor="#A1A1AA"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                (!phoneNumber) ? styles.buttonDisabled : styles.buttonActive
              ]}
              disabled={!phoneNumber || isLoading}
              onPress={handleSendOTP}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons 
                    name="whatsapp" 
                    size={22} 
                    color={!phoneNumber ? "#9CA3AF" : "#FFFFFF"} 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={[
                    styles.buttonText,
                    (!phoneNumber) ? styles.buttonTextDisabled : styles.buttonTextActive
                  ]}>
                    Send OTP
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms & Privacy Policy.</Text>
            </Text>
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
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '500',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#9333EA',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#9333EA',
    fontWeight: '500',
  },
});
