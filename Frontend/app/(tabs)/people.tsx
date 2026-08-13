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
  TextInput,
  Image,
  Keyboard,
  ActivityIndicator,
  Modal,
} from "react-native";
import ConnectionGraph, { ConnectedUserNode } from "../../components/ConnectionGraph";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, apiFetch } from "../../constants/Api";
import { resolveImageUrl } from "../../constants/ImageUtils";

// --- PULSING DOTS LOADING ANIMATION ---
const PulsingDotsLoading = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createPulse = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createPulse(dot1, 0);
    const anim2 = createPulse(dot2, 150);
    const anim3 = createPulse(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.loadingDotsContainer}>
      <Animated.View style={[styles.loadingDot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
    </View>
  );
};

// --- SEARCH RESULT ITEM COMPONENT ---
const SearchResultItem = ({
  item,
  index,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  isActionLoading,
}: {
  item: any;
  index: number;
  onConnect: (user: any) => void;
  onAccept?: (user: any) => void;
  onDecline?: (user: any) => void;
  isConnecting: boolean;
  isActionLoading?: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: Math.min(index * 50, 300),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay: Math.min(index * 50, 300),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, index]);

  const avatarUri = resolveImageUrl(item.profile_image);

  return (
    <Animated.View
      style={[
        styles.resultCard,
        { opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.avatarWrapper}>
        {!imageError && avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.resultAvatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.resultAvatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(item.display_name || item.username || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultDisplayName} numberOfLines={1}>
          {item.display_name || item.username}
        </Text>
        <Text style={styles.resultUsername} numberOfLines={1}>
          @{item.username}
        </Text>
        {!!(item.profession || item.about) && (
          <Text style={styles.resultBio} numberOfLines={1}>
            {item.profession || item.about}
          </Text>
        )}
      </View>

      <View style={styles.actionArea}>
        {item.connection_status === "self" ? (
          <View style={styles.badgeYou}>
            <Text style={styles.badgeYouText}>You</Text>
          </View>
        ) : item.connection_status === "connected" ? (
          <View style={styles.badgeConnected}>
            <Feather name="check" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.badgeConnectedText}>Connected</Text>
          </View>
        ) : item.connection_status === "requested" ? (
          <View style={styles.badgeRequested}>
            <Feather name="clock" size={13} color="#6B7280" style={{ marginRight: 4 }} />
            <Text style={styles.badgeRequestedText}>Requested</Text>
          </View>
        ) : item.connection_status === "incoming" ? (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              style={styles.searchDeclineBtn}
              onPress={() => onDecline && onDecline(item)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Text style={styles.searchDeclineText}>Decline</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchAcceptBtn}
              onPress={() => onAccept && onAccept(item)}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchAcceptText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => onConnect(item)}
            disabled={isConnecting}
            activeOpacity={0.8}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.connectBtnText}>Connect</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default function People() {
  const isFocused = useIsFocused();
  const [showInfo, setShowInfo] = useState(false);
  const [activeView, setActiveView] = useState("all");

  // --- TRUST NETWORK CONNECTIONS STATE ---
  const [connections, setConnections] = useState<ConnectedUserNode[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState<boolean>(true);
  const [connectionsError, setConnectionsError] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUserModal, setSelectedUserModal] = useState<ConnectedUserNode | null>(null);
  const [isRemovingConnection, setIsRemovingConnection] = useState<boolean>(false);
  const searchInputRef = useRef<TextInput>(null);

  // --- CONNECT SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [connectingUserIds, setConnectingUserIds] = useState<{ [key: number]: boolean }>({});

  const focusAnim = useRef(new Animated.Value(0)).current;

  // --- FETCH CONNECTIONS & USER PROFILE ---
  const fetchConnections = async () => {
    setIsLoadingConnections(true);
    setConnectionsError(false);
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await apiFetch("/api/connections", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      } else {
        setConnections([]);
      }
    } catch (err) {
      console.log("fetchConnections fallback to empty network:", err);
      setConnections([]);
    } finally {
      setIsLoadingConnections(false);
      setConnectionsError(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await apiFetch("/api/profile/me", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("fetchCurrentUser error:", err);
    }
  };

  // --- INCOMING REQUESTS STATE ---
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [actionLoadingIds, setActionLoadingIds] = useState<{ [key: number]: boolean }>({});

  const fetchIncomingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await apiFetch("/api/connections/requests/incoming", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIncomingRequests(data.requests || []);
      }
    } catch (err) {
      console.error("fetchIncomingRequests error:", err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (targetUser: any) => {
    const senderId = targetUser.id || targetUser.user_id || targetUser.sender_id;
    if (!senderId || actionLoadingIds[senderId]) return;

    setActionLoadingIds((prev) => ({ ...prev, [senderId]: true }));

    // Optimistic UI update
    setIncomingRequests((prev) =>
      prev.filter((r) => (r.sender?.id || r.sender?.user_id) !== senderId)
    );

    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await apiFetch("/api/connections/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ friend_id: senderId }),
      });

      if (res.ok) {
        await fetchConnections();
        setSearchResults((prev) =>
          prev.map((u) =>
            (u.id || u.user_id) === senderId
              ? { ...u, connection_status: "connected" }
              : u
          )
        );
      } else {
        Alert.alert("Error", "Couldn't accept the request.");
        fetchIncomingRequests();
      }
    } catch (err) {
      Alert.alert(
        "Connection Error",
        "Couldn't accept the request. Please check your network."
      );
      fetchIncomingRequests();
    } finally {
      setActionLoadingIds((prev) => ({ ...prev, [senderId]: false }));
    }
  };

  const handleDeclineRequest = async (targetUser: any) => {
    const senderId = targetUser.id || targetUser.user_id || targetUser.sender_id;
    if (!senderId || actionLoadingIds[senderId]) return;

    setActionLoadingIds((prev) => ({ ...prev, [senderId]: true }));

    // Optimistic UI update
    setIncomingRequests((prev) =>
      prev.filter((r) => (r.sender?.id || r.sender?.user_id) !== senderId)
    );

    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await apiFetch("/api/connections/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ friend_id: senderId }),
      });

      if (res.ok) {
        setSearchResults((prev) =>
          prev.map((u) =>
            (u.id || u.user_id) === senderId
              ? { ...u, connection_status: "none" }
              : u
          )
        );
      } else {
        Alert.alert("Error", "Couldn't decline the request.");
        fetchIncomingRequests();
      }
    } catch (err) {
      Alert.alert(
        "Connection Error",
        "Couldn't decline the request. Please check your network."
      );
      fetchIncomingRequests();
    } finally {
      setActionLoadingIds((prev) => ({ ...prev, [senderId]: false }));
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchConnections();
      fetchCurrentUser();
      fetchIncomingRequests();
    }
  }, [isFocused]);

  const handleRemoveConnection = async (targetUser: ConnectedUserNode) => {
    const targetId = targetUser.id || targetUser.user_id;
    if (!targetId || isRemovingConnection) return;

    Alert.alert(
      "Remove Connection",
      `Are you sure you want to remove ${targetUser.display_name || targetUser.username} from your Trust Network?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsRemovingConnection(true);
            try {
              const token = await SecureStore.getItemAsync("token");
              const res = await apiFetch(`/api/connections/${targetId}`, {
                method: "DELETE",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });

              if (res.ok) {
                setConnections((prev) => prev.filter((c) => (c.id || c.user_id) !== targetId));
                setSelectedUserModal(null);
                setSearchResults((prev) =>
                  prev.map((u) =>
                    (u.id || u.user_id) === targetId ? { ...u, connection_status: "none" } : u
                  )
                );
              } else {
                Alert.alert("Error", "Could not remove connection. Please try again.");
              }
            } catch (err) {
              Alert.alert("Connection Error", "Please check your network connection.");
            } finally {
              setIsRemovingConnection(false);
            }
          },
        },
      ]
    );
  };


  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isSearchFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isSearchFocused, focusAnim]);

  const searchScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });

  const searchBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#7E22CE", "#D8B4FE"],
  });

  // Debounce query (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search API Call Effect
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchSearchResults = async () => {
      setIsSearching(true);
      setSearchError(false);

      try {
        const token = await SecureStore.getItemAsync("token");
        const response = await apiFetch(
          `/api/profile/search?q=${encodeURIComponent(debouncedQuery)}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setSearchResults(data.users || []);
          }
        } else {
          if (isMounted) setSearchError(true);
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && isMounted) {
          setSearchError(true);
        }
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    fetchSearchResults();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(false);
    Keyboard.dismiss();
  };

  const handleConnect = async (targetUser: any) => {
    const targetId = targetUser.id || targetUser.user_id;
    if (!targetId || connectingUserIds[targetId]) return;

    setConnectingUserIds((prev) => ({ ...prev, [targetId]: true }));

    // Optimistic UI update
    setSearchResults((prev) =>
      prev.map((u) =>
        (u.id || u.user_id) === targetId
          ? { ...u, connection_status: "requested" }
          : u
      )
    );

    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await apiFetch("/api/profile/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ friend_id: targetId }),
      });

      if (!response.ok) {
        setSearchResults((prev) =>
          prev.map((u) =>
            (u.id || u.user_id) === targetId
              ? { ...u, connection_status: "none" }
              : u
          )
        );
        Alert.alert("Error", "Could not send connection request. Please try again.");
      }
    } catch (err) {
      setSearchResults((prev) =>
        prev.map((u) =>
          (u.id || u.user_id) === targetId
            ? { ...u, connection_status: "none" }
            : u
        )
      );
      Alert.alert("Connection Error", "Please check your internet connection.");
    } finally {
      setConnectingUserIds((prev) => ({ ...prev, [targetId]: false }));
    }
  };

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
            <View style={styles.mainTitleRow}>
              <Text style={styles.mainTitle}>Connections</Text>
              {incomingRequests.length > 0 && (
                <View style={styles.headerBadgeContainer}>
                  <View style={styles.headerBadgeDot} />
                  <Text style={styles.headerBadgeText}>{incomingRequests.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.mainSubtitle}>
              Your meaningful relationships
            </Text>
          </View>

          {/* ======================================================== */}
          {/* SEARCH BAR - PRO MAX PURPLE GLASSMORPHISM */}
          {/* ======================================================== */}
          <Animated.View
            style={[
              styles.searchOuterWrapper,
              {
                transform: [{ scale: searchScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.searchGlassContainer,
                {
                  borderColor: searchBorderColor,
                },
              ]}
            >
              {/* Dark Purple Glassmorphism Base Gradient */}
              <LinearGradient
                colors={[
                  "rgba(35, 14, 60, 0.90)",
                  "rgba(20, 8, 38, 0.95)",
                  "rgba(38, 16, 68, 0.92)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Specular Glass Reflection / Top Rim Light Highlight */}
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.22)",
                  "rgba(255, 255, 255, 0.04)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.searchGlassSpecular}
                pointerEvents="none"
              />

              {/* Active Ambient Violet Glow Layer on Focus */}
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  styles.searchActiveGlowLayer,
                  { opacity: focusAnim },
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={[
                    "rgba(168, 85, 247, 0.25)",
                    "rgba(147, 51, 234, 0.15)",
                    "rgba(126, 34, 206, 0.30)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>

              {/* Modern Glowing Search Icon Pod */}
              <View style={styles.searchIconBadge}>
                <Feather
                  name="search"
                  size={17}
                  color="#E9D5FF"
                  style={styles.searchIcon}
                />
              </View>

              {/* Premium Typography & Placeholder */}
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search people..."
                placeholderTextColor="rgba(216, 180, 254, 0.65)"
                selectionColor="#C084FC"
                keyboardAppearance="dark"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />

              {/* Glass Clear Button */}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.searchClearBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchClearInner}>
                    <Feather name="x" size={13} color="#FAF5FF" />
                  </View>
                </TouchableOpacity>
              )}
            </Animated.View>
          </Animated.View>

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
              {incomingRequests.length > 0 && (
                <View style={styles.tabBadgeDot} />
              )}
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
        {/* SEARCH RESULTS OR DEFAULT CONTENT */}
        {/* ======================================================== */}
        {searchQuery.trim().length >= 2 ? (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <PulsingDotsLoading />
            ) : searchError ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={28} color="#EF4444" />
                <Text style={styles.errorText}>Couldn't load people.</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => setDebouncedQuery(searchQuery.trim() + " ")}
                >
                  <Text style={styles.retryBtnText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Feather name="search" size={32} color="#A855F7" />
                </View>
                <Text style={styles.emptyTitle}>No people found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching with another name or username.
                </Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <Text style={styles.resultsHeaderCount}>
                  {searchResults.length} {searchResults.length === 1 ? "person" : "people"} found
                </Text>
                {searchResults.map((item, idx) => (
                  <SearchResultItem
                    key={item.id || item.user_id || idx}
                    item={item}
                    index={idx}
                    onConnect={handleConnect}
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                    isConnecting={!!connectingUserIds[item.id || item.user_id]}
                    isActionLoading={!!actionLoadingIds[item.id || item.user_id]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ======================================================== */}
            {/* INCOMING CONNECTION REQUESTS SECTION */}
            {/* ======================================================== */}
            {incomingRequests.length > 0 && activeView === "all" && (
              <View style={styles.incomingRequestsContainer}>
                <View style={styles.requestsHeaderRow}>
                  <View style={styles.requestsTitleGroup}>
                    <Text style={styles.requestsSectionTitle}>Connection Requests</Text>
                    <View style={styles.requestsCountBadge}>
                      <Text style={styles.requestsCountBadgeText}>{incomingRequests.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.requestsSubtext}>Wants to connect with you</Text>
                </View>

                {incomingRequests.map((reqItem) => {
                  const sender = reqItem.sender || {};
                  const senderId = sender.id || sender.user_id;
                  const avatarUri = resolveImageUrl(sender.profile_image);
                  const isLoading = !!actionLoadingIds[senderId];

                  return (
                    <View key={`req-${reqItem.request_id || senderId}`} style={styles.incomingCard}>
                      <View style={styles.incomingCardContent}>
                        <View style={styles.incomingAvatarWrap}>
                          {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.incomingAvatarImage} />
                          ) : (
                            <View style={styles.incomingAvatarPlaceholder}>
                              <Text style={styles.incomingAvatarInitial}>
                                {(sender.display_name || sender.username || "?").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.incomingInfoWrap}>
                          <View style={styles.incomingNameRow}>
                            <Text style={styles.incomingDisplayName} numberOfLines={1}>
                              {sender.display_name || sender.username}
                            </Text>
                            <View style={styles.newIndicatorTag}>
                              <Text style={styles.newIndicatorTagText}>New connection</Text>
                            </View>
                          </View>

                          <Text style={styles.incomingUsername} numberOfLines={1}>
                            @{sender.username}
                          </Text>

                          {!!(sender.profession || sender.about) && (
                            <Text style={styles.incomingBio} numberOfLines={1}>
                              {sender.profession || sender.about}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.incomingActionsRow}>
                        <TouchableOpacity
                          style={styles.incomingDeclineBtn}
                          onPress={() => handleDeclineRequest(sender)}
                          disabled={isLoading}
                          activeOpacity={0.8}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#6B7280" />
                          ) : (
                            <Text style={styles.incomingDeclineText}>Decline</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.incomingAcceptBtn}
                          onPress={() => handleAcceptRequest(sender)}
                          disabled={isLoading}
                          activeOpacity={0.85}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.incomingAcceptText}>Accept</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ======================================================== */}
            {/* SECTION 1: PEOPLE (Dark Theme) */}
            {/* ======================================================== */}
            {activeView === "all" && (
              <View style={styles.peopleSection}>
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Trust Network</Text>
                <Text style={styles.subtitle}>
                  {connections.length === 0
                    ? "No connections yet"
                    : connections.length <= 5
                    ? `${connections.length} ${connections.length === 1 ? "connection" : "connections"}`
                    : connections.length <= 13
                    ? `${connections.length} connections across 2 tiers`
                    : `${connections.length} connections across 3 tiers`}
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
                  <ConnectionGraph
                    connections={connections}
                    currentUser={currentUser}
                    isLoading={isLoadingConnections}
                    isError={connectionsError}
                    onRetry={fetchConnections}
                    onNodePress={(user) => setSelectedUserModal(user)}
                    onFindPeople={() => {
                      setIsSearchFocused(true);
                      searchInputRef.current?.focus();
                    }}
                  />
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
        </>
        )}
      </ScrollView>

      {/* USER PROFILE MODAL */}
      <Modal
        visible={!!selectedUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedUserModal(null)}
          />
          <View style={styles.userProfileCard}>
            <TouchableOpacity
              style={styles.closeCardBtn}
              onPress={() => setSelectedUserModal(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.cardAvatarContainer}>
              {selectedUserModal?.profile_image ? (
                <Image
                  source={{ uri: resolveImageUrl(selectedUserModal.profile_image) }}
                  style={styles.cardAvatarImage}
                />
              ) : (
                <View style={styles.cardAvatarPlaceholder}>
                  <Text style={styles.cardAvatarInitial}>
                    {(selectedUserModal?.display_name || selectedUserModal?.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.cardDisplayName}>
              {selectedUserModal?.display_name || selectedUserModal?.username}
            </Text>
            <Text style={styles.cardUsername}>@{selectedUserModal?.username}</Text>

            {!!(selectedUserModal?.profession || selectedUserModal?.about) && (
              <Text style={styles.cardBio}>
                {selectedUserModal?.profession || selectedUserModal?.about}
              </Text>
            )}

            <View style={styles.cardStatusBadge}>
              <Feather name="check-circle" size={14} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.cardStatusText}>Connected</Text>
            </View>

            <TouchableOpacity
              style={styles.removeConnectionBtn}
              onPress={() => selectedUserModal && handleRemoveConnection(selectedUserModal)}
              disabled={isRemovingConnection}
              activeOpacity={0.8}
            >
              {isRemovingConnection ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Feather name="user-x" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={styles.removeConnectionText}>Remove Connection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // --- CONNECT SEARCH STYLES (PRO MAX PURPLE GLASSMORPHISM) ---
  searchOuterWrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  searchGlassContainer: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    overflow: "hidden",
    position: "relative",
  },
  searchGlassSpecular: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  searchActiveGlowLayer: {
    borderRadius: 26,
  },
  searchIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(168, 85, 247, 0.22)",
    borderColor: "rgba(192, 132, 252, 0.35)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C084FC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  searchIcon: {
    // centered in badge
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
    letterSpacing: 0.2,
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  searchClearBtn: {
    padding: 4,
    marginRight: 2,
  },
  searchClearInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  loadingDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 36,
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#9333EA",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 13,
  },
  resultsList: {
    marginTop: 4,
  },
  resultsHeaderCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
  },
  resultAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  resultAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9333EA",
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resultDisplayName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  resultUsername: {
    fontSize: 13,
    color: "#9333EA",
    fontWeight: "500",
    marginTop: 1,
  },
  resultBio: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actionArea: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  connectBtn: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  connectBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  badgeRequested: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeRequestedText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "500",
  },
  badgeConnected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeConnectedText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
  },
  badgeYou: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  badgeYouText: {
    color: "#7E22CE",
    fontSize: 13,
    fontWeight: "600",
  },
  // --- USER PROFILE MODAL STYLES ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  userProfileCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: "relative",
  },
  closeCardBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  cardAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    borderWidth: 3,
    borderColor: "#C084FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  cardAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: "#7E22CE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  cardDisplayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  cardUsername: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  cardBio: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  cardStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginTop: 14,
    marginBottom: 18,
  },
  cardStatusText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
  },
  removeConnectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  removeConnectionText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  // --- INCOMING REQUESTS & BADGES STYLES ---
  mainTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    gap: 4,
  },
  headerBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  headerBadgeText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  tabBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    marginLeft: 4,
  },
  incomingRequestsContainer: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "#FAF5FF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  requestsHeaderRow: {
    marginBottom: 14,
  },
  requestsTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requestsSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#5B21B6",
  },
  requestsCountBadge: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestsCountBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  requestsSubtext: {
    fontSize: 12,
    color: "#7C3AED",
    marginTop: 2,
  },
  incomingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3E8FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  incomingCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  incomingAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  incomingAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  incomingAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  incomingAvatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#7C3AED",
  },
  incomingInfoWrap: {
    flex: 1,
    marginLeft: 12,
  },
  incomingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  incomingDisplayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 6,
  },
  newIndicatorTag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  newIndicatorTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7E22CE",
  },
  incomingUsername: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  incomingBio: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 3,
  },
  incomingActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  incomingDeclineBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  incomingDeclineText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "600",
  },
  incomingAcceptBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  incomingAcceptText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  searchDeclineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  searchDeclineText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "600",
  },
  searchAcceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
  searchAcceptText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

