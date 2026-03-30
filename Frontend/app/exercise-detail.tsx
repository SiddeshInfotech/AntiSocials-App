import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Explicitly premium HD sources ensuring absolute high quality fetching over dynamic endpoints
const EXERCISES = [
  { name: 'PUSH-UPS', duration: 30, image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1200' },
  { name: 'SQUATS', duration: 30, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200' },
  { name: 'PLANKS', duration: 30, image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?q=80&w=1200' },
  { name: 'WALL WALKS', duration: 30, image: 'https://images.unsplash.com/photo-1552674605-15cff24ce8e6?q=80&w=1200' },
  { name: 'CRUNCHES', duration: 30, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200' },
  { name: 'BRIDGE', duration: 30, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200' }
];

const TIME_PER_EXERCISE = 30;

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_EXERCISE);
  const [isPaused, setIsPaused] = useState(false);

  const bgFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: any = null;
    
    if (!isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 250, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();
    }
    
    return () => clearInterval(interval);
  }, [isPaused, timeLeft]);

  const handleNext = () => {
    if (currentIndex < EXERCISES.length - 1) {
      Animated.timing(bgFadeAnim, { toValue: 0.1, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(TIME_PER_EXERCISE);
        setIsPaused(false);
        Animated.timing(bgFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    } else {
      router.replace('/exercise-complete');
    }
  };

  const togglePause = () => {
    if (timeLeft === 0) return handleNext();
    setIsPaused(!isPaused);
  };

  const currentExercise = EXERCISES[currentIndex];
  
  const totalDuration = EXERCISES.length * TIME_PER_EXERCISE;
  const elapsed = (currentIndex * TIME_PER_EXERCISE) + (TIME_PER_EXERCISE - timeLeft);
  const progressPercent = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background logic guaranteeing true immersive bleed without obfuscating the primary asset */}
      <Animated.Image source={{uri: currentExercise.image}} style={[StyleSheet.absoluteFillObject, {opacity: bgFadeAnim}]} blurRadius={30} />
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)', '#000000']} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={{flex: 1, justifyContent: 'space-between'}}>
        
        {/* Dynamic Nav Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
                <Feather name="chevron-left" size={26} color="#ffffff" />
            </TouchableOpacity>
            <Animated.Text style={[styles.headerTitle, {opacity: bgFadeAnim}]}>{currentExercise.name}</Animated.Text>
            <View style={{width: 44}} /> 
        </View>

        {/* Central Display Card (Prevents native cropping via robust contain rules entirely resolving the bug) */}
        <Animated.View style={[styles.imageCardWrapper, {opacity: bgFadeAnim}]}>
            <Image source={{uri: currentExercise.image}} style={styles.mainImage} resizeMode="contain" />
        </Animated.View>

        <View style={styles.bottomSection}>
            <Text style={styles.hugeTimer}>00:{timeLeft.toString().padStart(2, '0')}</Text>
            
            {/* Themed Control Module syncing to Reference Identity */}
            <View style={styles.controlsRow}>
                <View style={styles.pill}>
                    <Text style={styles.pillLabel}>COMPLETED</Text>
                    <Text style={styles.pillValue}>{progressPercent}%</Text>
                </View>

                <Animated.View style={{transform: [{scale: pulseAnim}]}}>
                    <TouchableOpacity style={styles.neonPlay} onPress={togglePause} activeOpacity={0.8}>
                        {timeLeft === 0 ? (
                           <Feather name="check" size={32} color="#000000" />
                        ) : isPaused ? (
                           <FontAwesome5 name="play" size={24} color="#000000" style={{marginLeft: 5}} />
                        ) : (
                           <FontAwesome5 name="pause" size={24} color="#000000" />
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.pill}>
                    <Text style={styles.pillLabel}>UP NEXT</Text>
                    <Text style={styles.pillValue}>
                       {currentIndex < EXERCISES.length - 1 ? EXERCISES[currentIndex+1].name : 'FINISH'}
                    </Text>
                </View>
            </View>

            {/* Direct Dedicated Bottom Navigation Prop */}
            {timeLeft === 0 ? (
                <TouchableOpacity style={styles.properBtn} onPress={handleNext} activeOpacity={0.9}>
                    <Text style={styles.properBtnText}>{currentIndex === EXERCISES.length - 1 ? 'COMPLETE WORKOUT' : 'NEXT EXERCISE'}</Text>
                    <Feather name="arrow-right" size={22} color="#000000" style={{marginLeft: 10}}/>
                </TouchableOpacity>
            ) : (
                <View style={{ height: 65, justifyContent: 'center' }}>
                    <Text style={{color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '700', letterSpacing: 2}}>MAINTAIN FORM & BREATHE</Text>
                </View>
            )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  
  imageCardWrapper: { 
      flex: 1, marginHorizontal: 20, marginTop: 25, marginBottom: 15, 
      backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 30, 
      overflow: 'hidden', shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  mainImage: { width: '100%', height: '100%' },
  
  bottomSection: { paddingHorizontal: 25, paddingBottom: 25, alignItems: 'center' },
  hugeTimer: { color: '#ffffff', fontSize: 85, fontWeight: '900', letterSpacing: -2.5, marginBottom: 30 },
  
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 25 },
  pill: { 
      backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 18, paddingHorizontal: 15, 
      borderRadius: 30, width: 110, alignItems: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  pillLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1.5, textAlign: 'center' },
  pillValue: { color: '#ffffff', fontSize: 13, fontWeight: '800', textAlign: 'center', paddingHorizontal: 5 },
  
  neonPlay: { 
      width: 85, height: 85, borderRadius: 42.5, backgroundColor: '#d9fc00', 
      alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, 
      shadowColor: '#d9fc00', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 
  },
  
  properBtn: { 
      height: 65, width: '100%', backgroundColor: '#d9fc00', borderRadius: 20, 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#d9fc00', shadowOpacity: 0.3, shadowRadius: 15, elevation: 5
  },
  properBtnText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 }
});
