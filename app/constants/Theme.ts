import { Platform } from 'react-native';

export const THEME = {
  primary: '#004ac6',
  primaryContainer: '#2563eb',
  secondary: '#00687a',
  background: '#faf8ff',
  surface: '#ffffff',
  surfaceContainer: '#eaedff',
  text: '#131b2e',
  textSecondary: '#434655',
  error: '#ba1a1a',
  success: '#16a34a',
  outline: '#737686',
  outlineVariant: '#c3c6d7',
};

export const Colors = {
  light: {
    text: THEME.text,
    background: THEME.background,
    tint: THEME.primary,
    icon: THEME.textSecondary,
    tabIconDefault: THEME.textSecondary,
    tabIconSelected: THEME.primary,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: THEME.primary,
    icon: '#9ba1a7',
    tabIconDefault: '#9ba1a7',
    tabIconSelected: THEME.primary,
  },
};

export const FONTS = {
  heading: 'Inter_700Bold',
  subheading: 'Inter_700Bold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_700Bold',
  fallback: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
};
