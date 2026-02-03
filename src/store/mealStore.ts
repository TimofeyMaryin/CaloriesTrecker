import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MealRecord,
  MealTotals,
  Ingredient,
  calculateTotals,
  generateMealId,
} from '../types/meal';

interface MealState {
  meals: MealRecord[];
  
  // Actions
  addMeal: (
    title: string,
    health: number,
    ingredients: Ingredient[],
    imageUri?: string,
  ) => MealRecord;
  
  updateMeal: (
    id: string,
    updates: Partial<Pick<MealRecord, 'title' | 'health' | 'ingredients'>>,
  ) => void;
  
  removeMeal: (id: string) => void;
  
  getMealsByDate: (date: string) => MealRecord[];
  
  getDailyTotals: (date: string) => MealTotals;
  
  clearAllMeals: () => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      meals: [],

      addMeal: (title, health, ingredients, imageUri) => {
        const now = new Date();
        const meal: MealRecord = {
          id: generateMealId(),
          title,
          health,
          ingredients,
          totals: calculateTotals(ingredients),
          imageUri,
          createdAt: now.toISOString(),
          date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`, // YYYY-MM-DD (local time)
        };

        set((state) => ({
          meals: [meal, ...state.meals],
        }));

        return meal;
      },

      updateMeal: (id, updates) => {
        set((state) => ({
          meals: state.meals.map((meal) => {
            if (meal.id !== id) return meal;
            
            const updatedMeal = {
              ...meal,
              ...updates,
            };
            
            // Recalculate totals if ingredients changed
            if (updates.ingredients) {
              updatedMeal.totals = calculateTotals(updates.ingredients);
            }
            
            return updatedMeal;
          }),
        }));
      },

      removeMeal: (id) => {
        set((state) => ({
          meals: state.meals.filter((m) => m.id !== id),
        }));
      },

      getMealsByDate: (date) => {
        return get().meals.filter((m) => m.date === date);
      },

      getDailyTotals: (date) => {
        const meals = get().getMealsByDate(date);
        return meals.reduce(
          (acc, meal) => ({
            totalCalories: acc.totalCalories + meal.totals.totalCalories,
            totalProteins: acc.totalProteins + meal.totals.totalProteins,
            totalCarbs: acc.totalCarbs + meal.totals.totalCarbs,
            totalFats: acc.totalFats + meal.totals.totalFats,
            totalWeight: acc.totalWeight + meal.totals.totalWeight,
          }),
          {
            totalCalories: 0,
            totalProteins: 0,
            totalCarbs: 0,
            totalFats: 0,
            totalWeight: 0,
          },
        );
      },

      clearAllMeals: () => {
        set({ meals: [] });
      },
    }),
    {
      name: 'meal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
