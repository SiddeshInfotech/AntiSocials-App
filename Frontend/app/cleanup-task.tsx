import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function CleanupTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }),
      ]),
      Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
    ]).start();

    // Continuous soft breathing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Fresh Eco-friendly Background */}
      <LinearGradient
        colors={['#064e3b20', '#131714', '#131714']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Eco Icon Glowing Orb */}
        <Animated.View style={[styles.iconOrb, { transform: [{ scale: iconScale }], opacity: glowAnim }]}>
          <LinearGradient colors={['#34d399', '#10b981', '#059669']} style={styles.iconGradient}>
            <FontAwesome5 name="leaf" size={44} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Radiant rings */}
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, styles.ringOuter, { opacity: glowAnim }]} />
          <Animated.View style={[styles.ring, styles.ringInner, { opacity: glowAnim }]} />
        </View>

        <Text style={styles.heading}>Organise a{'\n'}Cleanup Drive</Text>
        <Text style={styles.subheading}>
          Restore beauty to a local area. Gather some bags, wear gloves, and spend an hour bringing nature back to its clean state.
        </Text>

        {/* Inspirational quote card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteEmoji}>🌍</Text>
          <Text style={styles.quoteText}>
            "We do not inherit the earth from our ancestors, we borrow it from our children."
          </Text>
          <Text style={styles.quoteAuthor}>— Native American Proverb</Text>
        </View>

        {/* Action Steps */}
        <View style={styles.expectRow}>
          <View style={styles.expectItem}>
            <Feather name="map-pin" size={18} color="#10b981" />
            <Text style={styles.expectLabel}>Pick a Spot</Text>
          </View>
          <View style={styles.expectDot} />
          <View style={styles.expectItem}>
            <Feather name="trash-2" size={18} color="#10b981" />
            <Text style={styles.expectLabel}>Clear Waste</Text>
          </View>
          <View style={styles.expectDot} />
          <View style={styles.expectItem}>
            <Feather name="camera" size={18} color="#10b981" />
            <Text style={styles.expectLabel}>Before/After</Text>
          </View>
        </View>

        {/* Photo Upload Section */}
        <View style={styles.photoContainer}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.attachedImage} />
              <TouchableOpacity 
                style={styles.removeImageBtn} 
                onPress={() => setImageUri(null)}
              >
                <Feather name="x" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.7}>
              <Feather name="camera" size={24} color="#10b981" />
              <Text style={styles.addPhotoText}>Upload Cleanup Proof</Text>
            </TouchableOpacity>
          )}
        </View>

      </Animated.View>

      {/* Bottom CTA */}
      <View style={styles.bottomArea}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.85}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
            onPress={() => {
              if (imageUri) {
                router.replace({ pathname: '/task-success', params: { points: '1000' } } as any);
              }
            }}
          >
            <LinearGradient 
              colors={imageUri ? ['#10b981', '#059669'] : ['#3f3f46', '#27272a']} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
              style={styles.btnGradient}
            >
              <Text style={[styles.startBtnText, !imageUri && { color: '#71717a' }]}>
                {imageUri ? 'Complete Cleanup' : 'Upload Proof to Complete'}
              </Text>
              {imageUri && <Feather name="check-circle" size={20} color="#fff" style={{ marginLeft: 10 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131714' },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 15 },

  // Eco orb
  iconOrb: { marginBottom: 10, zIndex: 2 },
  iconGradient: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.6, shadowOffset: { width: 0, height: 8 }, shadowRadius: 25, elevation: 15 },

  // Rings behind orb
  ringWrap: { position: 'absolute', top: 30, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderRadius: 999 },
  ringOuter: { width: 160, height: 160, borderColor: 'rgba(16,185,129,0.15)' },
  ringInner: { width: 130, height: 130, borderColor: 'rgba(16,185,129,0.25)' },

  heading: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 42, marginTop: 10 },
  subheading: { color: '#a1a1aa', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 16, marginBottom: 28, fontWeight: '500', paddingHorizontal: 5 },

  // Quote card
  quoteCard: { backgroundColor: '#171c18', width: '100%', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#212d24', alignItems: 'center', marginBottom: 28 },
  quoteEmoji: { fontSize: 28, marginBottom: 10 },
  quoteText: { color: '#d4d4d8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  quoteAuthor: { color: '#6ee7b7', opacity: 0.7, fontSize: 12, marginTop: 8, fontWeight: '600' },

  // Expect row
  expectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  expectItem: { alignItems: 'center' },
  expectLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', marginTop: 6 },
  expectDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3f3f46', marginHorizontal: 18 },

  // Bottom area
  bottomArea: { paddingHorizontal: 24, paddingBottom: 38, paddingTop: 10 },
  startBtn: { borderRadius: 20, overflow: 'hidden', shadowColor: '#10b981', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 15, elevation: 10 },
  btnGradient: { paddingVertical: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.8 },

  // Photo
  photoContainer: { marginTop: 24, width: '100%' },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: '#059669', backgroundColor: 'rgba(16,185,129,0.05)'
  },
  addPhotoText: { marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#10b981' },
  imageWrapper: { width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#059669' },
  attachedImage: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute', top: 12, right: 12, width: 32, height: 32,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center'
  },
});
