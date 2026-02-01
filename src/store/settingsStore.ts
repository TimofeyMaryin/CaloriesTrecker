import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  savePhotoEnabled: boolean;
  setSavePhotoEnabled: (enabled: boolean) => void;
  dontShowPhotoExample: boolean;
  setDontShowPhotoExample: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      savePhotoEnabled: false,
      setSavePhotoEnabled: (enabled) => set({ savePhotoEnabled: enabled }),
      dontShowPhotoExample: false,
      setDontShowPhotoExample: (enabled) => set({ dontShowPhotoExample: enabled }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
