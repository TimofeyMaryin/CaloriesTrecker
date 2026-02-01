import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealRecord } from '../types/meal';

interface FavoriteState {
  favorites: MealRecord[];
  
  // Actions
  addFavorite: (meal: MealRecord) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (meal: MealRecord) => boolean; // returns new state
  clearAllFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (meal) => {
        const exists = get().favorites.some((f) => f.id === meal.id);
        if (!exists) {
          set((state) => ({
            favorites: [meal, ...state.favorites],
          }));
        }
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },

      toggleFavorite: (meal) => {
        const isFav = get().isFavorite(meal.id);
        if (isFav) {
          get().removeFavorite(meal.id);
          return false;
        } else {
          get().addFavorite(meal);
          return true;
        }
      },

      clearAllFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: 'favorite-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
