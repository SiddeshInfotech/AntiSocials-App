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
  Platform,
  Animated,
  Pressable,
  Easing
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Line, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// No longer using trigonometry, fully refactored to responsive Flexbox layout!

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

const InteractiveTaskItem = ({ 
  label, 
  emoji, 
  isActive, 
  hasActiveTask, 
  onPress 
}: { 
  label: string; 
  emoji: string; 
  isActive: boolean; 
  hasActiveTask: boolean; 
  onPress: () => void;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: hasActiveTask && !isActive ? 0.4 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(scale, {
      toValue: isActive ? 1.15 : 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isActive, hasActiveTask]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isActive ? 1.15 : 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.taskButtonWrapFlex, { opacity, transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <View style={[styles.taskIconWrapperFlex, isActive && styles.taskIconActive]}>
          <Text style={styles.taskEmojiFlex}>{emoji}</Text>
        </View>
      </Pressable>
      <Text style={[styles.taskLabelFlex, isActive && styles.taskLabelActive]}>{label}</Text>
    </Animated.View>
  );
};

const InteractiveDomainItem = ({ 
  domain, 
  isActive, 
  hasActiveTask, 
  onPress,
  x, y
}: any) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: hasActiveTask && !isActive ? 0.35 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(scale, {
      toValue: isActive ? 1.25 : 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [isActive, hasActiveTask]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: isActive ? 1.25 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[
      styles.domainLabelContainer, 
      { left: x, top: y, opacity, transform: [{ scale }] }
    ]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[styles.domainPressable, isActive && { borderColor: domain.color, backgroundColor: 'rgba(255,255,255,0.1)' }]}
      >
        <Text style={[styles.domainLabel, { color: domain.color }, isActive && { fontWeight: 'bold' }]}>
          {domain.name}
        </Text>
        <View style={[styles.domainDot, { backgroundColor: domain.color }, isActive && { transform: [{scale: 1.5}] }]} />
      </Pressable>
    </Animated.View>
  );
};

const AnimatedOwl = () => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const blinkAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.1, duration: 80, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    };

    const interval = setInterval(() => {
      blink();
      if (Math.random() > 0.6) { 
        setTimeout(blink, 200);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }]}>
       <Animated.View style={[styles.newOwlWrap, { transform: [{ translateY: floatAnim }] }]}>
          <View style={styles.owlEarNewLeft} />
          <View style={styles.owlEarNewRight} />
          <View style={styles.owlWingNewLeft} />
          <View style={styles.owlWingNewRight} />
          
          <View style={styles.owlBodyNew}>
             <LinearGradient colors={['#6A61FF', '#4C3BDB']} style={[StyleSheet.absoluteFillObject, { borderRadius: 42 }]} />
             
             <View style={styles.owlEyesRow}>
                 <Animated.View style={[styles.owlNewEye, { transform: [{ scaleY: blinkAnim }] }]}>
                     <View style={styles.owlPupilCyan}>
                        <View style={styles.owlPupilBlack}>
                           <View style={styles.owlPupilHighlight} />
                        </View>
                     </View>
                 </Animated.View>
                 <Animated.View style={[styles.owlNewEye, { transform: [{ scaleY: blinkAnim }] }]}>
                     <View style={styles.owlPupilCyan}>
                        <View style={styles.owlPupilBlack}>
                           <View style={styles.owlPupilHighlight} />
                        </View>
                     </View>
                 </Animated.View>
             </View>
             
             <View style={styles.owlNewBeak} />
             
             <View style={styles.owlChestLinesWrap}>
                <View style={styles.owlChestLine} />
                <View style={styles.owlChestLine} />
                <View style={styles.owlChestLine} />
             </View>
          </View>
       </Animated.View>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [myStories, setMyStories] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  const handleTaskPress = (label: string) => {
    setActiveTask(prev => (prev === label ? null : label));
  };
  
  const handleDomainPress = (name: string) => {
    setActiveDomain(prev => (prev === name ? null : name));
  };

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

  const renderTaskItemFlex = (label: string, emoji: string) => {
    return (
      <InteractiveTaskItem 
        key={label}
        label={label} 
        emoji={emoji} 
        isActive={activeTask === label}
        hasActiveTask={activeTask !== null}
        onPress={() => handleTaskPress(label)}
      />
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
              <LinearGradient 
                colors={['#8b5cf6', '#3b82f6']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={[styles.storyCircle, styles.addStoryCircle]}
              >
                <Text style={styles.addStoryIcon}>+</Text>
              </LinearGradient>
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
              { id: '1', name: 'Sarah', emoji: '👱‍♀️' },
              { id: '2', name: 'Mike', emoji: '👱‍♂️' },
              { id: '3', name: 'Emma', emoji: '👩' },
              { id: '4', name: 'John', emoji: '👨' },
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
          <View style={styles.tasksCircleAreaFlex}>
            
            {/* ROW 1: Reflect & Smile */}
            <View style={styles.flexRow1}>
              <View style={styles.leftTaskWrapperTop}>
                {renderTaskItemFlex('Reflect', '✍️')}
              </View>
              <View style={styles.rightTaskWrapperTop}>
                {renderTaskItemFlex('Smile', '😊')}
              </View>
            </View>

            {/* ROW 2: Outside & Breathe */}
            <View style={styles.flexRow2}>
              <View style={styles.leftTaskWrapperMid}>
                {renderTaskItemFlex('Outside', '👀')}
              </View>
              <View style={styles.rightTaskWrapperMid}>
                {renderTaskItemFlex('Breathe', '🫁')}
              </View>
            </View>

            {/* ROW 3: Stretch, Silent, Bear */}
            <View style={styles.flexRow3}>
              <View style={styles.leftTaskWrapperBot}>
                <View style={styles.stretchWrap}>
                  {renderTaskItemFlex('Stretch', '🧘')}
                </View>
                <View style={styles.silentWrap}>
                  {renderTaskItemFlex('Silent', '🤫')}
                </View>
              </View>

              {/* Teddy Bear anchored sequentially */}
              <View style={styles.buddyWrapFlex}>
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
                {activeTask ? (
                   <TouchableOpacity style={styles.startHeroBtn} onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(`Started ${activeTask}`, `You are now focusing completely on this interaction. Have a peaceful moment!`);
                      setActiveTask(null);
                   }}>
                     <Text style={styles.startHeroBtnText}>Start {activeTask} ✨</Text>
                   </TouchableOpacity>
                ) : (
                   <Text style={styles.buddyTextFlex}>Sitting quietly with you</Text>
                )}
              </View>
            </View>
            
          </View>
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

             {/* Absolute layered domain texts cleanly mapped using flex responsive percentages! */}
             <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
               {DOMAINS.map(d => {
                  const rad = (d.angle - 90) * (Math.PI / 180);
                  const xPercentage = 50 + 44 * Math.cos(rad);
                  const yPercentage = 50 + 44 * Math.sin(rad);
                  return (
                    <InteractiveDomainItem 
                      key={d.name}
                      domain={d}
                      x={`${xPercentage}%`}
                      y={`${yPercentage}%`}
                      isActive={activeDomain === d.name}
                      hasActiveTask={activeDomain !== null}
                      onPress={() => handleDomainPress(d.name)}
                    />
                  );
               })}
             </View>

             {/* The centered Animated Light Blue Owl */}
             <AnimatedOwl />
          </View>

          {activeDomain ? (
            <Animated.View style={styles.domainActionSheet}>
              <Text style={styles.domainActionTitle}>Review {activeDomain}</Text>
              <TouchableOpacity style={styles.domainActionBtn} onPress={() => {
                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                 Alert.alert('Intention Set', `You have chosen to focus heavily on ${activeDomain} today.`);
                 setActiveDomain(null);
              }}>
                <Text style={styles.domainActionBtnText}>Set Intention ✨</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Text style={styles.domainFocusText}>Tap any life domain to focus</Text>
          )}
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
    // Note: Background removed as we use LinearGradient locally now
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
  tasksCircleAreaFlex: {
    width: '100%',
    minHeight: 480, 
    flex: 1, 
    paddingTop: 30,
    paddingBottom: 20, 
  },
  taskButtonWrapFlex: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  taskIconWrapperFlex: {
    backgroundColor: '#ffffff',
    borderRadius: 35,
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, 
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  taskIconActive: {
    borderColor: '#8b5cf6',
    borderWidth: 2,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  taskEmojiFlex: {
    fontSize: 26,
  },
  taskLabelFlex: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  taskLabelActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  
  // Row Flex properties
  flexRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '12%',
    marginBottom: 20,
    flex: 0.8,
  },
  leftTaskWrapperTop: {
    alignSelf: 'flex-end',  
    marginRight: 20,
  },
  rightTaskWrapperTop: {
    alignSelf: 'flex-start', 
  },

  flexRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '8%',
    marginBottom: 20,
    flex: 1,
  },
  leftTaskWrapperMid: {
    alignSelf: 'center',
  },
  rightTaskWrapperMid: {
    alignSelf: 'flex-end', 
    marginRight: '2%',
  },

  flexRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', 
    flex: 1.5,
    paddingLeft: '8%',
    paddingRight: '5%',
  },
  leftTaskWrapperBot: {
    flex: 1, 
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 10,
  },
  stretchWrap: {
    alignSelf: 'flex-start', 
    marginTop: 10,
  },
  silentWrap: {
    alignSelf: 'center', 
  },

  buddyWrapFlex: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buddyRelative: {
      position: 'relative',
      width: 140,
      height: 155,
      alignItems: 'center',
      justifyContent: 'center',
  },
  buddyBody: {
    width: 140, 
    height: 155, 
    backgroundColor: '#e6c3a0', 
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    borderBottomLeftRadius: 65,
    borderBottomRightRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  buddyFace: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: -20, 
  },
  buddyEye: {
      width: 12,
      height: 16,
      borderRadius: 6,
      backgroundColor: '#2d1e18',
  },
  buddyNasalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buddyNose: {
      width: 14,
      height: 9,
      borderRadius: 7,
      backgroundColor: '#2d1e18',
      marginTop: 2,
  },
  buddyMouthLine: {
      width: 22,
      height: 2,
      backgroundColor: '#2d1e18',
      marginTop: 3,
  },
  buddyEarLeft: {
      position: 'absolute',
      width: 40,
      height: 40,
      backgroundColor: '#e6c3a0',
      borderRadius: 20,
      top: -5,
      left: 10,
      zIndex: 1,
  },
  buddyEarRight: {
      position: 'absolute',
      width: 40,
      height: 40,
      backgroundColor: '#e6c3a0',
      borderRadius: 20,
      top: -5,
      right: 10,
      zIndex: 1,
  },
  buddyArmLeft: {
      position: 'absolute',
      width: 30,
      height: 30,
      backgroundColor: '#e6c3a0',
      borderRadius: 15,
      top: 75,
      left: -12,
      zIndex: 1,
  },
  buddyLegLeft: {
    position: 'absolute',
    width: 25,
    height: 35,
    backgroundColor: '#e6c3a0',
    borderRadius: 12.5,
    bottom: -12,
    left: 35,
    zIndex: 1,
  },
  buddyLegRight: {
    position: 'absolute',
    width: 25,
    height: 35,
    backgroundColor: '#e6c3a0',
    borderRadius: 12.5,
    bottom: -12,
    right: 35,
    zIndex: 1,
  },
  buddyTextFlex: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    width: 200,
    textAlign: 'center',
  },
  startHeroBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startHeroBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginLeft: -40, // Anchor the center natively against percentage offset
    marginTop: -20,
  },
  domainPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
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
    width: 120, 
    height: 120,
  },
  owlBodyNew: {
    width: 84,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  owlEarNewLeft: {
    position: 'absolute',
    top: 6,
    left: 20,
    width: 14,
    height: 24,
    backgroundColor: '#6A61FF',
    borderRadius: 7,
    transform: [{ rotate: '-15deg' }],
    zIndex: 0,
  },
  owlEarNewRight: {
    position: 'absolute',
    top: 6,
    right: 20,
    width: 14,
    height: 24,
    backgroundColor: '#6A61FF',
    borderRadius: 7,
    transform: [{ rotate: '15deg' }],
    zIndex: 0,
  },
  owlWingNewLeft: {
    position: 'absolute',
    width: 32,
    height: 22,
    left: 5,
    top: 50,
    backgroundColor: '#6A61FF',
    borderRadius: 11,
    transform: [{ rotate: '-15deg' }],
    zIndex: 0,
  },
  owlWingNewRight: {
    position: 'absolute',
    width: 32,
    height: 22,
    right: 5,
    top: 50,
    backgroundColor: '#6A61FF',
    borderRadius: 11,
    transform: [{ rotate: '15deg' }],
    zIndex: 0,
  },
  owlEyesRow: {
    flexDirection: 'row',
    gap: 0,
    marginTop: -20,
    zIndex: 3,
  },
  owlNewEye: {
    width: 36,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owlPupilCyan: {
    width: 20,
    height: 20,
    backgroundColor: '#00D1FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  owlPupilBlack: {
    width: 10,
    height: 10,
    backgroundColor: '#000000',
    borderRadius: 5,
    position: 'relative',
    top: 2,
  },
  owlPupilHighlight: {
    width: 3,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    position: 'absolute',
    top: 2,
    right: 2,
  },
  owlNewBeak: {
    position: 'absolute',
    top: 48,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFB800',
    transform: [{ rotate: '180deg' }], 
    zIndex: 3,
  },
  owlChestLinesWrap: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    gap: 3,
    zIndex: 3,
  },
  owlChestLine: {
    width: 24,
    height: 8,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  domainFocusText: {
    color: '#a1a1aa',
    fontSize: 13,
    marginTop: 25,
  },
  domainActionSheet: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  domainActionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  domainActionBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 15,
  },
  domainActionBtnText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 13,
  }
});