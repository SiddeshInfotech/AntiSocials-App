import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

export default function Signup() {
  const router = useRouter();

  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Evaluate password strength
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: "", color: "transparent" };
    if (pass.length < 6) return { label: "Weak", color: "#FF4D4D" };
    if (pass.length >= 6 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return { label: "Strong", color: "#4CAF50" };
    }
    return { label: "Medium", color: "#FFC107" };
  };

  const validate = () => {
    let valid = true;
    let newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Valid email is required";
      valid = false;
    }

    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 👉 SAVE FUNCTION
  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          profession,
          about,
          imageUrl: image
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Signup Failed", data.error || "An error occurred");
        setIsLoading(false);
        return;
      }

      // Successfully saved in the database!
      // Store userId in secure store so onboarding can use it
      if (data.user && data.user.id) {
        await SecureStore.setItemAsync('userId', data.user.id.toString());
      }
      
      Alert.alert("Success", "User registered successfully", [
        { text: "OK", onPress: () => router.replace("/onboarding" as any) }
      ]);

    } catch (error) {
      console.error("Network Error: ", error);
      Alert.alert("Error", "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // 👉 MAIN PICK FUNCTION
  const pickImage = () => {
    Alert.alert("Select Image", "Choose an option", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  // 👉 CAMERA
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission Error", "Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
    }
  };

  // 👉 GALLERY
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      Alert.alert("Permission Error", "Gallery permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <LinearGradient colors={["#9C27FF", "#3F51FF"]} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.card}>
        <KeyboardAwareScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={styles.title}>Let people know the real you</Text>

          <Text style={styles.subtitle}>
            Add a photo and basic details to help others recognise and trust you.
          </Text>

          <Text style={styles.label}>Profile Photo</Text>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imageCircle} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <Text style={styles.camera}>📷</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={styles.photoText}>Add Photo</Text>
          </TouchableOpacity>

          <Text style={styles.helper}>
            Face clearly visible. No filters recommended.
          </Text>

          {/* Profile Name */}
          <Text style={styles.label}>Profile Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Name & Surname"
            value={profileName}
            onChangeText={setProfileName}
          />

          <Text style={styles.helper}>
            This is how people will see you.
          </Text>

          {/* Username */}
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder="@username"
            value={username}
            onChangeText={(text) => { setUsername(text); setErrors({ ...errors, username: null }); }}
            autoCapitalize="none"
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          {/* Email */}
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="your@email.com"
            value={email}
            onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: null }); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Profession */}
          <Text style={styles.label}>Profession (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you do?"
            value={profession}
            onChangeText={setProfession}
          />

          {/* About */}
          <Text style={styles.label}>About (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell something about yourself..."
            value={about}
            onChangeText={setAbout}
            multiline
            maxLength={200}
          />

          {/* Password */}
          <Text style={styles.label}>Password *</Text>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 6 characters"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: null }); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#777" />
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <Text style={[styles.strengthText, { color: getPasswordStrength(password).color }]}>
              Strength: {getPasswordStrength(password).label}
            </Text>
          )}
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, confirmPassword: null }); }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#777" />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          {/* Buttons */}
          <TouchableOpacity 
            style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
               <ActivityIndicator color="#fff" />
            ) : (
               <Text style={styles.saveText}>Sign Up →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace("/onboarding" as any)}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    width: "85%",
    height: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20
  },

  label: {
    fontWeight: "600",
    marginBottom: 6
  },

  imageCircle: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: "#EDE9FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center"
  },

  camera: {
    fontSize: 40
  },

  image: {
    height: 120,
    width: 120,
    borderRadius: 60
  },

  photoButton: {
    backgroundColor: "#E9D5FF",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 10
  },

  photoText: {
    color: "#7B61FF",
    fontWeight: "600"
  },

  helper: {
    textAlign: "center",
    fontSize: 12,
    color: "#777",
    marginBottom: 20,
    marginTop: 5
  },

  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FAF9FF'
  },

  inputError: {
    borderColor: '#FF4D4D'
  },

  errorText: {
    color: '#FF4D4D',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#FAF9FF',
    paddingRight: 10
  },

  passwordInput: {
    flex: 1,
    padding: 12,
  },

  eyeIcon: {
    padding: 5
  },

  strengthText: {
    fontSize: 12,
    marginBottom: 10,
    marginTop: -5,
    fontWeight: '500'
  },

  textArea: {
    height: 80,
    textAlignVertical: "top"
  },

  saveBtn: {
    backgroundColor: "#7B61FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20
  },

  saveText: {
    color: "#fff",
    fontWeight: "600"
  },

  skipBtn: {
    padding: 15,
    alignItems: "center"
  },

  skipText: {
    color: "#777"
  }
});

