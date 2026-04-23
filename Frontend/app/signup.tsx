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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    let valid = true;
    let newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }
    
    // Email is optional in DB now, but we keep it if they enter it
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Valid email is required";
      valid = false;
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneNumber.trim() || !phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "Valid phone number is required (e.g. +91...)";
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
      // Replaced localhost with your computer's IP address to fix the Android Network Request Failed error
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          purpose: 'signup'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Signup Failed", data.error || "An error occurred");
        setIsLoading(false);
        return;
      }

      // Navigate to OTP screen passing all the user data
      router.push({
        pathname: "/otp",
        params: {
          phone: phoneNumber,
          purpose: 'signup',
          username,
          email,
          profession,
          about,
          imageUrl: image
        }
      });

    } catch (error) {
      console.error("Network Error: ", error);
      Alert.alert("Error", "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImageToServer = async (uri: string) => {
    setIsLoading(true);
    try {
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type } as any);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Upload Failed", data.error || "Could not upload image");
      } else {
        setImage(data.imageUrl);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Could not connect to server for image upload.");
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
      base64: false
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImageToServer(result.assets[0].uri);
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
      base64: false
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImageToServer(result.assets[0].uri);
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

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="e.g. +91 9876543210"
            value={phoneNumber}
            onChangeText={(text) => { setPhoneNumber(text); setErrors({ ...errors, phoneNumber: null }); }}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          {/* Email */}
          <Text style={styles.label}>Email Address (Optional)</Text>
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

          {/* Password removed as per requirement */}

          {/* Buttons */}
          <TouchableOpacity 
            style={[styles.saveBtn, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
               <ActivityIndicator color="#fff" />
            ) : (
               <Text style={styles.saveText}>Get OTP →</Text>
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

