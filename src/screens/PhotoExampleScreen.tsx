import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import TopBar from '../components/TopBar';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSettingsStore } from '../store/settingsStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PhotoExampleScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const setDontShowPhotoExample = useSettingsStore((state) => state.setDontShowPhotoExample);

  // Get device locale
  const getLocale = () => {
    const locale =
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'en-US';
    return locale;
  };

  const handleContinue = () => {
    // Save preference if checked
    if (dontShowAgain) {
      setDontShowPhotoExample(true);
    }
    // Navigate to camera (replace to avoid stacking)
    navigation.replace('Scan', { mode: 'camera', locale: getLocale() });
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Photo Example"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        backgroundColor={colors.background}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          {/* Images */}
          <View style={styles.imagesContainer}>
            <Image
              source={require('../assets/advice_correct.png')}
              style={styles.exampleImage}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/advice_incorrect.png')}
              style={styles.exampleImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setDontShowAgain(!dontShowAgain)}
            >
              <View
                style={[
                  styles.checkbox,
                  dontShowAgain && styles.checkboxChecked,
                ]}
              >
                {dontShowAgain && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Don't show this screen again
              </Text>
            </TouchableOpacity>

            {/* Continue button */}
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.8}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  imagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  exampleImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 12,
  },
  bottomSection: {
    paddingTop: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default PhotoExampleScreen;
