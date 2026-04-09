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
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

export default function Signup() {
  const router = useRouter();

  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [profession, setProfession] = useState("");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // 👉 SAVE FUNCTION
  const handleSave = () => {
    if (!profileName || !username || !profession) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // 👉 Go to onboarding
    router.replace("/onboarding" as any);
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
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 👉 GALLERY
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      alert("Gallery permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <LinearGradient colors={["#9C27FF", "#3F51FF"]} style={styles.container}>
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>
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
            style={styles.input}
            placeholder="@username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.helper}>
            Cannot be changed later.
          </Text>

          {/* Profession */}
          <Text style={styles.label}>Profession *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Interior Designer"
            value={profession}
            onChangeText={setProfession}
          />

          {/* About */}
          <Text style={styles.label}>About you (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Interior designer | Loves coffee & morning walks"
            value={about}
            onChangeText={setAbout}
            multiline
          />

          {/* Buttons */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save & Continue →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace("/onboarding" as any)}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </LinearGradient>
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
    marginBottom: 10
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

