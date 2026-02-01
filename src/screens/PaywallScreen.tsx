import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { adapty, createPaywallView } from 'react-native-adapty';
import { colors } from '../theme/colors';
import { PLACEMENT_IDS, ACCESS_LEVEL_PREMIUM } from '../services/adapty/constants';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePremiumStore } from '../store/premiumStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PaywallRouteProp = RouteProp<RootStackParamList, 'Paywall'>;

const PaywallScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaywallRouteProp>();
  const placementId = route.params?.placementId || PLACEMENT_IDS.PAYWALL_MAIN;
  
  const [isLoading, setIsLoading] = useState(true);
  const { setIsPremium } = usePremiumStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const showPaywall = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get paywall from Adapty
      const paywall = await adapty.getPaywall(placementId);
      console.log('[Paywall] Loaded paywall:', paywall.placementId);
      
      // Create the paywall view
      const view = await createPaywallView(paywall);
      
      // Set event handlers
      unsubscribeRef.current = view.setEventHandlers({
        onCloseButtonPress: () => {
          console.log('[Paywall] Close button pressed');
          navigation.goBack();
          return true; // Close the paywall
        },
        onPurchaseCompleted: (purchaseResult) => {
          console.log('[Paywall] Purchase completed:', purchaseResult.type);
          if (purchaseResult.type === 'success' && purchaseResult.profile) {
            const isPremium = purchaseResult.profile.accessLevels?.[ACCESS_LEVEL_PREMIUM]?.isActive ?? false;
            setIsPremium(isPremium);
          }
          // Close if not cancelled
          if (purchaseResult.type !== 'user_cancelled') {
            navigation.goBack();
            return true;
          }
          return false;
        },
        onPurchaseFailed: (error) => {
          console.log('[Paywall] Purchase failed:', error);
          return false; // Keep paywall open
        },
        onRestoreCompleted: (profile) => {
          console.log('[Paywall] Restore completed');
          const isPremium = profile.accessLevels?.[ACCESS_LEVEL_PREMIUM]?.isActive ?? false;
          setIsPremium(isPremium);
          if (isPremium) {
            navigation.goBack();
            return true;
          }
          return false;
        },
        onRestoreFailed: (error) => {
          console.log('[Paywall] Restore failed:', error);
          return false;
        },
        onRenderingFailed: (error) => {
          console.log('[Paywall] Rendering failed:', error);
          navigation.goBack();
          return true;
        },
        onAndroidSystemBack: () => {
          navigation.goBack();
          return true;
        },
      });
      
      // Present the paywall
      await view.present({ iosPresentationStyle: 'full_screen' });
      setIsLoading(false);
      
    } catch (error) {
      console.error('[Paywall] Error showing paywall:', error);
      setIsLoading(false);
      navigation.goBack();
    }
  }, [placementId, navigation, setIsPremium]);

  useEffect(() => {
    showPaywall();
    
    return () => {
      // Cleanup event handlers
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [showPaywall]);

  // Show loading while paywall is being prepared
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // This view is mostly hidden behind the native paywall
  return (
    <View style={styles.container} />
  );
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

export default PaywallScreen;
