import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface TopBarProps {
  title?: string;
  leftText?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  onRightSecondPress?: () => void;
  onBackPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightSecondIcon?: React.ReactNode;
  rightLabel?: string;
  rightSecondLabel?: string;
  backgroundColor?: string;
  showBack?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  leftText,
  onLeftPress,
  onRightPress,
  onRightSecondPress,
  onBackPress,
  leftIcon,
  rightIcon,
  rightSecondIcon,
  rightLabel,
  rightSecondLabel,
  backgroundColor = colors.transparent,
  showBack = false,
}) => {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={['top']}
    >
      <View style={styles.bar}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (leftText || leftIcon) ? (
          <View style={styles.leftButton}>
            {leftText && <Text style={styles.leftText}>{leftText}</Text>}
            {leftIcon}
          </View>
        ) : (
          <View style={styles.leftPlaceholder} />
        )}

        {title && (
          <View style={styles.center}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}

        <View style={styles.rightContainer}>
          {rightSecondIcon && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onRightSecondPress}
              activeOpacity={0.7}
            >
              {rightSecondIcon}
            </TouchableOpacity>
          )}
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
          {rightLabel && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              <Text style={styles.rightLabel}>{rightLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E000',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  leftButton: {
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  leftPlaceholder: {
    minWidth: 40,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightButton: {
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  leftText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  backText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  rightLabel: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
});

export default TopBar;
