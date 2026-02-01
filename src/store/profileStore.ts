import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  NutritionTargets,
  calculateNutritionTargets,
  DEFAULT_TARGETS,
} from '../utils/nutritionCalculator';

interface ProfileState {
  // Profile data
  weight: number;
  height: number;
  age: number;
  goalWeight: number;
  activityLevel: 'minimum' | 'light' | 'moderate' | 'high';
  
  // Computed targets
  targets: NutritionTargets;
  
  // Actions
  setWeight: (weight: number) => void;
  setHeight: (height: number) => void;
  setAge: (age: number) => void;
  setGoalWeight: (goalWeight: number) => void;
  setActivityLevel: (level: 'minimum' | 'light' | 'moderate' | 'high') => void;
  getProfile: () => UserProfile;
  recalculateTargets: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      // Default values
      weight: 70,
      height: 170,
      age: 30,
      goalWeight: 70,
      activityLevel: 'light',
      targets: DEFAULT_TARGETS,

      setWeight: (weight) => {
        set({ weight });
        get().recalculateTargets();
      },

      setHeight: (height) => {
        set({ height });
        get().recalculateTargets();
      },

      setAge: (age) => {
        set({ age });
        get().recalculateTargets();
      },

      setGoalWeight: (goalWeight) => {
        set({ goalWeight });
        get().recalculateTargets();
      },

      setActivityLevel: (activityLevel) => {
        set({ activityLevel });
        get().recalculateTargets();
      },

      getProfile: () => {
        const state = get();
        return {
          weight: state.weight,
          height: state.height,
          age: state.age,
          goalWeight: state.goalWeight,
          activityLevel: state.activityLevel,
        };
      },

      recalculateTargets: () => {
        const profile = get().getProfile();
        const targets = calculateNutritionTargets(profile);
        set({ targets });
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Recalculate targets after rehydration
        if (state) {
          state.recalculateTargets();
        }
      },
    },
  ),
);
