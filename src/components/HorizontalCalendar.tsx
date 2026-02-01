import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_RANGE = 30; // days before and after today
const ITEM_WIDTH = 52;
const ITEM_MARGIN = 6;

interface HorizontalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const generateDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const dates = generateDates();

  useEffect(() => {
    // Scroll to selected date on mount
    const selectedIndex = dates.findIndex((d) => isSameDay(d, selectedDate));
    if (selectedIndex !== -1 && scrollViewRef.current) {
      const offset = selectedIndex * (ITEM_WIDTH + ITEM_MARGIN) - 100;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
      }, 100);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dayName = DAY_NAMES[date.getDay()];
          const dayNumber = date.getDate();

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => onSelectDate(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  isToday && styles.dayNameToday,
                  isSelected && styles.dayNameSelected,
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dayItem: {
    width: ITEM_WIDTH,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginRight: ITEM_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayItemSelected: {
    backgroundColor: colors.accent,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNameToday: {
    fontWeight: '700',
  },
  dayNameSelected: {
    color: colors.white,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  dayNumberSelected: {
    color: colors.white,
  },
});

export default HorizontalCalendar;
