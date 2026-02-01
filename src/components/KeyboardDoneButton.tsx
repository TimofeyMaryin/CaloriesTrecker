import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  InputAccessoryView,
  Keyboard,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

export const KEYBOARD_ACCESSORY_VIEW_ID = 'keyboard-done-button';

interface KeyboardDoneButtonProps {
  nativeID?: string;
}

const KeyboardDoneButton: React.FC<KeyboardDoneButtonProps> = ({
  nativeID = KEYBOARD_ACCESSORY_VIEW_ID,
}) => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Keyboard.dismiss()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F1F1F1',
    borderTopWidth: 1,
    borderTopColor: '#D1D1D6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
});

export default KeyboardDoneButton;
