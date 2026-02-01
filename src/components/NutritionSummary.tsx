import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NutritionSummaryProps {
  consumedCalories: number;
  targetCalories: number;
  consumedProteins: number;
  targetProteins: number;
  consumedCarbs: number;
  targetCarbs: number;
  consumedFats: number;
  targetFats: number;
}

const CHART_SIZE = 140;
const STROKE_WIDTH = 14;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Gap between segments (in circumference units)
const GAP_SIZE = 8;

// Each macro gets 1/3 of the circle minus the gap
const SEGMENT_SIZE = (CIRCUMFERENCE - GAP_SIZE * 3) / 3;

// Colors for each macro
const COLORS = {
  proteins: '#4A90D9',      // Blue
  proteinsLight: '#D4E5F7', // Light blue background
  carbs: '#4CD964',         // Green
  carbsLight: '#D4F5DC',    // Light green background
  fats: '#F5C842',          // Yellow
  fatsLight: '#FDF3D4',     // Light yellow background
  center: '#F5F5F5',        // Light gray center
};

const ANIMATION_CONFIG = {
  duration: 500,
  easing: Easing.out(Easing.cubic),
};

// Create animated Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NutritionSummary: React.FC<NutritionSummaryProps> = ({
  consumedCalories,
  targetCalories,
  consumedProteins,
  targetProteins,
  consumedCarbs,
  targetCarbs,
  consumedFats,
  targetFats,
}) => {
  // Animated values for progress
  const animatedProteinsProgress = useSharedValue(0);
  const animatedCarbsProgress = useSharedValue(0);
  const animatedFatsProgress = useSharedValue(0);
  const animatedCalories = useSharedValue(0);

  // Progress for each macro (0 to 1)
  const proteinsProgress = Math.min(consumedProteins / targetProteins, 1) || 0;
  const carbsProgress = Math.min(consumedCarbs / targetCarbs, 1) || 0;
  const fatsProgress = Math.min(consumedFats / targetFats, 1) || 0;

  // Animate when values change
  useEffect(() => {
    animatedProteinsProgress.value = withTiming(proteinsProgress, ANIMATION_CONFIG);
    animatedCarbsProgress.value = withTiming(carbsProgress, ANIMATION_CONFIG);
    animatedFatsProgress.value = withTiming(fatsProgress, ANIMATION_CONFIG);
    animatedCalories.value = withTiming(consumedCalories, ANIMATION_CONFIG);
  }, [proteinsProgress, carbsProgress, fatsProgress, consumedCalories]);

  // Offsets
  const proteinsOffset = GAP_SIZE / 2;
  const carbsOffset = SEGMENT_SIZE + GAP_SIZE + GAP_SIZE / 2;
  const fatsOffset = (SEGMENT_SIZE + GAP_SIZE) * 2 + GAP_SIZE / 2;

  // Animated props for circles
  const animatedProteinsProps = useAnimatedProps(() => ({
    strokeDasharray: `${SEGMENT_SIZE * animatedProteinsProgress.value} ${CIRCUMFERENCE - SEGMENT_SIZE * animatedProteinsProgress.value}`,
  }));

  const animatedCarbsProps = useAnimatedProps(() => ({
    strokeDasharray: `${SEGMENT_SIZE * animatedCarbsProgress.value} ${CIRCUMFERENCE - SEGMENT_SIZE * animatedCarbsProgress.value}`,
  }));

  const animatedFatsProps = useAnimatedProps(() => ({
    strokeDasharray: `${SEGMENT_SIZE * animatedFatsProgress.value} ${CIRCUMFERENCE - SEGMENT_SIZE * animatedFatsProgress.value}`,
  }));

  // Progress bar calculations (use current values for display)
  const proteinsProgressBar = Math.min(consumedProteins / targetProteins, 1) || 0;
  const carbsProgressBar = Math.min(consumedCarbs / targetCarbs, 1) || 0;
  const fatsProgressBar = Math.min(consumedFats / targetFats, 1) || 0;

  return (
    <View style={styles.container}>
      {/* Left side - Donut chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {/* Center circle - light gray */}
          <Circle
            cx={CHART_SIZE / 2}
            cy={CHART_SIZE / 2}
            r={RADIUS - STROKE_WIDTH / 2 - 2}
            fill={COLORS.center}
          />
          <G rotation="-90" origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}>
            {/* Background segments (3 separate arcs with light colors) */}
            {/* Proteins background - light blue */}
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.proteinsLight}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${SEGMENT_SIZE} ${CIRCUMFERENCE - SEGMENT_SIZE}`}
              strokeDashoffset={-proteinsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Carbs background - light green */}
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.carbsLight}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${SEGMENT_SIZE} ${CIRCUMFERENCE - SEGMENT_SIZE}`}
              strokeDashoffset={-carbsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Fats background - light yellow */}
            <Circle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.fatsLight}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${SEGMENT_SIZE} ${CIRCUMFERENCE - SEGMENT_SIZE}`}
              strokeDashoffset={-fatsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Fats segment (yellow) - animated */}
            <AnimatedCircle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.fats}
              strokeWidth={STROKE_WIDTH}
              animatedProps={animatedFatsProps}
              strokeDashoffset={-fatsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Carbs segment (green) - animated */}
            <AnimatedCircle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.carbs}
              strokeWidth={STROKE_WIDTH}
              animatedProps={animatedCarbsProps}
              strokeDashoffset={-carbsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
            {/* Proteins segment (blue) - animated */}
            <AnimatedCircle
              cx={CHART_SIZE / 2}
              cy={CHART_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.proteins}
              strokeWidth={STROKE_WIDTH}
              animatedProps={animatedProteinsProps}
              strokeDashoffset={-proteinsOffset}
              fill="transparent"
              strokeLinecap="round"
            />
          </G>
        </Svg>
        {/* Center text */}
        <View style={styles.chartCenter}>
          <Text style={styles.consumedLabel}>Consumed</Text>
          <Text style={styles.consumedValue}>{Math.round(consumedCalories)}</Text>
          <Text style={styles.consumedUnit}>Kcal</Text>
        </View>
      </View>

      {/* Right side - Macro progress bars */}
      <View style={styles.macrosContainer}>
        {/* Proteins */}
        <View style={styles.macroRow}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroEmoji}>🐟</Text>
            <Text style={styles.macroLabel}>Proteins</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${proteinsProgressBar * 100}%`,
                    backgroundColor: COLORS.proteins,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.macroValue}>
            {Math.round(consumedProteins)}g /{' '}
            <Text style={styles.macroTarget}>{targetProteins}g</Text>
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroRow}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroEmoji}>🥦</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${carbsProgressBar * 100}%`,
                    backgroundColor: COLORS.carbs,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.macroValue}>
            {Math.round(consumedCarbs)}g /{' '}
            <Text style={styles.macroTarget}>{targetCarbs}g</Text>
          </Text>
        </View>

        {/* Fats */}
        <View style={styles.macroRow}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroEmoji}>🥜</Text>
            <Text style={styles.macroLabel}>Fats</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${fatsProgressBar * 100}%`,
                    backgroundColor: COLORS.fats,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.macroValue}>
            {Math.round(consumedFats)}g /{' '}
            <Text style={styles.macroTarget}>{targetFats}g</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumedLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  consumedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  consumedUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  macrosContainer: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-between',
  },
  macroRow: {
    marginBottom: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarContainer: {
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  macroTarget: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
});

export default NutritionSummary;
