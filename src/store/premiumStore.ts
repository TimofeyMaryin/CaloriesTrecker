import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_ATTEMPTS_LIMIT } from '../services/adapty/constants';

interface PremiumState {
  // Premium status
  isPremium: boolean;
  
  // Free attempts
  freeAttemptsUsed: number;
  
  // Trial tracking
  hasActiveTrialOffer: boolean;
  
  // Onboarding completed
  hasCompletedOnboarding: boolean;
  
  // Actions
  setIsPremium: (isPremium: boolean) => void;
  setHasActiveTrialOffer: (hasOffer: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  
  // Free attempts helpers
  getRemainingFreeAttempts: () => number;
  canUseFeature: () => boolean;
  consumeFreeAttempt: () => boolean;
  resetFreeAttempts: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      freeAttemptsUsed: 0,
      hasActiveTrialOffer: false,
      hasCompletedOnboarding: false,

      setIsPremium: (isPremium) => set({ isPremium }),
      
      setHasActiveTrialOffer: (hasOffer) => set({ hasActiveTrialOffer: hasOffer }),
      
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

      getRemainingFreeAttempts: () => {
        const { freeAttemptsUsed } = get();
        return Math.max(0, FREE_ATTEMPTS_LIMIT - freeAttemptsUsed);
      },

      canUseFeature: () => {
        const { isPremium, freeAttemptsUsed } = get();
        if (isPremium) return true;
        return freeAttemptsUsed < FREE_ATTEMPTS_LIMIT;
      },

      consumeFreeAttempt: () => {
        const { isPremium, freeAttemptsUsed } = get();
        if (isPremium) return true;
        
        if (freeAttemptsUsed < FREE_ATTEMPTS_LIMIT) {
          set({ freeAttemptsUsed: freeAttemptsUsed + 1 });
          return true;
        }
        return false;
      },

      resetFreeAttempts: () => set({ freeAttemptsUsed: 0 }),
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
