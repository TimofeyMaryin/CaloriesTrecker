import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { showOnboarding } from '../services/adapty';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OnboardingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const hasStarted = useRef(false);

  const handleComplete = useCallback(() => {
    // Navigate to main screen after onboarding
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }, [navigation]);

  useEffect(() => {
    // Prevent double execution
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    // Show onboarding - native UI will appear on top
    showOnboarding(handleComplete);
  }, [handleComplete]);

  // Empty view - native onboarding/paywall will show on top
  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingScreen;
