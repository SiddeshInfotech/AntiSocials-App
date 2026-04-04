import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartExerciseScreen() {
    const router = useRouter();

    // Utilizing the guaranteed HD push-up image as the anchor theme
    const coverImg = 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1200';

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Immersive Blurred Background */}
            <Image source={{uri: coverImg}} style={[StyleSheet.absoluteFillObject, {opacity: 0.5}]} blurRadius={20} />
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000000']} style={StyleSheet.absoluteFillObject} />
            
            <SafeAreaView style={{flex: 1}}>
                {/* Premium Clean Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
                       <Feather name="chevron-left" size={26} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>STRETCH & STRENGTH</Text>
                    <View style={{width: 44}} />
                </View>

                {/* Stunning Rounded Card rendering NO cropping whatsoever via resizeMode="contain" */}
                <Animated.View style={[styles.imageCardWrapper, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
                    <Image source={{uri: coverImg}} style={styles.mainImage} resizeMode="contain" />
                </Animated.View>

                {/* Deep layout integrating Exact layout cues from Reference Image */}
                <View style={styles.bottomSection}>
                     <Text style={styles.hugeTimer}>03:00</Text>
                     
                     <View style={styles.controlsRow}>
                        <View style={styles.pill}>
                           <Text style={styles.pillLabel}>TIME</Text>
                           <Text style={styles.pillValue}>3 MIN</Text>
                        </View>

                        <TouchableOpacity style={styles.neonPlay} onPress={() => router.push('/exercise-detail')} activeOpacity={0.8}>
                            <FontAwesome5 name="play" size={24} color="#000000" style={{marginLeft: 5}} />
                        </TouchableOpacity>

                        <View style={styles.pill}>
                           <Text style={styles.pillLabel}>WORKOUTS</Text>
                           <Text style={styles.pillValue}>6 SETS</Text>
                        </View>
                     </View>

                     {/* Proper Full-Width Bottom Action Button replacing arbitrary icons */}
                     <TouchableOpacity style={styles.properBtn} onPress={() => router.push('/exercise-detail')} activeOpacity={0.9}>
                        <Text style={styles.properBtnText}>START WORKOUT</Text>
                        <Feather name="arrow-right" size={22} color="#000000" style={{marginLeft: 8}}/>
                     </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  
  // Immersive Card Wrapper for true aspect-ratio preservation
  imageCardWrapper: { 
      flex: 1, marginHorizontal: 20, marginTop: 25, marginBottom: 10, 
      backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 35, 
      overflow: 'hidden', shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  mainImage: { width: '100%', height: '100%' },
  
  bottomSection: { paddingHorizontal: 25, paddingBottom: 35, alignItems: 'center' },
  hugeTimer: { color: '#ffffff', fontSize: 80, fontWeight: '900', letterSpacing: -2.5, marginBottom: 25 },
  
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 35 },
  pill: { 
      backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 18, paddingHorizontal: 20, 
      borderRadius: 30, width: 115, alignItems: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  pillLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1.5 },
  pillValue: { color: '#ffffff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  
  neonPlay: { 
      width: 80, height: 80, borderRadius: 40, backgroundColor: '#d9fc00', 
      alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, 
      shadowColor: '#d9fc00', shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 
  },
  
  properBtn: { 
      height: 65, width: '100%', backgroundColor: '#ffffff', borderRadius: 20, 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#fff', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  properBtnText: { color: '#000000', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 }
});
