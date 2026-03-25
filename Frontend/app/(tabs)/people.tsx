import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConnectionGraph from "../../components/ConnectionGraph";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";

export default function People() {
  const isFocused = useIsFocused();
  const [showInfo, setShowInfo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const lastState = useRef({ x: 0, y: 0, zoom: 1, pinchDist: 0 });

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
        lastState.current.x = position.x;
        lastState.current.y = position.y;
        lastState.current.zoom = zoom;

        if (touches.length >= 2) {
          lastState.current.pinchDist = getDistance(touches);
        } else {
          lastState.current.pinchDist = 0;
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const newDist = getDistance(touches);
          if (lastState.current.pinchDist > 0) {
            const scaleFactor = newDist / lastState.current.pinchDist;
            const newZoom = Math.min(
              Math.max(lastState.current.zoom * scaleFactor, 0.4),
              3.5,
            );
            setZoom(newZoom);
          }
        } else if (touches.length === 1 && lastState.current.pinchDist === 0) {
          setPosition({
            x: lastState.current.x + gestureState.dx,
            y: lastState.current.y + gestureState.dy,
          });
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" backgroundColor="#000000" />}
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Connections</Text>
          <Text style={styles.subtitle}>23 connections across 3 tiers</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowInfo(!showInfo)}
          style={styles.infoButton}
        >
          <Ionicons name="information" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      {showInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Trust Tiers</Text>

          <View style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.cardText}>
              <Text style={styles.bold}>Tier 1</Text> - Closest connections
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
              <Text style={styles.bold}>Tier 3</Text> - Growing connections
            </Text>
          </View>

          <Text style={styles.cardFooter}>
            Pinch to zoom • Drag to pan • Tap nodes for details
          </Text>
        </View>
      )}

      {/* 🔥 GRAPH */}
      <View style={styles.graphArea}>
        <View style={styles.graphWrapper}>
          <View
            {...panResponder.panHandlers}
            style={[
              styles.graphInner,
              {
                width: 800, // 🔥 FIX: same as SVG
                height: 800,
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { scale: zoom },
                ],
              },
            ]}
          >
            <ConnectionGraph />
          </View>
        </View>
      </View>

      {/* 🔥 ZOOM CONTROLS */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom((prev) => Math.min(prev + 0.3, 3))}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => setZoom((prev) => Math.max(prev - 0.2, 0.6))}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
          }}
        >
          <Ionicons name="expand" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    marginTop: 5,
  },

  // 🔥 FIXED AREA (prevents cut)
  graphArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  graphWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  graphInner: {
    justifyContent: "center",
    alignItems: "center",
  },

  infoButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7e22ce",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },

  card: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 16,
    marginTop: 15,
  },

  cardTitle: {
    color: "#fff",
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
    color: "#aaa",
  },

  bold: {
    color: "#fff",
    fontWeight: "600",
  },

  cardFooter: {
    color: "#666",
    marginTop: 12,
    fontSize: 12,
  },

  zoomControls: {
    position: "absolute",
    right: 15,
    bottom: 120,
  },

  zoomBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
});
