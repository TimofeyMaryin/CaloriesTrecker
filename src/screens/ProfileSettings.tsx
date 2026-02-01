import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import SettingsCard from '../components/SettingsCard';
import BottomSheet from '../components/BottomSheet';
import SelectionCard from '../components/SelectionCard';
import HorizontalRulerPicker from '../components/HorizontalRulerPicker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProfileStore } from '../store/profileStore';
import { usePremiumStore } from '../store/premiumStore';
import { showPaywall, PLACEMENT_IDS } from '../services/adapty';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SheetType =
  | 'goal'
  | 'age'
  | 'weight'
  | 'height'
  | 'activity'
  | null;

type ActivityLevel = 'minimum' | 'light' | 'moderate' | 'high';

const ACTIVITY_LEVELS = [
  {
    id: 'minimum' as ActivityLevel,
    emoji: '🪑',
    title: 'Minimum activity',
    subtitle: 'No workouts, sedentary lifestyle.',
  },
  {
    id: 'light' as ActivityLevel,
    emoji: '🚶',
    title: 'Light Activity',
    subtitle: 'Light exercise 1–2 times/week.',
  },
  {
    id: 'moderate' as ActivityLevel,
    emoji: '🏋️',
    title: 'Moderate Activity',
    subtitle: 'Workouts 3–4 times/week.',
  },
  {
    id: 'high' as ActivityLevel,
    emoji: '🔥',
    title: 'High Activity',
    subtitle: 'Intense training 5+ times/week.',
  },
];

const ProfileSettings = () => {
  const navigation = useNavigation<NavigationProp>();
  const [sheetOpen, setSheetOpen] = useState<SheetType>(null);
  
  // Profile store
  const profileStore = useProfileStore();
  const { 
    height, 
    weight, 
    age, 
    goalWeight, 
    activityLevel,
    setHeight: saveHeight,
    setWeight: saveWeight,
    setAge: saveAge,
    setGoalWeight: saveGoalWeight,
    setActivityLevel: saveActivityLevel,
  } = profileStore;

  // Premium status
  const isPremium = usePremiumStore((state) => state.isPremium);

  // Local state for pickers (to avoid updating store on every scroll)
  const [localHeight, setLocalHeight] = useState(height);
  const [localWeight, setLocalWeight] = useState(weight);
  const [localAge, setLocalAge] = useState(age);
  const [localGoalWeight, setLocalGoalWeight] = useState(goalWeight);
  const [localActivityLevel, setLocalActivityLevel] = useState<ActivityLevel>(activityLevel);

  const openSheet = (type: SheetType) => () => {
    // Reset local values when opening sheet
    if (type === 'height') setLocalHeight(height);
    if (type === 'weight') setLocalWeight(weight);
    if (type === 'age') setLocalAge(age);
    if (type === 'goal') setLocalGoalWeight(goalWeight);
    if (type === 'activity') setLocalActivityLevel(activityLevel);
    setSheetOpen(type);
  };
  const closeSheet = () => setSheetOpen(null);

  const handleActivitySelect = (level: ActivityLevel) => {
    setLocalActivityLevel(level);
  };

  const handleDone = () => {
    // Save to profile store based on current sheet
    switch (sheetOpen) {
      case 'height':
        saveHeight(localHeight);
        break;
      case 'weight':
        saveWeight(localWeight);
        break;
      case 'age':
        saveAge(localAge);
        break;
      case 'goal':
        saveGoalWeight(localGoalWeight);
        break;
      case 'activity':
        saveActivityLevel(localActivityLevel);
        break;
    }
    closeSheet();
  };

  const GoalIcon = () => (
    <Image
      source={require('../assets/icons/ic_goal.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const AgeIcon = () => (
    <Image
      source={require('../assets/icons/ic_age.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const WeightIcon = () => (
    <Image
      source={require('../assets/icons/ic_weight.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const HeightIcon = () => (
    <Image
      source={require('../assets/icons/ic_height.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );
  const ActivityLevelIcon = () => (
    <Image
      source={require('../assets/icons/ic_activity_level.png')}
      style={styles.cardIcon}
      resizeMode="contain"
    />
  );

  return (
    <View style={styles.container}>
      <TopBar
        title="Profile Settings"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={colors.background}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.content}>
            {/* Premium Banner - only show if not premium */}
            {!isPremium && (
              <View style={styles.premiumBanner}>
                <View style={styles.premiumTextBlock}>
                  <Text style={styles.premiumTitle}>👑 Unlock Premium!</Text>
                  <Text style={styles.premiumDescription}>
                    Get personalized nutrition insights, exclusive features, and
                    full access to your favorite meals.
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      showPaywall(PLACEMENT_IDS.PAYWALL_MAIN);
                    }}
                  >
                    <Text style={styles.premiumButtonText}>Get Premium</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../assets/img_banner_unlock_premium.png')}
                  style={styles.premiumImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <SettingsCard
              title="Your Goal"
              icon={<GoalIcon />}
              onPress={openSheet('goal')}
            />
            <SettingsCard
              title="Age"
              icon={<AgeIcon />}
              onPress={openSheet('age')}
            />
            <SettingsCard
              title="Weight"
              icon={<WeightIcon />}
              onPress={openSheet('weight')}
            />
            <SettingsCard
              title="Height"
              icon={<HeightIcon />}
              onPress={openSheet('height')}
            />
            <SettingsCard
              title="Activity Level"
              icon={<ActivityLevelIcon />}
              onPress={openSheet('activity')}
            />
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Activity Level Sheet */}
      <BottomSheet
        visible={sheetOpen === 'activity'}
        onClose={closeSheet}
        title="Activity level"
        snapPoints={['70%']}
        scrollable
      >
        <View style={styles.sheetContent}>
          {ACTIVITY_LEVELS.map((level) => (
            <SelectionCard
              key={level.id}
              emoji={level.emoji}
              title={level.title}
              subtitle={level.subtitle}
              selected={localActivityLevel === level.id}
              onPress={() => handleActivitySelect(level.id)}
            />
          ))}
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Height Sheet */}
      <BottomSheet
        visible={sheetOpen === 'height'}
        onClose={closeSheet}
        title="Height"
      >
        <View style={styles.sheetContent}>
          <HorizontalRulerPicker
            min={100}
            max={220}
            initialValue={localHeight}
            unit="cm"
            onValueChange={setLocalHeight}
          />
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Weight Sheet */}
      <BottomSheet
        visible={sheetOpen === 'weight'}
        onClose={closeSheet}
        title="Weight"
      >
        <View style={styles.sheetContent}>
          <HorizontalRulerPicker
            min={30}
            max={200}
            initialValue={localWeight}
            unit="kg"
            onValueChange={setLocalWeight}
          />
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Age Sheet */}
      <BottomSheet
        visible={sheetOpen === 'age'}
        onClose={closeSheet}
        title="Age"
      >
        <View style={styles.sheetContent}>
          <HorizontalRulerPicker
            min={12}
            max={90}
            initialValue={localAge}
            unit="years"
            onValueChange={setLocalAge}
          />
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Goal Sheet */}
      <BottomSheet
        visible={sheetOpen === 'goal'}
        onClose={closeSheet}
        title="Your Goal"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.goalLabel}>
            Goal: {localGoalWeight === weight ? 'Maintain Weight' : localGoalWeight < weight ? 'Lose Weight' : 'Gain Weight'}
          </Text>
          <HorizontalRulerPicker
            min={30}
            max={200}
            initialValue={localGoalWeight}
            unit="kg"
            onValueChange={setLocalGoalWeight}
          />
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  premiumBanner: {
    position: 'relative',
    backgroundColor: '#D4F5D5',
    borderRadius: 16,
    padding: 16,
    paddingRight: 120,
    marginBottom: 16,
    minHeight: 140,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  premiumTextBlock: {
    flex: 1,
    zIndex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  premiumDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  premiumButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  premiumImage: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    width: 140,
    height: 140,
  },
  cardIcon: {
    width: 22,
    height: 22,
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sheetContent: {
    paddingBottom: 16,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default ProfileSettings;
