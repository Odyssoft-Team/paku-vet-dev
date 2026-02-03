import { create } from 'zustand';
import { ColorScheme } from '@/constants/colors';
import { storage } from '@/utils/storage';
import { CONFIG } from '@/constants/config';

interface ThemeState {
  colorScheme: ColorScheme;
  isLoading: boolean;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  isLoading: true,

  setColorScheme: async (scheme: ColorScheme) => {
    try {
      await storage.setItem(CONFIG.STORAGE_KEYS.THEME_MODE, scheme);
      set({ colorScheme: scheme });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  toggleColorScheme: async () => {
    const current = get().colorScheme;
    const newScheme: ColorScheme = current === 'light' ? 'dark' : 'light';
    await get().setColorScheme(newScheme);
  },

  loadTheme: async () => {
    try {
      const savedTheme = await storage.getItem<ColorScheme>(
        CONFIG.STORAGE_KEYS.THEME_MODE
      );
      if (savedTheme) {
        set({ colorScheme: savedTheme });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
