import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../constants/Api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Evaluate password strength
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: "", color: "transparent" };
    if (pass.length < 6) return { label: "Weak", color: "#EF4444" };
    if (pass.length >= 6 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return { label: "Strong", color: "#10B981" };
    }
    return { label: "Medium", color: "#F59E0B" };
  };

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

  const handleUpdatePassword = async () => {
    setError('');
    
    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update password.");
        setIsLoading(false);
        return;
      }
      
      // Success state
      setIsSuccess(true);
      
      // Return to login after a brief pause
      setTimeout(() => {
        router.replace('/welcome');
      }, 2500);
      
    } catch (err) {
      console.error("Password Reset Error: ", err);
      setError("Failed to update password. Please try again.");
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
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              {!isSuccess 
                ? "Your new password must be secure and different from previous passwords."
                : "Your password has been successfully updated."}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!isSuccess ? (
              <>
                <View style={styles.inputContainer}>
                  {/* New Password Input */}
                  <View style={styles.passwordWrapper}>
                    <Feather name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="New Password"
                      placeholderTextColor="#A1A1AA"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError('');
                      }}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  
                  {password.length > 0 && (
                    <Text style={[styles.strengthText, { color: getPasswordStrength(password).color }]}>
                      Strength: {getPasswordStrength(password).label}
                    </Text>
                  )}

                  {/* Confirm Password Input */}
                  <View style={[styles.passwordWrapper, { marginTop: password.length > 0 ? 8 : 12 }]}>
                    <Feather name="check" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#A1A1AA"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError('');
                      }}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Button */}
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    (!password || !confirmPassword) ? styles.buttonDisabled : styles.buttonActive
                  ]}
                  disabled={!password || !confirmPassword || isLoading}
                  onPress={handleUpdatePassword}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[
                      styles.buttonText,
                      (!password || !confirmPassword) ? styles.buttonTextDisabled : styles.buttonTextActive
                    ]}>
                      Update Password
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Feather name="check-circle" size={48} color="#10B981" style={styles.successIcon} />
                <Text style={styles.successText}>Password updated successfully!</Text>
                <ActivityIndicator color="#10B981" style={{ marginTop: 20 }} />
                <Text style={[styles.subtitle, { marginTop: 10, fontSize: 13 }]}>Redirecting to login...</Text>
              </View>
            )}

            {/* Back to Login Link if not successful yet */}
            {!isSuccess && (
              <View style={styles.loginContainer}>
                <TouchableOpacity onPress={() => router.replace('/welcome')}>
                  <Text style={styles.loginLink}>Back to Login</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 24,
    lineHeight: 22,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
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
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 10,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500'
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginLink: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
  }
});
