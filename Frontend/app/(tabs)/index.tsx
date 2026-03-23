import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Automatically size the circle slightly perfectly based on web browser or phone!
const RADIUS = Platform.OS === 'web' ? 170 : Math.min(width * 0.36, 140); 

const getCircleCoords = (angleInDegrees: number) => {
  const rad = angleInDegrees * (Math.PI / 180);
  return {
    translateX: RADIUS * Math.cos(rad),
    translateY: RADIUS * Math.sin(rad),
  };
};

const DOMAINS = [
  { name: 'Mental', color: '#b388ff', angle: 22.5, progress: 55, rotation: 0 },
  { name: 'Physical', color: '#ff5252', angle: 67.5, progress: 45, rotation: 45 },
  { name: 'Social', color: '#ff9100', angle: 112.5, progress: 65, rotation: 90 },
  { name: 'Spiritual', color: '#448aff', angle: 157.5, progress: 50, rotation: 135 },
  { name: 'Career', color: '#ffb300', angle: 202.5, progress: 60, rotation: 180 },
  { name: 'Financial', color: '#00e676', angle: 247.5, progress: 40, rotation: 225 },
  { name: 'Environment', color: '#00bfa5', angle: 292.5, progress: 70, rotation: 270 },
  { name: 'Growth', color: '#00e5ff', angle: 337.5, progress: 35, rotation: 315 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [myStories, setMyStories] = useState<string[]>([]);
  const isFocused = useIsFocused();

  const handleAddStory = async () => {
    if (Platform.OS === 'web') {
      const choice = window.confirm("Press OK to Upload from Gallery, or Cancel to open Camera.");
      if (choice) {
        pickImage();
      } else {
        openCamera();
      }
    } else {
      Alert.alert(
        'Add Story',
        'How would you like to add a story?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Upload from Gallery', onPress: pickImage }
        ]
      );
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert('Permission required', 'Please allow camera access!');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setMyStories([result.assets[0].uri, ...myStories]);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted === false) {
      Alert.alert('Permission required', 'Please allow camera roll access!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setMyStories([result.assets[0].uri, ...myStories]);
    }
  };

  const renderTaskItem = (label: string, emoji: string, angle: number) => {
    const coords = getCircleCoords(angle);
    return (
      <View key={label} style={[
        styles.taskButtonWrap, 
        {
          left: '50%',
          top: '40%',
          transform: [
            { translateX: coords.translateX - 33 }, // -33 to center the 66px width circle exactly
            { translateY: coords.translateY - 33 }, 
          ]
        }
      ]}>
        <TouchableOpacity style={styles.taskIconWrapper} activeOpacity={0.7}>
          <Text style={styles.taskEmoji}>
            {emoji}
          </Text>
        </TouchableOpacity>
        <Text style={styles.taskLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && <StatusBar style="dark" backgroundColor="#ffffff" />}
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 25) }]}>
          <View style={styles.stats}>
            <Text style={styles.statItem}>🔥 12</Text>
            <Text style={styles.statItem}>⚡ 3450</Text>
          </View>
          <Text style={styles.appName}>AntiSocial</Text>
        </View>

        {/* Stories Section */}
        <View style={styles.storiesWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.storiesScroll}
          >
            {/* Add Story Button triggers the Action Sheet */}
            <TouchableOpacity style={styles.storyItemContainer} activeOpacity={0.7} onPress={handleAddStory}>
              <View style={[styles.storyCircle, styles.addStoryCircle]}>
                <Text style={styles.addStoryIcon}>+</Text>
              </View>
              <Text style={styles.storyName}>Add Story</Text>
            </TouchableOpacity>

            {/* Uploaded Photos from Gallery or Camera map to Stories! */}
            {myStories.map((uri, index) => (
              <TouchableOpacity key={`my-story-${index}`} style={styles.storyItemContainer} activeOpacity={0.7}>
                <View style={[styles.storyCircle, styles.userStoryBorder]}>
                  <Image source={{ uri }} style={styles.uploadedStoryImage} />
                </View>
                <Text style={styles.storyName}>My Story</Text>
              </TouchableOpacity>
            ))}

            {/* Dummy Default Stories */}
            {[
              { id: '1', name: 'Sarah', emoji: '👩' },
              { id: '2', name: 'Mike', emoji: '👦' },
              { id: '3', name: 'Emma', emoji: '👩' },
              { id: '4', name: 'John', emoji: '👦' },
            ].map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyItemContainer} activeOpacity={0.7}>
                <View style={[styles.storyCircle, styles.userStoryBorder]}>
                  <View style={styles.userStoryInner}>
                    <Text style={styles.emojiText}>{story.emoji}</Text>
                  </View>
                </View>
                <Text style={styles.storyName}>{story.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Dashboard Box */}
        <View style={styles.dashboardContainer}>
          <View style={styles.tasksCircleArea}>
            
            {/* 
              Perfectly calculated mathematical circle placement so Breathe NEVER hits Buddy or Smile!
              Smile is 310 deg. Buddy is 60 deg. 
              The EXACT midpoint between 310 and 60 is strictly 5 degrees!
            */}
            {renderTaskItem('Smile',   '😊', 310)}
            {renderTaskItem('Reflect', '✍️', 255)}
            {renderTaskItem('Outside', '👀', 195)}
            {renderTaskItem('Stretch', '🧘', 145)}
            {renderTaskItem('Silent',  '🤫', 100)}
            {renderTaskItem('Breathe', '▯',  5)}

            {/* Teddy bear mapped precisely to 60 degrees! */}
            <View style={[
                styles.buddyWrap, 
                {
                  left: '50%',
                  top: '40%',
                  transform: [
                    { translateX: getCircleCoords(65).translateX - 60 }, 
                    { translateY: getCircleCoords(65).translateY - 55 }, 
                  ]
                }
              ]}
            >
              <View style={styles.buddyRelative}>
                  <View style={styles.buddyEarLeft} />
                  <View style={styles.buddyEarRight} />
                  <View style={styles.buddyArmLeft} />
                  <View style={styles.buddyBody}>
                    <View style={styles.buddyFace}>
                        <View style={styles.buddyEye} />
                        <View style={styles.buddyNasalWrap}>
                            <View style={styles.buddyNose} />
                            <View style={styles.buddyMouthLine} />
                        </View>
                        <View style={styles.buddyEye} />
                    </View>
                  </View>
                  <View style={styles.buddyLegLeft} />
                  <View style={styles.buddyLegRight} />
              </View>
              <Text style={styles.buddyText}>Sitting quietly with you</Text>
            </View>
            
          </View>

          <Text style={styles.instructionText}>Click any task around Buddy to begin</Text>
        </View>

        {/* --- Feed Locked Section --- */}
        <View style={styles.feedLockedContainer}>
          <View style={styles.lockOutline}>
            <Feather name="lock" size={40} color="#a1a1aa" />
          </View>
          <Text style={styles.feedLockedTitle}>Feed Locked</Text>
          <Text style={styles.feedLockedSub}>Complete at least 1 task to unlock the community feed</Text>
          <TouchableOpacity style={styles.greyButton} activeOpacity={0.7}>
            <Text style={styles.greyButtonText}>Show up for yourself first</Text>
          </TouchableOpacity>
        </View>

        {/* --- NEW BEAUTIFUL SVG LIFE DOMAINS CHART SECTION --- */}
        <View style={styles.domainCard}>
          <View style={styles.svgChartContainer}>
             <Svg width="320" height="320" viewBox="0 0 320 320">
                {/* Thin axis lines intersecting the wheel */}
                <Line x1="160" y1="20" x2="160" y2="300" stroke="#333333" strokeWidth="1" />
                <Line x1="20" y1="160" x2="300" y2="160" stroke="#333333" strokeWidth="1" />
                {/* Diagonal lines using roughly 0.707 multiple on 140px radius = 99px offset */}
                <Line x1="61" y1="61" x2="259" y2="259" stroke="#333333" strokeWidth="1" />
                <Line x1="259" y1="61" x2="61" y2="259" stroke="#333333" strokeWidth="1" />

                {/* Inner decorative circle outline */}
                <Circle cx="160" cy="160" r="48" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
                <Circle cx="160" cy="160" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />

                <G rotation="-90" origin="160, 160">
                   {DOMAINS.map(d => (
                     <G key={d.name + 'arc'} rotation={d.rotation} origin="160, 160">
                        {/* Background segment track */}
                        <Circle 
                          cx="160" cy="160" r="105" 
                          stroke={d.color} strokeWidth="36" 
                          opacity={0.2} 
                          strokeDasharray="80 659.7" 
                          strokeLinecap="butt" 
                          fill="none" 
                        />
                        {/* "Filled" progress level arc overlaying the track */}
                        <Circle 
                          cx="160" cy="160" r="105" 
                          stroke={d.color} strokeWidth="36" 
                          opacity={0.8} 
                          strokeDasharray={`${d.progress} 659.7`} 
                          strokeLinecap="butt" 
                          fill="none" 
                        />
                     </G>
                   ))}
                </G>
             </Svg>

             {/* Absolute layered domain texts with dots exactly according to angle */}
             {DOMAINS.map(d => {
                const rad = (d.angle - 90) * (Math.PI / 180);
                const x = 160 + 140 * Math.cos(rad);
                const y = 160 + 140 * Math.sin(rad);
                return (
                  <View key={d.name} style={[styles.domainLabelContainer, { left: x, top: y }]}>
                    <Text style={[styles.domainLabel, { color: d.color }]}>{d.name}</Text>
                    <View style={[styles.domainDot, { backgroundColor: d.color }]} />
                  </View>
                );
             })}

             {/* The centered Cute Light Blue Owl */}
             <View style={styles.newOwlWrap}>
                 <View style={styles.owlWingNewLeft} />
                 <View style={styles.owlWingNewRight} />
                 <View style={styles.owlBodyNew}>
                    <View style={styles.owlEarNewLeft} />
                    <View style={styles.owlEarNewRight} />
                    <View style={styles.owlEyesRow}>
                        <View style={styles.owlNewEye}>
                            <View style={styles.owlNewPupil} />
                        </View>
                        <View style={styles.owlNewEye}>
                            <View style={styles.owlNewPupil} />
                        </View>
                    </View>
                    <View style={styles.owlNewBeak} />
                 </View>
             </View>
          </View>

          <Text style={styles.domainFocusText}>Tap any life domain to focus</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Layout Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storiesWrapper: {
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  storiesScroll: {
    paddingHorizontal: 15,
    gap: 20,
    alignItems: 'center',
  },
  storyItemContainer: {
    alignItems: 'center',
    width: 65,
  },
  storyCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addStoryCircle: {
    backgroundColor: '#8b5cf6', 
  },
  addStoryIcon: {
    color: 'white',
    fontSize: 28,
    fontWeight: '400',
  },
  userStoryBorder: {
    borderWidth: 2,
    borderColor: '#c026d3', 
    padding: 2,
  },
  userStoryInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#fdf2f8', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedStoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  emojiText: {
    fontSize: 30,
  },
  storyName: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  dashboardContainer: {
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: '#fff7e8', 
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#fef0c8',
    overflow: 'hidden',
  },
  tasksCircleArea: {
    width: '100%',
    height: 480, 
    position: 'relative',
    marginTop: 20,
  },
  taskButtonWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    width: 66,
  },
  taskIconWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 50,
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  taskEmoji: {
    fontSize: 26,
  },
  taskLabel: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 6,
    fontWeight: '500',
    position: 'absolute',
    bottom: -22,
    width: 80,
    textAlign: 'center',
  },
  buddyWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  buddyRelative: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 35, 
  },
  buddyBody: {
    width: 120, 
    height: 110, 
    backgroundColor: '#deb289', 
    borderRadius: 55, 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  buddyFace: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 15,
      marginTop: -15, 
  },
  buddyEye: {
      width: 12,
      height: 15,
      borderRadius: 6,
      backgroundColor: '#2d1e18',
  },
  buddyNasalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buddyNose: {
      width: 16,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2d1e18',
      marginTop: 2,
  },
  buddyMouthLine: {
      width: 24,
      height: 2,
      backgroundColor: '#2d1e18',
      marginTop: 2,
  },
  buddyEarLeft: {
      position: 'absolute',
      width: 32,
      height: 32,
      backgroundColor: '#deb289',
      borderRadius: 16,
      top: -10,
      left: 10,
      zIndex: 1,
  },
  buddyEarRight: {
      position: 'absolute',
      width: 32,
      height: 32,
      backgroundColor: '#deb289',
      borderRadius: 16,
      top: -10,
      right: 10,
      zIndex: 1,
  },
  buddyArmLeft: {
      position: 'absolute',
      width: 28,
      height: 32,
      backgroundColor: '#deb289',
      borderRadius: 14,
      top: 45,
      left: -12,
      zIndex: 1,
      transform: [{ rotate: '-25deg' }],
  },
  buddyLegLeft: {
    position: 'absolute',
    width: 24,
    height: 28,
    backgroundColor: '#deb289',
    borderRadius: 12,
    bottom: -10,
    left: 25,
    zIndex: 1,
  },
  buddyLegRight: {
    position: 'absolute',
    width: 24,
    height: 28,
    backgroundColor: '#deb289',
    borderRadius: 12,
    bottom: -10,
    right: 25,
    zIndex: 1,
  },
  buddyText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
    position: 'absolute',
    bottom: 0,
    width: 200,
    textAlign: 'center',
    left: -40,
  },
  instructionText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 20,
  },
  feedLockedContainer: {
    alignItems: 'center',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  lockOutline: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d4d4d8',
    marginBottom: 15,
  },
  feedLockedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3f3f46',
    marginBottom: 8,
  },
  feedLockedSub: {
    fontSize: 14,
    color: '#52525b',
    textAlign: 'center',
    marginBottom: 20,
  },
  greyButton: {
    backgroundColor: '#f4f4f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  greyButtonText: {
    color: '#52525b',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // --- NEW BLACK SVG CHART SECTION ---
  domainCard: {
    marginHorizontal: 15,
    marginBottom: 40,
    backgroundColor: '#111111', // Exact black card
    borderRadius: 25,
    paddingVertical: 35,
    alignItems: 'center',
  },
  svgChartContainer: {
    width: 320,
    height: 320,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainLabelContainer: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -40 }, { translateY: -15 }],
  },
  domainLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  domainDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  
  // Custom Owl styling matches perfectly with Photo 2 
  newOwlWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  owlBodyNew: {
    width: 60,
    height: 70,
    backgroundColor: '#5856d6', // Light purplish blue body
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  owlEarNewLeft: {
    position: 'absolute',
    top: -4,
    left: 8,
    width: 12,
    height: 16,
    backgroundColor: '#5856d6',
    borderRadius: 6,
    transform: [{ rotate: '-20deg' }]
  },
  owlEarNewRight: {
    position: 'absolute',
    top: -4,
    right: 8,
    width: 12,
    height: 16,
    backgroundColor: '#5856d6',
    borderRadius: 6,
    transform: [{ rotate: '20deg' }]
  },
  owlWingNewLeft: {
    position: 'absolute',
    width: 20,
    height: 30,
    left: 8,
    top: 35,
    backgroundColor: '#5856d6',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  owlWingNewRight: {
    position: 'absolute',
    width: 20,
    height: 30,
    right: 8,
    top: 35,
    backgroundColor: '#5856d6',
    borderRadius: 10,
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
  },
  owlEyesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: -8,
  },
  owlNewEye: {
    width: 22,
    height: 22,
    backgroundColor: '#ffffff',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owlNewPupil: {
    width: 10,
    height: 10,
    backgroundColor: '#5856d6',
    borderRadius: 5,
  },
  owlNewBeak: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#f59e0b',
    marginTop: 4,
    transform: [{ rotate: '180deg' }], // pointing down
  },
  domainFocusText: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 25,
  }
});