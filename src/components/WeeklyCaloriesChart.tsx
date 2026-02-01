import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface DayData {
  day: string;
  calories: number;
}

interface WeeklyCaloriesChartProps {
  data: DayData[];
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 50;
const CHART_PADDING_RIGHT = 20;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 30;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_WIDTH = 24;
const BAR_RADIUS = 6;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// Animated bar component
const AnimatedBar: React.FC<{
  x: number;
  targetHeight: number;
  bottomY: number;
  hasCalories: boolean;
  index: number;
}> = ({ x, targetHeight, bottomY, hasCalories, index }) => {
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withDelay(
      index * 50,
      withTiming(targetHeight, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, [targetHeight]);

  const animatedProps = useAnimatedProps(() => ({
    y: bottomY - animatedHeight.value,
    height: Math.max(animatedHeight.value, 2),
  }));

  return (
    <AnimatedRect
      x={x - BAR_WIDTH / 2}
      width={BAR_WIDTH}
      rx={BAR_RADIUS}
      ry={BAR_RADIUS}
      fill={hasCalories ? colors.accent : '#E8E8E8'}
      animatedProps={animatedProps}
    />
  );
};

const WeeklyCaloriesChart: React.FC<WeeklyCaloriesChartProps> = ({
  data,
  weekLabel,
  onPrevWeek,
  onNextWeek,
}) => {
  const hasData = data.some((d) => d.calories > 0);
  const totalCalories = data.reduce((sum, d) => sum + d.calories, 0);
  const daysWithData = data.filter((d) => d.calories > 0).length;
  const avgCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;

  // Calculate chart dimensions
  const chartWidth = 300;
  const plotWidth = chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Calculate max value for scale (round up to nice number)
  const maxCalories = Math.max(...data.map((d) => d.calories), avgCalories, 500);
  const yMax = Math.ceil(maxCalories / 500) * 500 || 2000;

  // Y-axis labels
  const yLabels = [0, Math.round(yMax / 4), Math.round(yMax / 2), Math.round((yMax * 3) / 4), yMax];

  // Get X position for bar center
  const getBarX = (index: number) =>
    CHART_PADDING_LEFT + (index / (data.length - 1 || 1)) * plotWidth;
  
  // Get Y position and height for bar
  const getBarHeight = (value: number) => (value / yMax) * plotHeight;
  const getBarY = (value: number) =>
    CHART_PADDING_TOP + plotHeight - getBarHeight(value);

  // Average line Y position
  const avgLineY = getBarY(avgCalories);
  const bottomY = CHART_PADDING_TOP + plotHeight;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Calories</Text>
      
      <View style={styles.card}>
        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={onPrevWeek} style={styles.navButton}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <TouchableOpacity onPress={onNextWeek} style={styles.navButton}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {/* Y-axis grid lines and labels */}
            {yLabels.map((label, i) => {
              const y = getBarY(label);
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
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* X-axis labels */}
            {DAY_LABELS.map((day, i) => (
              <SvgText
                key={day}
                x={getBarX(i)}
                y={CHART_HEIGHT - 8}
                fontSize={11}
                fill="#999"
                textAnchor="middle"
              >
                {day}
              </SvgText>
            ))}

            {/* Animated bar chart */}
            {data.map((d, i) => (
              <AnimatedBar
                key={`${weekLabel}-${i}`}
                x={getBarX(i)}
                targetHeight={getBarHeight(d.calories)}
                bottomY={bottomY}
                hasCalories={d.calories > 0}
                index={i}
              />
            ))}

            {/* Average line */}
            {hasData && (
              <Line
                x1={CHART_PADDING_LEFT - 10}
                y1={avgLineY}
                x2={chartWidth - CHART_PADDING_RIGHT + 10}
                y2={avgLineY}
                stroke={colors.accent}
                strokeWidth={2}
              />
            )}
          </Svg>

          {/* Empty state overlay */}
          {!hasData && (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyText}>
                Start logging meals to{'\n'}see your stats.
              </Text>
            </View>
          )}

          {/* Average badge (positioned absolutely) */}
          {hasData && (
            <View style={[styles.avgBadge, { top: avgLineY - 12 }]}>
              <Text style={styles.avgBadgeText}>{avgCalories}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCalories} Kcal</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgCalories} Kcal</Text>
            <Text style={styles.summaryLabel}>Avg/day</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 8,
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  avgBadge: {
    position: 'absolute',
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  avgBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
});

export default WeeklyCaloriesChart;
