import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { colors } from '../theme/colors';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  selectedIndex,
  onChange,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    segmentWidth.current = width / segments.length;
    // Set initial position without animation
    translateX.setValue(selectedIndex * segmentWidth.current);
  };

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth.current,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [selectedIndex, translateX]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.slider,
          {
            width: `${100 / segments.length}%`,
            transform: [{ translateX }],
          },
        ]}
      />
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          style={styles.segment}
          activeOpacity={0.7}
          onPress={() => onChange(index)}
        >
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
  },
});

export default SegmentedControl;
