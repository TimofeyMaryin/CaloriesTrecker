import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 10; // Width per unit

interface HorizontalRulerPickerProps {
  min: number;
  max: number;
  initialValue: number;
  unit: string;
  step?: number;
  onValueChange: (value: number) => void;
}

const HorizontalRulerPicker: React.FC<HorizontalRulerPickerProps> = ({
  min,
  max,
  initialValue,
  unit,
  step = 1,
  onValueChange,
}) => {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const lastHapticValue = useRef(initialValue);
  const horizontalPadding = SCREEN_WIDTH / 2 - 20;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const updateDisplayValue = useCallback(
    (x: number) => {
      const newValue = Math.round(x / ITEM_WIDTH) * step + min;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      
      // Update display value
      setDisplayValue(clampedValue);
      
      // Trigger haptic only when value changes
      if (clampedValue !== lastHapticValue.current) {
        lastHapticValue.current = clampedValue;
        triggerHaptic();
      }
    },
    [min, max, step, triggerHaptic],
  );

  const finalizeValue = useCallback(
    (x: number) => {
      const newValue = Math.round(x / ITEM_WIDTH) * step + min;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onValueChange(clampedValue);
    },
    [min, max, step, onValueChange],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      runOnJS(updateDisplayValue)(event.contentOffset.x);
    },
    onEndDrag: (event) => {
      runOnJS(finalizeValue)(event.contentOffset.x);
    },
    onMomentumEnd: (event) => {
      runOnJS(finalizeValue)(event.contentOffset.x);
    },
  });

  // Generate ruler marks
  const renderRulerMarks = useCallback(() => {
    const marks = [];
    for (let i = min; i <= max; i += step) {
      const isMajor = i % 10 === 0;
      const isMinor = i % 5 === 0 && !isMajor;

      marks.push(
        <View key={i} style={styles.markContainer}>
          <View
            style={[
              styles.mark,
              isMajor && styles.majorMark,
              isMinor && styles.minorMark,
              !isMajor && !isMinor && styles.smallMark,
            ]}
          />
        </View>,
      );
    }
    return marks;
  }, [min, max, step]);

  // Generate labels row
  const renderLabelsRow = useCallback(() => {
    const labels = [];
    for (let i = min; i <= max; i += 10) {
      // Calculate how many steps between labels
      const stepsPerLabel = 10 / step;
      
      labels.push(
        <View key={i} style={[styles.labelContainer, { width: ITEM_WIDTH * stepsPerLabel }]}>
          <Text style={styles.markLabel}>{i}</Text>
        </View>,
      );
    }
    return labels;
  }, [min, max, step]);

  // Initial scroll position
  const initialScrollX = ((initialValue - min) / step) * ITEM_WIDTH;

  return (
    <View style={styles.container}>
      {/* Value display */}
      <Text style={styles.valueText}>
        {displayValue} <Text style={styles.unitText}>{unit}</Text>
      </Text>

      {/* Ruler */}
      <View style={styles.rulerContainer}>
        {/* Center indicator */}
        <View style={styles.centerIndicator} />

        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentOffset={{ x: initialScrollX, y: 0 }}
        >
          <View>
            {/* Marks row */}
            <View style={styles.marksRow}>
              {renderRulerMarks()}
            </View>
            {/* Labels row */}
            <View style={styles.labelsRow}>
              {renderLabelsRow()}
            </View>
          </View>
        </Animated.ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 24,
  },
  unitText: {
    fontSize: 32,
    fontWeight: '400',
  },
  rulerContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  centerIndicator: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 40,
    backgroundColor: colors.accent,
    zIndex: 10,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
  },
  markContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 40,
  },
  mark: {
    width: 1,
    backgroundColor: '#C0C0C0',
  },
  majorMark: {
    height: 32,
    backgroundColor: '#A0A0A0',
  },
  minorMark: {
    height: 20,
  },
  smallMark: {
    height: 12,
  },
  labelsRow: {
    flexDirection: 'row',
    height: 24,
    marginTop: 4,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});

export default HorizontalRulerPicker;
