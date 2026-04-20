import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  exerciseId?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  isCard?: boolean;
}

// CDN URLs (like Pixabay or Pexels) often return 403 Forbidden when accessed directly from a mobile app.
// It is HIGHLY RECOMMENDED to download your MP4 files and require them locally:
// Example: '1': require('../assets/videos/jumping_jacks.mp4'),
const EXERCISE_VIDEOS: Record<string, string | any> = {
  '1': require('../assets/videos/Jumping_Jacks_Workout_Video.mp4'), // Jumping Jacks / Cardio
  '2': require('../assets/videos/Squat_Form_Demonstration_Video.mp4'), // Squats
  '3': require('../assets/videos/Push_Up_Workout_Video.mp4'), // Push-Ups
  '4': require('../assets/videos/High_Knees_Workout_Video.mp4'), // High Knees
  '5': require('../assets/videos/Lunge_Workout_Video_Generation.mp4'), // Lunges
  '6': require('../assets/videos/Plank_Exercise_Video_Generation.mp4'), // Plank
};

export default function RealisticExercise({ exerciseId = '1', width = '100%', height = '100%', isCard = false }: Props) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Create a gentle pulsing spotlight effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [glowAnim]);

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.1]
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6]
  });

  const videoUri = EXERCISE_VIDEOS[exerciseId] || EXERCISE_VIDEOS['1'];

  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    player.muted = true;
    player.playbackRate = isCard ? 1.0 : 1.2;
    player.play();
  });

  return (
    <View style={[styles.container, { width, height }]}>
      
      {/* ── Spotlight / Glow ── */}
      <Animated.View style={[styles.spotlight, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

      {/* ── Realistic Video Coach ── */}
      <VideoView
        style={StyleSheet.absoluteFillObject}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* ── Soft Overlay for Text Readability ── */}
      {isCard ? (
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.7)', '#0a0a0f']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : (
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.3)', '#0a0a0f']}
          locations={[0.5, 0.8, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 20,
  },
  spotlight: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    backgroundColor: 'rgba(255, 59, 48, 0.15)', // Brand color subtle glow
    borderRadius: 200,
  }
});
