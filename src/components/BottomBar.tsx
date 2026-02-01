import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface BottomBarProps {
  onLeftPress?: () => void;
  onCenterPress?: () => void;
  onRightPress?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  centerIcon?: React.ReactNode;
  activeTab?: 'left' | 'right';
}

const BottomBar: React.FC<BottomBarProps> = ({
  onLeftPress,
  onCenterPress,
  onRightPress,
  leftLabel,
  rightLabel,
  leftIcon,
  rightIcon,
  centerIcon,
  activeTab,
}) => {
  const isLeftActive = activeTab === 'left';
  const isRightActive = activeTab === 'right';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.bar}>
        <TouchableOpacity
          style={[styles.button, styles.leftButton]}
          onPress={onLeftPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.buttonContainer,
              !isLeftActive && styles.inactiveContainer,
            ]}
          >
            {leftIcon}
            {leftLabel && <Text style={styles.label}>{leftLabel}</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={onCenterPress}
          activeOpacity={0.7}
        >
          {centerIcon || <View style={styles.centerIconPlaceholder} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rightButton]}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.buttonContainer,
              !isRightActive && styles.inactiveContainer,
            ]}
          >
            {rightIcon}
            {rightLabel && <Text style={styles.label}>{rightLabel}</Text>}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 70,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  button: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    minWidth: 80,
  },
  leftButton: {
    alignItems: 'center',
  },
  rightButton: {
    alignItems: 'center',
  },
  buttonContainer: {
    width: 80,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#DCDEDB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  inactiveContainer: {
    backgroundColor: 'transparent',
  },
  centerButton: {
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
    width: 73,
    height: 73,
    borderRadius: 36.5,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  label: {
    fontSize: 12,
    color: '#222222',
    fontWeight: '500',
    marginTop: 2,
  },
  centerIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    opacity: 0.9,
  },
});

export default BottomBar;
