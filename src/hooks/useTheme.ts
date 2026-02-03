import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/colors';
import { useMemo } from 'react';

/**
 * Hook personalizado para manejar el tema de la aplicación
 */
export const useTheme = () => {
  const { colorScheme, setColorScheme, toggleColorScheme } = useThemeStore();

  // Memoizar los colores para evitar recálculos innecesarios
  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const isDark = colorScheme === 'dark';

  return {
    colorScheme,
    colors,
    isDark,
    setColorScheme,
    toggleColorScheme,
  };
};
