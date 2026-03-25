import React, { useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CENTER_X = 400;
const CENTER_Y = 400;

const ALL_NODES_CONFIG = [
  // Tier 1 (Radius 100)
  { tier: 1, baseRadius: 100, name: "Sarah", angleDeg: -90, emoji: "👱‍♀️" },
  { tier: 1, baseRadius: 100, name: "Marcus", angleDeg: -10, emoji: "👨" },
  { tier: 1, baseRadius: 100, name: "David", angleDeg: 100, emoji: "👱‍♂️" },
  { tier: 1, baseRadius: 100, name: "Aisha", angleDeg: 190, emoji: "👩" },

  // Tier 2 (Radius 180)
  { tier: 2, baseRadius: 180, name: "James", angleDeg: -90, emoji: "👨" },
  { tier: 2, baseRadius: 180, name: "Maria", angleDeg: -30, emoji: "👩" },
  { tier: 2, baseRadius: 180, name: "Alex", angleDeg: 20, emoji: "👱‍♂️" },
  { tier: 2, baseRadius: 180, name: "Elena", angleDeg: 60, emoji: "👩" },
  { tier: 2, baseRadius: 180, name: "Ryan", angleDeg: 90, emoji: "👨" },
  { tier: 2, baseRadius: 180, name: "Sophie", angleDeg: 135, emoji: "👱‍♀️" },
  { tier: 2, baseRadius: 180, name: "Tom", angleDeg: 180, emoji: "👨" },
  { tier: 2, baseRadius: 180, name: "Lisa", angleDeg: -140, emoji: "👩" },

  // Tier 3 (Radius 270)
  { tier: 3, baseRadius: 270, name: "Chris", angleDeg: -90, emoji: "👨" },
  { tier: 3, baseRadius: 270, name: "Emma", angleDeg: -45, emoji: "👱‍♀️" },
  { tier: 3, baseRadius: 270, name: "Jake", angleDeg: 0, emoji: "👨" },
  { tier: 3, baseRadius: 270, name: "Olivia", angleDeg: 35, emoji: "👩" },
  { tier: 3, baseRadius: 270, name: "Noah", angleDeg: 70, emoji: "👱‍♂️" },
  { tier: 3, baseRadius: 270, name: "Liam", angleDeg: 110, emoji: "👨" },
  { tier: 3, baseRadius: 270, name: "Ava", angleDeg: 150, emoji: "👩" },
  { tier: 3, baseRadius: 270, name: "Ethan", angleDeg: 180, emoji: "👨" },
  { tier: 3, baseRadius: 270, name: "Mia", angleDeg: -135, emoji: "👱‍♀️" },
];

const generateAnimatedNodes = () => {
  return ALL_NODES_CONFIG.map((n, idx) => ({
    id: `node-${idx}`,
    ...n,
    angleRad: n.angleDeg * (Math.PI / 180),
    radiusAnim: new Animated.Value(n.baseRadius),
    scaleAnim: new Animated.Value(1),
    opacityAnim: new Animated.Value(1),
  }));
};

export default function ConnectionGraph() {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [expandedTier, setExpandedTier] = React.useState<number | null>(null);

  const nodesRef = useRef(generateAnimatedNodes());
  const nodes = nodesRef.current;

  const tierRadii = useRef({
    1: new Animated.Value(100),
    2: new Animated.Value(180),
    3: new Animated.Value(270),
  }).current;

  useEffect(() => {
    let tier1Target = 100;
    let tier2Target = 180;
    let tier3Target = 270;

    // Expand logic pushing tiers beautifully using fluid physics
    if (expandedTier === 1) {
        tier1Target = 140;
        tier2Target = 230;
        tier3Target = 320;
    } else if (expandedTier === 2) {
        tier1Target = 100;
        tier2Target = 200;
        tier3Target = 300;
    } else if (expandedTier === 3) {
        tier1Target = 80;
        tier2Target = 160;
        tier3Target = 290;
    }

    const animations: Animated.CompositeAnimation[] = [];

    // Animate bounding background guide rings seamlessly bridging standard bounds 
    animations.push(
      Animated.spring(tierRadii[1], { toValue: tier1Target, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.spring(tierRadii[2], { toValue: tier2Target, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.spring(tierRadii[3], { toValue: tier3Target, friction: 8, tension: 40, useNativeDriver: false })
    );

    // Physically animate every individual floating character entity dynamically pushing into the target zone
    nodes.forEach(node => {
      let targetR = node.tier === 1 ? tier1Target : node.tier === 2 ? tier2Target : tier3Target;
      
      const isSelected = selectedNode === node.id;
      const isDimmed = selectedNode !== null && !isSelected;

      animations.push(
        Animated.spring(node.radiusAnim, {
          toValue: targetR,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.spring(node.scaleAnim, {
          toValue: isSelected ? 1.3 : (isDimmed ? 0.8 : 1), // Highlight node natively safely scaling!
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(node.opacityAnim, {
          toValue: isDimmed ? 0.35 : 1, // Dim naturally focusing attention seamlessly
          duration: 300,
          useNativeDriver: true,
        })
      );
    });

    Animated.parallel(animations).start();
  }, [expandedTier, selectedNode]);

  const handleNodePress = (node: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedNode === node.id) {
       setSelectedNode(null);
       setExpandedTier(null); // Collapse gracefully 
    } else {
       setSelectedNode(node.id);
       setExpandedTier(node.tier); // Expand contextual tier gracefully 
    }
  };

  const handleCenterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedNode("center");
    setExpandedTier(null); // Collapse all tiers
  };

  return (
    <View style={styles.container}>
      {/* 
        Native Animated Line rendering using completely decoupled Animated native offsets 
        to perfectly match mathematical boundaries without needing performance drops mappings! 
      */}
      <Svg height="800" width="800" style={StyleSheet.absoluteFill}>
        {/* Draw subtle concentric guide rings reflecting tier geometry magically mapped via physics loop values! */}
        <AnimatedCircle cx={CENTER_X} cy={CENTER_Y} r={tierRadii[1]} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" strokeWidth={1.5} fill="none" />
        <AnimatedCircle cx={CENTER_X} cy={CENTER_Y} r={tierRadii[2]} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" strokeWidth={1.5} fill="none" />
        <AnimatedCircle cx={CENTER_X} cy={CENTER_Y} r={tierRadii[3]} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" strokeWidth={1.5} fill="none" />

        {/* Drawing tracking connection nodes physically bound bridging logic natively! */}
        {nodes.map(node => {
           const nodeX = Animated.add(CENTER_X, Animated.multiply(node.radiusAnim, Math.cos(node.angleRad)));
           const nodeY = Animated.add(CENTER_Y, Animated.multiply(node.radiusAnim, Math.sin(node.angleRad)));

           const isSelected = selectedNode === node.id;
           const isDimmed = selectedNode !== null && !isSelected && selectedNode !== "center";

           return (
             <AnimatedLine 
                key={`line-${node.id}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={nodeX}
                y2={nodeY}
                stroke={isSelected ? "#c084fc" : "rgba(168, 85, 247, 0.3)"}
                strokeWidth={isSelected ? "2" : "1"}
             />
           );
        })}
      </Svg>

      {/* Render the interactive Nodes smoothly anchored via safe translates overlapping SVG paths seamlessly! */}
      {nodes.map(node => {
         const translateX = Animated.add(CENTER_X - 22, Animated.multiply(node.radiusAnim, Math.cos(node.angleRad)));
         const translateY = Animated.add(CENTER_Y - 22, Animated.multiply(node.radiusAnim, Math.sin(node.angleRad)));
         const isSelected = selectedNode === node.id;

         return (
           <Animated.View 
              key={`node-${node.id}`} 
              style={[
                styles.nodeWrapper,
                {
                   opacity: node.opacityAnim,
                   transform: [
                     { translateX }, 
                     { translateY },
                     { scale: node.scaleAnim }
                   ],
                   zIndex: isSelected ? 100 : node.tier
                }
              ]}
           >
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNodePress(node)} style={[styles.avatarCircle, isSelected && styles.avatarSelected]}>
                 <Text style={styles.nodeEmoji}>{node.emoji}</Text>
              </TouchableOpacity>
              <Text style={[styles.nodeLabel, isSelected && styles.nodeLabelSelected]}>{node.name}</Text>
           </Animated.View>
         );
      })}

      {/* Render YOU prominently mapped in the geometric exact center! */}
      <Animated.View style={[
        styles.centerNodeWrapper, 
        { 
           left: CENTER_X - 45, 
           top: CENTER_Y - 45,
           transform: [{ scale: selectedNode === "center" ? 1.05 : 1 }],
           opacity: selectedNode !== null && selectedNode !== "center" ? 0.35 : 1
        }
      ]}>
         <TouchableOpacity activeOpacity={0.9} onPress={handleCenterPress} style={styles.centerNodeInner}>
           <View style={styles.centerGlowRing1} />
           <View style={styles.centerGlowRing2} />
           <View style={[styles.centerNode, selectedNode === "center" && { borderColor: '#e879f9', shadowRadius: 25 }]}>
              <Text style={styles.centerEmoji}>🧘</Text>
           </View>
           <Text style={[styles.centerLabel, selectedNode === "center" && { color: '#e879f9', fontWeight: 'bold' }]}>You</Text>
         </TouchableOpacity>
      </Animated.View>
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
  
  // Custom Floating Node Overlays 
  nodeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44, // Using exact dimensions to center coordinate alignment mappings
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4c1d95',
    borderWidth: 2,
    borderColor: '#7e22ce',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarSelected: {
    borderColor: '#d8b4fe',
    shadowOpacity: 0.9,
    shadowRadius: 15,
  },
  nodeEmoji: {
    fontSize: 18,
  },
  nodeLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    marginTop: 4,
    fontWeight: '500',
    position: 'absolute',
    bottom: -18,
    width: 60,
    textAlign: 'center',
  },
  nodeLabelSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Geometric Magic Center (You)
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
     backgroundColor: 'rgba(168, 85, 247, 0.08)',
     borderWidth: 1,
     borderColor: 'rgba(216, 180, 254, 0.2)',
  },
  centerGlowRing2: {
     position: 'absolute',
     width: 110,
     height: 110,
     borderRadius: 55,
     backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  centerNode: {
     width: 64,
     height: 64,
     borderRadius: 32,
     backgroundColor: '#7e22ce',
     borderWidth: 2,
     borderColor: '#c084fc',
     alignItems: 'center',
     justifyContent: 'center',
     shadowColor: '#d8b4fe',
     shadowOpacity: 0.8,
     shadowRadius: 15,
     elevation: 8,
     zIndex: 2,
  },
  centerEmoji: {
     fontSize: 28,
  },
  centerLabel: {
     fontSize: 12,
     color: '#ffffff',
     fontWeight: '600',
     position: 'absolute',
     bottom: -20,
  }
});