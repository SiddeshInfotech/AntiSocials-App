import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { resolveImageUrl } from '../constants/ImageUtils';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CENTER_X = 400;
const CENTER_Y = 400;

export interface ConnectedUserNode {
  id: number;
  user_id?: number;
  username: string;
  display_name?: string;
  profile_image?: string | null;
  profession?: string;
  about?: string;
  connection_status?: string;
}

interface ConnectionGraphProps {
  connections?: ConnectedUserNode[];
  currentUser?: {
    username?: string;
    profile_image?: string | null;
    display_name?: string | null;
  } | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onNodePress?: (node: ConnectedUserNode) => void;
  onFindPeople?: () => void;
}

interface AnimatedNodeItem extends ConnectedUserNode {
  nodeKey: string;
  tier: number;
  baseRadius: number;
  angleDeg: number;
  angleRad: number;
  radiusAnim: Animated.Value;
  lineRadiusAnim: Animated.Value;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
}

// Calculate dynamic radial tier positions for N users
const calculateLayout = (items: ConnectedUserNode[]) => {
  const total = items.length;
  if (total === 0) return [];

  let t1Count = 0;
  let t2Count = 0;
  let t3Count = 0;

  if (total <= 5) {
    t1Count = total;
  } else if (total <= 13) {
    t1Count = 5;
    t2Count = total - 5;
  } else {
    t1Count = 5;
    t2Count = 8;
    t3Count = total - 13;
  }

  let t1Idx = 0;
  let t2Idx = 0;
  let t3Idx = 0;

  return items.map((user, idx) => {
    let tier = 1;
    let baseRadius = 130;
    let angleDeg = 0;

    if (idx < t1Count) {
      tier = 1;
      baseRadius = 130;
      angleDeg = -90 + (360 / t1Count) * t1Idx;
      t1Idx++;
    } else if (idx < t1Count + t2Count) {
      tier = 2;
      baseRadius = 220;
      angleDeg = -90 + 22.5 + (360 / t2Count) * t2Idx;
      t2Idx++;
    } else {
      tier = 3;
      baseRadius = 290;
      angleDeg = -90 + 45 + (360 / t3Count) * t3Idx;
      t3Idx++;
    }

    return {
      ...user,
      tier,
      baseRadius,
      angleDeg,
      angleRad: (angleDeg * Math.PI) / 180,
    };
  });
};

export default function ConnectionGraph({
  connections = [],
  currentUser = null,
  isLoading = false,
  isError = false,
  onRetry,
  onNodePress,
  onFindPeople,
}: ConnectionGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(null);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);
  const [animatedNodes, setAnimatedNodes] = useState<AnimatedNodeItem[]>([]);
  const prevNodesRef = useRef<{ [key: string]: AnimatedNodeItem }>({});

  const tierRadii = useRef({
    1: new Animated.Value(130),
    2: new Animated.Value(220),
    3: new Animated.Value(290),
  }).current;

  // Pulse animation for loading / empty state rings (Native driver)
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Synchronize dynamic nodes when connections prop changes
  useEffect(() => {
    const layout = calculateLayout(connections);
    const newAnimatedNodes: AnimatedNodeItem[] = [];
    const nextPrevMap: { [key: string]: AnimatedNodeItem } = {};

    layout.forEach((item) => {
      const nodeKey = `node-${item.id}`;
      const existing = prevNodesRef.current[nodeKey];

      let radiusAnim: Animated.Value;
      let lineRadiusAnim: Animated.Value;
      let scaleAnim: Animated.Value;
      let opacityAnim: Animated.Value;

      if (existing) {
        radiusAnim = existing.radiusAnim;
        lineRadiusAnim = existing.lineRadiusAnim;
        scaleAnim = existing.scaleAnim;
        opacityAnim = existing.opacityAnim;
      } else {
        // New node: animate outward from center
        radiusAnim = new Animated.Value(0);
        lineRadiusAnim = new Animated.Value(0);
        scaleAnim = new Animated.Value(0.2);
        opacityAnim = new Animated.Value(0);

        // Native animations for Animated.View transform & opacity
        Animated.parallel([
          Animated.spring(radiusAnim, {
            toValue: item.baseRadius,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();

        // JS animation for SVG line (react-native-svg props)
        Animated.spring(lineRadiusAnim, {
          toValue: item.baseRadius,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }).start();
      }

      const nodeObj: AnimatedNodeItem = {
        ...item,
        nodeKey,
        radiusAnim,
        lineRadiusAnim,
        scaleAnim,
        opacityAnim,
      };

      newAnimatedNodes.push(nodeObj);
      nextPrevMap[nodeKey] = nodeObj;
    });

    prevNodesRef.current = nextPrevMap;
    setAnimatedNodes(newAnimatedNodes);
  }, [connections]);

  // Expand / dim / selection animation
  useEffect(() => {
    let tier1Target = 130;
    let tier2Target = 220;
    let tier3Target = 290;

    if (expandedTier === 1) {
      tier1Target = 160;
      tier2Target = 250;
      tier3Target = 320;
    } else if (expandedTier === 2) {
      tier1Target = 110;
      tier2Target = 230;
      tier3Target = 310;
    } else if (expandedTier === 3) {
      tier1Target = 90;
      tier2Target = 180;
      tier3Target = 300;
    }

    const nativeAnimations: Animated.CompositeAnimation[] = [];
    const jsAnimations: Animated.CompositeAnimation[] = [
      Animated.spring(tierRadii[1], { toValue: tier1Target, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.spring(tierRadii[2], { toValue: tier2Target, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.spring(tierRadii[3], { toValue: tier3Target, friction: 8, tension: 40, useNativeDriver: false }),
    ];

    animatedNodes.forEach((node) => {
      let targetR = node.tier === 1 ? tier1Target : node.tier === 2 ? tier2Target : tier3Target;
      const isSelected = selectedNodeId === node.id;
      const isDimmed = selectedNodeId !== null && !isSelected;

      nativeAnimations.push(
        Animated.spring(node.radiusAnim, {
          toValue: targetR,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(node.scaleAnim, {
          toValue: isSelected ? 1.3 : isDimmed ? 0.8 : 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(node.opacityAnim, {
          toValue: isDimmed ? 0.35 : 1,
          duration: 300,
          useNativeDriver: true,
        })
      );

      jsAnimations.push(
        Animated.spring(node.lineRadiusAnim, {
          toValue: targetR,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        })
      );
    });

    if (nativeAnimations.length > 0) {
      Animated.parallel(nativeAnimations).start();
    }
    if (jsAnimations.length > 0) {
      Animated.parallel(jsAnimations).start();
    }
  }, [expandedTier, selectedNodeId, animatedNodes]);

  const handleNodePress = (node: AnimatedNodeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
      setExpandedTier(null);
    } else {
      setSelectedNodeId(node.id);
      setExpandedTier(node.tier);
    }

    if (onNodePress) {
      onNodePress(node);
    }
  };

  const handleCenterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedNodeId('center');
    setExpandedTier(null);
  };

  const userAvatarUri = currentUser?.profile_image ? resolveImageUrl(currentUser.profile_image) : null;

  return (
    <View style={styles.container}>
      {/* Background Concentric SVG Guide Rings & Lines */}
      <Svg height="800" width="800" style={StyleSheet.absoluteFill}>
        {connections.length > 0 && (
          <>
            <AnimatedCircle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={tierRadii[1]}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 6"
              strokeWidth={1.5}
              fill="none"
            />
            {connections.length > 5 && (
              <AnimatedCircle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={tierRadii[2]}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
                strokeWidth={1.5}
                fill="none"
              />
            )}
            {connections.length > 13 && (
              <AnimatedCircle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={tierRadii[3]}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 6"
                strokeWidth={1.5}
                fill="none"
              />
            )}
          </>
        )}

        {/* Floating Connection Lines between YOU and Connected Users */}
        {animatedNodes.map((node) => {
          const nodeX = Animated.add(CENTER_X, Animated.multiply(node.lineRadiusAnim, Math.cos(node.angleRad)));
          const nodeY = Animated.add(CENTER_Y, Animated.multiply(node.lineRadiusAnim, Math.sin(node.angleRad)));

          const isSelected = selectedNodeId === node.id;

          return (
            <AnimatedLine
              key={`line-${node.nodeKey}`}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={nodeX}
              y2={nodeY}
              stroke={isSelected ? '#c084fc' : 'rgba(168, 85, 247, 0.35)'}
              strokeWidth={isSelected ? '2.5' : '1.2'}
            />
          );
        })}
      </Svg>

      {/* Render Dynamic Connected User Nodes */}
      {animatedNodes.map((node) => {
        const translateX = Animated.add(CENTER_X - 24, Animated.multiply(node.radiusAnim, Math.cos(node.angleRad)));
        const translateY = Animated.add(CENTER_Y - 24, Animated.multiply(node.radiusAnim, Math.sin(node.angleRad)));
        const isSelected = selectedNodeId === node.id;
        const avatarUri = node.profile_image ? resolveImageUrl(node.profile_image) : null;
        const displayName = node.display_name || node.username || 'User';

        return (
          <Animated.View
            key={node.nodeKey}
            style={[
              styles.nodeWrapper,
              {
                opacity: node.opacityAnim,
                transform: [{ translateX }, { translateY }, { scale: node.scaleAnim }],
                zIndex: isSelected ? 100 : node.tier,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleNodePress(node)}
              style={[styles.avatarCircle, isSelected && styles.avatarSelected]}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.nodeAvatarImage} />
              ) : (
                <Text style={styles.nodeInitials}>{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.nodeLabel, isSelected && styles.nodeLabelSelected]} numberOfLines={1}>
              {displayName}
            </Text>
          </Animated.View>
        );
      })}

      {/* Center Node (YOU) */}
      <Animated.View
        style={[
          styles.centerNodeWrapper,
          {
            left: CENTER_X - 45,
            top: CENTER_Y - 45,
            transform: [{ scale: selectedNodeId === 'center' ? 1.05 : 1 }],
            opacity: selectedNodeId !== null && selectedNodeId !== 'center' ? 0.35 : 1,
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleCenterPress} style={styles.centerNodeInner}>
          <Animated.View style={[styles.centerGlowRing1, { opacity: pulseAnim }]} />
          <View style={styles.centerGlowRing2} />
          <View style={[styles.centerNode, selectedNodeId === 'center' && { borderColor: '#e879f9' }]}>
            {userAvatarUri ? (
              <Image source={{ uri: userAvatarUri }} style={styles.centerAvatarImage} />
            ) : (
              <Text style={styles.centerEmoji}>🧘</Text>
            )}
          </View>
          <Text style={[styles.centerLabel, selectedNodeId === 'center' && { color: '#e879f9', fontWeight: 'bold' }]}>
            You
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* OVERLAY STATES: Loading / Error / Empty */}
      {isLoading && (
        <View style={styles.statusOverlay}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.statusText}>Loading trust network...</Text>
        </View>
      )}

      {!isLoading && connections.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Animated.View style={[styles.emptyPulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.emptyTitle}>Your trust network is waiting.</Text>
          <Text style={styles.emptySubtitle}>Connect with people to grow your network.</Text>
          {onFindPeople && (
            <TouchableOpacity style={styles.findPeopleBtn} onPress={onFindPeople} activeOpacity={0.85}>
              <Feather name="user-plus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.findPeopleBtnText}>Find People</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 800,
    height: 800,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Floating Node Overlays
  nodeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4c1d95',
    borderWidth: 2,
    borderColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarSelected: {
    borderColor: '#e879f9',
    borderWidth: 2.5,
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },
  nodeAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  nodeInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f3e8ff',
  },
  nodeLabel: {
    fontSize: 11,
    color: '#e4e4e7',
    marginTop: 4,
    fontWeight: '600',
    position: 'absolute',
    bottom: -20,
    width: 70,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nodeLabelSelected: {
    color: '#f472b6',
    fontWeight: '700',
  },

  // Geometric Center (YOU)
  centerNodeWrapper: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  centerNodeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlowRing1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.25)',
  },
  centerGlowRing2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
  },
  centerNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7e22ce',
    borderWidth: 2.5,
    borderColor: '#c084fc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#d8b4fe',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 2,
  },
  centerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  centerEmoji: {
    fontSize: 28,
  },
  centerLabel: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
    position: 'absolute',
    bottom: -22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Status Overlays
  statusOverlay: {
    position: 'absolute',
    top: CENTER_Y + 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    zIndex: 60,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  errorTextTitle: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty Overlay
  emptyOverlay: {
    position: 'absolute',
    top: CENTER_Y + 75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(24, 16, 43, 0.85)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    width: 280,
    zIndex: 60,
  },
  emptyPulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    top: -125,
  },
  emptyTitle: {
    color: '#f3e8ff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  findPeopleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  findPeopleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});