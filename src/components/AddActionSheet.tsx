import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const SPACER_HEIGHT = Dimensions.get('window').height * 0.2;

export type AddActionId = 'scan' | 'voice' | 'favorites' | 'gallery';

export interface AddActionItem {
  id: AddActionId;
  title: string;
  description: string;
  icon: number;
}

const ADD_ACTIONS: AddActionItem[] = [
  {
    id: 'scan',
    title: 'Scan with AI',
    description: 'Snap your meal, get calories',
    icon: require('../assets/icons/ic_scan_with_ai.png'),
  },
  {
    id: 'voice',
    title: 'Voice/ AI Log',
    description: 'Describe your meal or use voice to add it',
    icon: require('../assets/icons/ic_voice.png'),
  },
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Quick Add from saved',
    icon: require('../assets/icons/ic_favorite.png'),
  },
  {
    id: 'gallery',
    title: 'Gallery',
    description: 'Upload meal photos from your gallery',
    icon: require('../assets/icons/ic_gallery.png'),
  },
];

interface AddActionSheetProps {
  onSelect?: (id: AddActionId) => void;
}

const AddActionSheet: React.FC<AddActionSheetProps> = ({ onSelect }) => {
  const handlePress = (id: AddActionId) => {
    onSelect?.(id);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {ADD_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.button}
            onPress={() => handlePress(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Image
                source={item.icon}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    gap: 12,
  },
  spacer: {
    height: SPACER_HEIGHT,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    width: 22,
    height: 22,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default AddActionSheet;
