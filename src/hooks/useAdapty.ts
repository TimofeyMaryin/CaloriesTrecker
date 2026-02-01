import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AdaptyPaywall, AdaptyPaywallProduct } from 'react-native-adapty';
import AdaptyManager from '../services/adapty/AdaptyManager';
import { usePremiumStore } from '../store/premiumStore';

interface UseAdaptyReturn {
  // State
  isPremium: boolean;
  isLoading: boolean;
  remainingFreeAttempts: number;
  canUseFeature: boolean;
  
  // Actions
  loadPaywall: (placementId: string) => Promise<{
    paywall: AdaptyPaywall | null;
    products: AdaptyPaywallProduct[];
  }>;
  purchase: (product: AdaptyPaywallProduct) => Promise<boolean>;
  restore: () => Promise<boolean>;
  consumeAttempt: () => boolean;
  refreshPremiumStatus: () => Promise<void>;
}

export const useAdapty = (): UseAdaptyReturn => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isPremium,
    getRemainingFreeAttempts,
    canUseFeature,
    consumeFreeAttempt,
    setIsPremium,
  } = usePremiumStore();

  const loadPaywall = useCallback(async (placementId: string) => {
    setIsLoading(true);
    try {
      const paywall = await AdaptyManager.getPaywall(placementId);
      if (!paywall) {
        return { paywall: null, products: [] };
      }
      
      const products = await AdaptyManager.getPaywallProducts(paywall);
      await AdaptyManager.logPaywallShown(paywall);
      
      return { paywall, products };
    } catch (error) {
      console.error('Load paywall error:', error);
      return { paywall: null, products: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = useCallback(async (product: AdaptyPaywallProduct): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await AdaptyManager.makePurchase(product);
      
      if (result.cancelled) {
        return false;
      }
      
      if (result.error) {
        Alert.alert('Purchase Error', 'Unable to complete purchase. Please try again.');
        return false;
      }
      
      if (result.success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await AdaptyManager.restorePurchases();
      
      if (result.error) {
        Alert.alert('Restore Error', 'Unable to restore purchases. Please try again.');
        return false;
      }
      
      if (result.isPremium) {
        Alert.alert('Success', 'Your purchases have been restored!');
        return true;
      } else {
        Alert.alert('No Purchases', 'No previous purchases found.');
        return false;
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const consumeAttempt = useCallback((): boolean => {
    return consumeFreeAttempt();
  }, [consumeFreeAttempt]);

  const refreshPremiumStatus = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AdaptyManager.refreshProfile();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isPremium,
    isLoading,
    remainingFreeAttempts: getRemainingFreeAttempts(),
    canUseFeature: canUseFeature(),
    loadPaywall,
    purchase,
    restore,
    consumeAttempt,
    refreshPremiumStatus,
  };
};

export default useAdapty;
