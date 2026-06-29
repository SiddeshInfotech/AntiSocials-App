import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  ScrollView, 
  TouchableOpacity, 
  Easing, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const SANCTUARY_WIDTH = width * 1.5; // Allows subtle horizontal exploration

const MOCK_COLLECTION: Array<{
  id: string;
  emotion: string;
  item: string;
  date: string;
  insight: string;
  x: number;
  y: number;
  color: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}> = [
  { 
    id: '1', 
    emotion: 'Happiness', 
    item: 'Golden Lotus', 
    date: 'June 25, 2026', 
    insight: 'You noticed joy without chasing it.', 
    x: SANCTUARY_WIDTH * 0.4, 
    y: height * 0.65, 
    color: '#FFB800',
    icon: 'sun'
  },
  { 
    id: '2', 
    emotion: 'Sadness', 
    item: 'Moon Orchid', 
    date: 'June 23, 2026', 
    insight: 'You allowed sadness to exist.', 
    x: SANCTUARY_WIDTH * 0.7, 
    y: height * 0.75, 
    color: '#5BB8FF',
    icon: 'moon'
  }
];

export default function SanctuaryScreen() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<any>(null);
  const breathAnim = useRef(new Animated.Value(1)).current;
  const cloudsX = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Particle systems for sanctuary ambiance
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * SANCTUARY_WIDTH),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0),
      scale: Math.random() * 0.6 + 0.4,
      speed: Math.random() * 4000 + 4000,
    }))
  ).current;

  useEffect(() => {
    // Breathing environment
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.05, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Slow drifting clouds/fog
    Animated.loop(
      Animated.timing(cloudsX, {
        toValue: -width,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Generic ambient floating light particles (Fireflies)
    particles.forEach((p, idx) => {
      const runCycle = () => {
        p.x.setValue(Math.random() * SANCTUARY_WIDTH);
        p.y.setValue(height * 0.5 + Math.random() * (height * 0.5));
        
        Animated.parallel([
          Animated.timing(p.y, { toValue: height * 0.2 + Math.random() * -100, duration: p.speed, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: Math.random() * 0.6 + 0.2, duration: p.speed * 0.3, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: p.speed * 0.7, useNativeDriver: true })
          ])
        ]).start(() => runCycle());
      };
      setTimeout(() => runCycle(), idx * 400);
    });
  }, []);

  const handleTapItem = (item: any) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveItem(item);
    Animated.timing(modalOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const closeItem = () => {
    Animated.timing(modalOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setActiveItem(null);
    });
  };

  return (
    <View style={styles.root}>
      {/* Dynamic Evolution Background (Based on Day progression, simulating Day 7-15) */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0f3c4c']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Stars / Mist Drifting */}
      <Animated.View style={[styles.mistLayer, { transform: [{ translateX: cloudsX }] }]}>
          <View style={styles.mistBlob1} />
          <View style={styles.mistBlob2} />
      </Animated.View>

      {/* Main Sanctuary World Scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{ width: SANCTUARY_WIDTH, height: '100%' }}
        bounces={false}
      >
        <Animated.View style={[styles.worldContainer, { transform: [{ scale: breathAnim }] }]}>
          
          {/* Abstract distant hills/landscape */}
          <View style={styles.hillBack} />
          <View style={styles.hillFront} />

          {/* Render the user's emotional growth items */}
          {MOCK_COLLECTION.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.7} 
              onPress={() => handleTapItem(item)}
              style={[styles.itemContainer, { left: item.x, top: item.y }]}
            >
              {/* Glowing Aura mapping to emotion */}
              <View style={[styles.itemAura, { backgroundColor: item.color, shadowColor: item.color }]} />
              <Feather name={item.icon} size={28} color={item.color} />
            </TouchableOpacity>
          ))}

          {/* Fireflies floating through the interactive world space */}
          {particles.map((p, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.particle, 
                { transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }], opacity: p.opacity }
              ]} 
            />
          ))}

        </Animated.View>
      </ScrollView>

      {/* Interactive HUD */}
      <SafeAreaView style={styles.hudLayer} pointerEvents="box-none">
        <View style={styles.topHud}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#fff" />
            <Text style={styles.backText}>Journey</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.sanctuaryTitle}>Your Sanctuary</Text>
            <Text style={styles.sanctuaryLevel}>Day 15 • Evolving</Text>
          </View>
          <View style={{ width: 80 }} /> 
        </View>
      </SafeAreaView>

      {/* Item Inspection Glass Modal */}
      {activeItem && (
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.modalOverlay, { opacity: modalOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={closeItem} />
          <Animated.View style={styles.modalContent}>
            <View style={[styles.modalIconRing, { borderColor: activeItem.color }]}>
               <Feather name={activeItem.icon} size={32} color={activeItem.color} />
            </View>
            <Text style={styles.modalItemName}>{activeItem.item}</Text>
            <Text style={styles.modalEmotion}>From: {activeItem.emotion} • {activeItem.date}</Text>
            
            <View style={styles.insightBox}>
               <Text style={styles.insightLabel}>AI INSIGHT</Text>
               <Text style={styles.insightText}>"{activeItem.insight}"</Text>
            </View>
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeItem}>
               <Text style={styles.modalCloseText}>Return</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  mistLayer: {
    position: 'absolute',
    top: 0,
    width: width * 2,
    height: '100%',
    flexDirection: 'row',
    opacity: 0.2,
  },
  mistBlob1: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    marginTop: height * 0.1,
  },
  mistBlob2: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#818CF8',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
    marginTop: height * 0.3,
    marginLeft: -120,
  },
  worldContainer: {
    width: SANCTUARY_WIDTH,
    height: '100%',
    position: 'relative',
  },
  hillBack: {
    position: 'absolute',
    bottom: -150,
    left: -200,
    width: SANCTUARY_WIDTH + 400,
    height: height * 0.4,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
    opacity: 0.8,
  },
  hillFront: {
    position: 'absolute',
    bottom: -100,
    left: SANCTUARY_WIDTH * -0.2,
    width: SANCTUARY_WIDTH * 1.5,
    height: height * 0.35,
    backgroundColor: '#020617',
    borderTopLeftRadius: 800,
    borderTopRightRadius: 800,
  },
  itemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  itemAura: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    opacity: 0.4,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  hudLayer: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  topHud: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  backText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  titleContainer: {
    alignItems: 'center',
  },
  sanctuaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sanctuaryLevel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    letterSpacing: 1,
  },
  
  // Modals
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  modalIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 20,
  },
  modalItemName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: 1,
  },
  modalEmotion: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 32,
  },
  insightBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
  },
  insightLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
  },
  insightText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '300',
    fontStyle: 'italic',
  },
  modalCloseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  modalCloseText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  }
});
