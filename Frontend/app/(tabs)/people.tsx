import { Ionicons, Feather } from "@expo/vector-icons";
import { useRef, useState, useEffect } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
  Easing,
  Alert,
} from "react-native";
import ConnectionGraph from "../../components/ConnectionGraph";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function People() {
  const isFocused = useIsFocused();
  const [showInfo, setShowInfo] = useState(false);
  const [activeView, setActiveView] = useState("all");

  // --- PEOPLE SECTION (GRAPH LOGIC) ---
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const stateValues = useRef({ x: 0, y: 0, zoom: 1, pinchDist: 0 });

  useEffect(() => {
    const panId = pan.addListener((value) => {
      stateValues.current.x = value.x;
      stateValues.current.y = value.y;
    });
    const zoomId = zoomAnim.addListener(({ value }) => {
      stateValues.current.zoom = value;
    });
    return () => {
      pan.removeListener(panId);
      zoomAnim.removeListener(zoomId);
    };
  }, [pan, zoomAnim]);

  const getDistance = (touches: any) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        pan.setOffset({
          x: stateValues.current.x,
          y: stateValues.current.y,
        });
        pan.setValue({ x: 0, y: 0 });

        if (touches.length >= 2) {
          stateValues.current.pinchDist = getDistance(touches);
        } else {
          stateValues.current.pinchDist = 0;
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const newDist = getDistance(touches);
          if (stateValues.current.pinchDist > 0) {
            const scaleFactor = newDist / stateValues.current.pinchDist;
            const newZoom = Math.min(
              Math.max(stateValues.current.zoom * scaleFactor, 0.4),
              3.5,
            );
            zoomAnim.setValue(newZoom);
          }
        } else if (
          touches.length === 1 &&
          stateValues.current.pinchDist === 0
        ) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  // --- HEART & LEGACY SECTION LOGIC ---
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600), // Delay before the next heartbeat
      ]),
    ).start();
  }, []);

  const handleRecordVideo = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();

    if (cameraPerm.status !== "granted") {
      Alert.alert(
        "Permissions Needed",
        "Camera access is required to record your Legacy Video.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 120, // max 2 mins recorded
        quality: 1,
        allowsEditing: true,
      });

      if (!result.canceled) {
        Alert.alert(
          "Success! 🔒",
          "Your Legacy Video has been recorded and safely encrypted.",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening the camera.");
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isFocused && <StatusBar style="dark" backgroundColor="#ffffff" />}

        {/* ======================================================== */}
        {/* TOP HEADER & SEGMENTED TABS */}
        {/* ======================================================== */}
        <View style={styles.topTabsContainer}>
          <View style={styles.topHeaderTitleArea}>
            <Text style={styles.mainTitle}>Connections</Text>
            <Text style={styles.mainSubtitle}>
              Your meaningful relationships
            </Text>
          </View>

          <View style={styles.dividerLine} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentedControl}
          >
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeView === "all"
                  ? styles.segmentBtnActive
                  : styles.segmentBtnInactive,
              ]}
              onPress={() => setActiveView("all")}
              activeOpacity={0.8}
            >
              <Feather
                name="users"
                size={16}
                color={activeView === "all" ? "#fff" : "#9333EA"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeView === "all"
                    ? styles.segmentTextActive
                    : styles.segmentTextInactive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeView === "heart"
                  ? styles.segmentBtnActive
                  : styles.segmentBtnInactive,
              ]}
              onPress={() => setActiveView("heart")}
              activeOpacity={0.8}
            >
              <Feather
                name="heart"
                size={16}
                color={activeView === "heart" ? "#fff" : "#9333EA"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeView === "heart"
                    ? styles.segmentTextActive
                    : styles.segmentTextInactive,
                ]}
              >
                Heart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeView === "legacy"
                  ? styles.segmentBtnActive
                  : styles.segmentBtnInactive,
              ]}
              onPress={() => setActiveView("legacy")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={activeView === "legacy" ? "#fff" : "#9333EA"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeView === "legacy"
                    ? styles.segmentTextActive
                    : styles.segmentTextInactive,
                ]}
              >
                Legacy
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ======================================================== */}
        {/* SECTION 1: PEOPLE (Dark Theme) */}
        {/* ======================================================== */}
        {activeView === "all" && (
          <View style={styles.peopleSection}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Trust Network</Text>
                <Text style={styles.subtitle}>
                  23 connections across 3 tiers
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowInfo(!showInfo)}
                style={styles.infoButton}
              >
                <Ionicons name="information" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {showInfo && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>👥 Trust Tiers</Text>

                <View style={styles.row}>
                  <View style={styles.dot} />
                  <Text style={styles.cardText}>
                    <Text style={styles.bold}>Tier 1</Text> - Closest
                    connections
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={[styles.dot, { opacity: 0.8 }]} />
                  <Text style={styles.cardText}>
                    <Text style={styles.bold}>Tier 2</Text> - Regular contacts
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={[styles.dot, { opacity: 0.6 }]} />
                  <Text style={styles.cardText}>
                    <Text style={styles.bold}>Tier 3</Text> - Growing
                    connections
                  </Text>
                </View>

                <Text style={styles.cardFooter}>
                  Pinch to zoom • Drag to pan • Tap nodes for details
                </Text>
              </View>
            )}

            <View style={styles.graphArea}>
              <View style={styles.graphWrapper}>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.graphInner,
                    {
                      width: 800,
                      height: 800,
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: zoomAnim },
                      ],
                    },
                  ]}
                >
                  <ConnectionGraph />
                </Animated.View>
              </View>

              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => {
                    Animated.spring(zoomAnim, {
                      toValue: Math.min(stateValues.current.zoom + 0.3, 3.5),
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <Ionicons name="add" size={20} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => {
                    Animated.spring(zoomAnim, {
                      toValue: Math.max(stateValues.current.zoom - 0.3, 0.4),
                      useNativeDriver: true,
                    }).start();
                  }}
                >
                  <Ionicons name="remove" size={20} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => {
                    Animated.parallel([
                      Animated.spring(zoomAnim, {
                        toValue: 1,
                        useNativeDriver: true,
                      }),
                      Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                      }),
                    ]).start();
                  }}
                >
                  <Ionicons name="expand" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* SECTION 2: HEART & LEGACY (Light Theme) */}
        {/* ======================================================== */}
        <View style={styles.heartLegacySection}>
          {/* Heart Section */}
          {activeView === "heart" && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleDark}>Heart</Text>
                <Text style={styles.sectionSubtitleDark}>
                  Connections that go deeper
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                <View style={styles.infoCard}>
                  <Feather
                    name="heart"
                    size={28}
                    color="#E11D48"
                    style={styles.cardMainIcon}
                  />
                  <Text style={styles.infoCardTitle}>One Heart Each Year</Text>
                  <Text style={styles.infoCardDesc}>
                    Send one heart each year to someone truly special. If they
                    send you one too, you'll both know it's mutual.
                  </Text>

                  <View style={styles.infoNotice}>
                    <Feather
                      name="info"
                      size={14}
                      color="#6B7280"
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.infoNoticeText}>
                      Hearts reset every year on your anniversary with
                      AntiSocial.
                    </Text>
                  </View>
                </View>

                <View style={styles.statusCard}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons name="heart" size={22} color="#fff" />
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusTitle}>Heart Sent</Text>
                    <Text style={styles.statusDesc}>
                      Your heart for 2024 has been sent
                    </Text>
                  </View>
                </View>

                <LinearGradient
                  colors={["#E11D48", "#BE185D", "#9D174D"]}
                  style={styles.mutualCard}
                >
                  <Animated.View
                    style={{ transform: [{ scale: heartbeatAnim }] }}
                  >
                    <Ionicons
                      name="heart"
                      size={56}
                      color="#fff"
                      style={styles.mutualIcon}
                    />
                  </Animated.View>
                  <Text style={styles.mutualTitle}>It's Mutual! 💞</Text>
                  <Text style={styles.mutualDesc}>
                    You and Emily Rodriguez both sent hearts to each other
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Legacy Section */}
          {activeView === "legacy" && (
            <View>
              <View style={[styles.sectionHeader]}>
                <Text style={styles.sectionTitleDark}>Legacy</Text>
                <Text style={styles.sectionSubtitleDark}>
                  A message forever
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                <View style={styles.infoCardLegacy}>
                  <Feather
                    name="video"
                    size={28}
                    color="#9333EA"
                    style={styles.cardMainIcon}
                  />
                  <Text style={styles.infoCardTitle}>A Message Forever</Text>
                  <Text style={styles.infoCardDesc}>
                    Record a private video message for your closest people. A
                    message of love, closure, and care that will be shared when
                    the time comes.
                  </Text>

                  <View style={styles.infoNotice}>
                    <Feather
                      name="lock"
                      size={14}
                      color="#6B7280"
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.infoNoticeText}>
                      Your legacy video is encrypted and completely private
                      until delivered.
                    </Text>
                  </View>
                </View>

                <View style={styles.legacyStatusCard}>
                  <View style={styles.legacyIconCircle}>
                    <Feather name="video" size={28} color="#9333EA" />
                  </View>
                  <Text style={styles.legacyCardTitle}>
                    Create Your Legacy Video
                  </Text>
                  <Text style={styles.legacyCardDesc}>
                    Record a heartfelt message for the people who matter most.
                    You can update it anytime.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.recordButtonWrapper}
                    onPress={handleRecordVideo}
                  >
                    <LinearGradient
                      colors={["#A855F7", "#D946EF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.recordButtonGradient}
                    >
                      <Feather
                        name="video"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.recordButtonText}>
                        Start Recording
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.recipientsSection}>
                  <Text style={styles.recipientsTitle}>Choose Recipients</Text>
                  <Text style={styles.recipientsSubtitle}>
                    Select who should receive your legacy video
                  </Text>

                  <View style={styles.recipientItem}>
                    <View style={styles.recipientAvatar}>
                      <Text style={{ fontSize: 24 }}>👱‍♀️</Text>
                    </View>
                    <View style={styles.recipientInfo}>
                      <Text style={styles.recipientName}>Sarah Johnson</Text>
                      <Text style={styles.recipientTier}>Tier 1</Text>
                    </View>
                    <View style={styles.checkboxDark} />
                  </View>

                  <View style={styles.recipientItem}>
                    <View style={styles.recipientAvatar}>
                      <Text style={{ fontSize: 24 }}>👱‍♂️</Text>
                    </View>
                    <View style={styles.recipientInfo}>
                      <Text style={styles.recipientName}>Michael Chen</Text>
                      <Text style={styles.recipientTier}>Tier 2</Text>
                    </View>
                    <View style={styles.checkboxDark} />
                  </View>

                  <View style={styles.recipientItem}>
                    <View style={styles.recipientAvatar}>
                      <Text style={{ fontSize: 24 }}>👱‍♀️</Text>
                    </View>
                    <View style={styles.recipientInfo}>
                      <Text style={styles.recipientName}>Emily Rodriguez</Text>
                      <Text style={styles.recipientTier}>Tier 2</Text>
                    </View>
                    <View style={styles.checkboxDark} />
                  </View>
                </View>

                <View style={styles.footerInfoCard}>
                  <Feather
                    name="lock"
                    size={24}
                    color="#6B7280"
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.footerInfoText}>
                    Your legacy video is private and encrypted. Only you can
                    view or edit it until it's time for delivery.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topTabsContainer: {
    backgroundColor: "#fff",
    paddingTop: 10,
    paddingBottom: 15,
  },
  topHeaderTitleArea: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#6D28D9",
  },
  mainSubtitle: {
    fontSize: 15,
    color: "#A855F7",
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#F3E8FF",
    marginBottom: 15,
  },
  segmentedControl: {
    paddingHorizontal: 20,
    gap: 12,
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: "#A855F7",
    borderWidth: 1,
    borderColor: "#111",
  },
  segmentBtnInactive: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#fff",
  },
  segmentTextInactive: {
    color: "#9333EA",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  peopleSection: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -5,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 600,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    color: "#111827",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 5,
  },
  infoButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    color: "#111827",
    fontWeight: "bold",
    marginBottom: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a855f7",
    marginRight: 10,
  },
  cardText: {
    color: "#4B5563",
  },
  bold: {
    color: "#111827",
    fontWeight: "600",
  },
  cardFooter: {
    color: "#9CA3AF",
    marginTop: 12,
    fontSize: 12,
  },
  graphArea: {
    height: 480,
    marginTop: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  graphWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  graphInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  zoomControls: {
    position: "absolute",
    right: 15,
    bottom: 15,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // --- HEART & LEGACY THEME (LIGHT) ---
  heartLegacySection: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitleDark: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitleDark: {
    fontSize: 15,
    color: "#6B7280",
  },
  cardsContainer: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  cardMainIcon: {
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  infoCardDesc: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  infoNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 14,
    color: "#6B7280",
  },
  mutualCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  mutualIcon: {
    marginBottom: 16,
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  mutualTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  mutualDesc: {
    fontSize: 15,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
  },
  infoCardLegacy: {
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  legacyStatusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 8,
  },
  legacyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  legacyCardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  legacyCardDesc: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  recordButtonWrapper: {
    width: "100%",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  recipientsSection: {
    marginTop: 16,
  },
  recipientsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  recipientsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  recipientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
  },
  recipientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  recipientTier: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  checkboxDark: {
    width: 24,
    height: 24,
    backgroundColor: "#4B5563",
    borderRadius: 4,
  },
  footerInfoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },
  footerInfoText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
});
