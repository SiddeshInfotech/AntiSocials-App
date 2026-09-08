import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../constants/Api";
import { CATEGORIES_DATA, MainCategory, searchCategories } from "../constants/categoriesData";

export interface AttachedMediaItem {
  uri: string;
  type: "image" | "video";
  fileName?: string;
  mimeType?: string;
}

/**
 * Safely normalizes media URIs (decoding double-URL-encoded Expo paths)
 * and formats file URIs for React Native and Web.
 */
export function normalizeMediaUri(uri: string): string {
  if (!uri || typeof uri !== "string") return "";
  let cleanUri = uri.trim();
  if (cleanUri.includes("?")) {
    cleanUri = cleanUri.split("?")[0];
  }
  try {
    if (cleanUri.includes("%")) {
      cleanUri = decodeURIComponent(cleanUri);
      if (cleanUri.includes("%")) {
        cleanUri = decodeURIComponent(cleanUri);
      }
    }
  } catch (_) {}

  if (Platform.OS !== "web") {
    if (cleanUri.startsWith("/") && !cleanUri.startsWith("file://") && !cleanUri.startsWith("content://")) {
      cleanUri = `file://${cleanUri}`;
    }
  }
  return cleanUri;
}

/**
 * Safely appends a media file to FormData across React Native (Android/iOS) and Web.
 */
export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName?: string,
  mimeType?: string
) {
  if (!uri || typeof uri !== "string" || uri.trim().length === 0) {
    throw new Error("Invalid media URI provided.");
  }

  const cleanUri = normalizeMediaUri(uri);
  const extractedName = cleanUri.split("/").pop() || "upload_media";
  let finalName = (fileName || extractedName).trim();

  let type = mimeType ? mimeType.trim() : "";
  const match = /\.(\w+)$/.exec(finalName);
  const ext = match ? match[1].toLowerCase() : "";

  if (!type || type === "image" || type === "video") {
    if (ext === "mp4" || ext === "mov" || ext === "mkv" || mimeType?.includes("video")) {
      type = ext === "mov" ? "video/quicktime" : "video/mp4";
    } else if (ext === "png") {
      type = "image/png";
    } else if (ext === "gif") {
      type = "image/gif";
    } else if (ext === "webp") {
      type = "image/webp";
    } else {
      type = "image/jpeg";
    }
  }

  if (!finalName.includes(".")) {
    if (type.includes("png")) finalName += ".png";
    else if (type.includes("gif")) finalName += ".gif";
    else if (type.includes("webp")) finalName += ".webp";
    else if (type.includes("video") || type.includes("mp4")) finalName += ".mp4";
    else finalName += ".jpg";
  }

  console.log(`📸 [appendFileToFormData] Appending field="${fieldName}" OS=${Platform.OS}:`, {
    uri: cleanUri,
    name: finalName,
    type,
  });

  if (Platform.OS === "web") {
    try {
      const res = await fetch(cleanUri);
      const blob = await res.blob();
      const fileObj = new File([blob], finalName, { type });
      formData.append(fieldName, fileObj);
    } catch (e) {
      formData.append(fieldName, { uri: cleanUri, name: finalName, type } as any);
    }
  } else {
    // Native React Native FormData part object format (strictly guarantees string values for uri, name, type)
    formData.append(fieldName, {
      uri: String(cleanUri),
      name: String(finalName),
      type: String(type),
    } as any);
  }
}

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Selection & Form state
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [attachedMedia, setAttachedMedia] = useState<AttachedMediaItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    return searchCategories(searchQuery);
  }, [searchQuery]);

  const handleSelectMainCategory = (cat: MainCategory) => {
    setSelectedMainCategory(cat);
    setSelectedSubcategory(null);
  };

  const handleSelectSubcategory = (sub: string) => {
    setSelectedSubcategory(sub);
  };

  const handleResetCategory = () => {
    setSelectedMainCategory(null);
    setSelectedSubcategory(null);
  };

  const handlePickMedia = async () => {
    if (Platform.OS === "web") {
      const choice = window.confirm("Press OK to Upload from Gallery, or Cancel to open Camera.");
      if (choice) {
        pickFromGallery();
      } else {
        openCamera();
      }
    } else {
      Alert.alert("Attach Photo / Video", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo / Record Video", onPress: openCamera },
        { text: "Choose from Gallery", onPress: pickFromGallery },
      ]);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const isVid =
        asset.type === "video" ||
        (asset.mimeType && asset.mimeType.startsWith("video")) ||
        asset.uri.toLowerCase().endsWith(".mp4") ||
        asset.uri.toLowerCase().endsWith(".mov");
      setAttachedMedia({
        uri: asset.uri,
        type: isVid ? "video" : "image",
        fileName: asset.fileName || undefined,
        mimeType: asset.mimeType || undefined,
      });
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Please allow gallery access!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const isVid =
        asset.type === "video" ||
        (asset.mimeType && asset.mimeType.startsWith("video")) ||
        asset.uri.toLowerCase().endsWith(".mp4") ||
        asset.uri.toLowerCase().endsWith(".mov");
      setAttachedMedia({
        uri: asset.uri,
        type: isVid ? "video" : "image",
        fileName: asset.fileName || undefined,
        mimeType: asset.mimeType || undefined,
      });
    }
  };

  const isPostValid = useMemo(() => {
    const hasCategory = !!selectedMainCategory && !!selectedSubcategory;
    const hasContent = caption.trim().length > 0 || (!!attachedMedia && !!attachedMedia.uri);
    return hasCategory && hasContent;
  }, [selectedMainCategory, selectedSubcategory, caption, attachedMedia]);

  const handlePublishPost = async () => {
    if (!isPostValid || !selectedMainCategory || !selectedSubcategory) {
      Alert.alert("Incomplete Post", "Please select a Category, Subcategory, and add text or media.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Authentication Error", "Please sign in again.");
        return;
      }

      let uploadedMediaUrl: string | null = null;
      let uploadedMediaType: string | null = null;

      // 1. Upload media if attached
      if (attachedMedia && attachedMedia.uri) {
        console.log("📤 [Post Creation] Uploading media:", attachedMedia.uri, "type:", attachedMedia.type);
        const formData = new FormData();
        await appendFileToFormData(
          formData,
          "image",
          attachedMedia.uri,
          attachedMedia.fileName,
          attachedMedia.mimeType || (attachedMedia.type === "video" ? "video/mp4" : "image/jpeg")
        );

        const uploadRes = await apiFetch("/upload", {
          method: "POST",
          body: formData,
          timeoutMs: 45000,
        });

        const uploadData = await uploadRes.json();
        console.log("📥 [Post Creation] Upload status:", uploadRes.status, uploadData);
        if (!uploadRes.ok || (!uploadData?.imageUrl && !uploadData?.mediaUrl)) {
          throw new Error(uploadData?.error || "Media upload failed.");
        }
        uploadedMediaUrl = uploadData.imageUrl || uploadData.mediaUrl;
        uploadedMediaType = attachedMedia.type;
      }

      // 2. Create Post record via POST /api/posts
      const payload = {
        main_category: selectedMainCategory.name,
        subcategory: selectedSubcategory,
        caption: caption.trim(),
        media_url: uploadedMediaUrl,
        media_type: uploadedMediaType || (uploadedMediaUrl ? (uploadedMediaUrl.endsWith(".mp4") ? "video" : "image") : null),
      };

      console.log("📤 [Post Creation] Submitting post payload:", payload);
      const response = await apiFetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 [Post Creation] Response status:", response.status, data);

      if (response.ok && data.post) {
        Alert.alert("Post Published!", "Your post is now live in the Feed.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Publishing Error", data.error || "Could not publish post.");
      }
    } catch (e: any) {
      console.error("❌ Error publishing post:", e);
      Alert.alert("Post Error", e?.message || "Failed to publish post. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Navigation Top Header */}
        <View style={[styles.navHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#09090b" />
          </TouchableOpacity>
          <Text style={styles.navHeaderTitle}>Add Your Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* STEP 1: CATEGORY SELECTION */}
          {!selectedSubcategory ? (
            <View style={styles.stepContainer}>
              <Text style={styles.stepHeading}>What would you like to post about?</Text>
              <Text style={styles.stepSubheading}>Choose a category to organize your post in the community feed.</Text>

              {/* Search Field */}
              <View style={styles.searchBarContainer}>
                <Feather name="search" size={18} color="#71717a" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search categories..."
                  placeholderTextColor="#a1a1aa"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Feather name="x" size={18} color="#71717a" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Main Category selected -> Show subcategories */}
              {selectedMainCategory ? (
                <View style={styles.subcategorySection}>
                  <View style={styles.selectedMainBadgeRow}>
                    <Text style={styles.selectedMainLabel}>Main Category: </Text>
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>{selectedMainCategory.name}</Text>
                    </View>
                    <TouchableOpacity onPress={handleResetCategory} style={styles.changeMainBtn}>
                      <Text style={styles.changeMainBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.selectSubHeading}>Select a Subcategory:</Text>

                  <View style={styles.subCategoryGrid}>
                    {selectedMainCategory.subcategories.map((sub) => {
                      const isSelected = selectedSubcategory === sub;
                      return (
                        <TouchableOpacity
                          key={sub}
                          style={[
                            styles.subCategoryChip,
                            isSelected && styles.subCategoryChipSelected,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSubcategory(sub)}
                        >
                          <Text
                            style={[
                              styles.subCategoryChipText,
                              isSelected && styles.subCategoryChipTextSelected,
                            ]}
                          >
                            {sub}
                          </Text>
                          <Feather
                            name="chevron-right"
                            size={14}
                            color={isSelected ? "#EA580C" : "#71717a"}
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                /* List Main Categories */
                <View style={styles.mainCategoryList}>
                  {filteredCategories.map(({ mainCategory, matchingSubcategories }) => {
                    const isSelected = false;
                    return (
                      <TouchableOpacity
                        key={mainCategory.name}
                        style={[
                          styles.mainCategoryCard,
                          isSelected && styles.mainCategoryCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleSelectMainCategory(mainCategory)}
                      >
                        <View style={styles.mainCategoryCardLeft}>
                          <View
                            style={[
                              styles.categoryIconCircle,
                              isSelected && styles.categoryIconCircleSelected,
                            ]}
                          >
                            <Ionicons
                              name="folder-open-outline"
                              size={18}
                              color={isSelected ? "#EA580C" : "#f97316"}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.mainCategoryName,
                                isSelected && styles.mainCategoryNameSelected,
                              ]}
                            >
                              {mainCategory.name}
                            </Text>
                            <Text style={styles.subCountText}>
                              {searchQuery.length > 0
                                ? `${matchingSubcategories.length} matching subcategories`
                                : `${mainCategory.subcategories.length} subcategories`}
                            </Text>
                          </View>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={20}
                          color={isSelected ? "#EA580C" : "#71717a"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <View style={styles.emptySearchState}>
                      <Ionicons name="search-outline" size={32} color="#a1a1aa" />
                      <Text style={styles.emptySearchTitle}>No categories found</Text>
                      <Text style={styles.emptySearchSub}>
                        Try searching for something else like "Sports", "Fitness", "Food" or "Programming"
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            /* STEP 2: CONTENT COMPOSER */
            <View style={styles.stepContainer}>
              {/* Category Breadcrumb Bar */}
              <View style={styles.lockedCategoryBar}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="pricetag-outline" size={16} color="#EA580C" style={{ marginRight: 6 }} />
                  <Text style={styles.lockedMainText}>{selectedMainCategory?.name}</Text>
                  <Text style={styles.lockedDotText}> · </Text>
                  <Text style={styles.lockedSubText}>{selectedSubcategory}</Text>
                </View>
                <TouchableOpacity onPress={handleResetCategory} style={styles.editCategoryBtn}>
                  <Text style={styles.editCategoryBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.stepHeading}>What do you want to share?</Text>

              {/* Text Caption Composer */}
              <View style={styles.composerCard}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Share something with the community..."
                  placeholderTextColor="#71717a"
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={1000}
                />

                {/* Attached Media Preview */}
                {attachedMedia && (
                  <View style={styles.attachedImageContainer}>
                    {attachedMedia.type === "video" ? (
                      <View
                        style={[
                          styles.attachedImagePreview,
                          { backgroundColor: "#18181b", justifyContent: "center", alignItems: "center" },
                        ]}
                      >
                        <Ionicons name="videocam" size={44} color="#EA580C" />
                        <Text style={{ color: "#FFFFFF", marginTop: 8, fontSize: 13, fontWeight: "600" }}>
                          Video Attached ({attachedMedia.fileName || "video.mp4"})
                        </Text>
                      </View>
                    ) : (
                      <Image source={{ uri: attachedMedia.uri }} style={styles.attachedImagePreview} />
                    )}
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setAttachedMedia(null)}
                    >
                      <Feather name="x" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Optional Media Button */}
                {!attachedMedia && (
                  <TouchableOpacity
                    style={styles.addMediaBtn}
                    activeOpacity={0.8}
                    onPress={handlePickMedia}
                  >
                    <Ionicons name="image-outline" size={20} color="#EA580C" style={{ marginRight: 8 }} />
                    <Text style={styles.addMediaBtnText}>Attach Photo / Video (Optional)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* STEP 3: POST CTA BUTTON */}
        {selectedSubcategory && (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.publishBtn, !isPostValid && styles.publishBtnDisabled]}
              activeOpacity={0.85}
              disabled={!isPostValid || isSubmitting}
              onPress={handlePublishPost}
            >
              <LinearGradient
                colors={isPostValid ? ["#f97316", "#ea580c"] : ["#e4e4e7", "#e4e4e7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishBtnGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={[styles.publishBtnText, !isPostValid && { color: "#a1a1aa" }]}>
                      Post
                    </Text>
                    <Ionicons name="send" size={16} color={isPostValid ? "#FFFFFF" : "#a1a1aa"} style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  navHeaderTitle: {
    color: "#09090b",
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeading: {
    color: "#09090b",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  stepSubheading: {
    color: "#71717a",
    fontSize: 14,
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: "#09090b",
    fontSize: 15,
  },
  mainCategoryList: {
    gap: 10,
  },
  mainCategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mainCategoryCardSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  mainCategoryCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryIconCircleSelected: {
    backgroundColor: "#FFEDD5",
    borderColor: "#FDBA74",
  },
  mainCategoryName: {
    color: "#09090b",
    fontSize: 16,
    fontWeight: "600",
  },
  mainCategoryNameSelected: {
    color: "#9A3412",
    fontWeight: "700",
  },
  subCountText: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 2,
  },
  emptySearchState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySearchTitle: {
    color: "#09090b",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySearchSub: {
    color: "#71717a",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  subcategorySection: {
    marginTop: 10,
  },
  selectedMainBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 12,
    borderRadius: 12,
  },
  selectedMainLabel: {
    color: "#71717a",
    fontSize: 14,
  },
  mainBadge: {
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  mainBadgeText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "700",
  },
  changeMainBtn: {
    marginLeft: "auto",
  },
  changeMainBtnText: {
    color: "#EA580C",
    fontSize: 13,
    fontWeight: "600",
  },
  selectSubHeading: {
    color: "#09090b",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },
  subCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  subCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subCategoryChipSelected: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  subCategoryChipText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "500",
  },
  subCategoryChipTextSelected: {
    color: "#C2410C",
    fontWeight: "700",
  },
  lockedCategoryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  lockedMainText: {
    color: "#EA580C",
    fontSize: 14,
    fontWeight: "700",
  },
  lockedDotText: {
    color: "#71717a",
    fontSize: 14,
  },
  lockedSubText: {
    color: "#09090b",
    fontSize: 14,
    fontWeight: "600",
  },
  editCategoryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editCategoryBtnText: {
    color: "#EA580C",
    fontSize: 13,
    fontWeight: "600",
  },
  composerCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  captionInput: {
    color: "#09090b",
    fontSize: 16,
    minHeight: 140,
    textAlignVertical: "top",
  },
  attachedImageContainer: {
    position: "relative",
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  attachedImagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  addMediaBtnText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
    backgroundColor: "#FFFFFF",
  },
  publishBtn: {
    borderRadius: 24,
    overflow: "hidden",
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 24,
  },
  publishBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
