import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { WeightEntry } from '../store/weightStore';
import { weightFromMetric, getWeightUnit } from '../utils/unitConversion';

interface GoalProgressChartProps {
  entries: WeightEntry[];
  goalWeight: number;
  currentWeight: number;
  monthLabel: string;
  isImperial: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddWeight: () => void;
}

const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 40;
const CHART_PADDING_RIGHT = 20;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 30;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animated weight line component
const AnimatedWeightLine: React.FC<{
  x: number;
  targetY: number;
  bottomY: number;
  isUserEntry: boolean;
  index: number;
}> = ({ x, targetY, bottomY, isUserEntry, index }) => {
  const animatedY = useSharedValue(bottomY);

  useEffect(() => {
    animatedY.value = withDelay(
      index * 30,
      withTiming(targetY, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, [targetY]);

  const lineAnimatedProps = useAnimatedProps(() => ({
    y2: animatedY.value,
  }));

  const circleAnimatedProps = useAnimatedProps(() => ({
    cy: animatedY.value,
  }));

  return (
    <>
      <AnimatedLine
        x1={x}
        y1={bottomY}
        x2={x}
        stroke={isUserEntry ? '#FF6B6B' : colors.accent}
        strokeWidth={2}
        strokeLinecap="round"
        animatedProps={lineAnimatedProps}
      />
      <AnimatedCircle
        cx={x}
        r={isUserEntry ? 4 : 2}
        fill={isUserEntry ? '#FF6B6B' : colors.accent}
        animatedProps={circleAnimatedProps}
      />
    </>
  );
};

const GoalProgressChart: React.FC<GoalProgressChartProps> = ({
  entries,
  goalWeight,
  currentWeight,
  monthLabel,
  isImperial,
  onPrevMonth,
  onNextMonth,
  onAddWeight,
}) => {
  // Parse month and year from label
  const { year, monthIndex, daysInMonth } = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const parts = monthLabel.split(' ');
    const y = parseInt(parts[1], 10) || new Date().getFullYear();
    const m = monthNames.indexOf(parts[0]);
    const days = new Date(y, m + 1, 0).getDate();
    return { year: y, monthIndex: m >= 0 ? m : new Date().getMonth(), daysInMonth: days };
  }, [monthLabel]);

  // Get unique entries per day (last entry for each day)
  const userEntries = useMemo(() => {
    const dayMap = new Map<string, WeightEntry>();
    entries.forEach((entry) => {
      dayMap.set(entry.date, entry);
    });
    return dayMap;
  }, [entries]);

  // Fill all days with weight data (use last known weight from BEFORE that day)
  const allDayEntries = useMemo(() => {
    const result: WeightEntry[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort all entries by date to find weights before each day
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    
    // Find the last known weight BEFORE the start of this month
    const firstDayKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    let lastKnownWeight = currentWeight; // fallback
    
    for (const entry of sortedEntries) {
      if (entry.date < firstDayKey) {
        lastKnownWeight = entry.weight;
      } else {
        break;
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entryDate = new Date(year, monthIndex, day);
      
      // Don't show future dates (but include today)
      if (entryDate > today) break;

      if (userEntries.has(dateKey)) {
        const entry = userEntries.get(dateKey)!;
        lastKnownWeight = entry.weight;
        result.push(entry);
      } else {
        // Use last known weight for days without entries (weight as of that day)
        result.push({ date: dateKey, weight: lastKnownWeight });
      }
    }
    
    // Always have at least today with current weight
    if (result.length === 0) {
      const todayKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      result.push({ date: todayKey, weight: currentWeight });
    }
    
    return result;
  }, [entries, userEntries, daysInMonth, year, monthIndex, currentWeight]);

  // Calculate weight difference in display units
  const weightDiffKg = Math.abs(currentWeight - goalWeight);
  const weightDiff = Math.round(weightFromMetric(weightDiffKg, isImperial));
  const weightUnit = getWeightUnit(isImperial);

  // Calculate chart dimensions
  const chartWidth = 300;
  const plotWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Calculate Y range based on data
  const allWeights = [...allDayEntries.map((e) => e.weight), goalWeight, currentWeight];
  const minWeight = Math.floor(Math.min(...allWeights)) - 1;
  const maxWeight = Math.ceil(Math.max(...allWeights)) + 1;
  const yRange = maxWeight - minWeight || 1;

  // Y-axis labels (5 labels)
  const yLabels = Array.from({ length: 5 }, (_, i) => 
    Math.round(minWeight + (yRange * i) / 4)
  );

  // X-axis day markers
  const dayMarkers = [
    Math.max(1, Math.round(daysInMonth * 0.15)),
    Math.round(daysInMonth * 0.4),
    Math.round(daysInMonth * 0.65),
    Math.round(daysInMonth * 0.9),
  ];

  // Helper functions
  const getY = (value: number) =>
    CHART_PADDING_TOP + plotHeight - ((value - minWeight) / yRange) * plotHeight;

  const getX = (dayOfMonth: number) => {
    if (daysInMonth <= 1) return CHART_PADDING_LEFT + plotWidth / 2;
    return CHART_PADDING_LEFT + ((dayOfMonth - 1) / (daysInMonth - 1)) * plotWidth;
  };

  // Goal line Y position
  const goalLineY = getY(goalWeight);
  const bottomY = CHART_PADDING_TOP + plotHeight;

  // Get X-axis labels
  const getXLabels = () => {
    const parts = monthLabel.split(' ');
    const monthName = parts[0]?.slice(0, 3) || '';
    return dayMarkers.map((day) => `${day} ${monthName}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Goal progress</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🎯</Text>
          <Text style={styles.badgeText}>
            {weightDiff > 0 ? `${weightDiff} ${weightUnit} to go!` : 'Goal reached!'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <View style={styles.navLeft}>
            <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={onAddWeight}>
            <Text style={styles.addButtonText}>Add weight</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {/* Y-axis grid lines and labels */}
            {yLabels.map((label, i) => {
              const y = getY(label);
              return (
                <React.Fragment key={i}>
                  <Line
                    x1={CHART_PADDING_LEFT}
                    y1={y}
                    x2={chartWidth - CHART_PADDING_RIGHT}
                    y2={y}
                    stroke="#E8E8E8"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <SvgText
                    x={CHART_PADDING_LEFT - 8}
                    y={y + 4}
                    fontSize={11}
                    fill="#999"
                    textAnchor="end"
                  >
                    {Math.round(weightFromMetric(label, isImperial))}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* X-axis labels */}
            {dayMarkers.map((day, i) => (
              <SvgText
                key={i}
                x={getX(day)}
                y={CHART_HEIGHT - 8}
                fontSize={10}
                fill="#999"
                textAnchor="middle"
              >
                {getXLabels()[i]}
              </SvgText>
            ))}

            {/* Goal line (green) */}
            <Line
              x1={CHART_PADDING_LEFT}
              y1={goalLineY}
              x2={chartWidth - CHART_PADDING_RIGHT}
              y2={goalLineY}
              stroke={colors.accent}
              strokeWidth={2}
            />

            {/* Animated weight lines */}
            {allDayEntries.map((entry, i) => {
              const day = parseInt(entry.date.split('-')[2], 10);
              const x = getX(day);
              const weightY = getY(entry.weight);
              const isUserEntry = userEntries.has(entry.date);
              
              return (
                <AnimatedWeightLine
                  key={`${monthLabel}-${entry.date}`}
                  x={x}
                  targetY={weightY}
                  bottomY={bottomY}
                  isUserEntry={isUserEntry}
                  index={i}
                />
              );
            })}
          </Svg>

          {/* Goal badge (positioned absolutely) */}
          <View style={[styles.goalLabelBadge, { top: goalLineY - 12 }]}>
            <Text style={styles.goalLabelText}>{Math.round(weightFromMetric(goalWeight, isImperial))}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 8,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  goalLabelBadge: {
    position: 'absolute',
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});

export default GoalProgressChart;
