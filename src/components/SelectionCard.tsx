import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface SelectionCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  emoji,
  title,
  subtitle,
  selected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Emoji circle */}
      <View style={[styles.emojiCircle, selected && styles.emojiCircleSelected]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Radio button */}
      <View style={styles.radioOuter}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: colors.accent,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4F5D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiCircleSelected: {
    backgroundColor: colors.accent,
  },
  emoji: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#BEC0BD',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});

export default SelectionCard;
