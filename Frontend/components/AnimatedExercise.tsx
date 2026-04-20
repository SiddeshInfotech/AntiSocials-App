import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Easing, DimensionValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  exerciseId?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  isCard?: boolean;
}

export default function AnimatedExercise({ exerciseId = '1', width = '100%', height = '100%', isCard = false }: Props) {
  const [isPlaying, setIsPlaying] = useState(!isCard); // Cards auto-play but don't show toggle by default... wait, let's keep playing always for both
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsPlaying(true); // Always play
  }, [exerciseId]);

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation;
    if (isPlaying) {
      const baseDuration = isCard ? 900 : 700; // slightly slower in card view for subtlety
      const duration = exerciseId === '6' ? 2000 : // plank breathing is very slow
                       exerciseId === '4' ? baseDuration * 0.8 : // high knees faster
                       baseDuration;

      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          })
        ])
      );
      animLoop.start();
    } else {
      animation.stopAnimation();
    }
    
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isPlaying, animation, exerciseId, isCard]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // ─── Default (Idle / Default) ───
  let rotateFigure = '0deg';
  let gY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  let lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '15deg'] });
  let rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '-15deg'] });
  let lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '5deg'] });
  let rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '-5deg'] });

  // ─── Animations ───
  if (exerciseId === '1') {
    // Jumping Jacks
    gY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });
    lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '160deg'] });
    rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '-160deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '30deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-30deg'] });
  } else if (exerciseId === '2') {
    // Squats
    gY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
    lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '75deg'] });
    rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '-75deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '25deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-25deg'] });
  } else if (exerciseId === '3') {
    // Push-ups
    rotateFigure = '-80deg'; // Slightly angled horizontal
    gY = animation.interpolate({ inputRange: [0, 1], outputRange: [5, 25] }); // moving down towards floor
    lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['70deg', '120deg'] }); // arms splaying out/bending
    rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['100deg', '50deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });
  } else if (exerciseId === '4') {
    // High Knees (alternating)
    gY = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });
    lArm = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['30deg', '-30deg', '30deg'] });
    rArm = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-30deg', '30deg', '-30deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '85deg', '0deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['85deg', '0deg', '85deg'] });
  } else if (exerciseId === '5') {
    // Lunges
    gY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
    lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['10deg', '-30deg'] });
    rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '30deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-40deg'] });
  } else if (exerciseId === '6') {
    // Plank
    rotateFigure = '-80deg';
    gY = animation.interpolate({ inputRange: [0, 1], outputRange: [10, 12] });
    lArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['80deg', '82deg'] });
    rArm = animation.interpolate({ inputRange: [0, 1], outputRange: ['80deg', '82deg'] });
    lLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });
    rLeg = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });
  }

  const glowScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, exerciseId === '1' ? 1.2 : 1.05]
  });

  const glowOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [isCard ? 0.05 : 0.1, isCard ? 0.15 : 0.3]
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {!isCard && <LinearGradient colors={['#1c1c24', '#0a0a0f']} style={StyleSheet.absoluteFillObject} />}
      
      {/* Glow behind the figure */}
      <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      
      <Animated.View style={[styles.figureGlobal, { transform: [{ translateY: gY }] }]}>
        <Animated.View style={[styles.figure, { transform: [{ rotate: rotateFigure }] }]}>
          <View style={styles.head} />
          <View style={styles.torso} />
          
          <Animated.View style={[styles.joint, styles.leftShoulder, { transform: [{ rotate: lArm }] }]}>
            <View style={styles.armLimb} />
          </Animated.View>
          <Animated.View style={[styles.joint, styles.rightShoulder, { transform: [{ rotate: rArm }] }]}>
            <View style={styles.armLimb} />
          </Animated.View>

          <Animated.View style={[styles.joint, styles.leftHip, { transform: [{ rotate: lLeg }] }]}>
            <View style={styles.legLimb} />
          </Animated.View>
          <Animated.View style={[styles.joint, styles.rightHip, { transform: [{ rotate: rLeg }] }]}>
            <View style={styles.legLimb} />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {!isCard && (
        <TouchableOpacity style={styles.playToggle} onPress={togglePlay} activeOpacity={0.8}>
          <Feather name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ff3b30',
  },
  figureGlobal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  figure: {
    width: 16,
    alignItems: 'center',
    position: 'relative',
    marginTop: -20,
  },
  head: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    marginBottom: 6,
    zIndex: 2,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  torso: {
    width: 16,
    height: 70,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    zIndex: 2,
  },
  joint: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  leftShoulder: {
    top: 38,
    left: -2,
  },
  rightShoulder: {
    top: 38,
    right: -2,
  },
  leftHip: {
    top: 98,
    left: 2,
  },
  rightHip: {
    top: 98,
    right: 2,
  },
  armLimb: {
    width: 10,
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginTop: 27.5,
  },
  legLimb: {
    width: 12,
    height: 75,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginTop: 37.5,
  },
  playToggle: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
