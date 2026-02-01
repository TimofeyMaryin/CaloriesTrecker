import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import BottomBar from '../components/BottomBar';
import BottomSheet from '../components/BottomSheet';
import AddActionSheet from '../components/AddActionSheet';
import SegmentedControl from '../components/SegmentedControl';
import HorizontalCalendar from '../components/HorizontalCalendar';
import NutritionSummary from '../components/NutritionSummary';
import MealCard from '../components/MealCard';
import WeeklyCaloriesChart from '../components/WeeklyCaloriesChart';
import GoalProgressChart from '../components/GoalProgressChart';
import HorizontalRulerPicker from '../components/HorizontalRulerPicker';
import type { AddActionId } from '../components/AddActionSheet';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { useMealStore } from '../store/mealStore';
import { useProfileStore } from '../store/profileStore';
import { useWeightStore } from '../store/weightStore';
import { useSettingsStore } from '../store/settingsStore';
import { showPaywall, PLACEMENT_IDS } from '../services/adapty';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatHeaderDate = (date: Date): string => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();

  if (isToday) return `Today, ${month} ${day}`;
  if (isYesterday) return `Yesterday, ${month} ${day}`;
  return `${month} ${day}`;
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // YYYY-MM-DD (local time)
};

const SEGMENTS = ['Summary', 'Statistic'];

// Static icon components (outside to prevent re-renders)
const HomeIcon = memo(() => (
  <Image
    source={require('../assets/icons/ic_home.png')}
    style={{ width: 24, height: 24 }}
    resizeMode="contain"
  />
));

const SettingsIcon = memo(() => (
  <Image
    source={require('../assets/icons/ic_settings_black.png')}
    style={{ width: 24, height: 24 }}
    resizeMode="contain"
  />
));

const CenterIcon = memo(() => (
  <Image
    source={require('../assets/icons/ic_add_dish.png')}
    style={{ width: 32, height: 32 }}
    resizeMode="contain"
  />
));

const MainScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Statistics state
  const [selectedWeek, setSelectedWeek] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [localWeight, setLocalWeight] = useState(70);

  // Stores
  const meals = useMealStore((state) => state.meals);
  const targets = useProfileStore((state) => state.targets);
  const { weight, goalWeight, setWeight: saveWeight } = useProfileStore();
  const { entries: weightEntries, addEntry: addWeightEntry } = useWeightStore();

  // Get meals for selected date
  const selectedDateKey = formatDateKey(selectedDate);
  const mealsForDate = useMemo(() => {
    return meals.filter((meal) => meal.date === selectedDateKey);
  }, [meals, selectedDateKey]);

  // Calculate consumed totals for selected date
  const consumedTotals = useMemo(() => {
    return mealsForDate.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totals.totalCalories,
        proteins: acc.proteins + meal.totals.totalProteins,
        carbs: acc.carbs + meal.totals.totalCarbs,
        fats: acc.fats + meal.totals.totalFats,
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 },
    );
  }, [mealsForDate]);

  // Get weekly calories data
  const weeklyCaloriesData = useMemo(() => {
    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((dayName, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateKey = formatDateKey(date);
      const dayMeals = meals.filter((m) => m.date === dateKey);
      const calories = dayMeals.reduce((sum, m) => sum + m.totals.totalCalories, 0);
      return { day: dayName, calories };
    });
  }, [meals, selectedWeek]);

  // Get week label
  const getWeekLabel = () => {
    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${MONTH_NAMES[startOfWeek.getMonth()]} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;
  };

  // Get month label
  const getMonthLabel = () => {
    return `${MONTH_NAMES[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;
  };

  // Get weight entries for selected month
  const monthWeightEntries = useMemo(() => {
    return weightEntries.filter((e) => {
      const [year, month] = e.date.split('-').map(Number);
      return year === selectedMonth.getFullYear() && month === selectedMonth.getMonth() + 1;
    });
  }, [weightEntries, selectedMonth]);

  // Week navigation
  const handlePrevWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };

  // Month navigation
  const handlePrevMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
  };

  // Weight sheet handlers
  const handleOpenWeightSheet = () => {
    setLocalWeight(weight);
    setWeightSheetVisible(true);
  };

  const handleSaveWeight = () => {
    saveWeight(localWeight);
    addWeightEntry(localWeight);
    setWeightSheetVisible(false);
  };

  const headerDate = formatHeaderDate(selectedDate);

  const dontShowPhotoExample = useSettingsStore((state) => state.dontShowPhotoExample);

  const handleAddAction = (id: AddActionId) => {
    setAddSheetVisible(false);

    // Default locale - can be updated from user settings later
    const locale = 'en_US';

    switch (id) {
      case 'scan':
        // Show photo example if user hasn't disabled it
        if (dontShowPhotoExample) {
          navigation.navigate('Scan', { mode: 'camera', locale });
        } else {
          navigation.navigate('PhotoExample');
        }
        break;
      case 'gallery':
        navigation.navigate('Scan', { mode: 'gallery', locale });
        break;
      case 'favorites':
        navigation.navigate('Favorite');
        break;
      case 'voice':
        navigation.navigate('DescribeDish');
        break;
    }
  };

  const handleProPress = useCallback(() => {
    showPaywall(PLACEMENT_IDS.PAYWALL_MAIN);
  }, []);

  const handleFavoritePress = useCallback(() => {
    navigation.navigate('Favorite');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleCenterPress = useCallback(() => {
    setAddSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setAddSheetVisible(false);
  }, []);

  const handleCloseWeightSheet = useCallback(() => {
    setWeightSheetVisible(false);
  }, []);


  const renderSummaryContent = () => (
    <>
      {/* Meals List */}
      <View style={styles.mealsSection}>
        <Text style={styles.mealsSectionTitle}>Today's Meals</Text>
        {mealsForDate.length > 0 ? (
          mealsForDate.map((meal, index) => (
            <MealCard
              key={meal.id}
              meal={meal}
              index={index}
              onPress={() => navigation.navigate('MealResult', { meal })}
            />
          ))
        ) : (
          <View style={styles.emptyMeals}>
            <Image
              source={require('../assets/mascout.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No meals logged yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first meal
            </Text>
          </View>
        )}
      </View>
    </>
  );

  const renderStatisticContent = () => (
    <>
      {/* Weekly Calories Chart */}
      <WeeklyCaloriesChart
        data={weeklyCaloriesData}
        weekLabel={getWeekLabel()}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {/* Goal Progress Chart */}
      <GoalProgressChart
        entries={monthWeightEntries}
        goalWeight={goalWeight}
        currentWeight={weight}
        monthLabel={getMonthLabel()}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onAddWeight={handleOpenWeightSheet}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={['top']} style={styles.topSafeArea}>
          <View style={styles.topBar}>
            <View style={styles.leftBlock}>
              <Text style={styles.leftText}>ScanFood AI</Text>
              <Text style={styles.dateText}>{headerDate}</Text>
            </View>
            <View style={styles.rightContainer}>
              <TouchableOpacity
                style={styles.proButton}
                activeOpacity={0.7}
                onPress={handleProPress}
              >
                <Text style={styles.proText}>Pro</Text>
                <Image
                  source={require('../assets/icons/ic_crown.png')}
                  style={styles.crownIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.favoriteButton}
                activeOpacity={0.7}
                onPress={handleFavoritePress}
              >
                <Image
                  source={require('../assets/icons/ic_likes.png')}
                  style={styles.likeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Calendar - only for Summary tab */}
        {selectedSegment === 0 && (
          <HorizontalCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}

        {/* Nutrition Summary - always visible */}
        <View style={styles.nutritionContainer}>
          <NutritionSummary
            consumedCalories={consumedTotals.calories}
            targetCalories={targets.calories}
            consumedProteins={consumedTotals.proteins}
            targetProteins={targets.proteins}
            consumedCarbs={consumedTotals.carbs}
            targetCarbs={targets.carbs}
            consumedFats={consumedTotals.fats}
            targetFats={targets.fats}
          />
        </View>

        {/* Segment Control */}
        <View style={styles.segmentContainer}>
          <SegmentedControl
            segments={SEGMENTS}
            selectedIndex={selectedSegment}
            onChange={setSelectedSegment}
          />
        </View>

        <View style={styles.content}>
          {selectedSegment === 0
            ? renderSummaryContent()
            : renderStatisticContent()}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => {}}
        onCenterPress={handleCenterPress}
        onRightPress={handleSettingsPress}
        leftIcon={<HomeIcon />}
        leftLabel="Home"
        rightIcon={<SettingsIcon />}
        rightLabel="Settings"
        centerIcon={<CenterIcon />}
        activeTab="left"
      />

      <BottomSheet
        visible={addSheetVisible}
        onClose={handleCloseSheet}
        backgroundColor={colors.background}
      >
        <AddActionSheet onSelect={handleAddAction} />
      </BottomSheet>

      {/* Weight Sheet */}
      <BottomSheet
        visible={weightSheetVisible}
        onClose={handleCloseWeightSheet}
        title="Current Weight"
      >
        <View style={styles.weightSheetContent}>
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
            onPress={handleSaveWeight}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  topSafeArea: {
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E000',
  },
  leftBlock: {
    flex: 1,
  },
  leftText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dateText: {
    fontSize: 13,
    color: '#B1B5B0',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
  },
  nutritionContainer: {
    marginTop: 16,
  },
  mealsSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  mealsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statisticPlaceholder: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 40,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  proText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  crownIcon: {
    width: 20,
    height: 20,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    width: 20,
    height: 20,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  centerIcon: {
    width: 32,
    height: 32,
  },
  weightSheetContent: {
    padding: 16,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default MainScreen;
