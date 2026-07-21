import { useColorScheme } from 'react-native';
import { colors, type ThemeColors } from './tokens';

export * from './tokens';

/** Resolve the active colour set from the system light/dark setting. */
export function useTheme(): { scheme: 'light' | 'dark'; c: ThemeColors } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, c: colors[scheme] };
}
