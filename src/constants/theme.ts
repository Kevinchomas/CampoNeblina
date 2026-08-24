// @ts-ignore
import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: "#5CA838", // Verde Bambú
    primaryDark: "#234919", // Verde Botella Oscuro
    background: "#FFFFFF",
    backgroundElement: "#F5F8F4", // Gris Claro / Tarjetas
    backgroundSelected: "#E5EAE2",
    text: "#1A1D1A", // Negro
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    notification: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
  dark: {
    primary: "#5CA838", // Verde Bambú
    primaryDark: "#234919", // Verde Botella Oscuro
    background: "#1A1D1A", // Negro
    backgroundElement: "#262926", // Gris Oscuro / Tarjetas
    backgroundSelected: "#323832",
    text: "#FFFFFF", // Blanco
    textSecondary: "#9CA3AF",
    border: "#374151",
    notification: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const theme = {
  colors: Colors,
  spacing: {
    xs: Spacing.one,
    sm: Spacing.two,
    md: Spacing.three,
    lg: Spacing.four,
    xl: Spacing.five,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
};

export type Theme = typeof theme;

