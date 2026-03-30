import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

/** 
 * Final Success Screen mapped to premium dark environment
 */
export default function ExerciseCompleteScreen() {
  const router = useRouter();
  
  // Immersive backdrop sync
  const bgImg = 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=1200';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Heavy aesthetic immersive background logic */}
      <Image source={{uri: bgImg}} style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]} blurRadius={30} />
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)', '#000000']} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={{flex: 1, padding: 30}}>
        
        {/* Dynamic Card aligning with standard typography formatting */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{scale: scaleAnim}] }]}>
           
           <View style={styles.checkCircle}>
              <Feather name="check" size={50} color="#000000" />
           </View>
           
           <Text style={styles.title}>WORKOUT</Text>
           <Text style={styles.subtitle}>COMPLETED!</Text>

           <View style={styles.pointsWrap}>
              <FontAwesome5 name="fire-alt" size={24} color="#d9fc00" style={{marginRight: 10}} />
              <Text style={styles.pointsText}>+250 XP EARNED</Text>
           </View>

           <Text style={styles.motivationText}>Excellent execution. You showed up today, now rest and recover!</Text>

           <TouchableOpacity style={styles.properBtn} onPress={() => router.replace('/(tabs)/tasks')} activeOpacity={0.9}>
               <Text style={styles.properBtnText}>GO BACK TO TASKS</Text>
               <Feather name="home" size={20} color="#000000" style={{marginLeft: 10}}/>
           </TouchableOpacity>

        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  card: { 
      flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 40,
      alignItems: 'center', justifyContent: 'center', padding: 30,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginVertical: 40,
      shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, elevation: 20
  },
  
  checkCircle: {
      width: 100, height: 100, borderRadius: 50, backgroundColor: '#d9fc00',
      alignItems: 'center', justifyContent: 'center', marginBottom: 40,
      shadowColor: '#d9fc00', shadowOpacity: 0.6, shadowRadius: 25, elevation: 15
  },
  
  title: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: 2 },
  subtitle: { fontSize: 32, fontWeight: '900', color: '#d9fc00', letterSpacing: 2, marginBottom: 40 },
  
  pointsWrap: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', 
      paddingVertical: 15, paddingHorizontal: 25, borderRadius: 20, marginBottom: 25 
  },
  pointsText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  
  motivationText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 50, fontWeight: '500' },
  
  properBtn: { 
      height: 65, width: '100%', backgroundColor: '#ffffff', borderRadius: 20, 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#fff', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  properBtnText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 }
});
