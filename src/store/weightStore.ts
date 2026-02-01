import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

interface WeightState {
  entries: WeightEntry[];
  addEntry: (weight: number, date?: string) => void;
  getEntriesForMonth: (year: number, month: number) => WeightEntry[];
  getLatestWeight: () => number | null;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // Local time
};

export const useWeightStore = create<WeightState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (weight, date) => {
        const dateKey = date || formatDate(new Date());
        set((state) => {
          // Remove existing entry for this date if exists
          const filtered = state.entries.filter((e) => e.date !== dateKey);
          return {
            entries: [...filtered, { date: dateKey, weight }].sort(
              (a, b) => a.date.localeCompare(b.date),
            ),
          };
        });
      },

      getEntriesForMonth: (year, month) => {
        const entries = get().entries;
        return entries.filter((e) => {
          const [y, m] = e.date.split('-').map(Number);
          return y === year && m === month + 1;
        });
      },

      getLatestWeight: () => {
        const entries = get().entries;
        if (entries.length === 0) return null;
        return entries[entries.length - 1].weight;
      },
    }),
    {
      name: 'weight-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
