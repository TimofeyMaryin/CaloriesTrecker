import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { MealRecord } from '../types/meal';

interface MealCardProps {
  meal: MealRecord;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const MealCard: React.FC<MealCardProps> = ({ meal, onPress, index = 0 }) => {
  const hasAnimated = useRef(false);
  const opacity = useSharedValue(1); // Start visible
  const translateY = useSharedValue(0); // Start in place

  useEffect(() => {
    // Only animate on first mount, not on re-renders
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      opacity.value = 0;
      translateY.value = 20;
      const delay = index * 50; // Stagger animation
      opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const time = new Date(meal.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      {meal.imageUri ? (
        <Image
          source={{ uri: meal.imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Image
            source={require('../assets/icons/ic_add_dish.png')}
            style={styles.placeholderIcon}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {meal.title}
        </Text>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.macrosRow}>
          <Text style={styles.macroText}>
            🐟 {Math.round(meal.totals.totalProteins)}g
          </Text>
          <Text style={styles.macroText}>
            🥦 {Math.round(meal.totals.totalCarbs)}g
          </Text>
          <Text style={styles.macroText}>
            🥜 {Math.round(meal.totals.totalFats)}g
          </Text>
        </View>
      </View>

      {/* Calories */}
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesValue}>
          {Math.round(meal.totals.totalCalories)}
        </Text>
        <Text style={styles.caloriesUnit}>kcal</Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 24,
    height: 24,
    tintColor: '#A0A0A0',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  caloriesContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  caloriesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  caloriesUnit: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default MealCard;
