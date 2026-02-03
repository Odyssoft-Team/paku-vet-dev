export const Colors = {
  light: {
    primary: '#4A90E2',
    secondary: '#50C878',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
    
    // Específicos de la app
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
  },
  dark: {
    primary: '#64B5F6',
    secondary: '#66BB6A',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#2C2C2C',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
    
    // Específicos de la app
    card: '#1E1E1E',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: '#424242',
    placeholder: '#616161',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
